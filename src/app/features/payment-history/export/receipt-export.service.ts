import { Injectable } from '@angular/core';

import { IPaymentReceipt } from '../models/payment.model';
import {
  ReceiptDocument,
  ReceiptProvenance,
  buildReceiptPdf,
  receiptFileName,
} from './receipt-pdf';

/**
 * Turns a receipt payload into the PDF a student takes away.
 *
 * pdfmake is ~1MB with its font file and nothing on the payments page needs
 * it until somebody actually downloads, so it loads through a dynamic
 * `import()` and is cached for the session — re-registering the virtual file
 * system on every export would re-parse the font each time.
 *
 * Same shape as `TranscriptExportService`, deliberately: two download paths
 * that load the same library in two different ways is two places to get it
 * wrong.
 */
@Injectable({ providedIn: 'root' })
export class ReceiptExportService {
  private pdfMake: Promise<PdfMakeStatic> | null = null;

  /**
   * A blob URL of the PDF, for the preview pane.
   *
   * The preview IS the file the download produces. A separate HTML lookalike
   * would be a second definition of the document, free to drift from the one
   * that actually gets printed.
   */
  async previewUrl(receipt: IPaymentReceipt, institution?: string): Promise<string> {
    const pdf = await this.createPdf(receipt, institution);
    const blob = await pdf.getBlob();
    return URL.createObjectURL(blob);
  }

  async download(receipt: IPaymentReceipt, institution?: string): Promise<void> {
    const pdf = await this.createPdf(receipt, institution);
    pdf.download(`${receiptFileName(receipt)}.pdf`);
  }

  private async createPdf(receipt: IPaymentReceipt, institution?: string): Promise<PdfDocument> {
    const [pdfMake, provenance] = await Promise.all([
      this.loadPdfMake(),
      this.provenanceFor(receipt),
    ]);
    return pdfMake.createPdf(buildReceiptPdf(receipt, institution, provenance) as ReceiptDocument);
  }

  /**
   * The serial and QR for the receipt — the preview carries them too, since
   * it IS the downloaded file. None when the server had no serial to give.
   */
  private async provenanceFor(receipt: IPaymentReceipt): Promise<ReceiptProvenance | undefined> {
    const verification = receipt.verification;
    if (!verification) return undefined;
    return {
      serial: verification.serial,
      verifyUrl: verification.verifyUrl,
      qrDataUrl: await this.qrDataUrl(verification.verifyUrl),
    };
  }

  /**
   * The QR as a PNG data URI — the transcript's settings: `M` correction
   * survives a photocopier's speckle, and the serial is printed beside it for
   * when a scan fails entirely. `qrcode` loads only when a receipt does.
   */
  private async qrDataUrl(verifyUrl: string): Promise<string> {
    const QRCode = await import('qrcode');
    return QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 240,
      color: { dark: '#000000', light: '#FFFFFF' },
    });
  }

  private loadPdfMake(): Promise<PdfMakeStatic> {
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
