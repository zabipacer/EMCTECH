import jsPDF from "jspdf";

const PDF_CONFIG = {
  page: { orientation: 'portrait', unit: 'mm', format: 'a4', margin: 15 },
  colors: {
    primary: [0, 26, 77],
    accent: [211, 47, 47],
    lightGray: [232, 232, 232],
    background: [245, 245, 245],
    blueHighlight: [204, 229, 255]
  },
  fonts: {
    headerSize: 14,
    titleSize: 13,
    bodySize: 10,
    tableHeaderSize: 9,
    tableBodySize: 9,
    minTableBodySize: 8
  },
  table: {
    colPercents: [4, 18, 28, 18, 6, 8, 10, 8],
    defaultRowPadding: 3,
    defaultMinRowHeight: 10,
    cellPadding: 2
  },
  images: { maxDimensionPx: 1200, maxDimensionMm: 120, quality: 0.85, timeout: 15000 },
  layout: { reservedBottom: 40 }
};

class PDFGenerationError extends Error { constructor(message, originalError = null) { super(message); this.name = 'PDFGenerationError'; this.originalError = originalError; } }

/* ---------- Added: Offscreen canvas measurer with small cache ----------
   - TextMeasurer.measureTextLines(ctx, text, fontFamily, fontSizePt, maxWidthMm)
   - TextMeasurer.fitFontSizeToBox(text, fontFamily, preferredSizePt, minSizePt, boxWidthMm, boxHeightMm, lineHeightMultiplier)
   - Uses same line height formula as PDF generator to remain consistent.
   - Small cache keyed by text+font+size+maxWidth to avoid repeated measurement.
   - The EMCProposalPDF creates one instance and uses its results to compute lines/fontSize
*/
class TextMeasurer {
  constructor(lineHeightForFontSizeFn) {
    this.lineHeightForFontSize = lineHeightForFontSizeFn; // expects mm per line
    this.cache = new Map();
    // conversions: 1 mm = 3.779527559 px (approx at 96dpi). used for canvas measurement.
    this.MM_TO_PX = 3.779527559055; // multiply mm -> px
    this.PT_TO_PX = 96/72; // multiply pt -> px
    this.canvas = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    if (this.ctx) this.ctx.textBaseline = 'top';
  }

  _cacheKey(text, fontFamily, fontSizePt, maxWidthMm) {
    return `${fontFamily}||${fontSizePt}pt||${maxWidthMm}mm||${String(text)}`;
  }

