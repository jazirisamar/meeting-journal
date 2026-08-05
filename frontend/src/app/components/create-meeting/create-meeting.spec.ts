import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMeeting } from './create-meeting';

describe('CreateMeeting', () => {
  let component: CreateMeeting;
  let fixture: ComponentFixture<CreateMeeting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMeeting],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateMeeting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
