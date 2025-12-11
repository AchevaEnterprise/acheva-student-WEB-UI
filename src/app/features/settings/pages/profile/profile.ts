import { Component } from '@angular/core';
import { ImageFallbackDirective } from '../../../../core/directives/image-fallback.directive';
import { Button } from '../../../../shared/form/button/button';
import { Svg } from '../../../../shared/svg/svg';

@Component({
  selector: 'app-profile',
  imports: [Button, Svg, ImageFallbackDirective],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {}
