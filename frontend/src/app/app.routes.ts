import { Routes } from '@angular/router';
import { CreateMeetingComponent } from './components/create-meeting/create-meeting';
import { RecordMeetingComponent } from './components/record-meeting/record-meeting';
import { MeetingDetailComponent } from './components/meeting-detail/meeting-detail';
import { MeetingListComponent } from './components/meeting-list/meeting-list';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { LayoutComponent } from './components/layout/layout';
import { authGuard } from './guards/auth.guard';
import { ProfileComponent } from './components/profile/profile';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
  { path: '', component: MeetingListComponent },
  { path: 'create', component: CreateMeetingComponent },
  { path: 'record/:id', component: RecordMeetingComponent },
  { path: 'meetings/:id', component: MeetingDetailComponent },
  { path: 'profile', component: ProfileComponent },
]
  }
];