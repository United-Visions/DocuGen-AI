import { Invoice, UserProfile, DEFAULT_PROFILE, InvoiceVersion, Client } from '../types';
import { v4 as uuidv4 } from 'uuid';

const KEYS = {
  PROFILE: 'docugen_profile',
  INVOICES: 'docugen_invoices',
  CLIENTS: 'docugen_clients',
  SEQUENCE: 'docugen_sequence',
  THEME: 'docugen_theme'
};

export const StorageService = {
  getProfile: (): UserProfile => {
    const stored = localStorage.getItem(KEYS.PROFILE);
    if (!stored) return DEFAULT_PROFILE;
    
    // Merge with default to ensure new fields exist
    return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
  },

  saveProfile: (profile: UserProfile): void => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getInvoices: (): Invoice[] => {
    const stored = localStorage.getItem(KEYS.INVOICES);
    if (!stored) return [];
    
    const invoices: Invoice[] = JSON.parse(stored);
    
    // Migration: Ensure all invoices have a versions array
    return invoices.map(inv => {
      if (!inv.versions) {
        return {
          ...inv,
          versions: [{
            id: uuidv4(),
            createdAt: inv.createdAt,
            markdownContent: inv.markdownContent,
            layoutId: inv.layoutId || 'modern',
            summary: "Initial Version"
          }]
        };
      }
      return inv;
    });
  },

  saveInvoice: (invoice: Invoice): void => {
    const invoices = StorageService.getInvoices();
    // Prepend new invoice
    const updated = [invoice, ...invoices];
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
  },

  updateInvoice: (updatedInvoice: Invoice): void => {
    const invoices = StorageService.getInvoices();
    const index = invoices.findIndex(inv => inv.id === updatedInvoice.id);
    if (index !== -1) {
      invoices[index] = updatedInvoice;
      localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
    }
  },

  deleteInvoice: (id: string): void => {
    const invoices = StorageService.getInvoices();
    const updated = invoices.filter(inv => inv.id !== id);
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
  },
  
  // Client Management
  getClients: (): Client[] => {
    const stored = localStorage.getItem(KEYS.CLIENTS);
    return stored ? JSON.parse(stored) : [];
  },

  saveClient: (client: Client): void => {
    const clients = StorageService.getClients();
    const existingIndex = clients.findIndex(c => c.id === client.id);
    
    if (existingIndex >= 0) {
      clients[existingIndex] = client;
    } else {
      clients.push(client);
    }
    
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },

  deleteClient: (id: string): void => {
    const clients = StorageService.getClients();
    const updated = clients.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(updated));
  },

  // Get context for AI (last 3 invoices)
  getContextInvoices: (): Invoice[] => {
    return StorageService.getInvoices().slice(0, 3);
  },

  // Invoice Sequence Management
  getNextInvoiceNumber: (): string => {
    const seq = localStorage.getItem(KEYS.SEQUENCE);
    const num = seq ? parseInt(seq, 10) : 1;
    return `INV-${String(num).padStart(4, '0')}`;
  },

  incrementSequence: (): void => {
    const seq = localStorage.getItem(KEYS.SEQUENCE);
    const num = seq ? parseInt(seq, 10) : 1;
    localStorage.setItem(KEYS.SEQUENCE, (num + 1).toString());
  },

  // Theme Management
  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light';
  },

  saveTheme: (theme: 'light' | 'dark'): void => {
    localStorage.setItem(KEYS.THEME, theme);
  }
};