import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UtilityService } from './core/utility/utility.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatProgressBarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly utils = inject(UtilityService);
  protected readonly title = signal('acheva-student-WEB-UI');
}
