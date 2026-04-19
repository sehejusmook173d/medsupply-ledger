"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, FileText, Filter, Plus, Search, XCircle } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { useMedxData } from "@/context/medx-data-context"
import { normalizeAddress } from "@/lib/medx-mvp-store"
import type { MvpOrder } from "@/lib/medx-mvp-types"
import Link from "next/link"

interface OrdersPageProps {
  params: {
    role: "provider" | "manufacturer" | "distributor" | "retailer"
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

function orderRow(order: MvpOrder, mode: "incoming" | "outgoing") {
  const counterparty =
    mode === "incoming"
      ? order.fromLabel || `${order.from.slice(0, 6)}…${order.from.slice(-4)}`
      : order.toLabel || `${order.to.slice(0, 6)}…${order.to.slice(-4)}`
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
  return {
    id: order.orderId,
    counterparty,
    date: formatDate(order.createdAt),
    items: itemCount,
    total: `$${order.totalAmount.toFixed(2)}`,
    status: order.status,
  }
}

export default function OrdersPage({ params }: OrdersPageProps) {
  const { role } = params
  const { address } = useWallet()
  const { orders } = useMedxData()

  const me = address ? normalizeAddress(address) : ""

  const incoming: MvpOrder[] = me
    ? orders.filter((o) => normalizeAddress(o.to) === me)
    : []
  const outgoing: MvpOrder[] = me
    ? orders.filter((o) => normalizeAddress(o.from) === me)
    : []

  const incomingRows = incoming.map((o) => orderRow(o, "incoming"))
  const outgoingRows = outgoing.map((o) => orderRow(o, "outgoing"))

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">
              MVP: orders are stored in this browser only (localStorage).
            </p>
          </div>
          <Button asChild>
            <Link href={`/dashboard/${role}`}>
              <Plus className="mr-2 h-4 w-4" /> New order
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search orders..." className="pl-8" disabled />
          </div>
          <div className="flex gap-2">
            <Select defaultValue="all" disabled>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" type="button" disabled>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="incoming">
          <TabsList>
            <TabsTrigger value="incoming">Incoming ({incomingRows.length})</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing ({outgoingRows.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="incoming" className="border-none p-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Orders</CardTitle>
                <CardDescription>Orders where you are the recipient</CardDescription>
              </CardHeader>
              <CardContent>
                {incomingRows.length > 0 ? (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">Order ID</th>
                          <th className="px-4 py-3 text-left">From</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Items (qty)</th>
                          <th className="px-4 py-3 text-left">Total</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomingRows.map((order) => (
                          <tr key={order.id} className="border-b">
                            <td className="px-4 py-3 font-medium">{order.id}</td>
                            <td className="px-4 py-3">{order.counterparty}</td>
                            <td className="px-4 py-3">{order.date}</td>
                            <td className="px-4 py-3">{order.items}</td>
                            <td className="px-4 py-3">{order.total}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {order.status === "Pending" ? (
                                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                ) : order.status === "Approved" ? (
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                                )}
                                <span
                                  className={
                                    order.status === "Pending"
                                      ? "text-amber-500"
                                      : order.status === "Approved"
                                        ? "text-emerald-500"
                                        : "text-rose-500"
                                  }
                                >
                                  {order.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-3">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No incoming orders</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      {me
                        ? "No orders yet. Another registered wallet must place an order to your address."
                        : "Connect your wallet to see orders."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="outgoing" className="border-none p-0 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Outgoing Orders</CardTitle>
                <CardDescription>Orders you created (supplier → buyer or modal flow)</CardDescription>
              </CardHeader>
              <CardContent>
                {outgoingRows.length > 0 ? (
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left">Order ID</th>
                          <th className="px-4 py-3 text-left">To</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Items (qty)</th>
                          <th className="px-4 py-3 text-left">Total</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outgoingRows.map((order) => (
                          <tr key={order.id} className="border-b">
                            <td className="px-4 py-3 font-medium">{order.id}</td>
                            <td className="px-4 py-3">{order.counterparty}</td>
                            <td className="px-4 py-3">{order.date}</td>
                            <td className="px-4 py-3">{order.items}</td>
                            <td className="px-4 py-3">{order.total}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {order.status === "Pending" ? (
                                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                ) : order.status === "Approved" ? (
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                                ) : (
                                  <XCircle className="mr-2 h-4 w-4 text-rose-500" />
                                )}
                                <span
                                  className={
                                    order.status === "Pending"
                                      ? "text-amber-500"
                                      : order.status === "Approved"
                                        ? "text-emerald-500"
                                        : "text-rose-500"
                                  }
                                >
                                  {order.status}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-3">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No outgoing orders</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                      Use <strong>New order</strong> on the dashboard or place a product order from the Products page.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
