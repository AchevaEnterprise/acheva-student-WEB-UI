import { Injectable } from '@angular/core';

import { IPaymentReceipt } from '../models/payment.model';
import { ReceiptDocument, buildReceiptPdf, receiptFileName } from './receipt-pdf';

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
    const pdfMake = await this.loadPdfMake();
    return pdfMake.createPdf(buildReceiptPdf(receipt, institution) as ReceiptDocument);
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
