"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestLoginPage() {
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`])
  }

  const testLocalStorage = () => {
    try {
      addLog("Testing localStorage...")
      localStorage.setItem("test-key", "test-value")
      const retrieved = localStorage.getItem("test-key")
      addLog(`Retrieved: ${retrieved}`)
      localStorage.removeItem("test-key")
      addLog("localStorage is working properly")
    } catch (error: any) {
      addLog(`localStorage error: ${error.message}`)
    }
  }

  const setPatientData = () => {
    try {
      addLog("Setting patient data...")
      localStorage.setItem("medicalNumber", "P12345")
      localStorage.setItem("patientName", "John Doe")
      localStorage.setItem("userType", "patient")
      localStorage.setItem("isPatientLoggedIn", "true")
      addLog("Patient data set successfully")
    } catch (error: any) {
      addLog(`Error setting patient data: ${error.message}`)
    }
  }

  const goToDashboard = () => {
    try {
      addLog("Navigating to dashboard...")
      window.location.href = "/patient/dashboard"
    } catch (error: any) {
      addLog(`Navigation error: ${error.message}`)
    }
  }

  const clearStorage = () => {
    try {
      addLog("Clearing storage...")
      localStorage.removeItem("medicalNumber")
      localStorage.removeItem("patientName")
      localStorage.removeItem("userType")
      localStorage.removeItem("isPatientLoggedIn")
      addLog("Storage cleared")
    } catch (error: any) {
      addLog(`Clear error: ${error.message}`)
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Login Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button onClick={testLocalStorage} className="w-full">
              Test localStorage
            </Button>
            
            <Button onClick={setPatientData} className="w-full">
              Set Patient Data
            </Button>
            
            <Button onClick={goToDashboard} className="w-full">
              Go to Dashboard
            </Button>
            
            <Button onClick={clearStorage} variant="destructive" className="w-full">
              Clear Storage
            </Button>
          </div>
          
          <div className="border rounded-md p-4 h-64 overflow-auto bg-gray-50">
            <div className="font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-400">Logs will appear here...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="pb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
