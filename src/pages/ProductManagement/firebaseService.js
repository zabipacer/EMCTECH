import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase/firebase';
import { COLLECTIONS, STORAGE_PATHS } from './constants';

export const productService = {
  async getAllProducts() {
    try {
      console.log('🔥 Fetching all products from Firestore...');
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const snapshot = await getDocs(productsRef);
      
      console.log('📊 Firestore snapshot:', snapshot);
      console.log('📄 Number of documents:', snapshot.docs.length);
      
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📦 Document ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log('✅ Final products array:', products);
      return products;
    } catch (error) {
      console.error('❌ Error getting products:', error);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
      const snapshot = await getDoc(docRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  },

 async createProduct(productData) {
  try {
    console.log('🚀 Creating NEW product in Firestore:', productData);
    const productsRef = collection(db, COLLECTIONS.PRODUCTS);
    
    // Prepare data for Firestore (ensure all fields exist)
    const firestoreData = {
      name: productData.name || { EN: '', RU: '', UZ: '' },
      sku: productData.sku || '',
      thumbnail: productData.thumbnail || '',
      price: productData.price || 0,
      cost: productData.cost || 0,
      stock: productData.stock || 0,
      lowStockThreshold: productData.lowStockThreshold || 5,
      category: productData.category || '',
      status: productData.status || 'draft',
      company: productData.company || 'Innova',
      seo: productData.seo || { slug: '', title: '', description: '' },
      specs: productData.specs || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📝 Data being saved to Firestore:', firestoreData);
    
    // Use addDoc to let Firestore auto-generate the ID
    const docRef = await addDoc(productsRef, firestoreData);
    
    const savedProduct = { 
      id: docRef.id, // Use the Firestore-generated ID
      ...firestoreData 
    };
    
    console.log('✅ Product created with Firestore ID:', docRef.id);
    console.log('💾 Saved product:', savedProduct);
    
    return savedProduct;
  } catch (error) {
    console.error('❌ Error creating product:', error);
    throw error;
  }
},

 async updateProduct(id, productData) {
  try {
    console.log('✏️ Updating existing product in Firestore:', id, productData);
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    
    // Remove ID from update data and ensure updatedAt is set
    const { id: _, ...updateData } = productData;
    
    const updatePayload = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    console.log('📝 Update payload:', updatePayload);
    
    await updateDoc(docRef, updatePayload);
    
    const updatedProduct = { id, ...updatePayload };
    console.log('✅ Product updated:', updatedProduct);
    return updatedProduct;
  } catch (error) {
    console.error('❌ Error updating product:', error);
    throw error;
  }
},

 async deleteProduct(id) {
  try {
    console.log('🗑️ Deleting single product:', id);
    const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
    await deleteDoc(docRef);
    console.log('✅ Product deleted successfully:', id);
    return id;
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }
},

async deleteMultipleProducts(ids) {
  try {
    console.log('🗑️ Deleting multiple products:', ids);
    const batch = writeBatch(db);
    
    ids.forEach(id => {
      const docRef = doc(db, COLLECTIONS.PRODUCTS, id);
      batch.delete(docRef);
    });
    
    await batch.commit();
    console.log('✅ Multiple products deleted successfully:', ids);
    return ids;
  } catch (error) {
    console.error('❌ Error deleting multiple products:', error);
    throw new Error(`Failed to delete products: ${error.message}`);
  }
}

};

export const fileService = {
  async uploadProductImage(file, productId) {
    try {
      console.log('📤 Starting file upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        productId
      });

      const fileExtension = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `${STORAGE_PATHS.PRODUCT_IMAGES}/${fileName}`);
      
      console.log('📁 Storage reference created:', storageRef.fullPath);

      // Upload file with metadata
      const metadata = {
        contentType: file.type,
      };

      console.log('⏫ Uploading with metadata:', metadata);
      
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('✅ Upload completed, getting download URL...');

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading product image:', error);
      console.error('📋 Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  },

  async deleteProductImage(imageUrl) {
    try {
      console.log('🗑️ Deleting product image:', imageUrl);
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.warn('⚠️ Failed to delete image:', error);
    }
  }
};