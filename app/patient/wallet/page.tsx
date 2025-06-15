"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { CreditCard, Plus, Wallet, Send, History, AlertCircle, Receipt, ArrowUpRight, ChevronsUpDown, Check, X, ArrowDown, ArrowUp, ArrowRight } from "lucide-react"
import { usePatientData } from "@/hooks/use-patient-data"

// Helper functions
const getTransactionIcon = (type: string) => {
  switch (type) {
    case "payment":
      return <ArrowUp className="h-8 w-8 p-1.5 rounded-full bg-red-100 text-red-600" />
    case "deposit":
      return <ArrowDown className="h-8 w-8 p-1.5 rounded-full bg-green-100 text-green-600" />
    case "refund":
      return <ArrowUpRight className="h-8 w-8 p-1.5 rounded-full bg-blue-100 text-blue-600" />
    default:
      return <ChevronsUpDown className="h-8 w-8 p-1.5 rounded-full bg-gray-100 text-gray-600" />
  }
}

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

export default function PatientWalletPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("wallet")
  
  // Use the patient data hook to get real data
  const { patient, walletData, transactions = [], paymentMethods = [], isLoading, error } = usePatientData()
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "wallet") {
      setCurrentPage("wallet")
    } else {
      router.push(`/patient/${page}`)
    }
  }
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "deposit":
        return <ArrowDown className="h-4 w-4 text-green-500" />
      case "refund":
        return <ArrowDown className="h-4 w-4 text-blue-500" />
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Patient Wallet" }]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Spinner className="w-10 h-10 mb-2" />
            <p className="text-gray-500">Loading patient wallet data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50">
          <h2 className="text-red-700 text-lg font-medium mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Wallet</h1>
            <p className="text-gray-600">
              Manage your medical payments and wallet balance for Patient ID: {walletData?.patientId || 'Loading...'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Transfer</span>
            </Button>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Money</span>
            </Button>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Wallet Balance</CardTitle>
                <CardDescription className="text-blue-100">Patient ID: {walletData?.patientId}</CardDescription>
              </div>
              <Wallet className="h-8 w-8 text-blue-200" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">${walletData?.balance.toFixed(2) || '0.00'}</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-blue-200">Pending</div>
                <div className="font-medium">{walletData?.pendingTransactions || 0} transactions</div>
              </div>
              <div>
                <div className="text-blue-200">Total Spent</div>
                <div className="font-medium">${walletData?.totalSpent.toFixed(2) || '0.00'}</div>
              </div>
              <div>
                <div className="text-blue-200">Rewards Points</div>
                <div className="font-medium">{walletData?.rewardsPoints || 0} pts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Plus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium">Add Money</div>
              <ArrowDown className="ml-1 h-4 w-4" />
            </CardContent>
          </Card>
          <Card className="bg-green-50 cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="font-medium text-lg">Exports</div>
                <div className="text-sm text-gray-500">View statements</div>
              </div>
              <ArrowDown className="h-5 w-5 text-gray-600" />
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Send className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium">Transfer</div>
              <div className="text-sm text-gray-500">Send to others</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <History className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="font-medium">History</div>
              <div className="text-sm text-gray-500">View transactions</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Transactions and Payment Methods */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            {transactions?.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No transactions found</p>
                </CardContent>
              </Card>
            ) : transactions?.map((transaction) => (
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

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-4">
            {paymentMethods?.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No payment methods found</p>
                </CardContent>
              </Card>
            ) : paymentMethods?.map((method) => (
              <Card key={method.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <div>
                        <div className="font-medium">{method.name}</div>
                        {method.expiryDate && <div className="text-sm text-gray-500">Expires: {method.expiryDate}</div>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <Badge variant="outline" className="text-blue-600">
                          Default
                        </Badge>
                      )}
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="font-medium text-gray-600">Add Payment Method</div>
                <div className="text-sm text-gray-500">Add a new card or bank account</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      )}
    </DashboardLayout>
  )
}
