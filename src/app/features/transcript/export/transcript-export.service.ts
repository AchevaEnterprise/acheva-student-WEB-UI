import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import { IIssuedTranscript, ITranscript } from '../models/transcript.model';
import { TranscriptProvenance, buildTranscriptPdf, transcriptFileName } from './transcript-pdf';

/**
 * The student's own academic record, and the PDF they take away.
 *
 * The routes here are the `me` pair: the student id comes from the token, not
 * from a path parameter, so there is nothing on this side to tamper with. The
 * staff portal's copy of this service addresses a named student instead and is
 * scoped to the Course Advisor's own department server-side.
 *
 * pdfmake and qrcode are both heavy and neither is needed until someone
 * actually downloads, so both load through a dynamic `import()` inside the
 * method that uses them.
 */
@Injectable({ providedIn: 'root' })
export class TranscriptExportService {
  private readonly http = inject(HttpClient);
  private readonly transcriptsUrl = `${environment.BASE_URL}/transcripts`;

  /** pdfmake, initialised once per session. */
  private pdfMake: Promise<PdfMakeStatic> | null = null;

  /** `GET /transcripts/me` — preview. Mints no serial. */
  getMyTranscript(): Observable<IAPIResponse<ITranscript>> {
    return this.http.get<IAPIResponse<ITranscript>>(`${this.transcriptsUrl}/me`);
  }

  /**
   * `POST /transcripts/me/issue` — mint the serial for the copy about to be
   * downloaded, and get back the exact snapshot it vouches for.
   *
   * Only downloads call this. Viewing your own record mints nothing, so every
   * serial that exists belongs to a document someone actually holds.
   */
  issueMyTranscript(): Observable<IAPIResponse<IIssuedTranscript>> {
    return this.http.post<IAPIResponse<IIssuedTranscript>>(`${this.transcriptsUrl}/me/issue`, {});
  }

  /**
   * A blob URL of the PDF, for the preview pane.
   *
   * The preview renders the very file the download produces — not an HTML
   * lookalike. A separate preview layout would be a second definition of the
   * document, free to drift from the one that actually gets printed.
   */
  async previewUrl(transcript: ITranscript, provenance?: TranscriptProvenance): Promise<string> {
    const pdf = await this.createPdf(transcript, provenance);
    const blob = await pdf.getBlob();
    return URL.createObjectURL(blob);
  }

  /**
   * The QR as a PNG data URI, sized and error-corrected for a printed page.
   *
   * `M` correction survives the speckle a photocopier adds; the serial is
   * printed beside it in text anyway, for when a scan fails entirely.
   */
  async qrDataUrl(verifyUrl: string): Promise<string> {
    const QRCode = await import('qrcode');
    return QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  }

  async downloadPdf(transcript: ITranscript, provenance?: TranscriptProvenance): Promise<void> {
    const pdf = await this.createPdf(transcript, provenance);
    pdf.download(`${transcriptFileName(transcript)}.pdf`);
  }

  private async createPdf(
    transcript: ITranscript,
    provenance?: TranscriptProvenance
  ): Promise<PdfDocument> {
    const pdfMake = await this.loadPdfMake();
    return pdfMake.createPdf(buildTranscriptPdf(transcript, provenance));
  }

  private loadPdfMake(): Promise<PdfMakeStatic> {
    // Cached: the font file is ~1MB and re-registering it on every export
    // would re-parse it each time.
    this.pdfMake ??= (async () => {
      const [pdfMakeModule, vfsModule] = await Promise.all([
        import('pdfmake/build/pdfmake'),
        import('pdfmake/build/vfs_fonts'),
      ]);

      const pdfMake = (pdfMakeModule.default ?? pdfMakeModule) as unknown as PdfMakeStatic;
      const vfs = (vfsModule as { default?: unknown }).default ?? vfsModule;
      pdfMake.addVirtualFileSystem(vfs);
      return pdfMake;
    })();

    return this.pdfMake;
  }
}

/** The slice of pdfmake's surface this service uses. */
interface PdfMakeStatic {
  addVirtualFileSystem(vfs: unknown): void;
  createPdf(definition: Record<string, unknown>): PdfDocument;
}

interface PdfDocument {
  getBlob(): Promise<Blob>;
  download(fileName: string): void;
}
