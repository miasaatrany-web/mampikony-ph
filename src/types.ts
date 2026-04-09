export type UserRole = 'admin' | 'agent' | 'caissier';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  approved: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  // Selling Prices
  priceBoite: number;
  pricePlaquette: number;
  pricePillule: number;
  // Purchase Prices
  purchasePriceBoite: number;
  purchasePricePlaquette: number;
  purchasePricePillule: number;
  // Conversion factors
  packsPerBox: number;
  pillsPerPack: number;
  // Stock (Stored in the smallest unit: pillule)
  totalQuantityPillules: number;
  pharmacyQuantityPillules: number;
  source: 'pharmacie' | 'grossiste';
  grossisteName?: string;
  showInPharmacy: boolean;
  showInStock: boolean;
  lowStockThresholdPillules: number;
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
  cashierId?: string;
  cashierName?: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'addition' | 'transfer_to_pharmacy' | 'return_to_stock' | 'stock_exit';
  quantityPillules: number;
  details: string;
  userId: string;
  userName: string;
  createdAt: string;
}
