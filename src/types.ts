export type UserRole = 'admin' | 'agent';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  expirationDate: string;
  lowStockThreshold?: number;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  customerName?: string;
  items: SaleItem[];
  total: number;
  agentId: string;
  agentName?: string;
  status: 'pending' | 'paid';
  createdAt: string;
}
