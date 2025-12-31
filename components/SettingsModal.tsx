import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { X, Save, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (profile: UserProfile) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<UserProfile>(StorageService.getProfile());

  useEffect(() => {
    if (isOpen) {
      setFormData(StorageService.getProfile());
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveProfile(formData);
    onUpdate(formData);
    onClose();
  };

  const getInitials = () => {
     const name = formData.businessName || formData.ownerName || "Docu Gen";
     return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (!isOpen) return null;

  const inputClass = "w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Business Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Business Name (Main)</label>
              <input 
                name="businessName" 
                value={formData.businessName} 
                onChange={handleChange}
                placeholder="e.g. Acme Corp"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Owner Name</label>
              <input 
                name="ownerName" 
                value={formData.ownerName} 
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Website URL</label>
              <input 
                name="websiteUrl" 
                value={formData.websiteUrl || ''} 
                onChange={handleChange}
                placeholder="www.yourbusiness.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Business Address</label>
            <textarea 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              rows={2}
              className={inputClass}
            />
          </div>

          {/* Logo Section */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
             <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">Logo Settings</h3>
             
             <div className="flex items-start gap-6">
                <div className="flex-1 space-y-3">
                    <div>
                        <label className={labelClass}>Logo Image URL</label>
                        <input 
                        name="logoUrl" 
                        value={formData.logoUrl} 
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png"
                        className={inputClass}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to use generated text logo below.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Logo Background</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    name="logoBackgroundColor"
                                    value={formData.logoBackgroundColor || "#2563eb"}
                                    onChange={handleChange}
                                    className="w-10 h-10 rounded border-none cursor-pointer"
                                />
                                <input 
                                    type="text" 
                                    name="logoBackgroundColor"
                                    value={formData.logoBackgroundColor || "#2563eb"}
                                    onChange={handleChange}
                                    className={`${inputClass} !w-full`}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Logo Text Color</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    name="logoTextColor"
                                    value={formData.logoTextColor || "#ffffff"}
                                    onChange={handleChange}
                                    className="w-10 h-10 rounded border-none cursor-pointer"
                                />
                                <input 
                                    type="text" 
                                    name="logoTextColor"
                                    value={formData.logoTextColor || "#ffffff"}
                                    onChange={handleChange}
                                    className={`${inputClass} !w-full`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Preview</span>
                    {formData.logoUrl ? (
                        <img 
                            src={formData.logoUrl} 
                            alt="Logo Preview" 
                            className="h-20 w-20 object-contain border rounded bg-white" 
                        />
                    ) : (
                        <div 
                            className="h-20 w-20 flex items-center justify-center rounded-lg shadow-sm text-2xl font-bold"
                            style={{ 
                                backgroundColor: formData.logoBackgroundColor || '#2563eb', 
                                color: formData.logoTextColor || '#ffffff' 
                            }}
                        >
                            {getInitials()}
                        </div>
                    )}
                </div>
             </div>
          </div>

          <div>
            <label className={labelClass}>Default Client Address (Optional)</label>
            <textarea 
              name="defaultClientAddress" 
              value={formData.defaultClientAddress || ''} 
              onChange={handleChange}
              placeholder="Enter a default client address if you often bill the same client..."
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className={labelClass}>Default Payment Terms</label>
                <input 
                  name="defaultPaymentTerms" 
                  value={formData.defaultPaymentTerms || ''} 
                  onChange={handleChange}
                  placeholder="e.g. Net 30, Due on Receipt"
                  className={inputClass}
                />
             </div>
          </div>

          <div>
            <label className={labelClass}>Payment Details (Bank Info)</label>
            <textarea 
              name="paymentDetails" 
              value={formData.paymentDetails} 
              onChange={handleChange}
              rows={4}
              className={`${inputClass} font-mono text-sm`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Save size={18} /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;