import { Component, input, OnInit, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule, MatPrefix } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Svg } from '../../svg/svg';
import { distinctUntilChanged, debounceTime } from 'rxjs';

@Component({
  selector: 'app-search-input',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatPrefix, Svg],
  templateUrl: './search-input.html',
  styleUrl: './search-input.scss',
})
export class SearchInput implements OnInit {
  placeholder = input<string>('Search...');
  searchEvent = output<string>();

  searchCtrl: FormControl = new FormControl('');

  ngOnInit(): void {
    this.searchListener();
  }

  searchListener() {
    this.searchCtrl.valueChanges.pipe(distinctUntilChanged(), debounceTime(800)).subscribe({
      next: (value: string) => this.searchEvent.emit(value),
    });
  }
}
