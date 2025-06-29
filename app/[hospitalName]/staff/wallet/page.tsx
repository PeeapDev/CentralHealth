"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ArrowDown, ArrowUp, ArrowUpRight, CreditCard, 
  ChevronsUpDown, Wallet, AlertCircle, Download
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Define proper TypeScript interfaces
interface WalletData {
  balance: number;
  currency: string;
  pendingSalary?: number;
  lastPayment?: string;
  nextPayment?: string;
}

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  time: string;
  reference: string;
  linkedId: string;
}

export default function StaffWalletPage() {
  const params = useParams<{ hospitalName: string }>()
  const hospitalName = params?.hospitalName || ""
  const { toast } = useToast()
  
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Function to fetch wallet data
  const fetchWalletData = async () => {
    setLoading(true);
    try {
      console.log(`Fetching wallet data for hospital: ${hospitalName}`);
      
      // Use real API endpoint to fetch wallet data with credentials to include cookies
      const response = await fetch(`/api/hospitals/${hospitalName}/staff/wallet`, {
        credentials: 'include', // This ensures cookies (including auth token) are sent
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Get detailed error message if available
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`;
          }
        } catch (e) {
          // Response might not contain valid JSON
        }
        
        // Show toast notification for user feedback
        toast({
          title: "Failed to fetch wallet data",
          description: errorMessage,
          variant: "destructive"
        });
        
        console.error(`Staff Wallet Page - Data fetch error: ${errorMessage}`);
        
        setLoading(false);
        setError(errorMessage);
        return;
      }
      
      // Check if we received valid data structure
      if (!response.headers.get("content-type")?.includes("application/json")) {
        const errorMessage = "API did not return valid JSON data";
        console.error(errorMessage);
        toast({
          title: "Data Error",
          description: "Received invalid wallet data structure",
          variant: "destructive"
        })
        setLoading(false);
        setError(errorMessage);
        return;
      }
      
      const data = await response.json()
      console.log('Wallet data received:', data)
      
      if (data.wallet) {
        setWalletData(data.wallet as WalletData)
        setTransactions(data.transactions as Transaction[] || [])
      } else {
        console.error('Invalid wallet data structure:', data)
        toast({
          title: "Data Error",
          description: "Received invalid wallet data structure",
          variant: "destructive"
        })
        setLoading(false);
        setError("Invalid wallet data received. Please contact support.");
        setError("Invalid wallet data received. Please contact support.");
        return;
      }
      
      const data = await response.json();
      console.log('Wallet data received:', data);
      
      if (data.wallet) {
        setWalletData({
          balance: data.wallet.balance || 0,
          currency: data.wallet.currency || 'USD',
          pendingSalary: data.wallet.pendingSalary,
          lastPayment: data.wallet.lastPayment,
          nextPayment: data.wallet.nextPayment
        });
        
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        }
        
        setError(null);
      } else {
        console.error('Invalid wallet data structure:', data);
        toast({
          title: "Data Structure Error",
          description: "Received incomplete wallet data",
          variant: "destructive"
        });
        setError("Invalid wallet data structure received.");
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      });
      setError("Failed to load wallet data. Please try again later.");
    } finally {
      setLoading(false);
    }
        }
        
        const data = await response.json()
        console.log('Wallet data received:', data)
        
        if (data.wallet) {
          setWalletData(data.wallet as WalletData)
          setTransactions(data.transactions as Transaction[] || [])
        } else {
          console.error('Invalid wallet data structure:', data)
          toast({
            title: "Data Error",
            description: "Received invalid wallet data structure",
            variant: "destructive"
          })
          setError("Invalid wallet data received. Please contact support.")
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error)
        setError("Failed to load wallet data. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchWalletData()
  }, [hospitalName, toast])
  
  // Helper function to get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "salary":
        return <ArrowDown className="h-8 w-8 p-1.5 rounded-full bg-green-100 text-green-600" />
      case "bonus":
        return <ArrowDown className="h-8 w-8 p-1.5 rounded-full bg-blue-100 text-blue-600" />
      case "withdrawal":
        return <ArrowUp className="h-8 w-8 p-1.5 rounded-full bg-red-100 text-red-600" />
      case "tax":
        return <ArrowUp className="h-8 w-8 p-1.5 rounded-full bg-orange-100 text-orange-600" />
      default:
        return <ChevronsUpDown className="h-8 w-8 p-1.5 rounded-full bg-gray-100 text-gray-600" />
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }
  
  // Generate wallet data based on current state
  const generateWalletData = (): WalletData => {
    // Only use this in development or when API data isn't available
    if (process.env.NODE_ENV === "development" && !walletData) {
      return {
        balance: 3250.75,
        currency: "USD",
        pendingSalary: 2500.00,
        lastPayment: "2023-11-15",
        nextPayment: "2023-12-15"
      }
    }
    return walletData || {
      balance: 0,
      currency: "USD"
    }
  }
  
  const walletInfo = generateWalletData()
  
  // Use transactions from API or fallback to sample data in development or empty array in production
  const displayTransactions: Transaction[] = transactions.length > 0 ? transactions : 
    (process.env.NODE_ENV === "development" ? [
    {
      id: "txn-001",
      type: "salary",
      description: "Monthly Salary Payment",
      amount: 2500.00,
      status: "completed",
      date: "2023-11-15",
      time: "09:30 AM",
      reference: "NOV-2023-SAL",
      linkedId: "PAY-001"
    },
    {
      id: "txn-002",
      type: "bonus",
      description: "Performance Bonus",
      amount: 500.00,
      status: "completed",
      date: "2023-11-15",
      time: "09:30 AM",
      reference: "Q4-BONUS",
      linkedId: "BON-002"
    },
    {
      id: "txn-003",
      type: "tax",
      description: "Tax Deduction",
      amount: -375.00,
      status: "completed",
      date: "2023-11-15",
      time: "09:30 AM",
      reference: "TAX-NOV23",
      linkedId: "TAX-001"
    },
    {
      id: "txn-004",
      type: "withdrawal",
      description: "Bank Transfer",
      amount: -1000.00,
      status: "completed",
      date: "2023-11-20",
      time: "14:45 PM",
      reference: "BNK-TRF",
      linkedId: "WTH-001"
    },
    {
      id: "txn-005",
      type: "salary",
      description: "Upcoming Salary Payment",
      amount: 2500.00,
      status: "pending",
      date: "2023-12-15",
      time: "00:00 AM",
      reference: "DEC-2023-SAL",
      linkedId: "PAY-002"
    }
  ] : [])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Wallet</h1>
          <p className="text-gray-600">
            Manage your salary and payments
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-red-700 text-lg font-medium">Error Loading Wallet Data</h2>
          </div>
          <p className="mt-2 text-red-600">{error}</p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Wallet Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance Card */}
            <Card className="bg-white shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center">
                  <Wallet className="h-5 w-5 mr-2 text-blue-600" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  ${walletInfo.balance?.toFixed(2)}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Available for withdrawal
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    Withdraw to Bank
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming Payment Card */}
            <Card className="bg-white shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                  Next Salary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${walletInfo.pendingSalary?.toFixed(2)}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Expected on {walletInfo.nextPayment}
                </p>
                <div className="mt-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Scheduled Payment
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Tax Summary Card */}
            <Card className="bg-white shadow hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-gray-600" />
                  Payment Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-medium text-gray-900">
                  Salary & Tax Statements
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  Download your payment history and tax documents
                </p>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Documents
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Transactions History */}
          <div className="mt-8">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="salary">Salary</TabsTrigger>
                  <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
              </div>
              
              {/* All Transactions */}
              <TabsContent value="all" className="mt-4 space-y-4">
                {displayTransactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-gray-500">
                              {transaction.date} at {transaction.time} • {transaction.reference}
                            </div>
                            <Badge variant="outline" className="text-xs mt-1">
                              ID: {transaction.linkedId}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-medium text-lg ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              {/* Salary Transactions */}
              <TabsContent value="salary" className="mt-4 space-y-4">
                {displayTransactions
                  .filter(t => t.type.toLowerCase() === 'salary')
                  .map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-500">
                                {transaction.date} at {transaction.time} • {transaction.reference}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                ID: {transaction.linkedId}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-medium text-lg ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                            </div>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
              
              {/* Other Transactions */}
              <TabsContent value="other" className="mt-4 space-y-4">
                {displayTransactions
                  .filter(t => t.type.toLowerCase() !== 'salary')
                  .map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-500">
                                {transaction.date} at {transaction.time} • {transaction.reference}
                              </div>
                              <Badge variant="outline" className="text-xs mt-1">
                                ID: {transaction.linkedId}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-medium text-lg ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                            </div>
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  )
}
