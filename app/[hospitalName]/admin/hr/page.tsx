"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

// Define the StaffMember interface to match the API response
interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "DOCTOR" | "STAFF" | "MANAGER" | "ADMIN";
  specialties?: string[];
  isHospitalAdmin?: boolean;
  profilePicture?: string;
  salary?: number;
  taxRate?: number;
  address?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  shift?: "MORNING" | "AFTERNOON" | "NIGHT" | "FLEXIBLE";
  walletBalance?: number;
  telemedicineEnabled?: boolean;
  onlineBookingEnabled?: boolean;
}

// List of recommended specialties based on hospital departments and roles
const specialtiesByRole = {
  DOCTOR: [
    "Cardiology",
    "Neurology",
    "Oncology",
    "Pediatrics",
    "Radiology",
    "Urology",
    "Orthopedics",
    "Dermatology",
    "Ophthalmology",
    "Gynaecology",
    "General Practice",
    "Family Medicine",
    "Anesthesiology",
    "Obstetrics",
    "Endocrinology",
    "Psychiatry",
    "Dentistry",
    "Surgery",
    "Internal Medicine",
  ],
  STAFF: [
    "Nursing",
    "Pharmacy",
    "Laboratory",
    "Radiology",
    "Physiotherapy",
    "Midwifery",
    "Emergency Care",
    "Intensive Care",
    "Geriatric Care",
    "Palliative Care",
    "Mental Health Nursing",
    "Phlebotomy",
    "Patient Support",
  ],
  MANAGER: [
    "Hospital Administration",
    "HR Management",
    "Finance",
    "Operations",
    "Department Management",
    "Quality Assurance",
    "Compliance",
    "Information Technology",
    "Supply Chain",
    "Facilities Management",
  ],
  ADMIN: [
    "Hospital Administration",
    "IT Administration",
    "System Management",
    "Security Administration",
    "General Administration",
  ]
};

// Define the schema for the staff form
const staffFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["DOCTOR", "STAFF", "MANAGER", "ADMIN"]),
  specialties: z.string().optional(),
  salary: z.number().optional().default(0),
  taxRate: z.number().optional().default(0),
  address: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "NIGHT", "FLEXIBLE"]).optional(),
  profilePicture: z.any().optional(), // File object for client-side only
  telemedicineEnabled: z.boolean().optional().default(false),
  onlineBookingEnabled: z.boolean().optional().default(false),
});

