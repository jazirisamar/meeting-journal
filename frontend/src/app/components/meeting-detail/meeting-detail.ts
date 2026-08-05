import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MeetingService } from '../../services/meeting';
import { Meeting, Note } from '../../models/meeting.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-meeting-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-detail.html',
  styleUrl: './meeting-detail.scss'
})

export class MeetingDetailComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;

  meeting: Meeting | null = null;
  errorMessage = '';
  videoUrl = '';

  // Ajout de note pendant la lecture
  newNoteText = '';

  // Édition d'une note existante
  editingNoteId: string | null = null;
  editingText = '';

  private readonly apiOrigin = 'http://localhost:5000';
constructor(
  private route: ActivatedRoute,
  private router: Router,
  private meetingService: MeetingService,
  private cdr: ChangeDetectorRef
) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadMeeting(id);
  }

  loadMeeting(id: string) {
    this.meetingService.getMeetingById(id).subscribe({
      next: (meeting) => {
        this.meeting = meeting;
        this.videoUrl = meeting.videoPath ? this.apiOrigin + meeting.videoPath : '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Réunion introuvable';
        this.cdr.detectChanges();
      }
    });
  }

  // Clic sur une note -> saute à ce moment dans la vidéo
  seekTo(timestamp: number) {
    const video = this.videoPlayerRef?.nativeElement;
    if (!video) return;
    video.currentTime = timestamp;
    video.play();
  }

  addNote() {
    if (!this.newNoteText.trim() || !this.meeting?._id) return;

    const currentTime = Math.floor(this.videoPlayerRef?.nativeElement?.currentTime || 0);

    this.meetingService.addNote(this.meeting._id, currentTime, this.newNoteText.trim()).subscribe({
      next: (updatedMeeting) => {
        this.meeting = updatedMeeting;
        this.newNoteText = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de l\'ajout de la note';
        this.cdr.detectChanges();
      }
    });
  }

  startEditNote(note: Note) {
    this.editingNoteId = note._id!;
    this.editingText = note.content;
  }

  cancelEditNote() {
    this.editingNoteId = null;
    this.editingText = '';
  }

  saveEditNote(noteId: string) {
    if (!this.meeting?._id || !this.editingText.trim()) return;

    this.meetingService.updateNote(this.meeting._id, noteId, this.editingText.trim()).subscribe({
      next: (updatedMeeting) => {
        this.meeting = updatedMeeting;
        this.editingNoteId = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la modification';
        this.cdr.detectChanges();
      }
    });
  }

  deleteNote(noteId: string) {
    if (!this.meeting?._id) return;
    if (!confirm('Supprimer cette note ?')) return;

    this.meetingService.deleteNote(this.meeting._id, noteId).subscribe({
      next: (updatedMeeting) => {
        this.meeting = updatedMeeting;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression';
        this.cdr.detectChanges();
      }
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // Trie les notes par timestamp croissant pour la timeline
  get sortedNotes(): Note[] {
    return [...(this.meeting?.notes || [])].sort((a, b) => a.timestamp - b.timestamp);
  }
// Transcription de la réunion
isTranscribing = false;
private pollInterval: any;

launchTranscription() {
  if (!this.meeting?._id) return;

  this.isTranscribing = true;
  this.meetingService.transcribeMeeting(this.meeting._id).subscribe({
    next: (meeting) => {
      this.meeting = meeting;
      this.cdr.detectChanges();
      this.pollTranscriptionStatus();
    },
    error: () => {
      this.isTranscribing = false;
      this.cdr.detectChanges();
    }
  });
}

private pollTranscriptionStatus() {
  this.pollInterval = setInterval(() => {
    this.loadMeetingSilently();
  }, 4000);
}

private loadMeetingSilently() {
  if (!this.meeting?._id) return;
  this.meetingService.getMeetingById(this.meeting._id).subscribe({
    next: (meeting) => {
      this.meeting = meeting;
      if (meeting.transcriptionStatus === 'done' || meeting.transcriptionStatus === 'failed') {
        this.isTranscribing = false;
        clearInterval(this.pollInterval);
      }
      this.cdr.detectChanges();
    }
  });
}

ngOnDestroy() {
  clearInterval(this.pollInterval);
}
//CRUD Reunion 
isEditing = false;
editTitle = '';
editDescription = '';
editCategory = '';

startEditMeeting() {
  if (!this.meeting) return;
  this.editTitle = this.meeting.title;
  this.editDescription = this.meeting.description || '';
  this.editCategory = this.meeting.category || '';
  this.isEditing = true;
}

cancelEditMeeting() {
  this.isEditing = false;
}

saveEditMeeting() {
  if (!this.meeting?._id || !this.editTitle.trim()) return;

  this.meetingService.updateMeeting(this.meeting._id, {
    title: this.editTitle.trim(),
    description: this.editDescription.trim(),
    category: this.editCategory.trim()
  }).subscribe({
    next: (updatedMeeting) => {
      this.meeting = updatedMeeting;
      this.isEditing = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.errorMessage = 'Erreur lors de la modification';
      this.cdr.detectChanges();
    }
  });
}

deleteMeeting() {
  if (!this.meeting?._id) return;
  if (!confirm(`Supprimer "${this.meeting.title}" ? Cette action est irréversible.`)) return;

  this.meetingService.deleteMeeting(this.meeting._id).subscribe({
    next: () => {
      this.router.navigate(['/']);
    },
    error: () => {
      this.errorMessage = 'Erreur lors de la suppression';
      this.cdr.detectChanges();
    }
  });
}
private speakerColors = ['#3652e3', '#17a589', '#e0a72e', '#d8455b', '#8b5cf6'];
private speakerColorMap = new Map<string, string>();

getSpeakerColor(speaker: string): string {
  if (!this.speakerColorMap.has(speaker)) {
    const index = this.speakerColorMap.size % this.speakerColors.length;
    this.speakerColorMap.set(speaker, this.speakerColors[index]);
  }
  return this.speakerColorMap.get(speaker)!;
}
}