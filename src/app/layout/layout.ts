import { Component, computed, inject, signal } from '@angular/core';
import { SideBar } from './side-bar/side-bar';
import { ToolBar } from './tool-bar/tool-bar';
import { RouterOutlet } from '@angular/router';
import { AuthenticationService } from '../features/auth/services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [SideBar, ToolBar, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private readonly authService = inject(AuthenticationService);
  expanded = signal<boolean>(true);
  screenWidth = signal<number>(window.innerWidth);

  constructor() {
    this.authService.loadInitialSession();
  }

  onToggleSideNav(data: { expanded: boolean }) {
    this.expanded.set(data.expanded);
  }

  getBodyClass = computed(() => {
    let styleClass = '';
    const expanded = this.expanded();
    const screenWidth = this.screenWidth();

    if (expanded && screenWidth > 768) styleClass = 'w-[calc(100%_-_16.5625rem)] ml-[16.5625rem]';
    else if (expanded && screenWidth <= 768) styleClass = 'w-[calc(100%_-_5rem)] ml-[5rem]';

    return styleClass;
  });
}
