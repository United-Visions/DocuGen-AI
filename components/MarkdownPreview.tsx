import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LayoutType, UserProfile } from '../types';

interface MarkdownPreviewProps {
  content: string;
  layout: LayoutType;
  profile: UserProfile;
  invoiceNumber?: string;
  createdAt?: number;
  dueDate?: number;
  paperSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  content, 
  layout, 
  profile, 
  invoiceNumber, 
  createdAt, 
  dueDate,
  paperSize = 'a4',
  orientation = 'portrait'
}) => {
  
  // Dimensions map
  const getDimensions = () => {
    if (paperSize === 'a4') {
        return orientation === 'portrait' 
            ? "max-w-[210mm] min-h-[297mm]" 
            : "max-w-[297mm] min-h-[210mm]";
    } else { // Letter
        return orientation === 'portrait' 
            ? "max-w-[216mm] min-h-[279mm]" 
            : "max-w-[279mm] min-h-[216mm]";
    }
  };

  // Layout specific wrapper classes
  const getLayoutClasses = () => {
    const dims = getDimensions();
    const common = `${dims} mx-auto shadow-lg print:shadow-none print:m-0 print:p-8 print:w-full print:max-w-none print:min-h-0`;
    
    switch (layout) {
      case 'modern':
        return `font-sans text-slate-700 bg-white p-12 ${common}`;
      case 'classic':
        return `font-serif text-gray-900 bg-white p-12 border-t-8 border-gray-900 ${common}`;
      case 'bold':
        return `font-sans text-slate-900 bg-slate-50 p-12 print:bg-white ${common}`;
      case 'clean':
      default:
        return `font-mono text-sm text-gray-600 bg-white p-12 ${common}`;
    }
  };

  const getDisplayName = () => {
    return profile.businessName || profile.ownerName || "Business Name";
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Custom components for ReactMarkdown to inject styles based on layout
  const components = {
    h1: ({node, ...props}: any) => {
      const base = "text-4xl font-bold mb-6 pb-2 border-b";
      if (layout === 'modern') return <h1 className={`${base} text-blue-600 border-blue-100`} {...props} />;
      if (layout === 'bold') return <h1 className={`${base} text-5xl uppercase tracking-tighter border-black`} {...props} />;
      return <h1 className={`${base} border-gray-200`} {...props} />;
    },
    h2: ({node, ...props}: any) => {
      const base = "text-xl font-semibold mt-8 mb-4";
      if (layout === 'modern') return <h2 className={`${base} text-blue-500 uppercase tracking-wide text-sm`} {...props} />;
      if (layout === 'bold') return <h2 className={`${base} bg-black text-white px-2 py-1 inline-block`} {...props} />;
      return <h2 className={`${base} text-gray-800`} {...props} />;
    },
    table: ({node, ...props}: any) => (
      <div className="overflow-hidden my-8 rounded-lg border border-gray-200 print:border-gray-300">
        <table className="min-w-full divide-y divide-gray-200" {...props} />
      </div>
    ),
    th: ({node, ...props}: any) => {
      const base = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider";
      if (layout === 'modern') return <th className={`${base} bg-blue-50 text-blue-700`} {...props} />;
      if (layout === 'bold') return <th className={`${base} bg-gray-900 text-white`} {...props} />;
      return <th className={`${base} bg-gray-50 text-gray-500`} {...props} />;
    },
    td: ({node, ...props}: any) => (
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-t border-gray-100" {...props} />
    ),
    p: ({node, ...props}: any) => <p className="mb-4 leading-relaxed" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-gray-900" {...props} />,
    ul: ({node, ...props}: any) => {
        const style = layout === 'modern' ? 'marker:text-blue-500' : 'marker:text-gray-400';
        return <ul className={`list-disc pl-5 mb-4 space-y-1 ${style}`} {...props} />;
    },
    ol: ({node, ...props}: any) => {
        const style = layout === 'modern' ? 'marker:text-blue-500 font-medium' : 'marker:text-gray-500';
        return <ol className={`list-decimal pl-5 mb-4 space-y-1 ${style}`} {...props} />;
    },
    li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
  };

  return (
    <>
      <style>
            {`
                @media print {
                    @page {
                        size: ${paperSize} ${orientation};
                        margin: 0;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}
      </style>
      <div className={getLayoutClasses()} id="printable-content">
        {/* Header with Logo and Business Details */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex flex-col items-start gap-4">
             {/* If user has a logo URL, display it. Otherwise show Initials fallback */}
             {profile.logoUrl ? (
               <img 
                src={profile.logoUrl} 
                alt="Company Logo" 
                className="h-20 w-auto object-contain"
                onError={(e) => (e.currentTarget.style.display = 'none')}
               />
             ) : (
               <div 
                  className="h-20 w-20 flex items-center justify-center rounded-lg shadow-sm text-3xl font-bold"
                  style={{ 
                      backgroundColor: profile.logoBackgroundColor || '#2563eb', 
                      color: profile.logoTextColor || '#ffffff',
                      fontFamily: 'sans-serif'
                  }}
               >
                  {getInitials()}
               </div>
             )}
             
             <div className="flex flex-col gap-1">
               {invoiceNumber && (
                  <div className={`px-3 py-1 rounded-md text-sm font-semibold tracking-wider border w-fit ${layout === 'modern' ? 'bg-blue-50 text-blue-800 border-blue-100' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                  {invoiceNumber}
                  </div>
               )}
               
               {(createdAt || dueDate) && (
                   <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                      {createdAt && <p>Issued: <span className="font-medium text-gray-700">{new Date(createdAt).toLocaleDateString()}</span></p>}
                      {dueDate && <p>Due: <span className="font-medium text-gray-700">{new Date(dueDate).toLocaleDateString()}</span></p>}
                   </div>
               )}
             </div>
          </div>
          
          <div className={`text-right ${layout === 'modern' ? 'text-blue-600' : 'text-gray-500'}`}>
            <p className="font-bold text-xl text-gray-900">{getDisplayName()}</p>
            <p className="whitespace-pre-line text-sm mt-1">{profile.address}</p>
            <div className="mt-2 text-sm space-y-0.5">
              <p>{profile.email}</p>
              {profile.websiteUrl && <p>{profile.websiteUrl}</p>}
              <p>{profile.phone}</p>
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="markdown-body">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={components}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Footer / Payment Info (Static based on profile) */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500 break-inside-avoid">
          <div className="grid grid-cols-2 gap-8">
              <div>
                  <h3 className="font-bold mb-2 text-gray-800">Payment Details</h3>
                  <pre className="font-sans whitespace-pre-wrap text-gray-600">{profile.paymentDetails}</pre>
                  {profile.defaultPaymentTerms && (
                    <p className="mt-4 font-medium text-gray-800">Terms: <span className="font-normal text-gray-600">{profile.defaultPaymentTerms}</span></p>
                  )}
              </div>
              <div className="text-right flex flex-col justify-end">
                  <p className="font-medium text-gray-900">Thank you for your business!</p>
                  <p className="mt-1 text-xs text-gray-400">Generated by DocuGen AI</p>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MarkdownPreview;