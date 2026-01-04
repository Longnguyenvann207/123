import React from 'react';
import { LibraryPreference } from '../types';
import { Film, Terminal, Aperture, DownloadCloud, CheckCircle2 } from 'lucide-react';

interface LibrarySelectorProps {
  selected: LibraryPreference;
  onSelect: (lib: LibraryPreference) => void;
}

export const LibrarySelector: React.FC<LibrarySelectorProps> = ({ selected, onSelect }) => {
  const libraries = [
    { id: LibraryPreference.MOVIEPY, name: 'MoviePy', desc: 'Cắt ghép & Hiệu ứng', icon: <Film size={20} /> },
    { id: LibraryPreference.FFMPEG, name: 'FFmpeg', desc: 'Hiệu năng cao', icon: <Terminal size={20} /> },
    { id: LibraryPreference.YT_DLP, name: 'yt-dlp', desc: 'Tải video MXH', icon: <DownloadCloud size={20} /> },
    { id: LibraryPreference.OPENCV, name: 'OpenCV', desc: 'Thị giác máy tính', icon: <Aperture size={20} /> },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {libraries.map((lib) => {
        const isSelected = selected === lib.id;
        return (
          <button
            key={lib.id}
            onClick={() => onSelect(lib.id)}
            className={`
              relative flex items-center p-3 rounded-lg border text-left transition-all duration-200 group
              ${isSelected 
                ? 'bg-[var(--accent-dim)] border-[var(--accent-color)] shadow-sm' 
                : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:border-[#444]'
              }
            `}
          >
            <div className={`p-2 rounded-md mr-3 transition-colors ${isSelected ? 'bg-[var(--accent-color)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] group-hover:text-[var(--text-main)]'}`}>
              {lib.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-sm ${isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-main)]'}`}>
                  {lib.name}
                </h3>
                {isSelected && <CheckCircle2 size={16} className="text-[var(--accent-color)]" />}
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-medium">{lib.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};