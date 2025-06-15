"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Upload, Download, Settings, Trash2, Eye, Plus, Code, Puzzle, CheckCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import PluginList from "./plugin-list";
import PluginUploadDialog from "./plugin-upload-dialog";

interface ModuleType {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: string;
  category: string;
  downloads?: number;
  rating?: number;
  size?: string;
  uploadDate?: string;
  price?: string;
  features?: string[];
  installed?: boolean;
  type?: string;
  compatibility?: string;
  installedAt?: string;
}

export default function ModulesPage() {
  const [activeTab, setActiveTab] = useState<string>('installed');
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    version: "",
    description: "",
    category: "",
    author: "",
  });

  const [modules, setModules] = useState<ModuleType[]>([
    {
      id: "billing",
      name: "Billing",
      description: "Patient billing and invoicing system",
      author: "FHIR Systems",
      version: "1.2.1",
      status: "installed",
      type: "core",
      category: "billing",
      compatibility: "compatible",
      installedAt: "2022-05-12",
    },
    {
      id: "pharmacy",
      name: "Pharmacy",
      description: "Medication management and dispensing",
      author: "MedTech Solutions",
      version: "2.0.0",
      status: "installed",
      type: "core",
      category: "pharmacy",
      compatibility: "compatible",
      installedAt: "2022-05-12",
    },
    {
      id: "lab",
      name: "Laboratory",
      description: "Lab test ordering and results tracking",
      author: "FHIR Systems",
      version: "1.0.3",
      status: "installed",
      type: "premium",
      category: "diagnostics",
      compatibility: "compatible",
      installedAt: "2022-08-24",
    },
    {
      id: "telemedicine",
      name: "Telemedicine",
      description: "Virtual consultation and remote patient monitoring",
      author: "HealthConnect",
      version: "1.5.2",
      status: "available",
      type: "premium",
      category: "consultation",
      compatibility: "compatible",
    },
    {
      id: "ai-diagnosis",
      name: "AI Diagnosis Assistant",
      description: "AI-powered diagnostic suggestions and clinical decision support",
      author: "MediAI Inc.",
      version: "0.9.1",
      status: "available",
      type: "premium",
      category: "diagnostics",
      compatibility: "compatible",
    },
    {
      id: "sms-reminders",
      name: "SMS Appointment Reminders",
      description: "Automated SMS reminders for patient appointments",
      author: "Notify Health",
      version: "2.1.0",
      status: "available",
      type: "premium",
      category: "automation",
      compatibility: "compatible",
    },
  ]);

  const [marketplaceModules] = useState<ModuleType[]>([
    {
      id: "5",
      name: "Health Information Exchange",
      version: "2.0.1",
      description: "Connect with regional health information exchanges and networks",
      author: "Interop Health",
      status: "available",
      category: "integration",
      downloads: 3450,
      rating: 4.7,
      size: "4.2 MB",
      uploadDate: "2024-05-08",
      type: "premium",
      compatibility: "compatible",
    },
    {
      id: "custom-reports",
      name: "Custom Reports",
      version: "1.5.2",
      description: "Create custom reports with drag-and-drop interface",
      author: "ReportTech Solutions",
      status: "available",
      category: "reporting",
      downloads: 1890,
      rating: 4.7,
      size: "4.2 MB",
      price: "Free",
      features: ["Drag & Drop Builder", "50+ Templates", "Export to PDF/Excel", "Scheduled Reports"],
      installed: false,
      type: "premium",
      compatibility: "compatible",
    },
    {
      id: "workflow-automation",
      name: "Workflow Automation",
      version: "3.0.1",
      description: "Automate routine hospital processes and workflows",
      author: "AutoFlow Systems",
      status: "available",
      category: "automation",
      downloads: 1456,
      rating: 4.8,
      size: "6.7 MB",
      price: "$29/month",
      features: ["Visual Workflow Builder", "Trigger Conditions", "Email/SMS Actions", "Approval Workflows"],
      installed: false,
      type: "premium",
      compatibility: "compatible",
    },
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setUploadForm((prev) => ({ ...prev, name: fileName }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.version) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const newModule = {
        id: Date.now().toString(),
        name: uploadForm.name,
        version: uploadForm.version,
        description: uploadForm.description,
        author: uploadForm.author || "Unknown",
        status: "pending",
        category: uploadForm.category || "other",
        type: "custom",
        compatibility: "compatible",
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split("T")[0],
      };

      setModules([...modules, newModule]);
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ name: "", version: "", description: "", category: "", author: "" });
      toast.success("Module uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload module");
      console.error(error);
    }
  };

  const handleInstallFromMarketplace = (moduleId: string) => {
    const marketplaceModule = marketplaceModules.find((m) => m.id === moduleId);
    if (!marketplaceModule) return;

    const newModule = {
      id: Date.now().toString(),
      name: marketplaceModule.name,
      version: marketplaceModule.version,
      description: marketplaceModule.description,
      author: marketplaceModule.author,
      status: "active",
      category: marketplaceModule.category,
      type: marketplaceModule.type || "premium",
      compatibility: marketplaceModule.compatibility || "compatible",
      downloads: marketplaceModule.downloads,
      rating: marketplaceModule.rating,
      size: marketplaceModule.size,
      uploadDate: new Date().toISOString().split("T")[0],
    };

    setModules([...modules, newModule]);
    toast.success(`${marketplaceModule.name} installed successfully!`);
  };

  const handleStatusChange = (moduleId: string, status: string) => {
    setModules(modules.map((module) => 
      module.id === moduleId ? { ...module, status } : module
    ));
    toast(`Module status updated to ${status}`);
  };

  const handleDelete = (moduleId: string) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId));
    toast.success("Module deleted successfully");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "inactive": return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  type CategoryColors = {
    [key: string]: string;
    billing: string;
    consultation: string;
    diagnostics: string;
    pharmacy: string;
    integration: string;
    reporting: string;
    automation: string;
    other: string;
  };
  
  const getCategoryBadge = (category: string) => {
    const colors: CategoryColors = {
      billing: "bg-blue-100 text-blue-800",
      consultation: "bg-green-100 text-green-800",
      diagnostics: "bg-purple-100 text-purple-800",
      pharmacy: "bg-emerald-100 text-emerald-800",
      integration: "bg-amber-100 text-amber-800",
      reporting: "bg-sky-100 text-sky-800",
      automation: "bg-rose-100 text-rose-800",
      other: "bg-gray-100 text-gray-800",
    };

    return <Badge className={colors[category] || colors.other}>{category}</Badge>;
  };

  const handlePluginsRefresh = () => {
    toast.success("Plugin list refreshed");
  };

  const handleUploadSuccess = () => {
    toast.success("Plugin uploaded and installed successfully");
    handlePluginsRefresh();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Module/Extension Management"
        description="Upload, manage, and configure system modules and extensions"
        breadcrumbs={[
          { label: "Home" }, 
          { label: "System Settings" }, 
          { label: "Module/Extension" }
        ]}
      />

      <PluginUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadSuccess}
      />

      <Tabs defaultValue="installed" className="space-y-4" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="installed">
              <Package className="mr-2 h-4 w-4" />
              Installed
            </TabsTrigger>
            <TabsTrigger value="marketplace">
              <Download className="mr-2 h-4 w-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setUploadDialogOpen(true)} 
              variant="outline" 
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Plugin
            </Button>
            <Button 
              onClick={handlePluginsRefresh} 
              variant="outline" 
              size="sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="installed">
          {activeTab === "installed" && <PluginList />}
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
                      <span>{module.downloads?.toLocaleString()} downloads</span>
                      <span>•</span>
                      <span>⭐ {module.rating}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getCategoryBadge(module.category)}
                      <Badge variant="outline">{module.price}</Badge>
                    </div>
                    
                    {module.features && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Features:</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {module.features.map((feature, index) => (
                            <Badge key={index} variant="outline">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      {module.installed ? (
                        <Button variant="outline" className="flex-1" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Installed
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1" 
                          onClick={() => handleInstallFromMarketplace(module.id)}
                        >
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
              <CardTitle>Upload New Module</CardTitle>
              <CardDescription>
                Upload your custom modules and extensions to enhance the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={() => setUploadDialogOpen(true)} 
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Module Package
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}