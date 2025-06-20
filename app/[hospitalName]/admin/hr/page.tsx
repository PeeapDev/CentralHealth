"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2, UserCircle, Search } from "lucide-react";
import AdminLayout from "../layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";

// Define staff form schema with Zod
const staffFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["doctor", "nurse", "receptionist", "admin"], {
    required_error: "Please select a role",
  }),
  department: z.enum(["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Emergency", "Administration"], {
    required_error: "Please select a department",
  }),
  canChatWithPatients: z.boolean().default(false),
});

export default function HRPage() {
  const params = useParams<{ hospitalName: string }>();
  const hospitalName = params.hospitalName as string;
  const [loading, setLoading] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  // Set up form with react-hook-form
  const form = useForm<z.infer<typeof staffFormSchema>>({ 
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "doctor",
      department: "Cardiology",
      canChatWithPatients: false
    }
  });

  // Fetch staff members on component mount
  useEffect(() => {
    fetchStaffMembers();
  }, [hospitalName]);

  const fetchStaffMembers = async () => {
    setLoading(true);
    try {
      // This is a placeholder - we'll implement the actual API endpoint later
      // const response = await fetch(`/api/hospitals/${hospitalName}/staff`);
      // const data = await response.json();
      // setStaffList(data.staff);
      
      // For now, use mock data
      setStaffList([
        {
          id: '1',
          name: 'Dr. John Smith',
          email: 'john.smith@hospital.com',
          role: 'doctor',
          department: 'Cardiology',
          photo: null,
          canChatWithPatients: true
        },
        {
          id: '2',
          name: 'Nurse Emily Johnson',
          email: 'emily.johnson@hospital.com',
          role: 'nurse',
          department: 'Emergency',
          photo: null,
          canChatWithPatients: true
        },
        {
          id: '3',
          name: 'Admin Sarah Wilson',
          email: 'sarah.wilson@hospital.com',
          role: 'admin',
          department: 'Administration',
          photo: null,
          canChatWithPatients: false
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch staff members:", error);
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    setEditingStaff(null);
    form.reset();
    setDialogOpen(true);
  };

  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff);
    form.reset({
      name: staff.name,
      email: staff.email,
      role: staff.role as "doctor" | "nurse" | "receptionist" | "admin",
      department: staff.department as "Cardiology" | "Neurology" | "Orthopedics" | "Pediatrics" | "Emergency" | "Administration",
      canChatWithPatients: staff.canChatWithPatients
    });
    setDialogOpen(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      // This would be implemented with an actual API call
      // await fetch(`/api/hospitals/${hospitalName}/staff/${staffId}`, {
      //   method: 'DELETE'
      // });
      
      // For now, just update the UI
      setStaffList(staffList.filter(staff => staff.id !== staffId));
      toast({
        title: "Success",
        description: "Staff member removed successfully"
      });
    } catch (error) {
      console.error("Failed to delete staff member:", error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof staffFormSchema>) => {
    try {
      if (editingStaff) {
        // Edit existing staff
        // This would be implemented with an actual API call
        // await fetch(`/api/hospitals/${hospitalName}/staff/${editingStaff.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values)
        // });
        
        // For now, just update the UI
        setStaffList(staffList.map(staff => 
          staff.id === editingStaff.id ? { ...staff, ...values } : staff
        ));
        toast({
          title: "Success",
          description: "Staff member updated successfully"
        });
      } else {
        // Add new staff
        // This would be implemented with an actual API call
        // const response = await fetch(`/api/hospitals/${hospitalName}/staff`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(values)
        // });
        // const data = await response.json();
        
        // For now, just update the UI with mock data
        const newStaff = {
          id: String(Date.now()),
          ...values,
          photo: null
        };
        setStaffList([...staffList, newStaff]);
        toast({
          title: "Success",
          description: "Staff member added successfully"
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to save staff member:", error);
      toast({
        title: "Error",
        description: "Failed to save staff member",
        variant: "destructive"
      });
    }
  };

  const filteredStaff = staffList.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // We don't need columns definition for shadcn/ui Table

  return (
    <AdminLayout params={{ hospitalName }}>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Staff Management</CardTitle>
          <Button 
            onClick={handleAddStaff}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Staff
          </Button>
        </CardHeader>
        <CardContent>
        <div className="mb-4 flex items-center relative max-w-lg">
          <Input
            placeholder="Search staff by name, email, role, or department" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        
        {loading ? (
          <div className="flex justify-center my-8">Loading staff data...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Chat Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No staff members found</TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage src={staff.photo || undefined} />
                            <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {staff.name}
                        </div>
                      </TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}</TableCell>
                      <TableCell>{staff.department}</TableCell>
                      <TableCell>
                        <Badge variant={staff.canChatWithPatients ? "default" : "destructive"} className="font-medium">
                          {staff.canChatWithPatients ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStaff(staff)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteStaff(staff.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <FormField
                control={form.control}
                name="canChatWithPatients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chat Access</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "true")} 
                      defaultValue={field.value ? "true" : "false"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chat access" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Enabled</SelectItem>
                        <SelectItem value="false">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Update' : 'Add'} Staff
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
