import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../../environments/environment';
import { IAPIResponse } from '../../../core/models/api-response.model';
import { formatNaira } from '../../../core/naira';
import { Skeleton } from '../../../shared/skeleton/skeleton';

interface IVerifiedPayment {
  readonly reference: string;
  readonly status: string;
  /** KOBO. */
  readonly amount: number;
  readonly currency: string;
  readonly purpose: string;
}

/**
 * Where Paystack sends the student back to.
 *
 * Until now this route did not exist: the provider's `callback_url` is
 * `<app>/dues/complete`, which fell through the `**` wildcard to the
 * dashboard. A student paid real money and the app said nothing at all
 * about it — the most alarming possible moment to be told nothing.
 *
 * The page asks the server what actually happened rather than trusting the
 * redirect. A browser coming back from a provider proves only that the
 * browser came back; whether the money moved is the server's answer, and
 * the webhook is what settles it.
 */
@Component({
  selector: 'app-payment-complete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Skeleton],
  templateUrl: './payment-complete.html',
  styleUrl: './payment-complete.scss',
})
export class PaymentComplete implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly checking = signal(true);
  readonly payment = signal<IVerifiedPayment | null>(null);
  readonly failed = signal(false);

  readonly reference = computed(() => this.route.snapshot.queryParamMap.get('reference') ?? '');

  readonly settled = computed(() => this.payment()?.status === 'COMPLETED');
  readonly isTranscript = computed(() => this.payment()?.purpose === 'TRANSCRIPT');

  ngOnInit(): void {
    const reference = this.reference();
    if (!reference) {
      // Nothing to confirm — somebody opened the URL directly.
      this.router.navigate(['/payment-history']);
      return;
    }

    this.verify();
  }

  /**
   * Ask the server, not the URL.
   *
   * The endpoint is scoped to the payer, so a reference pasted from someone
   * else's browser history answers 404 rather than confirming a stranger's
   * payment.
   */
  verify(): void {
    this.checking.set(true);
    this.failed.set(false);

    this.http
      .get<IAPIResponse<IVerifiedPayment>>(
        `${environment.BASE_URL}/transactions/verify/${encodeURIComponent(this.reference())}`
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.payment.set(resp.data);
          this.checking.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.checking.set(false);
        },
      });
  }

  money(kobo: number | undefined): string {
    return formatNaira(kobo ?? 0);
  }
}
