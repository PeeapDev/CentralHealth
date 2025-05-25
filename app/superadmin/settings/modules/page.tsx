"use client"

import type React from "react"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Upload, Download, Settings, Trash2, Eye, Plus, Code, Puzzle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function ModulesPage() {
  const [modules, setModules] = useState([
    {
      id: "1",
      name: "Advanced Billing",
      version: "1.2.0",
      description: "Enhanced billing module with insurance integration",
      author: "MediCore Team",
      status: "active",
      category: "billing",
      downloads: 1250,
      rating: 4.8,
      size: "2.5 MB",
      uploadDate: "2024-05-15",
    },
    {
      id: "2",
      name: "Telemedicine",
      version: "2.1.0",
      description: "Video consultation and remote patient monitoring",
      author: "HealthTech Solutions",
      status: "active",
      category: "consultation",
      downloads: 890,
      rating: 4.6,
      size: "5.2 MB",
      uploadDate: "2024-05-10",
    },
    {
      id: "3",
      name: "AI Diagnostics",
      version: "1.0.0",
      description: "Machine learning powered diagnostic assistance",
      author: "AI Health Labs",
      status: "pending",
      category: "diagnostics",
      downloads: 0,
      rating: 0,
      size: "12.8 MB",
      uploadDate: "2024-05-20",
    },
    {
      id: "4",
      name: "API Integration Hub",
      version: "2.1.0",
      description: "Connect with external healthcare systems via HL7, FHIR, and custom APIs",
      author: "MediCore Team",
      status: "active",
      category: "integration",
      downloads: 2150,
      rating: 4.9,
      size: "8.3 MB",
      uploadDate: "2024-05-18",
    },
  ])

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    version: "",
    description: "",
    category: "",
    author: "",
  })

  const [marketplaceModules] = useState([
    {
      id: "api-integration-hub",
      name: "API Integration Hub",
      version: "2.1.0",
      description: "Connect with external healthcare systems via HL7, FHIR, and custom APIs",
      author: "MediCore Team",
      category: "integration",
      downloads: 2150,
      rating: 4.9,
      size: "8.3 MB",
      price: "Free",
      features: ["HL7 v2.x Support", "FHIR R4 Compliance", "Custom API Connectors", "Real-time Sync"],
      installed: true,
    },
    {
      id: "custom-reports",
      name: "Custom Reports",
      version: "1.5.2",
      description: "Create custom reports with drag-and-drop interface",
      author: "ReportTech Solutions",
      category: "reporting",
      downloads: 1890,
      rating: 4.7,
      size: "4.2 MB",
      price: "Free",
      features: ["Drag & Drop Builder", "50+ Templates", "Export to PDF/Excel", "Scheduled Reports"],
      installed: false,
    },
    {
      id: "workflow-automation",
      name: "Workflow Automation",
      version: "3.0.1",
      description: "Automate routine hospital processes and workflows",
      author: "AutoFlow Systems",
      category: "automation",
      downloads: 1456,
      rating: 4.8,
      size: "6.7 MB",
      price: "$29/month",
      features: ["Visual Workflow Builder", "Trigger Conditions", "Email/SMS Actions", "Approval Workflows"],
      installed: false,
    },
  ])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill name from filename
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      setUploadForm((prev) => ({ ...prev, name: fileName }))
    }
  }

  const handleUpload = () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.version) {
      toast.error("Please fill in all required fields")
      return
    }

    const newModule = {
      id: Date.now().toString(),
      name: uploadForm.name,
      version: uploadForm.version,
      description: uploadForm.description,
      author: uploadForm.author || "Unknown",
      status: "pending",
      category: uploadForm.category || "other",
      downloads: 0,
      rating: 0,
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split("T")[0],
    }

    setModules((prev) => [...prev, newModule])
    setUploadDialogOpen(false)
    setSelectedFile(null)
    setUploadForm({ name: "", version: "", description: "", category: "", author: "" })
    toast.success("Module uploaded successfully")
  }

  const handleInstallFromMarketplace = (moduleId: string) => {
    const marketplaceModule = marketplaceModules.find((m) => m.id === moduleId)
    if (!marketplaceModule) return

    const newModule = {
      id: Date.now().toString(),
      name: marketplaceModule.name,
      version: marketplaceModule.version,
      description: marketplaceModule.description,
      author: marketplaceModule.author,
      status: "active",
      category: marketplaceModule.category,
      downloads: marketplaceModule.downloads,
      rating: marketplaceModule.rating,
      size: marketplaceModule.size,
      uploadDate: new Date().toISOString().split("T")[0],
    }

    setModules((prev) => [...prev, newModule])
    toast.success(`${marketplaceModule.name} installed successfully!`)
  }

  const handleStatusChange = (moduleId: string, newStatus: string) => {
    setModules((prev) => prev.map((module) => (module.id === moduleId ? { ...module, status: newStatus } : module)))
    toast.success(`Module status updated to ${newStatus}`)
  }

  const handleDelete = (moduleId: string) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId))
    toast.success("Module deleted successfully")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      billing: "bg-blue-100 text-blue-800",
      consultation: "bg-purple-100 text-purple-800",
      diagnostics: "bg-green-100 text-green-800",
      pharmacy: "bg-orange-100 text-orange-800",
      integration: "bg-indigo-100 text-indigo-800",
      reporting: "bg-pink-100 text-pink-800",
      automation: "bg-cyan-100 text-cyan-800",
      other: "bg-gray-100 text-gray-800",
    }
    return <Badge className={colors[category] || colors.other}>{category}</Badge>
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Module/Extension Management"
        description="Upload, manage, and configure system modules and extensions"
        breadcrumbs={[{ label: "Home" }, { label: "System Settings" }, { label: "Module/Extension" }]}
      />

      <Tabs defaultValue="installed" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="installed">Installed Modules</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="upload">Upload Module</TabsTrigger>
          </TabsList>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Module
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Module</DialogTitle>
                <DialogDescription>
                  Upload a custom module or extension to extend system functionality
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="module-file">Module File (.zip)</Label>
                    <Input id="module-file" type="file" accept=".zip,.tar.gz" onChange={handleFileSelect} />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-name">Module Name *</Label>
                    <Input
                      id="module-name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter module name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="module-version">Version *</Label>
                    <Input
                      id="module-version"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm((prev) => ({ ...prev, version: e.target.value }))}
                      placeholder="e.g., 1.0.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-category">Category</Label>
                    <Select
                      value={uploadForm.category}
                      onValueChange={(value) => setUploadForm((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="diagnostics">Diagnostics</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="reporting">Reporting</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="automation">Automation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module-author">Author</Label>
                  <Input
                    id="module-author"
                    value={uploadForm.author}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, author: e.target.value }))}
                    placeholder="Module author/developer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module-description">Description</Label>
                  <Textarea
                    id="module-description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this module does..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Module
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="installed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Installed Modules
              </CardTitle>
              <CardDescription>Manage installed modules and extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{module.name}</div>
                          <div className="text-sm text-muted-foreground">{module.description}</div>
                          <div className="text-xs text-muted-foreground">by {module.author}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{module.version}</Badge>
                      </TableCell>
                      <TableCell>{getCategoryBadge(module.category)}</TableCell>
                      <TableCell>{getStatusBadge(module.status)}</TableCell>
                      <TableCell>{module.downloads.toLocaleString()}</TableCell>
                      <TableCell>{module.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select value={module.status} onValueChange={(value) => handleStatusChange(module.id, value)}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(module.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {marketplaceModules.map((module) => (
              <Card key={module.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        {module.category === "integration" ? (
                          <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        ) : module.category === "reporting" ? (
                          <Puzzle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{module.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">by {module.author}</p>
                      </div>
                    </div>
                    {module.installed && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Installed
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>v{module.version}</span>
                      <span>•</span>
                      <span>{module.size}</span>
                      <span>•</span>
                      <span>{module.downloads.toLocaleString()} downloads</span>
                      <span>•</span>
                      <span>⭐ {module.rating}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getCategoryBadge(module.category)}
                      <Badge variant="outline">{module.price}</Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Features:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {module.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      {module.installed ? (
                        <Button variant="outline" className="flex-1" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Installed
                        </Button>
                      ) : (
                        <Button className="flex-1" onClick={() => handleInstallFromMarketplace(module.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Install
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Custom Module
              </CardTitle>
              <CardDescription>Upload your own custom modules and extensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload Module Package</h3>
                <p className="text-muted-foreground mb-4">Drag and drop your module file here, or click to browse</p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New Module
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
