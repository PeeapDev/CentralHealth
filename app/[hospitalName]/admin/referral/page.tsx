import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, UserCheck, Clock, CheckCircle, XCircle } from "lucide-react"
import { NewReferralDialog } from "../../../../components/new-referral-dialog"
import { ReferralTableClient } from "@/components/referral-table-client"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

interface ReferralPageProps {
  params: { hospitalName: string }
}

// Define the types with proper relations
type Patient = {
  id: string;
  name: any; // JSON structure
  mrn: string; // Medical ID following NHS-style 5-character alphanumeric format
};

type Hospital = {
  id: string;
  name: string;
};

type ReferralWithRelations = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  referralCode: string;
  status: string;
  priority: string;
  notes?: string | null;
  ambulanceRequired: boolean;
  patientId: string;
  referringHospitalId: string;
  receivingHospitalId: string;
  patient: Patient;
  referringHospital: Hospital;
  receivingHospital: Hospital;
};

async function getReferrals(hospitalName: string): Promise<ReferralWithRelations[]> {
  try {
    // Check if prisma client is available
    if (!prisma) {
      console.error("Prisma client is not properly initialized");
      return [];
    }

    // Find the hospital first
    const hospital = await prisma.hospital.findFirst({
      where: { subdomain: hospitalName },
      select: { id: true }
    }).catch((err: unknown) => {
      console.error("Error finding hospital:", err);
      return null;
    });
    
    if (!hospital) {
      console.log(`No hospital found with subdomain: ${hospitalName}`);
      return [];
    }
    
    // Use a try-catch block specifically for the referral query
    try {
      // Check if the model exists in the Prisma schema
      if (!(prisma as any)["referral"]) {
        console.error("The referral model doesn't seem to exist in the Prisma schema");
        return [];
      }
      
      // Attempt to fetch referrals safely
      const referrals = await (prisma as any).referral.findMany({
        where: {
          OR: [
            { fromHospitalId: hospital.id },
            { toHospitalId: hospital.id }
          ]
        },
        include: {
          patient: true,
          fromHospital: true,  // Updated to match Prisma schema relation names
          toHospital: true,    // Updated to match Prisma schema relation names
        },
        orderBy: { createdAt: 'desc' }
      }).catch((err: Error) => {
        console.error("Error fetching referrals:", err);
        return [];
      });
      
      return referrals as ReferralWithRelations[];
    } catch (referralError: unknown) {
      console.error("Error in referral query:", referralError);
      return [];
    }
  } catch (error: unknown) {
    console.error("Error in getReferrals:", error);
    return [];
  }
}

