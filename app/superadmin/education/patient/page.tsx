"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { 
  EducationalResource, 
  getAllEducationResources,
  addEducationResource,
  deleteEducationResource,
  getYouTubeEmbedUrl
} from "@/lib/education-resources-storage"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, TableBody, TableCell, 
  TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Download, 
  FileText, 
  LayoutGrid, 
  List, 
  Plus, 
  Search, 
  Upload,
  CheckCircle,
  Trash2,
  Video,
  File,
  Lightbulb,
  Presentation
} from "lucide-react"

const categoryOptions = [
  "Antenatal", "Nutrition", "Exercise", "First Trimester",
  "Second Trimester", "Third Trimester", "Symptoms", "Self-Care", "Supplements"
];

const resourceTypes: EducationalResource['type'][] = ["Video", "PDF", "Interactive", "Webinar"];

const fileTypeIcon = (type: EducationalResource['type']) => {
  const style = "h-5 w-5";
  switch (type) {
    case "Video": return <Video className={`${style} text-blue-500`} />;
    case "PDF": return <File className={`${style} text-red-500`} />;
    case "Interactive": return <Lightbulb className={`${style} text-purple-500`} />;
    case "Webinar": return <Presentation className={`${style} text-green-500`} />;
    default: return <FileText className={style} />;
  }
};

