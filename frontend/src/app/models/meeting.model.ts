export interface Participant {
  name: string;
  email: string;
}

export interface Note {
  _id?: string;
  timestamp: number;
  content: string;
  createdAt?: string;
}

export interface Meeting {
  _id?: string;
  title: string;
  description?: string;
  participants: Participant[];
  category?: string;
  videoPath?: string | null;
  duration?: number;
  notes?: Note[];
  transcription?: string | null;
  transcriptionStatus?: 'none' | 'pending' | 'done' | 'failed';
  status?: 'recording' | 'saved';
  createdAt?: string;
  updatedAt?: string;
  transcriptionSegments?: TranscriptionSegment[];
}
export interface TranscriptionSegment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}