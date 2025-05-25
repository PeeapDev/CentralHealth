// FHIR Integration Service
export interface FHIRConfig {
  endpoint: string
  clientId: string
  clientSecret: string
  version: string
  enabled: boolean
}

export interface FHIRPatient {
  resourceType: "Patient"
  id?: string
  identifier?: Array<{
    use: string
    type: {
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }
    value: string
  }>
  active: boolean
  name: Array<{
    use: string
    family: string
    given: string[]
  }>
  telecom?: Array<{
    system: string
    value: string
    use: string
  }>
  gender: "male" | "female" | "other" | "unknown"
  birthDate: string
  address?: Array<{
    use: string
    line: string[]
    city: string
    state: string
    postalCode: string
    country: string
  }>
  contact?: Array<{
    relationship: Array<{
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }>
    name: {
      family: string
      given: string[]
    }
    telecom: Array<{
      system: string
      value: string
    }>
  }>
}

export interface FHIRObservation {
  resourceType: "Observation"
  id?: string
  status: "registered" | "preliminary" | "final" | "amended"
  category: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  code: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }
  subject: {
    reference: string
  }
  effectiveDateTime: string
  valueQuantity?: {
    value: number
    unit: string
    system: string
    code: string
  }
  valueString?: string
  component?: Array<{
    code: {
      coding: Array<{
        system: string
        code: string
        display: string
      }>
    }
    valueQuantity: {
      value: number
      unit: string
      system: string
      code: string
    }
  }>
}

export class FHIRService {
  private config: FHIRConfig
  private accessToken: string | null = null

  constructor(config: FHIRConfig) {
    this.config = config
  }

  // Get OAuth2 access token
  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const response = await fetch(`${this.config.endpoint}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: "system/*.read system/*.write",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get FHIR access token")
    }

    const data = await response.json()
    this.accessToken = data.access_token
    return this.accessToken
  }

  // Create or update patient in FHIR
  async syncPatient(patient: any): Promise<FHIRPatient> {
    const token = await this.getAccessToken()

    const fhirPatient: FHIRPatient = {
      resourceType: "Patient",
      identifier: [
        {
          use: "usual",
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR",
                display: "Medical Record Number",
              },
            ],
          },
          value: patient.patientId,
        },
      ],
      active: patient.isActive,
      name: [
        {
          use: "official",
          family: patient.lastName,
          given: [patient.firstName],
        },
      ],
      telecom: [
        {
          system: "phone",
          value: patient.contact.phone,
          use: "mobile",
        },
        ...(patient.contact.email
          ? [
              {
                system: "email",
                value: patient.contact.email,
                use: "home",
              },
            ]
          : []),
      ],
      gender: patient.gender,
      birthDate: patient.dateOfBirth,
      address: [
        {
          use: "home",
          line: [patient.contact.address.street],
          city: patient.contact.address.city,
          state: patient.contact.address.state,
          postalCode: patient.contact.address.zipCode,
          country: patient.contact.address.country,
        },
      ],
      contact: [
        {
          relationship: [
            {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                  code: "C",
                  display: "Emergency Contact",
                },
              ],
            },
          ],
          name: {
            family: patient.contact.emergencyContact.name.split(" ")[1] || "",
            given: [patient.contact.emergencyContact.name.split(" ")[0]],
          },
          telecom: [
            {
              system: "phone",
              value: patient.contact.emergencyContact.phone,
            },
          ],
        },
      ],
    }

    const response = await fetch(`${this.config.endpoint}/Patient`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/fhir+json",
      },
      body: JSON.stringify(fhirPatient),
    })

    if (!response.ok) {
      throw new Error("Failed to sync patient to FHIR")
    }

    return response.json()
  }

  // Create observation (vitals, lab results)
  async createObservation(patientId: string, observation: any): Promise<FHIRObservation> {
    const token = await this.getAccessToken()

    const fhirObservation: FHIRObservation = {
      resourceType: "Observation",
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: observation.code,
            display: observation.display,
          },
        ],
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: new Date().toISOString(),
      valueQuantity: observation.valueQuantity,
      component: observation.component,
    }

    const response = await fetch(`${this.config.endpoint}/Observation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/fhir+json",
      },
      body: JSON.stringify(fhirObservation),
    })

    if (!response.ok) {
      throw new Error("Failed to create FHIR observation")
    }

    return response.json()
  }

  // Search patients
  async searchPatients(query: string): Promise<FHIRPatient[]> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.config.endpoint}/Patient?name=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to search FHIR patients")
    }

    const bundle = await response.json()
    return bundle.entry?.map((entry: any) => entry.resource) || []
  }

  // Get patient by ID
  async getPatient(patientId: string): Promise<FHIRPatient> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.config.endpoint}/Patient/${patientId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/fhir+json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get FHIR patient")
    }

    return response.json()
  }
}
