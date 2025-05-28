"use client"

import { Suspense } from "react"
import Link from "next/link"

// Import the MultiStepForm component
import { MultiStepForm } from "./components/multi-step-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function PatientRegistrationPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-primary text-primary-foreground py-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              Sierra Leone National Health Service
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm hover:underline">
                Home
              </Link>
              <Link href="/" className="text-sm hover:underline">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container flex-1 py-12">
        <div className="mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Patient Registration</h1>
            <p className="mt-2 text-muted-foreground">
              Register as a patient to access healthcare services in Sierra Leone
            </p>
          </div>
          
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <MultiStepForm />
          </Suspense>
        </div>
      </div>
      
      <footer className="bg-muted py-6">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sierra Leone National Health Service. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
