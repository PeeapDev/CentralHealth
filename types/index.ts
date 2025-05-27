export interface Hospital {
  id: string;
  name: string;
  subdomain: string;
  admin_email: string;
  admin_password: string;
  email: string;
  phone: string;
  address: string;
  website?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  package: 'Basic' | 'Premium';
  modules: string[];
  createdAt: Date;
  updatedAt: Date;
  logo?: string;
  branches?: number;
  lastLogin?: string;
}

export interface FormData extends Omit<Hospital, 'id' | 'createdAt' | 'updatedAt'> {
  package: 'Basic' | 'Premium';
}
