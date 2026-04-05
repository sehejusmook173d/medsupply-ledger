"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/context/wallet-context"
import { useMedxData } from "@/context/medx-data-context"
import type { MvpInventoryItem } from "@/lib/medx-mvp-types"
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline"
import AddItemModal from "@/components/inventory/AddItemModal"
import EditItemModal from "@/components/inventory/EditItemModal"
import DeleteItemModal from "@/components/inventory/DeleteItemModal"
import { toast } from "react-hot-toast"

interface InventoryFormData {
  name: string
  description: string
  quantity: number
  price: number
  category: string
  imageUrl: string
}

export default function InventoryPage() {
  const { address: walletAddress } = useWallet()
  const { inventoryFor, addItem, replaceInventory, tick } = useMedxData()
  const [items, setItems] = useState<MvpInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MvpInventoryItem | null>(null)

  useEffect(() => {
    if (!walletAddress) {
      setItems([])
      setLoading(false)
      return
    }
    setItems(inventoryFor(walletAddress))
    setLoading(false)
  }, [walletAddress, tick, inventoryFor])

  const handleAddItem = async (item: InventoryFormData) => {
    if (!walletAddress) return
    try {
      const row = addItem(walletAddress, {
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl || undefined,
      })
      setItems((prev) => [...prev, row])
      setShowAddModal(false)
      toast.success("Item added (saved in this browser only)")
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add item")
    }
  }

  const handleEditItem = async (item: Partial<MvpInventoryItem>) => {
    if (!selectedItem || !walletAddress) return

    const list = inventoryFor(walletAddress)
    const next = list.map((i) =>
      i._id === selectedItem._id ? { ...i, ...item, quantity: Number(item.quantity ?? i.quantity), price: Number(item.price ?? i.price) } : i
    )
    replaceInventory(walletAddress, next)
    setItems(next)
    setShowEditModal(false)
    setSelectedItem(null)
    toast.success("Item updated")
  }

  const handleDeleteItem = async () => {
    if (!selectedItem || !walletAddress) return

    const list = inventoryFor(walletAddress)
    const next = list.filter((i) => i._id !== selectedItem._id)
    replaceInventory(walletAddress, next)
    setItems(next)
    setShowDeleteModal(false)
    setSelectedItem(null)
    toast.success("Item deleted")
  }

  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please connect your wallet to view inventory</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Add New Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No items in inventory. Add your first item!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Quantity</p>
                  <p className="font-medium">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">${item.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedItem(item)
                    setShowEditModal(true)
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(item)
                    setShowDeleteModal(true)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddItem}
        />
      )}

      {showEditModal && selectedItem && walletAddress && (
        <EditItemModal
          item={{ ...selectedItem, walletAddress }}
          onClose={() => {
            setShowEditModal(false)
            setSelectedItem(null)
          }}
          onSave={handleEditItem}
        />
      )}

      {showDeleteModal && selectedItem && walletAddress && (
        <DeleteItemModal
          item={{ ...selectedItem, walletAddress }}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedItem(null)
          }}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  )
}
