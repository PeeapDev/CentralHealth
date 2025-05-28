"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: 'no-store'
      })

      const data = await response.json()

      if (response.ok && data.access_token) {
        // Store token in cookie for proper authentication
        document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
        
        toast.success("Login successful")
        
        // Add a delay to ensure cookie is set before navigation
        setTimeout(() => {
          if (data.user?.role === 'superadmin') {
            router.push("/superadmin")
          } else if (data.user?.hospitalId) {
            router.push(`/${data.user.hospitalId}/admin`)
          } else {
            router.push("/dashboard")
          }
          router.refresh()
        }, 500)
      } else {
        toast.error(data.error || "Login failed")
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-[400px] space-y-6 rounded-xl border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-muted-foreground">Enter your credentials to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}
