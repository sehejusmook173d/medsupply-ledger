"use client"

// 1. Import 'use' from React AND other necessary hooks/components
import React, { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout"; // Assuming this component exists
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Clock,
  FileText,
  Package,
  Shield,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NewOrderModal } from "@/components/NewOrderModal"; // *** ADDED IMPORT ***
import { useToast } from "@/components/ui/use-toast"; // *** ADDED IMPORT (ensure path is correct) ***
import { useWallet } from "@/context/wallet-context"; // Add this import

// 2. Update props interface
interface DashboardPageProps {
  params: {
    role: "provider" | "manufacturer" | "distributor" | "retailer";
  };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  // 3. Destructure 'role' directly from params
  const { role } = params; // Role from URL params
  const { address, role: userRole } = useWallet(); // Use the correct property names

  // --- EXISTING STATE (Unchanged) ---
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  // --- ADDED STATE ---
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const { toast } = useToast();
  // --- END ADDED STATE ---

   // --- MODIFIED useEffect ---
   useEffect(() => {
        // Simulate loading dashboard data
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);
    // --- END MODIFIED useEffect ---

    // --- ADDED CALLBACK FUNCTION ---
    const handleOrderCreated = () => {
        console.log("Order created! Consider refreshing relevant dashboard data.");
        // TODO: Add logic here if you need to update the dashboard after an order is made
        // This might involve re-fetching orders or updating local state.
    };
    // --- END ADDED FUNCTION ---

  // --- Role-specific metrics data (Unchanged) ---
  const metrics = {
    provider: [ { name: "Raw Materials", value: "24", icon: <Package className="h-4 w-4 text-primary" />, color: "primary" }, { name: "Pending Orders", value: "7", icon: <Clock className="h-4 w-4 text-secondary" />, color: "secondary" }, { name: "Shipped Materials", value: "18", icon: <Box className="h-4 w-4 text-accent" />, color: "accent" }, { name: "Quality Certificates", value: "32", icon: <FileText className="h-4 w-4 text-primary" />, color: "primary" }, ],
    manufacturer: [ { name: "Products", value: "42", icon: <Package className="h-4 w-4 text-primary" />, color: "primary" }, { name: "Manufacturing Batches", value: "12", icon: <Activity className="h-4 w-4 text-secondary" />, color: "secondary" }, { name: "Pending Orders", value: "9", icon: <Clock className="h-4 w-4 text-accent" />, color: "accent" }, { name: "Quality Certificates", value: "28", icon: <FileText className="h-4 w-4 text-primary" />, color: "primary" }, ],
    distributor: [ { name: "Inventory Items", value: "156", icon: <Box className="h-4 w-4 text-primary" />, color: "primary" }, { name: "Pending Orders", value: "23", icon: <Clock className="h-4 w-4 text-secondary" />, color: "secondary" }, { name: "Shipments", value: "47", icon: <Package className="h-4 w-4 text-accent" />, color: "accent" }, { name: "Warehouses", value: "3", icon: <FileText className="h-4 w-4 text-primary" />, color: "primary" }, ],
    retailer: [ { name: "Products", value: "87", icon: <Package className="h-4 w-4 text-primary" />, color: "primary" }, { name: "Pending Orders", value: "5", icon: <Clock className="h-4 w-4 text-secondary" />, color: "secondary" }, { name: "Verified Products", value: "76", icon: <CheckCircle2 className="h-4 w-4 text-accent" />, color: "accent" }, { name: "Low Stock Items", value: "12", icon: <AlertCircle className="h-4 w-4 text-primary" />, color: "primary" }, ],
   };

  // --- Role-specific recent activities data (Unchanged) ---
  const activities = {
    provider: [ { id: "ACT-001", description: "Raw Material #RM-2023 added to inventory", time: "10 minutes ago" }, { id: "ACT-002", description: "Order #PO-5678 received from Manufacturer", time: "2 hours ago" }, { id: "ACT-003", description: "Quality certificate issued for Batch #B-9012", time: "5 hours ago" }, { id: "ACT-004", description: "Shipment #SH-3456 dispatched to Manufacturer", time: "1 day ago" }, ],
    manufacturer: [ { id: "ACT-001", description: "New batch #MFG-789 production started", time: "30 minutes ago" }, { id: "ACT-002", description: "Raw materials received from Provider", time: "3 hours ago" }, { id: "ACT-003", description: "Quality testing completed for Batch #MFG-456", time: "6 hours ago" }, { id: "ACT-004", description: "Order #DO-789 received from Distributor", time: "1 day ago" }, ],
    distributor: [ { id: "ACT-001", description: "Shipment #SH-567 received from Manufacturer", time: "1 hour ago" }, { id: "ACT-002", description: "Order #RO-890 received from Retailer", time: "4 hours ago" }, { id: "ACT-003", description: "Inventory updated for Warehouse #W-2", time: "8 hours ago" }, { id: "ACT-004", description: "Shipment #SH-234 dispatched to Retailer", time: "1 day ago" }, ],
    retailer: [ { id: "ACT-001", description: "Shipment #SH-234 received from Distributor", time: "2 hours ago" }, { id: "ACT-002", description: "Product #PRD-567 verified and added to inventory", time: "5 hours ago" }, { id: "ACT-003", description: "Low stock alert for Product #PRD-123", time: "7 hours ago" }, { id: "ACT-004", description: "Order #PO-456 placed to Distributor", time: "1 day ago" }, ],
   };

  // --- Role-specific pending actions data (Unchanged) ---
  const pendingActions = {
    provider: [ { id: "PA-001", description: "Approve order #PO-5678 from Manufacturer", priority: "High" }, { id: "PA-002", description: "Generate quality certificate for Batch #B-9012", priority: "Medium" }, { id: "PA-003", description: "Update inventory for Raw Material #RM-2023", priority: "Low" }, ],
    manufacturer: [ { id: "PA-001", description: "Quality check for Batch #MFG-789", priority: "High" }, { id: "PA-002", description: "Approve order #DO-789 from Distributor", priority: "Medium" }, { id: "PA-003", description: "Update production schedule for next week", priority: "Low" }, ],
    distributor: [ { id: "PA-001", description: "Process order #RO-890 from Retailer", priority: "High" }, { id: "PA-002", description: "Verify received shipment #SH-567", priority: "Medium" }, { id: "PA-003", description: "Update warehouse allocation for new products", priority: "Low" }, ],
    retailer: [ { id: "PA-001", description: "Verify received shipment #SH-234", priority: "High" }, { id: "PA-002", description: "Reorder low stock Product #PRD-123", priority: "Medium" }, { id: "PA-003", description: "Update product display information", priority: "Low" }, ],
   };

  // --- Use the 'role' variable from URL params (Unchanged) ---
  const roleColor =
    role === "provider" || role === "retailer" ? "primary" : role === "manufacturer" ? "secondary" : "accent";

  // --- Use the *actual* logged-in user's role for logic, fallback to URL role (Unchanged) ---
  const actualUserRole = userRole || role;

  // --- Use URL role for display sections (Unchanged) ---
  const displayRole = role;
  const roleMetrics = metrics[displayRole] || [];
  const roleActivities = activities[displayRole] || [];
  const rolePendingActions = pendingActions[displayRole] || [];

  // --- Component JSX Starts Here ---
  return (
    <DashboardLayout role={actualUserRole as any}> {/* Use actual role if layout needs it */}
      <div className="flex flex-col gap-6">
        {/* --- Header Section (Button modified) --- */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back to your {actualUserRole} dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Button (Unchanged) */}
            <Button variant="outline" size="sm" className="cyber-button">
              <FileText className="mr-2 h-4 w-4" />
              Export
            </Button>
            {/* ---- MODIFIED NEW ORDER BUTTON ---- */}
            <Button
              size="sm"
              className="cyber-button"
              onClick={() => setIsNewOrderModalOpen(true)} // <-- ADDED onClick
              disabled={!address || !actualUserRole} // <-- ADDED disabled state
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                 <path d="M5 12h14" />
                 <path d="M12 5v14" />
              </svg>
              New Order
            </Button>
             {/* ---- END MODIFIED BUTTON ---- */}
          </div>
        </div>
        {/* --- End Header Section --- */}


        {/* --- Metrics Section (Unchanged Structure) --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {roleMetrics.map((metric, index) => (
                 <div
                   key={index}
                   className={`relative transition-all duration-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                   style={{ transitionDelay: `${index * 100}ms` }}
                 >
                   {/* Note: Dynamic Tailwind classes might need adjustment */}
                   <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${metric.color} to-${metric.color}/30 opacity-30 blur-sm`}></div>
                   <Card className="border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                       <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                       {/* Example applying color directly - adjust as needed for Tailwind variants */}
                       <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-${metric.color}-100/10 text-${metric.color}`}>
                          {metric.icon}
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="text-2xl font-bold">{metric.value}</div>
                       <p className="text-xs text-muted-foreground">
                         {index % 2 === 0 ? ( <span className="flex items-center text-emerald-500"> <ArrowUpRight className="mr-1 h-4 w-4" /> 12% increase </span> ) : ( <span className="flex items-center text-rose-500"> <ArrowDownRight className="mr-1 h-4 w-4" /> 8% decrease </span> )}
                       </p>
                       <div className="mt-3"> <div className="progress-bar" style={{ "--progress": index % 2 === 0 ? "72%" : "45%" } as React.CSSProperties} ></div> </div>
                     </CardContent>
                   </Card>
                 </div>
            ))}
        </div>
        {/* --- End Metrics Section --- */}


        {/* --- Tabs Section (Unchanged Structure) --- */}
        <Tabs
          defaultValue="activity"
          value={activeTab}
          onValueChange={setActiveTab}
          className="transition-all duration-300"
        >
          {/* Note: Dynamic Tailwind classes might need adjustment */}
          <TabsList className={`grid w-full grid-cols-2 bg-muted/50 backdrop-blur-sm border border-border/50`}>
             <TabsTrigger value="activity" className={`data-[state=active]:bg-${roleColor}-100/20 data-[state=active]:text-${roleColor} transition-all duration-300`}> Recent Activity </TabsTrigger>
             <TabsTrigger value="pending" className={`data-[state=active]:bg-${roleColor}-100/20 data-[state=active]:text-${roleColor} transition-all duration-300`}> Pending Actions </TabsTrigger>
          </TabsList>
          <TabsContent value="activity" className="border-none p-0 pt-4">
             <div className="relative">
                <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
                <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                  <CardHeader> <CardTitle>Recent Activity</CardTitle> <CardDescription>Your latest actions and updates</CardDescription> </CardHeader>
                  <CardContent> <div className="space-y-4"> {roleActivities.map((activity, index) => ( <div key={activity.id} className={`flex items-start gap-4 rounded-lg border border-border/50 bg-background/30 p-3 backdrop-blur-sm transition-all duration-500 ${ isLoaded && activeTab === "activity" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4" }`} style={{ transitionDelay: `${index * 100}ms` }} > <div className={`rounded-full bg-${roleColor}-100/10 p-2 border border-${roleColor}/30 text-${roleColor}`}> <Activity className={`h-4 w-4`} /> </div> <div className="flex-1"> <p className="font-medium">{activity.description}</p> <p className="text-sm text-muted-foreground">{activity.time}</p> </div> </div> ))} </div> </CardContent>
                </Card>
             </div>
          </TabsContent>
          <TabsContent value="pending" className="border-none p-0 pt-4">
            <div className="relative">
               <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
                <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                  <CardHeader> <CardTitle>Pending Actions</CardTitle> <CardDescription>Tasks that require your attention</CardDescription> </CardHeader>
                  <CardContent> <div className="space-y-4"> {rolePendingActions.map((action, index) => ( <div key={action.id} className={`flex items-start gap-4 rounded-lg border border-border/50 bg-background/30 p-3 backdrop-blur-sm transition-all duration-500 ${ isLoaded && activeTab === "pending" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4" }`} style={{ transitionDelay: `${index * 100}ms` }} > <div className={`rounded-full p-2 border ${ action.priority === "High" ? "bg-destructive/10 border-destructive/30" : action.priority === "Medium" ? "bg-secondary/10 border-secondary/30" : "bg-accent/10 border-accent/30" }`}> <AlertCircle className={`h-4 w-4 ${ action.priority === "High" ? "text-destructive" : action.priority === "Medium" ? "text-secondary" : "text-accent" }`} /> </div> <div className="flex-1"> <div className="flex items-center justify-between"> <p className="font-medium">{action.description}</p> <span className={`rounded-full px-2 py-0.5 text-xs ${ action.priority === "High" ? "bg-destructive/10 text-destructive" : action.priority === "Medium" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent" }`}> {action.priority} </span> </div> <div className="mt-2 flex items-center gap-2"> <Button size="sm" className="cyber-button"> Take Action </Button> <Button size="sm" variant="outline" className="cyber-button"> Dismiss </Button> </div> </div> </div> ))} </div> </CardContent>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
        {/* --- End Tabs Section --- */}


        {/* --- Lower Section (Blockchain & Quick Actions - Unchanged Structure) --- */}
         <div className="grid gap-6 md:grid-cols-2">
            {/* Blockchain Card */}
             <div className={`relative transition-all duration-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "600ms" }} >
                 <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
                 <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                     <CardHeader> <CardTitle>Blockchain Transactions</CardTitle> <CardDescription>Recent blockchain activity</CardDescription> </CardHeader>
                     <CardContent>
                       <div className="space-y-4"> {[ { title: "Order Verification", status: "Transaction confirmed", time: "10 min ago" }, { title: "Certificate Issuance", status: "Transaction confirmed", time: "2 hours ago" }, { title: "Shipment Verification", status: "Transaction confirmed", time: "1 day ago" }, ].map((transaction, index) => ( <div key={index} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-3 backdrop-blur-sm group hover:border-primary/50 transition-all duration-300"> <div className="flex items-center gap-3"> <div className="rounded-full bg-primary/10 p-2 border border-primary/30 group-hover:bg-primary/20 transition-all duration-300"> <Shield className="h-4 w-4 text-primary" /> </div> <div> <p className="font-medium">{transaction.title}</p> <p className="text-sm text-muted-foreground">{transaction.status}</p> </div> </div> <p className="text-sm text-muted-foreground">{transaction.time}</p> </div> ))} </div> <div className="mt-4 flex justify-center"> <Link href="#"> <Button variant="outline" size="sm" className="cyber-button"> View All Transactions </Button> </Link> </div>
                     </CardContent>
                 </Card>
             </div>
             {/* Quick Actions Card */}
             <div className={`relative transition-all duration-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "700ms" }} >
                 <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
                 <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                     <CardHeader> <CardTitle>Quick Actions</CardTitle> <CardDescription>Common tasks for your role</CardDescription> </CardHeader>
                     <CardContent>
                       <div className="grid gap-4 md:grid-cols-2">
                           {role === "provider" && ( <> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Package className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Add Raw Material</span> </div> <span className="text-xs text-muted-foreground">Register new materials</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <FileText className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Issue Certificate</span> </div> <span className="text-xs text-muted-foreground">Create quality certificates</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Box className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Manage Inventory</span> </div> <span className="text-xs text-muted-foreground">Update stock levels</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Activity className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Track Shipments</span> </div> <span className="text-xs text-muted-foreground">Monitor deliveries</span> </Button> </> )}
                           {role === "manufacturer" && ( <> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Package className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-300" /> <span className="font-medium">Create Batch</span> </div> <span className="text-xs text-muted-foreground">Start new production</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <FileText className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-300" /> <span className="font-medium">Order Materials</span> </div> <span className="text-xs text-muted-foreground">Request raw materials</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Box className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-300" /> <span className="font-medium">Register Product</span> </div> <span className="text-xs text-muted-foreground">Add finished medicines</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Activity className="h-4 w-4 text-secondary group-hover:text-secondary transition-colors duration-300" /> <span className="font-medium">Quality Control</span> </div> <span className="text-xs text-muted-foreground">Verify product quality</span> </Button> </> )}
                           {role === "distributor" && ( <> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Package className="h-4 w-4 text-accent group-hover:text-accent transition-colors duration-300" /> <span className="font-medium">Order Products</span> </div> <span className="text-xs text-muted-foreground">Purchase from manufacturers</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <FileText className="h-4 w-4 text-accent group-hover:text-accent transition-colors duration-300" /> <span className="font-medium">Manage Warehouse</span> </div> <span className="text-xs text-muted-foreground">Organize storage</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Box className="h-4 w-4 text-accent group-hover:text-accent transition-colors duration-300" /> <span className="font-medium">Process Orders</span> </div> <span className="text-xs text-muted-foreground">Handle retailer requests</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Activity className="h-4 w-4 text-accent group-hover:text-accent transition-colors duration-300" /> <span className="font-medium">Track Shipments</span> </div> <span className="text-xs text-muted-foreground">Monitor deliveries</span> </Button> </> )}
                           {role === "retailer" && ( <> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Package className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Place Order</span> </div> <span className="text-xs text-muted-foreground">Order from distributors</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <FileText className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Verify Products</span> </div> <span className="text-xs text-muted-foreground">Check authenticity</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Box className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">Update Inventory</span> </div> <span className="text-xs text-muted-foreground">Manage stock levels</span> </Button> <Button variant="outline" className="h-auto flex-col items-start gap-1 p-4 text-left cyber-button group"> <div className="flex w-full items-center gap-2"> <Activity className="h-4 w-4 text-primary group-hover:text-primary transition-colors duration-300" /> <span className="font-medium">View History</span> </div> <span className="text-xs text-muted-foreground">Check product journey</span> </Button> </> )}
                       </div>
                     </CardContent>
                 </Card>
             </div>
         </div>
         {/* --- End Lower Section --- */}

      </div> {/* End main flex container */}

       {/* ---- ADDED MODAL RENDER AT THE END (inside Layout, outside main flex container) ---- */}
       {/* Render only if user data is loaded */}
       {actualUserRole && address && (
            <NewOrderModal
                isOpen={isNewOrderModalOpen}
                onClose={() => setIsNewOrderModalOpen(false)}
                currentUserAddress={address}
                currentUserRole={actualUserRole} // Pass the actual logged-in role
                onOrderCreated={handleOrderCreated}
            />
        )}
       {/* ---- END MODAL RENDER ---- */}

    </DashboardLayout>
  );
}