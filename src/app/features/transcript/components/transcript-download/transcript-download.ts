import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
 */
@Component({
  selector: 'app-transcript-download',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button],
  templateUrl: './transcript-download.html',
})
export class TranscriptDownload {
  private readonly transcriptService = inject(TranscriptExportService);
  private readonly toast = inject(ToastService);

  downloading = signal(false);

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

      this.toast.showNotification(
        'success',
        'Academic record downloaded',
        `Serial ${issued.serial}. Anyone you give this to can check it at ` + 'verify.acheva.app.'
      );
    } catch {
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
