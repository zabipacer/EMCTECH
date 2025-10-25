import jsPDF from "jspdf";

const PDF_CONFIG = {
  page: { orientation: 'portrait', unit: 'mm', format: 'a4', margin: 15 },
  colors: {
    primary: [0, 51, 102],
    secondary: [0, 102, 204],
    accent: [220, 53, 69],
    lightGray: [248, 249, 250],
    mediumGray: [233, 236, 239],
    darkGray: [52, 58, 64],
    background: [255, 255, 255],
    blueHighlight: [224, 242, 254],
    redLine: [220, 53, 69],
    greenAccent: [40, 167, 69],
    orangeAccent: [253, 126, 20]
  },
  fonts: {
    headerSize: 16,
    subtitleSize: 12,
    titleSize: 14,
    bodySize: 10,
    smallSize: 8,
    tableHeaderSize: 11,
    tableBodySize: 10,
    tableTitleSize: 12,
    minTableBodySize: 9
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24
  },
  table: {
    colPercents: [4, 22, 20, 18, 6, 6, 12, 12],
    defaultRowPadding: 6,
    defaultMinRowHeight: 20,
    cellPadding: 5,
    imageMaxHeight: 45,
    imageMaxWidth: 25,
    categoryRowHeight: 12,
    rowGap: 3
  },
  images: { 
    maxDimensionPx: 1200,
    maxDimensionMm: 120,
    quality: 0.97,
    timeout: 10000,
    logoWidth: 60,
    logoHeight: 25
  },
  layout: { reservedBottom: 50 }
};

class PDFGenerationError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'PDFGenerationError';
    this.originalError = originalError;
  }
}

class TextMeasurer {
  constructor(lineHeightForFontSizeFn) {
    this.lineHeightForFontSize = lineHeightForFontSizeFn;
    this.cache = new Map();
    this.MM_TO_PX = 3.779527559055;
    this.PT_TO_PX = 96/72;
    this.canvas = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    if (this.ctx) {
      this.ctx.textBaseline = 'top';
      this.ctx.font = '10px helvetica';
    }
  }

  _cacheKey(text, fontFamily, fontSizePt, maxWidthMm) {
    return `${fontFamily}||${fontSizePt}pt||${maxWidthMm}mm||${String(text)}`;
  }