async function getStats(hospitalName: string) {
  try {
    // Check if prisma client is available
    if (!prisma) {
      console.error("Prisma client is not properly initialized");
      return { total: 0, pending: 0, completed: 0, todayCompleted: 0 };
    }

    // Find the hospital first
    const hospital = await prisma.hospital.findFirst({
      where: { subdomain: hospitalName },
      select: { id: true }
    }).catch((err: unknown) => {
      console.error("Error finding hospital:", err);
      return null;
    });
    
    if (!hospital) {
      console.log(`No hospital found with subdomain: ${hospitalName}`);
      return { total: 0, pending: 0, completed: 0, todayCompleted: 0 };
    }
    
    // Check if the model exists in the Prisma schema
    if (!(prisma as any)["referral"]) {
      console.error("The referral model doesn't seem to exist in the Prisma schema");
      return { total: 0, pending: 0, completed: 0, todayCompleted: 0 };
    }
    
    // Calculate statistics with individual try-catch blocks
    let total = 0, pending = 0, completed = 0, todayCompleted = 0;
    
    // Total referrals
    try {
      total = await (prisma as any).referral.count({
        where: {
          OR: [
            { fromHospitalId: hospital.id },
            { toHospitalId: hospital.id }
          ]
        },
      }).catch((err: unknown) => {
        console.error("Error counting total:", err);
        return 0;
      });
    } catch (e: unknown) {
      console.error("Error counting total referrals:", e);
    }
    
    // Pending referrals
    try {
      pending = await (prisma as any).referral.count({
        where: {
          OR: [
            { fromHospitalId: hospital.id },
            { toHospitalId: hospital.id }
          ],
          status: "PENDING"
        },
      }).catch((err: unknown) => {
        console.error("Error counting pending:", err);
        return 0;
      });
    } catch (e: unknown) {
      console.error("Error counting pending referrals:", e);
    }
    
    // Completed referrals
    try {
      completed = await (prisma as any).referral.count({
        where: {
          OR: [
            { fromHospitalId: hospital.id },
            { toHospitalId: hospital.id }
          ],
          status: "COMPLETED"
        },
      }).catch((err: unknown) => {
        console.error("Error counting completed:", err);
        return 0;
      });
    } catch (e: unknown) {
      console.error("Error counting completed referrals:", e);
    }
    
    // Today's completed referrals
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      todayCompleted = await (prisma as any).referral.count({
        where: {
          OR: [
            { fromHospitalId: hospital.id },
            { toHospitalId: hospital.id }
          ],
          status: "COMPLETED",
          completedAt: {
            gte: today
          }
        },
      }).catch((err: unknown) => {
        console.error("Error counting today's completed:", err);
        return 0;
      });
    } catch (e: unknown) {
      console.error("Error counting today's completed referrals:", e);
    }
    
    return { total, pending, completed, todayCompleted };
  } catch (error: unknown) {
    console.error("Error in getStats:", error);
    return { total: 0, pending: 0, completed: 0, todayCompleted: 0 };
  }
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  // Ensure hospitalName is properly awaited if it's a promise
  const hospitalName = typeof params.hospitalName === 'function' 
    ? await Promise.resolve(params.hospitalName) 
    : params.hospitalName;
    
  console.log('Using hospital name:', hospitalName);
  const displayHospitalName = hospitalName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  
  // Get the hospital information first
  const hospital = await prisma.hospital.findFirst({
    where: { subdomain: hospitalName },
    select: { id: true, name: true }
  });
  
  console.log('Found hospital:', hospital?.id, hospital?.name);
  
  const referrals = await getReferrals(hospitalName);
  const stats = await getStats(hospitalName);
  
  // Format referrals for display
  const formattedReferrals = referrals.map((referral: ReferralWithRelations) => {
    // Extract patient name from JSON structure
    const patientName = (() => {
      try {
        if (referral.patient && referral.patient.name) {
          const nameObj = referral.patient.name as any;
          if (nameObj && nameObj.given && nameObj.family) {
            return `${Array.isArray(nameObj.given) ? nameObj.given.join(' ') : nameObj.given} ${nameObj.family}`;
          }
        }
        return referral.patient?.mrn || 'Unknown';
      } catch {
        return 'Unknown Patient';
      }
    })();
    
    return {
      id: referral.id,
      referralCode: referral.referralCode,
      patientName,
      patientId: referral.patientId,
      referringHospital: referral.referringHospital?.name || 'Unknown Hospital',
      receivingHospital: referral.receivingHospital?.name || 'Unknown Hospital',
      status: referral.status,
      priority: referral.priority || 'ROUTINE',
      date: referral.createdAt.toISOString().split('T')[0],
      notes: referral.notes || '',
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "ACCEPTED":
        return (
          <Badge className="bg-blue-500 text-white">
            <UserCheck className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "NONE":
        return <Badge variant="outline">None</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge variant="destructive">High</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>
      case "Low":
        return <Badge className="bg-green-500 text-white">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={`Welcome to ${hospitalName} - Referral Management`}
        description="Manage patient referrals between departments and external facilities"
        breadcrumbs={[{ label: hospitalName }, { label: "Admin" }, { label: "Referral Management" }]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No pending referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No completed referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Referral Management</CardTitle>
            <NewReferralDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search referrals..." className="pl-10" />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <div className="rounded-md border">
            {/* Use the client component to display both server and local referrals */}
            <ReferralTableClient 
              serverReferrals={formattedReferrals} 
              hospitalId={hospital?.id || ''} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
