import React, { useState, useEffect } from 'react';
import { Template, LayoutType } from '../types';
import { StorageService } from '../services/storageService';
import { X, Trash2, LayoutTemplate, Plus, Save, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'select' | 'save';
  currentContent?: string;
  currentLayout?: LayoutType;
  onSelect?: (template: Template) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  currentContent, 
  currentLayout, 
  onSelect 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setTemplateName('');
      setTemplateDescription('');
    }
  }, [isOpen]);

  const loadTemplates = () => {
    setTemplates(StorageService.getTemplates());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !currentContent) return;

    // Duplicate check
    const isDuplicate = templates.some(t => t.name.toLowerCase() === templateName.trim().toLowerCase());
    if (isDuplicate) {
        alert("A template with this name already exists. Please choose a unique name.");
        return;
    }

    const newTemplate: Template = {
      id: uuidv4(),
      name: templateName.trim(),
      description: templateDescription.trim(),
      content: currentContent,
      layoutId: currentLayout || 'modern',
      createdAt: Date.now()
    };

    StorageService.saveTemplate(newTemplate);
    loadTemplates();
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this template?")) {
      StorageService.deleteTemplate(id);
      loadTemplates();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <LayoutTemplate size={20} className="text-blue-600" />
            {mode === 'save' ? 'Save as Template' : 'Select Template'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          
          {mode === 'save' && (
            <form onSubmit={handleSave} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name <span className="text-red-500">*</span></label>
                  <input 
                    autoFocus
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. Web Design Retainer"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                  <input 
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Briefly describe when to use this..."
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This will save the current document structure and content as a reusable template.
                  </p>
               </div>

               <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                  <button type="submit" disabled={!templateName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                     <Save size={16} /> Save Template
                  </button>
               </div>
            </form>
          )}

          {mode === 'select' && (
            <div className="space-y-3">
               {templates.length === 0 ? (
                 <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                    <FileText size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No templates saved yet.</p>
                    <p className="text-xs">Save a document as a template to see it here.</p>
                 </div>
               ) : (
                 templates.map(template => (
                   <div 
                      key={template.id} 
                      onClick={() => onSelect && onSelect(template)}
                      className="group flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md cursor-pointer transition-all"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <LayoutTemplate size={18} />
                         </div>
                         <div className="min-w-0">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{template.name}</h3>
                            {template.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{template.description}</p>
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Layout: {template.layoutId}</p>
                         </div>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(e, template.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Delete Template"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                 ))
               )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TemplateModal;