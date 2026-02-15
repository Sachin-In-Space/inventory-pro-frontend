export type ProductStatus = 'Active' | 'Inactive' | 'Out of Stock';

export interface ProductVariant {
  unit: string; // e.g., '1kg', '500g', '1 Dozen'
  mrp: number;
  sellingPrice: number;
}

export interface Product {
  id: string; // MongoDB ObjectId
  sku: string;
  name: string;
  description: string;
  category: string;
  status: ProductStatus;
  tags: string[];
  brand: string;
  attributes: { [key: string]: string };
  imageUrl?: string;
  variants: ProductVariant[];
  totalStockGrams: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface AuditLog {
  id: number;
  timestamp: Date;
  user: string;
  action: string;
  details: string;
  productId?: string; // Changed
  productName?: string;
  orderId?: string; // Changed
}

export type UserRole = 'Admin' | 'InventoryManager' | 'Viewer' | 'Captain' | 'Delivery' | 'Super';

export interface User {
  name: string;
  role: UserRole;
  permissions: string[];
}

// New Order Models
export type OrderStatus = 'ORDER-CREATED' | 'IN-DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string; // Changed
  productName: string;
  quantity: number;
  price: number;
  variantUnit: string;
  imageUrl?: string;
}

export interface Order {
  id: string; // Changed
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User's name
}