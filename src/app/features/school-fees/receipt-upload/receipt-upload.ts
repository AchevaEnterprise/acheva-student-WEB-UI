import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { formatNaira, toKobo } from '../../../core/naira';
import { ToastService } from '../../../core/utility/toast.service';
import { PaymentHoldsService } from '../../../core/services/payment-holds';
import {
  IPaymentSuccessDetail,
  IPaymentSuccessStanding,
  IPaymentSuccessUnlock,
  PaymentSuccess,
} from '../../../shared/payment-success/payment-success';
import { Skeleton } from '../../../shared/skeleton/skeleton';
import { ISchoolFeeReceipt, ISchoolFeesPage } from '../models/school-fees.model';
import { SchoolFeesService } from '../services/school-fees.service';

type ReceiptField = 'schoolFeeReceipt' | 'remitaReceipt';

/** The server's limit too — a phone photo of a receipt is well under it. */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

interface IChosenFile {
  readonly file: File;
  /** An object URL for a photo's thumbnail; null for a PDF. */
  readonly preview: string | null;
}

/**
 * Upload a school-fees receipt — for fees paid at the bank, on Remita, or by
 * a parent or guardian (the user, 2026-11-10).
 *
 * Two files (the school's fee receipt and the Remita receipt with its QR
 * code), the RRR and the amount. It counts toward the student's fees as soon
 * as it is in and is checked afterwards — a later AI check reads the QR code
 * and compares it with the receipt and what was typed, so the page asks for
 * a clear photo of the QR. Everything is checked here as they go and again
 * on the server, which has the last word.
 */
