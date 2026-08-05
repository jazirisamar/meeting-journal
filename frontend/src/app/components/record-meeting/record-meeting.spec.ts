import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordMeeting } from './record-meeting';

describe('RecordMeeting', () => {
  let component: RecordMeeting;
  let fixture: ComponentFixture<RecordMeeting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordMeeting],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordMeeting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
