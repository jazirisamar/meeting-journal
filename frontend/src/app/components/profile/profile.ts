import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit {
  name = '';
  email = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  infoMessage = '';
  infoError = '';
  isSavingInfo = false;

  passwordMessage = '';
  passwordError = '';
  isSavingPassword = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.name = user.name;
      this.email = user.email;
    }
  }

  saveInfo() {
    if (!this.name.trim() || !this.email.trim()) {
      this.infoError = 'Nom et email sont requis.';
      return;
    }

    this.isSavingInfo = true;
    this.infoError = '';
    this.infoMessage = '';

    this.authService.updateProfile({ name: this.name.trim(), email: this.email.trim() }).subscribe({
      next: () => {
        this.isSavingInfo = false;
        this.infoMessage = 'Profil mis à jour avec succès.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingInfo = false;
        this.infoError = err.error?.error || 'Erreur lors de la mise à jour.';
        this.cdr.detectChanges();
      }
    });
  }

  savePassword() {
    if (!this.currentPassword || !this.newPassword) {
      this.passwordError = 'Tous les champs sont requis.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordError = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.isSavingPassword = true;
    this.passwordError = '';
    this.passwordMessage = '';

    this.authService.updateProfile({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.passwordMessage = 'Mot de passe modifié avec succès.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingPassword = false;
        this.passwordError = err.error?.error || 'Erreur lors du changement de mot de passe.';
        this.cdr.detectChanges();
      }
    });
  }
}