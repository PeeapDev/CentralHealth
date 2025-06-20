"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowRightLeft, Ambulance, Clock, PlusCircle } from "lucide-react"

import { NewReferralDialog } from "../admin/referral/new-referral-dialog"

// Define referral status badge variants
const statusVariants = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "destructive",
  COMPLETED: "default",
  CANCELLED: "secondary",
}

// Define the referral interface based on the API response
interface Referral {
  id: string
  referralCode: string
  status: string
  priority: string
  ambulanceRequired: boolean
  notes: string | null
  createdAt: string
  patient: {
    id: string
    name: any
    medicalNumber: string
  }
  referringHospital: {
    id: string
    name: string
    subdomain: string
  }
  receivingHospital: {
    id: string
    name: string
    subdomain: string
  }
}

export default function ReferralsPage() {
  const params = useParams()
  const hospitalName = params?.hospitalName as string
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [authToken, setAuthToken] = useState('')
  const router = useRouter()

  // Fetch demo token for development
  useEffect(() => {
    const fetchDemoToken = async () => {
      try {
        // Only fetch demo token in development mode
        const response = await fetch(`/api/auth/demo-token?role=doctor&hospital=${hospitalName}`)
        if (response.ok) {
          const data = await response.json()
          setAuthToken(data.token)
        }
      } catch (error) {
        console.error('Error fetching demo token:', error)
      }
    }

    if (hospitalName) {
      fetchDemoToken()
    }
  }, [hospitalName])

  // Fetch referrals from the API
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setIsLoading(true)
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        
        // Add authorization header if we have a token
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }
        
        const response = await fetch(`/api/hospitals/${hospitalName}/referrals`, {
          credentials: 'include', // Include cookies in the request
          headers,
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch referrals")
        }
        
        const data = await response.json()
        setReferrals(data.referrals || [])
      } catch (error) {
        console.error("Error fetching referrals:", error)
        toast.error("Failed to load referrals")
      } finally {
        setIsLoading(false)
      }
    }

    if (hospitalName) {
      fetchReferrals()
    }
  }, [hospitalName])

  // Filter referrals based on active tab
  const filteredReferrals = referrals.filter(referral => {
    if (activeTab === "all") return true
    if (activeTab === "outgoing") return referral.referringHospital.subdomain === hospitalName
    if (activeTab === "incoming") return referral.receivingHospital.subdomain === hospitalName
    return true
  })

  // Format patient name from JSON structure
  const formatPatientName = (patient) => {
    try {
      if (typeof patient.name === 'string') {
        return patient.name
      }
      
      const nameObj = patient.name as any
      if (nameObj.given && nameObj.family) {
        return `${nameObj.given.join(' ')} ${nameObj.family}`
      }
      
      return `Patient ${patient.medicalNumber}`
    } catch (error) {
      return `Patient ${patient.medicalNumber}`
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Referrals</h2>
          <p className="text-muted-foreground">
            Manage patient referrals to and from other hospitals
          </p>
        </div>
        <NewReferralDialog hospitalName={hospitalName} />
      </div>
      
      <Separator className="my-6" />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referrals.length}</div>
              <p className="text-xs text-muted-foreground">
                Outgoing: {referrals.filter(r => r.referringHospital.subdomain === hospitalName).length}
                , Incoming: {referrals.filter(r => r.receivingHospital.subdomain === hospitalName).length}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referrals.filter(r => r.status === "PENDING").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring attention and follow-up
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emergency Referrals</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referrals.filter(r => r.priority === "EMERGENCY").length}
              </div>
              <p className="text-xs text-muted-foreground">
                High-priority cases requiring immediate action
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ambulance Required</CardTitle>
              <Ambulance className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {referrals.filter(r => r.ambulanceRequired).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Cases requiring medical transport
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Referrals List */}
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="all">All Referrals</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
            <TabsTrigger value="incoming">Incoming</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p>Loading referrals...</p>
                </div>
              </div>
            ) : filteredReferrals.length === 0 ? (
              <div className="text-center p-10 border rounded-lg">
                <div className="flex flex-col items-center space-y-4">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No referrals found</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "all" 
                      ? "You haven't created or received any referrals yet."
                      : activeTab === "outgoing"
                      ? "You haven't created any outgoing referrals yet."
                      : "You haven't received any incoming referrals yet."
                    }
                  </p>
                  <Button variant="outline" onClick={() => document.querySelector("[data-dialog-trigger='new-referral']")?.click()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create new referral
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredReferrals.map((referral) => (
                  <Card key={referral.id} className="cursor-pointer hover:bg-accent/5" 
                    onClick={() => router.push(`/${hospitalName}/referrals/${referral.referralCode}`)}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle>{referral.referralCode}</CardTitle>
                        <CardDescription>
                          Patient: {formatPatientName(referral.patient)}
                        </CardDescription>
                      </div>
                      <Badge variant={statusVariants[referral.status] as any}>
                        {referral.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">From:</span>
                          <span className="text-sm">{referral.referringHospital.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">To:</span>
                          <span className="text-sm">{referral.receivingHospital.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Priority:</span>
                          <span className="text-sm">{referral.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Created:</span>
                          <span className="text-sm">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {referral.ambulanceRequired && (
                          <div className="mt-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Ambulance className="h-3 w-3" />
                              Ambulance Required
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
