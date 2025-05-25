"use client"
import { Button } from "@/components/ui/button"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SuperAdminManagement() {
  const superAdmins = [
    {
      id: "1",
      image: "/placeholder.svg?height=40&width=40",
      name: "Super Admin",
      email: "superadmin@hms.com",
      address: "Binodpur",
      phone: "01749435500",
    },
    {
      id: "2",
      image: "/placeholder.svg?height=40&width=40",
      name: "John Doe",
      email: "john.doe@hms.com",
      address: "123 Main Street",
      phone: "01234567890",
    },
    {
      id: "3",
      image: "/placeholder.svg?height=40&width=40",
      name: "Jane Smith",
      email: "jane.smith@hms.com",
      address: "456 Oak Avenue",
      phone: "01987654321",
    },
  ]

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "image",
      header: "IMAGE",
      cell: ({ row }) => (
        <Avatar className="h-10 w-10">
          <AvatarImage src={row.original.image || "/placeholder.svg"} />
          <AvatarFallback>SA</AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "name",
      header: "NAME",
    },
    {
      accessorKey: "email",
      header: "EMAIL",
    },
    {
      accessorKey: "address",
      header: "ADDRESS",
    },
    {
      accessorKey: "phone",
      header: "PHONE",
    },
    {
      id: "actions",
      header: "OPTIONS",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: superAdmins,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <span>Home</span>
        <span>/</span>
        <span className="text-foreground">Superadmin</span>
      </div>

      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Superadmin</h2>
          <p className="text-muted-foreground">All the super admin names and related informations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Add Superadmin</Button>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <select className="border rounded px-2 py-1 text-sm">
              <option>All</option>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              Copy
            </Button>
            <Button variant="outline" size="sm">
              Excel
            </Button>
            <Button variant="outline" size="sm">
              CSV
            </Button>
            <Button variant="outline" size="sm">
              PDF
            </Button>
            <Button variant="outline" size="sm">
              Print
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Search:</span>
            <Input placeholder="" className="max-w-sm h-8" />
          </div>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-blue-600 hover:bg-blue-600">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-white font-semibold">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing 1 to {superAdmins.length} of {superAdmins.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
              1
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
