import { Component, input, output, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-search-select',
  imports: [MatFormFieldModule, MatSelectModule, NgxMatSelectSearchModule, ReactiveFormsModule],
  templateUrl: './search-select.html',
  styleUrl: './search-select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: SearchSelect,
      multi: true,
    },
  ],
})
export class SearchSelect implements ControlValueAccessor {
  loading = input<boolean>(false);
  disabled = input(false);
  placeholder = input<string>('Search...');
  options = input<{ label: string; value: unknown }[]>([]);

  searchEvent = output<string>();
  selectEvent = output<unknown>();

  value = signal<unknown>('');
  searchCtrl: FormControl = new FormControl('');

  constructor() {
    this.searchListener();
  }

  searchListener() {
    this.searchCtrl.valueChanges
      .pipe(
        filter((val) => !!val),
        debounceTime(800),
        distinctUntilChanged()
      )
      .subscribe({
        next: (val: string) => this.searchEvent.emit(val),
      });
  }

  selectOption(value: unknown) {
    this.selectEvent.emit(value);
  }

  writeValue(obj: unknown): void {
    this.value.set(obj);
  }

  onChange = (value: unknown) => this.value.set(value);
  onTouch = (value: unknown) => this.value.set(value);

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  onSelected(event: MatSelectChange) {
    this.onChange(event.value);
  }
}
