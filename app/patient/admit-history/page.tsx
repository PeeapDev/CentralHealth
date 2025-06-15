"use client"

import { useState } from 'react'
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { History, Calendar, FileText, Eye } from "lucide-react"

export default function AdmitHistoryPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("admit-history")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "admit-history") {
      setCurrentPage("admit-history")
    } else {
      // Navigate to other pages
      router.push(`/patient/${page}`)
    }
  }
  
  // Sample admit history data
  const admitHistory = [
    {
      id: 1,
      admitDate: "October 15, 2024",
      dischargeDate: "October 22, 2024",
      duration: "7 days",
      reason: "Cardiac Monitoring",
      department: "Cardiology",
      doctor: "Dr. Sarah Johnson",
      roomNumber: "302A",
      notes: "Patient admitted for cardiac monitoring following elevated blood pressure. Treatment successful."
    },
    {
      id: 2,
      admitDate: "July 2, 2024",
      dischargeDate: "July 5, 2024",
      duration: "3 days",
      reason: "Respiratory Infection",
      department: "Pulmonology",
      doctor: "Dr. David Martinez",
      roomNumber: "210B",
      notes: "Patient treated for severe respiratory infection. Recovery progressed well with antibiotics."
    },
    {
      id: 3,
      admitDate: "March 18, 2024",
      dischargeDate: "March 19, 2024",
      duration: "1 day",
      reason: "Diagnostic Testing",
      department: "Neurology",
      doctor: "Dr. Michael Chen",
      roomNumber: "115A",
      notes: "Admitted for overnight observation and neurological tests. Results normal."
    }
  ]
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Admission History" }]}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hospital Admission History</h1>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Records
          </Button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Previous Admissions</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {admitHistory.map((admission) => (
              <div key={admission.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <History className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900">{admission.reason}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{admission.admitDate} to {admission.dischargeDate} ({admission.duration})</span>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500">DEPARTMENT</p>
                          <p className="text-sm">{admission.department}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">ATTENDING PHYSICIAN</p>
                          <p className="text-sm">{admission.doctor}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500">ROOM</p>
                          <p className="text-sm">{admission.roomNumber}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500">NOTES</p>
                        <p className="text-sm text-gray-700">{admission.notes}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
