import { NextResponse } from "next/server"
import { createOrder, getOrder } from "@/lib/contract"
import Order from "@/models/Order"
import dbConnect from "@/lib/mongodb"
import User from "../../../models/User"
import Product from "../../../models/Product"
import Inventory from "../../../models/Inventory"
import { ethers } from "ethers"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (orderId) {
      // Get single order
      const blockchainOrder = await getOrder(parseInt(orderId))
      if (!blockchainOrder) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        )
      }

      // Connect to database
      await dbConnect()

      // Get order from database
      const dbOrder = await Order.findOne({ blockchainTxHash: blockchainOrder.id })
      if (!dbOrder) {
        return NextResponse.json(
          { success: false, error: "Order not found in database" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        order: {
          ...dbOrder.toObject(),
          blockchainData: blockchainOrder
        }
      })
    } else {
      // Get all orders
      await dbConnect()
      const orders = await Order.find({})
      return NextResponse.json({
        success: true,
        orders
      })
    }
  } catch (error: any) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { from, to, items, totalAmount } = await req.json()

    if (!from || !to || !items || !totalAmount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Connect to database
    await dbConnect()

    // For now, we'll only handle the first item in the cart
    const item = items[0]

    // Get the product details
    const product = await Product.findById(item.productId)
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      )
    }

    // Check if seller has enough inventory
    const sellerInventory = await Inventory.findOne({
      walletAddress: from,
      "items.name": product.name
    })

    if (!sellerInventory) {
      return NextResponse.json(
        { success: false, error: `Item ${product.name} not found in seller's inventory` },
        { status: 404 }
      )
    }

    const inventoryItem = sellerInventory.items.find((i: any) => i.name === product.name)
    if (!inventoryItem || inventoryItem.quantity < item.quantity) {
      return NextResponse.json(
        { success: false, error: `Not enough quantity available for ${product.name}` },
        { status: 400 }
      )
    }

    // Create order on blockchain
    const metadataURI = "ipfs://example-metadata-uri" // Replace with actual metadata URI
    const orderId = `${from}-${Date.now()}`
    
    const blockchainResult = await createOrder(
      orderId,
      metadataURI,
      totalAmount.toString()
    )

    if (!blockchainResult.success) {
      throw new Error("Failed to create order on blockchain")
    }

    // Create order in database
    const order = await Order.create({
      sellerAddress: from,
      buyerAddress: to,
      itemName: product.name,
      quantity: item.quantity,
      price: product.price,
      totalAmount: totalAmount,
      status: "pending",
      blockchainTxHash: blockchainResult.tx.hash
    })

    // Update seller's inventory
    await Inventory.findOneAndUpdate(
      { walletAddress: from, "items.name": product.name },
      { $inc: { "items.$.quantity": -item.quantity } }
    )

    // Add item to buyer's inventory if not exists, or update quantity if exists
    const buyerInventory = await Inventory.findOne({ walletAddress: to })
    if (buyerInventory) {
      const existingItem = buyerInventory.items.find((i: any) => i.name === product.name)
      if (existingItem) {
        await Inventory.findOneAndUpdate(
          { walletAddress: to, "items.name": product.name },
          { $inc: { "items.$.quantity": item.quantity } }
        )
      } else {
        await Inventory.findOneAndUpdate(
          { walletAddress: to },
          { $push: { items: { name: product.name, quantity: item.quantity } } }
        )
      }
    } else {
      await Inventory.create({
        walletAddress: to,
        items: [{ name: product.name, quantity: item.quantity }]
      })
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      txHash: blockchainResult.tx.hash
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    )
  }
}