export default function HRPage() {
  const params = useParams<{ hospitalName: string }>();
  const hospitalName = params?.hospitalName as string;
  const [loading, setLoading] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDoctorSettings, setShowDoctorSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Set up form with react-hook-form
  const form = useForm<z.infer<typeof staffFormSchema>>({ 
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "DOCTOR",
      specialties: "",
      salary: 0,
      taxRate: 0,
      address: "",
      phone: "",
      gender: undefined,
      shift: undefined,
      telemedicineEnabled: false,
      onlineBookingEnabled: false,
    }
  });

  // Watch form changes to show/hide doctor settings and update specialties
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "role") {
        setShowDoctorSettings(value.role === "DOCTOR");
        // Clear specialties when role changes to allow selecting from new list
        form.setValue("specialties", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Fetch staff members on component mount
  useEffect(() => {
    fetchStaffMembers();
  }, [hospitalName]);

  const fetchStaffMembers = async () => {
    setLoading(true);
    try {
      // Fetch staff data
      const response = await fetch(`/api/hospitals/${hospitalName}/staff`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No staff found for this hospital yet – treat as empty list, no toast
          console.warn(`No staff found for hospital '${hospitalName}'. Returning empty list.`);
          setStaffList([]);
          setLoading(false);
          return;
        }
        // Handle other errors but keep UI responsive
        console.error(`Error fetching staff: ${response.status} ${response.statusText}`);
        toast({
          title: "Error",
          description: `Failed to fetch staff data: ${response.status}`,
          variant: "destructive"
        });
        setStaffList([]);
        return;
      }
      
      const data = await response.json();
      console.log('Staff data received:', data);
      
      if (data.staff && Array.isArray(data.staff)) {
        // Map API response to StaffMember interface with safeguards
        const formattedStaff: StaffMember[] = data.staff.map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          specialties: member.specialties || [],
          isHospitalAdmin: member.isHospitalAdmin || false,
          profilePicture: member.profilePicture || undefined,
          salary: member.salary || 0,
          taxRate: member.taxRate || 0,
          address: member.address || '',
          phone: member.phone || '',
          gender: member.gender || '',
          shift: member.shift || '',
          walletBalance: member.walletBalance || 0,
          telemedicineEnabled: member.telemedicineEnabled || false,
          onlineBookingEnabled: member.onlineBookingEnabled || false,
        }));
        
        setStaffList(formattedStaff);
      } else {
        setStaffList([]);
      }
    } catch (error) {
      console.error("Failed to fetch staff members:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    form.reset({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      specialties: staff.specialties?.join(", ") || "",
      salary: staff.salary || 0,
      taxRate: staff.taxRate || 0,
      address: staff.address || "",
      phone: staff.phone || "",
      gender: staff.gender,
      shift: staff.shift,
      // Note: profilePicture cannot be pre-filled as it's a File object
    });
    setDialogOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/hospitals/${hospitalName}/staff?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
      
      // Refresh the staff list
      fetchStaffMembers();
    } catch (error) {
      console.error("Failed to delete staff member:", error);
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };
  
  const handleAddNewStaff = () => {
    setEditingStaff(null);
    form.reset({
      name: "",
      email: "",
      role: "DOCTOR",
      specialties: "",
      salary: 0,
      taxRate: 0,
      address: "",
      phone: "",
      gender: undefined,
      shift: undefined,
      telemedicineEnabled: false,
      onlineBookingEnabled: false,
    });
    setDialogOpen(true);
    // Set doctor settings visibility based on role
    setShowDoctorSettings(true);
  };
  
  // Function to convert specialties string to array
  const formatSpecialtiesForSubmit = (specialties: string | undefined): string[] => {
    if (!specialties) return [];
    return specialties.split(',').map(s => s.trim()).filter(Boolean);
  };
  
  // Function to get available specialties based on selected role
  const getSpecialtiesForRole = (role: string): string[] => {
    const roleKey = role as keyof typeof specialtiesByRole;
    return specialtiesByRole[roleKey] || specialtiesByRole.STAFF;
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof staffFormSchema>) => {
    try {
      // Convert comma-separated specialties to array
      const specialtiesArray = values.specialties
        ? values.specialties.split(",").map(s => s.trim()).filter(s => s !== "")
        : [];

      // Create FormData for multipart/form-data to handle file uploads
      const formData = new FormData();
      
      // Prepare data for submission
      const jsonData: Record<string, any> = {
        name: values.name,
        email: values.email,
        role: values.role,
        specialties: specialtiesArray,
        salary: values.salary,
        taxRate: values.taxRate,
        address: values.address,
        phone: values.phone,
        gender: values.gender,
        shift: values.shift,
      };
      
      // Add doctor-specific settings if applicable
      if (values.role === "DOCTOR") {
        jsonData.telemedicineEnabled = values.telemedicineEnabled || false;
        jsonData.onlineBookingEnabled = values.onlineBookingEnabled || false;
      }

      // If editing, include the ID
      if (editingStaff) {
        jsonData.id = editingStaff.id;
      }
      
      // Add data to formData
      formData.append('data', JSON.stringify(jsonData));
      
      // Add profile picture if provided
      if (values.profilePicture) {
        formData.append('profilePicture', values.profilePicture);
      }
    
      const method = editingStaff ? 'PUT' : 'POST';
      const url = `/api/hospitals/${hospitalName}/staff${editingStaff ? `?id=${editingStaff.id}` : ''}`;
      
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: 'include', // Include cookies for authentication
        // Let the browser automatically set the correct multipart boundary
        // Do not manually set the Content-Type header when using FormData
        // headers intentionally omitted
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: editingStaff 
          ? "Staff member updated successfully" 
          : "Staff member added successfully. A default password has been emailed to them.",
      });
      
      setDialogOpen(false);
      fetchStaffMembers();
    } catch (error) {
      console.error("Failed to save staff member:", error);
      toast({
        title: "Error",
        description: "Failed to save staff member",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      form.setValue('profilePicture', files[0]);
    }
  };

  // Filter staff based on search query
  const filteredStaff = staffList.filter(staff => {
    const searchLower = searchQuery.toLowerCase();
    return (
      staff.name.toLowerCase().includes(searchLower) ||
      staff.email.toLowerCase().includes(searchLower) ||
      staff.role.toLowerCase().includes(searchLower)
    );
  });

  // Function to get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Hospital Staff Directory</h1>
        <Button onClick={handleAddNewStaff}>Add New Staff</Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <p>Loading staff directory...</p>
        </div>
      ) : filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-12 w-12">
                  {staff.profilePicture ? (
                    <AvatarImage src={staff.profilePicture} alt={staff.name} />
                  ) : (
                    <AvatarFallback>{getInitials(staff.name)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{staff.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {staff.role.charAt(0) + staff.role.slice(1).toLowerCase()}
                    {staff.isHospitalAdmin ? " (Hospital Admin)" : ""}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Email:</span> {staff.email}
                  </div>
                  <div>
                    <span className="font-medium">Specialties:</span>{" "}
                    {Array.isArray(staff.specialties) && staff.specialties.length > 0
                      ? staff.specialties.join(', ')
                      : "None"}
                  </div>
                  <div>
                    <span className="font-medium">Salary:</span> ${staff.salary?.toLocaleString() || '0'}
                  </div>
                  {staff.role === "DOCTOR" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Telemedicine:</span>
                        <span>{staff.telemedicineEnabled ? "Enabled" : "Disabled"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Online Booking:</span>
                        <span>{staff.onlineBookingEnabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditStaff(staff)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteStaff(staff.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex justify-center my-12">
          <p>No staff members found. Add your first staff member using the button above.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff 
                ? "Update the details for this staff member."
                : "Enter the details of the new staff member. They'll receive an email with their login details."
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="STAFF">Staff</SelectItem>
                          <SelectItem value="MANAGER">Manager</SelectItem>
                          <SelectItem value="ADMIN">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialties</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSpecialtiesForRole(form.getValues().role).map((specialty) => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Other...</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {field.value === 'other' && (
                      <Input 
                        placeholder="Enter specialty" 
                        className="mt-2" 
                        onChange={(e) => field.onChange(e.target.value)} 
                      />
                    )}
                    <FormDescription>
                      Choose from role-appropriate specialties or select "Other" to enter a custom one.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Basic Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter basic salary" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
  
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>
  
                {showDoctorSettings && (
                  <div className="border p-4 rounded-md space-y-4">
                    <h3 className="font-medium">Doctor-specific Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure telemedicine and online booking settings for this doctor.
                    </p>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="telemedicineEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Telemedicine</FormLabel>
                              <FormDescription className="text-sm text-muted-foreground">
                                Allow this doctor to conduct virtual appointments
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="onlineBookingEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between space-y-0">
                            <div className="space-y-0.5">
                              <FormLabel>Online Booking</FormLabel>
                              <FormDescription className="text-sm text-muted-foreground">
                                Allow patients to book appointments online
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value || false}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
  
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingStaff ? 'Save Changes' : 'Add Staff Member'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }