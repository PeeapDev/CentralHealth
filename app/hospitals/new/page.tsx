"use client"

import { CreateHospitalForm } from "@/components/hospital/create-hospital-form"

export default function NewHospitalPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Create New Hospital</h1>
        <div className="rounded-lg border p-6">
          <CreateHospitalForm />
        </div>
      </div>
    </div>
  )
}
