import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ImageFallbackDirective } from '../../../../core/directives/image-fallback.directive';
import { IStudentProfile } from '../../../../core/models/student.model';
import { StudentService } from '../../../../core/services/student';
import { Button } from '../../../../shared/form/button/button';
import { Loader } from '../../../../shared/loader/loader';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-profile',
  imports: [Button, Svg, ImageFallbackDirective, DatePipe, Loader, TitleCasePipe, CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly studentService = inject(StudentService);

  profile = signal<IStudentProfile | null>(null);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.getProfile();
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
