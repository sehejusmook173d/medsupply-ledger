"use client"

import React, { useState, useEffect, use } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from '@/context/wallet-context'; // Adjust path if needed
import DashboardLayout from '@/components/dashboard-layout'; // Adjust path if needed
import {
    Copy, Wallet, CheckCircle, AlertCircle, Moon, Sun, Loader2, Trash2, LogOut
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { useTheme } from "next-themes"; // Import useTheme for dark mode
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog for confirmations
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select" // Import Select for role change


// Props interface remains the same
interface SettingsPageProps {
  params: { role: "provider" | "manufacturer" | "distributor" | "retailer" };
}

// Define available roles for selection
const availableRoles: Array<"provider" | "manufacturer" | "distributor" | "retailer"> = [
    "provider", "manufacturer", "distributor", "retailer"
];

const SettingsPage: React.FC<SettingsPageProps> = ({ params }) => {
  // Get the role from the URL params, primarily for layout/display consistency if needed
  const urlRole = params.role;

  const { address, userData, disconnect, updateUserProfile } = useWallet();
  const { theme, setTheme } = useTheme(); // Hook for dark mode

  // State for various settings
  const [copied, setCopied] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false); // Placeholder state
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof userData?.billNotificationsEnabled === "boolean" ? userData.billNotificationsEnabled : false
  );
  const [selectedRole, setSelectedRole] = useState<string>(
    typeof userData?.role === "string" ? userData.role : urlRole
  );
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete action
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);


  // Update local state when userData from context changes
  useEffect(() => {
    if (userData) {
        setNotificationsEnabled(
          typeof userData.billNotificationsEnabled === "boolean" ? userData.billNotificationsEnabled : false
        );
        setSelectedRole(typeof userData.role === "string" ? userData.role : urlRole);
    }

    // Animation effect
    const timer = setTimeout(() => {
        setIsPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, [userData, urlRole]);


  // --- Handlers for New Settings ---

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
  };

  const handleBiometricChange = (enabled: boolean) => {
    // **Requires Implementation**
    // This would involve complex logic, potentially calling WebAuthn APIs
    // and backend endpoints to register/deregister credentials.
    setBiometricEnabled(enabled); // Update UI state only for now
    toast({ title: "Info", description: "Biometric setting UI updated (implementation required)." });
  };

  const handleNotificationChange = async (enabled: boolean) => {
     if (!address) {
         toast({ title: "Error", description: "Wallet not connected.", variant: "destructive" });
         return;
     }
     setIsSavingNotifications(true);
     try {
         await updateUserProfile(address, { billNotificationsEnabled: enabled });
         setNotificationsEnabled(enabled);
         toast({ title: "Success", description: `Billing notifications ${enabled ? 'enabled' : 'disabled'}.` });
     } catch (error: any) {
         console.error("Error updating notifications:", error);
         toast({ title: "Error", description: "Failed to update notification settings.", variant: "destructive" });
         // Revert UI state on failure
         setNotificationsEnabled(!enabled);
     } finally {
         setIsSavingNotifications(false);
     }
  };

   const handleRoleChange = async (newRole: string) => {
       const currentRole = typeof userData?.role === "string" ? userData.role : urlRole;
       if (!address || !userData || newRole === currentRole) {
           setSelectedRole(currentRole);
           return;
       }
       setIsChangingRole(true);
       try {
            // *** Backend Change & Security Consideration Needed ***
            // 1. Backend: Modify PUT /api/users/[address] OR create a new secure endpoint for role changes.
            // 2. Security: This action MUST be heavily protected. Who is allowed to change roles? Usually only admins.
            //    The current API likely prevents role changes by default.
            // await updateUserProfile(address, { role: newRole });

            // Placeholder until backend is ready:
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
            console.log("Backend call needed for role change to:", newRole);
            // --- End Placeholder

            setSelectedRole(newRole); // Update UI optimistically or after success
            toast({ title: "Role Change Initiated", description: `Role change to ${newRole} requested (requires backend implementation & authorization).` });
            // You might need to refresh user data or even force re-login after a role change
       } catch (error: any) {
           console.error("Error changing role:", error);
           toast({ title: "Error", description: "Failed to change role.", variant: "destructive" });
           setSelectedRole(typeof userData.role === "string" ? userData.role : urlRole);
       } finally {
           setIsChangingRole(false);
       }
   };


  const handleDeleteAccount = async () => {
     if (!address) {
         toast({ title: "Error", description: "Wallet not connected.", variant: "destructive" });
         return;
     }
     setIsDeleting(true);
     try {
         // *** Backend Endpoint Needed ***
         // Create a secure DELETE /api/users/me or DELETE /api/users/[address] endpoint.
         // This endpoint must handle data deletion/anonymization securely.
         // await axios.delete(`/api/users/${address}`); // Example API call

         // Placeholder until backend is ready:
         await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
         console.log("Backend DELETE endpoint needed for address:", address);
         // --- End Placeholder

         toast({ title: "Account Deletion Initiated", description: "Your account deletion process has started." });
         // Disconnect wallet and redirect user after deletion
         disconnect();
         // Redirect logic here, e.g., router.push('/login');
     } catch (error: any) {
         console.error("Error deleting account:", error);
         toast({ title: "Error", description: "Failed to delete account.", variant: "destructive" });
     } finally {
         setIsDeleting(false);
         // Close the dialog - handled by AlertDialogAction onClick
     }
  };


  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
    }
  };

  // Use URL role for determining the theme color accent, if desired
  const roleColor = urlRole === "provider" || urlRole === "retailer" ? "primary" : urlRole === "manufacturer" ? "secondary" : "accent";


  return (
    <DashboardLayout role={userData?.role || urlRole as any}> {/* Pass user's actual role */}
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your application and account settings</p>
          </div>
           {/* Optional: Add a general save button if multiple settings need saving at once,
               or rely on individual toggles/actions saving immediately.
               For simplicity, removed the top-level edit/save button. */}
        </div>

        {/* Settings Sections */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

           {/* Appearance Card */}
           <div className={`relative transition-all duration-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: '100ms' }}>
             <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
             <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
               <CardHeader>
                 <CardTitle>Appearance</CardTitle>
                 <CardDescription>Customize the look and feel.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                   <div className="space-y-0.5">
                     <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                     <p className="text-sm text-muted-foreground">Enable dark theme.</p>
                   </div>
                   <Switch
                     id="dark-mode"
                     checked={theme === 'dark'}
                     onCheckedChange={handleThemeChange}
                     aria-label="Toggle dark mode"
                   />
                 </div>
               </CardContent>
             </Card>
           </div>

            {/* Notifications Card */}
           <div className={`relative transition-all duration-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: '200ms' }}>
             <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
             <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
               <CardHeader>
                 <CardTitle>Notifications</CardTitle>
                 <CardDescription>Manage your notification preferences.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                   <div className="space-y-0.5">
                     <Label htmlFor="bill-notifications" className="text-base">Billing Notifications</Label>
                     <p className="text-sm text-muted-foreground">Receive email notifications for billing.</p>
                   </div>
                   <Switch
                     id="bill-notifications"
                     checked={notificationsEnabled}
                     onCheckedChange={handleNotificationChange}
                     disabled={isSavingNotifications}
                     aria-label="Toggle billing notifications"
                   />
                 </div>
                  {/* Add more notification toggles here if needed */}
               </CardContent>
             </Card>
           </div>

           {/* Security Card */}
           <div className={`relative transition-all duration-500 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: '300ms' }}>
             <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}></div>
             <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
               <CardHeader>
                 <CardTitle>Security</CardTitle>
                 <CardDescription>Manage security settings.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-lg border p-4">
                   <div className="space-y-0.5">
                     <Label htmlFor="biometric-auth" className="text-base">Biometric Authentication</Label>
                     <p className="text-sm text-muted-foreground">Use fingerprint or face ID.</p>
                   </div>
                   <Switch
                     id="biometric-auth"
                     checked={biometricEnabled}
                     onCheckedChange={handleBiometricChange}
                     aria-label="Toggle biometric authentication"
                     // Consider disabling if not implemented: disabled={true}
                   />
                 </div>
                  {/* Display Wallet Address */}
                 <div className="space-y-2 rounded-lg border p-4">
                   <Label>Connected Wallet</Label>
                   <div className="flex items-center gap-2">
                     <Input value={address || "Not connected"} disabled className="font-mono text-sm border-border/50 bg-background/80 backdrop-blur-sm" />
                     <Button variant="outline" size="icon" className="cyber-button shrink-0" onClick={copyAddress} disabled={!address}>
                       <Copy className="h-4 w-4" />
                     </Button>
                   </div>
                   {copied && <p className="text-xs text-primary mt-1">Address copied!</p>}
                 </div>

               </CardContent>
               {/* Optional Logout Button */}
                <CardFooter>
                     <Button variant="outline" className="w-full cyber-button" onClick={disconnect}>
                         <LogOut className="mr-2 h-4 w-4" /> Disconnect Wallet
                     </Button>
                </CardFooter>
             </Card>
           </div>

            {/* Account Management Card */}
           <div className={`relative transition-all duration-500 md:col-span-2 lg:col-span-1 ${isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: '400ms' }}>
             <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-destructive to-destructive/30 opacity-30 blur-sm`}></div>
             <Card className="border border-destructive/50 bg-background/50 backdrop-blur-sm">
               <CardHeader>
                 <CardTitle>Account Management</CardTitle>
                 <CardDescription>Manage roles and account status.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                    {/* Role Display/Change */}
                    <div className="space-y-2 rounded-lg border p-4">
                       <Label htmlFor="role-select">User Role</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={handleRoleChange}
                            disabled={isChangingRole} // Disable while processing
                            // Add logic to disable based on user permissions if needed
                        >
                            <SelectTrigger id="role-select" className="w-full border-border/50 bg-background/80 backdrop-blur-sm capitalize">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r} value={r} className="capitalize">
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                       <p className="text-xs text-muted-foreground">Requires authorization. Changes may need backend implementation.</p>
                    </div>

                     {/* Verification Status */}
                    <div className="space-y-2 rounded-lg border p-4">
                       <Label>Verification Status</Label>
                       <div className="flex items-center gap-2 text-sm">
                        {userData?.verified === true ? (
                          <> <CheckCircle className="h-4 w-4 text-emerald-500" /> <span className="text-emerald-500">Verified</span> </>
                        ) : (
                          <> <AlertCircle className="h-4 w-4 text-amber-500" /> <span className="text-amber-500">Not Verified</span> </>
                        )}
                       </div>
                    </div>

               </CardContent>
                <CardFooter>
                    {/* Delete Account Button & Dialog */}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full cyber-button" disabled={!address || isDeleting}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                        </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account
                            and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isDeleting ? 'Deleting...' : 'Yes, delete account'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
               </CardFooter>
             </Card>
           </div>

        </div> {/* End grid */}
      </div> {/* End main flex container */}
    </DashboardLayout>
  );
};

export default SettingsPage;