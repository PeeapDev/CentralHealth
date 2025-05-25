// API Client for Frontend
export class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl = "/api/v1") {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  private loadToken() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  // Set demo token for testing
  setDemoToken(role: string, hospitalSlug?: string) {
    const { getDemoToken } = require("@/lib/auth/jwt")
    this.token = getDemoToken(role, hospitalSlug)
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", this.token)
    }
  }

  // Set custom token
  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "API request failed")
    }

    return data
  }

  // Authentication
  async login(hospitalSlug: string, email: string, password: string) {
    const response = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ hospitalSlug, email, password }),
    })

    if (response.success && response.data.token) {
      this.token = response.data.token
      localStorage.setItem("auth_token", this.token)
    }

    return response
  }

  async logout() {
    this.token = null
    localStorage.removeItem("auth_token")
  }

  async getMe() {
    return this.request<any>("/auth/me")
  }

  // Patients
  async getPatients(params?: { page?: number; limit?: number; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.search) searchParams.set("search", params.search)

    const query = searchParams.toString()
    return this.request<any>(`/patients${query ? `?${query}` : ""}`)
  }

  async createPatient(patientData: any) {
    return this.request<any>("/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    })
  }

  // Appointments
  async getAppointments(params?: { date?: string; doctorId?: string; status?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.date) searchParams.set("date", params.date)
    if (params?.doctorId) searchParams.set("doctorId", params.doctorId)
    if (params?.status) searchParams.set("status", params.status)

    const query = searchParams.toString()
    return this.request<any>(`/appointments${query ? `?${query}` : ""}`)
  }

  async createAppointment(appointmentData: any) {
    return this.request<any>("/appointments", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    })
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>("/dashboard/stats")
  }

  // Hospitals (Super Admin only)
  async getHospitals() {
    return this.request<any>("/hospitals")
  }

  async createHospital(hospitalData: any) {
    return this.request<any>("/hospitals", {
      method: "POST",
      body: JSON.stringify(hospitalData),
    })
  }
}

export const apiClient = new ApiClient()

// Demo helper functions
export const demoAuth = {
  loginAsSuperAdmin: () => apiClient.setDemoToken("superadmin"),
  loginAsHospitalAdmin: (hospitalSlug: string) => apiClient.setDemoToken("admin", hospitalSlug),
  loginAsDoctor: (hospitalSlug: string) => apiClient.setDemoToken("doctor", hospitalSlug),
  loginAsNurse: (hospitalSlug: string) => apiClient.setDemoToken("nurse", hospitalSlug),
  loginAsReceptionist: (hospitalSlug: string) => apiClient.setDemoToken("receptionist", hospitalSlug),
}
