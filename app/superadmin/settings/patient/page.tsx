"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Save, Trash2, FileEdit } from "lucide-react"

// Form field types
const FIELD_TYPES = [
  "text",
  "number",
  "email",
  "tel",
  "date",
  "select",
  "checkbox",
  "radio",
  "textarea"
]

// Default form fields
const DEFAULT_FORM_FIELDS = [
  { id: "firstName", label: "First Name", type: "text", required: true, step: "personal", order: 1, enabled: true },
  { id: "lastName", label: "Last Name", type: "text", required: true, step: "personal", order: 2, enabled: true },
  { id: "email", label: "Email", type: "email", required: true, step: "personal", order: 3, enabled: true },
  { id: "phone", label: "Phone Number", type: "tel", required: true, step: "personal", order: 4, enabled: true },
  { id: "gender", label: "Gender", type: "select", required: true, step: "personal", order: 5, enabled: true, options: ["Male", "Female", "Other"] },
  { id: "dateOfBirth", label: "Date of Birth", type: "date", required: true, step: "personal", order: 6, enabled: true },
  { id: "addressLine", label: "Address Line", type: "text", required: true, step: "location", order: 1, enabled: true },
  { id: "district", label: "District", type: "select", required: true, step: "location", order: 2, enabled: true },
  { id: "city", label: "City", type: "select", required: true, step: "location", order: 3, enabled: true },
  { id: "postalCode", label: "Postal Code", type: "text", required: false, step: "location", order: 4, enabled: true },
]

export default function PatientFormSettingsPage() {
  const [formFields, setFormFields] = useState(DEFAULT_FORM_FIELDS)
  const [newField, setNewField] = useState({
    id: "",
    label: "",
    type: "text",
    required: false,
    step: "personal",
    order: 0,
    enabled: true,
    options: []
  })
  const [isAddingField, setIsAddingField] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
  const [isSaving, setIsSaving] = useState(false)
  
  // Load form fields from API/localStorage
  useEffect(() => {
    const savedFields = localStorage.getItem('patientFormFields')
    if (savedFields) {
      try {
        setFormFields(JSON.parse(savedFields))
      } catch (e) {
        console.error("Error loading saved form fields:", e)
      }
    }
  }, [])
  
  // Save form fields
  const saveFormFields = () => {
    setIsSaving(true)
    
    try {
      localStorage.setItem('patientFormFields', JSON.stringify(formFields))
      
      // For production, you would call an API here
      // const response = await fetch('/api/superadmin/settings/patient-form', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ fields: formFields }),
      // })
      
      toast.success("Form settings saved successfully")
    } catch (error) {
      console.error("Error saving form fields:", error)
      toast.error("Failed to save form settings")
    } finally {
      setIsSaving(false)
    }
  }
  
  // Update a field's value
  const updateField = (id: string, updates: any) => {
    setFormFields(prev => 
      prev.map(field => 
        field.id === id 
          ? { ...field, ...updates } 
          : field
      )
    )
  }
  
  // Delete a field
  const deleteField = (id: string) => {
    if (["firstName", "lastName", "email", "phone"].includes(id)) {
      toast.error("Cannot delete required system fields")
      return
    }
    
    setFormFields(prev => prev.filter(field => field.id !== id))
    toast.success("Field deleted")
  }
  
  // Add a new field
  const addNewField = () => {
    if (!newField.id || !newField.label) {
      toast.error("Field ID and Label are required")
      return
    }
    
    // Check if ID exists
    if (formFields.some(f => f.id === newField.id)) {
      toast.error("Field ID must be unique")
      return
    }
    
    const fieldToAdd = {
      ...newField,
      order: formFields.filter(f => f.step === newField.step).length + 1
    }
    
    setFormFields(prev => [...prev, fieldToAdd])
    setNewField({
      id: "",
      label: "",
      type: "text",
      required: false,
      step: activeTab,
      order: 0,
      enabled: true,
      options: []
    })
    setIsAddingField(false)
    
    toast.success("New field added")
  }
  
  // Get fields for the current tab
  const currentTabFields = formFields.filter(field => field.step === activeTab)
    .sort((a, b) => a.order - b.order)
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Patient Registration Form Settings</h1>
          <p className="text-muted-foreground">Customize the patient registration form fields and requirements</p>
        </div>
        <Button onClick={saveFormFields} disabled={isSaving}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="personal" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="family">Family Information</TabsTrigger>
          <TabsTrigger value="payment">Payment Information</TabsTrigger>
        </TabsList>
        
        {["personal", "location", "family", "payment"].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between">
                  <span>{tab === "personal" ? "Personal Information" : 
                         tab === "location" ? "Location Information" :
                         tab === "family" ? "Family Information" :
                         "Payment Information"} Fields</span>
                  <Button size="sm" onClick={() => {
                    setNewField(prev => ({ ...prev, step: tab }))
                    setIsAddingField(true)
                  }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </CardTitle>
                <CardDescription>
                  {tab === "personal" ? "Manage the personal information fields that patients need to fill" :
                   tab === "location" ? "Configure location and address fields for patients" :
                   tab === "family" ? "Manage family information collection" :
                   "Configure payment and insurance information fields"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field ID</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Required</TableHead>
                      <TableHead className="text-center">Enabled</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTabFields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No fields defined for this section. Click "Add Field" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentTabFields.map(field => (
                        <TableRow key={field.id}>
                          <TableCell className="font-mono">{field.id}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>{field.type}</TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                              disabled={["firstName", "lastName", "email", "phone"].includes(field.id)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={field.enabled}
                              onCheckedChange={(checked) => updateField(field.id, { enabled: checked })}
                              disabled={["firstName", "lastName", "email", "phone"].includes(field.id)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => setEditingField(field.id)}>
                                <FileEdit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={["firstName", "lastName", "email", "phone"].includes(field.id)}
                                onClick={() => deleteField(field.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {isAddingField && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Field</CardTitle>
                  <CardDescription>Create a new field for the {activeTab} section</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fieldId">Field ID</Label>
                      <Input 
                        id="fieldId" 
                        placeholder="e.g., middleName" 
                        value={newField.id}
                        onChange={(e) => setNewField({ ...newField, id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Unique identifier for this field (no spaces)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fieldLabel">Label</Label>
                      <Input 
                        id="fieldLabel" 
                        placeholder="e.g., Middle Name" 
                        value={newField.label}
                        onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Display label for this field</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fieldType">Field Type</Label>
                      <select 
                        id="fieldType"
                        className="w-full p-2 rounded border"
                        value={newField.type}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2 flex items-center justify-start">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="required"
                          checked={newField.required}
                          onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                        />
                        <Label htmlFor="required">Required Field</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsAddingField(false)}>Cancel</Button>
                  <Button onClick={addNewField}>Add Field</Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
