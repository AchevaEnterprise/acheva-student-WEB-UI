import { IPaymentReceipt } from '../models/payment.model';
import { buildReceiptPdf } from './receipt-pdf';

/**
 * The receipt's verification block (2026-11-11): a QR to verify.acheva.app,
 * the serial beside it, and what to compare — or nothing at all when the
 * payment has no serial, never a code that resolves to nothing.
 */
const receipt: IPaymentReceipt = {
  reference: 'TXNPK0BX335GV13S',
  issuedAt: '2026-10-21T07:54:00Z',
  paidAt: '2026-10-21T07:54:00Z',
  description: 'Transcript Fee',
  purpose: 'DUES',
  amount: 200000,
  currency: 'NGN',
  status: 'COMPLETED',
  paymentMethod: 'PAYSTACK',
  payer: { name: 'Abigail Baker', registrationNumber: '20234671566', email: 'a@b.com' },
  department: { name: 'Mathematics Department', code: 'MTH' },
  item: { name: 'Transcript Fee', session: null },
  standing: null,
} as unknown as IPaymentReceipt;

const text = (doc: unknown) => JSON.stringify(doc);

describe('buildReceiptPdf — verification', () => {
  it('prints the QR, the serial and where to check it', () => {
    const doc = buildReceiptPdf(receipt, 'FUTO', {
      serial: 'ACV-7F3A-91BD-4KX2',
      verifyUrl: 'https://verify.acheva.app/ACV-7F3A-91BD-4KX2',
      qrDataUrl: 'data:image/png;base64,AAA',
    });
    const all = text(doc);
    expect(all).toContain('data:image/png;base64,AAA');
    expect(all).toContain('ACV-7F3A-91BD-4KX2');
    expect(all).toContain('VERIFY THIS RECEIPT');
    expect(all).toContain('enter the serial at verify.acheva.app');
  });

  it('prints no verification block when there is no serial', () => {
    const all = text(buildReceiptPdf(receipt, 'FUTO'));
    expect(all).not.toContain('VERIFY THIS RECEIPT');
    expect(all).not.toContain('data:image');
  });
});
