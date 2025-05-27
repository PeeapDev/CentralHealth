"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Users, PlusCircle, Trash2, Check, Loader2, Lock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface RolesSettingsProps {
  params: Promise<{ hospitalName: string }> | { hospitalName: string }
}

interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  userCount: number
  isSystem: boolean
}

interface Permission {
  id: string
  name: string
  description: string
  module: string
  granted: boolean
}

interface Module {
  name: string
  permissions: Permission[]
}

export default function RolesPermissionsPage({ params }: RolesSettingsProps) {
  // Extract hospitalName using React.use for Promise params
  const { hospitalName } = params instanceof Promise ? React.use(params) : params
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false)
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "1",
      name: "Admin",
      description: "Full access to all hospital features",
      permissions: [],
      userCount: 2,
      isSystem: true
    },
    {
      id: "2",
      name: "Doctor",
      description: "Access to patient records, appointments and medical data",
      permissions: [],
      userCount: 8,
      isSystem: true
    },
    {
      id: "3",
      name: "Nurse",
      description: "Limited access to patient data and medical records",
      permissions: [],
      userCount: 15,
      isSystem: true
    },
    {
      id: "4",
      name: "Receptionist",
      description: "Access to appointments, registrations and front desk operations",
      permissions: [],
      userCount: 4,
      isSystem: true
    },
    {
      id: "5",
      name: "Accountant",
      description: "Access to billing, payments and financial reports",
      permissions: [],
      userCount: 2,
      isSystem: false
    }
  ])
  
  const [modules, setModules] = useState<Module[]>([
    {
      name: "Dashboard",
      permissions: [
        { id: "p1", name: "View Dashboard", description: "View hospital dashboard and statistics", module: "Dashboard", granted: true },
        { id: "p2", name: "Edit Dashboard", description: "Customize dashboard widgets and layout", module: "Dashboard", granted: false }
      ]
    },
    {
      name: "Patients",
      permissions: [
        { id: "p3", name: "View Patients", description: "View patient list and profiles", module: "Patients", granted: true },
        { id: "p4", name: "Add Patients", description: "Register new patients", module: "Patients", granted: true },
        { id: "p5", name: "Edit Patients", description: "Edit patient information", module: "Patients", granted: true },
        { id: "p6", name: "Delete Patients", description: "Remove patients from the system", module: "Patients", granted: false }
      ]
    },
    {
      name: "Appointments",
      permissions: [
        { id: "p7", name: "View Appointments", description: "View appointment schedule", module: "Appointments", granted: true },
        { id: "p8", name: "Create Appointments", description: "Schedule new appointments", module: "Appointments", granted: true },
        { id: "p9", name: "Edit Appointments", description: "Modify existing appointments", module: "Appointments", granted: true },
        { id: "p10", name: "Cancel Appointments", description: "Cancel scheduled appointments", module: "Appointments", granted: true }
      ]
    },
    {
      name: "Billing",
      permissions: [
        { id: "p11", name: "View Invoices", description: "View patient invoices and billing history", module: "Billing", granted: true },
        { id: "p12", name: "Create Invoices", description: "Generate new invoices", module: "Billing", granted: false },
        { id: "p13", name: "Process Payments", description: "Record and process payments", module: "Billing", granted: false },
        { id: "p14", name: "Manage Billing", description: "Adjust prices, discounts and billing settings", module: "Billing", granted: false }
      ]
    },
    {
      name: "Reports",
      permissions: [
        { id: "p15", name: "View Reports", description: "Access standard reports", module: "Reports", granted: true },
        { id: "p16", name: "Create Reports", description: "Generate custom reports", module: "Reports", granted: false },
        { id: "p17", name: "Export Reports", description: "Export reports to various formats", module: "Reports", granted: false }
      ]
    },
    {
      name: "Settings",
      permissions: [
        { id: "p18", name: "View Settings", description: "View system settings", module: "Settings", granted: false },
        { id: "p19", name: "Edit Settings", description: "Modify system configuration", module: "Settings", granted: false },
        { id: "p20", name: "Manage Roles", description: "Create and edit user roles", module: "Settings", granted: false },
        { id: "p21", name: "Manage Users", description: "Add, edit, and remove user accounts", module: "Settings", granted: false }
      ]
    }
  ])
  
  // State for new role form
  const [newRole, setNewRole] = useState({
    name: "",
    description: ""
  })

  // State for role detailed permissions
  const [modulePermissions, setModulePermissions] = useState({
    dashboard: { view: true },
    patients: { view: true, create: true, edit: true, delete: false, history: true, reports: false },
    appointments: { view: true, schedule: true, reschedule: true, cancel: true, doctor: false },
    billing: { view: true, create: true, edit: true, delete: false, payments: true, reports: false },
    reports: { view: true, export: false, analytics: false },
    settings: { general: false, users: false, roles: false, utilities: false, notifications: false, payment: false }
  })

  // Helper function to update a specific permission
  const updatePermission = (module: string, permission: string, value: boolean) => {
    setModulePermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value
      }
    }))
  }

  // Load selected role permissions
  useEffect(() => {
    if (selectedRole) {
      // Deep copy modules and permissions
      const updatedModules = JSON.parse(JSON.stringify(modules))
      
      // In a real app, you would fetch the permissions from the API
      // Here we're just simulating permission loading for the selected role
      // For now, just randomize some permissions for demonstration
      updatedModules.forEach((module: Module) => {
        module.permissions.forEach(permission => {
          // For admin role, grant all permissions
          if (selectedRole.name === "Admin") {
            permission.granted = true
          } 
          // For system roles, set some logical permissions
          else if (selectedRole.isSystem) {
            if (selectedRole.name === "Doctor") {
              permission.granted = [
                "View Dashboard", "View Patients", "Edit Patients", 
                "View Appointments", "Create Appointments", "Edit Appointments", "Cancel Appointments",
                "View Invoices", "View Reports"
              ].includes(permission.name)
            } else if (selectedRole.name === "Nurse") {
              permission.granted = [
                "View Dashboard", "View Patients", "Edit Patients", 
                "View Appointments", "Create Appointments",
                "View Reports"
              ].includes(permission.name)
            } else if (selectedRole.name === "Receptionist") {
              permission.granted = [
                "View Dashboard", "View Patients", "Add Patients", 
                "View Appointments", "Create Appointments", "Edit Appointments", "Cancel Appointments",
                "View Invoices", "Process Payments"
              ].includes(permission.name)
            }
          }
          // For custom roles, randomize permissions
          else {
            if (selectedRole.name === "Accountant") {
              permission.granted = [
                "View Dashboard", "View Patients", 
                "View Invoices", "Create Invoices", "Process Payments", "Manage Billing",
                "View Reports", "Create Reports", "Export Reports"
              ].includes(permission.name)
            } else {
              permission.granted = Math.random() > 0.5
            }
          }
        })
      })
      
      setModules(updatedModules)
    }
  }, [selectedRole])
  
  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
  }
  
  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string) => {
    // Deep copy modules
    const updatedModules = JSON.parse(JSON.stringify(modules))
    
    // Find and toggle the permission
    updatedModules.forEach((module: Module) => {
      const permission = module.permissions.find(p => p.id === permissionId)
      if (permission) {
        permission.granted = !permission.granted
      }
    })
    
    setModules(updatedModules)
  }
  
  // Save role permissions
  const saveRolePermissions = async () => {
    if (!selectedRole) return
    
    setLoading(true)
    
    try {
      // Collect all granted permissions
      const grantedPermissions = modules
        .flatMap(module => module.permissions)
        .filter(permission => permission.granted)
        .map(permission => permission.id)
      
      // In a real app, you would save the permissions to the API
      toast.success(`Permissions updated for role: ${selectedRole.name}`)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Error saving role permissions:", error)
      toast.error("Failed to update role permissions")
    } finally {
      setLoading(false)
    }
  }
  
  // Create new role
  const createNewRole = () => {
    if (!newRole.name.trim()) {
      toast.error("Role name is required")
      return
    }
    
    // Create new role
    const newRoleObj: Role = {
      id: `custom-${Date.now()}`,
      name: newRole.name.trim(),
      description: newRole.description.trim(),
      permissions: [],
      userCount: 0,
      isSystem: false
    }
    
    // Add to roles list
    setRoles([...roles, newRoleObj])
    
    // Reset form and close dialog
    setNewRole({ name: "", description: "" })
    setShowNewRoleDialog(false)
    
    // Select the new role
    setSelectedRole(newRoleObj)
    
    toast.success(`New role "${newRoleObj.name}" created successfully`)
  }
  
  // Delete role
  const deleteRole = (roleId: string) => {
    // Check if role has users
    const role = roles.find(r => r.id === roleId)
    if (role?.userCount && role.userCount > 0) {
      toast.error(`Cannot delete role "${role.name}" because it has ${role.userCount} assigned users`)
      return
    }
    
    // Remove role
    const updatedRoles = roles.filter(r => r.id !== roleId)
    setRoles(updatedRoles)
    
    // If the deleted role was selected, clear selection
    if (selectedRole?.id === roleId) {
      setSelectedRole(null)
    }
    
    toast.success("Role deleted successfully")
  }
  
  // Reusable permission checkbox component
  const PermissionCheckbox = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <div className="flex items-center space-x-2 rounded-md border p-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor={id} className="flex-1 cursor-pointer">
        {label}
      </Label>
    </div>
  )

  // Function to handle role creation
  const handleCreateRole = () => {
    // Validation
    if (!newRole.name) {
      toast.error("Role name is required")
      return
    }

    // Here you would make an API call to create the role
    // For now, we'll just simulate it
    const role = {
      id: Date.now().toString(),
      name: newRole.name,
      description: newRole.description,
      permissions: modulePermissions,
      isSystem: false,
      usersCount: 0,
      createdAt: new Date().toISOString()
    }

    // Add to roles list
    setRoles([...roles, role])

    // Reset form and close dialog
    setNewRole({ name: "", description: "" })
    setShowNewRoleDialog(false)

    // Select the new role
    setSelectedRole(role)

    toast.success(`New role "${role.name}" created successfully`)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles and access control for your hospital"
        breadcrumbs={[
          { label: "Home", href: `/${hospitalName}/admin` },
          { label: "Settings", href: `/${hospitalName}/admin/settings` },
          { label: "Roles & Permissions" }
        ]}
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Roles sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>User Roles</span>
                </div>
              </CardTitle>
              <Dialog open={showNewRoleDialog} onOpenChange={setShowNewRoleDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>New Role</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Add a new user role to manage permissions for different staff members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Role Name</Label>
                      <Input 
                        id="name" 
                        placeholder="e.g., Doctor, Nurse, Receptionist" 
                        value={newRole.name}
                        onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description" 
                        placeholder="Describe the role's responsibilities and access level"
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid gap-4">
                      <Label className="text-lg font-semibold">Module Permissions</Label>
                      
                      <Tabs defaultValue="patients" className="w-full">
                        <TabsList className="grid grid-cols-4 mb-4">
                          <TabsTrigger value="patients">Patients</TabsTrigger>
                          <TabsTrigger value="appointments">Appointments</TabsTrigger>
                          <TabsTrigger value="billing">Billing</TabsTrigger>
                          <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="patients" className="space-y-4">
                          <div className="grid gap-3">
                            <h3 className="font-medium">Patient Management</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <PermissionCheckbox
                                id="patients-view"
                                label="View Patients"
                                checked={modulePermissions.patients?.view || false}
                                onChange={(checked) => updatePermission('patients', 'view', checked)}
                              />
                              <PermissionCheckbox
                                id="patients-create"
                                label="Register New Patients"
                                checked={modulePermissions.patients?.create || false}
                                onChange={(checked) => updatePermission('patients', 'create', checked)}
                              />
                              <PermissionCheckbox
                                id="patients-edit"
                                label="Edit Patient Details"
                                checked={modulePermissions.patients?.edit || false}
                                onChange={(checked) => updatePermission('patients', 'edit', checked)}
                              />
                              <PermissionCheckbox
                                id="patients-delete"
                                label="Archive/Delete Patients"
                                checked={modulePermissions.patients?.delete || false}
                                onChange={(checked) => updatePermission('patients', 'delete', checked)}
                              />
                              <PermissionCheckbox
                                id="patients-history"
                                label="Access Medical History"
                                checked={modulePermissions.patients?.history || false}
                                onChange={(checked) => updatePermission('patients', 'history', checked)}
                              />
                              <PermissionCheckbox
                                id="patients-reports"
                                label="Generate Patient Reports"
                                checked={modulePermissions.patients?.reports || false}
                                onChange={(checked) => updatePermission('patients', 'reports', checked)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="appointments" className="space-y-4">
                          <div className="grid gap-3">
                            <h3 className="font-medium">Appointment Management</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <PermissionCheckbox
                                id="appointments-view"
                                label="View Appointments"
                                checked={modulePermissions.appointments?.view || false}
                                onChange={(checked) => updatePermission('appointments', 'view', checked)}
                              />
                              <PermissionCheckbox
                                id="appointments-schedule"
                                label="Schedule Appointments"
                                checked={modulePermissions.appointments?.schedule || false}
                                onChange={(checked) => updatePermission('appointments', 'schedule', checked)}
                              />
                              <PermissionCheckbox
                                id="appointments-reschedule"
                                label="Reschedule Appointments"
                                checked={modulePermissions.appointments?.reschedule || false}
                                onChange={(checked) => updatePermission('appointments', 'reschedule', checked)}
                              />
                              <PermissionCheckbox
                                id="appointments-cancel"
                                label="Cancel Appointments"
                                checked={modulePermissions.appointments?.cancel || false}
                                onChange={(checked) => updatePermission('appointments', 'cancel', checked)}
                              />
                              <PermissionCheckbox
                                id="appointments-doctor"
                                label="Assign Doctors"
                                checked={modulePermissions.appointments?.doctor || false}
                                onChange={(checked) => updatePermission('appointments', 'doctor', checked)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="billing" className="space-y-4">
                          <div className="grid gap-3">
                            <h3 className="font-medium">Billing & Payments</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <PermissionCheckbox
                                id="billing-view"
                                label="View Invoices"
                                checked={modulePermissions.billing?.view || false}
                                onChange={(checked) => updatePermission('billing', 'view', checked)}
                              />
                              <PermissionCheckbox
                                id="billing-create"
                                label="Create Invoices"
                                checked={modulePermissions.billing?.create || false}
                                onChange={(checked) => updatePermission('billing', 'create', checked)}
                              />
                              <PermissionCheckbox
                                id="billing-edit"
                                label="Edit Invoices"
                                checked={modulePermissions.billing?.edit || false}
                                onChange={(checked) => updatePermission('billing', 'edit', checked)}
                              />
                              <PermissionCheckbox
                                id="billing-delete"
                                label="Delete Invoices"
                                checked={modulePermissions.billing?.delete || false}
                                onChange={(checked) => updatePermission('billing', 'delete', checked)}
                              />
                              <PermissionCheckbox
                                id="billing-payments"
                                label="Process Payments"
                                checked={modulePermissions.billing?.payments || false}
                                onChange={(checked) => updatePermission('billing', 'payments', checked)}
                              />
                              <PermissionCheckbox
                                id="billing-reports"
                                label="Generate Financial Reports"
                                checked={modulePermissions.billing?.reports || false}
                                onChange={(checked) => updatePermission('billing', 'reports', checked)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="settings" className="space-y-4">
                          <div className="grid gap-3">
                            <h3 className="font-medium">System Settings</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <PermissionCheckbox
                                id="settings-general"
                                label="General Settings"
                                checked={modulePermissions.settings?.general || false}
                                onChange={(checked) => updatePermission('settings', 'general', checked)}
                              />
                              <PermissionCheckbox
                                id="settings-users"
                                label="User Management"
                                checked={modulePermissions.settings?.users || false}
                                onChange={(checked) => updatePermission('settings', 'users', checked)}
                              />
                              <PermissionCheckbox
                                id="settings-roles"
                                label="Role Management"
                                checked={modulePermissions.settings?.roles || false}
                                onChange={(checked) => updatePermission('settings', 'roles', checked)}
                              />
                              <PermissionCheckbox
                                id="settings-utilities"
                                label="System Utilities"
                                checked={modulePermissions.settings?.utilities || false}
                                onChange={(checked) => updatePermission('settings', 'utilities', checked)}
                              />
                              <PermissionCheckbox
                                id="settings-notifications"
                                label="Notification Settings"
                                checked={modulePermissions.settings?.notifications || false}
                                onChange={(checked) => updatePermission('settings', 'notifications', checked)}
                              />
                              <PermissionCheckbox
                                id="settings-payment"
                                label="Payment Settings"
                                checked={modulePermissions.settings?.payment || false}
                                onChange={(checked) => updatePermission('settings', 'payment', checked)}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewRoleDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateRole}>Create Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roles.map(role => (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${selectedRole?.id === role.id ? 'bg-gray-100 border-l-4 border-blue-500 pl-1' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-4 w-4 ${role.isSystem ? 'text-blue-500' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium text-sm flex items-center gap-1">
                          {role.name}
                          {role.isSystem && (
                            <span className="px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">System</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{role.userCount} users</div>
                      </div>
                    </div>
                    
                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteRole(role.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Permissions panel */}
        <div className="md:col-span-2">
          {!selectedRole ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 min-h-[400px] text-center">
                <ShieldCheck className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Role</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Select a user role from the list on the left to view and manage its permissions.
                  Permissions control what users with this role can access in the system.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      <span>{selectedRole.name} Permissions</span>
                      {selectedRole.isSystem && (
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">System Role</span>
                      )}
                    </CardTitle>
                    <CardDescription>{selectedRole.description}</CardDescription>
                  </div>
                  {selectedRole.isSystem && (
                    <div className="flex items-center text-sm text-amber-600 gap-1">
                      <Lock className="h-4 w-4" />
                      <span>Some permissions are locked for system roles</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {modules.map((module) => (
                  <div key={module.name} className="space-y-3">
                    <h3 className="font-medium">{module.name}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Permission</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px] text-center">Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {module.permissions.map((permission) => {
                          // Determine if this permission should be locked for system roles
                          const isLocked = selectedRole.isSystem && [
                            // Critical permissions that system roles must have
                            ...(selectedRole.name === "Admin" ? ["View Settings", "Edit Settings", "Manage Roles", "Manage Users"] : []),
                            // Basic permissions all roles should have
                            "View Dashboard",
                          ].includes(permission.name)
                          
                          return (
                            <TableRow key={permission.id}>
                              <TableCell className="font-medium">{permission.name}</TableCell>
                              <TableCell>{permission.description}</TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={permission.granted}
                                  disabled={isLocked}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={saveRolePermissions}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save Permissions</span>
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
