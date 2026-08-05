import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MeetingService } from '../../services/meeting';
import { Meeting } from '../../models/meeting.model';
import { HttpEventType } from '@angular/common/http';
@Component({
  selector: 'app-record-meeting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './record-meeting.html',
  styleUrl: './record-meeting.scss'
})
export class RecordMeetingComponent implements OnInit, OnDestroy {
  meetingId!: string;
  meeting: Meeting | null = null;

  status: 'idle' | 'recording' | 'stopped' = 'idle';
  elapsedSeconds = 0;
  private timerInterval: any;
  private startTime = 0;
  uploadProgress = 0;
  isUploading = false;
  uploadError = '';

  private screenStream!: MediaStream;
  private micStream!: MediaStream;
  private combinedStream!: MediaStream;
  private mediaRecorder!: MediaRecorder;
  private previewChunks: Blob[] = [];

  recordedVideoUrl: string | null = null;
  recordedBlob: Blob | null = null;

  notes: { timestamp: number; content: string }[] = [];
  currentNoteText = '';

  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meetingService: MeetingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id')!;
    console.log('ID récupéré depuis la route:', this.meetingId);

    this.meetingService.getMeetingById(this.meetingId).subscribe({
      next: (meeting) => {
        console.log('Réunion reçue:', meeting);
        this.meeting = meeting;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.errorMessage = 'Réunion introuvable';
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.stopAllTracks();
    clearInterval(this.timerInterval);
  }

  async startRecording() {
  try {
    this.errorMessage = '';

    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' } as any,
      audio: true
    });

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true }
    });

    this.combinedStream = new MediaStream([
      ...this.screenStream.getVideoTracks(),
      ...this.micStream.getAudioTracks()
    ]);

    const mimeType = 'video/webm;codecs=vp8,opus';
    this.mediaRecorder = new MediaRecorder(this.combinedStream, { mimeType });

    // On garde une petite queue locale pour la prévisualisation uniquement,
    // pas pour l'upload final (déjà envoyé au fil de l'eau)
    this.previewChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size === 0) return;

      // Envoi immédiat du morceau au serveur (upload incrémental)
      this.meetingService.uploadChunk(this.meetingId, event.data).subscribe({
        error: (err) => console.error('Erreur envoi chunk:', err)
      });

      // Gardé uniquement pour permettre une prévisualisation locale après arrêt
      this.previewChunks.push(event.data);
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.previewChunks, { type: 'video/webm' });
      this.recordedVideoUrl = URL.createObjectURL(blob);
      this.status = 'stopped';
      this.stopAllTracks();
      this.cdr.detectChanges();
    };

    this.screenStream.getVideoTracks()[0].onended = () => {
      if (this.mediaRecorder.state !== 'inactive') this.stopRecording();
    };

    this.mediaRecorder.start(1000); // un chunk par seconde, envoyé immédiatement
    this.status = 'recording';
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      this.cdr.detectChanges();
    }, 1000);

  } catch (err: any) {
    this.errorMessage = 'Erreur : ' + err.message;
    this.cdr.detectChanges();
  }
}

  stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    clearInterval(this.timerInterval);
  }

  private stopAllTracks() {
    this.combinedStream?.getTracks().forEach(t => t.stop());
    this.screenStream?.getTracks().forEach(t => t.stop());
    this.micStream?.getTracks().forEach(t => t.stop());
  }

  addNote() {
    if (!this.currentNoteText.trim()) return;
    this.notes.push({
      timestamp: this.elapsedSeconds,
      content: this.currentNoteText.trim()
    });
    this.currentNoteText = '';
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

 saveMeeting() {
  this.isUploading = true;
  this.uploadError = '';

  this.meetingService.finalizeUpload(
    this.meetingId,
    this.notes,
    this.elapsedSeconds
  ).subscribe({
    next: () => {
      this.isUploading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/meetings', this.meetingId]);
    },
    error: (err) => {
      this.isUploading = false;
      this.uploadError = 'Erreur lors de la finalisation : ' + err.message;
      this.cdr.detectChanges();
    }
  });
}
}