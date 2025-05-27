"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid'
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Types and interfaces
type Status = 'Active' | 'Inactive'
type Package = 'Basic' | 'Premium' | 'Enterprise'
type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | null | undefined

interface Hospital {
  id: string
  name: string
  subdomain: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zip: string
  status: Status
  package: Package
  website?: string
  description?: string
  modules: string[]
  admin_email: string
  admin_password?: string
  branches: string[]
  created_at: string
  updated_at: string
}

interface HospitalFormData {
  name: string
  subdomain: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zip: string
  status: Status
  package: Package
  website?: string
  description?: string
  modules: string[]
  admin_email: string
  admin_password: string
  branches: string[]
}

interface HospitalFormProps {
  initialData?: HospitalFormData
  onSubmit: (data: HospitalFormData) => Promise<void>
  onCancel: () => void
}

interface HospitalViewProps {
  hospital: Hospital
  onClose: () => void
}

// Data table component for displaying hospitals data
function DataTable<TData extends Record<string, any>, TValue>({ columns, data }: { columns: ColumnDef<TData, TValue>[]; data: TData[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, columnIndex) => (
              <TableHead key={column.id || `column-${columnIndex}`}>
                {typeof column.header === 'string' ? column.header : (column.id || '')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {columns.map((column, columnIndex) => {
                // Create a display value using the column's accessor key or id
                const displayValue = () => {
                  // Use regular property access for type safety
                  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
                    return row[column.accessorKey];
                  }
                  
                  // Handle accessor function if present
                  if ('accessorFn' in column && typeof column.accessorFn === 'function') {
                    return column.accessorFn(row, rowIndex);
                  }
                  
                  // Fallback to empty string
                  return '';
                };
                
                return (
                  <TableCell key={`cell-${column.id || `column-${columnIndex}`}-${rowIndex}`}>
                    {/* Safely handle the cell rendering */}
                    {(() => {
                      if (!column.cell) {
                        return displayValue();
                      }
                      
                      if (typeof column.cell === 'function') {
                        // Create a simplified mock of the row object that TanStack Table expects
                        const mockRow = {
                          original: row,
                          getValue: (key: string) => row[key],
                          index: rowIndex
                        };
                        
                        try {
                          // @ts-ignore - We know this isn't fully type-safe, but it's a pragmatic solution
                          return column.cell({ row: mockRow });
                        } catch (e) {
                          console.error('Error rendering cell:', e);
                          return displayValue();
                        }
                      }
                      
                      // Handle case where cell might be a React element or string
                      return column.cell;
                    })()}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Hospital view component
function HospitalView({ hospital, onClose }: HospitalViewProps): JSX.Element {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Handle password reset for hospital admin
  const handleResetPassword = async (adminEmail: string) => {
    try {
      setIsResettingPassword(true);
      
      const response = await fetch('/api/hospitals/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      toast.success('New password generated and sent to the admin email');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Hospital Details</h3>
          <div className="mt-2 space-y-2">
            <div>
              <Label>Name</Label>
              <div className="mt-1">{hospital.name}</div>
            </div>
            <div>
              <Label>Subdomain</Label>
              <div className="mt-1">{hospital.subdomain}</div>
            </div>
            <div>
              <Label>Email</Label>
              <div className="mt-1">{hospital.email}</div>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="mt-1">{hospital.phone}</div>
            </div>
            <div>
              <Label>Website</Label>
              <div className="mt-1">{hospital.website || 'N/A'}</div>
            </div>
            <div>
              <Label>Status</Label>
              <div className="mt-1">
                <Badge variant={hospital.status === 'Active' ? 'default' : 'destructive'}>
                  {hospital.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Address</h3>
          <div className="mt-2 space-y-2">
            <div>
              <Label>Street</Label>
              <div className="mt-1">{hospital.address}</div>
            </div>
            <div>
              <Label>City</Label>
              <div className="mt-1">{hospital.city}</div>
            </div>
            <div>
              <Label>State</Label>
              <div className="mt-1">{hospital.state}</div>
            </div>
            <div>
              <Label>Country</Label>
              <div className="mt-1">{hospital.country}</div>
            </div>
            <div>
              <Label>ZIP</Label>
              <div className="mt-1">{hospital.zip}</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Modules</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {hospital.modules && hospital.modules.length > 0 ? (
            hospital.modules.map((module, index) => (
              <Badge key={index}>{module}</Badge>
            ))
          ) : (
            <div>No modules</div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Branches</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {hospital.branches && hospital.branches.length > 0 ? (
            hospital.branches.map((branch, index) => (
              <Badge key={index}>{branch}</Badge>
            ))
          ) : (
            <div>No branches</div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Admin Email</h3>
        <div className="mt-1 flex items-center gap-2">
          <span>{hospital.admin_email}</span>
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-blue-600 border-blue-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const confirmReset = window.confirm(
                `Are you sure you want to reset the password for ${hospital.admin_email}? 

This will invalidate the current password and send a new one to the admin's email.`
              );
              if (confirmReset) {
                handleResetPassword(hospital.admin_email);
              }
            }}
          >
            Resend Password
          </Button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-muted-foreground/20">
        <h3 className="font-semibold text-primary">Hospital Access</h3>
        <div className="mt-2 flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Hospital Login URL:</span>
            <a 
              href={`/${hospital.subdomain}/auth/login`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              /{hospital.subdomain}/auth/login
            </a>
          </div>
          <Button 
            variant="secondary" 
            className="w-full mt-2"
            onClick={() => window.open(`/${hospital.subdomain}/auth/login`, '_blank')}
          >
            Go to Hospital Login
          </Button>
        </div>
      </div>

      <div className="pt-4 text-right">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

// Hospital form component
function HospitalForm({ onSubmit, onCancel, initialData }: HospitalFormProps): JSX.Element {
  const [formData, setFormData] = useState<HospitalFormData>(
    initialData || {
      name: '',
      subdomain: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      zip: '',
      status: 'Active',
      package: 'Basic',
      website: '',
      description: '',
      modules: [],
      admin_email: '',
      admin_password: '',
      branches: []
    }
  )

  const [branchesInput, setBranchesInput] = useState<string>('')
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [subdomainTimeout, setSubdomainTimeout] = useState<NodeJS.Timeout | null>(null)
  const [smtpEnabled, setSmtpEnabled] = useState(false)
  const [checkingSmtp, setCheckingSmtp] = useState(true)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  // Define all available modules
  const availableModules = [
    'Billing',
    'Appointment',
    'OPD', // Out Patient
    'IPD', // In Patient
    'Pharmacy',
    'Pathology',
    'Radiology',
    'Blood Bank',
    'Ambulance',
    'Front Office',
    'Birth & Death Record',
    'Human Resource',
    'Duty Roster',
    'Annual Calendar',
    'Referral',
    'TPA Management'
  ]
  
  // Define facility templates for quick selection
  const facilityTemplates = [
    { 
      name: 'Full Hospital', 
      modules: [
        'Billing', 'Appointment', 'OPD', 'IPD', 'Pharmacy', 'Pathology', 'Radiology', 
        'Blood Bank', 'Ambulance', 'Front Office', 'Birth & Death Record', 'Human Resource'
      ] 
    },
    { 
      name: 'Basic Clinic', 
      modules: ['Billing', 'Appointment', 'OPD', 'Pharmacy'] 
    },
    { 
      name: 'Pharmacy Only', 
      modules: ['Billing', 'Pharmacy'] 
    },
    { 
      name: 'Diagnostic Center', 
      modules: ['Billing', 'Appointment', 'Pathology', 'Radiology'] 
    },
    { 
      name: 'Custom', 
      modules: [] 
    }
  ]
  
  // State for selected template
  const [selectedTemplate, setSelectedTemplate] = useState('Custom')

  // Check if SMTP is configured
  useEffect(() => {
    const checkSmtpStatus = async () => {
      setCheckingSmtp(true)
      try {
        const response = await fetch('/api/settings/smtp/status')
        if (response.ok) {
          const data = await response.json()
          setSmtpEnabled(data.enabled)
        }
      } catch (error) {
        console.error('Error checking SMTP status:', error)
        setSmtpEnabled(false)
      } finally {
        setCheckingSmtp(false)
      }
    }
    
    checkSmtpStatus()
  }, [])
  
  useEffect(() => {
    if (initialData) {
      setBranchesInput(initialData.branches?.join(', ') || '')
    }
  }, [initialData])
  
  // Check subdomain availability
  useEffect(() => {
    const checkSubdomainAvailability = async () => {
      if (!formData.subdomain || formData.subdomain.length < 3) {
        setSubdomainAvailable(null);
        return;
      }
      
      setIsCheckingSubdomain(true);
      try {
        const response = await fetch(`/api/hospitals/check-subdomain?subdomain=${formData.subdomain}`);
        const data = await response.json();
        setSubdomainAvailable(data.available);
      } catch (error) {
        console.error('Error checking subdomain:', error);
        setSubdomainAvailable(null);
      } finally {
        setIsCheckingSubdomain(false);
      }
    };

    // Clear previous timeout
    if (subdomainTimeout) {
      clearTimeout(subdomainTimeout);
    }

    // Set a new timeout to check after user stops typing
    if (formData.subdomain) {
      const timeout = setTimeout(checkSubdomainAvailability, 500);
      setSubdomainTimeout(timeout);
    } else {
      setSubdomainAvailable(null);
    }

    return () => {
      if (subdomainTimeout) {
        clearTimeout(subdomainTimeout);
      }
    };
  }, [formData.subdomain])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleBranchesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBranchesInput(value)
    setFormData(prev => ({
      ...prev,
      branches: value.split(',').map(item => item.trim()).filter(Boolean)
    }))
  }

  const handleCheckboxChange = (module: string) => {
    setFormData(prev => {
      if (prev.modules.includes(module)) {
        return {
          ...prev,
          modules: prev.modules.filter(m => m !== module)
        }
      } else {
        return {
          ...prev,
          modules: [...prev.modules, module]
        }
      }
    })
  }
  
  // Auto-generate subdomain from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      name: value,
      // Only auto-generate subdomain if it hasn't been manually modified
      subdomain: prev.subdomain === '' ? value.toLowerCase().replace(/[^a-z0-9]/g, '-') : prev.subdomain
    }))
  }

  // Handle password reset for hospital admin
  const handleResetPassword = async (adminEmail: string) => {
    try {
      setIsResettingPassword(true);
      
      const response = await fetch('/api/hospitals/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      toast.success('New password generated and sent to the admin email');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Hospital Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleNameChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain</Label>
          <div className="relative">
            <Input
              id="subdomain"
              name="subdomain"
              value={formData.subdomain}
              onChange={handleChange}
              required
              className={`${
                subdomainAvailable === true ? 'border-green-500 pr-10' : 
                subdomainAvailable === false ? 'border-red-500 pr-10' : ''
              }`}
            />
            {isCheckingSubdomain && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {!isCheckingSubdomain && subdomainAvailable === true && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {!isCheckingSubdomain && subdomainAvailable === false && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          {subdomainAvailable === false && (
            <p className="text-xs text-red-500 mt-1">This subdomain is already taken. Please choose another one.</p>
          )}
          {subdomainAvailable === true && (
            <p className="text-xs text-green-500 mt-1">This subdomain is available!</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Your hospital will be accessible at: /{formData.subdomain}/</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value="Sierra Leone"
            onChange={handleChange}
            disabled
            required
          />
          <p className="text-xs text-muted-foreground">Default country for all hospitals</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            name="website"
            value={formData.website || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={formData.status} onValueChange={(value: Status) => setFormData(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="package">Package</Label>
          <Select name="package" value={formData.package} onValueChange={(value: Package) => setFormData(prev => ({ ...prev, package: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select package" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Facility Type</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {facilityTemplates.map(template => (
            <Button
              key={template.name}
              type="button"
              variant={selectedTemplate === template.name ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedTemplate(template.name);
                // Apply template modules
                if (template.name !== 'Custom') {
                  setFormData(prev => ({
                    ...prev,
                    modules: template.modules
                  }));
                }
              }}
            >
              {template.name}
            </Button>
          ))}
        </div>
        
        <Label>Modules & Features</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          {availableModules.map(module => (
            <div key={module} className="flex items-center space-x-2">
              <Checkbox
                id={`module-${module}`}
                checked={formData.modules.includes(module)}
                onCheckedChange={() => {
                  handleCheckboxChange(module);
                  setSelectedTemplate('Custom'); // Switch to custom when manually selecting
                }}
              />
              <Label htmlFor={`module-${module}`} className="text-sm font-normal cursor-pointer">
                {module}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branches">Branches (comma separated)</Label>
        <Input
          id="branches"
          name="branches"
          value={branchesInput}
          onChange={handleBranchesChange}
          placeholder="e.g. Downtown, North Branch, South Branch"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="admin_email">Admin Email</Label>
          <Input
            id="admin_email"
            name="admin_email"
            type="email"
            value={formData.admin_email}
            onChange={handleChange}
            required
          />
          {smtpEnabled && (
            <p className="text-xs text-muted-foreground mt-1">
              Admin credentials will be sent to this email address.
            </p>
          )}
        </div>
        {!smtpEnabled ? (
          <div className="space-y-2">
            <Label htmlFor="admin_password">Admin Password</Label>
            <Input
              id="admin_password"
              name="admin_password"
              type="password"
              value={formData.admin_password}
              onChange={handleChange}
              required={!initialData}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Admin Password</Label>
            <div className="h-10 px-3 py-2 rounded-md border border-input bg-gray-100 flex items-center">
              <span className="text-sm text-muted-foreground">Password will be auto-generated</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A secure password will be generated and sent to the admin email.
            </p>
            {initialData && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 text-xs text-blue-600 border-blue-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const confirmReset = window.confirm(
                    `Are you sure you want to reset the password for ${formData.admin_email}? 

This will invalidate the current password and send a new one to the admin's email.`
                  );
                  if (confirmReset && initialData) {
                    handleResetPassword(initialData.admin_email);
                  }
                }}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? 'Sending...' : 'Resend Admin Password'}
              </Button>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isCheckingSubdomain || subdomainAvailable === false}
          >
            {isCheckingSubdomain ? 'Checking...' : 'Save Hospital'}
          </Button>
        </div>
      </DialogFooter>
    </form>
  )
}

// Main HospitalsPage component
export default function HospitalsPage() {
  // We need to preserve the superadmin layout
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchHospitals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/hospitals')
      
      if (!response.ok) {
        throw new Error('Failed to fetch hospitals')
      }
      
      const data = await response.json()
      console.log('Fetched hospitals:', data)

      // Check if the data is in the expected format
      if (data.hospitals) {
        setHospitals(data.hospitals)
      } else {
        setHospitals(data)
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error)
      setError('Failed to fetch hospitals')
      toast.error('Failed to fetch hospitals')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  const handleAddHospital = async (data: HospitalFormData): Promise<void> => {
    try {
      setIsSubmitting(true)
      console.log('Creating hospital with data:', data)
      
      // Prepare data for submission
      const hospitalData = {
        name: data.name,
        subdomain: data.subdomain || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        admin_email: data.admin_email,
        admin_password: data.admin_password,
        description: data.description || '',
        website: data.website || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        zip: data.zip || '',
        modules: Array.isArray(data.modules) ? data.modules : ['billing', 'appointment'],
        package: data.package || 'Basic'
      }

      const response = await fetch('/api/hospitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hospitalData),
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.detail || 'Failed to create hospital')
      }

      console.log('Hospital created:', responseData)
      toast.success('Hospital created successfully')
      setIsAddDialogOpen(false)
      await fetchHospitals() // Refresh hospital list
    } catch (error: any) {
      console.error('Error creating hospital:', error)
      toast.error(error.message || 'An error occurred while creating the hospital')
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleUpdateHospital = async (data: HospitalFormData): Promise<void> => {
    if (!editingHospital) return
    try {
      const updatedHospitalData = {
        ...data,
        id: editingHospital.id,
        created_at: editingHospital.created_at,
        updated_at: new Date().toISOString()
      }

      const response = await fetch(`/api/hospitals/${editingHospital.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedHospitalData)
      })

      if (!response.ok) {
        throw new Error('Failed to update hospital')
      }

      const updatedHospital = await response.json()
      setHospitals(prev => prev.map(h => h.id === editingHospital.id ? updatedHospital : h))
      setIsEditDialogOpen(false)
      setEditingHospital(null)
      toast.success('Hospital updated successfully')
    } catch (error) {
      console.error('Error updating hospital:', error)
      toast.error('Failed to update hospital')
    }
  }

  const handleDeleteHospital = async (id: string): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this hospital?')) return

    try {
      const response = await fetch(`/api/hospitals/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete hospital')
      
      setHospitals(prev => prev.filter(h => h.id !== id))
      toast.success('Hospital deleted successfully')
    } catch (error) {
      console.error('Error deleting hospital:', error)
      toast.error('Failed to delete hospital')
    }
  }

  const handleViewHospital = (hospital: Hospital): void => {
    setSelectedHospital(hospital)
    setIsViewDialogOpen(true)
  }

  const handleEditHospital = (hospital: Hospital): void => {
    setEditingHospital(hospital)
    setIsEditDialogOpen(true)
  }

  const columns: ColumnDef<Hospital, any>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.getValue('name')
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.getValue('email')
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('status') === 'Active' ? 'default' : 'destructive'}>
          {row.getValue('status')}
        </Badge>
      )
    },
    {
      accessorKey: 'package',
      header: 'Package',
      cell: ({ row }) => row.getValue('package')
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const hospital = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleViewHospital(hospital)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEditHospital(hospital)}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDeleteHospital(hospital.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="py-6 px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Hospitals</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add Hospital
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <DataTable<Hospital, any> columns={columns} data={hospitals} />
      )}

      {/* Create Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Hospital</DialogTitle>
          </DialogHeader>
          <HospitalForm
            onSubmit={handleAddHospital}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hospital</DialogTitle>
          </DialogHeader>
          {editingHospital && (
            <HospitalForm
              initialData={{
                name: editingHospital.name,
                subdomain: editingHospital.subdomain,
                email: editingHospital.email,
                phone: editingHospital.phone,
                address: editingHospital.address,
                city: editingHospital.city,
                state: editingHospital.state,
                country: editingHospital.country,
                zip: editingHospital.zip,
                status: editingHospital.status,
                package: editingHospital.package,
                website: editingHospital.website,
                description: editingHospital.description,
                modules: editingHospital.modules,
                admin_email: editingHospital.admin_email,
                admin_password: editingHospital.admin_password || '',
                branches: editingHospital.branches
              }}
              onSubmit={handleUpdateHospital}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Hospital</DialogTitle>
          </DialogHeader>
          {selectedHospital && <HospitalView hospital={selectedHospital} onClose={() => setIsViewDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
