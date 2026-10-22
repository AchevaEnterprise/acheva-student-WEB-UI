import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { IAPIResponse } from '../../../../core/models/api-response.model';
import { formatNaira } from '../../../../core/naira';
import { ToastService } from '../../../../core/utility/toast.service';
import { Button } from '../../../../shared/form/button/button';
import { TranscriptExportService } from '../../export/transcript-export.service';

/**
 * "Download academic record" — the student's whole published history as one
 * PDF, carrying a serial and QR that resolve to the public verifier.
 *
 * Deliberately not per-session: the document spans every session the student
 * has results for, so it belongs beside the session list rather than inside
 * any one entry of it.
 *
 * ## It is paid for, and the page has to say so BEFORE the click
 *
 * `POST /transcripts/me/issue` spends an entitlement and answers 402 without
 * one. Until now this component did not know that existed: it called issue
 * directly and turned the 402 into "something went wrong building the
 * document", which is both wrong and unactionable. The price is now shown up
 * front, because being told the cost after pressing a button that looked
 * free is the worst order to learn it in.
 *
 * Reading the record stays free — `GET /transcripts/me` mints nothing. A
 * student should always be able to look at their own results.
 */
@Component({
  selector: 'app-transcript-download',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './transcript-download.html',
})
export class TranscriptDownload implements OnInit {
  private readonly transcriptService = inject(TranscriptExportService);
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  readonly downloading = signal(false);
  readonly starting = signal(false);

  /** Have they already paid for a download that has not been spent? */
  readonly entitled = signal(false);
  readonly feeKobo = signal<number | null>(null);
  readonly ready = signal(false);

  ngOnInit(): void {
    void this.refresh();
  }

  /**
   * Both questions at once: what it costs, and whether they already hold a
   * credit. Asked on load rather than on click so the button can name the
   * price it is about to charge.
   */
  private async refresh(): Promise<void> {
    try {
      const [fees, entitlement] = await Promise.all([
        firstValueFrom(
          this.http.get<IAPIResponse<{ transcriptFeeKobo: number }>>(
            // `/platform-settings/fees`, not `/fees` — the controller is
            // prefixed, and the short path 404s.
            `${environment.BASE_URL}/platform-settings/fees`
          )
        ),
        firstValueFrom(
          this.http.get<IAPIResponse<{ entitled: boolean }>>(
            `${environment.BASE_URL}/transactions/transcript/entitlement`
          )
        ),
      ]);

      this.feeKobo.set(fees.data.transcriptFeeKobo);
      this.entitled.set(entitlement.data.entitled);
    } catch {
      // Leave the fee unknown rather than guessing at it. The button still
      // works; the student is told the price at the point of payment.
      this.feeKobo.set(null);
    } finally {
      this.ready.set(true);
    }
  }

  get label(): string {
    if (this.entitled()) return 'Download academic record';
    const fee = this.feeKobo();
    return fee ? `Pay ${formatNaira(fee)} and download` : 'Download academic record';
  }

  async act(): Promise<void> {
    if (this.entitled()) {
      await this.download();
      return;
    }
    await this.startPayment();
  }

  /**
   * Hand the student to the provider.
   *
   * A full-page redirect rather than a popup — phone browsers block popups,
   * and losing the window mid-payment is the worst moment for it. They come
   * back to `/dues/complete`, which asks the server what actually happened.
   */
  private async startPayment(): Promise<void> {
    if (this.starting()) return;
    this.starting.set(true);

    try {
      const response = await firstValueFrom(
        this.http.post<IAPIResponse<{ paymentLink: string }>>(
          `${environment.BASE_URL}/transactions/transcript`,
          {}
        )
      );

      window.location.href = response.data.paymentLink;
    } catch (error: unknown) {
      const message = (error as { error?: { message?: string } })?.error?.message;
      this.toast.showNotification(
        'error',
        'Could not start the payment',
        message ?? 'Please try again in a moment.'
      );
      this.starting.set(false);
    }
  }

  async download(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);

    try {
      // Issuing and downloading are one action from here: the serial is minted
      // for a copy that is about to exist, and the response carries the exact
      // snapshot it vouches for — so the file rendered below is the file the
      // verifier will show.
      const response = await firstValueFrom(this.transcriptService.issueMyTranscript());
      const issued = response.data;

      if (issued.transcript.sessions.length === 0) {
        this.toast.showNotification(
          'warning',
          'Nothing to download yet',
          'None of your results have been published yet. Your academic ' +
            'record will be available once they are.'
        );
        return;
      }

      const qrDataUrl = await this.transcriptService.qrDataUrl(issued.verifyUrl);

      await this.transcriptService.downloadPdf(issued.transcript, {
        serial: issued.serial,
        verifyUrl: issued.verifyUrl,
        qrDataUrl,
      });

      // The credit is spent. Asking again keeps the button honest about
      // what the next press will cost.
      this.entitled.set(false);

      this.toast.showNotification(
        'success',
        'Academic record downloaded',
        `Serial ${issued.serial}. Anyone you give this to can check it at ` + 'verify.acheva.app.'
      );
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;

      // 402 means the credit was gone by the time we asked — two tabs, or a
      // refund. Say what it is, not "something went wrong".
      if (status === 402) {
        this.entitled.set(false);
        this.toast.showNotification(
          'warning',
          'This download needs to be paid for',
          'Your previous download has already been used. Press the button ' +
            'again to pay for another copy.'
        );
        return;
      }

      this.toast.showNotification(
        'error',
        'Could not prepare your record',
        'Something went wrong building the document. Please try again.'
      );
    } finally {
      this.downloading.set(false);
    }
  }
}
