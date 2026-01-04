export enum LibraryPreference {
  MOVIEPY = 'MoviePy',
  FFMPEG = 'FFmpeg-Python',
  OPENCV = 'OpenCV',
  YT_DLP = 'yt-dlp (Downloader)',
}

export interface ScriptState {
  code: string;
  explanation: string;
  isLoading: boolean;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  library: LibraryPreference;
}