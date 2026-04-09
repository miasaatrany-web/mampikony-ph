import { UserProfile, Product, Sale, UserRole, InventoryLog } from './types';
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
import { writeBatch } from 'firebase/firestore';

export const api = {
  auth: {
    me: async () => {
      if (!auth.currentUser) return null;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        return userDoc.exists() ? userDoc.data() as UserProfile : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
        return null;
      }
    },
    list: async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => doc.data() as UserProfile);
        
        const salesSnap = await getDocs(collection(db, 'sales'));
        const sales = salesSnap.docs.map(doc => doc.data() as Sale);
        
        return users.map(user => {
          const userSales = sales.filter(s => 
            (s.cashierId === user.uid) || 
            (!s.cashierId && s.agentId === user.uid && s.status === 'paid')
          );
          return {
            ...user,
            salesCount: userSales.length,
            totalSales: userSales.reduce((acc, s) => acc + s.total, 0)
          };
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
        return [];
      }
    },
    approve: async (uid: string) => {
      try {
        await updateDoc(doc(db, 'users', uid), { approved: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    },
    delete: async (uid: string) => {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
      }
    },
    updateRole: async (uid: string, role: UserRole) => {
      try {
        await updateDoc(doc(db, 'users', uid), { role });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      }
    },
    login: async (data: any) => {
      // This is now handled by Firebase Auth directly in AuthProvider
      return null;
    },
    register: async (data: any) => {
      // This is now handled by Firebase Auth directly in AuthProvider
      return null;
    }
  },
  products: {
    list: async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        return snap.docs.map(doc => doc.data() as Product);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'products');
        return [];
      }
    },
    create: async (data: Partial<Product>) => {
      const id = Date.now().toString();
      const product = { ...data, id, updatedAt: new Date().toISOString() } as Product;
      try {
        await setDoc(doc(db, 'products', id), product);
        return product;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
        throw error;
      }
    },
    update: async (id: string, data: Partial<Product>) => {
      try {
        await updateDoc(doc(db, 'products', id), { ...data, updatedAt: new Date().toISOString() });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
      }
    },
    resetQuantities: async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.update(d.ref, { totalQuantityPillules: 0, pharmacyQuantityPillules: 0, updatedAt: new Date().toISOString() });
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'products');
      }
    },
    clearPharmacy: async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.update(d.ref, { pharmacyQuantityPillules: 0, showInPharmacy: false, updatedAt: new Date().toISOString() });
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'products');
      }
    },
    resetPurchasePrices: async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.update(d.ref, { 
            purchasePriceBoite: 0, 
            purchasePricePlaquette: 0, 
            purchasePricePillule: 0, 
            updatedAt: new Date().toISOString() 
          });
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'products');
      }
    },
    deleteAll: async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'products');
      }
    },
  },
  sales: {
    list: async () => {
      try {
        const snap = await getDocs(collection(db, 'sales'));
        return snap.docs.map(doc => doc.data() as Sale);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'sales');
        return [];
      }
    },
    create: async (data: Partial<Sale>) => {
      const id = Date.now().toString();
      const createdAt = new Date().toISOString();
      const sale = { ...data, id, createdAt } as Sale;
      try {
        await setDoc(doc(db, 'sales', id), sale);
        return sale;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `sales/${id}`);
        throw error;
      }
    },
    update: async (id: string, data: Partial<Sale>) => {
      try {
        await updateDoc(doc(db, 'sales', id), data);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `sales/${id}`);
      }
    },
    delete: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'sales', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `sales/${id}`);
      }
    },
    deleteAll: async () => {
      try {
        const snap = await getDocs(collection(db, 'sales'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'sales');
      }
    },
  },
  inventoryLogs: {
    list: async () => {
      try {
        const snap = await getDocs(collection(db, 'inventory-logs'));
        return snap.docs.map(doc => doc.data() as InventoryLog);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'inventory-logs');
        return [];
      }
    },
    create: async (data: any) => {
      const id = Math.random().toString(36).substring(2, 11);
      const createdAt = new Date().toISOString();
      const log = { ...data, id, createdAt };
      try {
        await setDoc(doc(db, 'inventory-logs', id), log);
        return log;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `inventory-logs/${id}`);
        throw error;
      }
    },
    deleteAll: async () => {
      try {
        const snap = await getDocs(collection(db, 'inventory-logs'));
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'inventory-logs');
      }
    }
  }
};
