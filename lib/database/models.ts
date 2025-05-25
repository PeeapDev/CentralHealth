// Database Models and Types
export interface Hospital {
  _id?: string
  id?: number
  name: string
  slug: string
  description?: string
  logo?: string
  contact: {
    email: string
    phone: string
    website?: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
      coordinates?: {
        lat: number
        lng: number
      }
    }
  }
  subscription: {
    package: "basic" | "standard" | "premium" | "enterprise"
    status: "active" | "inactive" | "suspended" | "trial"
    startDate: Date
    endDate: Date
    maxUsers: number
    maxPatients: number
    features: string[]
  }
  settings: {
    timezone: string
    currency: string
    language: string
    branches: Array<{
      name: string
      address: object
      phone: string
      isMain: boolean
    }>
    modules: Array<{
      name: string
      enabled: boolean
      config: object
    }>
  }
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export interface User {
  _id?: string
  id?: number
  hospitalId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  password: string
  role: "admin" | "doctor" | "nurse" | "receptionist" | "pharmacist" | "lab_technician"
  permissions: string[]
  profile: {
    employeeId?: string
    department?: string
    specialization?: string
    licenseNumber?: string
    experience?: number
    qualification?: string
  }
  isActive: boolean
  isVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface Patient {
  _id?: string
  id?: number
  hospitalId: string
  patientId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  gender: "male" | "female" | "other"
  bloodGroup?: string
  contact: {
    email?: string
    phone: string
    emergencyContact: {
      name: string
      phone: string
      relationship: string
    }
    address: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
  medical: {
    allergies: string[]
    chronicConditions: string[]
    medications: string[]
    insuranceInfo?: {
      provider: string
      policyNumber: string
      groupNumber: string
    }
  }
  isActive: boolean
  registrationDate: Date
  lastVisit?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Appointment {
  _id?: string
  id?: number
  hospitalId: string
  patientId: string
  doctorId: string
  appointmentDate: Date
  duration: number
  type: "consultation" | "follow-up" | "emergency" | "procedure"
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show"
  reason: string
  symptoms?: string[]
  notes?: string
  fees: {
    consultation: number
    additional: number
    total: number
    paid: boolean
    paymentMethod?: string
  }
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface MedicalRecord {
  _id?: string
  id?: number
  hospitalId: string
  patientId: string
  appointmentId?: string
  doctorId: string
  recordType: "consultation" | "lab_result" | "prescription" | "diagnosis" | "procedure"
  date: Date
  vitals?: {
    temperature?: number
    bloodPressure?: string
    heartRate?: number
    weight?: number
    height?: number
  }
  diagnosis: string[]
  prescription: Array<{
    medication: string
    dosage: string
    frequency: string
    duration: string
    instructions: string
  }>
  labResults: Array<{
    testName: string
    result: string
    normalRange: string
    status: string
  }>
  attachments: string[]
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  _id?: string
  id?: number
  hospitalId: string
  patientId: string
  appointmentId?: string
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
    category: "consultation" | "medication" | "test" | "procedure" | "room" | "other"
  }>
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "pending" | "paid" | "overdue" | "cancelled"
  paymentMethod?: string
  paidAmount: number
  paidDate?: Date
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
    hospital: {
      id: string
      name: string
      slug: string
    }
  }
}
