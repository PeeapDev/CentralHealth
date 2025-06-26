export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: any;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  gender?: string;
  medicalId: string;
  healthAddress: string;
}

export function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult>;
