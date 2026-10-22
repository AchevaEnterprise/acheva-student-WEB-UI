/**
 * The receipt a student downloads after paying departmental dues or a
 * transcript fee.
 *
 * pdfmake rather than CSS print, for the reason the transcript uses it: this
 * is a document people file, attach and hand over, and it has to come out the
 * same on every machine. A browser's print dialog is not a document format.
 *
 * ## What this document does NOT claim
 *
 * Acheva collects on the department's behalf; it is not the Bursary and does
 * not issue receipts in the Bursary's name. So there is **no university
 * masthead, no official seal and no signature block** — the same restraint
 * the transcript exercises about the Registrar, for the same reason. What it
 * states is exactly what Acheva can vouch for: this person paid this amount,
 * on this date, against this charge, through this platform.
 *
 * ## There is no QR
 *
 * The transcript carries one because it mints a `DocumentIssuance` serial
 * that resolves at verify.acheva.app. A payment has no such serial — its
 * identity is the provider reference. Printing a QR to a URL that does not
 * resolve would look like verification while providing none.
 */
import { formatNaira } from '../../../core/naira';
import { IPaymentReceipt } from '../models/payment.model';

/**
 * Structural, not pdfmake's own type: the library loads lazily and its types
 * must not be pulled into the eager bundle.
 */
export interface ReceiptDocument {
  content: unknown[];
  [key: string]: unknown;
}

/** Brand blue. The single accent — everything else is black on white. */
const ACCENT = '#2793FF';
const RULE = '#D8DEE6';
const MUTED = '#5B6472';

/** Label column width, in points. The value column takes what is left. */
const LABEL_WIDTH = 150;

export function buildReceiptPdf(receipt: IPaymentReceipt, institution?: string): ReceiptDocument {
  return {
    pageSize: 'A4',
    pageMargins: [48, 48, 48, 54],
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#111827' },

    footer: {
      margin: [48, 16, 48, 0],
      stack: [
        { canvas: [rule(499)] },
        {
          text: disclaimer(receipt, institution),
          style: 'footnote',
          margin: [0, 8, 0, 0],
        },
      ],
    },

    content: [
      masthead(receipt, institution),
      amountBlock(receipt),
      detailTable(receipt),
      ...(receipt.standing ? [standingBlock(receipt)] : []),
    ],

    styles: {
      wordmark: { fontSize: 15, bold: true, letterSpacing: 1.2 },
      documentTitle: { fontSize: 10, color: MUTED, letterSpacing: 2 },
      issuedTo: { fontSize: 9, color: MUTED, alignment: 'right' },
      amount: { fontSize: 30, bold: true },
      amountLabel: { fontSize: 9, color: MUTED, letterSpacing: 1.4 },
      paidOn: { fontSize: 9.5, color: MUTED },
      sectionLabel: {
        fontSize: 9,
        bold: true,
        color: MUTED,
        letterSpacing: 1.2,
      },
      label: { fontSize: 9.5, color: MUTED },
      value: { fontSize: 10 },
      valueStrong: { fontSize: 10, bold: true },
      /** The reference is transcribed by hand over a phone. Give it room. */
      reference: { fontSize: 11, bold: true, characterSpacing: 0.6 },
      footnote: { fontSize: 7.5, color: MUTED, lineHeight: 1.35 },
    },
  };
}

/** `Acheva_Receipt_TXN123_Departmental-Dues` — no extension. */
export function receiptFileName(receipt: IPaymentReceipt): string {
  const item = (receipt.item.name || 'Payment').replace(/[^\w]+/g, '-');
  return `Acheva_Receipt_${receipt.reference}_${item}`.replace(/-+$/, '');
}

/* ------------------------------------------------------------------ */

/**
 * Acheva's name, the document's name, and who it is for — not the
 * university's crest. See the note at the top of this file.
 */
function masthead(receipt: IPaymentReceipt, institution?: string): Record<string, unknown> {
  return {
    margin: [0, 0, 0, 26],
    stack: [
      {
        columns: [
          {
            stack: [
              { text: 'ACHEVA', style: 'wordmark' },
              {
                text: 'PAYMENT RECEIPT',
                style: 'documentTitle',
                margin: [0, 3, 0, 0],
              },
            ],
          },
          /**
           * The institution only. The department and the session are
           * structured facts and are stated in the table below — printing
           * them here as well made the head and the table repeat each other,
           * which reads as a document assembled rather than designed.
           */
          {
            width: 'auto',
            text: institution ?? '',
            style: 'issuedTo',
            margin: [0, 3, 0, 0],
          },
        ],
      },
      { canvas: [rule(499, ACCENT, 2)], margin: [0, 12, 0, 0] },
    ],
  };
}

/**
 * The amount, as the largest thing on the page.
 *
 * A receipt is read to confirm one figure. Burying it in a table of equals
 * makes the reader hunt for the only line they came for.
 */