  measureTextLines(text, fontFamily, fontSizePt, maxWidthMm) {
    // return array of wrapped lines (using canvas measurements); convert widths via MM_TO_PX
    if (!this.ctx) {
      // fallback: naive split by words without precise measurement
      const approxCharsPerLine = Math.max(10, Math.floor(maxWidthMm / (fontSizePt * 0.35)));
      const words = String(text || '').split(/\s+/);
      const lines = [];
      let cur = '';
      for (let w of words) {
        if ((cur + ' ' + w).trim().length <= approxCharsPerLine) cur = (cur + ' ' + w).trim();
        else { if (cur) lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      return lines;
    }

    const key = this._cacheKey(text, fontFamily, fontSizePt, maxWidthMm);
    if (this.cache.has(key)) return this.cache.get(key);

    const fontPx = fontSizePt * this.PT_TO_PX;
    this.ctx.font = `${fontPx}px ${fontFamily}`;
    const maxWidthPx = Math.max(1, maxWidthMm * this.MM_TO_PX);

    const words = String(text || '').split(/\s+/);
    const lines = [];
    let cur = '';

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const test = cur ? (cur + ' ' + w) : w;
      const measured = this.ctx.measureText(test).width;
      if (measured <= maxWidthPx || cur === '') {
        cur = test;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);

    // as a last resort, if a single word exceeds width, break it char-wise
    for (let i = 0; i < lines.length; i++) {
      const measured = this.ctx.measureText(lines[i]).width;
      if (measured > maxWidthPx) {
        const chars = lines[i].split('');
        let buff = '';
        const rebuilt = [];
        for (let ch of chars) {
          const test = buff + ch;
          if (this.ctx.measureText(test).width <= maxWidthPx) buff = test;
          else { if (buff) rebuilt.push(buff); buff = ch; }
        }
        if (buff) rebuilt.push(buff);
        lines.splice(i, 1, ...rebuilt);
        i += rebuilt.length - 1;
      }
    }

    this.cache.set(key, lines);
    return lines;
  }

  fitFontSizeToBox(text, fontFamily, preferredSizePt, minSizePt, boxWidthMm, boxHeightMm, lineHeightMultiplier = 1) {
    // try decreasing font sizes from preferred to min (step 0.5) until text fits box
    // returns { fontSize: pt, lines: [..] }
    const step = 0.5;
    for (let fs = preferredSizePt; fs >= minSizePt; fs = Math.round((fs - step) * 100) / 100) {
      const lines = this.measureTextLines(text, fontFamily, fs, boxWidthMm);
      const lineHeightMm = this.lineHeightForFontSize(fs) * lineHeightMultiplier;
      const totalHeight = lines.length * lineHeightMm;
      if (totalHeight <= boxHeightMm) {
        return { fontSize: fs, lines, totalHeight, lineHeightMm };
      }
    }
    // if nothing fits, return min size measurement (may overflow)
    const lines = this.measureTextLines(text, fontFamily, minSizePt, boxWidthMm);
    const lineHeightMm = this.lineHeightForFontSize(minSizePt) * lineHeightMultiplier;
    return { fontSize: minSizePt, lines, totalHeight: lines.length * lineHeightMm, lineHeightMm };
  }
}
/* ---------- end added measurer ---------- */

class ImageLoader {
  constructor(config = PDF_CONFIG.images) { this.config = config; this.cache = new Map(); }

  async loadImage(urlOrFile, maxPx = this.config.maxDimensionPx) {
    if (!urlOrFile) return null;
    const cacheKey = `${typeof urlOrFile === 'string' ? urlOrFile : 'file_' + (urlOrFile.name||'blob')}_${maxPx}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      if (typeof urlOrFile === 'string' && urlOrFile.startsWith('data:image')) {
        const mime = (urlOrFile.match(/^data:(image\/[a-zA-Z]+);/) || [])[1] || 'image/jpeg';
        const meta = await this.processImageFromDataUrl(urlOrFile, maxPx, mime);
        this.cache.set(cacheKey, meta);
        return meta;
      }

      if (typeof urlOrFile === 'string') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        let resp;
        try { resp = await fetch(urlOrFile, { mode: 'cors', credentials: 'omit', signal: controller.signal }); }
        finally { clearTimeout(timeoutId); }
        if (!resp || !resp.ok) throw new Error(`HTTP ${resp ? resp.status : 'no response'}`);
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        try { const meta = await this.processImage(objectUrl, maxPx, blob.type); this.cache.set(cacheKey, meta); return meta; }
        finally { URL.revokeObjectURL(objectUrl); }
      }

      if (urlOrFile instanceof File || urlOrFile instanceof Blob) {
        const objectUrl = URL.createObjectURL(urlOrFile);
        try { const meta = await this.processImage(objectUrl, maxPx, urlOrFile.type || 'image/jpeg'); this.cache.set(cacheKey, meta); return meta; }
        finally { URL.revokeObjectURL(objectUrl); }
      }

      return null;
    } catch (err) {
      console.warn('Image load error, returning null', err);
      return null;
    }
  }

  async processImageFromDataUrl(dataUrl, maxPx, fallbackMime) {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.crossOrigin = 'Anonymous';
      const t = setTimeout(() => { img.onload = img.onerror = null; reject(new Error('Image load timeout')); }, this.config.timeout);
      img.onload = async () => { clearTimeout(t); try { const res = await this._drawToCanvasAndExport(img, maxPx, fallbackMime); resolve(res); } catch (e) { reject(e); } };
      img.onerror = (e) => { clearTimeout(t); reject(new Error('Image tag failed: ' + e)); };
      img.src = dataUrl;
    });
  }

  processImage(src, maxPx, fallbackMime) {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.crossOrigin = 'Anonymous';
      const timeout = setTimeout(() => { img.onload = img.onerror = null; reject(new Error('Image load timeout')); }, this.config.timeout);
      img.onload = async () => { clearTimeout(timeout); try { const res = await this._drawToCanvasAndExport(img, maxPx, fallbackMime); resolve(res); } catch (err) { reject(err); } };
      img.onerror = (e) => { clearTimeout(timeout); reject(new Error('Image tag failed: ' + e)); };
      img.src = src;
    });
  }

  async _drawToCanvasAndExport(img, maxPx, fallbackMime) {
    const srcW = img.naturalWidth || img.width; const srcH = img.naturalHeight || img.height;
    const ratio = Math.min(1, maxPx / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * ratio)); const h = Math.max(1, Math.round(srcH * ratio));
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,w,h); ctx.drawImage(img, 0, 0, w, h);
    const mime = (fallbackMime && fallbackMime.includes('png')) || String(img.src).toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, this.config.quality);
    return { dataUrl, width: w, height: h, mime };
  }

  clearCache() { this.cache.clear(); }
}

class PDFLayoutManager {
  constructor(doc, config = PDF_CONFIG) { this.doc = doc; this.config = config; this.currentY = config.page.margin; this.pageHeight = doc.internal.pageSize.getHeight(); this.pageWidth = doc.internal.pageSize.getWidth(); }
  addPage() { this.doc.addPage(); this.currentY = this.config.page.margin; this.pageHeight = this.doc.internal.pageSize.getHeight(); this.pageWidth = this.doc.internal.pageSize.getWidth(); return this; }
  moveDown(amount) { this.currentY += amount; return this; }
  setY(y) { this.currentY = y; return this; }
  getY() { return this.currentY; }
  ensureSpace(minSpace = 20) { if (this.currentY + minSpace > this.pageHeight - this.config.page.margin) { this.addPage(); return true; } return false; }
  drawLine(x1,y1,x2,y2,color=[0,0,0],width=0.2){ this.doc.setDrawColor(...color); this.doc.setLineWidth(width); this.doc.line(x1,y1,x2,y2); return this; }
  drawRect(x,y,w,h,fillColor=null){ if (fillColor){ this.doc.setFillColor(...fillColor); this.doc.rect(x,y,w,h,'F'); } else this.doc.rect(x,y,w,h); return this; }
}

class EMCProposalPDF {
  constructor(){ 
    this.imageLoader = new ImageLoader(); 
    this.doc = null; this.layout = null; this.data = null; this.usableWidth = 0; this.colWidths = []; 
    // will be set in initializePDF when doc exists:
    this.measurer = null;
    this.debug = false;
  }
  lineHeightForFontSize(fsPt){ const base = fsPt * 0.3527777778 * 1.28; return Math.max(base, 1.8); }
  getLinesForText(text, maxWidthMm, fontSizePt){ this.doc.setFontSize(fontSizePt); return this.doc.splitTextToSize(String(text || ''), maxWidthMm); }
  computeTextHeight(lines, fontSizePt){ if (!lines || lines.length === 0) return this.lineHeightForFontSize(fontSizePt); return lines.length * this.lineHeightForFontSize(fontSizePt); }
  colPercentsToWidths(){ const usable = this.layout.pageWidth - (PDF_CONFIG.page.margin * 2); this.usableWidth = usable; const percents = PDF_CONFIG.table.colPercents; const widths = percents.map(p => (usable * (p / 100))); const sum = widths.reduce((a,b)=>a+b,0); const diff = usable - sum; if (Math.abs(diff) > 0.001) widths[widths.length - 1] += diff; return widths; }

  initializePDF(options = {}){
    const cfg = Object.assign({}, PDF_CONFIG.page, options.page || {});
    this.doc = new jsPDF(cfg);
    this.layout = new PDFLayoutManager(this.doc);
    this.doc.setProperties({ title: 'Commercial Offer - EMC Technology', author: 'EMC Technology' });
    this.doc.setLineJoin('miter'); this.doc.setLineCap('butt');
    // initialize measurer with this line height formula
    this.measurer = new TextMeasurer(this.lineHeightForFontSize.bind(this));
    // debug flag exposed via options.debug
    this.debug = !!(options.debug);
  }

  async prepareData(proposalData){
    const proposal = proposalData.proposal || proposalData;
    const productsIn = proposalData.products || proposalData.selectedProducts || [];
    const products = await Promise.all(productsIn.map(async (p,i)=>{
      let imageMeta = null; const url = p.image || p.imageUrl || p.img; if (url){ try{ imageMeta = await this.imageLoader.loadImage(url, PDF_CONFIG.images.maxDimensionPx); } catch(e){ console.warn('image load failed', e); imageMeta = null; } }
      return {
        number: p.number || p.id || (i+1).toString(),
        name: typeof p.name === 'object' ? (p.name.EN || Object.values(p.name)[0] || '') : (p.name || 'Product Name'),
        description: p.description || p.details || p.seo?.description || 'Product description will be provided.',
        unit: p.unit || 'SET', quantity: p.quantity || 1, unitPrice: p.unitPrice || p.price || 0, imageMeta
      };
    }));

    this.data = {
      company: {
        name: proposal.company || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»', shortName: proposal.companyShort || 'EMC',
        address: proposal.address || 'Tashkent city, Yunusabad district, Bogishamot 21B', phone: proposal.phone || '+998 90 122 55 18',
        email: proposal.email || 'info@emctech.uz', bankAccount: proposal.bankAccount || '2020 8000 0052 8367 7001', mfo: proposal.mfo || '08419', taxId: proposal.taxId || '307 738 207', oked: proposal.oked || '43299'
      },
      metadata: { number: proposal.proposalNumber || proposal.number || 'NoEMC28/0214', date: proposal.proposalDate || proposal.date || '15.10.2025', recipient: proposal.recipient || 'To Directorate of ENERSOK FE LCC' },
      terms: { payment: proposal.paymentTerms || '50 % prepayment', deliveryTime: proposal.deliveryTime || '6-12 weeks', delivery: proposal.deliveryTerms || 'DDP' },
      signatory: proposal.signatory || 'S.S. Abdushakarov', products
    };

    this.data.subtotal = this.data.products.reduce((s,p)=>s + (p.unitPrice * p.quantity), 0);
    this.data.taxAmount = this.data.subtotal * 0.12;
    this.data.grandTotal = this.data.subtotal + this.data.taxAmount;
  }

  async generate(proposalData, options = {}){
    try { this.initializePDF(options); await this.prepareData(proposalData); this.colWidths = this.colPercentsToWidths(); await this.renderDocument(); const fileName = `${this.data.metadata.number || 'proposal'}-proposal.pdf`.replace(/[^^\w.-]/g, '_'); this.doc.save(fileName); return fileName; }
    catch (err){ console.error('PDF generation failed', err); throw new PDFGenerationError('Failed to generate PDF', err); }
    finally { this.imageLoader.clearCache(); }
  }

  /* small helper to render debug outlines and overlays if debug true */
  _debugBox(x,y,w,h, fontSizePt, lines){
    if (!this.debug) return;
    try {
      const doc = this.doc;
      doc.setDrawColor(255, 0, 0); doc.setLineWidth(0.4);
      doc.rect(x, y, w, h);
      doc.setFontSize(6); doc.setTextColor(255, 0, 0);
      const overlay = `fs:${fontSizePt}pt ln:${lines ? lines.length : 0}`;
      doc.text(overlay, x + 1, y + 1);
      doc.setTextColor(0,0,0);
    } catch(e){ /* ignore debug drawing errors */ }
  }

  async renderDocument(){ if (!this.colWidths || this.colWidths.length === 0) this.colWidths = this.colPercentsToWidths(); this.renderHeader(); this.renderTitle(); this.renderIntro(); this.renderTable(); this.renderTotals(); this.renderNotes(); this.renderSignature(); this.renderLogos(); }

  renderHeader(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; const y = layout.getY(); const pageW = layout.pageWidth; const logoW = Math.min(40, Math.max(22, pageW * 0.07)); const logoH = Math.min(30, Math.max(14, logoW * 0.65));
    doc.setFont('helvetica','bold'); doc.setFontSize(12);

    // measure company name + info using measurer (keeps layout consistent but prevents overflow)
    const nameFit = this.measurer.fitFontSizeToBox(this.data.company.name, 'helvetica', 14, 10, pageW - (margin * 4) - logoW, 40);
    const nameH = nameFit.lines.length * this.lineHeightForFontSize(nameFit.fontSize);

    const info1 = `${this.data.company.address}; Phone: ${this.data.company.phone}`;
    const info2 = `Bank account: ${this.data.company.bankAccount}  MFO: ${this.data.company.mfo} ID: ${this.data.company.taxId} OKED: ${this.data.company.oked} E-mail: ${this.data.company.email}`;
    const info1Fit = this.measurer.fitFontSizeToBox(info1, 'helvetica', 9, 7, pageW - (margin * 4) - logoW, 40);
    const info2Fit = this.measurer.fitFontSizeToBox(info2, 'helvetica', 9, 7, pageW - (margin * 4) - logoW, 40);
    const info1H = info1Fit.lines.length * this.lineHeightForFontSize(info1Fit.fontSize);
    const info2H = info2Fit.lines.length * this.lineHeightForFontSize(info2Fit.fontSize);

    const centerTextH = nameH + info1H + info2H + 4; const headerH = Math.max(logoH, centerTextH) + 8;
    if (layout.getY() + headerH > layout.pageHeight - PDF_CONFIG.page.margin) layout.addPage();

    const logoY = y + (headerH - logoH) / 2;
    doc.setDrawColor(...PDF_CONFIG.colors.primary); doc.setLineWidth(0.9); doc.rect(margin, logoY, logoW, logoH);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(Math.max(12, logoW * 0.32)); doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('EMC', margin + logoW / 2, logoY + (logoH*0.36), { align: 'center' });
    doc.setFontSize(Math.max(8, logoW * 0.2)); doc.setTextColor(...PDF_CONFIG.colors.accent);
    doc.text('TECHNOLOGY', margin + logoW / 2, logoY + (logoH*0.75), { align: 'center' });

    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(0,0,0);
    // place metadata at top-right for increased readability
    doc.text(this.data.metadata.number, layout.pageWidth - margin, y + 8, { align: 'right' });
    doc.text(this.data.metadata.date, layout.pageWidth - margin, y + 14, { align: 'right' });

    const centerX = layout.pageWidth / 2;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...PDF_CONFIG.colors.accent);
    const centerTop = y + (headerH - centerTextH) / 2;

    // draw measured name lines
    doc.setFontSize(nameFit.fontSize); doc.setFont('helvetica','bold');
    nameFit.lines.forEach((line,i)=>{ doc.text(line, centerX, centerTop + i * this.lineHeightForFontSize(nameFit.fontSize), { align: 'center' }); });

    let infoStartY = centerTop + nameH + 2; doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    doc.setFontSize(info1Fit.fontSize);
    info1Fit.lines.forEach((line,i)=>{ doc.text(line, centerX, infoStartY + i * this.lineHeightForFontSize(info1Fit.fontSize), { align: 'center' }); });
    infoStartY += info1H;
    doc.setFontSize(info2Fit.fontSize);
    info2Fit.lines.forEach((line,i)=>{ doc.text(line, centerX, infoStartY + i * this.lineHeightForFontSize(info2Fit.fontSize), { align: 'center' }); });

    // debug boxes for header center area
    if (this.debug) {
      const centerBoxY = centerTop;
      const centerBoxH = centerTextH;
      const centerBoxW = pageW - margin*2 - logoW - 10;
      const centerBoxX = margin + logoW + 6;
      this._debugBox(centerBoxX, centerBoxY, centerBoxW, centerBoxH, nameFit.fontSize, nameFit.lines);
    }

    doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
    doc.text(this.data.metadata.recipient, layout.pageWidth - margin, y + 22, { align: 'right' });

    layout.setY(y + headerH + 10);
  }

  renderTitle(){ const doc = this.doc; const layout = this.layout; const centerX = layout.pageWidth / 2; 
    // use measured fit for title so it doesn't overflow
    const titleBoxW = layout.pageWidth - PDF_CONFIG.page.margin*2;
    const titleFit = this.measurer.fitFontSizeToBox('COMMERCIAL OFFER', 'helvetica', PDF_CONFIG.fonts.titleSize, 10, titleBoxW, 20);
    doc.setFont('helvetica','bold'); doc.setFontSize(titleFit.fontSize); doc.setTextColor(0,0,0); doc.text('COMMERCIAL OFFER', centerX, layout.getY()); 
    // debug box
    if (this.debug) this._debugBox(PDF_CONFIG.page.margin, layout.getY() - (this.lineHeightForFontSize(titleFit.fontSize)*0.8), titleBoxW, this.lineHeightForFontSize(titleFit.fontSize) + 2, titleFit.fontSize, titleFit.lines);
    layout.moveDown(this.lineHeightForFontSize(titleFit.fontSize) + 8);
  }

  // simpler and robust intro rendering: wrap whole paragraph using measurer
  renderIntro(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; 
    const before = 'We would like to inform you that ';
    const company = '"' + (this.data.company.name || '') + '"';
    const after = ' LLC will be sending you a commercial offer for the supply of the items listed below!';
    const whole = before + company + after;
    const availableWidth = layout.pageWidth - margin * 2;

    // use measurer to fit text
    const introFit = this.measurer.fitFontSizeToBox(whole, 'helvetica', PDF_CONFIG.fonts.bodySize, 8, availableWidth, 80);
    const lineHeight = this.lineHeightForFontSize(introFit.fontSize);

    for (let i=0;i<introFit.lines.length;i++){
      const ln = introFit.lines[i];
      const y = layout.getY() + (i * lineHeight);
      if (ln.includes(this.data.company.name)){
        // color company fragment by finding occurrences in the constructed line
        const parts = ln.split(this.data.company.name);
        // left part
        doc.setFont('helvetica','normal'); doc.setFontSize(introFit.fontSize); doc.text(parts[0], margin, y);
        const leftW = doc.getTextWidth(parts[0]);
        doc.setFont('helvetica','bold'); doc.setTextColor(...PDF_CONFIG.colors.accent);
        doc.text(this.data.company.name, margin + leftW, y);
        doc.setFont('helvetica','normal'); doc.setTextColor(0,0,0);
        const companyW = doc.getTextWidth(this.data.company.name);
        doc.text(parts[1] || '', margin + leftW + companyW, y);
      } else {
        doc.setFont('helvetica','normal'); doc.setFontSize(introFit.fontSize); doc.setTextColor(0,0,0);
        doc.text(ln, margin, y);
      }
    }

    // debug
    if (this.debug) this._debugBox(margin, layout.getY(), availableWidth, introFit.lines.length * lineHeight, introFit.fontSize, introFit.lines);

    layout.moveDown(introFit.lines.length * lineHeight + 8);
  }

  renderTable(){ this.renderTableHeader(); this.renderCategoryRow('1. TESTING AND MEASURING'); for (const product of this.data.products) this.renderProductRowWithFlow(product); this.layout.moveDown(4); }

  renderTableHeader(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; const headers = ['No','Requested Material description','Technical description Will be supplied','Will be supplied PHOTO','Unit','Quantity','Unit price(USD)','Total amount with (USD)'];
    const headerPadding = 4; const headerFits = []; let maxHeaderInnerHeight = 0;
    // measure each header cell with measurer
    for (let i=0;i<headers.length;i++){ 
      const w = this.colWidths[i] - 4;
      const fit = this.measurer.fitFontSizeToBox(headers[i], 'helvetica', PDF_CONFIG.fonts.tableHeaderSize, 6, w, 80);
      headerFits.push(fit);
      const h = fit.lines.length * this.lineHeightForFontSize(fit.fontSize);
      if (h>maxHeaderInnerHeight) maxHeaderInnerHeight = h; 
    }
    const headerH = Math.max(PDF_CONFIG.table.defaultMinRowHeight, maxHeaderInnerHeight + headerPadding*2);
    if (layout.getY() + headerH + 6 > layout.pageHeight - PDF_CONFIG.page.margin) { layout.addPage(); }
    const startY = layout.getY(); doc.setFillColor(...PDF_CONFIG.colors.lightGray); doc.rect(margin, startY, this.usableWidth, headerH, 'F');
    doc.setFont('helvetica','bold'); doc.setTextColor(0,0,0);

    let x = margin; for (let i=0;i<headers.length;i++){ 
      const w = this.colWidths[i]; 
      const fit = headerFits[i];
      const innerH = fit.lines.length * this.lineHeightForFontSize(fit.fontSize);
      const centerX = x + w/2;
      const startLineY = startY + (headerH/2) - (innerH/2) + (this.lineHeightForFontSize(fit.fontSize)/2);
      doc.setFontSize(fit.fontSize);
      fit.lines.forEach((ln,idx)=>{ doc.text(ln, centerX, startLineY + idx * this.lineHeightForFontSize(fit.fontSize), { align: 'center' }); });
      // debug overlay for this header cell
      if (this.debug) this._debugBox(x, startY, w, headerH, fit.fontSize, fit.lines);
      x += w; 
    }
    doc.setDrawColor(0,0,0); doc.setLineWidth(0.2); x = margin; for (let i=0;i<this.colWidths.length;i++){ doc.rect(x, startY, this.colWidths[i], headerH); x += this.colWidths[i]; }
    layout.moveDown(headerH + 2);
  }

  renderCategoryRow(text){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; const padding = 4; 
    // measure with measurer
    const fit = this.measurer.fitFontSizeToBox(text, 'helvetica', 9, 7, this.usableWidth - padding*2, 60);
    const textH = fit.lines.length * this.lineHeightForFontSize(fit.fontSize); 
    const h = Math.max(PDF_CONFIG.table.defaultMinRowHeight, textH + padding*2);
    if (layout.getY() + h + 6 > layout.pageHeight - PDF_CONFIG.page.margin) layout.addPage(); 
    const startY = layout.getY(); doc.setFillColor(...PDF_CONFIG.colors.lightGray); doc.rect(margin, startY, this.usableWidth, h, 'F'); 
    doc.setFont('helvetica','bold'); doc.setFontSize(fit.fontSize); doc.setTextColor(0,0,0); 
    const textY = startY + padding + (this.lineHeightForFontSize(fit.fontSize));
    fit.lines.forEach((ln, idx)=>{ doc.text(ln, margin + padding, textY + idx * this.lineHeightForFontSize(fit.fontSize)); });
    doc.setDrawColor(0,0,0); doc.setLineWidth(0.2); doc.rect(margin, startY, this.usableWidth, h); 
    if (this.debug) this._debugBox(margin, startY, this.usableWidth, h, fit.fontSize, fit.lines);
    layout.moveDown(h + 2); 
  }

  renderProductRowWithFlow(product){ 
    /* NOTE: changed from multi-fragment splitting to whole-row check:
       - measure name & description with measurer and compute single row height
       - If row doesn't fit remaining page, move whole row to next page and repeat header
       This satisfies "do a simple per-row height check" and avoids overlapping.
    */
    const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; const padding = PDF_CONFIG.table.cellPadding; 
    const descColIndex = 2; const descW = this.colWidths[descColIndex] - (padding*2); 
    const descPreferred = Math.max(PDF_CONFIG.fonts.tableBodySize, PDF_CONFIG.fonts.tableBodySize);
    const descFit = this.measurer.fitFontSizeToBox(product.description, 'helvetica', descPreferred, PDF_CONFIG.fonts.minTableBodySize, descW, 200, 1.0);
    const nameW = this.colWidths[1] - (padding*2); const nameFit = this.measurer.fitFontSizeToBox(product.name, 'helvetica', 9, 7, nameW, 80);
    const imageCellW = this.colWidths[3] - (padding*2); const imageMaxH = Math.min(40, imageCellW * 0.8);
    const minRowH = PDF_CONFIG.table.defaultMinRowHeight;

    const nameHeight = nameFit.lines.length * this.lineHeightForFontSize(nameFit.fontSize);
    const descHeight = descFit.lines.length * this.lineHeightForFontSize(descFit.fontSize);
    const imageHeight = product.imageMeta ? Math.min(imageMaxH, nameHeight + this.lineHeightForFontSize(descFit.fontSize) * 1) : 0;
    const reservedForNameImage = Math.max(nameHeight, imageHeight);
    let rowHeight = Math.max(minRowH, descHeight + padding*2 + reservedForNameImage);

    // page overflow check per-row: move whole row to next page if it doesn't fit
    if (layout.getY() + rowHeight > layout.pageHeight - PDF_CONFIG.page.margin - 10){
      layout.addPage(); this.renderTableHeader();
      // recompute available space if needed (rowHeight unchanged)
    }

    const rowY = layout.getY(); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2);
    let x = margin; for (let i=0;i<this.colWidths.length;i++){ doc.rect(x, rowY, this.colWidths[i], rowHeight); x += this.colWidths[i]; }

    x = margin; doc.setFont('helvetica','bold'); doc.setFontSize(9);
    // No fragmentation: single row contains number, name, description, image, etc.
    const numX = x + this.colWidths[0]/2; const numY = rowY + rowHeight/2 + 2; doc.text(product.number.toString(), numX, numY, { align: 'center' });
    x += this.colWidths[0];

    // name cell
    doc.setFont('helvetica','bold'); doc.setFontSize(nameFit.fontSize);
    const baseNameY = rowY + padding + 3;
    nameFit.lines.forEach((ln,li)=>{ const targetY = baseNameY + li * this.lineHeightForFontSize(nameFit.fontSize); doc.text(ln, x + padding, targetY); });
    if (this.debug) this._debugBox(x, rowY, this.colWidths[1], rowHeight, nameFit.fontSize, nameFit.lines);
    x += this.colWidths[1];

    // description cell
    doc.setFont('helvetica','normal'); doc.setFontSize(descFit.fontSize);
    const descStartY = rowY + padding;
    descFit.lines.forEach((ln,i)=>{ doc.text(ln, x + padding, descStartY + i * this.lineHeightForFontSize(descFit.fontSize)); });
    if (this.debug) this._debugBox(x, rowY, this.colWidths[2], rowHeight, descFit.fontSize, descFit.lines);
    x += this.colWidths[2];

    // image cell (unchanged from previous logic, but we scale proportionally and keep same placement)
    if (product.imageMeta && product.imageMeta.dataUrl){
      try {
        const imgX = x + padding; const imgY = rowY + padding; const cellW = this.colWidths[3]; const cellH = rowHeight - padding*2; const maxImgW = Math.max(6, cellW - padding*2); const maxImgH = Math.min(imageMaxH, cellH);
        let targetW = maxImgW; const pmw = product.imageMeta.width || 1; const pmh = product.imageMeta.height || 1; let targetH = (pmh/pmw) * targetW;
        if (targetH > maxImgH){ targetH = maxImgH; targetW = (pmw/pmh) * targetH; }
        const mime = (product.imageMeta.mime && product.imageMeta.mime.includes('png')) ? 'PNG' : 'JPEG';
        doc.addImage(product.imageMeta.dataUrl, mime, imgX + ((maxImgW - targetW)/2), imgY + ((maxImgH - targetH)/2), targetW, targetH);
      }
      catch(e){ console.warn('addImage failed', e); doc.setFillColor(211,211,211); doc.rect(x + padding, rowY + padding, Math.max(6, this.colWidths[3] - padding*2), Math.min(imageMaxH, rowHeight - padding*2), 'F'); doc.setFontSize(7); doc.setTextColor(100,100,100); const fallbackLines = doc.splitTextToSize(product.name, Math.max(6, this.colWidths[3] - padding*2) - 2); fallbackLines.forEach((line, idx)=>{ doc.text(line, x + padding + (Math.max(6, this.colWidths[3] - padding*2)/2), rowY + padding + ((idx) * this.lineHeightForFontSize(7)), { align: 'center' }); }); doc.setTextColor(0,0,0); }
    } else {
      doc.setFillColor(211,211,211); doc.rect(x + padding, rowY + padding, Math.max(6, this.colWidths[3] - padding*2), Math.min(imageMaxH, rowHeight - padding*2), 'F');
      doc.setFontSize(7); doc.setTextColor(100,100,100);
      const placeholderLines = doc.splitTextToSize(product.name, Math.max(6, this.colWidths[3] - padding*2) - 2);
      placeholderLines.forEach((line, idx)=>{ doc.text(line, x + padding + (Math.max(6, this.colWidths[3] - padding*2)/2), rowY + padding + (idx * this.lineHeightForFontSize(7)), { align: 'center' }); });
      doc.setTextColor(0,0,0);
    }
    if (this.debug) this._debugBox(x, rowY, this.colWidths[3], rowHeight, 7, []);

    x += this.colWidths[3];

    // unit
    doc.setFont('helvetica','normal'); doc.setFontSize(9); const unitText = String(product.unit); const unitX = x + this.colWidths[4]/2; const unitY = rowY + rowHeight/2 + 2; doc.text(unitText, unitX, unitY, { align: 'center' });
    if (this.debug) this._debugBox(x, rowY, this.colWidths[4], rowHeight, 9, [{ }]);
    x += this.colWidths[4];

    // quantity
    doc.setFontSize(9); const qtyText = String(product.quantity); const qtyX = x + this.colWidths[5]/2; const qtyY = rowY + rowHeight/2 + 2; doc.text(qtyText, qtyX, qtyY, { align: 'center' });
    if (this.debug) this._debugBox(x, rowY, this.colWidths[5], rowHeight, 9, [{ }]);
    x += this.colWidths[5];

    // unit price
    doc.setFontSize(9); const priceText = Number(product.unitPrice).toFixed(2); const priceX = x + this.colWidths[6] - 3; const priceY = rowY + rowHeight/2 + 2; doc.text(priceText, priceX, priceY, { align: 'right' });
    if (this.debug) this._debugBox(x, rowY, this.colWidths[6], rowHeight, 9, [{ }]);
    x += this.colWidths[6];

    // total
    const total = (product.unitPrice * product.quantity) || 0; doc.setFontSize(9); const totalText = Number(total).toFixed(2); const totalX = x + this.colWidths[7] - 3; const totalY = rowY + rowHeight/2 + 2; doc.text(totalText, totalX, totalY, { align: 'right' });
    if (this.debug) this._debugBox(x, rowY, this.colWidths[7], rowHeight, 9, [{ }]);

    layout.moveDown(rowHeight + 2);
  }

  renderTotals(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; const colWidths = this.colWidths; const totalLabelWidth = colWidths.slice(0,6).reduce((a,b)=>a+b,0); const totalValueWidth = colWidths.slice(6).reduce((a,b)=>a+b,0); const labelStartX = margin; const valueStartX = margin + totalLabelWidth; const rows = [{ label: 'Total USD:', value: this.data.subtotal, bg: PDF_CONFIG.colors.background },{ label: 'VAT 12%:', value: this.data.taxAmount, bg: PDF_CONFIG.colors.background },{ label: 'Total including VAT 12% in USD:', value: this.data.grandTotal, bg: PDF_CONFIG.colors.blueHighlight }];
    rows.forEach(r=>{ const rowH = 9; if (this.layout.getY() + rowH > this.layout.pageHeight - PDF_CONFIG.page.margin) this.layout.addPage(); doc.setFillColor(...r.bg); doc.rect(labelStartX, this.layout.getY(), totalLabelWidth, rowH, 'F'); doc.rect(valueStartX, this.layout.getY(), totalValueWidth, rowH, 'F'); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(r.label, labelStartX + totalLabelWidth - 4, this.layout.getY() + 6, { align: 'right' }); doc.text(Number(r.value).toFixed(2), valueStartX + totalValueWidth - 3, this.layout.getY() + 6, { align: 'right' }); doc.setDrawColor(0,0,0); doc.setLineWidth(0.2); doc.rect(labelStartX, this.layout.getY(), totalLabelWidth, rowH); doc.rect(valueStartX, this.layout.getY(), totalValueWidth, rowH); this.layout.moveDown(rowH); }); this.layout.moveDown(8); }

  renderNotes(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('NOTES:', margin, layout.getY()); layout.moveDown(6); doc.setFont('helvetica','normal'); doc.setFontSize(9);
    const notes = [{ label: '1. Terms of payment:', text: this.data.terms.payment },{ label: '2. Estimated delivery time:', text: this.data.terms.deliveryTime },{ label: '3. Terms of delivery:', text: this.data.terms.delivery }];
    const bulletIndent = 5; const lineHeight = this.lineHeightForFontSize(9);
    notes.forEach(note=>{ const fullText = `${note.label} ${note.text}`; // measure via measurer
      const fit = this.measurer.fitFontSizeToBox(fullText, 'helvetica', 9, 7, this.layout.pageWidth - margin*2 - bulletIndent, 80);
      const blockH = fit.lines.length * this.lineHeightForFontSize(fit.fontSize) + 2; 
      if (layout.getY() + blockH > layout.pageHeight - PDF_CONFIG.page.margin) { layout.addPage(); }
      fit.lines.forEach((line,index)=>{ if (index === 0){ const label = note.label; const rest = line.replace(label, '').trim(); doc.setFont('helvetica','bold'); doc.setFontSize(fit.fontSize); doc.text(label, margin + bulletIndent, layout.getY()); doc.setFont('helvetica','normal'); if (rest) { const xOffset = margin + bulletIndent + doc.getTextWidth(label) + 2; doc.text(rest, xOffset, layout.getY()); } } else { doc.setFontSize(fit.fontSize); doc.text(line, margin + bulletIndent, layout.getY()); } layout.moveDown(this.lineHeightForFontSize(fit.fontSize)); }); layout.moveDown(2); if (this.debug) this._debugBox(margin, layout.getY() - blockH - 2, this.layout.pageWidth - margin*2, blockH, fit.fontSize, fit.lines); }); layout.moveDown(8); }

  renderSignature(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; const needed = 44; if (layout.getY() + needed > layout.pageHeight - margin) layout.addPage(); const sigY = layout.getY(); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text('General manager', margin, sigY); doc.setDrawColor(0,0,0); doc.setLineWidth(0.6); doc.line(margin, sigY + 6, margin + 80, sigY + 6); const centerX = layout.pageWidth / 2; const stampRadius = Math.min(36, layout.pageWidth * 0.065); doc.setDrawColor(25,118,210); doc.setLineWidth(2); doc.circle(centerX, sigY + 12, stampRadius); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(25,118,210); doc.text('Stamp', centerX, sigY + 12 + 3, { align: 'center' }); doc.setTextColor(0,0,0); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.text(this.data.signatory, layout.pageWidth - margin, sigY, { align: 'right' }); layout.moveDown(needed + 4); }

  renderLogos(){ const doc = this.doc; const layout = this.layout; const margin = PDF_CONFIG.page.margin; if (layout.getY() + 40 > layout.pageHeight - margin) layout.addPage(); doc.setDrawColor(200,200,200); doc.setLineWidth(0.4); doc.line(margin, layout.getY(), layout.pageWidth - margin, layout.getY()); layout.moveDown(6);
    const partners = [ { name: 'INOVA', color: [51,51,51] }, { name: 'WATERMAN\nCOMPLIANCE', color: [51,51,51] }, { name: 'SWAN', color: [51,51,51] }, { name: 'PASS', color: [51,51,51] }, { name: 'Honeywell', color: [211,47,47] }, { name: 'RO ST', color: [51,51,51] } ];
    const maxPerRow = Math.min(6, Math.max(2, Math.floor(layout.pageWidth / 70)));
    const gap = 16; const logoW = Math.min(60, Math.max(36, (layout.pageWidth - margin*2 - (gap*(maxPerRow-1))) / maxPerRow)); const logoH = Math.min(30, Math.max(20, logoW * 0.6)); const rows = Math.ceil(partners.length / maxPerRow);
    let currentIndex = 0; for (let r=0;r<rows;r++){ const itemsInRow = Math.min(maxPerRow, partners.length - currentIndex); const totalWidth = itemsInRow * logoW + (itemsInRow - 1) * gap; let startX = Math.max(margin, (layout.pageWidth - totalWidth) / 2);
      for (let c=0;c<itemsInRow;c++, currentIndex++){ const partner = partners[currentIndex]; doc.setFillColor(240,240,240); doc.rect(startX, layout.getY(), logoW, logoH, 'F'); doc.setDrawColor(190,190,190); doc.setLineWidth(0.3); doc.rect(startX, layout.getY(), logoW, logoH); doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...partner.color); const nameLines = partner.name.split('\n'); nameLines.forEach((line, index)=>{ doc.text(line, startX + logoW/2, layout.getY() + logoH + 6 + (index * this.lineHeightForFontSize(10)), { align: 'center' }); }); startX += logoW + gap; }
      layout.moveDown(logoH + 18);
    }
    doc.setTextColor(0,0,0);
  }
}

export async function downloadEMCProposalPdf(proposalData, options = {}){ const gen = new EMCProposalPDF(); return await gen.generate(proposalData, options); }
export { EMCProposalPDF, ImageLoader, PDFGenerationError };
export async function downloadProposalPdf(proposalData, options = {}){ return downloadEMCProposalPdf(proposalData, options); }
export default downloadProposalPdf;
