import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../services/meeting';
import { Meeting } from '../../models/meeting.model';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './meeting-list.html',
  styleUrl: './meeting-list.scss'
})
export class MeetingListComponent implements OnInit {
  meetings: Meeting[] = [];
  isLoading = true;
  errorMessage = '';

  searchTerm = '';
  dateFilter = '';

  private searchTimeout: any;

  constructor(
    private meetingService: MeetingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchMeetings();
  }

  fetchMeetings() {
    this.isLoading = true;
    this.meetingService.getMeetings(this.searchTerm || undefined, this.dateFilter || undefined)
      .subscribe({
        next: (meetings) => {
          this.meetings = meetings;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'Erreur lors du chargement des réunions';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.fetchMeetings(), 350);
  }

  onDateChange() {
    this.fetchMeetings();
  }

  clearFilters() {
    this.searchTerm = '';
    this.dateFilter = '';
    this.fetchMeetings();
  }

  goToMeeting(meeting: Meeting) {
    if (meeting.status === 'saved') {
      this.router.navigate(['/meetings', meeting._id]);
    } else {
      this.router.navigate(['/record', meeting._id]);
    }
  }

  deleteMeeting(event: Event, meeting: Meeting) {
    event.stopPropagation();
    if (!confirm(`Supprimer "${meeting.title}" ? Cette action est irréversible.`)) return;

    this.meetingService.deleteMeeting(meeting._id!).subscribe({
      next: () => {
        this.meetings = this.meetings.filter(m => m._id !== meeting._id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Erreur lors de la suppression';
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${secs.toString().padStart(2, '0')}s`;
  }
}