import type {
  MvpInventoryItem,
  MvpOrder,
  MvpProduct,
  MvpUser,
  OrderStatus,
  SupplyRole,
} from "@/lib/medx-mvp-types"
import { sampleMedicines } from "@/lib/sample-medicines"

const STORAGE_KEY = "medx-mvp-v1"

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase()
}

function buildSeedProducts(): MvpProduct[] {
  const now = new Date()
  const addYears = (y: number) => {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() + y)
    return d.toISOString()
  }
  return sampleMedicines.map((m, i) => {
    const id = `prd-seed-${i + 1}`
    const qty = 50 + i * 10
    return {
      _id: id,
      productId: `MEDX-${1000 + i}`,
      name: m.name,
      category: m.category,
      description: m.description,
      manufacturer: "MedX Demo Labs",
      batchNumber: `B-${2024}${i}`,
      manufactureDate: now.toISOString(),
      expiryDate: addYears(2),
      price: m.price,
      quantity: qty,
      unit: "tablet",
      imageUrl: "/placeholder.jpg",
      status: qty < 20 ? "Low Stock" : "Available",
    } as MvpProduct
  })
}

interface Persisted {
  users: Record<string, MvpUser>
  inventory: Record<string, MvpInventoryItem[]>
  products: MvpProduct[]
  orders: MvpOrder[]
}

function emptyPersisted(): Persisted {
  return {
    users: {},
    inventory: {},
    products: buildSeedProducts(),
    orders: [],
  }
}

export function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return emptyPersisted()
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = emptyPersisted()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw) as Partial<Persisted>
    const base = emptyPersisted()
    return {
      users: { ...base.users, ...parsed.users },
      inventory: { ...base.inventory, ...parsed.inventory },
      products: parsed.products?.length ? parsed.products : base.products,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    }
  } catch {
    return emptyPersisted()
  }
}

function savePersisted(data: Persisted): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  window.dispatchEvent(new Event("medx-mvp-update"))
}

export function getUserByAddress(address: string): MvpUser | null {
  const key = normalizeAddress(address)
  return loadPersisted().users[key] ?? null
}

export function registerNewUser(input: {
  walletAddress: string
  role: SupplyRole
  name: string
  companyName: string
  email: string
  phone?: string
  location?: string
  registrationId?: string
  licenseNumber?: string
}): MvpUser {
  const key = normalizeAddress(input.walletAddress)
  const state = loadPersisted()
  const now = new Date().toISOString()
  const prev = state.users[key]
  const user: MvpUser = {
    ...prev,
    walletAddress: input.walletAddress,
    address: key,
    role: input.role,
    name: input.name,
    companyName: input.companyName,
    email: input.email,
    phone: input.phone ?? "",
    location: input.location ?? "",
    registrationId: input.registrationId ?? "",
    licenseNumber: input.licenseNumber ?? "",
    verified: prev?.verified ?? false,
    billNotificationsEnabled: prev?.billNotificationsEnabled ?? false,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  }
  state.users[key] = user
  savePersisted(state)
  return user
}

export function updateUserFields(
  address: string,
  patch: Partial<Omit<MvpUser, "address" | "walletAddress">>
): MvpUser | null {
  const key = normalizeAddress(address)
  const state = loadPersisted()
  const prev = state.users[key]
  if (!prev) return null
  const now = new Date().toISOString()
  const user: MvpUser = {
    ...prev,
    ...patch,
    updatedAt: now,
  }
  state.users[key] = user
  savePersisted(state)
  return user
}

export function deleteUser(address: string): boolean {
  const key = normalizeAddress(address)
  const state = loadPersisted()
  if (!state.users[key]) return false
  delete state.users[key]
  delete state.inventory[key]
  savePersisted(state)
  return true
}

export function listUsersByRole(role: string): MvpUser[] {
  return Object.values(loadPersisted().users).filter((u) => u.role === role)
}

export function getInventoryForWallet(address: string): MvpInventoryItem[] {
  const key = normalizeAddress(address)
  const state = loadPersisted()
  const list = state.inventory[key] ?? []
  let changed = false
  const fixed = list.map((item) => {
    if (!item._id) {
      changed = true
      return { ...item, _id: newId("inv") }
    }
    return item
  })
  if (changed) {
    state.inventory[key] = fixed
    savePersisted(state)
  }
  return [...fixed]
}

export function addInventoryItem(
  address: string,
  item: Omit<MvpInventoryItem, "_id">
): MvpInventoryItem {
  const key = normalizeAddress(address)
  const state = loadPersisted()
  const list = state.inventory[key] ?? []
  const row: MvpInventoryItem = {
    ...item,
    _id: newId("inv"),
    quantity: Number(item.quantity),
    price: Number(item.price),
  }
  state.inventory[key] = [...list, row]
  savePersisted(state)
  return row
}

export function replaceInventoryForWallet(address: string, items: MvpInventoryItem[]): void {
  const key = normalizeAddress(address)
  const state = loadPersisted()
  state.inventory[key] = items
  savePersisted(state)
}

export function getProducts(): MvpProduct[] {
  return [...loadPersisted().products]
}

export function addProduct(product: Omit<MvpProduct, "_id" | "productId"> & { productId?: string }): MvpProduct {
  const state = loadPersisted()
  const p: MvpProduct = {
    ...product,
    _id: newId("prd"),
    productId: product.productId ?? `MEDX-${Date.now()}`,
  }
  state.products = [...state.products, p]
  savePersisted(state)
  return p
}

export function getAllOrders(): MvpOrder[] {
  return [...loadPersisted().orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function appendOrder(order: Omit<MvpOrder, "orderId" | "createdAt" | "status"> & { status?: OrderStatus }): MvpOrder {
  const state = loadPersisted()
  const row: MvpOrder = {
    ...order,
    orderId: `ORD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: order.status ?? "Pending",
  }
  state.orders = [row, ...state.orders]
  savePersisted(state)
  return row
}

export function userToApiShape(u: MvpUser): Record<string, unknown> {
  return { ...u }
}
