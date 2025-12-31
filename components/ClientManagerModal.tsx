import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { StorageService } from '../services/storageService';
import { X, Plus, Trash2, Edit2, User, Save, ChevronLeft, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ClientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Trigger parent refresh
}

const ClientManagerModal: React.FC<ClientManagerModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState<Client>({
    id: '',
    name: '',
    email: '',
    address: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
      setView('list');
    }
  }, [isOpen]);

  const loadClients = () => {
    setClients(StorageService.getClients());
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setFormData({
      id: uuidv4(),
      name: '',
      email: '',
      address: '',
      phone: '',
      notes: ''
    });
    setView('form');
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setView('form');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this client?")) {
      StorageService.deleteClient(id);
      loadClients();
      onUpdate();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    StorageService.saveClient(formData);
    loadClients();
    onUpdate();
    setView('list');
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const inputClass = "w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col transition-colors overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            {view === 'form' && (
                <button onClick={() => setView('list')} className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
            )}
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {view === 'list' ? 'Manage Clients' : (editingClient ? 'Edit Client' : 'Add New Client')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* LIST VIEW */}
            {view === 'list' && (
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b dark:border-gray-700 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button 
                            onClick={handleAddNew}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium shrink-0"
                        >
                            <Plus size={18} /> Add Client
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredClients.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                                <User size={48} className="mx-auto mb-3 opacity-20" />
                                <p>No clients found. Add one to get started.</p>
                            </div>
                        ) : (
                            filteredClients.map(client => (
                                <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{client.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{client.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEdit(client)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(client.id)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* FORM VIEW */}
            {view === 'form' && (
                <div className="p-6 overflow-y-auto h-full">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Client Name *</label>
                                <input 
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className={inputClass}
                                    placeholder="Company or Person Name"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email Address</label>
                                <input 
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className={inputClass}
                                    placeholder="billing@client.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Billing Address</label>
                            <textarea 
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                className={inputClass}
                                rows={3}
                                placeholder="Street, City, Zip, Country"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Phone Number</label>
                                <input 
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                    className={inputClass}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Private Notes (Not on Invoice)</label>
                            <textarea 
                                value={formData.notes}
                                onChange={e => setFormData({...formData, notes: e.target.value})}
                                className={inputClass}
                                rows={2}
                                placeholder="Internal reference codes, contact person names, etc."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                             <button 
                                type="button" 
                                onClick={() => setView('list')}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                             </button>
                             <button 
                                type="submit" 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                             >
                                <Save size={18} /> Save Client
                             </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ClientManagerModal;