function amountBlock(receipt: IPaymentReceipt): Record<string, unknown> {
  return {
    margin: [0, 0, 0, 26],
    stack: [
      { text: 'AMOUNT PAID', style: 'amountLabel' },
      { text: formatNaira(receipt.amount), style: 'amount', margin: [0, 4, 0, 0] },
      {
        text: `Paid ${longDate(receipt.paidAt)}`,
        style: 'paidOn',
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

function detailTable(receipt: IPaymentReceipt): Record<string, unknown> {
  const rows: [string, string, boolean?][] = [
    ['Reference', receipt.reference, true],
    // Upper-cased the way the transcript does it: names are stored however
    // they were typed at enrolment ("abigail baker"), and a receipt that
    // prints that verbatim looks like a draft rather than a record.
    ['Paid by', receipt.payer.name?.toUpperCase() ?? '—'],
    ['Registration number', receipt.payer.registrationNumber ?? '—'],
    ['Email', receipt.payer.email ?? '—'],
    ['Paid for', receipt.item.name],
  ];

  if (receipt.item.session) {
    rows.push(['Session', receipt.item.session]);
  }
  if (receipt.department.name) {
    rows.push(['Department', receipt.department.name]);
  }
  rows.push(['Payment method', methodLabel(receipt.paymentMethod)]);

  return {
    margin: [0, 0, 0, 24],
    table: {
      widths: [LABEL_WIDTH, '*'],
      body: rows.map(([label, value, isReference]) => [
        { text: label, style: 'label', margin: [0, 5, 0, 5] },
        {
          text: value,
          style: isReference ? 'reference' : 'value',
          margin: [0, 5, 0, 5],
        },
      ]),
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === node.table.body.length ? 0 : 0.5,
      vLineWidth: () => 0,
      hLineColor: () => RULE,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
  };
}

/**
 * Where this payment leaves the student.
 *
 * The question a dues receipt is actually brought to answer is "how much is
 * still owed" — an amount and a date alone cannot answer it. Absent on a
 * transcript fee, which runs against no plan.
 */
function standingBlock(receipt: IPaymentReceipt): Record<string, unknown> {
  const standing = receipt.standing;
  if (!standing) return {};

  const rows: [string, string, boolean?][] = [
    ['Total for the session', formatNaira(standing.totalKobo)],
    ['Paid to date', formatNaira(standing.paidKobo)],
    [
      standing.settled ? 'Outstanding' : 'Still outstanding',
      formatNaira(standing.outstandingKobo),
      true,
    ],
  ];

  return {
    stack: [
      {
        text: standing.settled ? 'DUES SETTLED IN FULL' : 'DUES STANDING AFTER THIS PAYMENT',
        style: 'sectionLabel',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          widths: [LABEL_WIDTH, '*'],
          body: rows.map(([label, value, strong]) => [
            { text: label, style: 'label', margin: [0, 4, 0, 4] },
            {
              text: value,
              style: strong ? 'valueStrong' : 'value',
              margin: [0, 4, 0, 4],
            },
          ]),
        },
        layout: {
          hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
            i === 0 || i === node.table.body.length ? 0 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => RULE,
          paddingLeft: () => 0,
          paddingRight: () => 0,
        },
      },
      {
        text: paymentCountLine(standing.paymentNumber, standing.instalmentsAllowed),
        style: 'paidOn',
        margin: [0, 10, 0, 0],
      },
    ],
  };
}

/**
 * "This was payment 1 of up to 3."
 *
 * "of up to" rather than "of": the plan ALLOWS three instalments, it does not
 * require them. A student who cleared the whole due in one transfer has made
 * payment 1 and owes nothing further, and "payment 1 of 3" would read to them
 * as two more to come.
 */
function paymentCountLine(made: number, allowed: number): string {
  if (allowed <= 1) {
    return made === 1 ? 'Paid in a single payment.' : `This was payment ${made}.`;
  }
  return `This was payment ${made} of up to ${allowed} allowed for this plan.`;
}

function disclaimer(receipt: IPaymentReceipt, institution?: string): string {
  const owner = receipt.department.name ?? 'the department';
  const where = institution ? `, ${institution}` : '';

  return (
    `Collected through Acheva on behalf of ${owner}${where}. This confirms ` +
    `a payment received by Acheva and is not a receipt of the Bursary. ` +
    `Quote reference ${receipt.reference} in any query. ` +
    `Computer-generated — no signature is required.`
  );
}

/* ------------------------------------------------------------------ */

function rule(width: number, color = RULE, thickness = 0.8) {
  return {
    type: 'line',
    x1: 0,
    y1: 0,
    x2: width,
    y2: 0,
    lineWidth: thickness,
    lineColor: color,
  };
}

/**
 * `21 October 2026 at 7:54 AM`.
 *
 * Hand-formatted and day-first, never `toLocaleDateString(undefined)` — the
 * runtime's locale renders `10/21/2026` on a US-configured machine, and on a
 * receipt the date is part of what the document asserts. Same rule as
 * `message-day.ts`.
 */
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function longDate(iso: string | null): string {
  if (!iso) return 'date unavailable';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'date unavailable';

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return (
    `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} ` +
    `at ${hour12}:${minutes} ${suffix}`
  );
}

function methodLabel(method: string | null): string {
  if (!method) return '—';
  // `PAYSTACK` on the wire; "Paystack" on a document somebody reads.
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
}
