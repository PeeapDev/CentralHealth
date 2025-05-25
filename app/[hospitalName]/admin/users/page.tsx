import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Users, UserCheck, UserX, Shield } from "lucide-react"

interface UsersPageProps {
  params: { hospitalName: string }
}

export default function UsersPage({ params }: UsersPageProps) {
  const hospitalName = params.hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  const users = [
    {
      id: "USR001",
      name: "Dr. John Smith",
      email: "john.smith@hospital.com",
      role: "Doctor",
      department: "Cardiology",
      status: "Active",
      lastLogin: "2024-05-24 09:30",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "USR002",
      name: "Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      role: "Nurse",
      department: "Emergency",
      status: "Active",
      lastLogin: "2024-05-24 08:15",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "USR003",
      name: "Mike Wilson",
      email: "mike.wilson@hospital.com",
      role: "Admin",
      department: "Administration",
      status: "Active",
      lastLogin: "2024-05-24 10:45",
      avatar: "/placeholder.svg?height=32&width=32",
    },
    {
      id: "USR004",
      name: "Emily Brown",
      email: "emily.brown@hospital.com",
      role: "Technician",
      department: "Radiology",
      status: "Inactive",
      lastLogin: "2024-05-20 16:20",
      avatar: "/placeholder.svg?height=32&width=32",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-500 text-white">
            <UserCheck className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "Inactive":
        return (
          <Badge className="bg-gray-500 text-white">
            <UserX className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        )
      case "Suspended":
        return (
          <Badge variant="destructive">
            <UserX className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return (
          <Badge className="bg-purple-500 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      case "Doctor":
        return <Badge className="bg-blue-500 text-white">Doctor</Badge>
      case "Nurse":
        return <Badge className="bg-green-500 text-white">Nurse</Badge>
      case "Technician":
        return <Badge className="bg-orange-500 text-white">Technician</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - User Management`}
        description="Manage hospital staff accounts, roles, and permissions"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "User Management" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">231</div>
            <p className="text-xs text-muted-foreground">93% of total users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">New staff members</p>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Staff Directory</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search users..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm">{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          Permissions
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
