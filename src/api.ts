import { UserProfile, Product, Sale, UserRole } from './types';
import { 
  db, 
  auth, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  handleFirestoreError,
  OperationType
} from './firebase';

export const api = {
  auth: {
    me: async () => {
      const user = auth.currentUser;
      if (!user) return null;
      
      const path = `users/${user.uid}`;
      try {
        const userDoc = await getDoc(doc(db, path));
        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return null;
      }
    },
    list: async () => {
      const path = 'users';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        const users = querySnapshot.docs.map(doc => doc.data() as UserProfile);
        
        // Fetch sales to calculate stats
        const salesSnapshot = await getDocs(collection(db, 'sales'));
        const sales = salesSnapshot.docs.map(doc => doc.data() as Sale);
        
        return users.map(user => {
          const userSales = sales.filter(s => s.agentId === user.uid);
          return {
            ...user,
            salesCount: userSales.length,
            totalSales: userSales.reduce((acc, s) => acc + s.total, 0)
          };
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    approve: async (id: string) => {
      const path = `users/${id}`;
      try {
        await updateDoc(doc(db, path), { approved: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    delete: async (id: string) => {
      const path = `users/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    updateRole: async (id: string, role: UserRole) => {
      const path = `users/${id}`;
      try {
        await updateDoc(doc(db, path), { role });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
  },
  products: {
    list: async () => {
      const path = 'products';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => doc.data() as Product);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    create: async (data: Partial<Product>) => {
      const id = Date.now().toString();
      const path = `products/${id}`;
      const product = { ...data, id, updatedAt: new Date().toISOString() } as Product;
      try {
        await setDoc(doc(db, path), product);
        return product;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        return null;
      }
    },
    update: async (id: string, data: Partial<Product>) => {
      const path = `products/${id}`;
      const updateData = { ...data, updatedAt: new Date().toISOString() };
      try {
        await updateDoc(doc(db, path), updateData);
        return updateData;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        return null;
      }
    },
    delete: async (id: string) => {
      const path = `products/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
  },
  sales: {
    list: async () => {
      const path = 'sales';
      try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => doc.data() as Sale);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    create: async (data: Partial<Sale>) => {
      const id = Date.now().toString();
      const path = `sales/${id}`;
      const sale = { ...data, id, createdAt: new Date().toISOString() } as Sale;
      try {
        await setDoc(doc(db, path), sale);
        
        // Decrement stock for each item
        if (data.items) {
          for (const item of data.items) {
            const productRef = doc(db, `products/${item.productId}`);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              const currentQty = productSnap.data().quantity || 0;
              await updateDoc(productRef, {
                quantity: Math.max(0, currentQty - item.quantity)
              });
            }
          }
        }
        
        return sale;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        return null;
      }
    },
    update: async (id: string, data: Partial<Sale>) => {
      const path = `sales/${id}`;
      try {
        await updateDoc(doc(db, path), data);
        return data;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        return null;
      }
    },
    delete: async (id: string) => {
      const path = `sales/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
  },
};
