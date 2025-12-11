import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsMenuList } from './settings-menu-list';

describe('SettingsMenuList', () => {
  let component: SettingsMenuList;
  let fixture: ComponentFixture<SettingsMenuList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsMenuList],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsMenuList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
