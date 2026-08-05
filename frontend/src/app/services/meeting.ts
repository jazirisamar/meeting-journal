import { Injectable } from '@angular/core';
import { Meeting } from '../models/meeting.model';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private apiUrl = 'http://localhost:5000/api/meetings';

  constructor(private http: HttpClient) {}

  getMeetings(search?: string, date?: string): Observable<Meeting[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (date) params.push(`date=${encodeURIComponent(date)}`);
    if (params.length) url += '?' + params.join('&');

    return this.http.get<Meeting[]>(url);
  }

  getMeetingById(id: string): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.apiUrl}/${id}`);
  }

  createMeeting(meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.post<Meeting>(this.apiUrl, meeting);
  }

  updateMeeting(id: string, meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.put<Meeting>(`${this.apiUrl}/${id}`, meeting);
  }

  deleteMeeting(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  uploadRecording(meetingId: string, videoBlob: Blob, notes: any[], duration: number): Observable<HttpEvent<any>> {
  const formData = new FormData();
  formData.append('video', videoBlob, `meeting-${meetingId}.webm`);
  formData.append('notes', JSON.stringify(notes));
  formData.append('duration', duration.toString());

  const req = new HttpRequest(
    'POST',
    `${this.apiUrl}/${meetingId}/upload`,
    formData,
    { reportProgress: true }
  );

  return this.http.request(req);
}
addNote(meetingId: string, timestamp: number, content: string): Observable<Meeting> {
  return this.http.post<Meeting>(`${this.apiUrl}/${meetingId}/notes`, { timestamp, content });
}

updateNote(meetingId: string, noteId: string, content: string): Observable<Meeting> {
  return this.http.put<Meeting>(`${this.apiUrl}/${meetingId}/notes/${noteId}`, { content });
}

deleteNote(meetingId: string, noteId: string): Observable<Meeting> {
  return this.http.delete<Meeting>(`${this.apiUrl}/${meetingId}/notes/${noteId}`);
}
transcribeMeeting(id: string): Observable<Meeting> {
  return this.http.post<Meeting>(`${this.apiUrl}/${id}/transcribe`, {});
}
uploadChunk(meetingId: string, chunk: Blob): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/${meetingId}/upload-chunk`,
    chunk,
    { headers: { 'Content-Type': 'application/octet-stream' } }
  );
}

finalizeUpload(meetingId: string, notes: any[], duration: number): Observable<Meeting> {
  return this.http.post<Meeting>(`${this.apiUrl}/${meetingId}/finalize-upload`, {
    notes: JSON.stringify(notes),
    duration
  });
}
}
