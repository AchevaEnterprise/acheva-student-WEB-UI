import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgBackground } from './svg-background';

describe('SvgBackground', () => {
  let component: SvgBackground;
  let fixture: ComponentFixture<SvgBackground>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgBackground],
    }).compileComponents();

    fixture = TestBed.createComponent(SvgBackground);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
