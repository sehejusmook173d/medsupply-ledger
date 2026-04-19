export type SupplyRole = "provider" | "manufacturer" | "distributor" | "retailer"

export interface MvpUser {
  walletAddress: string
  address: string
  role: SupplyRole
  name: string
  companyName: string
  email: string
  phone?: string
  location?: string
  registrationId?: string
  licenseNumber?: string
  verified?: boolean
  billNotificationsEnabled?: boolean
  createdAt: string
  updatedAt: string
}

export interface MvpInventoryItem {
  _id: string
  name: string
  description: string
  quantity: number
  price: number
  category: string
  imageUrl?: string
}

export interface MvpProduct {
  _id: string
  productId: string
  name: string
  category: string
  description: string
  manufacturer: string
  batchNumber?: string
  manufactureDate: string
  expiryDate: string
  price: number
  quantity: number
  unit: string
  imageUrl?: string
  status: "Available" | "Low Stock" | "Out of Stock"
}

export type OrderStatus = "Pending" | "Approved" | "Rejected"

export interface MvpOrder {
  orderId: string
  from: string
  to: string
  fromLabel?: string
  toLabel?: string
  items: { productId?: string; name?: string; quantity: number; price?: number }[]
  totalAmount: number
  status: OrderStatus
  createdAt: string
  shippingAddress?: string
}
