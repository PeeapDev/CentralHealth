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
    const hospitals = this.getData<Hospital>("hospitals");
    
    // Auto-initialize demo hospital data if none exists
    if (hospitals.length === 0) {
      console.log('No hospitals found, initializing demo hospitals');
      const demoHospitals: Hospital[] = [
        {
          _id: '1',
          name: 'Central Hospital',
          slug: 'central',
          subdomain: 'central',
          admin_email: 'admin@central.com',
          contact: {
            email: 'info@central.com',
            phone: '+1-555-123-4567',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA',
            }
          },
          subscription: {
            package: 'enterprise',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            maxUsers: 50,
            maxPatients: 5000,
            features: ['all']
          },
          settings: {
            timezone: 'America/New_York',
            currency: 'USD',
            language: 'en',
            branches: [{
              name: 'Main Branch',
              address: {location: '123 Main St'},
              phone: '+1-555-123-4567',
              isMain: true
            }],
            modules: [{
              name: 'all',
              enabled: true,
              config: {}
            }]
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        {
          _id: '2',
          name: 'Memorial Hospital',
          slug: 'memorial',
          subdomain: 'memorial',
          admin_email: 'admin@memorial.com',
          contact: {
            email: 'info@memorial.com',
            phone: '+1-555-456-7890',
            address: {
              street: '456 Park Ave',
              city: 'Boston',
              state: 'MA',
              zipCode: '02108',
              country: 'USA',
            }
          },
          subscription: {
            package: 'standard',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            maxUsers: 20,
            maxPatients: 2000,
            features: ['basic', 'standard']
          },
          settings: {
            timezone: 'America/New_York',
            currency: 'USD',
            language: 'en',
            branches: [{
              name: 'Main Branch',
              address: {location: '456 Park Ave'},
              phone: '+1-555-456-7890',
              isMain: true
            }],
            modules: [{
              name: 'all',
              enabled: true,
              config: {}
            }]
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
        {
          _id: '3',
          name: 'Community Medical Center',
          slug: 'community',
          subdomain: 'community',
          admin_email: 'admin@community.com',
          contact: {
            email: 'info@community.com',
            phone: '+1-555-789-0123',
            address: {
              street: '789 Oak St',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60007',
              country: 'USA',
            }
          },
          subscription: {
            package: 'basic',
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            maxUsers: 10,
            maxPatients: 1000,
            features: ['basic']
          },
          settings: {
            timezone: 'America/Chicago',
            currency: 'USD',
            language: 'en',
            branches: [{
              name: 'Main Branch',
              address: {location: '789 Oak St'},
              phone: '+1-555-789-0123',
              isMain: true
            }],
            modules: [{
              name: 'all',
              enabled: true,
              config: {}
            }]
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        },
      ];
      
      // Save demo hospitals
      this.setData('hospitals', demoHospitals);
      return demoHospitals;
    }
    
    return hospitals;
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
    const users = this.getData<User>(this.getStorageKey("users", hospitalId));
    
    // Auto-initialize demo admin user if no users exist for this hospital
    if (users.length === 0) {
      console.log(`No users found for hospital ${hospitalId}, initializing demo admin user`);
      
      // Get hospital info for email
      const hospitals = await this.getHospitals();
      const hospital = hospitals.find(h => h._id === hospitalId || h.slug === hospitalId);
      
      if (hospital) {
        const demoAdmin: User = {
          _id: `admin-${hospitalId}`,
          hospitalId: hospitalId,
          firstName: 'Admin',
          lastName: 'User',
          email: hospital.admin_email || `admin@${hospital.slug}.com`,
          password: '$2a$10$rRsdM7NaOhC3jm5tQB9pAu88nNhKTGJnYqQGQD.SlzTYIdbIEeDpq', // bcrypt hash for 'admin123'
          role: 'admin',
          permissions: ['all'],
          profile: {
            employeeId: 'EMP001',
          },
          isActive: true,
          isVerified: true,
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save demo admin user
        this.setData(this.getStorageKey("users", hospitalId), [demoAdmin]);
        return [demoAdmin];
      }
    }
    
    return users;
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
