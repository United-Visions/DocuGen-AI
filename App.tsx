import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Printer, 
  Settings as SettingsIcon, 
  Plus, 
  FileText, 
  History, 
  LayoutTemplate,
  ChevronLeft, 
  Loader2,
  Calendar,
  Trash2,
  Moon,
  Sun,
  Edit,
  Save,
  X,
  GitBranch,
  Users,
  ChevronDown,
  Copy,
  RectangleVertical,
  RectangleHorizontal,
  File as FileIcon,
  Share2,
  Download,
  Check,
  MonitorDown
} from 'lucide-react';
import MarkdownPreview from './components/MarkdownPreview';
import SettingsModal from './components/SettingsModal';
import ClientManagerModal from './components/ClientManagerModal';
import TemplateModal from './components/TemplateModal';
import { GeminiService } from './services/geminiService';
import { StorageService } from './services/storageService';
import { Invoice, UserProfile, LayoutType, InvoiceVersion, Client, Template } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // State
  const [profile, setProfile] = useState<UserProfile>(StorageService.getProfile());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  
  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'select' | 'save'>('select');
  
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('modern');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(StorageService.getTheme());
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');

  // PDF Export State
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Share Menu State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Load Initial Data
  useEffect(() => {
    setInvoices(StorageService.getInvoices());
    setClients(StorageService.getClients());
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  // Click outside listener for Share Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setIsShareOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Refresh Clients when modal updates
  const handleClientUpdate = () => {
    setClients(StorageService.getClients());
  };

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    StorageService.saveTheme(newTheme);
  };

  // Handle Generate
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const history = StorageService.getContextInvoices();
      const selectedClient = clients.find(c => c.id === selectedClientId) || null;
      
      // Calculate Due Date based on terms
      const dueDateTimestamp = StorageService.calculateDueDate(profile.defaultPaymentTerms);
      const formattedDueDate = new Date(dueDateTimestamp).toLocaleDateString('en-US', {
         year: 'numeric', month: 'long', day: 'numeric'
      });

      if (currentInvoice) {
        // --- UPDATE EXISTING INVOICE (New Version) ---
        const result = await GeminiService.generateInvoice(
          prompt, 
          profile, 
          history, 
          currentInvoice.invoiceNumber,
          currentInvoice.markdownContent,
          null,
          formattedDueDate
        );

        const newVersion: InvoiceVersion = {
          id: uuidv4(),
          createdAt: Date.now(),
          markdownContent: result.markdown,
          layoutId: currentLayout,
          summary: prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt
        };

        const updatedInvoice: Invoice = {
          ...currentInvoice,
          markdownContent: result.markdown,
          summary: result.summary,
          layoutId: currentLayout,
          versions: [newVersion, ...currentInvoice.versions] 
        };

        StorageService.updateInvoice(updatedInvoice);
        setInvoices(StorageService.getInvoices());
        setCurrentInvoice(updatedInvoice);
        if (isEditing) setEditedMarkdown(result.markdown);

      } else {
        // --- CREATE NEW INVOICE ---
        const nextInvNum = StorageService.getNextInvoiceNumber(profile.invoiceNumberFormat);
        
        const result = await GeminiService.generateInvoice(
            prompt, 
            profile, 
            history, 
            nextInvNum, 
            undefined, 
            selectedClient,
            formattedDueDate
        );
        StorageService.incrementSequence();

        const initialVersion: InvoiceVersion = {
          id: uuidv4(),
          createdAt: Date.now(),
          markdownContent: result.markdown,
          layoutId: currentLayout,
          summary: "Initial Draft"
        };

        const newInvoice: Invoice = {
          id: uuidv4(),
          invoiceNumber: nextInvNum,
          createdAt: Date.now(),
          dueDate: dueDateTimestamp,
          markdownContent: result.markdown,
          clientName: result.clientName,
          summary: result.summary,
          layoutId: currentLayout,
          versions: [initialVersion]
        };

        StorageService.saveInvoice(newInvoice);
        setInvoices(StorageService.getInvoices());
        setCurrentInvoice(newInvoice);
      }
      
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("Error generating invoice. Please check your API key or connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Delete Invoice
  const handleDeleteInvoice = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      StorageService.deleteInvoice(id);
      setInvoices(StorageService.getInvoices());
      if (currentInvoice?.id === id) {
        handleNew();
      }
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
    setIsShareOpen(false);
  };

  // Handle Download Markdown
  const handleDownloadMarkdown = () => {
    if (!currentInvoice) return;
    const blob = new Blob([currentInvoice.markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${currentInvoice.invoiceNumber}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsShareOpen(false);
  };

  // Handle Native Share
  const handleNativeShare = async () => {
    if (!currentInvoice) return;
    
    try {
      // First try to share as a file (preferred for Drive/saving)
      const file = new File([currentInvoice.markdownContent], `Invoice-${currentInvoice.invoiceNumber}.md`, { type: 'text/markdown' });
      
      const shareData = {
        files: [file],
        title: `Invoice ${currentInvoice.invoiceNumber}`,
        text: `Invoice for ${currentInvoice.clientName}`
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        throw new Error("File sharing not supported or permission denied");
      }
    } catch (err) {
      console.warn("File sharing failed, falling back to text sharing:", err);
      
      // Fallback: Share just the text content
      try {
        if (navigator.share) {
            await navigator.share({
                title: `Invoice ${currentInvoice.invoiceNumber}`,
                text: currentInvoice.markdownContent
            });
        } else {
            alert("Sharing is not supported on this device/browser.");
        }
      } catch (textErr) {
          console.error("Text sharing failed:", textErr);
      }
    }
    
    setIsShareOpen(false);
  };

  // Handle Copy
  const handleCopyText = async () => {
     if (!currentInvoice) return;
     try {
         await navigator.clipboard.writeText(currentInvoice.markdownContent);
         setCopyFeedback(true);
         setTimeout(() => setCopyFeedback(false), 2000);
     } catch (err) {
         console.error("Failed to copy", err);
     }
  };

  // New Invoice Reset
  const handleNew = () => {
    setCurrentInvoice(null);
    setPrompt('');
    setIsEditing(false);
    setEditedMarkdown('');
    setSelectedClientId('');
  };

  // Load old invoice
  const handleSelectInvoice = (inv: Invoice) => {
    setCurrentInvoice(inv);
    setCurrentLayout(inv.layoutId);
    setIsEditing(false);
    setEditedMarkdown(inv.markdownContent);
  };

  const handleRestoreVersion = (version: InvoiceVersion) => {
    if (!currentInvoice) return;
    const tempInvoice = {
        ...currentInvoice,
        markdownContent: version.markdownContent,
        layoutId: version.layoutId
    };
    setCurrentInvoice(tempInvoice);
    setEditedMarkdown(version.markdownContent);
    setCurrentLayout(version.layoutId);
  };

  const handleSaveEdit = () => {
    if (!currentInvoice) return;

    const newVersion: InvoiceVersion = {
      id: uuidv4(),
      createdAt: Date.now(),
      markdownContent: editedMarkdown,
      layoutId: currentLayout,
      summary: "Manual Edit"
    };

    const updatedInvoice: Invoice = {
      ...currentInvoice,
      markdownContent: editedMarkdown,
      layoutId: currentLayout,
      versions: [newVersion, ...currentInvoice.versions]
    };

    StorageService.updateInvoice(updatedInvoice);
    setInvoices(StorageService.getInvoices());
    setCurrentInvoice(updatedInvoice);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (currentInvoice) {
      setEditedMarkdown(currentInvoice.markdownContent);
    }
    setIsEditing(false);
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setCurrentLayout(layout);
  };

  // Template Handlers
  const openSaveTemplateModal = () => {
    setTemplateModalMode('save');
    setIsTemplateModalOpen(true);
  };

  const openSelectTemplateModal = () => {
    setTemplateModalMode('select');
    setIsTemplateModalOpen(true);
  };

  const handleSelectTemplate = (template: Template) => {
    // Instantiate new invoice from template
    const nextInvNum = StorageService.getNextInvoiceNumber(profile.invoiceNumberFormat);
    StorageService.incrementSequence();
    
    // Calculate due date
    const dueDateTimestamp = StorageService.calculateDueDate(profile.defaultPaymentTerms);

    const initialVersion: InvoiceVersion = {
      id: uuidv4(),
      createdAt: Date.now(),
      markdownContent: template.content,
      layoutId: template.layoutId,
      summary: "Created from Template: " + template.name
    };

    const newInvoice: Invoice = {
      id: uuidv4(),
      invoiceNumber: nextInvNum,
      createdAt: Date.now(),
      dueDate: dueDateTimestamp,
      markdownContent: template.content,
      clientName: "New Client", // Placeholder until edited
      summary: "Draft from " + template.name,
      layoutId: template.layoutId,
      versions: [initialVersion]
    };

    StorageService.saveInvoice(newInvoice);
    setInvoices(StorageService.getInvoices());
    setCurrentInvoice(newInvoice);
    setCurrentLayout(template.layoutId);
    
    // Automatically enter edit mode so user can customize
    setIsEditing(true);
    setEditedMarkdown(template.content);
    
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden transition-colors">
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out relative no-print overflow-hidden`}
      >
        <div className="w-80 h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10 transition-colors">
            <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                 <FileText size={18} />
               </div>
               <span>DocuGen AI</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Toggle Theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setIsClientManagerOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Manage Clients">
                <Users size={18} />
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" title="Settings">
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <button 
              onClick={handleNew}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm font-medium"
            >
              <Plus size={18} /> New Document
            </button>
            
            {/* INSTALL APP BUTTON (Only visible if prompt available) */}
            {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium animate-pulse"
              >
                <MonitorDown size={16} /> Install App
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-1">
              <History size={12} /> Recent Invoices
            </h3>
            <div className="space-y-2">
              {invoices.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-8">No invoices yet.</p>
              )}
              {invoices.map(inv => (
                <div key={inv.id} className="group/item">
                  <div 
                    onClick={() => handleSelectInvoice(inv)}
                    className={`p-3 rounded-lg cursor-pointer border transition-all relative ${currentInvoice?.id === inv.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/50' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {inv.invoiceNumber || 'INV-Old'}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="font-medium text-gray-700 dark:text-gray-200 text-sm truncate mb-0.5 pr-6">{inv.clientName}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{inv.summary}</p>
                    
                    {/* Delete Button */}
                    <button 
                      onClick={(e) => handleDeleteInvoice(e, inv.id)}
                      className="absolute right-2 top-10 opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                      title="Delete Invoice"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {/* Version History */}
                  {currentInvoice?.id === inv.id && inv.versions && inv.versions.length > 0 && (
                    <div className="ml-3 pl-3 border-l-2 border-gray-100 dark:border-gray-800 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-300">
                      {inv.versions.map((version, idx) => (
                        <div 
                          key={version.id}
                          onClick={(e) => { e.stopPropagation(); handleRestoreVersion(version); }}
                          className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-xs group/version transition-colors"
                        >
                          <GitBranch size={12} className="mt-0.5 text-gray-400 dark:text-gray-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-gray-500 dark:text-gray-400">
                              <span className="font-medium">v{inv.versions.length - idx}</span>
                              <span className="text-[10px] opacity-70">{new Date(version.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="truncate text-gray-400 dark:text-gray-500 text-[10px]">{version.summary}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 transition-colors">
             <p className="font-medium text-gray-700 dark:text-gray-300">{profile.businessName}</p>
             <p className="truncate text-gray-400 dark:text-gray-500">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-4 top-4 z-20 p-2 bg-white dark:bg-gray-800 shadow-md rounded-full border dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-print transition-transform active:scale-95"
          title="Toggle Sidebar"
        >
          <ChevronLeft size={20} className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Toolbar (Viewing Mode) */}
        {currentInvoice && (
          <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 pl-16 no-print z-10 shrink-0 transition-colors">
             <div className="flex items-center gap-4">
               {/* Layout */}
               <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <LayoutTemplate size={16} className="ml-2" />
                  <select 
                    value={currentLayout}
                    onChange={(e) => handleLayoutChange(e.target.value as LayoutType)}
                    className="bg-transparent border-none focus:ring-0 text-sm py-1 pr-8 pl-1 cursor-pointer text-gray-700 dark:text-gray-200"
                  >
                    <option value="modern" className="dark:bg-gray-800">Modern Layout</option>
                    <option value="classic" className="dark:bg-gray-800">Classic Serif</option>
                    <option value="bold" className="dark:bg-gray-800">Bold & Dark</option>
                    <option value="clean" className="dark:bg-gray-800">Clean Mono</option>
                  </select>
               </div>

               {/* Paper Settings */}
               <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border-l border-gray-200 dark:border-gray-700 ml-2">
                   <div className="flex items-center gap-1 pl-2">
                     <FileIcon size={14} className="text-gray-500" />
                     <select 
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as any)}
                        className="bg-transparent border-none focus:ring-0 text-sm py-1 pr-4 pl-1 cursor-pointer text-gray-700 dark:text-gray-200"
                     >
                         <option value="a4" className="dark:bg-gray-800">A4</option>
                         <option value="letter" className="dark:bg-gray-800">Letter</option>
                     </select>
                   </div>
                   <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                   <div className="flex items-center gap-1">
                     {orientation === 'portrait' ? <RectangleVertical size={14} className="text-gray-500" /> : <RectangleHorizontal size={14} className="text-gray-500" />}
                     <select 
                        value={orientation}
                        onChange={(e) => setOrientation(e.target.value as any)}
                        className="bg-transparent border-none focus:ring-0 text-sm py-1 pr-4 pl-1 cursor-pointer text-gray-700 dark:text-gray-200"
                     >
                         <option value="portrait" className="dark:bg-gray-800">Portrait</option>
                         <option value="landscape" className="dark:bg-gray-800">Landscape</option>
                     </select>
                   </div>
               </div>
               
               <div className="hidden md:flex text-sm text-gray-400 items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-4 ml-2">
                  <Calendar size={14} />
                  <span>{new Date(currentInvoice.createdAt).toLocaleDateString()}</span>
               </div>
             </div>

             <div className="flex items-center gap-2">
               {!isEditing ? (
                 <>
                   <button 
                     onClick={() => { setIsEditing(true); setEditedMarkdown(currentInvoice.markdownContent); }}
                     className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
                   >
                     <Edit size={16} /> Edit
                   </button>
                   
                   {/* SHARE / EXPORT DROPDOWN */}
                   <div className="relative" ref={shareMenuRef}>
                     <button 
                       onClick={() => setIsShareOpen(!isShareOpen)}
                       className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors shadow-sm active:scale-95 text-sm"
                     >
                       <Share2 size={16} /> Share / Export
                       <ChevronDown size={14} className={`transition-transform duration-200 ${isShareOpen ? 'rotate-180' : ''}`} />
                     </button>
                     
                     {isShareOpen && (
                       <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="p-1">
                             <button 
                                onClick={handlePrint}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                             >
                                <Printer size={16} className="text-gray-500 dark:text-gray-400" />
                                <div>
                                   <span className="block font-medium">Print / Save PDF</span>
                                   <span className="text-[10px] text-gray-400">Use system dialog</span>
                                </div>
                             </button>

                             <button 
                                onClick={handleNativeShare}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                             >
                                <Share2 size={16} className="text-blue-500" />
                                <div>
                                   <span className="block font-medium">Native Share</span>
                                   <span className="text-[10px] text-gray-400">Drive, Email, Airdrop</span>
                                </div>
                             </button>

                             <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>

                             <button 
                                onClick={handleDownloadMarkdown}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                             >
                                <Download size={16} className="text-gray-500 dark:text-gray-400" />
                                <span>Download Markdown</span>
                             </button>

                             <button 
                                onClick={handleCopyText}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                             >
                                {copyFeedback ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500 dark:text-gray-400" />}
                                <span>{copyFeedback ? 'Copied!' : 'Copy to Clipboard'}</span>
                             </button>
                          </div>
                       </div>
                     )}
                   </div>
                 </>
               ) : (
                 <>
                   <button 
                     onClick={openSaveTemplateModal}
                     className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors text-sm font-medium"
                     title="Save current structure as a reusable template"
                   >
                     <Copy size={16} /> Save as Template
                   </button>
                   <button 
                     onClick={handleCancelEdit}
                     className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
                   >
                     <X size={16} /> Cancel
                   </button>
                   <button 
                     onClick={handleSaveEdit}
                     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm active:scale-95 text-sm"
                   >
                     <Save size={16} /> Save Changes
                   </button>
                 </>
               )}
             </div>
          </div>
        )}

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-4 md:p-8 relative scroll-smooth transition-colors" id="printable-area">
          {!currentInvoice ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8 no-print px-4">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 animate-pulse">
                <FileText size={40} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">New Invoice Generation</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Describe your invoice details. I'll automatically apply your settings, increment the invoice number, and format it perfectly.
                </p>
              </div>
              
              <div className="w-full relative shadow-xl rounded-2xl bg-white dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 group focus-within:ring-2 ring-blue-100 dark:ring-blue-900 transition-all">
                {/* Client Selection in Prompt Area */}
                {clients.length > 0 && (
                  <div className="absolute top-4 right-4 z-10">
                     <div className="relative group/dropdown">
                        <select 
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="">No Client Selected</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                  </div>
                )}
                
                {/* Template Button */}
                <button 
                    onClick={openSelectTemplateModal}
                    className="absolute top-4 left-4 z-10 px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 flex items-center gap-1 transition-colors"
                >
                    <LayoutTemplate size={12} /> Browse Templates
                </button>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Invoice to TechStart Inc for UI Design, 20 hours at $100/hr. Include a discount of $200."
                  className="w-full p-6 pt-14 pr-16 h-48 resize-none outline-none text-gray-800 dark:text-gray-100 text-lg placeholder:text-gray-300 dark:placeholder:text-gray-600 bg-white dark:bg-gray-800 transition-colors"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-white rounded-xl transition-all shadow-md active:scale-95"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 flex justify-center h-full">
               {/* Editor View */}
               <div className={`${isEditing ? 'block' : 'hidden'} print:hidden w-full max-w-[210mm] mx-auto h-full`}>
                 <textarea
                   value={editedMarkdown}
                   onChange={(e) => setEditedMarkdown(e.target.value)}
                   className="w-full h-full p-8 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-sm border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                 />
               </div>

               {/* Preview View (and Print View) */}
               <div className={`${isEditing ? 'hidden' : 'block'} print:block w-full`}>
                  <MarkdownPreview 
                    content={isEditing ? editedMarkdown : currentInvoice.markdownContent} 
                    layout={currentLayout}
                    profile={profile}
                    invoiceNumber={currentInvoice.invoiceNumber}
                    createdAt={currentInvoice.createdAt}
                    dueDate={currentInvoice.dueDate}
                    paperSize={paperSize}
                    orientation={orientation}
                  />
               </div>
               
               {/* Quick Prompt for edits (Only show if NOT editing) */}
               {!isEditing && (
                 <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg no-print px-4 z-50">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-2 pl-5 ring-1 ring-black/5 dark:ring-white/10 transition-colors">
                      <input 
                        type="text" 
                        placeholder="Ask AI for changes..."
                        className="flex-1 outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 bg-transparent"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                      />
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="p-2.5 bg-blue-600 rounded-full text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      </button>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onUpdate={setProfile} 
      />
      
      <ClientManagerModal 
        isOpen={isClientManagerOpen}
        onClose={() => setIsClientManagerOpen(false)}
        onUpdate={handleClientUpdate}
      />
      
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        mode={templateModalMode}
        currentContent={isEditing ? editedMarkdown : (currentInvoice?.markdownContent)}
        currentLayout={currentLayout}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
};

export default App;