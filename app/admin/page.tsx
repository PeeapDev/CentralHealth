"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the admin login page
    router.replace("/admin/auth/login")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Redirecting...</h1>
        <p className="text-gray-500">Please wait while we redirect you to the admin login page</p>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  )
}
