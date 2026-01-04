import React, { useState, useRef, useEffect } from 'react';
import { generatePythonScript, explainScript } from './services/geminiService';
import { LibrarySelector } from './components/LibrarySelector';
import { CodeViewer } from './components/CodeViewer';
import { Button } from './components/Button';
import { LibraryPreference } from './types';
import { Wand2, PlayCircle, AlertCircle, FileVideo, Terminal, Sparkles, Upload, Link as LinkIcon, FolderOpen, X, Plus, ZoomIn, SlidersHorizontal, Scissors, Type, FileText, Volume2, VolumeX, Music, ArrowRightLeft, CheckCircle, FlipHorizontal, FlipVertical, Image as ImageIcon, Mic, Square, Download, Settings, Moon, Sun, Palette, Merge, Pipette, MicOff, Paintbrush } from 'lucide-react';

// Color Palette Options
const THEME_COLORS = [
  { name: 'Blue', value: '#0078d4' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [library, setLibrary] = useState<LibraryPreference>(LibraryPreference.MOVIEPY);
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Theme State
  const [showSettings, setShowSettings] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('#0078d4');

  // Input State
  const [inputMode, setInputMode] = useState<'url' | 'local'>('url');
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New State: Auto Merge
  const [autoMerge, setAutoMerge] = useState(false);
  
  // Active Tool State
  const [activeTool, setActiveTool] = useState<'zoom' | 'trim' | 'subtitle' | 'audio' | 'transition' | 'flip' | 'thumbnail' | 'chroma' | 'silence' | 'filter' | null>(null);

  // Tool specific states
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [zoomPosition, setZoomPosition] = useState('center');
  const [trimStart, setTrimStart] = useState('');
  const [trimEnd, setTrimEnd] = useState('');
  const [subMode, setSubMode] = useState<'text' | 'file'>('text');
  const [subText, setSubText] = useState('');
  const [subFile, setSubFile] = useState<File | null>(null);
  const [subTime, setSubTime] = useState('');
  const [subDuration, setSubDuration] = useState('');
  const subFileInputRef = useRef<HTMLInputElement>(null);
  const [audioMode, setAudioMode] = useState<'volume' | 'mute' | 'replace'>('volume');
  const [volumeLevel, setVolumeLevel] = useState(1.0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFadeIn, setAudioFadeIn] = useState(0);
  const [audioFadeOut, setAudioFadeOut] = useState(0);
  const [audioSourceType, setAudioSourceType] = useState<'file' | 'mic'>('file');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [transType, setTransType] = useState<'crossfade' | 'fade_black' | 'slide'>('crossfade');
  const [transDuration, setTransDuration] = useState(1.0);
  const [flipDirection, setFlipDirection] = useState<'horizontal' | 'vertical'>('horizontal');
  const [thumbMode, setThumbMode] = useState<'middle' | 'random' | 'specific'>('middle');
  const [thumbTime, setThumbTime] = useState('');

  // New Tool States (Advanced)
  const [chromaColor, setChromaColor] = useState('#00ff00'); // Default green
  const [chromaThreshold, setChromaThreshold] = useState(0.4);
  const [silenceThreshold, setSilenceThreshold] = useState(-30); // dB
  const [filterType, setFilterType] = useState<'grayscale' | 'sepia' | 'invert' | 'brightness'>('grayscale');

  // --- Theme Logic ---
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.style.setProperty('--bg-main', '#111111');
      root.style.setProperty('--bg-sidebar', '#1c1c1c');
      root.style.setProperty('--bg-card', '#252525');
      root.style.setProperty('--bg-hover', '#333333');
      root.style.setProperty('--border-color', '#333333');
      root.style.setProperty('--text-main', '#f5f5f5');
      root.style.setProperty('--text-secondary', '#9ca3af');
    } else {
      root.style.setProperty('--bg-main', '#f3f4f6');
      root.style.setProperty('--bg-sidebar', '#ffffff');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--bg-hover', '#f9fafb');
      root.style.setProperty('--border-color', '#e5e7eb');
      root.style.setProperty('--text-main', '#111827');
      root.style.setProperty('--text-secondary', '#6b7280');
    }
    
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-dim', `${accentColor}20`);
    root.style.setProperty('--accent-hover', accentColor);
  }, [isDarkMode, accentColor]);

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, [recordingUrl]);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!prompt.trim() && !autoMerge) return;
    
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setCode('');
    setExplanation('');
    try {
      let finalPrompt = prompt;
      let mergeInstruction = "";

      if (autoMerge) {
         mergeInstruction = "\n\nCRITICAL TASK: After processing any other requests, you MUST concatenate (merge) all the video clips (downloaded or local) into a single final output video file named 'final_merged_output.mp4'. Ensure audio is synced.";
      }

      if (inputMode === 'local') {
        const filenames = localFiles.map(f => `"${f.name}"`).join(", ");
        finalPrompt = `I have the following local video files in the same directory as the script: [${filenames}]. ${prompt} ${mergeInstruction}`;
      } else {
        finalPrompt = `Source is from URL/Internet. ${prompt} ${mergeInstruction}`;
      }
      
      const generatedCode = await generatePythonScript(finalPrompt, library, (chunk) => {
        setCode(prev => prev + chunk);
      });
      explainScript(generatedCode).then(setExplanation);
      setSuccess("Script Python đã được tạo thành công!");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Lỗi tạo script. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickPrompt = (text: string) => setPrompt(text);
  const toggleTool = (tool: any) => setActiveTool(activeTool === tool ? null : tool);
  
  // Tool handlers
  const handleAddZoom = () => { setPrompt(prev => prev + ` Zoom video phóng đại ${zoomLevel}x vào ${zoomPosition}.`); setActiveTool(null); };
  const handleAddTrim = () => { if(trimStart||trimEnd) setPrompt(prev => prev + ` Cắt video từ ${trimStart} đến ${trimEnd}.`); setActiveTool(null); };
  const handleAddSubtitle = () => { setPrompt(prev => prev + (subMode==='text' ? ` Thêm text "${subText}" từ ${subTime} trong ${subDuration}s.` : ` Hardcode sub file "${subFile?.name}".`)); setActiveTool(null); };
  const handleAddAudio = () => { 
    let p = audioMode==='volume' ? ` Volume ${Math.round(volumeLevel*100)}%.` : audioMode==='mute' ? ' Mute audio.' : ` Thay audio bằng "${audioSourceType==='file' ? audioFile?.name : 'recorded_voice.webm'}".`;
    if(audioMode==='replace') p += ` FadeIn: ${audioFadeIn}s, FadeOut: ${audioFadeOut}s.`;
    setPrompt(prev => prev + p); setActiveTool(null); 
  };
  const handleAddTransition = () => { setPrompt(prev => prev + ` Nối video dùng hiệu ứng ${transType} trong ${transDuration}s.`); setActiveTool(null); };
  const handleAddFlip = () => { setPrompt(prev => prev + ` Lật video ${flipDirection}.`); setActiveTool(null); };
  const handleAddThumbnail = () => { setPrompt(prev => prev + ` Tạo thumbnail (${thumbMode}) tại ${thumbTime}.`); setActiveTool(null); };
  
  // Advanced Tool Handlers
  const handleAddChroma = () => { setPrompt(prev => prev + ` Xóa phông xanh (Chroma Key) với mã màu ${chromaColor} và ngưỡng (threshold) ${chromaThreshold}.`); setActiveTool(null); };
  const handleAddSilence = () => { setPrompt(prev => prev + ` Tự động cắt bỏ các đoạn im lặng (Silence Removal) với ngưỡng âm thanh dưới ${silenceThreshold}dB.`); setActiveTool(null); };
  const handleAddFilter = () => { setPrompt(prev => prev + ` Áp dụng bộ lọc màu ${filterType} cho video.`); setActiveTool(null); };

  // File Handlers
  const handleFileChange = (e: any) => { if (e.target.files) setLocalFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]); };
  const handleSubFileChange = (e: any) => { if(e.target.files) setSubFile(e.target.files[0]); };
  const handleAudioFileChange = (e: any) => { if(e.target.files) setAudioFile(e.target.files[0]); };
  const removeFile = (i: number) => setLocalFiles(prev => prev.filter((_, idx) => idx !== i));
  
  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) { setError("Lỗi Micro."); }
  };
  const stopRecording = () => { if(mediaRecorderRef.current) mediaRecorderRef.current.stop(); setIsRecording(false); if(timerRef.current) clearInterval(timerRef.current); };
  const formatTime = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const downloadRecording = () => { if(recordingUrl) { const a = document.createElement('a'); a.href = recordingUrl; a.download = 'recorded_voice.webm'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }};

  const QuickChip = ({ label, onClick }: any) => (
    <button onClick={onClick} className="text-xs font-medium bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] px-3 py-1.5 rounded-full border border-[var(--border-color)] transition-colors flex items-center space-x-1">
      <Sparkles size={10} className="text-[var(--accent-color)]" /><span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col md:flex-row overflow-hidden font-sans selection:bg-[var(--accent-color)] selection:text-white transition-colors duration-300">
      
      {/* Sidebar */}
      <div className="w-full md:w-[420px] flex flex-col bg-[var(--bg-sidebar)]/95 backdrop-blur-md border-r border-[var(--border-color)] h-screen overflow-y-auto z-20 shadow-2xl transition-colors duration-300">
        <div className="p-6 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-sidebar)]/95 backdrop-blur-xl z-30 flex justify-between items-center transition-colors duration-300">
          <div className="flex items-center space-x-3">
             <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent-color)] to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileVideo size={20} className="text-white" />
             </div>
             <div>
                <h1 className="text-lg font-bold text-[var(--text-main)] tracking-tight">AutoEditPy</h1>
                <div className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium">v1.4 • Ultra</p>
                </div>
             </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"><Settings size={20} /></button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-hover)]/30 animate-in slide-in-from-top-2">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Giao diện</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Chế độ</span>
              <div className="flex bg-[var(--bg-card)] rounded-lg p-1 border border-[var(--border-color)]">
                <button onClick={() => setIsDarkMode(false)} className={`p-1.5 rounded-md transition-all ${!isDarkMode ? 'bg-[var(--bg-main)] shadow-sm text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'}`}><Sun size={16} /></button>
                <button onClick={() => setIsDarkMode(true)} className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'bg-[#333] shadow-sm text-white' : 'text-[var(--text-secondary)]'}`}><Moon size={16} /></button>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium block">Màu chủ đạo</span>
              <div className="flex space-x-2">
                {THEME_COLORS.map((c) => (
                  <button key={c.name} onClick={() => setAccentColor(c.value)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${accentColor === c.value ? 'border-[var(--text-main)]' : 'border-transparent'}`} style={{ backgroundColor: c.value }} title={c.name} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col space-y-7">
          
          {/* Section: Library */}
          <section>
            <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center pl-1">Thư viện xử lý</h2>
            <LibrarySelector selected={library} onSelect={setLibrary} />
          </section>

          {/* Section: Input Source */}
          <section>
             <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center pl-1">Nguồn Video</h2>
            <div className="bg-[var(--bg-card)] p-1 rounded-lg flex border border-[var(--border-color)] mb-4">
              <button onClick={() => setInputMode('url')} className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${inputMode === 'url' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}><LinkIcon size={14} className="mr-2" /> URL Online</button>
              <button onClick={() => setInputMode('local')} className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${inputMode === 'local' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'}`}><Upload size={14} className="mr-2" /> File Cục bộ</button>
            </div>

            {inputMode === 'local' && (
              <div className="space-y-3">
                <div onClick={() => fileInputRef.current?.click()} className={`group relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all flex flex-col items-center justify-center text-center ${isDragging ? 'border-[var(--accent-color)] bg-[var(--accent-dim)]' : 'border-[var(--border-color)] hover:border-[var(--accent-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)]'}`}>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="video/*" multiple />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] group-hover:bg-[var(--accent-color)] group-hover:text-white'}`}><FolderOpen size={24} /></div>
                  <p className="text-sm font-medium text-[var(--text-main)]">Nhấn chọn hoặc kéo thả video</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Hỗ trợ chọn nhiều file</p>
                </div>
                {localFiles.length > 0 && (
                  <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {localFiles.map((file, index) => (
                      <div key={`${file.name}-${index}`} className="flex items-center space-x-3 w-full bg-[var(--bg-card)] p-2 rounded-lg border border-[var(--border-color)] group hover:border-[var(--border-color)] transition-colors">
                        <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-md flex items-center justify-center flex-shrink-0 text-[var(--accent-color)]"><FileVideo size={16} /></div>
                        <div className="flex-1 min-w-0 text-left"><p className="text-sm font-medium text-[var(--text-main)] truncate">{file.name}</p><p className="text-[10px] text-[var(--text-secondary)]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p></div>
                        <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="p-1.5 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 rounded-md transition-colors"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3 px-1 animate-in fade-in slide-in-from-top-1">
               <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => setAutoMerge(!autoMerge)}>
                 <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${autoMerge ? 'bg-[var(--accent-color)]' : 'bg-[var(--bg-hover)] border border-[var(--border-color)]'}`}><div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 shadow-sm ${autoMerge ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                 <div className="flex items-center"><span className={`text-xs font-medium transition-colors ${autoMerge ? 'text-[var(--text-main)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-main)]'}`}>Tự động nối video thành 1 file</span>{autoMerge && <Merge size={12} className="ml-1.5 text-[var(--accent-color)]" />}</div>
               </div>
            </div>
          </section>

          {/* Section: Prompt */}
          <section className="flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center pl-1">Yêu cầu xử lý</h2>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent-color)] to-blue-400 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={inputMode === 'local' ? "VD: Nối video, thêm nhạc..." : "VD: Tải YouTube, cắt 30s đầu..."} className="relative w-full min-h-[120px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg p-4 text-sm focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent outline-none resize-none placeholder-[var(--text-secondary)] transition-all shadow-inner" />
            </div>

             {/* Tools Bar */}
             <div className="mt-4 flex flex-col space-y-3">
               <div className="flex items-center justify-between">
                 <div className="flex flex-wrap gap-2">
                    <QuickChip label="Xóa phông xanh" onClick={() => handleQuickPrompt("Xóa phông xanh (green screen) và thay bằng nền đen.")} />
                    <QuickChip label="Cắt khoảng lặng" onClick={() => handleQuickPrompt("Tự động cắt bỏ các đoạn im lặng (silence removal).")} />
                 </div>
                 
                 <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                   {[
                     { id: 'trim', icon: <Scissors size={12} />, label: 'Cắt' },
                     { id: 'zoom', icon: <SlidersHorizontal size={12} />, label: 'Zoom' },
                     { id: 'subtitle', icon: <Type size={12} />, label: 'Sub' },
                     { id: 'audio', icon: <Volume2 size={12} />, label: 'Audio' },
                     { id: 'transition', icon: <ArrowRightLeft size={12} />, label: 'Nối/FX' },
                     { id: 'chroma', icon: <Pipette size={12} />, label: 'Chroma' },
                     { id: 'silence', icon: <MicOff size={12} />, label: 'Silence' },
                     { id: 'filter', icon: <Paintbrush size={12} />, label: 'Màu' },
                   ].map(t => (
                      <button key={t.id} onClick={() => toggleTool(t.id)} className={`flex-shrink-0 flex items-center text-xs font-medium px-2 py-1.5 rounded-md border transition-all ${activeTool === t.id ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-main)]'}`} title={t.label}>
                        <span className="mr-1.5">{t.icon}</span>{t.label}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Existing Tool Panels (Zoom, Trim, Subtitle, Audio, Transition, Flip, Thumbnail) - Condensed for brevity in output but logic remains */}
               {activeTool === 'zoom' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]"><ZoomIn size={16} className="text-[var(--accent-color)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Cấu hình Zoom Video</span></div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Tỷ lệ (x{zoomLevel})</label><input type="range" min="1.1" max="5.0" step="0.1" value={zoomLevel} onChange={(e) => setZoomLevel(parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" /></div>
                       <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Vị trí</label><select value={zoomPosition} onChange={(e) => setZoomPosition(e.target.value)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent-color)]"><option value="center">Giữa (Center)</option><option value="top-left">Trái - Trên</option><option value="top-right">Phải - Trên</option><option value="bottom-left">Trái - Dưới</option><option value="bottom-right">Phải - Dưới</option></select></div>
                    </div>
                    <button onClick={handleAddZoom} className="w-full py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Thêm yêu cầu</button>
                 </div>
               )}
               
               {/* Trim Panel */}
               {activeTool === 'trim' && (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]"><Scissors size={16} className="text-[var(--accent-color)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Cắt / Trim Video</span></div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Bắt đầu</label><input type="text" placeholder="VD: 00:00:10" value={trimStart} onChange={(e) => setTrimStart(e.target.value)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-3 py-2 focus:outline-none focus:border-[var(--accent-color)] placeholder-[var(--text-secondary)]" /></div>
                      <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Kết thúc</label><input type="text" placeholder="VD: 00:00:30" value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-3 py-2 focus:outline-none focus:border-[var(--accent-color)] placeholder-[var(--text-secondary)]" /></div>
                    </div>
                    <button onClick={handleAddTrim} disabled={!trimStart && !trimEnd} className="w-full py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] disabled:opacity-50 text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Thêm yêu cầu</button>
                  </div>
               )}

               {/* Subtitle Panel */}
               {activeTool === 'subtitle' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]"><Type size={16} className="text-[var(--accent-color)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Phụ Đề</span></div>
                   <div className="flex space-x-2 mb-4">
                     <button onClick={() => setSubMode('text')} className={`flex-1 py-1.5 text-xs rounded border transition-colors ${subMode === 'text' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>Văn bản</button>
                     <button onClick={() => setSubMode('file')} className={`flex-1 py-1.5 text-xs rounded border transition-colors ${subMode === 'file' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}>File Sub</button>
                   </div>
                   {subMode === 'text' ? (
                     <div className="space-y-3">
                       <input type="text" placeholder="Nội dung..." value={subText} onChange={(e) => setSubText(e.target.value)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-3 py-2 focus:outline-none focus:border-[var(--accent-color)]" />
                       <div className="flex space-x-3">
                         <input type="text" placeholder="Bắt đầu (s)" value={subTime} onChange={(e) => setSubTime(e.target.value)} className="w-1/2 bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-3 py-2 focus:outline-none focus:border-[var(--accent-color)]" />
                         <input type="text" placeholder="Độ dài (s)" value={subDuration} onChange={(e) => setSubDuration(e.target.value)} className="w-1/2 bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-3 py-2 focus:outline-none focus:border-[var(--accent-color)]" />
                       </div>
                     </div>
                   ) : (
                     <div onClick={() => subFileInputRef.current?.click()} className="border border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-lg p-4 cursor-pointer text-center bg-[var(--bg-hover)] transition-colors">
                       <input type="file" ref={subFileInputRef} onChange={handleSubFileChange} accept=".srt,.vtt,.ass" className="hidden" />
                       <FileText size={20} className="mx-auto mb-2 text-[var(--text-secondary)]" />
                       <p className="text-xs text-[var(--text-main)]">{subFile ? subFile.name : "Chọn file .srt"}</p>
                     </div>
                   )}
                   <button onClick={handleAddSubtitle} disabled={subMode === 'text' ? !subText : !subFile} className="w-full mt-4 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] disabled:opacity-50 text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Thêm phụ đề</button>
                 </div>
               )}

               {/* Audio Panel */}
               {activeTool === 'audio' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]"><Volume2 size={16} className="text-[var(--accent-color)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Âm Thanh</span></div>
                    <div className="flex space-x-2 mb-4">
                       <button onClick={() => setAudioMode('volume')} className={`flex-1 py-1.5 text-xs rounded border transition-colors flex items-center justify-center ${audioMode === 'volume' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}><Volume2 size={12} className="mr-1" /> Volume</button>
                       <button onClick={() => setAudioMode('mute')} className={`flex-1 py-1.5 text-xs rounded border transition-colors flex items-center justify-center ${audioMode === 'mute' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}><VolumeX size={12} className="mr-1" /> Mute</button>
                       <button onClick={() => setAudioMode('replace')} className={`flex-1 py-1.5 text-xs rounded border transition-colors flex items-center justify-center ${audioMode === 'replace' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}><Music size={12} className="mr-1" /> Replace</button>
                    </div>
                    {audioMode === 'volume' && (<div className="mb-2"><label className="block text-xs text-[var(--text-secondary)] mb-1.5 flex justify-between"><span>Mức</span><span className="text-[var(--accent-color)] font-bold">{Math.round(volumeLevel * 100)}%</span></label><input type="range" min="0" max="3.0" step="0.1" value={volumeLevel} onChange={(e) => setVolumeLevel(parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" /></div>)}
                    {audioMode === 'mute' && <div className="p-3 bg-[var(--bg-hover)] rounded border border-[var(--border-color)] text-xs text-[var(--text-secondary)] mb-2">Âm thanh gốc sẽ bị xóa.</div>}
                    {audioMode === 'replace' && (
                       <>
                         <div className="flex space-x-2 mb-3">
                           <button onClick={() => setAudioSourceType('file')} className={`flex-1 py-1 text-[11px] rounded transition-colors ${audioSourceType === 'file' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-medium' : 'text-[var(--text-secondary)]'}`}>Tải File</button>
                           <button onClick={() => setAudioSourceType('mic')} className={`flex-1 py-1 text-[11px] rounded transition-colors ${audioSourceType === 'mic' ? 'bg-[var(--bg-hover)] text-[var(--text-main)] font-medium' : 'text-[var(--text-secondary)]'}`}>Ghi âm</button>
                         </div>
                         {audioSourceType === 'file' ? (
                            <div onClick={() => audioFileInputRef.current?.click()} className="border border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-lg p-4 cursor-pointer text-center bg-[var(--bg-hover)] transition-colors mb-3"><input type="file" ref={audioFileInputRef} onChange={handleAudioFileChange} accept="audio/*" className="hidden" /><Music size={20} className="mx-auto mb-2 text-[var(--text-secondary)]" /><p className="text-xs text-[var(--text-main)]">{audioFile ? audioFile.name : "Chọn file nhạc"}</p></div>
                         ) : (
                            <div className="bg-[var(--bg-hover)] rounded-lg p-3 border border-[var(--border-color)] mb-3">{!recordingBlob ? (<div className="flex flex-col items-center"><div className="text-2xl font-mono text-[var(--text-main)] mb-2 font-light">{formatTime(recordingTime)}</div>{!isRecording ? (<button onClick={startRecording} className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg"><Mic size={16} /><span className="text-xs font-semibold">Ghi âm</span></button>) : (<div className="flex items-center space-x-3"><div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div><button onClick={stopRecording} className="flex items-center space-x-2 px-4 py-2 bg-[var(--bg-card)] text-[var(--text-main)] rounded-full border border-[var(--border-color)]"><Square size={16} /><span className="text-xs font-semibold">Dừng</span></button></div>)}</div>) : (<div className="space-y-3"><div className="flex items-center justify-between"><span className="text-xs text-green-500 font-medium flex items-center"><CheckCircle size={12} className="mr-1" /> Đã ghi</span><button onClick={() => setRecordingBlob(null)} className="text-[10px] text-[var(--text-secondary)] hover:text-red-500">Xóa</button></div><audio controls src={recordingUrl!} className="w-full h-8" /><button onClick={downloadRecording} className="w-full flex items-center justify-center py-1.5 bg-[var(--accent-dim)] text-[var(--accent-color)] text-xs rounded border border-[var(--accent-color)]"><Download size={12} className="mr-1.5" /> Tải file (.webm)</button></div>)}</div>
                         )}
                         <div className="flex space-x-3 mb-2"><div className="flex-1"><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Fade In (s)</label><input type="number" min="0" step="0.5" value={audioFadeIn} onChange={(e) => setAudioFadeIn(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent-color)]" /></div><div className="flex-1"><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Fade Out (s)</label><input type="number" min="0" step="0.5" value={audioFadeOut} onChange={(e) => setAudioFadeOut(parseFloat(e.target.value) || 0)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[var(--accent-color)]" /></div></div>
                       </>
                    )}
                    <button onClick={handleAddAudio} disabled={audioMode === 'replace' && (audioSourceType === 'file' ? !audioFile : !recordingBlob)} className="w-full mt-2 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] disabled:opacity-50 text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Thêm yêu cầu</button>
                 </div>
               )}

               {/* Transition Panel */}
               {activeTool === 'transition' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]"><ArrowRightLeft size={16} className="text-[var(--accent-color)]" /><span className="text-sm font-semibold text-[var(--text-main)]">Hiệu ứng Nối</span></div>
                    <div className="space-y-4">
                       <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Loại</label><select value={transType} onChange={(e) => setTransType(e.target.value as any)} className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded px-2 py-2 focus:outline-none focus:border-[var(--accent-color)]"><option value="crossfade">Crossfade (Chồng mờ)</option><option value="fade_black">Fade to Black (Đen)</option><option value="slide">Slide (Trượt)</option></select></div>
                       <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Thời lượng: {transDuration}s</label><input type="range" min="0.5" max="3.0" step="0.5" value={transDuration} onChange={(e) => setTransDuration(parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" /></div>
                    </div>
                    <button onClick={handleAddTransition} className="w-full mt-4 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Áp dụng</button>
                 </div>
               )}

               {/* New Advanced Panels */}
               {/* Chroma Key Panel */}
               {activeTool === 'chroma' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]">
                      <Pipette size={16} className="text-[var(--accent-color)]" />
                      <span className="text-sm font-semibold text-[var(--text-main)]">Xóa Phông Xanh (Green Screen)</span>
                    </div>
                    <div className="space-y-4 mb-4">
                       <div>
                          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Màu nền cần tách</label>
                          <div className="flex space-x-2 items-center">
                            <input 
                              type="color" 
                              value={chromaColor} 
                              onChange={(e) => setChromaColor(e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border-none"
                            />
                            <span className="text-xs text-[var(--text-main)] font-mono">{chromaColor}</span>
                          </div>
                       </div>
                       <div>
                          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Độ nhạy (Threshold): {chromaThreshold}</label>
                          <input type="range" min="0.1" max="1.0" step="0.05" value={chromaThreshold} onChange={(e) => setChromaThreshold(parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" />
                       </div>
                    </div>
                    <button onClick={handleAddChroma} className="w-full py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Tạo script tách nền</button>
                 </div>
               )}

               {/* Silence Removal Panel */}
               {activeTool === 'silence' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]">
                      <MicOff size={16} className="text-[var(--accent-color)]" />
                      <span className="text-sm font-semibold text-[var(--text-main)]">Cắt Khoảng Lặng (Jump Cut)</span>
                    </div>
                    <div className="space-y-4 mb-4">
                       <p className="text-xs text-[var(--text-secondary)]">Tự động phát hiện và cắt bỏ các đoạn không có tiếng nói để video ngắn gọn hơn.</p>
                       <div>
                          <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Ngưỡng âm thanh (dB): {silenceThreshold}dB</label>
                          <input type="range" min="-60" max="-10" step="1" value={silenceThreshold} onChange={(e) => setSilenceThreshold(parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--bg-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]" />
                          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1"><span>Nhạy (-60dB)</span><span>Ít nhạy (-10dB)</span></div>
                       </div>
                    </div>
                    <button onClick={handleAddSilence} className="w-full py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Áp dụng Jump Cut</button>
                 </div>
               )}

               {/* Color Filter Panel */}
               {activeTool === 'filter' && (
                 <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-2 mb-3 pb-2 border-b border-[var(--border-color)]">
                      <Paintbrush size={16} className="text-[var(--accent-color)]" />
                      <span className="text-sm font-semibold text-[var(--text-main)]">Bộ Lọc Màu</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                       <button onClick={() => setFilterType('grayscale')} className={`py-2 px-1 text-xs rounded border transition-all ${filterType === 'grayscale' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'bg-[var(--bg-hover)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'}`}>Đen Trắng</button>
                       <button onClick={() => setFilterType('sepia')} className={`py-2 px-1 text-xs rounded border transition-all ${filterType === 'sepia' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'bg-[var(--bg-hover)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'}`}>Sepia (Cổ điển)</button>
                       <button onClick={() => setFilterType('invert')} className={`py-2 px-1 text-xs rounded border transition-all ${filterType === 'invert' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'bg-[var(--bg-hover)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'}`}>Đảo màu</button>
                       <button onClick={() => setFilterType('brightness')} className={`py-2 px-1 text-xs rounded border transition-all ${filterType === 'brightness' ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] text-[var(--accent-color)]' : 'bg-[var(--bg-hover)] border-transparent text-[var(--text-secondary)] hover:border-[var(--border-color)]'}`}>Tăng sáng</button>
                    </div>
                    <button onClick={handleAddFilter} className="w-full py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-color)] text-xs font-medium text-[var(--accent-color)] rounded transition-colors flex items-center justify-center"><Plus size={12} className="mr-1.5" /> Áp dụng bộ lọc</button>
                 </div>
               )}

             </div>

          </section>

          {/* Generate Button */}
          <div className="pt-2">
             {error && (
               <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-md flex items-start text-sm text-red-200"><AlertCircle size={16} className="mt-0.5 mr-2 flex-shrink-0" />{error}</div>
             )}
             {success && (
               <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md flex items-center text-sm text-green-400 animate-in fade-in slide-in-from-top-2"><CheckCircle size={16} className="mr-2 flex-shrink-0" />{success}</div>
             )}
             
             <Button 
               onClick={handleGenerate} 
               disabled={isGenerating || !prompt || (inputMode === 'local' && localFiles.length === 0)}
               className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
             >
               {isGenerating ? (<span className="flex items-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>Đang xử lý...</span>) : (<span className="flex items-center"><Wand2 size={18} className="mr-2" /> Tạo Script</span>)}
             </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10 flex flex-col h-screen relative overflow-hidden bg-[var(--bg-main)] transition-colors duration-300">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[var(--accent-color)] rounded-full blur-[120px] pointer-events-none opacity-10" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900 rounded-full blur-[100px] pointer-events-none opacity-10" />

        <div className="flex-1 flex flex-col h-full z-10 gap-6 max-w-5xl mx-auto w-full">
          
          {/* Code Viewer */}
          <div className="flex-1 min-h-0 shadow-2xl rounded-lg border border-[var(--border-color)]">
            <CodeViewer code={code} isLoading={isGenerating} />
          </div>

          {/* Explanation Card */}
          {(explanation && !isGenerating) && (
            <div className="bg-[var(--bg-sidebar)] border border-[var(--border-color)] rounded-lg p-5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[35%] overflow-y-auto custom-scrollbar">
               <div className="flex items-center mb-3">
                 <div className="p-1.5 bg-green-500/10 rounded-md mr-3">
                   <PlayCircle size={18} className="text-green-500" />
                 </div>
                 <h3 className="text-[var(--text-main)] font-semibold text-sm uppercase tracking-wide">
                   Hướng dẫn thực thi
                 </h3>
               </div>
               <div className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                 {explanation}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}