"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  Download,
  Trash2,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plug,
  Package,
  Shield,
} from "lucide-react"

export default function PluginsPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const installedPlugins = [
    {
      id: "billing-system",
      name: "Advanced Billing System",
      version: "2.1.0",
      description: "Comprehensive billing and insurance management",
      status: "active",
      author: "MediCore Team",
      category: "Finance",
      lastUpdated: "2024-01-15",
    },
    {
      id: "lab-integration",
      name: "Laboratory Integration",
      version: "1.8.3",
      description: "Connect with external laboratory systems",
      status: "active",
      author: "LabTech Solutions",
      category: "Integration",
      lastUpdated: "2024-01-10",
    },
    {
      id: "telemedicine",
      name: "Telemedicine Portal",
      version: "3.0.1",
      description: "Video consultations and remote patient monitoring",
      status: "inactive",
      author: "TeleMed Inc",
      category: "Communication",
      lastUpdated: "2024-01-05",
    },
    {
      id: "pharmacy-connect",
      name: "Pharmacy Connect",
      version: "1.5.2",
      description: "Direct prescription management with pharmacies",
      status: "active",
      author: "PharmLink",
      category: "Integration",
      lastUpdated: "2023-12-28",
    },
  ]

  const availablePlugins = [
    {
      id: "ai-diagnostics",
      name: "AI Diagnostic Assistant",
      version: "1.0.0",
      description: "Machine learning powered diagnostic suggestions",
      author: "AI Health Solutions",
      category: "AI/ML",
      price: "$299/month",
      rating: 4.8,
    },
    {
      id: "inventory-management",
      name: "Smart Inventory Management",
      version: "2.3.1",
      description: "Automated inventory tracking and ordering",
      author: "InventoryPro",
      category: "Operations",
      price: "$149/month",
      rating: 4.6,
    },
    {
      id: "patient-portal",
      name: "Enhanced Patient Portal",
      version: "1.9.0",
      description: "Advanced patient self-service portal",
      author: "PatientFirst",
      category: "Patient Care",
      price: "$199/month",
      rating: 4.7,
    },
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleInstallPlugin = async () => {
    if (!uploadedFile) return

    setIsUploading(true)
    // Simulate upload process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsUploading(false)
    setUploadedFile(null)

    // Reset file input
    const fileInput = document.getElementById("plugin-file") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const togglePluginStatus = (pluginId: string) => {
    // In a real app, this would make an API call
    console.log(`Toggling plugin: ${pluginId}`)
  }

  const uninstallPlugin = (pluginId: string) => {
    // In a real app, this would make an API call
    console.log(`Uninstalling plugin: ${pluginId}`)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Plugin Management</h2>
      </div>

      <Tabs defaultValue="installed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="installed">Installed Plugins</TabsTrigger>
          <TabsTrigger value="marketplace">Plugin Marketplace</TabsTrigger>
          <TabsTrigger value="upload">Upload Plugin</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          <div className="grid gap-4">
            {installedPlugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Plug className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plugin.name}</CardTitle>
                        <CardDescription>{plugin.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={plugin.status === "active" ? "default" : "secondary"}>
                        {plugin.status === "active" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {plugin.status}
                      </Badge>
                      <Badge variant="outline">{plugin.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>
                        Version: {plugin.version} • By {plugin.author}
                      </p>
                      <p>Last updated: {plugin.lastUpdated}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => togglePluginStatus(plugin.id)}>
                        {plugin.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => uninstallPlugin(plugin.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availablePlugins.map((plugin) => (
              <Card key={plugin.id}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{plugin.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{plugin.category}</Badge>
                        <span className="text-sm text-muted-foreground">★ {plugin.rating}</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{plugin.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>
                        v{plugin.version} • By {plugin.author}
                      </p>
                      <p className="font-semibold text-foreground">{plugin.price}</p>
                    </div>
                    <Button size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Custom Plugin</CardTitle>
              <CardDescription>
                Upload a custom plugin package (.zip file) to install in your hospital system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Only upload plugins from trusted sources. Malicious plugins can compromise your system security.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="plugin-file">Plugin Package</Label>
                <Input id="plugin-file" type="file" accept=".zip,.tar.gz" onChange={handleFileUpload} />
                {uploadedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {uploadedFile && (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please review the plugin documentation and ensure compatibility before installation.
                    </AlertDescription>
                  </Alert>

                  <Button onClick={handleInstallPlugin} disabled={isUploading} className="w-full">
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Installing Plugin...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Install Plugin
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Plugin Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Plugin must be in .zip or .tar.gz format</li>
                  <li>• Maximum file size: 100MB</li>
                  <li>• Must include valid manifest.json file</li>
                  <li>• Compatible with MediCore API v2.0+</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