@Component({
  selector: 'app-receipt-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Skeleton, PaymentSuccess],
  templateUrl: './receipt-upload.html',
  styleUrl: './receipt-upload.scss',
})
export class ReceiptUpload implements OnInit, OnDestroy {
  private readonly api = inject(SchoolFeesService);
  private readonly toast = inject(ToastService);
  private readonly holds = inject(PaymentHoldsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly page = signal<ISchoolFeesPage | null>(null);

  readonly files = signal<Partial<Record<ReceiptField, IChosenFile>>>({});
  readonly fileErrors = signal<Partial<Record<ReceiptField, string>>>({});
  readonly rrr = signal('');
  readonly amountNaira = signal('');
  readonly declared = signal(false);
  readonly touched = signal(false);

  /**
   * Set once the upload is in — the page turns into its success page
   * (2026-11-11), the same one an online payment ends on.
   */
  readonly uploaded = signal<ISchoolFeeReceipt | null>(null);
  /** The fees as they stand with the receipt counted. */
  readonly after = signal<ISchoolFeesPage | null>(null);

  readonly successDetails = computed<IPaymentSuccessDetail[]>(() => {
    const receipt = this.uploaded();
    if (!receipt) return [];
    return [
      { label: 'Paid for', value: `School fees ${receipt.session}` },
      { label: 'Paid', value: 'At the bank or on Remita' },
      { label: 'RRR', value: groupRrr(receipt.rrr), copyable: true },
      { label: 'Status', value: 'Counted — being checked by Acheva' },
    ];
  });

  readonly successStanding = computed<IPaymentSuccessStanding | null>(() => {
    const standing = this.after()?.standing;
    if (!standing) return null;
    return {
      totalKobo: standing.totalKobo,
      paidKobo: standing.paidKobo,
      outstandingKobo: standing.outstandingKobo,
      settled: standing.status === 'PAID',
    };
  });

  readonly successUnlocks = computed<IPaymentSuccessUnlock[]>(() => {
    const clearance = this.after()?.clearance;
    if (!clearance) return [];
    return [
      {
        label: 'First semester',
        open: clearance.firstSemester.cleared,
        note: clearance.firstSemester.cleared
          ? 'Open — you can register your courses.'
          : clearance.firstSemester.reason,
      },
      {
        label: 'Second semester',
        open: clearance.secondSemester.cleared,
        note: clearance.secondSemester.cleared
          ? 'Open — your fees are paid in full.'
          : clearance.secondSemester.reason,
      },
    ];
  });

  readonly registrationOpen = computed(() => this.successUnlocks().some((unlock) => unlock.open));
  readonly stillOwing = computed(() => (this.after()?.standing?.outstandingKobo ?? 0) > 0);

  readonly outstanding = computed(() => this.page()?.standing?.outstandingKobo ?? null);
  readonly session = computed(() => this.page()?.session ?? null);
  readonly canUpload = computed(() => !!this.page()?.canUploadReceipt);

  readonly rrrDigits = computed(() => this.rrr().replace(/[\s-]/g, ''));
  readonly rrrProblem = computed(() =>
    /^\d{12}$/.test(this.rrrDigits()) ? null : 'Enter the 12-digit RRR from your Remita receipt.'
  );

  readonly amountKobo = computed(() => toKobo(this.amountNaira()));
  readonly amountProblem = computed(() => {
    const kobo = this.amountKobo();
    if (!Number.isInteger(kobo) || kobo <= 0) return 'Enter the amount on your receipt.';
    const outstanding = this.outstanding();
    if (outstanding !== null && kobo > outstanding) {
      return `That is more than the ${formatNaira(outstanding)} you still owe. If your receipt covers more than school fees, enter only the school-fees part.`;
    }
    return null;
  });

  readonly ready = computed(
    () =>
      !!this.files().schoolFeeReceipt &&
      !!this.files().remitaReceipt &&
      !this.rrrProblem() &&
      !this.amountProblem() &&
      this.declared()
  );

  ngOnInit(): void {
    this.api
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.page.set(resp.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  /** Another receipt for the same fees — a clean form, the fees as they now stand. */
  uploadAnother(): void {
    for (const chosen of Object.values(this.files())) {
      if (chosen?.preview) URL.revokeObjectURL(chosen.preview);
    }
    this.files.set({});
    this.fileErrors.set({});
    this.rrr.set('');
    this.amountNaira.set('');
    this.declared.set(false);
    this.touched.set(false);
    if (this.after()) this.page.set(this.after());
    this.uploaded.set(null);
    this.after.set(null);
  }

  ngOnDestroy(): void {
    for (const chosen of Object.values(this.files())) {
      if (chosen?.preview) URL.revokeObjectURL(chosen.preview);
    }
  }

  choose(field: ReceiptField, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const problem = !ACCEPTED.includes(file.type)
      ? 'Choose a photo (JPG, PNG or WebP) or a PDF.'
      : file.size > MAX_BYTES
        ? 'This file is larger than 5 MB. Choose a smaller photo or PDF.'
        : null;
    this.fileErrors.update((errors) => ({ ...errors, [field]: problem ?? undefined }));
    if (problem) return;

    const previous = this.files()[field];
    if (previous?.preview) URL.revokeObjectURL(previous.preview);
    this.files.update((files) => ({
      ...files,
      [field]: { file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null },
    }));
  }

  remove(field: ReceiptField): void {
    const previous = this.files()[field];
    if (previous?.preview) URL.revokeObjectURL(previous.preview);
    this.files.update((files) => ({ ...files, [field]: undefined }));
  }

  /** Shown as typed, grouped 4-4-4 the way Remita prints it. */
  onRrr(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 12);
    this.rrr.set(digits.replace(/(\d{4})(?=\d)/g, '$1-'));
  }

  onAmount(event: Event): void {
    this.amountNaira.set((event.target as HTMLInputElement).value);
  }

  onDeclared(event: Event): void {
    this.declared.set((event.target as HTMLInputElement).checked);
  }

  size(file: File): string {
    return file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  }

  money(kobo: number): string {
    return formatNaira(kobo);
  }

  submit(): void {
    this.touched.set(true);
    const files = this.files();
    if (!this.ready() || !files.schoolFeeReceipt || !files.remitaReceipt || this.saving()) return;

    this.saving.set(true);
    this.api
      .uploadReceipt({
        rrr: this.rrrDigits(),
        amountKobo: this.amountKobo(),
        schoolFeeReceipt: files.schoolFeeReceipt.file,
        remitaReceipt: files.remitaReceipt.file,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.saving.set(false);
          this.uploaded.set(resp.data);
          window.scrollTo({ top: 0 });
          // A receipt that clears an overdue deadline opens a locked portal now.
          this.holds
            .refresh()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ error: () => undefined });
          // Where the fees stand now, and what the receipt opened.
          this.api
            .mine()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: (page) => this.after.set(page.data), error: () => undefined });
        },
        error: (err) => {
          this.saving.set(false);
          // A 400 is toasted by the error interceptor in the server's words.
          if (err?.status === 400) return;
          // A reused RRR or file (409), or a file over the limit (413), is
          // the student's to fix — say exactly what the server said.
          const theirs = [409, 413].includes(err?.status);
          this.toast.showNotification(
            'error',
            'Could not upload the receipt',
            (theirs && err?.error?.message) || 'Nothing was saved. Please try again in a moment.'
          );
        },
      });
  }
}

/** `123456789012` → `1234-5678-9012`, as Remita prints it. */
function groupRrr(rrr: string): string {
  return rrr.replace(/(\d{4})(?=\d)/g, '$1-');
}
