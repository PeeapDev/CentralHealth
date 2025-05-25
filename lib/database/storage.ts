// Simple localStorage-based storage for demo (replace with real database)
import type { Hospital, User, Patient, Appointment } from "./models"

class DatabaseStorage {
  private getStorageKey(collection: string, hospitalId?: string): string {
    return hospitalId ? `${collection}_${hospitalId}` : collection
  }

  private getData<T>(key: string): T[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  private setData<T>(key: string, data: T[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    return this.getData<Hospital>("hospitals")
  }

  async getHospitalBySlug(slug: string): Promise<Hospital | null> {
    const hospitals = await this.getHospitals()
    return hospitals.find((h) => h.slug === slug) || null
  }

  async createHospital(hospital: Omit<Hospital, "_id">): Promise<Hospital> {
    const hospitals = await this.getHospitals()
    const newHospital: Hospital = {
      ...hospital,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    hospitals.push(newHospital)
    this.setData("hospitals", hospitals)
    return newHospital
  }

  // Users
  async getUsers(hospitalId: string): Promise<User[]> {
    return this.getData<User>(this.getStorageKey("users", hospitalId))
  }

  async getUserByEmail(hospitalId: string, email: string): Promise<User | null> {
    const users = await this.getUsers(hospitalId)
    return users.find((u) => u.email === email) || null
  }

  async createUser(user: Omit<User, "_id">): Promise<User> {
    const users = await this.getUsers(user.hospitalId)
    const newUser: User = {
      ...user,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    users.push(newUser)
    this.setData(this.getStorageKey("users", user.hospitalId), users)
    return newUser
  }

  // Patients
  async getPatients(
    hospitalId: string,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ patients: Patient[]; total: number }> {
    let patients = this.getData<Patient>(this.getStorageKey("patients", hospitalId))

    if (search) {
      const searchLower = search.toLowerCase()
      patients = patients.filter(
        (p) =>
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.patientId.toLowerCase().includes(searchLower) ||
          p.contact.phone.includes(search),
      )
    }

    const total = patients.length
    const startIndex = (page - 1) * limit
    const paginatedPatients = patients.slice(startIndex, startIndex + limit)

    return { patients: paginatedPatients, total }
  }

  async createPatient(patient: Omit<Patient, "_id">): Promise<Patient> {
    const patients = await this.getPatients(patient.hospitalId)
    const newPatient: Patient = {
      ...patient,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const allPatients = this.getData<Patient>(this.getStorageKey("patients", patient.hospitalId))
    allPatients.push(newPatient)
    this.setData(this.getStorageKey("patients", patient.hospitalId), allPatients)
    return newPatient
  }

  // Appointments
  async getAppointments(
    hospitalId: string,
    filters?: { date?: string; doctorId?: string; status?: string },
  ): Promise<Appointment[]> {
    let appointments = this.getData<Appointment>(this.getStorageKey("appointments", hospitalId))

    if (filters?.date) {
      const filterDate = new Date(filters.date).toDateString()
      appointments = appointments.filter((a) => new Date(a.appointmentDate).toDateString() === filterDate)
    }

    if (filters?.doctorId) {
      appointments = appointments.filter((a) => a.doctorId === filters.doctorId)
    }

    if (filters?.status) {
      appointments = appointments.filter((a) => a.status === filters.status)
    }

    return appointments
  }

  async createAppointment(appointment: Omit<Appointment, "_id">): Promise<Appointment> {
    const appointments = this.getData<Appointment>(this.getStorageKey("appointments", appointment.hospitalId))
    const newAppointment: Appointment = {
      ...appointment,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    appointments.push(newAppointment)
    this.setData(this.getStorageKey("appointments", appointment.hospitalId), appointments)
    return newAppointment
  }

  // Dashboard Stats
  async getDashboardStats(hospitalId: string) {
    const patients = await this.getPatients(hospitalId)
    const appointments = await this.getAppointments(hospitalId)
    const today = new Date().toDateString()
    const todayAppointments = appointments.filter((a) => new Date(a.appointmentDate).toDateString() === today)

    return {
      totalPatients: patients.total,
      todayAppointments: todayAppointments.length,
      totalAppointments: appointments.length,
      activePatients: patients.patients.filter((p) => p.isActive).length,
    }
  }
}

export const db = new DatabaseStorage()
