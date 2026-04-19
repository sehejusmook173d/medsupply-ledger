"use client"

// 1. Import 'use' from React
import React, { useEffect, useState, use } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard-layout"; // Assuming this component exists
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/context/wallet-context"; // Assuming path is correct
import { Copy, Edit, Save, Shield } from "lucide-react";

// 2. Update props interface to indicate params is a Promise
function pickStr(v: unknown): string {
  return typeof v === "string" ? v : ""
}

interface ProfilePageProps {
  params: {
    role: "provider" | "manufacturer" | "distributor" | "retailer";
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { role } = params;

  // Get address from wallet context
  const { address, userData, updateUserProfile } = useWallet(); // Assuming updateUserProfile and userData exist in context
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added for save button loading state

  // Use state for profile data, initialized empty or from context if available
  const [profileData, setProfileData] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    location: "",
    registrationId: "",
    licenseNumber: "",
  });

  // Effect to load actual user data from context when available
  useEffect(() => {
      if (userData) {
        setProfileData({
            name: pickStr(userData.name),
            companyName: pickStr(userData.companyName),
            email: pickStr(userData.email),
            phone: pickStr(userData.phone),
            location: pickStr(userData.location),
            registrationId: pickStr(userData.registrationId),
            licenseNumber: pickStr(userData.licenseNumber),
        });
        setIsLoaded(true);
      } else if (address) {
          // Optional: Add logic here to fetch user data if it wasn't loaded initially by context
          // e.g., call a function like checkUserRegistration(address) from context
          // For now, we rely on userData being populated by the context provider
          setIsLoaded(true); // Or keep loading until data is confirmed absent/present
      } else {
        setIsLoaded(false); // Not loaded if no address or user data
      }
  }, [userData, address]); // Depend on userData and address

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Updated save handler to use context function
  const handleSave = async () => {
    if (!address) {
        console.error("Wallet not connected");
        return;
    }
    setIsLoading(true);
    try {
      await updateUserProfile(address, profileData); // Pass current address and form data
      setIsEditing(false);
      // Add success feedback, e.g., toast notification
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Add error feedback, e.g., toast notification
    } finally {
        setIsLoading(false);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Use the 'role' variable which is now correctly obtained
  const roleColor =
    role === "provider" || role === "retailer" ? "primary" : role === "manufacturer" ? "secondary" : "accent";

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
          </div>
          <Button
             onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
             className="cyber-button"
             disabled={isLoading} // Disable button while loading
           >
            {isEditing ? (
              <>
                {isLoading ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-primary"></div>
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {!isLoaded ? (
          // Loading state
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="relative animate-pulse">
                 <div className="h-[300px] rounded-lg bg-muted/50"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <div className="relative">
               <div
                 className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}
               ></div>
               <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                 <CardHeader>
                   <CardTitle>Personal Information</CardTitle>
                   <CardDescription>Your profile details</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   {/* Use profileData state for values */}
                   <div className="space-y-2">
                     <Label htmlFor="name">Name</Label>
                     <Input
                       id="name"
                       name="name"
                       value={profileData.name}
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="companyName">Company Name</Label>
                     <Input
                       id="companyName"
                       name="companyName"
                       value={profileData.companyName}
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                       id="email"
                       name="email"
                       type="email"
                       value={profileData.email}
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="phone">Phone</Label>
                     <Input
                       id="phone"
                       name="phone"
                       value={profileData.phone}
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="location">Location</Label>
                     <Input
                       id="location"
                       name="location"
                       value={profileData.location}
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>
                 </CardContent>
               </Card>
            </div>

            {/* Blockchain & License Information */}
            <div className="relative">
               <div
                 className={`absolute -inset-0.5 rounded-lg bg-gradient-to-br from-${roleColor} to-${roleColor}/30 opacity-30 blur-sm`}
               ></div>
               <Card className="border border-border/50 bg-background/50 backdrop-blur-sm">
                 <CardHeader>
                   <CardTitle>Blockchain & License Information</CardTitle>
                   <CardDescription>Your verification credentials</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="walletAddress">Wallet Address</Label>
                     <div className="flex items-center gap-2">
                       <Input
                         id="walletAddress"
                         value={address || "Not connected"}
                         disabled
                         className="font-mono text-sm border-border/50 bg-background/50 backdrop-blur-sm"
                       />
                       <Button
                         variant="outline"
                         size="icon"
                         className="cyber-button"
                         onClick={copyAddress}
                         disabled={!address}
                       >
                         <Copy className="h-4 w-4" />
                       </Button>
                     </div>
                     {copied && <p className="text-xs text-primary">Address copied to clipboard!</p>}
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="registrationId">Registration ID</Label>
                     <Input
                       id="registrationId"
                       name="registrationId"
                       value={profileData.registrationId} // Use state value
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="licenseNumber">License Number</Label>
                     <Input
                       id="licenseNumber"
                       name="licenseNumber"
                       value={profileData.licenseNumber} // Use state value
                       onChange={handleInputChange}
                       disabled={!isEditing}
                       className="border-border/50 bg-background/50 backdrop-blur-sm"
                     />
                   </div>

                   <div className="mt-6 rounded-lg border border-border/50 bg-background/30 p-4 backdrop-blur-sm">
                     <div className="flex items-center gap-3">
                       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
                         <Shield className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                         <h4 className="text-sm font-medium">Blockchain Verified</h4>
                         <p className="text-xs text-muted-foreground">
                           {/* You might want to derive this status from userData */}
                           {userData?.verified ? 'Your identity has been verified on the blockchain' : 'Your identity is not yet verified'}
                         </p>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}