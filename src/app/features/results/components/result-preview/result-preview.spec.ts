import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultPreview } from './result-preview';

describe('ResultPreview', () => {
  let component: ResultPreview;
  let fixture: ComponentFixture<ResultPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultPreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
