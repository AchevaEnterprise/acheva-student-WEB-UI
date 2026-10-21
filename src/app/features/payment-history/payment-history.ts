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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';

import { AppState } from '../../core/store/app.state';
import { profileSelector } from '../../core/store/profile/profile.selector';
import { formatNaira } from '../../core/naira';
import { ToastService } from '../../core/utility/toast.service';
import { EmptyState } from '../../shared/empty-state/empty-state';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { ReceiptExportService } from './export/receipt-export.service';
import { IPaymentReceipt, IPaymentRow, PaymentStatus } from './models/payment.model';
import { PaymentsService } from './services/payments.service';

/**
 * Payments, and the receipt for each one.
 *
 * ## Failed attempts are shown, not hidden
 *
 * A student whose card was debited and who then saw an error needs to see
 * that the attempt exists before deciding whether to pay again. A list that
 * shows only successes makes a real debit look like it never happened, and
 * the student pays twice.
 *
 * ## The preview IS the PDF
 *
 * The right-hand pane renders the very file the download button produces,
 * not an HTML lookalike. A separate preview layout would be a second
 * definition of the document, free to drift from the one people actually
 * hold — and the one they hold is the one that settles arguments.
 *
 * ## Only completed payments have a receipt
 *
 * Selecting a pending or failed row shows what happened and offers nothing
 * to download. A receipt for an unsettled payment is a document a student
 * could take to a bursar, so the server refuses to produce one and this page
 * does not ask.
 */
@Component({
  selector: 'app-payment-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyState, Skeleton],
  templateUrl: './payment-history.html',
  styleUrl: './payment-history.scss',
})
export class PaymentHistory implements OnInit, OnDestroy {
  private readonly api = inject(PaymentsService);
  private readonly exporter = inject(ReceiptExportService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);
  private readonly store = inject(Store<AppState>);
  private readonly destroyRef = inject(DestroyRef);

  private readonly profile = this.store.selectSignal(profileSelector);

  readonly loading = signal(true);
  readonly rows = signal<IPaymentRow[]>([]);
  readonly selected = signal<IPaymentRow | null>(null);
  readonly receipt = signal<IPaymentReceipt | null>(null);
  readonly receiptLoading = signal(false);
  readonly downloading = signal(false);

  /** Blob URL of the rendered PDF. Revoked whenever it is replaced. */
  private previewObjectUrl: string | null = null;
  readonly previewUrl = signal<SafeResourceUrl | null>(null);

  readonly isEmpty = computed(() => !this.loading() && this.rows().length === 0);

  /** The university name, for the document's "on behalf of" line. */
  private readonly institution = computed(() => this.profile()?.student?.school?.name ?? '');

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .history()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.rows.set(resp.data.items);
          this.loading.set(false);

          // Open the newest receipt straight away: a student arriving from a
          // payment is here for the one they just made, and making them click
          // the only row that matters is a step with no decision in it.
          const first = resp.data.items.find((row) => row.receiptAvailable);
          if (first) this.select(first);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.showNotification(
            'error',
            'Could not load your payments',
            err?.error?.message ?? 'Please try again.'
          );
        },
      });
  }

  select(row: IPaymentRow): void {
    if (this.selected()?.reference === row.reference) return;

    this.selected.set(row);
    this.receipt.set(null);
    this.revokePreview();

    if (!row.receiptAvailable) return;

    this.receiptLoading.set(true);
    this.api
      .receipt(row.reference)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.receipt.set(resp.data);
          this.renderPreview(resp.data);
        },
        error: (err) => {
          this.receiptLoading.set(false);
          this.toast.showNotification(
            'error',
            'Could not load that receipt',
            err?.error?.message ?? 'Please try again.'
          );
        },
      });
  }

  private async renderPreview(receipt: IPaymentReceipt): Promise<void> {
    try {
      const url = await this.exporter.previewUrl(receipt, this.institution());
      this.previewObjectUrl = url;
      this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } catch {
      // The receipt itself loaded — only the rendering failed, so the details
      // beside the pane still stand and the download is still worth offering.
      this.toast.showNotification(
        'warning',
        'Preview unavailable',
        'The receipt could not be previewed here, but you can still download it.'
      );
    } finally {
      this.receiptLoading.set(false);
    }
  }

  async download(): Promise<void> {
    const receipt = this.receipt();
    if (!receipt || this.downloading()) return;

    this.downloading.set(true);
    try {
      await this.exporter.download(receipt, this.institution());
    } catch {
      this.toast.showNotification(
        'error',
        'Download failed',
        'The receipt could not be generated. Please try again.'
      );
    } finally {
      this.downloading.set(false);
    }
  }

  /** Object URLs are held by the document until explicitly released. */
  private revokePreview(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewUrl.set(null);
  }

  money(kobo: number): string {
    return formatNaira(kobo);
  }

  /** `21 Oct 2026` — day-first, never the runtime's locale. See receipt-pdf.ts. */
  shortDate(iso: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  /** What the payment was for, in words rather than an enum. */
  purposeLabel(row: IPaymentRow): string {
    if (row.purpose === 'TRANSCRIPT') return 'Transcript fee';
    if (row.purpose === 'DUES') return row.item.name || 'Departmental dues';
    return row.description || 'Payment';
  }

  statusLabel(status: PaymentStatus): string {
    if (status === 'COMPLETED') return 'Paid';
    if (status === 'PENDING') return 'Not completed';
    if (status === 'FAILED') return 'Failed';
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  /**
   * Only three visual states, not seven.
   *
   * REVERSED, REFUNDED, REJECTED and CANCELLED all mean "this did not leave
   * you paid", and giving each its own colour would make the list a legend
   * to decode rather than a list to read. The exact word is still printed.
   */
  statusTone(status: PaymentStatus): 'paid' | 'pending' | 'failed' {
    if (status === 'COMPLETED') return 'paid';
    if (status === 'PENDING') return 'pending';
    return 'failed';
  }
}
