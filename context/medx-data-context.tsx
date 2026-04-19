"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { MvpInventoryItem, MvpOrder, MvpProduct, MvpUser, OrderStatus, SupplyRole } from "@/lib/medx-mvp-types"
import {
  addInventoryItem,
  appendOrder,
  deleteUser,
  getAllOrders,
  getInventoryForWallet,
  getProducts,
  getUserByAddress,
  listUsersByRole,
  registerNewUser,
  replaceInventoryForWallet,
  updateUserFields,
} from "@/lib/medx-mvp-store"

interface MedxDataContextValue {
  tick: number
  getUser: typeof getUserByAddress
  registerUser: typeof registerNewUser
  updateUser: typeof updateUserFields
  removeUser: typeof deleteUser
  usersInRole: typeof listUsersByRole
  inventoryFor: typeof getInventoryForWallet
  addItem: typeof addInventoryItem
  replaceInventory: typeof replaceInventoryForWallet
  products: MvpProduct[]
  orders: MvpOrder[]
  createOrder: typeof appendOrder
}

const MedxDataContext = createContext<MedxDataContextValue | null>(null)

const stable = {
  getUser: getUserByAddress,
  registerUser: registerNewUser,
  updateUser: updateUserFields,
  removeUser: deleteUser,
  usersInRole: listUsersByRole,
  inventoryFor: getInventoryForWallet,
  addItem: addInventoryItem,
  replaceInventory: replaceInventoryForWallet,
  createOrder: appendOrder,
}

export function MedxDataProvider({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const onUpdate = () => setTick((t) => t + 1)
    window.addEventListener("medx-mvp-update", onUpdate)
    return () => window.removeEventListener("medx-mvp-update", onUpdate)
  }, [])

  const value = useMemo<MedxDataContextValue>(() => {
    return {
      tick,
      ...stable,
      products: getProducts(),
      orders: getAllOrders(),
    }
  }, [tick])

  return <MedxDataContext.Provider value={value}>{children}</MedxDataContext.Provider>
}

export function useMedxData(): MedxDataContextValue {
  const ctx = useContext(MedxDataContext)
  if (!ctx) {
    throw new Error("useMedxData must be used within MedxDataProvider")
  }
  return ctx
}

export type { MvpUser, MvpInventoryItem, MvpProduct, MvpOrder, SupplyRole }
