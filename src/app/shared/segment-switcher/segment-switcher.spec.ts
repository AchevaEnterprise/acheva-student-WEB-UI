import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentSwitcher } from './segment-switcher';

describe('SegmentSwitcher', () => {
  let component: SegmentSwitcher;
  let fixture: ComponentFixture<SegmentSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentSwitcher],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentSwitcher);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
