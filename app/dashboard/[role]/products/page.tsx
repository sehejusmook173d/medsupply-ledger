"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/context/wallet-context"
import { Filter, Package, Plus, Search, ShoppingCart } from "lucide-react"
import { useMedxData } from "@/context/medx-data-context"
import { normalizeAddress } from "@/lib/medx-mvp-store"

interface ProductsPageProps {
  params: {
    role: "provider" | "manufacturer" | "distributor" | "retailer"
  }
}

interface Product {
  _id: string
  productId: string
  name: string
  category: string
  description: string
  manufacturer: string
  batchNumber?: string
  manufactureDate: Date
  expiryDate: Date
  price: number
  quantity: number
  unit: string
  imageUrl?: string
  status: "Available" | "Low Stock" | "Out of Stock"
}

export default function ProductsPage({ params }: ProductsPageProps) {
  const { role } = params
  const { address } = useWallet()
  const { products: mvpProducts, createOrder, usersInRole, tick, getUser } = useMedxData()
  const { toast } = useToast()
  const [isLoaded, setIsLoaded] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])

  // Order state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shippingAddress, setShippingAddress] = useState("")

  useEffect(() => {
    const productData = mvpProducts.map((p) => ({
      ...p,
      manufactureDate: new Date(p.manufactureDate),
      expiryDate: new Date(p.expiryDate),
    })) as Product[]
    setProducts(productData)
    setFilteredProducts(productData)
    const uniqueCategories = Array.from(new Set(productData.map((p: Product) => p.category)))
    setCategories(uniqueCategories as string[])
    setIsLoaded(true)
  }, [mvpProducts, tick])

  // Filter products based on search, category, and tab
  useEffect(() => {
    let filtered = [...products]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory)
    }

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((product) => product.status.toLowerCase().replace(" ", "-") === activeTab)
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory, activeTab, products])

  // Handle adding product to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return

    // Check if product is already in cart
    const existingItemIndex = cart.findIndex((item) => item.product._id === selectedProduct._id)

    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedCart = [...cart]
      updatedCart[existingItemIndex].quantity += orderQuantity
      setCart(updatedCart)
    } else {
      // Add new item to cart
      setCart([...cart, { product: selectedProduct, quantity: orderQuantity }])
    }

    toast({
      title: "Added to cart",
      description: `${orderQuantity} ${selectedProduct.name} added to your cart`,
    })

    setIsOrderDialogOpen(false)
    setOrderQuantity(1)
  }

  // Handle removing item from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product._id !== productId))
  }

  // Calculate total price
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.product.price * item.quantity, 0)
  }

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return

    setIsSubmitting(true)

    try {
      const manufacturers = usersInRole("manufacturer")
      const seller =
        manufacturers.find((u) => normalizeAddress(u.walletAddress) !== normalizeAddress(address!)) ??
        manufacturers[0]
      const sellerAddress = seller?.walletAddress ?? address!
      const buyerU = address ? getUser(address) : null
      const sellerU = getUser(sellerAddress)

      createOrder({
        from: normalizeAddress(sellerAddress),
        to: normalizeAddress(address!),
        fromLabel: sellerU?.companyName || sellerU?.name || sellerAddress,
        toLabel: buyerU?.companyName || buyerU?.name || address!,
        items: cart.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalAmount: calculateTotal(),
        status: "Pending",
        shippingAddress: shippingAddress || undefined,
      })

      toast({
        title: "Order placed",
        description: "Saved locally in this browser (MVP — no backend).",
      })

      setCart([])
      setIsCartDialogOpen(false)
    } catch (error) {
      console.error("Error placing order:", error)
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleColor =
    role === "provider" || role === "retailer" ? "primary" : role === "manufacturer" ? "secondary" : "accent"

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse and order products in the supply chain</p>
          </div>
          <div className="flex items-center gap-2">
            {role === "manufacturer" && (
              <Button size="sm" className="cyber-button">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="cyber-button relative"
              onClick={() => setIsCartDialogOpen(true)}
            >
              <ShoppingCart className="h-4 w-4" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 border-border/50 bg-background/50 backdrop-blur-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="cyber-button">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger
              value="all"
              className={`data-[state=active]:bg-${roleColor}/20 data-[state=active]:text-${roleColor} transition-all duration-300`}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="available"
              className={`data-[state=active]:bg-${roleColor}/20 data-[state=active]:text-${roleColor} transition-all duration-300`}
            >
              Available
            </TabsTrigger>
            <TabsTrigger
              value="low-stock"
              className={`data-[state=active]:bg-${roleColor}/20 data-[state=active]:text-${roleColor} transition-all duration-300`}
            >
              Low Stock
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {!isLoaded ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[300px] rounded-lg bg-muted/50 animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No products match your search criteria."
                : "There are no products available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <div
                key={product._id}
                className={`relative transition-all duration-500 ${
                  isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div
                  className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}
                ></div>
                <Card className="border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-2 right-2 ${
                        product.status === "Available"
                          ? "bg-emerald-500"
                          : product.status === "Low Stock"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                      }`}
                    >
                      {product.status}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="text-xs">{product.productId}</CardDescription>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                        <p className="text-xs text-muted-foreground">per {product.unit}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-background/50">
                        {product.category}
                      </Badge>
                      <Badge variant="outline" className="bg-background/50">
                        {product.manufacturer}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Stock:</span> {product.quantity} {product.unit}
                    </div>
                    <Dialog
                      open={isOrderDialogOpen && selectedProduct?._id === product._id}
                      onOpenChange={(open) => {
                        setIsOrderDialogOpen(open)
                        if (!open) setSelectedProduct(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="cyber-button"
                          disabled={product.status === "Out of Stock"}
                          onClick={() => {
                            setSelectedProduct(product)
                            setOrderQuantity(1)
                            setIsOrderDialogOpen(true)
                          }}
                        >
                          Order
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Order Product</DialogTitle>
                          <DialogDescription>Enter the quantity you want to order.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="product" className="text-right">
                              Product
                            </Label>
                            <div className="col-span-3">
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.productId}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                              Price
                            </Label>
                            <div className="col-span-3">
                              <p className="font-medium">
                                ${product.price.toFixed(2)} per {product.unit}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">
                              Quantity
                            </Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              max={product.quantity}
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(Number.parseInt(e.target.value) || 1)}
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Total</Label>
                            <div className="col-span-3">
                              <p className="font-bold">${(product.price * orderQuantity).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="button" onClick={handleAddToCart}>
                            Add to Cart
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shopping Cart Dialog */}
      <Dialog open={isCartDialogOpen} onOpenChange={setIsCartDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Shopping Cart</DialogTitle>
            <DialogDescription>Review your order before placing it.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product._id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl || "/placeholder.svg"}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">{item.product.productId}</p>
                        <p className="text-sm">
                          {item.quantity} x ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.product._id)}
                        className="h-8 w-8 p-0"
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between border-t pt-4">
                  <p className="font-bold">Total</p>
                  <p className="font-bold">${calculateTotal().toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Input
                    id="shippingAddress"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your shipping address"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCartDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || cart.length === 0 || !shippingAddress}
                >
                  {isSubmitting ? "Processing..." : "Place Order"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
