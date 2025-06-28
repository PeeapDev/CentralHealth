"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
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
  ArrowDown,
  ArrowUp,
  Calendar as CalendarIcon,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Wallet,
  Activity,
  BarChart4,
  Building,
  Users,
  Banknote,
  CreditCard as PaymentCard,
  Coins,
  Receipt,
  FileSpreadsheet,
  Settings,
  Clock,
  History,
  Flag,
  Filter,
  Percent,
  CheckCircle,
  AlertCircle,
  CalendarCheck,
  Phone as PhoneIcon
} from "lucide-react"

export default function FinancePage() {
  const params = useParams<{ hospitalName: string }>()
  const hospitalName = params?.hospitalName || ""
  const { toast } = useToast()
  
  const [period, setPeriod] = useState<string>("monthly")
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [dateRange, setDateRange] = useState<{start: Date; end: Date}>({
    start: startOfMonth(new Date()),
    end: new Date()
  })
  
  // Initialize staff with empty array to prevent undefined errors
  const [staff, setStaff] = useState<any[]>([])
  
  // Sample data - in a real implementation, this would come from API calls
  const financialData = {
    totalRevenue: 897432.58,
    lastMonthRevenue: 823145.72,
    teleMedicineRevenue: 213487.95,
    inPersonRevenue: 683944.63,
    outstandingBalances: {
      patients: 142582.46,
      insurance: 387219.83
    },
    refundsAmount: 12458.72,
    chargebacksAmount: 3845.29,
    paymentMethods: {
      card: 45,
      wallet: 27,
      cash: 15,
      insurance: 13
    },
    hospitalRevenue: [
      { name: "Central Hospital", revenue: 342875.42, change: 5.2 },
      { name: "East Medical Center", revenue: 284562.18, change: 3.7 },
      { name: "Western Healthcare", revenue: 187641.93, change: -1.2 },
      { name: "North Clinical Institute", revenue: 82353.05, change: 8.4 }
    ],
    commissions: {
      total: 89743.26,
      telemedCommission: 8.5,
      bookingCommission: 5.0,
      pendingPayout: 34875.82
    },
    recentTransactions: [
      {
        id: "INV-2025-06291",
        date: "2025-06-28",
        type: "Payment",
        amount: 385.50,
        status: "completed",
        hospital: "Central Hospital",
        patient: "Sarah Johnson"
      },
      {
        id: "INV-2025-06290",
        date: "2025-06-28",
        type: "Refund",
        amount: 129.99,
        status: "completed",
        hospital: "East Medical Center",
        patient: "James Wilson"
      },
      {
        id: "INV-2025-06289",
        date: "2025-06-27",
        type: "Payment",
        amount: 758.25,
        status: "completed",
        hospital: "Western Healthcare",
        patient: "Maria Garcia"
      },
      {
        id: "INV-2025-06288",
        date: "2025-06-27",
        type: "Commission",
        amount: 45.35,
        status: "completed",
        hospital: "North Clinical Institute",
        patient: "-"
      },
      {
        id: "INV-2025-06287",
        date: "2025-06-26",
        type: "Payment",
        amount: 1250.00,
        status: "pending",
        hospital: "Central Hospital",
        patient: "David Smith"
      }
    ],
    pendingPayouts: [
      {
        id: "PAY-2025-062845",
        recipient: "Central Hospital",
        amount: 15782.43,
        scheduled: "2025-07-01"
      },
      {
        id: "PAY-2025-062846",
        recipient: "Dr. Robert Chen",
        amount: 8459.27,
        scheduled: "2025-07-01"
      },
      {
        id: "PAY-2025-062847",
        recipient: "East Medical Center",
        amount: 12375.82,
        scheduled: "2025-07-05"
      },
      {
        id: "PAY-2025-062848",
        recipient: "Dr. Amelia Wong",
        amount: 6854.11,
        scheduled: "2025-07-05"
      }
    ]
  }
  
  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  // Calculate percentage change
  const calculateChange = (current: number, previous: number): number => {
    return previous > 0 ? ((current - previous) / previous) * 100 : 0
  }
  
  const handleDownloadReport = (format: 'csv' | 'pdf') => {
    toast({
      title: "Report downloading",
      description: `Your ${format.toUpperCase()} report is being prepared and will download shortly.`,
    })
  }
  
  const handleCommissionChange = (hospitalId: string, newRate: number) => {
    toast({
      title: "Commission updated",
      description: `Commission rate for hospital ID ${hospitalId} has been updated to ${newRate}%.`,
    })
  }
  
  const handleInitiatePayout = (payoutId: string) => {
    toast({
      title: "Payout initiated",
      description: `Payout ${payoutId} has been initiated successfully.`,
    })
  }
  
  const periodsData = {
    daily: {
      label: "Today",
      previousLabel: "Yesterday",
      revenue: financialData.totalRevenue / 30,
      previousRevenue: financialData.totalRevenue / 30 * 0.92
    },
    weekly: {
      label: "This Week",
      previousLabel: "Last Week",
      revenue: financialData.totalRevenue / 4,
      previousRevenue: financialData.totalRevenue / 4 * 0.95
    },
    monthly: {
      label: "This Month",
      previousLabel: "Last Month",
      revenue: financialData.totalRevenue,
      previousRevenue: financialData.lastMonthRevenue
    }
  }
  
  const currentPeriodData = periodsData[period as keyof typeof periodsData]
  const percentageChange = calculateChange(currentPeriodData.revenue, currentPeriodData.previousRevenue)
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Executive overview of financial metrics and performance indicators for {hospitalName}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={setPeriod}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end
                }}
                onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      start: range.from,
                      end: range.to
                    })
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="hospital">Hospital Revenue</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-7 w-36" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{formatCurrency(currentPeriodData.revenue)}</div>
                    <div className="flex items-center pt-1 text-xs text-muted-foreground">
                      {percentageChange >= 0 ? (
                        <ArrowUp className="mr-1 h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDown className="mr-1 h-3 w-3 text-rose-500" />
                      )}
                      <span className={percentageChange >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {Math.abs(percentageChange).toFixed(1)}%
                      </span>
                      <span className="ml-1">from {currentPeriodData.previousLabel}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Outstanding Balances
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-7 w-36" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financialData.outstandingBalances.patients + financialData.outstandingBalances.insurance)}
                    </div>
                    <div className="flex items-center pt-1 text-xs">
                      <span className="text-muted-foreground">Patients: </span>
                      <span className="ml-1 font-medium">{formatCurrency(financialData.outstandingBalances.patients)}</span>
                      <span className="mx-1">|</span>
                      <span className="text-muted-foreground">Insurance: </span>
                      <span className="ml-1 font-medium">{formatCurrency(financialData.outstandingBalances.insurance)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
