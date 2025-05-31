"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, Users } from "lucide-react"
import Link from "next/link"

export default function ParentLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    parentId: "",
    email: "",
  })

  // Demo parents for quick login
  const demoParents = [
    {
      name: "Michael Johnson",
      parentId: "PAR12345",
      email: "michael.johnson@example.com",
      children: ["Jane Johnson", "Mark Johnson"]
    },
    {
      name: "Sarah Williams",
      parentId: "PAR67890",
      email: "sarah.williams@example.com",
      children: ["Emma Williams"]
    },
  ]

  const handleDemoLogin = (parent: (typeof demoParents)[0]) => {
    setFormData({
      parentId: parent.parentId,
      email: parent.email,
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Handle parent login
    try {
      if (!formData.parentId) {
        setError("Parent ID is required");
        setIsLoading(false);
        return;
      }
      
      // Find parent in demo data to get children info
      const parent = demoParents.find(p => p.parentId === formData.parentId);
      
      // Store parent info in localStorage for the dashboard to use
      localStorage.setItem("parentId", formData.parentId);
      localStorage.setItem("parentName", parent?.name || formData.email.split('@')[0] || "Parent");
      localStorage.setItem("userType", "parent");
      
      // Store children information
      if (parent) {
        localStorage.setItem("children", JSON.stringify(parent.children));
      }
      
      // In a real implementation, you would verify the parent credentials here
      // against the database using a proper API endpoint
      
      // Redirect to parent dashboard
      router.push("/parent/dashboard");
    } catch (error: any) {
      console.error('Parent login error:', error);
      setError(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Central Health</h1>
          <p className="text-gray-500">Sierra Leone's National Health System</p>
        </div>

        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Parent Login</CardTitle>
            <CardDescription>Access your children's health records</CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent ID</Label>
                  <Input
                    id="parentId"
                    placeholder="Enter your parent ID"
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                
                {/* Quick login buttons for demo parents */}
                <div className="pt-2">
                  <p className="text-sm font-medium text-center mb-2">Quick Access (Demo)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {demoParents.map((parent, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDemoLogin(parent)}
                      >
                        {parent.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Access Children's Records"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t p-4">
            <div className="text-center text-sm">
              <p>Don't have an account?</p>
              <Link href="/auth/signup" className="underline text-primary">
                Register as a Parent
              </Link>
            </div>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/login" className="text-sm text-gray-500 hover:text-primary">
                Patient Login
              </Link>
              <Link href="/auth/staff-login" className="text-sm text-gray-500 hover:text-primary">
                Staff Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
