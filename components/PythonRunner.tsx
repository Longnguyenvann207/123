import React, { useState, useEffect } from 'react';
import { Play, Loader2, Terminal } from 'lucide-react';

declare global {
  interface Window {
    loadPyodide: any;
  }
}

interface PythonRunnerProps {
  code: string;
}

export const PythonRunner: React.FC<PythonRunnerProps> = ({ code }) => {
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);

  useEffect(() => {
    const loadPyodide = async () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
      script.onload = async () => {
        const p = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });
        setPyodide(p);
      };
      document.body.appendChild(script);
    };
    loadPyodide();
  }, []);

  const runCode = async () => {
    if (!pyodide) return;
    setIsRunning(true);
    setOutput('');
    try {
      const result = await pyodide.runPythonAsync(code);
      setOutput(String(result));
    } catch (err: any) {
      setOutput(err.toString());
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg border border-[var(--border-color)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#111]">
        <div className="flex items-center space-x-2 text-gray-300">
          <Terminal size={16} />
          <span className="text-sm font-medium">Output</span>
        </div>
        <button 
          onClick={runCode}
          disabled={isRunning || !pyodide}
          className="flex items-center space-x-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>
      </div>
      <div className="flex-1 p-4 font-mono text-sm text-gray-300 overflow-auto whitespace-pre-wrap">
        {output || 'Output will appear here...'}
      </div>
    </div>
  );
};