export default function PatientEducationPage() {
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [resourceSource, setResourceSource] = useState<"file" | "youtube">("youtube");
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState = {
    title: "",
    type: "Video" as EducationalResource['type'],
    categories: [] as string[],
    url: "",
    description: "",
    duration: "",
    targetAudience: "Patient" as const,
    size: "N/A"
  };

  const [newResource, setNewResource] = useState(initialFormState);

  useEffect(() => {
    // Check if the obstetric emergencies video exists
    const storedResources = getAllEducationResources().filter(r => r.targetAudience === 'Patient' || r.targetAudience === 'Both');
    const videoExists = storedResources.some(r => r.url?.includes('wt9-6VWbfHI'));
    
    // Add the video if it doesn't exist yet
    if (!videoExists) {
      const youtubeUrl = 'https://www.youtube.com/watch?v=wt9-6VWbfHI';
      const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
      
      if (embedUrl) {
        const videoIdMatch = embedUrl.match(/embed\/([^?]+)/);
        const thumbnailUrl = videoIdMatch ? `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg` : '';

        // Create resource object with real clinical education content (not mock data)
        const videoResource = {
          title: "Understanding Obstetric Emergencies",
          type: "Video" as const,
          categories: ["Antenatal", "First Trimester", "Second Trimester", "Third Trimester"],
          targetAudience: 'Patient' as const,
          size: 'N/A',
          duration: "10:43",
          url: embedUrl,
          thumbnailUrl,
          description: "Comprehensive guide to identifying and managing obstetric emergencies. Important for expectant mothers to recognize warning signs.",
          viewCount: 0,
          completionCount: 0
        };
        
        // Add the resource
        addEducationResource(videoResource);
        console.log('Added obstetric emergencies video to resources');
      }
    }

    // Get updated resources
    const updatedResources = getAllEducationResources().filter(r => r.targetAudience === 'Patient' || r.targetAudience === 'Both');
    setResources(updatedResources);
  }, []);

  const resetForm = () => {
    setNewResource(initialFormState);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setResourceSource("youtube");
  };

  const handleInputChange = (field: keyof typeof newResource, value: string | string[]) => {
    setNewResource(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    setNewResource(prev => {
      const newCategories = checked
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category);
      return { ...prev, categories: newCategories };
    });
  };

  const handleUploadResource = () => {
    if (!newResource.title) return alert("Please enter a title.");
    if (resourceSource === "youtube" && !newResource.url) return alert("Please enter a YouTube URL.");

    const embedUrl = resourceSource === "youtube" ? getYouTubeEmbedUrl(newResource.url) : "#";
    if (resourceSource === "youtube" && (!embedUrl || !embedUrl.includes('embed'))) {
      return alert("Invalid YouTube URL. Please use a valid watch or share link.");
    }

    const videoIdMatch = embedUrl.match(/embed\/([^?]+)/);
    const thumbnailUrl = videoIdMatch ? `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg` : '';

    const resourceToSave = {
      ...newResource,
      targetAudience: 'Patient' as const,
      size: 'N/A',
      viewCount: 0,
      completionCount: 0,
      url: embedUrl,
      thumbnailUrl,
      categories: newResource.categories.length > 0 ? newResource.categories : ["General"],
      description: newResource.description || newResource.title
    };

    if (addEducationResource(resourceToSave)) {
      setResources(getAllEducationResources().filter(r => r.targetAudience === 'Patient' || r.targetAudience === 'Both'));
      resetForm();
      setIsAddResourceOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert("Failed to save resource.");
    }
  };

  const handleDeleteResource = (resourceId: string) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      if (deleteEducationResource(resourceId)) {
        setResources(prev => prev.filter(r => r.id !== resourceId));
      } else {
        alert("Failed to delete resource.");
      }
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategories = selectedCategories.length === 0 || selectedCategories.every(cat => resource.categories.includes(cat));
      const matchesType = selectedType === "all" || resource.type === selectedType;
      return matchesSearch && matchesCategories && matchesType;
    });
  }, [resources, searchTerm, selectedCategories, selectedType]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {showSuccess && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-5 duration-500 z-50">
          <CheckCircle size={16} />
          <span>Resource uploaded successfully!</span>
        </div>
      )}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Education Resources</h1>
          <p className="text-muted-foreground">Manage educational materials for patients.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add New Resource</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Educational Resource</DialogTitle>
                <DialogDescription>Upload content for patients. It will be available across the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="title" className="text-right text-sm font-medium">Title</label>
                  <Input id="title" placeholder="e.g., 'Managing Morning Sickness'" className="col-span-3" value={newResource.title} onChange={(e) => handleInputChange('title', e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="type" className="text-right text-sm font-medium">Type</label>
                  <Select value={newResource.type} onValueChange={(value: EducationalResource['type']) => handleInputChange('type', value)}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right text-sm font-medium pt-2">Categories</label>
                  <ScrollArea className="h-32 col-span-3 rounded-md border">
                    <div className="p-4">
                      {categoryOptions.map(cat => (
                        <div key={cat} className="flex items-center space-x-2 mb-2">
                          <Checkbox id={`cat-${cat}`} checked={newResource.categories.includes(cat)} onCheckedChange={(checked) => handleCategoryChange(cat, !!checked)} />
                          <label htmlFor={`cat-${cat}`} className="text-sm font-normal">{cat}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">Source</label>
                  <div className="col-span-3 flex gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="source-youtube" value="youtube" checked={resourceSource === "youtube"} onChange={() => setResourceSource("youtube")} className="accent-primary" />
                      <label htmlFor="source-youtube">YouTube</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="source-file" value="file" checked={resourceSource === "file"} onChange={() => setResourceSource("file")} className="accent-primary" />
                      <label htmlFor="source-file">File</label>
                    </div>
                  </div>
                </div>
                {resourceSource === "file" ? (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">File</label>
                    <div className="col-span-3">
                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PDF, MP4 (MAX. 100MB)</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" ref={fileInputRef} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="youtube-url" className="text-right text-sm font-medium">URL</label>
                      <Input id="youtube-url" placeholder="https://www.youtube.com/watch?v=..." className="col-span-3" value={newResource.url} onChange={(e) => handleInputChange('url', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="description" className="text-right text-sm font-medium">Description</label>
                      <Input id="description" placeholder="Short summary for the video" className="col-span-3" value={newResource.description} onChange={(e) => handleInputChange('description', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="duration" className="text-right text-sm font-medium">Duration</label>
                      <Input id="duration" placeholder="e.g., 5m 30s" className="col-span-3" value={newResource.duration} onChange={(e) => handleInputChange('duration', e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddResourceOpen(false)}>Cancel</Button>
                <Button onClick={handleUploadResource}>Upload Resource</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export List</Button>
        </div>
      </header>

      <Tabs defaultValue="list" className="w-full">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resource Library</CardTitle>
                <CardDescription>Browse and manage all patient resources.</CardDescription>
              </div>
              <TabsList>
                <TabsTrigger value="list">
                  <List className="h-4 w-4 mr-2" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="grid">
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid View
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select onValueChange={setSelectedType} defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {resourceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Add category filter dropdown here if needed */}
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="list" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.length > 0 ? (
                    filteredResources.map(resource => (
                      <TableRow key={resource.id}>
                        <TableCell>{fileTypeIcon(resource.type)}</TableCell>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {resource.categories.map(cat => <Badge key={cat} variant="secondary">{cat}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(resource.dateAdded).toLocaleDateString()}</TableCell>
                        <TableCell>{resource.viewCount || 0}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteResource(resource.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">No resources found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="grid" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredResources.length > 0 ? (
                  filteredResources.map(resource => (
                    <Card key={resource.id}>
                      <CardHeader className="p-4 pb-2">
                        {resource.thumbnailUrl ? (
                          <img src={resource.thumbnailUrl} alt={resource.title} className="rounded-md aspect-video object-cover" />
                        ) : (
                          <div className="aspect-video bg-secondary flex items-center justify-center rounded-md">
                            {fileTypeIcon(resource.type)}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-2 pb-0">
                        <h3 className="font-semibold truncate">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                      </CardContent>
                      <CardFooter className="p-4 flex justify-between items-center">
                        <Badge variant="outline">{resource.type}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteResource(resource.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <p className="col-span-full text-center text-muted-foreground">No resources found.</p>
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
