// RapidPro SMS Integration Service
export interface RapidProConfig {
  apiUrl: string
  apiToken: string
  enabled: boolean
}

export interface SMSMessage {
  to: string
  text: string
  from?: string
}

export interface Contact {
  uuid?: string
  name: string
  phone: string
  groups?: string[]
  fields?: Record<string, any>
}

export interface Flow {
  uuid: string
  name: string
  archived: boolean
  created_on: string
  modified_on: string
}

export class RapidProService {
  private config: RapidProConfig

  constructor(config: RapidProConfig) {
    this.config = config
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Token ${this.config.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`RapidPro API error: ${response.statusText}`)
    }

    return response.json()
  }

  // Send SMS message
  async sendSMS(message: SMSMessage): Promise<any> {
    return this.request("/broadcasts.json", {
      method: "POST",
      body: JSON.stringify({
        urns: [`tel:${message.to}`],
        text: message.text,
      }),
    })
  }

  // Send bulk SMS
  async sendBulkSMS(messages: SMSMessage[]): Promise<any> {
    const urns = messages.map((msg) => `tel:${msg.to}`)
    const text = messages[0].text // Assuming same message for all

    return this.request("/broadcasts.json", {
      method: "POST",
      body: JSON.stringify({
        urns,
        text,
      }),
    })
  }

  // Create or update contact
  async createContact(contact: Contact): Promise<any> {
    return this.request("/contacts.json", {
      method: "POST",
      body: JSON.stringify({
        name: contact.name,
        urns: [`tel:${contact.phone}`],
        groups: contact.groups || [],
        fields: contact.fields || {},
      }),
    })
  }

  // Get contact by phone
  async getContact(phone: string): Promise<any> {
    const response = await this.request(`/contacts.json?urn=tel:${phone}`)
    return response.results[0] || null
  }

  // Start flow for contact
  async startFlow(flowUuid: string, contactPhone: string, extra?: Record<string, any>): Promise<any> {
    return this.request("/flow_starts.json", {
      method: "POST",
      body: JSON.stringify({
        flow: flowUuid,
        urns: [`tel:${contactPhone}`],
        extra: extra || {},
      }),
    })
  }

  // Get flows
  async getFlows(): Promise<Flow[]> {
    const response = await this.request("/flows.json")
    return response.results
  }

  // Send appointment reminder
  async sendAppointmentReminder(patientPhone: string, appointmentDetails: any): Promise<any> {
    const message = `Dear ${appointmentDetails.patientName}, this is a reminder for your appointment with ${appointmentDetails.doctorName} on ${appointmentDetails.date} at ${appointmentDetails.time}. Please arrive 15 minutes early. Reply CONFIRM to confirm or RESCHEDULE to reschedule.`

    return this.sendSMS({
      to: patientPhone,
      text: message,
    })
  }

  // Send prescription reminder
  async sendPrescriptionReminder(patientPhone: string, prescriptionDetails: any): Promise<any> {
    const message = `Prescription Reminder: Please take your ${prescriptionDetails.medication} (${prescriptionDetails.dosage}) ${prescriptionDetails.frequency}. Contact us if you have any questions.`

    return this.sendSMS({
      to: patientPhone,
      text: message,
    })
  }

  // Send lab results notification
  async sendLabResultsNotification(patientPhone: string, patientName: string): Promise<any> {
    const message = `Dear ${patientName}, your lab results are ready. Please visit our hospital or patient portal to view your results. Contact us if you have any questions.`

    return this.sendSMS({
      to: patientPhone,
      text: message,
    })
  }

  // Send payment reminder
  async sendPaymentReminder(patientPhone: string, invoiceDetails: any): Promise<any> {
    const message = `Payment Reminder: Your invoice #${invoiceDetails.invoiceNumber} for $${invoiceDetails.amount} is due on ${invoiceDetails.dueDate}. Please visit our payment portal or contact us to make payment.`

    return this.sendSMS({
      to: patientPhone,
      text: message,
    })
  }
}
