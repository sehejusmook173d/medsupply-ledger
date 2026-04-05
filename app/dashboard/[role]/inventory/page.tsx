"use client"

// 1. Import 'use' from React
import React, { useEffect, useState, use } from "react";
import { useWallet } from "@/context/wallet-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout"; // Assuming this component exists
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Removed TabsContent as it wasn't used directly here
import { AlertCircle, ArrowUpDown, Box, CheckCircle2, Filter, Package, Plus, Search, X } from "lucide-react";
import { useMedxData } from "@/context/medx-data-context";

// 2. Update props interface
interface InventoryPageProps {
  params: {
    role: "provider" | "manufacturer" | "distributor" | "retailer";
  };
}

interface InventoryItem {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  imageUrl?: string;
}

export default function InventoryPage({ params }: InventoryPageProps) {
  // 3. Destructure 'role' directly from params
  const { role } = params;
  const { address } = useWallet();
  const { inventoryFor, addItem, tick } = useMedxData();

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    quantity: "",
    price: "",
    category: "",
    imageUrl: ""
  });

  useEffect(() => {
    if (!address) {
      setError("Wallet not connected");
      setIsLoaded(true);
      return;
    }
    setError(null);
    setInventoryItems(inventoryFor(address));
    setIsLoaded(true);
  }, [address, tick, inventoryFor]);

  // Role-specific inventory data (remains the same)
  const roleColor =
    role === "provider" || role === "retailer" ? "primary" : role === "manufacturer" ? "secondary" : "accent";

  // Filtered items based on search and active tab
  const filteredItems = inventoryItems
    .filter((item) => activeTab === "all" || item.quantity < 10)
    .filter(
      (item) =>
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item._id.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setAlert({ type: 'error', message: "Wallet not connected" });
      return;
    }

    try {
      const row = addItem(address, {
        name: newItem.name,
        description: newItem.description,
        quantity: Number(newItem.quantity),
        price: Number(newItem.price),
        category: newItem.category,
        imageUrl: newItem.imageUrl || undefined,
      });
      setInventoryItems((prev) => [...prev, row]);
      setNewItem({
        name: "",
        description: "",
        quantity: "",
        price: "",
        category: "",
        imageUrl: ""
      });
      setIsAddingItem(false);
      setAlert({ type: 'success', message: "Item added successfully" });
    } catch (error: unknown) {
      console.error("Error adding item:", error);
      setAlert({ type: 'error', message: error instanceof Error ? error.message : "Failed to add item" });
    }
  };

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (error) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Alert Message */}
        {alert && (
          <div className={`p-4 rounded-lg ${
            alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {alert.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span>{alert.message}</span>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="ml-4 text-current hover:text-current/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsAddingItem(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Add Item Modal */}
        {isAddingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add New Item</CardTitle>
                <CardDescription>Enter the details of the new inventory item</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                      required
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      required
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Enter item description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <Input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      placeholder="Enter price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Input
                      required
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      placeholder="Enter category"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL (Optional)</label>
                    <Input
                      value={newItem.imageUrl}
                      onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                      placeholder="Enter image URL"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingItem(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Item</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="pl-8 border-border/50 bg-background/50 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             {/* Use controlled Tabs component */}
             <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
               <TabsList className="grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm border border-border/50">
                 <TabsTrigger
                   value="all"
                   className={`data-[state=active]:bg-${roleColor}/20 data-[state=active]:text-${roleColor} transition-all duration-300`}
                 >
                   All
                 </TabsTrigger>
                 <TabsTrigger
                   value="low"
                   className={`data-[state=active]:bg-${roleColor}/20 data-[state=active]:text-${roleColor} transition-all duration-300`}
                 >
                   Low Stock
                 </TabsTrigger>
               </TabsList>
             </Tabs>
            <Button variant="outline" size="icon" className="cyber-button">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}
          ></div>
          <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>
                    {activeTab === "all" ? "All inventory items" : "Items with low stock levels"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs border border-primary/30">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-primary">Blockchain Verified</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-4 py-3 text-left font-medium">
                        <div className="flex items-center gap-1">
                          ID
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        <div className="flex items-center gap-1">
                          Name
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-left font-medium">
                        <div className="flex items-center gap-1">
                          Quantity
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Price</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, index) => (
                      <tr
                        key={item._id}
                        className={`border-b border-border/50 transition-all duration-500 ${
                          isLoaded ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ transitionDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-3 font-medium">{item._id}</td>
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.category}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">${item.price}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {item.quantity < 10 ? (
                              <>
                                <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-yellow-500">Low Stock</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                                <span className="text-green-500">In Stock</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredItems.length === 0 && ( // Check filteredItems length
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3">
                    <Box className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No items found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                       ? "No items match your search."
                       : activeTab === "all"
                       ? "Your inventory is empty."
                       : "No low stock items found."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Removed the second summary card as it wasn't present in the provided code */}

      </div>
    </DashboardLayout>
  );
}