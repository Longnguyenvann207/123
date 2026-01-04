import React, { useState } from 'react';
import { Copy, Download, Check, Code2 } from 'lucide-react';
import { Button } from './Button';

interface CodeViewerProps {
  code: string;
  isLoading: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const cleanCode = (raw: string) => {
    return raw.replace(/```python/g, '').replace(/```/g, '').trim();
  };

  const displayCode = cleanCode(code);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([displayCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_edit.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg overflow-hidden shadow-2xl border border-[var(--border-color)]">
      {/* Editor Header - VS Code Style - Keep dark for code context */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#111]">
        <div className="flex items-center space-x-3">
           <Code2 size={16} className="text-[var(--accent-color)]" />
           <span className="text-sm font-medium text-gray-300">video_edit.py</span>
           <span className="text-xs text-gray-600 px-2 py-0.5 rounded border border-gray-700">Python</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy} 
            disabled={!code || isLoading}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDownload} 
            disabled={!code || isLoading}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
            title="Download file"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>
      
      {/* Editor Body - Always keep dark theme for code readability */}
      <div className="relative flex-1 overflow-auto bg-[#1e1e1e] p-5 font-mono text-[13px] leading-6 custom-scrollbar">
        {isLoading && !code ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
             <div className="relative w-12 h-12">
               <div className="absolute top-0 left-0 w-full h-full border-4 border-[#333] rounded-full"></div>
               <div className="absolute top-0 left-0 w-full h-full border-4 border-[var(--accent-color)] rounded-full border-t-transparent animate-spin"></div>
             </div>
             <p className="animate-pulse text-sm font-medium">Đang sinh mã lệnh...</p>
           </div>
        ) : !code ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 select-none">
            <Code2 size={48} className="opacity-20 mb-4" />
            <p>Sẵn sàng tạo script</p>
          </div>
        ) : (
          <pre className="text-gray-300 tab-4">
            <code>{displayCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
};