export interface UserProfile {
  businessName: string;
  ownerName: string;
  address: string;
  email: string;
  phone: string;
  websiteUrl?: string;
  logoUrl: string;
  logoBackgroundColor?: string;
  logoTextColor?: string;
  paymentDetails: string;
  defaultPaymentTerms?: string;
  defaultClientAddress?: string;
  currency: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  notes?: string;
}

export interface InvoiceVersion {
  id: string;
  createdAt: number;
  markdownContent: string;
  layoutId: LayoutType;
  summary: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: number;
  clientName: string;
  summary: string; // Summary of the latest version
  markdownContent: string; // Content of the latest version
  layoutId: LayoutType; // Layout of the latest version
  versions: InvoiceVersion[]; // History
}

export type LayoutType = 'clean' | 'modern' | 'classic' | 'bold';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const DEFAULT_PROFILE: UserProfile = {
  businessName: "Acme Corp",
  ownerName: "John Doe",
  address: "123 Innovation Dr, Tech City, CA",
  email: "billing@acmecorp.com",
  phone: "+1 (555) 0123",
  websiteUrl: "www.acmecorp.com",
  logoUrl: "https://picsum.photos/100/100", // Placeholder
  logoBackgroundColor: "#2563eb",
  logoTextColor: "#ffffff",
  paymentDetails: "Bank: USBank\nAccount: 123456789\nRouting: 987654321",
  defaultPaymentTerms: "Net 30",
  defaultClientAddress: "",
  currency: "USD"
};