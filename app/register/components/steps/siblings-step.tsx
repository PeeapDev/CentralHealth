"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientFormData } from "../multi-step-form"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Plus, Trash2, User, Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Family relationship options
const RELATIONSHIP_TYPES = [
  "Brother",
  "Sister",
  "Father",
  "Mother",
  "Son",
  "Daughter",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Cousin",
  "Spouse",
  "Other"
]

interface SiblingsStepProps {
  formData: PatientFormData
  updateFormData: (data: Partial<PatientFormData>) => void
}

export function SiblingsStep({ formData, updateFormData }: SiblingsStepProps) {
  const [newSibling, setNewSibling] = useState({
    name: "",
    relationship: "",
    contact: ""
  })
  
  // Handle siblings checkbox change
  const handleHasSiblingsChange = (checked: boolean) => {
    updateFormData({ 
      hasSiblings: checked,
      // Clear siblings array if unchecked
      siblings: checked ? formData.siblings : []
    })
  }
  
  // Add new sibling
  const handleAddSibling = () => {
    if (!newSibling.name || !newSibling.relationship) return
    
    const updatedSiblings = [
      ...(formData.siblings || []),
      { ...newSibling }
    ]
    
    updateFormData({ siblings: updatedSiblings })
    
    // Reset form
    setNewSibling({
      name: "",
      relationship: "",
      contact: ""
    })
  }
  
  // Remove sibling
  const handleRemoveSibling = (index: number) => {
    const updatedSiblings = [...(formData.siblings || [])]
    updatedSiblings.splice(index, 1)
    updateFormData({ siblings: updatedSiblings })
  }
  
  // Update emergency contact
  const handleEmergencyContactChange = (field: string, value: string) => {
    updateFormData({
      emergencyContact: {
        ...(formData.emergencyContact || {
          name: "",
          relationship: "",
          contact: ""
        }),
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="hasSiblings" 
          checked={formData.hasSiblings}
          onCheckedChange={handleHasSiblingsChange}
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="hasSiblings"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Add Family Members
          </Label>
          <p className="text-sm text-muted-foreground">
            Add family members to help with emergency contacts and family medical history tracking
          </p>
        </div>
      </div>
      
      {/* Family members section (only shown when hasSiblings is true) */}
      {formData.hasSiblings && (
        <div className="space-y-4 border rounded-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="siblingName">Name</Label>
              <Input
                id="siblingName"
                placeholder="Enter family member's name"
                value={newSibling.name}
                onChange={(e) => setNewSibling({ ...newSibling, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siblingRelationship">Relationship</Label>
              <Select
                value={newSibling.relationship}
                onValueChange={(value) => setNewSibling({ ...newSibling, relationship: value })}
              >
                <SelectTrigger id="siblingRelationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siblingContact">Contact Number (Optional)</Label>
              <div className="flex">
                <Input
                  id="siblingContact"
                  placeholder="Phone number"
                  value={newSibling.contact}
                  onChange={(e) => setNewSibling({ ...newSibling, contact: e.target.value })}
                />
                <Button
                  type="button"
                  onClick={handleAddSibling}
                  className="ml-2"
                  disabled={!newSibling.name || !newSibling.relationship}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Family members list */}
          {formData.siblings && formData.siblings.length > 0 ? (
            <div className="mt-4">
              <Label className="mb-2 block">Added Family Members</Label>
              <ScrollArea className="h-[150px] rounded-md border">
                <div className="p-4 space-y-2">
                  {formData.siblings.map((sibling, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{sibling.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{sibling.relationship}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {sibling.contact && (
                          <p className="text-xs text-muted-foreground">{sibling.contact}</p>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSibling(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <Users className="h-8 w-8 mb-2" />
              <p>No family members added yet</p>
              <p className="text-xs">Fill in the details above and click the + button to add family members</p>
            </div>
          )}
        </div>
      )}
      
      {/* Emergency Contact - Always visible */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>
            Provide contact details for someone we can reach in case of emergency
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyName">Name</Label>
            <Input
              id="emergencyName"
              placeholder="Enter emergency contact name"
              value={formData.emergencyContact?.name || ""}
              onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyRelationship">Relationship</Label>
            <Select
              value={formData.emergencyContact?.relationship || ""}
              onValueChange={(value) => handleEmergencyContactChange("relationship", value)}
            >
              <SelectTrigger id="emergencyRelationship">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="emergencyContact">Contact Number</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted text-muted-foreground">
                +232
              </span>
              <Input
                id="emergencyContact"
                className="rounded-l-none"
                placeholder="Enter emergency contact number"
                value={formData.emergencyContact?.contact || ""}
                onChange={(e) => handleEmergencyContactChange("contact", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            This information will only be used in case of medical emergencies
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
