import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../services/meeting';
import { ContactService } from '../../services/contact';
import { Contact } from '../../models/contact.model';
@Component({
  selector: 'app-create-meeting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-meeting.html',
  styleUrl: './create-meeting.scss'
})
export class CreateMeetingComponent {
  title = '';
  description = '';
  category = '';
  participants: { name: string; email: string }[] = [{ name: '', email: '' }];
  errorMessage = '';
  isSubmitting = false;
  savedContacts: Contact[] = [];
  showContactPicker = false;
constructor(
  private meetingService: MeetingService,
  private contactService: ContactService,
  private router: Router
) {}
  addParticipant() {
    this.participants.push({ name: '', email: '' });
  }

  removeParticipant(index: number) {
    this.participants.splice(index, 1);
  }

  onSubmit() {
    if (!this.title.trim()) {
      this.errorMessage = 'Le titre est obligatoire.';
      return;
    }

    const validParticipants = this.participants.filter(
      p => p.name.trim() && p.email.trim()
    );

    this.isSubmitting = true;
    this.errorMessage = '';

    this.meetingService.createMeeting({
      title: this.title,
      description: this.description,
      category: this.category,
      participants: validParticipants
    }).subscribe({
      next: (meeting) => {
        this.isSubmitting = false;
        this.router.navigate(['/record', meeting._id]);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la création : ' + err.message;
        this.isSubmitting = false;
      }
    });
  }



ngOnInit() {
  this.contactService.getContacts().subscribe({
    next: (contacts) => this.savedContacts = contacts,
    error: () => {} // pas bloquant si ça échoue
  });
}

addFromContact(contact: Contact) {
  // Évite les doublons dans la liste des participants
  const alreadyAdded = this.participants.some(p => p.email === contact.email);
  if (alreadyAdded) return;

  // Remplace la première ligne vide, sinon ajoute une nouvelle ligne
  const emptyIndex = this.participants.findIndex(p => !p.name && !p.email);
  if (emptyIndex !== -1) {
    this.participants[emptyIndex] = { name: contact.name, email: contact.email };
  } else {
    this.participants.push({ name: contact.name, email: contact.email });
  }
  this.showContactPicker = false;
}

saveParticipantAsContact(participant: { name: string; email: string }) {
  if (!participant.name.trim() || !participant.email.trim()) return;

  this.contactService.createContact(participant.name.trim(), participant.email.trim()).subscribe({
    next: (contact) => this.savedContacts.push(contact),
    error: () => {} // contact déjà existant, on ignore silencieusement
  });
}
}