  measureTextLines(text, fontFamily, fontSizePt, maxWidthMm) {
    if (!this.ctx) {
      const words = String(text || '').split(/\s+/);
      const lines = [];
      let currentLine = '';
      
      for (let word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const approxWidth = testLine.length * (fontSizePt * 0.35);
        
        if (approxWidth <= maxWidthMm || currentLine === '') {
          currentLine = testLine;
        } else {
          if (word.length > 15 && currentLine === '') {
            const half = Math.floor(word.length / 2);
            const firstPart = word.substring(0, half) + '-';
            const secondPart = word.substring(half);
            lines.push(firstPart);
            currentLine = secondPart;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
      }
      if (currentLine) lines.push(currentLine);
      return this._cleanupSingleCharacterLines(lines, fontFamily, fontSizePt, maxWidthMm);
    }

    const key = this._cacheKey(text, fontFamily, fontSizePt, maxWidthMm);
    if (this.cache.has(key)) return this.cache.get(key);

    const fontPx = fontSizePt * this.PT_TO_PX;
    this.ctx.font = `${fontPx}px ${fontFamily}`;
    const maxWidthPx = Math.max(1, maxWidthMm * this.MM_TO_PX);

    const words = String(text || '').split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (let word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const measuredWidth = this.ctx.measureText(testLine).width;
      
      if (measuredWidth <= maxWidthPx || currentLine === '') {
        currentLine = testLine;
      } else {
        if (word.length > 20 && currentLine === '') {
          const segments = this._breakLongWord(word, fontFamily, fontSizePt, maxWidthMm);
          lines.push(...segments.slice(0, -1));
          currentLine = segments[segments.length - 1];
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
    }
    if (currentLine) lines.push(currentLine);

    const cleanedLines = this._cleanupSingleCharacterLines(lines, fontFamily, fontSizePt, maxWidthMm);
    this.cache.set(key, cleanedLines);
    return cleanedLines;
  }

  _breakLongWord(word, fontFamily, fontSizePt, maxWidthMm) {
    const segments = [];
    let currentSegment = '';
    
    for (let i = 0; i < word.length; i++) {
      const testSegment = currentSegment + word[i];
      if (this._measureTextWidth(testSegment, fontFamily, fontSizePt) > maxWidthMm * 0.8) {
        if (currentSegment) {
          segments.push(currentSegment + '-');
          currentSegment = word[i];
        }
      } else {
        currentSegment = testSegment;
      }
    }
    if (currentSegment) segments.push(currentSegment);
    return segments;
  }

  _cleanupSingleCharacterLines(lines, fontFamily, fontSizePt, maxWidthMm) {
    const cleaned = [];
    for (let i = 0; i < lines.length; i++) {
      if (i < lines.length - 1 && lines[i].length === 1 && lines[i].trim() !== '') {
        const merged = lines[i] + ' ' + lines[i + 1];
        if (this._measureTextWidth(merged, fontFamily, fontSizePt) <= maxWidthMm) {
          cleaned.push(merged);
          i++;
        } else {
          cleaned.push(lines[i]);
        }
      } else {
        cleaned.push(lines[i]);
      }
    }
    return cleaned;
  }

  _measureTextWidth(text, fontFamily, fontSizePt) {
    if (!this.ctx) return text.length * (fontSizePt * 0.35);
    const fontPx = fontSizePt * this.PT_TO_PX;
    this.ctx.font = `${fontPx}px ${fontFamily}`;
    return (this.ctx.measureText(text).width / this.MM_TO_PX);
  }

  fitFontSizeToBox(text, fontFamily, preferredSizePt, minSizePt, boxWidthMm, boxHeightMm, lineHeightMultiplier = 1.2) {
    const step = 0.5;
    for (let fs = preferredSizePt; fs >= minSizePt; fs = Math.round((fs - step) * 100) / 100) {
      const lines = this.measureTextLines(text, fontFamily, fs, boxWidthMm);
      const lineHeightMm = this.lineHeightForFontSize(fs) * lineHeightMultiplier;
      const totalHeight = lines.length * lineHeightMm;
      if (totalHeight <= boxHeightMm) {
        return { fontSize: fs, lines, totalHeight, lineHeightMm };
      }
    }
    const lines = this.measureTextLines(text, fontFamily, minSizePt, boxWidthMm);
    const lineHeightMm = this.lineHeightForFontSize(minSizePt) * lineHeightMultiplier;
    let finalLines = lines;
    let finalHeight = lines.length * lineHeightMm;
    
    if (finalHeight > boxHeightMm) {
      const maxLines = Math.floor(boxHeightMm / lineHeightMm);
      if (maxLines > 0) {
        finalLines = lines.slice(0, maxLines);
        if (finalLines.length > 0) {
          finalLines[finalLines.length - 1] = finalLines[finalLines.length - 1].substring(0, finalLines[finalLines.length - 1].length - 3) + '...';
        }
        finalHeight = maxLines * lineHeightMm;
      }
    }
    
    return { fontSize: minSizePt, lines: finalLines, totalHeight: finalHeight, lineHeightMm };
  }
}

class ImageLoader {
  constructor(config = PDF_CONFIG.images) { 
    this.config = config; 
    this.cache = new Map(); 
  }

  async loadImage(urlOrFile, maxPx = this.config.maxDimensionPx) {
    if (!urlOrFile) return null;
    const cacheKey = `${typeof urlOrFile === 'string' ? urlOrFile : 'file_' + (urlOrFile.name||'blob')}_${maxPx}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      if (typeof urlOrFile === 'string' && urlOrFile.startsWith('data:image')) {
        const meta = await this.processImageFromDataUrl(urlOrFile, maxPx);
        this.cache.set(cacheKey, meta);
        return meta;
      }

      if (typeof urlOrFile === 'string') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        let resp;
        try { 
          resp = await fetch(urlOrFile, { mode: 'cors', credentials: 'omit', signal: controller.signal }); 
        } finally { 
          clearTimeout(timeoutId); 
        }
        if (!resp || !resp.ok) throw new Error(`HTTP ${resp ? resp.status : 'no response'}`);
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        try { 
          const meta = await this.processImage(objectUrl, maxPx, blob.type); 
          this.cache.set(cacheKey, meta); 
          return meta; 
        } finally { 
          URL.revokeObjectURL(objectUrl); 
        }
      }

      if (urlOrFile instanceof File || urlOrFile instanceof Blob) {
        const objectUrl = URL.createObjectURL(urlOrFile);
        try { 
          const meta = await this.processImage(objectUrl, maxPx, urlOrFile.type || 'image/jpeg'); 
          this.cache.set(cacheKey, meta); 
          return meta; 
        } finally { 
          URL.revokeObjectURL(objectUrl); 
        }
      }

      return null;
    } catch (err) {
      console.warn('Image load error, returning null', err);
      return null;
    }
  }

  async processImageFromDataUrl(dataUrl, maxPx) {
    return new Promise((resolve, reject) => {
      const img = new Image(); 
      img.crossOrigin = 'Anonymous';
      const timeout = setTimeout(() => { 
        img.onload = img.onerror = null; 
        reject(new Error('Image load timeout')); 
      }, this.config.timeout);
      
      img.onload = async () => { 
        clearTimeout(timeout); 
        try { 
          const res = await this._drawToCanvasAndExport(img, maxPx); 
          resolve(res); 
        } catch (e) { 
          reject(e); 
        } 
      };
      img.onerror = (e) => { 
        clearTimeout(timeout); 
        reject(new Error('Image tag failed: ' + e)); 
      };
      img.src = dataUrl;
    });
  }

  processImage(src, maxPx, mimeType) {
    return new Promise((resolve, reject) => {
      const img = new Image(); 
      img.crossOrigin = 'Anonymous';
      const timeout = setTimeout(() => { 
        img.onload = img.onerror = null; 
        reject(new Error('Image load timeout')); 
      }, this.config.timeout);
      
      img.onload = async () => { 
        clearTimeout(timeout); 
        try { 
          const res = await this._drawToCanvasAndExport(img, maxPx, mimeType); 
          resolve(res); 
        } catch (err) { 
          reject(err); 
        } 
      };
      img.onerror = (e) => { 
        clearTimeout(timeout); 
        reject(new Error('Image tag failed: ' + e)); 
      };
      img.src = src;
    });
  }

  async _drawToCanvasAndExport(img, maxPx, mimeType = 'image/jpeg') {
    const srcW = img.naturalWidth || img.width; 
    const srcH = img.naturalHeight || img.height;
    const ratio = Math.min(1, maxPx / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * ratio)); 
    const h = Math.max(1, Math.round(srcH * ratio));
    
    const canvas = document.createElement('canvas'); 
    canvas.width = w; 
    canvas.height = h; 
    const ctx = canvas.getContext('2d');
    
    if (mimeType !== 'image/png') {
      ctx.fillStyle = '#FFFFFF'; 
      ctx.fillRect(0, 0, w, h);
    }
    
    ctx.drawImage(img, 0, 0, w, h);
    const mime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvas.toDataURL(mime, this.config.quality);
    
    return { dataUrl, width: w, height: h, mime };
  }

  clearCache() { this.cache.clear(); }
}

class PDFLayoutManager {
  constructor(doc, config = PDF_CONFIG) { 
    this.doc = doc; 
    this.config = config; 
    this.currentY = config.page.margin; 
    this.pageHeight = doc.internal.pageSize.getHeight(); 
    this.pageWidth = doc.internal.pageSize.getWidth(); 
  }
  
  addPage() { 
    this.doc.addPage(); 
    this.currentY = this.config.page.margin; 
    this.pageHeight = this.doc.internal.pageSize.getHeight(); 
    this.pageWidth = this.doc.internal.pageSize.getWidth(); 
    return this; 
  }
  
  moveDown(amount) { 
    this.currentY += amount; 
    return this; 
  }
  
  setY(y) { 
    this.currentY = y; 
    return this; 
  }
  
  getY() { 
    return this.currentY; 
  }
  
  ensureSpace(minSpace = 25) { 
    if (this.currentY + minSpace > this.pageHeight - this.config.page.margin) { 
      this.addPage(); 
      return true; 
    } 
    return false; 
  }
  
  drawLine(x1, y1, x2, y2, color = PDF_CONFIG.colors.mediumGray, width = 0.3) { 
    this.doc.setDrawColor(...color); 
    this.doc.setLineWidth(width); 
    this.doc.line(x1, y1, x2, y2); 
    return this; 
  }
  
  drawRect(x, y, w, h, fillColor = null, strokeColor = PDF_CONFIG.colors.mediumGray) { 
    if (fillColor) { 
      this.doc.setFillColor(...fillColor); 
      this.doc.rect(x, y, w, h, 'F'); 
    }
    if (strokeColor) {
      this.doc.setDrawColor(...strokeColor);
      this.doc.rect(x, y, w, h);
    }
    return this; 
  }
}

class EMCProposalPDF {
  constructor() { 
    this.imageLoader = new ImageLoader(); 
    this.doc = null; 
    this.layout = null; 
    this.data = null; 
    this.usableWidth = 0; 
    this.colWidths = []; 
    this.measurer = null;
    this.debug = false;
    this.logos = {
      emc: null,
      innova: null
    };
  }
  
  lineHeightForFontSize(fsPt) { 
    return fsPt * 0.3527777778 * 1.3;
  }
  
  getLinesForText(text, maxWidthMm, fontSizePt) { 
    this.doc.setFontSize(fontSizePt); 
    return this.doc.splitTextToSize(String(text || ''), maxWidthMm); 
  }
  
  computeTextHeight(lines, fontSizePt) { 
    if (!lines || lines.length === 0) return this.lineHeightForFontSize(fontSizePt); 
    return lines.length * this.lineHeightForFontSize(fontSizePt); 
  }
  
  colPercentsToWidths() { 
    const usable = this.layout.pageWidth - (PDF_CONFIG.page.margin * 2); 
    this.usableWidth = usable; 
    const percents = PDF_CONFIG.table.colPercents; 
    const widths = percents.map(p => (usable * (p / 100))); 
    const sum = widths.reduce((a, b) => a + b, 0); 
    const diff = usable - sum; 
    if (Math.abs(diff) > 0.001) widths[widths.length - 1] += diff; 
    return widths; 
  }

  initializePDF(options = {}) {
    const cfg = Object.assign({}, PDF_CONFIG.page, options.page || {});
    this.doc = new jsPDF(cfg);
    this.layout = new PDFLayoutManager(this.doc);
    this.doc.setProperties({ 
      title: 'Commercial Offer - EMC Technology', 
      author: 'EMC Technology',
      subject: 'Commercial Proposal',
      keywords: 'commercial, offer, proposal, EMC Technology'
    });
    this.doc.setLineJoin('miter'); 
    this.doc.setLineCap('butt');
    this.measurer = new TextMeasurer(this.lineHeightForFontSize.bind(this));
    this.debug = !!(options.debug);
  }

  _toPlainString(val, fallback = '') {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      if (val.name) return String(val.name);
      if (val.fullName) return String(val.fullName);
      if (val.firstName || val.lastName) return `${val.firstName || ''} ${val.lastName || ''}`.trim();
      try { return JSON.stringify(val); } catch (e) { return fallback; }
    }
    return String(val);
  }

async prepareData(proposalData) {
  const proposal = proposalData.proposal || proposalData;
  const sendingCompany = proposal.company || 'emctech';
  const templateType = proposal.templateType || '';
  const isTechnical = templateType.includes('technical');
  const hasImages = templateType.includes('with-images');

  // Load company logos
  if (sendingCompany === 'emctech') {
    try {
      this.logos.emc = await this.imageLoader.loadImage(
        'https://i.ibb.co/w9WQb0D/Whats-App-Image-2025-10-22-at-16-05-26-7a8ba761.jpg',
        PDF_CONFIG.images.maxDimensionPx
      );
    } catch (e) {
      console.warn('EMC logo load failed', e);
      try {
        this.logos.emc = await this.imageLoader.loadImage(
          'https://i.ibb.co/Z1NxmgGT/Whats-App-Image-2025-10-20-at-19-18-39-a4aa3c8e.jpg',
          PDF_CONFIG.images.maxDimensionPx
        );
      } catch (fallbackError) {
        console.warn('EMC fallback logo also failed', fallbackError);
      }
    }
  } else if (sendingCompany === 'innovamechanics') {
    try {
      this.logos.innova = await this.imageLoader.loadImage(
        'https://i.ibb.co/Csmh58wr/Whats-App-Image-2025-10-20-at-19-20-15-54c63aa3.jpg',
        PDF_CONFIG.images.maxDimensionPx
      );
    } catch (e) { console.warn('INNOVA logo load failed', e); }
  }

  const companyData = proposal.companyDetails || {};
  const termsData = proposal.terms || proposal.deliveryTerms || {};

  if (isTechnical) {
    // Technical offer - FIXED: Proper image loading and description extraction
    const rfqItemsIn = proposalData.rfqItems || proposalData.items || [];
    const items = await Promise.all((rfqItemsIn || []).map(async (item, i) => {
      let imageMeta = null;
      
      const url = item.imageUrl || item.image || item.img || item.thumbnail;
      const shouldLoadImage = hasImages && url && url.trim() !== '';
      
      if (shouldLoadImage) {
        try { 
          imageMeta = await this.imageLoader.loadImage(url, PDF_CONFIG.images.maxDimensionPx); 
        }
        catch (e) { 
          console.warn('Failed to load technical item image:', url, e);
          imageMeta = null; 
        }
      }
      
      // COMPREHENSIVE DESCRIPTION EXTRACTION FOR TECHNICAL ITEMS
      let description = '';
      
      if (item.technicalDescription && item.technicalDescription.trim()) {
        description = item.technicalDescription;
      } else if (item.description && item.description.trim()) {
        description = item.description;
      } else if (item.specifications && Array.isArray(item.specifications) && item.specifications.length > 0) {
        description = item.specifications.filter(s => s && s.trim()).join(', ');
      } else if (item.specs && Array.isArray(item.specs) && item.specs.length > 0) {
        description = item.specs.filter(s => s && s.trim()).join(', ');
      } else if (item.details && item.details.trim()) {
        description = item.details;
      }
      
      // Final fallback
      if (!description || !description.trim()) {
        description = 'Technical specifications will be provided.';
      }
      
      console.log(`Technical Item ${i + 1} description extraction:`, {
        itemName: item.description || item.name,
        hasTechnicalDescription: !!item.technicalDescription,
        hasDescription: !!item.description,
        hasSpecifications: !!(item.specifications && item.specifications.length),
        finalDescription: description
      });

      return {
        id: `tech-${item.id || i}-${Date.now()}`,
        number: (i + 1).toString(),
        name: (item.description || item.name || 'Technical Item').toString(),
        description: description,
        specifications: Array.isArray(item.specifications) ? item.specifications : (item.specs || []),
        manufacturer: item.manufacturer || '',
        partNumber: item.partNumber || item.pn || '',
        unit: item.unit || 'each',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || item.price || 0,
        willBeSupplied: item.willBeSupplied || '',
        imageMeta,
        raw: item,
        isTechnical: true
      };
    }));

    this.data = {
      company: {
        name: this._toPlainString(companyData.name || proposal.companyName || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»'),
        shortName: this._toPlainString(proposal.companyShort || (sendingCompany === 'emctech' ? 'EMC Technology' : 'Innova Mechanics Ltd')),
        address: this._toPlainString(companyData.address || proposal.address || 
          (sendingCompany === 'emctech' 
            ? 'Tashkent city, Yunusabad district, Bogishamol 21B'
            : 'Unit 19E Cherwell Business Village, Southam Road, Banbury, Oxford, OX16 2SP, UK')),
        phone: this._toPlainString(companyData.phone || proposal.phone || 
          (sendingCompany === 'emctech' ? '+998 90 122 55 18' : '+44 1865 602161')),
        email: this._toPlainString(companyData.email || proposal.email || 
          (sendingCompany === 'emctech' ? 'info@emctech.uz' : 'info@innovamechanics.com')),
        website: this._toPlainString(companyData.website || 
          (sendingCompany === 'innovamechanics' ? 'www.innovamechanics.com' : '')),
        bankAccount: this._toPlainString(companyData.bankAccount || proposal.bankAccount || '2020 8000 0052 8367 7001'),
        mfo: this._toPlainString(companyData.mfo || proposal.mfo || '08419'),
        taxId: this._toPlainString(companyData.taxId || proposal.taxId || '307 738 207'),
        oked: this._toPlainString(companyData.oked || proposal.oked || '43299')
      },
      metadata: {
        number: this._toPlainString(proposal.proposalNumber || proposal.number || 'NoEMC28/0214'),
        date: this._toPlainString(proposal.proposalDate || proposal.date || new Date().toLocaleDateString('en-GB')),
        recipient: this._toPlainString(proposal.recipient || proposal.clientName || 'To Directorate of ENERSOK FE LCC'),
        documentNumber: this._toPlainString(proposal.documentNumber || '')
      },
      terms: {
        payment: this._toPlainString(termsData.paymentTerms || proposal.paymentTerms || '50 % prepayment'),
        deliveryTime: this._toPlainString(termsData.deliveryTime || proposal.deliveryTime || '6-12 weeks'),
        delivery: this._toPlainString(termsData.incoterms || proposal.deliveryTerms || 'DDP'),
        validity: this._toPlainString(proposal.validity || '30 days'),
        warranty: this._toPlainString(proposal.warranty || 'Standard manufacturer warranty applies')
      },
      signatory: this._toPlainString(proposal.authorizedSignatory || proposal.signatory || 'S.S. Abdushakarov'),
      items,
      sendingCompany,
      isTechnical: true,
      hasImages,
      templateType
    };

    try { this.data.partnerLogos = await this.loadPartnerLogos(); } catch (e) { this.data.partnerLogos = []; }

    this.data.subtotal = (this.data.items || []).reduce((s, it) => s + ((it.unitPrice || 0) * (it.quantity || 1)), 0);
    this.data.taxAmount = this.data.subtotal * 0.12;
    this.data.grandTotal = this.data.subtotal + this.data.taxAmount;

  } else {
    // Commercial offer - FIXED: COMPREHENSIVE DESCRIPTION EXTRACTION
    const productsIn = proposalData.products || proposalData.selectedProducts || [];
    const products = await Promise.all(productsIn.map(async (p, i) => {
      let imageMeta = null;
      const url = p.image || p.imageUrl || p.img || p.thumbnail;
      if (url) {
        try { imageMeta = await this.imageLoader.loadImage(url, PDF_CONFIG.images.maxDimensionPx); }
        catch (e) { imageMeta = null; }
      }
      
      // FIXED: COMPREHENSIVE DESCRIPTION EXTRACTION FOR COMMERCIAL PRODUCTS
      let description = '';
      
      // Priority 1: Direct description fields
      if (p.technicalDescription && typeof p.technicalDescription === 'string' && p.technicalDescription.trim()) {
        description = p.technicalDescription;
      } else if (p.description && typeof p.description === 'string' && p.description.trim()) {
        description = p.description;
      } else if (p.details && typeof p.details === 'string' && p.details.trim()) {
        description = p.details;
      } 
      // Priority 2: Object-based description (localized)
      else if (p.description && typeof p.description === 'object') {
        description = p.description.EN || p.description.en || Object.values(p.description)[0] || '';
      }
      // Priority 3: SEO and long descriptions
      else if (p.seo?.description && typeof p.seo.description === 'string' && p.seo.description.trim()) {
        description = p.seo.description;
      } else if (p.longDescription && typeof p.longDescription === 'string' && p.longDescription.trim()) {
        description = p.longDescription;
      }
      // Priority 4: Specifications
      else if (p.specifications && Array.isArray(p.specifications) && p.specifications.length > 0) {
        description = p.specifications.filter(s => s && s.trim()).join(', ');
      } else if (p.specs && Array.isArray(p.specs) && p.specs.length > 0) {
        // Handle both array of strings and array of objects
        if (typeof p.specs[0] === 'string') {
          description = p.specs.filter(s => s && s.trim()).join(', ');
        } else {
          description = p.specs
            .filter(spec => spec && spec.key && spec.value)
            .map(spec => `${spec.key}: ${spec.value}`)
            .join(', ');
        }
      }
      // Priority 5: Additional fields that might contain description
      else if (p.features && Array.isArray(p.features) && p.features.length > 0) {
        description = p.features.filter(f => f && f.trim()).join(', ');
      } else if (p.characteristics && typeof p.characteristics === 'string' && p.characteristics.trim()) {
        description = p.characteristics;
      }
      
      // Final fallback - use product name if no description found
      if (!description || !description.trim()) {
        const productName = typeof p.name === 'object' ? 
          (p.name.EN || Object.values(p.name)[0] || 'Product') : 
          (p.name || 'Product');
        description = `${productName} - Product details will be provided.`;
      }
      
      console.log(`Commercial Product ${i + 1} description extraction:`, {
        productId: p.id,
        productName: typeof p.name === 'object' ? (p.name.EN || Object.values(p.name)[0]) : p.name,
        hasDescription: !!(p.description),
        hasTechnicalDescription: !!(p.technicalDescription),
        hasDetails: !!(p.details),
        hasSeo: !!(p.seo?.description),
        hasSpecs: !!(p.specs && p.specs.length),
        hasSpecifications: !!(p.specifications && p.specifications.length),
        descriptionType: typeof p.description,
        finalDescription: description.substring(0, 100) + (description.length > 100 ? '...' : '')
      });
      
      return {
        number: (i + 1).toString(),
        name: typeof p.name === 'object' ? (p.name.EN || Object.values(p.name)[0] || '') : (p.name || 'Product Name'),
        description: description, // Use the properly extracted description
        unit: p.unit || 'SET',
        quantity: p.quantity || 1,
        unitPrice: p.unitPrice || p.price || 0,
        imageMeta,
        raw: p,
        isTechnical: false
      };
    }));

    this.data = {
      company: {
        name: this._toPlainString(companyData.name || proposal.companyName || 'LLC «ELECTRO-MECHANICAL CONSTRUCTION TECHNOLOGY»'),
        shortName: this._toPlainString(proposal.companyShort || (sendingCompany === 'emctech' ? 'EMC Technology' : 'Innova Mechanics Ltd')),
        address: this._toPlainString(companyData.address || proposal.address || 
          (sendingCompany === 'emctech' 
            ? 'Tashkent city, Yunusabad district, Bogishamol 21B'
            : 'Unit 19E Cherwell Business Village, Southam Road, Banbury, Oxford, OX16 2SP, UK')),
        phone: this._toPlainString(companyData.phone || proposal.phone || 
          (sendingCompany === 'emctech' ? '+998 90 122 55 18' : '+44 1865 602161')),
        email: this._toPlainString(companyData.email || proposal.email || 
          (sendingCompany === 'emctech' ? 'info@emctech.uz' : 'info@innovamechanics.com')),
        website: this._toPlainString(companyData.website || 
          (sendingCompany === 'innovamechanics' ? 'www.innovamechanics.com' : '')),
        bankAccount: this._toPlainString(companyData.bankAccount || proposal.bankAccount || '2020 8000 0052 8367 7001'),
        mfo: this._toPlainString(companyData.mfo || proposal.mfo || '08419'),
        taxId: this._toPlainString(companyData.taxId || proposal.taxId || '307 738 207'),
        oked: this._toPlainString(companyData.oked || proposal.oked || '43299')
      },
      metadata: {
        number: this._toPlainString(proposal.proposalNumber || proposal.number || 'NoEMC28/0214'),
        date: this._toPlainString(proposal.proposalDate || proposal.date || new Date().toLocaleDateString('en-GB')),
        recipient: this._toPlainString(proposal.recipient || proposal.clientName || 'To Directorate of ENERSOK FE LCC'),
        documentNumber: this._toPlainString(proposal.documentNumber || '')
      },
      terms: {
        payment: this._toPlainString(termsData.paymentTerms || proposal.paymentTerms || '50 % prepayment'),
        deliveryTime: this._toPlainString(termsData.deliveryTime || proposal.deliveryTime || '6-12 weeks'),
        delivery: this._toPlainString(termsData.incoterms || proposal.deliveryTerms || 'DDP'),
        validity: this._toPlainString(proposal.validity || '30 days'),
        warranty: this._toPlainString(proposal.warranty || 'Standard manufacturer warranty applies')
      },
      signatory: this._toPlainString(proposal.authorizedSignatory || proposal.signatory || 'S.S. Abdushakarov'),
      products,
      sendingCompany,
      isTechnical: false,
      hasImages,
      templateType
    };

    try { this.data.partnerLogos = await this.loadPartnerLogos(); } catch (e) { this.data.partnerLogos = []; }

    this.data.subtotal = (this.data.products || []).reduce((s, p) => s + (p.unitPrice * p.quantity), 0);
    this.data.taxAmount = this.data.subtotal * 0.12;
    this.data.grandTotal = this.data.subtotal + this.data.taxAmount;
  }
}
  // ... (rest of the PDF rendering methods remain the same)
  renderTable() {
    this.renderTableHeader();
    this.renderCategoryRow(this.data.isTechnical ? 'TECHNICAL ITEMS' : 'TESTING AND MEASURING EQUIPMENT');
    const arr = this.data.isTechnical ? this.data.items : this.data.products;
    for (const product of arr) {
      this.renderProductRowWithFlow(product);
    }
    this.layout.moveDown(6);
  }

  renderTableHeader() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    const headers = [
      'No', 'Product Description', 'Technical Specifications', 
      'Image', 'Unit', 'Qty', 'Unit Price (USD)', 'Total (USD)'
    ];
    
    const headerPadding = PDF_CONFIG.table.cellPadding;
    const headerFits = [];
    let maxHeaderInnerHeight = 0;
    
    for (let i = 0; i < headers.length; i++) { 
      const w = this.colWidths[i] - headerPadding * 2;
      const fit = this.measurer.fitFontSizeToBox(headers[i], 'helvetica', PDF_CONFIG.fonts.tableHeaderSize, 8, w, 20);
      headerFits.push(fit);
      const h = fit.lines.length * this.lineHeightForFontSize(fit.fontSize);
      if (h > maxHeaderInnerHeight) maxHeaderInnerHeight = h; 
    }
    
    const headerH = Math.max(PDF_CONFIG.table.defaultMinRowHeight, maxHeaderInnerHeight + headerPadding * 2);
    
    if (layout.getY() + headerH + 8 > layout.pageHeight - margin) { 
      layout.addPage(); 
    }
    
    const startY = layout.getY(); 
    
    doc.setFillColor(...PDF_CONFIG.colors.primary);
    doc.roundedRect(margin, startY, this.usableWidth, headerH, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold'); 
    doc.setTextColor(255, 255, 255);

    let x = margin; 
    for (let i = 0; i < headers.length; i++) { 
      const w = this.colWidths[i]; 
      const fit = headerFits[i];
      const innerH = fit.lines.length * this.lineHeightForFontSize(fit.fontSize);
      const centerX = x + w / 2;
      const startLineY = startY + (headerH / 2) - (innerH / 2) + (this.lineHeightForFontSize(fit.fontSize) / 2);
      
      doc.setFontSize(fit.fontSize);
      fit.lines.forEach((ln, idx) => { 
        doc.text(ln, centerX, startLineY + idx * this.lineHeightForFontSize(fit.fontSize), { align: 'center' }); 
      });
      
      if (this.debug) this._debugBox(x, startY, w, headerH, fit.fontSize, fit.lines);
      x += w; 
    }
    
    doc.setDrawColor(...PDF_CONFIG.colors.primary);
    doc.setLineWidth(0.3);
    x = margin; 
    for (let i = 0; i < this.colWidths.length; i++) { 
      doc.rect(x, startY, this.colWidths[i], headerH); 
      x += this.colWidths[i]; 
    }
    
    layout.moveDown(headerH + 4);
  }

  renderCategoryRow(text) { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    const padding = PDF_CONFIG.table.cellPadding; 
    
    const fit = this.measurer.fitFontSizeToBox(text, 'helvetica', 10, 8, this.usableWidth - padding * 2, 20);
    const textH = fit.lines.length * this.lineHeightForFontSize(fit.fontSize); 
    const h = Math.max(PDF_CONFIG.table.categoryRowHeight, textH + padding * 2);
    
    if (layout.getY() + h + 6 > layout.pageHeight - margin) {
      layout.addPage(); 
    } 
    
    const startY = layout.getY(); 
    
    doc.setFillColor(...PDF_CONFIG.colors.secondary);
    doc.roundedRect(margin, startY, this.usableWidth, h, 1, 1, 'F');
    
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(fit.fontSize); 
    doc.setTextColor(255, 255, 255); 
    
    const textY = startY + padding + (this.lineHeightForFontSize(fit.fontSize) * 0.8);
    fit.lines.forEach((ln, idx) => { 
      doc.text(ln, margin + padding, textY + idx * this.lineHeightForFontSize(fit.fontSize)); 
    });
    
    doc.setDrawColor(...PDF_CONFIG.colors.secondary);
    doc.setLineWidth(0.3);
    doc.rect(margin, startY, this.usableWidth, h); 
    
    if (this.debug) {
      this._debugBox(margin, startY, this.usableWidth, h, fit.fontSize, fit.lines);
    }
    
    layout.moveDown(h + 3); 
  }

renderProductRowWithFlow(product) { 
  const doc = this.doc; 
  const layout = this.layout; 
  const margin = PDF_CONFIG.page.margin; 
  const padding = PDF_CONFIG.table.cellPadding; 

  const arr = this.data.isTechnical ? this.data.items : this.data.products;
  const rowIndex = arr.indexOf(product);

  const nameW = this.colWidths[1] - padding * 2;
  const nameFit = this.measurer.fitFontSizeToBox(
    product.name, 
    'helvetica', 
    PDF_CONFIG.fonts.tableTitleSize,
    PDF_CONFIG.fonts.minTableBodySize, 
    nameW, 
    50
  );
  
  const descW = this.colWidths[2] - padding * 2;
  const descFit = this.measurer.fitFontSizeToBox(
    product.description,
    'helvetica', 
    PDF_CONFIG.fonts.tableBodySize, 
    PDF_CONFIG.fonts.minTableBodySize, 
    descW, 
    60
  );
  
  const imageCellW = this.colWidths[3] - padding * 2;
  const imageMaxH = PDF_CONFIG.table.imageMaxHeight;
  const imageMaxW = PDF_CONFIG.table.imageMaxWidth;
  
  const nameHeight = nameFit.lines.length * this.lineHeightForFontSize(nameFit.fontSize);
  const descHeight = descFit.lines.length * this.lineHeightForFontSize(descFit.fontSize);
  const imageHeight = product.imageMeta ? Math.min(imageMaxH, Math.max(nameHeight, descHeight)) : 0;
  
  // FIXED: Limit the content height to prevent excessively tall rows
  const maxContentHeight = 40; // Maximum content height in mm
  const contentHeight = Math.min(maxContentHeight, Math.max(
    Math.max(nameHeight, descHeight, imageHeight),
    PDF_CONFIG.table.defaultMinRowHeight
  ));
  
  // FIXED: Calculate row height more conservatively
  const rowHeight = Math.max(
    PDF_CONFIG.table.defaultMinRowHeight, 
    contentHeight + padding * 2
  );

  // FIXED: Use proper space calculation without excessive reserved space
  if (layout.getY() + rowHeight > layout.pageHeight - margin - 20) {
    layout.addPage(); 
  }

  const rowY = layout.getY();
  
  if (rowIndex % 2 === 0) {
    doc.setFillColor(...PDF_CONFIG.colors.lightGray);
    doc.rect(margin, layout.getY(), this.usableWidth, rowHeight, 'F'); // FIXED: Add height to fill
  }
  
  doc.setDrawColor(...PDF_CONFIG.colors.mediumGray);
  doc.setLineWidth(0.2);
  let x = margin; 
  for (let i = 0; i < this.colWidths.length; i++) { 
    doc.rect(x, rowY, this.colWidths[i], rowHeight); 
    x += this.colWidths[i]; 
  }

  x = margin; 
  
  // Number column
  doc.setFont('helvetica', 'bold'); 
  doc.setFontSize(10);
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  const numX = x + this.colWidths[0] / 2; 
  const numY = rowY + rowHeight / 2 + 2; 
  doc.text(product.number, numX, numY, { align: 'center' });
  x += this.colWidths[0];

  // Name column
  doc.setFont('helvetica', 'bold'); 
  doc.setFontSize(nameFit.fontSize);
  doc.setTextColor(...PDF_CONFIG.colors.primary);
  const nameStartY = rowY + padding + 2;
  nameFit.lines.forEach((ln, li) => { 
    const targetY = nameStartY + li * this.lineHeightForFontSize(nameFit.fontSize);
    if (targetY < rowY + rowHeight - 2) {
      doc.text(ln, x + padding, targetY); 
    }
  });
  
  if (this.debug) {
    this._debugBox(x, rowY, this.colWidths[1], rowHeight, nameFit.fontSize, nameFit.lines);
  }
  x += this.colWidths[1];

  // Description column
  doc.setFont('helvetica', 'normal'); 
  doc.setFontSize(descFit.fontSize);
  doc.setTextColor(...PDF_CONFIG.colors.darkGray);
  const descStartY = rowY + padding + 2;
  descFit.lines.forEach((ln, i) => { 
    const targetY = descStartY + i * this.lineHeightForFontSize(descFit.fontSize);
    if (targetY < rowY + rowHeight - 2) {
      doc.text(ln, x + padding, targetY); 
    }
  });
  
  if (this.debug) {
    this._debugBox(x, rowY, this.colWidths[2], rowHeight, descFit.fontSize, descFit.lines);
  }
  x += this.colWidths[2];

  // Image column
  if (product.imageMeta && product.imageMeta.dataUrl) {
    try {
      const imgX = x + padding;
      const imgY = rowY + padding;
      const maxImgW = Math.min(imageMaxW, this.colWidths[3] - padding * 2);
      const maxImgH = Math.min(imageMaxH, rowHeight - padding * 2);

      let targetW = maxImgW;
      const pmw = product.imageMeta.width || 1;
      const pmh = product.imageMeta.height || 1;
      let targetH = (pmh / pmw) * targetW;

      if (targetH > maxImgH) {
        targetH = maxImgH;
        targetW = (pmw / pmh) * targetH;
      } else {
        const optimalW = Math.min(maxImgW, (pmw / pmh) * maxImgH);
        if (optimalW > targetW * 0.8) {
          targetW = optimalW;
          targetH = (pmh / pmw) * targetW;
        }
      }

      const finalX = Math.max(imgX, x + (this.colWidths[3] - targetW) / 2);
      const finalY = Math.max(imgY, rowY + (rowHeight - targetH) / 2);

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(finalX - 1, finalY - 1, targetW + 2, targetH + 2);

      const mime = (product.imageMeta.mime && product.imageMeta.mime.includes('png')) ? 'PNG' : 'JPEG';
      doc.addImage(product.imageMeta.dataUrl, mime, finalX, finalY, targetW, targetH);
    } catch (e) {
      console.warn('addImage failed', e);
      this.renderEnhancedImagePlaceholder(x, rowY, this.colWidths[3], rowHeight, product.name);
    }
  } else {
    this.renderEnhancedImagePlaceholder(x, rowY, this.colWidths[3], rowHeight, product.name);
  }
  
  if (this.debug) {
    this._debugBox(x, rowY, this.colWidths[3], rowHeight, 7, []);
  }
  x += this.colWidths[3];

  // Unit column
  doc.setFont('helvetica', 'normal'); 
  doc.setFontSize(9); 
  doc.setTextColor(...PDF_CONFIG.colors.darkGray);
  const unitText = String(product.unit).toUpperCase(); 
  const unitX = x + this.colWidths[4] / 2; 
  const unitY = rowY + rowHeight / 2 + 2; 
  doc.text(unitText, unitX, unitY, { align: 'center' });
  x += this.colWidths[4];

  // Quantity column - FIXED: This should show "Qty" not "City"
  doc.setFontSize(9); 
  doc.setFont('helvetica', 'bold');
  const qtyText = String(product.quantity); 
  const qtyX = x + this.colWidths[5] / 2; 
  const qtyY = rowY + rowHeight / 2 + 2; 
  doc.text(qtyText, qtyX, qtyY, { align: 'center' });
  x += this.colWidths[5];

  // Unit Price column
  doc.setFontSize(9); 
  doc.setFont('helvetica', 'bold');
  const priceText = Number(product.unitPrice).toFixed(2); 
  const priceX = x + this.colWidths[6] - padding; 
  const priceY = rowY + rowHeight / 2 + 2; 
  doc.text(priceText, priceX, priceY, { align: 'right' });
  x += this.colWidths[6];

  // Total column
  const total = (product.unitPrice * product.quantity) || 0; 
  doc.setFont('helvetica', 'bold'); 
  doc.setFontSize(10);
  doc.setTextColor(...PDF_CONFIG.colors.accent);
  const totalText = Number(total).toFixed(2); 
  const totalX = x + this.colWidths[7] - padding; 
  const totalY = rowY + rowHeight / 2 + 2; 
  doc.text(totalText, totalX, totalY, { align: 'right' });

  layout.moveDown(rowHeight + PDF_CONFIG.table.rowGap);
}

  renderEnhancedImagePlaceholder(x, y, w, h, productName) {
    const doc = this.doc;
    const padding = PDF_CONFIG.table.cellPadding;

    doc.setFillColor(250, 250, 250);
    doc.roundedRect(x + padding, y + padding, w - padding * 2, h - padding * 2, 3, 3, 'F');

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(x + padding, y + padding, w - padding * 2, h - padding * 2, 3, 3);

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');

    const placeholderText = 'No Image';
    const textWidth = doc.getTextWidth(placeholderText);
    const textX = x + (w - textWidth) / 2;
    const textY = y + h / 2 + 2;

    doc.setFillColor(180, 180, 180);
    doc.roundedRect(textX - 4, textY - 6, 8, 6, 1, 1, 'F');
    doc.setFillColor(200, 200, 200);
    doc.circle(textX, textY, 3, 'F');

    doc.text(placeholderText, textX, textY + 8);
  }

  renderTotals() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    const colWidths = this.colWidths; 
    const totalLabelWidth = colWidths.slice(0, 6).reduce((a, b) => a + b, 0); 
    const totalValueWidth = colWidths.slice(6).reduce((a, b) => a + b, 0); 
    const labelStartX = margin; 
    const valueStartX = margin + totalLabelWidth; 
    
    const rows = [
      { label: 'Subtotal USD:', value: this.data.subtotal, bg: PDF_CONFIG.colors.lightGray },
      { label: 'VAT 12%:', value: this.data.taxAmount, bg: PDF_CONFIG.colors.lightGray },
      { label: 'GRAND TOTAL USD:', value: this.data.grandTotal, bg: PDF_CONFIG.colors.blueHighlight }
    ];
    
    const rowH = 10;
    
    rows.forEach(r => { 
      if (this.layout.getY() + rowH > this.layout.pageHeight - margin) {
        this.layout.addPage(); 
      }
      
      doc.setFillColor(...r.bg); 
      doc.roundedRect(labelStartX, this.layout.getY(), totalLabelWidth, rowH, 1, 1, 'F');
      
      doc.setFillColor(...r.bg);
      doc.roundedRect(valueStartX, this.layout.getY(), totalValueWidth, rowH, 1, 1, 'F');
      
      doc.setDrawColor(...PDF_CONFIG.colors.mediumGray);
      doc.rect(labelStartX, this.layout.getY(), totalLabelWidth, rowH);
      doc.rect(valueStartX, this.layout.getY(), totalValueWidth, rowH);
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(9); 
      doc.setTextColor(...PDF_CONFIG.colors.darkGray);
      
      doc.text(r.label, labelStartX + totalLabelWidth - 5, this.layout.getY() + 6, { align: 'right' });
      
      doc.setTextColor(...PDF_CONFIG.colors.accent);
      doc.text(Number(r.value).toFixed(2), valueStartX + totalValueWidth - 5, this.layout.getY() + 6, { align: 'right' });
      
      this.layout.moveDown(rowH); 
    }); 
    
    this.layout.moveDown(10); 
  }

  renderNotes() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(10); 
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('TERMS & CONDITIONS:', margin, layout.getY()); 
    layout.moveDown(6); 
    
    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(9);
    doc.setTextColor(...PDF_CONFIG.colors.darkGray);
    
    const notes = [
      { label: '1. Payment Terms:', text: this.data.terms.payment },
      { label: '2. Delivery Time:', text: this.data.terms.deliveryTime },
      { label: '3. Delivery Terms:', text: this.data.terms.delivery },
      { label: '4. Validity:', text: `This offer is valid for ${this.data.terms.validity} from the proposal date.` },
      { label: '5. Warranty:', text: this.data.terms.warranty }
    ];
    
    const bulletIndent = 5; 
    const lineHeight = this.lineHeightForFontSize(9);
    const labelSpacing = 2;
    
    notes.forEach(note => { 
      const labelText = note.label;
      const valueText = note.text;
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(9);
      const labelWidth = doc.getTextWidth(labelText);
      
      const availableWidth = layout.pageWidth - margin * 2 - bulletIndent - labelWidth - labelSpacing;
      
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(valueText, availableWidth);
      
      const blockH = valueLines.length * lineHeight + 2; 
      
      if (layout.getY() + blockH > layout.pageHeight - margin - 50) { 
        layout.addPage(); 
      }
      
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(9); 
      doc.setTextColor(...PDF_CONFIG.colors.primary);
      doc.text(labelText, margin + bulletIndent, layout.getY());
      
      doc.setFont('helvetica', 'normal'); 
      doc.setTextColor(...PDF_CONFIG.colors.darkGray);
      
      const textStartX = margin + bulletIndent + labelWidth + labelSpacing;
      
      valueLines.forEach((line, index) => {
        if (index === 0) {
          doc.text(line, textStartX, layout.getY());
        } else {
          layout.moveDown(lineHeight);
          doc.text(line, textStartX, layout.getY());
        }
      });
      
      layout.moveDown(lineHeight + 2);
      
      if (this.debug) {
        this._debugBox(margin, layout.getY() - blockH - 2, layout.pageWidth - margin * 2, blockH, 9, valueLines);
      }
    }); 
    
    layout.moveDown(8); 
  }

  renderSignature() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    const needed = 50; 
    
    if (layout.getY() + needed > layout.pageHeight - margin) {
      layout.addPage();
    }
    
    const sigY = layout.getY();
    
    const sectionWidth = (layout.pageWidth - margin * 2 - 10) / 2;
    
    const leftX = margin;
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(10); 
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text(`For ${this._toPlainString(this.data.company.shortName)}`, leftX, sigY);
    
    doc.setDrawColor(...PDF_CONFIG.colors.primary);
    doc.setLineWidth(0.8);
    doc.setLineDash([1, 1], 0);
    doc.roundedRect(leftX, sigY + 5, sectionWidth - 5, 25, 2, 2);
    doc.setLineDash([], 0);
    
    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(8); 
    doc.setTextColor(150, 150, 150);
    doc.text('Company Stamp Area', leftX + (sectionWidth - 5) / 2, sigY + 18, { align: 'center' });
    
    const rightX = margin + sectionWidth + 10;
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(10); 
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('Authorized Signature', rightX, sigY);
    
    layout.drawLine(rightX, sigY + 20, rightX + sectionWidth - 5, sigY + 20, PDF_CONFIG.colors.primary, 0.8);
    
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(10); 
    doc.setTextColor(...PDF_CONFIG.colors.accent);
    doc.text(this._toPlainString(this.data.signatory), rightX + (sectionWidth - 5) / 2, sigY + 28, { align: 'center' });
    
    doc.setFont('helvetica', 'normal'); 
    doc.setFontSize(8); 
    doc.setTextColor(...PDF_CONFIG.colors.darkGray);
    doc.text('General Manager', rightX + (sectionWidth - 5) / 2, sigY + 32, { align: 'center' });
    
    layout.moveDown(needed);
  }

  renderLogos() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    
    if (layout.getY() + 35 > layout.pageHeight - margin) {
      layout.addPage();
    }
    
    layout.drawLine(margin, layout.getY(), layout.pageWidth - margin, layout.getY(), PDF_CONFIG.colors.primary, 0.5);
    layout.moveDown(8);
    
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(9); 
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.text('OUR PARTNERS', layout.pageWidth / 2, layout.getY(), { align: 'center' });
    layout.moveDown(6);
    
    const partnerLogos = this.data.partnerLogos || [];
    const maxPerRow = 3;
    const gap = 15;
    const logoW = Math.min(50, Math.max(30, (layout.pageWidth - margin * 2 - (gap * (maxPerRow - 1))) / maxPerRow)); 
    const logoH = 18;
    const rows = Math.ceil(Math.max(1, partnerLogos.length) / maxPerRow);
    
    let currentIndex = 0; 
    for (let r = 0; r < rows; r++) { 
      const itemsInRow = Math.min(maxPerRow, Math.max(1, partnerLogos.length) - currentIndex); 
      const totalWidth = itemsInRow * logoW + (itemsInRow - 1) * gap; 
      let startX = Math.max(margin, (layout.pageWidth - totalWidth) / 2);
      
      for (let c = 0; c < itemsInRow; c++, currentIndex++) { 
        const logoMeta = partnerLogos[currentIndex];
        if (logoMeta && logoMeta.dataUrl) {
          this.renderPartnerLogo(startX, layout.getY(), logoW, logoH, logoMeta);
        } else {
          this.renderPartnerLogoPlaceholder(startX, layout.getY(), logoW, logoH, `Partner ${currentIndex + 1}`);
        }
        startX += logoW + gap; 
      }
      layout.moveDown(logoH + 8);
    }
    
    doc.setTextColor(0, 0, 0);
  }

  renderPartnerLogo(x, y, w, h, logoMeta) {
    const doc = this.doc;
    const padding = 2;

    try {
      const maxImgW = w - padding * 2;
      const maxImgH = h - padding * 2;

      let targetW = maxImgW;
      const pmw = logoMeta.width || 1;
      const pmh = logoMeta.height || 1;
      let targetH = (pmh / pmw) * targetW;

      if (targetH > maxImgH) {
        targetH = maxImgH;
        targetW = (pmw / pmh) * targetH;
      }

      const finalX = x + (w - targetW) / 2;
      const finalY = y + (h - targetH) / 2;

      const mime = (logoMeta.mime && logoMeta.mime.includes('png')) ? 'PNG' : 'JPEG';
      doc.addImage(logoMeta.dataUrl, mime, finalX, finalY, targetW, targetH);
    } catch (e) {
      console.warn('Partner logo render failed', e);
      this.renderPartnerLogoPlaceholder(x, y, w, h, 'Partner Logo');
    }
  }

  renderPartnerLogoPlaceholder(x, y, w, h, partnerName) {
    const doc = this.doc;
    
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, w, h, 3, 3);

    doc.setFontSize(6);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');

    const lines = doc.splitTextToSize(partnerName, w - 6);
    const lineH = 3.5;
    const textHeight = lines.length * lineH;
    const startY = y + (h - textHeight) / 2 + 1;

    lines.forEach((line, idx) => {
      doc.text(line, x + w / 2, startY + idx * lineH, { align: 'center' });
    });

    doc.setFontSize(5);
    doc.setTextColor(200, 200, 200);
    doc.text('LOGO', x + w / 2, y + h - 4, { align: 'center' });
  }

  async loadPartnerLogos() {
    const partnerUrls = [
      'https://i.ibb.co/Kc08wPDR/Whats-App-Image-2025-10-21-at-13-34-35-4adb7bae.jpg',
      'https://i.ibb.co/QFwSvL9x/Whats-App-Image-2025-10-21-at-13-34-35-74d70f65.jpg',
      'https://i.ibb.co/wZwb8gCL/Whats-App-Image-2025-10-21-at-13-34-35-0976c6a2.jpg',
      'https://i.ibb.co/3Yscy8Rd/Whats-App-Image-2025-10-21-at-13-34-35-523241c3.jpg',
      'https://i.ibb.co/cK0XdCJc/Whats-App-Image-2025-10-21-at-13-34-35-cace941f.jpg',
      'https://i.ibb.co/ZzCh1L7F/Whats-App-Image-2025-10-21-at-13-34-35-2932b94c.jpg',
      'https://i.ibb.co/zH6MRy77/Whats-App-Image-2025-10-21-at-13-35-41-3188f9a7.jpg',
      'https://i.ibb.co/nqJM2YcF/Whats-App-Image-2025-10-21-at-13-35-41-b5c1f037.jpg',
      'https://i.ibb.co/0N2C13p/Whats-App-Image-2025-10-22-at-15-57-33-e016779a.jpg'
    ];
    const loaded = [];
    for (const url of partnerUrls) {
      try {
        const meta = await this.imageLoader.loadImage(url, PDF_CONFIG.images.maxDimensionPx);
        loaded.push(meta || null);
      } catch (e) {
        console.warn('Failed to load partner logo', e);
        loaded.push(null);
      }
    }
    return loaded;
  }

  renderHeader() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    const y = layout.getY(); 
    const pageW = layout.pageWidth; 

    const logoW = PDF_CONFIG.images.logoWidth;
    const logoH = PDF_CONFIG.images.logoHeight;
    const headerPadding = PDF_CONFIG.spacing.md;
    const headerContentWidth = pageW - margin * 2;

    const companyInfoWidth = headerContentWidth * 0.65;
    const metadataWidth = headerContentWidth * 0.35;

    const companyNameFit = this.measurer.fitFontSizeToBox(
      this.data.company.name, 
      'helvetica', 
      PDF_CONFIG.fonts.headerSize, 
      10, 
      companyInfoWidth, 
      12
    );
    const contactLine1 = `${this.data.company.address}`;
    const contactLine2 = `Phone: ${this.data.company.phone}`;
    const contactLine3 = `Bank: ${this.data.company.bankAccount}`;
    const contactLine4 = this.data.company.website
      ? `Website: ${this.data.company.website}`
      : `Bank: ${this.data.company.bankAccount}`;
    const contactLine5 = !this.data.company.website
      ? `MFO: ${this.data.company.mfo} | ID: ${this.data.company.taxId}`
      : '';
    const contactFit1 = this.measurer.fitFontSizeToBox(contactLine1, 'helvetica', 7, 6, companyInfoWidth, 8);
    const contactFit2 = this.measurer.fitFontSizeToBox(contactLine2, 'helvetica', 7, 6, companyInfoWidth, 8);
    const contactFit3 = this.measurer.fitFontSizeToBox(contactLine3, 'helvetica', 7, 6, companyInfoWidth, 8);
    const contactFit4 = this.measurer.fitFontSizeToBox(contactLine4, 'helvetica', 7, 6, companyInfoWidth, 8);
    const contactFit5 = this.measurer.fitFontSizeToBox(contactLine5, 'helvetica', 7, 6, companyInfoWidth, 8);

    const totalTextHeight = companyNameFit.totalHeight + 
      contactFit1.totalHeight + 
      contactFit2.totalHeight + 
      contactFit3.totalHeight + 
      contactFit4.totalHeight + 
      contactFit5.totalHeight + 
      (PDF_CONFIG.spacing.xs * 3);

    const headerHeight = Math.max(logoH + headerPadding * 2, totalTextHeight + headerPadding * 2);

    if (layout.getY() + headerHeight > layout.pageHeight - margin) {
      layout.addPage();
    }

    const logoX = margin;
    const logoY = y + (headerHeight - logoH) / 2;
    let logoToUse = null;
    if (this.data.sendingCompany === 'emctech' && this.logos.emc && this.logos.emc.dataUrl) {
      logoToUse = this.logos.emc;
    } else if (this.data.sendingCompany === 'innovamechanics' && this.logos.innova && this.logos.innova.dataUrl) {
      logoToUse = this.logos.innova;
    }
    if (logoToUse) {
      try {
        const maxLogoW = logoW;
        const maxLogoH = logoH;
        let targetW = maxLogoW;
        const pmw = logoToUse.width || 1;
        const pmh = logoToUse.height || 1;
        let targetH = (pmh / pmw) * targetW;
        if (targetH > maxLogoH) {
          targetH = maxLogoH;
          targetW = (pmw / pmh) * targetH;
        }
        const finalX = logoX + (logoW - targetW) / 2;
        const finalY = logoY + (logoH - targetH) / 2;
        const mime = (logoToUse.mime && logoToUse.mime.includes('png')) ? 'PNG' : 'JPEG';
        doc.addImage(logoToUse.dataUrl, mime, finalX, finalY, targetW, targetH);
      } catch(e) {
        this.renderLogoPlaceholder(doc, logoX, logoY, logoW, logoH, this.data.company.shortName);
      }
    } else {
      this.renderLogoPlaceholder(doc, logoX, logoY, logoW, logoH, this.data.company.shortName);
    }

    const infoX = logoX + logoW + PDF_CONFIG.spacing.sm;
    const infoY = y + headerPadding;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(companyNameFit.fontSize);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    companyNameFit.lines.forEach((line, i) => {
      doc.text(line, infoX, infoY + i * this.lineHeightForFontSize(companyNameFit.fontSize));
    });

    let currentY = infoY + companyNameFit.totalHeight + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(contactFit1.fontSize);
    doc.setTextColor(...PDF_CONFIG.colors.darkGray);
    contactFit1.lines.forEach((line, i) => {
      doc.text(line, infoX, currentY + i * this.lineHeightForFontSize(contactFit1.fontSize));
    });
    currentY += contactFit1.totalHeight;
    contactFit2.lines.forEach((line, i) => {
      doc.text(line, infoX, currentY + i * this.lineHeightForFontSize(contactFit2.fontSize));
    });
    currentY += contactFit2.totalHeight;
    contactFit3.lines.forEach((line, i) => {
      doc.text(line, infoX, currentY + i * this.lineHeightForFontSize(contactFit3.fontSize));
    });
    currentY += contactFit3.totalHeight;
    contactFit4.lines.forEach((line, i) => {
      doc.text(line, infoX, currentY + i * this.lineHeightForFontSize(contactFit4.fontSize));
    });
    currentY += contactFit4.totalHeight;
    contactFit5.lines.forEach((line, i) => {
      doc.text(line, infoX, currentY + i * this.lineHeightForFontSize(contactFit5.fontSize));
    });

    let metadataStartY = infoY;
    if (currentY > infoY + 2) {
      metadataStartY = currentY + 2;
    }

    const metadataX = pageW - margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.accent);
    if (this.data.metadata.documentNumber) {
      doc.text(`Document: ${this.data.metadata.documentNumber}`, metadataX, metadataStartY, { align: 'right' });
      doc.text(`Proposal: ${this.data.metadata.number}`, metadataX, metadataStartY + 5, { align: 'right' });
      metadataStartY += 10;
    } else {
      doc.text(`Proposal: ${this.data.metadata.number}`, metadataX, metadataStartY, { align: 'right' });
      metadataStartY += 5;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PDF_CONFIG.colors.darkGray);
    doc.text(`Date: ${this.data.metadata.date}`, metadataX, metadataStartY, { align: 'right' });
    metadataStartY += 5;

    const recipientFit = this.measurer.fitFontSizeToBox(
      this.data.metadata.recipient, 
      'helvetica', 
      8, 
      6, 
      metadataWidth, 
      12
    );
    recipientFit.lines.forEach((line, i) => {
      doc.text(line, metadataX, metadataStartY + (i * 4), { align: 'right' });
    });

    const redLineY = y + headerHeight + PDF_CONFIG.spacing.sm;
    layout.drawLine(margin, redLineY, pageW - margin, redLineY, PDF_CONFIG.colors.redLine, 1);
    layout.setY(redLineY + PDF_CONFIG.spacing.md);

    if (this.debug) {
      this._debugBox(infoX, infoY, companyInfoWidth, totalTextHeight, companyNameFit.fontSize, companyNameFit.lines);
      this._debugBox(metadataX - metadataWidth, metadataStartY, metadataWidth, 25, 8, []);
    }
  }

  renderLogoPlaceholder(doc, x, y, w, h, text) {
    doc.setFillColor(...PDF_CONFIG.colors.primary);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(text, x + w / 2, y + h / 2 + 1, { align: 'center' });
  }

  renderTitle() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const centerX = layout.pageWidth / 2; 
    const titleText = this.data.isTechnical ? 'TECHNICAL OFFER' : 'COMMERCIAL OFFER';
    const titleBoxW = layout.pageWidth - PDF_CONFIG.page.margin * 2;
    const titleFit = this.measurer.fitFontSizeToBox(titleText, 'helvetica', PDF_CONFIG.fonts.titleSize, 11, titleBoxW, 15);
    doc.setFillColor(...PDF_CONFIG.colors.primary);
    doc.roundedRect(PDF_CONFIG.page.margin, layout.getY(), titleBoxW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); 
    doc.setFontSize(titleFit.fontSize); 
    doc.setTextColor(255, 255, 255); 
    doc.text(titleText, centerX, layout.getY() + 8, { align: 'center' }); 
    if (this.debug) {
      this._debugBox(PDF_CONFIG.page.margin, layout.getY(), titleBoxW, 14, titleFit.fontSize, titleFit.lines);
    }
    layout.moveDown(18);
  }

  renderIntro() { 
    const doc = this.doc; 
    const layout = this.layout; 
    const margin = PDF_CONFIG.page.margin; 
    const before = this.data.isTechnical 
      ? 'We are pleased to present our technical offer from '
      : 'We are pleased to present our commercial offer from ';
    const company = this.data.company.name;
    const after = this.data.isTechnical
      ? ' for the supply of technical equipment and services as detailed below:'
      : ' for the supply of high-quality products as detailed below:';
    const availableWidth = layout.pageWidth - margin * 2;
    const boxPadding = 6;
    const maxTextWidth = availableWidth - (boxPadding * 2);
    const introText = before + company + after;
    const introFit = this.measurer.fitFontSizeToBox(
      introText, 
      'helvetica', 
      PDF_CONFIG.fonts.bodySize, 
      9, 
      maxTextWidth, 
      50, 
      1.3
    );
    const lineHeight = this.lineHeightForFontSize(introFit.fontSize);
    const boxHeight = Math.max(30, introFit.totalHeight + 10);
    doc.setFillColor(...PDF_CONFIG.colors.lightGray);
    doc.roundedRect(margin, layout.getY(), availableWidth, boxHeight, 3, 3, 'F');
    doc.setDrawColor(...PDF_CONFIG.colors.primary);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, layout.getY(), availableWidth, boxHeight, 3, 3);
    const textY = layout.getY() + boxPadding;
    let currentX = margin + boxPadding;
    let currentY = textY;
    for (let lineIndex = 0; lineIndex < introFit.lines.length; lineIndex++) {
      const line = introFit.lines[lineIndex];
      currentX = margin + boxPadding;
      if (line.includes(company)) {
        const beforeIndex = line.indexOf(before);
        const companyIndex = line.indexOf(company);
        if (companyIndex > -1) {
          const beforeText = line.substring(0, companyIndex);
          if (beforeText) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(introFit.fontSize);
            doc.setTextColor(...PDF_CONFIG.colors.darkGray);
            doc.text(beforeText, currentX, currentY);
            currentX += doc.getTextWidth(beforeText);
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...PDF_CONFIG.colors.accent);
          doc.text(company, currentX, currentY);
          currentX += doc.getTextWidth(company);
          const afterText = line.substring(companyIndex + company.length);
          if (afterText) {
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...PDF_CONFIG.colors.darkGray);
            doc.text(afterText, currentX, currentY);
          }
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(introFit.fontSize);
        doc.setTextColor(...PDF_CONFIG.colors.darkGray);
        doc.text(line, currentX, currentY);
      }
      currentY += lineHeight;
    }
    if (this.debug) {
      this._debugBox(margin, layout.getY(), availableWidth, boxHeight, introFit.fontSize, introFit.lines);
    }
    layout.moveDown(boxHeight + 4);
  }

  _debugBox(x, y, w, h, fontSizePt, lines) {
    if (!this.debug) return;
    try {
      const doc = this.doc;
      doc.setDrawColor(255, 0, 0); 
      doc.setLineWidth(0.3);
      doc.rect(x, y, w, h);
      doc.setFontSize(5); 
      doc.setTextColor(255, 0, 0);
      const overlay = `fs:${fontSizePt}pt ln:${lines ? lines.length : 0}`;
      doc.text(overlay, x + 1, y + 1);
      doc.setTextColor(0, 0, 0);
    } catch(e) { /* ignore debug drawing errors */ }
  }

  async renderDocument() {
    this.renderHeader();
    this.renderTitle();
    this.renderIntro();
    this.renderTable();
    this.renderTotals();
    this.renderNotes();
    this.renderSignature();
    this.renderLogos();
  }

  async generate(proposalData, options = {}) {
    try {
      this.initializePDF(options);
      await this.prepareData(proposalData);
      this.colWidths = this.colPercentsToWidths();
      await this.renderDocument();
      const fileName = `${this.data.metadata.number || 'proposal'}-proposal.pdf`.replace(/[^^\w.-]/g, '_');
      this.doc.save(fileName);
      return fileName;
    } catch (err) {
      console.error('PDF generation failed', err);
      throw new PDFGenerationError('Failed to generate PDF', err);
    } finally {
      this.imageLoader.clearCache();
    }
  }
}

// Export functions
export async function downloadEMCProposalPdf(proposalData, options = {}) { 
  const gen = new EMCProposalPDF(); 
  return await gen.generate(proposalData, options); 
}

export { EMCProposalPDF, ImageLoader, PDFGenerationError };

export async function downloadProposalPdf(proposalData, options = {}) { 
  return downloadEMCProposalPdf(proposalData, options); 
}

export default downloadProposalPdf;