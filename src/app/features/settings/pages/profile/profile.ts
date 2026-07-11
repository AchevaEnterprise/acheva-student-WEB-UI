import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { finalize } from 'rxjs';
import { ImageFallbackDirective } from '../../../../core/directives/image-fallback.directive';
import { IStudentProfile } from '../../../../core/models/student.model';
import { StudentService } from '../../../../core/services/student';
import { AppState } from '../../../../core/store/app.state';
import { Button } from '../../../../shared/form/button/button';
import { Skeleton } from '../../../../shared/skeleton/skeleton';
import { Svg } from '../../../../shared/svg/svg';
import { selectProfile } from '../../../../core/store/profile/profile.selector';

@Component({
  selector: 'app-profile',
  imports: [Button, Svg, ImageFallbackDirective, DatePipe, Skeleton, TitleCasePipe, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly studentService = inject(StudentService);
  private readonly store = inject(Store<AppState>);

  profile = signal<IStudentProfile | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.store.select(selectProfile).subscribe({
      next: (result) => {
        this.profile.set(result.profile);
      },
    });
  }

  getProfile() {
    this.loading.set(true);
    this.studentService
      .getProfile()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp) => {
          this.profile.set(resp.data);
        },
      });
  }
}
