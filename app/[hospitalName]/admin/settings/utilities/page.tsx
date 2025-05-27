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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar as CalendarIcon, Download, FileText, Filter, Loader2, RefreshCcw, Search, Wrench, FileDown, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface UtilitiesProps {
  params: Promise<{ hospitalName: string }> | { hospitalName: string }
}

interface LogEntry {
  id: string
  timestamp: Date
  user: string
  action: string
  module: string
  ipAddress: string
  details: string
  status: "success" | "warning" | "error"
}

interface BackupFile {
  id: string
  name: string
  size: string
  createdAt: Date
  type: string
}

export default function UtilitiesPage({ params }: UtilitiesProps) {
  // Extract hospitalName using React.use for Promise params
  const { hospitalName } = params instanceof Promise ? React.use(params) : params
  const router = useRouter()
  
  // State for logs tab
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [logLoading, setLogLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  
  // State for backup tab
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [backupLoading, setBackupLoading] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  
  // Generate mock logs
  useEffect(() => {
    const generateMockLogs = () => {
      setLogLoading(true)
      
      const actionTypes = [
        "Login", "Logout", "View Patient", "Create Patient", "Update Patient", "Delete Patient",
        "Create Appointment", "Update Appointment", "Cancel Appointment",
        "Create Invoice", "Process Payment", "Generate Report", "Export Data",
        "Change Settings", "Update User", "Reset Password"
      ]
      
      const modules = [
        "Authentication", "Patients", "Appointments", "Billing", "Reports", "Settings", "Users"
      ]
      
      const users = [
        "admin@hospital.com", "doctor1@hospital.com", "nurse1@hospital.com",
        "receptionist@hospital.com", "accountant@hospital.com"
      ]
      
      const statuses = ["success", "warning", "error"] as const
      
      const ipAddresses = [
        "192.168.1.100", "192.168.1.101", "192.168.1.102", "192.168.1.103", "192.168.1.104",
        "10.0.0.15", "10.0.0.16", "10.0.0.17", "10.0.0.18", "10.0.0.19"
      ]
      
      // Generate 100 random log entries over the past month
      const mockLogs: LogEntry[] = Array.from({ length: 100 }, (_, i) => {
        const timestamp = new Date()
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30))
        timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))
        
        const action = actionTypes[Math.floor(Math.random() * actionTypes.length)]
        const module = modules[Math.floor(Math.random() * modules.length)]
        const user = users[Math.floor(Math.random() * users.length)]
        const status = Math.random() > 0.8 ? (Math.random() > 0.5 ? "warning" : "error") : "success"
        const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)]
        
        let details = ""
        if (action.includes("Patient")) {
          details = `Patient ID: PAT-${Math.floor(Math.random() * 10000)}`
        } else if (action.includes("Appointment")) {
          details = `Appointment ID: APT-${Math.floor(Math.random() * 10000)}`
        } else if (action.includes("Invoice")) {
          details = `Invoice ID: INV-${Math.floor(Math.random() * 10000)}`
        } else if (action.includes("Payment")) {
          details = `Payment ID: PAY-${Math.floor(Math.random() * 10000)}, Amount: $${(Math.random() * 500).toFixed(2)}`
        } else if (action.includes("Report")) {
          details = `Report Type: ${["Financial", "Patient", "Inventory", "Staff"][Math.floor(Math.random() * 4)]}`
        }
        
        return {
          id: `log-${i}`,
          timestamp,
          user,
          action,
          module,
          ipAddress,
          details,
          status
        }
      })
      
      // Sort logs by timestamp (newest first)
      mockLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      
      setLogs(mockLogs)
      setFilteredLogs(mockLogs)
      setLogLoading(false)
    }
    
    generateMockLogs()
  }, [])
  
  // Generate mock backups
  useEffect(() => {
    const generateMockBackups = () => {
      setBackupLoading(true)
      
      const backupTypes = ["Full", "Database", "Files", "Configurations"]
      
      // Generate 10 random backup files over the past few months
      const mockBackups: BackupFile[] = Array.from({ length: 10 }, (_, i) => {
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90))
        
        const type = backupTypes[Math.floor(Math.random() * backupTypes.length)]
        const size = `${(Math.random() * 500 + 100).toFixed(2)} MB`
        
        return {
          id: `backup-${i}`,
          name: `${hospitalName.replace('-', '_')}_backup_${format(createdAt, 'yyyyMMdd')}_${type.toLowerCase()}.zip`,
          size,
          createdAt,
          type
        }
      })
      
      // Sort backups by creation date (newest first)
      mockBackups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      setBackups(mockBackups)
      setBackupLoading(false)
    }
    
    generateMockBackups()
  }, [hospitalName])
  
  // Filter logs when filters change
  useEffect(() => {
    filterLogs()
  }, [searchQuery, dateRange, statusFilter, moduleFilter, logs])
  
  // Filter logs based on current filters
  const filterLogs = () => {
    let filtered = [...logs]
    
    // Filter by search query (check user, action, and details)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.ipAddress.toLowerCase().includes(query)
      )
    }
    
    // Filter by date range
    if (dateRange.from) {
      filtered = filtered.filter(log => log.timestamp >= dateRange.from!)
    }
    if (dateRange.to) {
      const endDate = new Date(dateRange.to)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => log.timestamp <= endDate)
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter)
    }
    
    // Filter by module
    if (moduleFilter !== "all") {
      filtered = filtered.filter(log => log.module === moduleFilter)
    }
    
    setFilteredLogs(filtered)
  }
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("")
    setDateRange({ from: undefined, to: undefined })
    setStatusFilter("all")
    setModuleFilter("all")
  }
  
  // Create a new backup
  const createBackup = async (type: string) => {
    setCreatingBackup(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Create a new backup entry
      const newBackup: BackupFile = {
        id: `backup-${Date.now()}`,
        name: `${hospitalName.replace('-', '_')}_backup_${format(new Date(), 'yyyyMMdd')}_${type.toLowerCase()}.zip`,
        size: `${(Math.random() * 500 + 100).toFixed(2)} MB`,
        createdAt: new Date(),
        type
      }
      
      // Add to backups list
      setBackups([newBackup, ...backups])
      
      toast.success(`${type} backup created successfully`)
    } catch (error) {
      console.error("Error creating backup:", error)
      toast.error("Failed to create backup")
    } finally {
      setCreatingBackup(false)
    }
  }
  
  // Download backup
  const downloadBackup = (backup: BackupFile) => {
    toast.success(`Downloading ${backup.name}...`)
  }
  
  // Delete backup
  const deleteBackup = (backupId: string) => {
    if (confirm("Are you sure you want to delete this backup?")) {
      setBackups(backups.filter(backup => backup.id !== backupId))
      toast.success("Backup deleted successfully")
    }
  }
  
  // Export logs
  const exportLogs = (format: "csv" | "pdf") => {
    toast.success(`Exporting logs as ${format.toUpperCase()}...`)
  }
  
  // Get unique modules for filter
  const uniqueModules = Array.from(new Set(logs.map(log => log.module)))
  
  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Utilities"
        description="System utilities and maintenance tools"
        breadcrumbs={[
          { label: "Home", href: `/${hospitalName}/admin` },
          { label: "Settings", href: `/${hospitalName}/admin/settings` },
          { label: "Utilities" }
        ]}
      />
      
      <Tabs defaultValue="logs">
        <TabsList className="mb-4">
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>System Activity Logs</span>
              </CardTitle>
              <CardDescription>Track and monitor all system activities and user actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      placeholder="Search logs..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>{format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}</>
                          ) : (
                            format(dateRange.from, "MMM d, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange as any}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select value={moduleFilter} onValueChange={setModuleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {uniqueModules.map(module => (
                        <SelectItem key={module} value={module}>{module}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredLogs.length} of {logs.length} logs
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetFilters} className="gap-1">
                    <Filter className="h-4 w-4" />
                    <span>Reset Filters</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportLogs("csv")} className="gap-1">
                    <Download className="h-4 w-4" />
                    <span>Export CSV</span>
                  </Button>
                </div>
              </div>
              
              {/* Logs Table */}
              <div className="border rounded-md">
                {logLoading ? (
                  <div className="flex items-center justify-center p-6">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No logs found matching your filters</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">{format(log.timestamp, "MMM d, yyyy HH:mm:ss")}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.user}</TableCell>
                            <TableCell>{log.action}</TableCell>
                            <TableCell>{log.module}</TableCell>
                            <TableCell className="whitespace-nowrap">{log.ipAddress}</TableCell>
                            <TableCell>{log.details}</TableCell>
                            <TableCell>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${log.status === 'success' ? 'bg-green-100 text-green-800' : log.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                {log.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <span>Backup & Restore</span>
              </CardTitle>
              <CardDescription>Manage system backups and restore points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="col-span-full lg:col-span-2">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Create New Backup</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Button
                        variant="outline"
                        className="h-24 flex-col items-center justify-center gap-2 border-dashed"
                        disabled={creatingBackup}
                        onClick={() => createBackup("Full")}
                      >
                        {creatingBackup ? (
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Wrench className="h-8 w-8 text-gray-400" />
                            <span className="font-medium">Full Backup</span>
                            <span className="text-xs text-gray-500">Database, files, and settings</span>
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-24 flex-col items-center justify-center gap-2 border-dashed"
                        disabled={creatingBackup}
                        onClick={() => createBackup("Database")}
                      >
                        {creatingBackup ? (
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        ) : (
                          <>
                            <Wrench className="h-8 w-8 text-gray-400" />
                            <span className="font-medium">Database Only</span>
                            <span className="text-xs text-gray-500">Just database content</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="col-span-full lg:col-span-2">
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Restore</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="h-24 flex flex-col items-center justify-center gap-2 border border-dashed rounded-md text-center p-4">
                      <p className="text-sm text-gray-500">To restore from a backup, select a backup file from the list below and click "Restore"</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Available Backups</h3>
                  <Button variant="outline" size="sm" className="gap-1">
                    <RefreshCcw className="h-4 w-4" />
                    <span>Refresh</span>
                  </Button>
                </div>
                
                <div className="border rounded-md">
                  {backupLoading ? (
                    <div className="flex items-center justify-center p-6">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : backups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No backups available</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filename</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Date Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {backups.map((backup) => (
                          <TableRow key={backup.id}>
                            <TableCell className="font-mono text-xs">{backup.name}</TableCell>
                            <TableCell>
                              <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {backup.type}
                              </span>
                            </TableCell>
                            <TableCell>{backup.size}</TableCell>
                            <TableCell>{format(backup.createdAt, "MMM d, yyyy HH:mm")}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => downloadBackup(backup)}
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => deleteBackup(backup.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
