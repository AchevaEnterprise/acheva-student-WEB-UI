import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Button } from '../form/button/button';
import { Svg } from '../svg/svg';

@Component({
  selector: 'app-confirmation',
  imports: [MatDialogModule, Svg, Button],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  private readonly dialogRef = inject(MatDialogRef<Confirmation>);
  public readonly data = inject<{ message: string; subTitle: string }>(MAT_DIALOG_DATA);

  cancel() {
    this.dialogRef.close(false);
  }

  confrim() {
    this.dialogRef.close(true);
  }
}
