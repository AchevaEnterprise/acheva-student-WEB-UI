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
import { DatePipe } from '@angular/common';

import { ToastService } from '../../core/utility/toast.service';
import { Skeleton } from '../../shared/skeleton/skeleton';
import { ChatThread } from './components/chat-thread/chat-thread';
import {
  IConversationSummary,
  IDirectoryPerson,
  IMessage,
  IStreamEvent,
} from './models/messaging.model';
import { MessagingService } from './services/messaging.service';

/**
 * Messages, as a student sees them.
 *
 * The same two-pane chat as the staff portal, with the parts a student has no
 * use for taken out rather than hidden. There is no people picker, because a
 * student can write to exactly one person — their Course Advisor — so the
 * button opens that thread directly instead of asking them to find someone in
 * a list of one. There is no announcement composer, because students do not
 * address rooms; they receive notices from their Head, Dean and advisor, and
 * those threads are read-only by design.
 *
 * Support is deliberately NOT here. Writing to Acheva is a different
 * relationship from writing to your department, and it has its own page.
 */
@Component({
  selector: 'app-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Skeleton, ChatThread],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages implements OnInit {
  private readonly messaging = inject(MessagingService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly conversations = signal<IConversationSummary[]>([]);
  readonly messages = signal<IMessage[]>([]);
  readonly active = signal<IConversationSummary | null>(null);
  readonly loadingInbox = signal(true);
  readonly loadingThread = signal(false);
  readonly search = signal('');
  /** True while the "message my advisor" button is resolving who that is. */
  readonly opening = signal(false);

  /** Support has its own page; it must not appear in this list. */
  readonly visible = computed(() => this.conversations().filter((c) => c.kind !== 'SUPPORT'));

  readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.visible();
    return this.visible().filter((c) => (c.title ?? '').toLowerCase().includes(term));
  });

  readonly totalUnread = computed(() => this.visible().reduce((sum, c) => sum + c.unread, 0));

  ngOnInit(): void {
    this.loadInbox();

    this.messaging.start();
    this.messaging.stream$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onStreamEvent(event));

    this.destroyRef.onDestroy(() => this.messaging.setActiveConversation(null));
  }

  private loadInbox(): void {
    this.messaging
      .inbox()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.conversations.set([...resp.data.conversations]);
          this.loadingInbox.set(false);
        },
        error: () => this.loadingInbox.set(false),
      });
  }

  open(conversation: IConversationSummary): void {
    this.active.set(conversation);
    this.messaging.setActiveConversation(conversation.id);
    this.loadingThread.set(true);
    this.messages.set([]);

    this.messaging
      .thread(conversation.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          // Newest first on the wire for cursor paging; oldest at the top for
          // a reader, as every chat does it.
          this.messages.set([...resp.data.messages].reverse());
          this.loadingThread.set(false);
        },
        error: () => this.loadingThread.set(false),
      });

    if (conversation.unread > 0) this.clearUnread(conversation.id);
  }

  private clearUnread(conversationId: string): void {
    this.conversations.update((rows) =>
      rows.map((row) => (row.id === conversationId ? { ...row, unread: 0 } : row))
    );
    this.messaging
      .markRead(conversationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  /**
   * Open the thread with my Course Advisor.
   *
   * The directory is asked who that is rather than the student being shown a
   * picker: for a student it returns exactly their advisor and nobody else, so
   * a list would be a list of one. When no advisor is assigned to their level
   * the server says so in words, and that is what gets shown — an empty picker
   * would read as a broken screen.
   */
  messageAdvisor(): void {
    const existing = this.visible().find((c) => c.kind === 'ADVISORY');
    if (existing) {
      this.open(existing);
      return;
    }

    this.opening.set(true);
    this.messaging
      .directory('STAFF')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const advisor = resp.data.groups[0]?.people[0];
          if (!advisor) {
            this.opening.set(false);
            this.toast.showNotification(
              'warning',
              'No Course Advisor yet',
              resp.data.unavailableReason ??
                'No Course Advisor has been assigned to your level yet.'
            );
            return;
          }
          this.openWith(advisor);
        },
        error: () => {
          this.opening.set(false);
          this.toast.showNotification(
            'error',
            'Could not open that conversation',
            'Please try again in a moment.'
          );
        },
      });
  }

  private openWith(person: IDirectoryPerson): void {
    this.messaging
      .openWith(person.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const id = String(resp.data?._id ?? '');
          if (!id) {
            this.opening.set(false);
            return;
          }
          // Refetch so the new thread arrives with a real title rather than
          // one synthesised here — two places that know the shape of an inbox
          // row is one too many.
          this.messaging
            .inbox()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (inbox) => {
                this.conversations.set([...inbox.data.conversations]);
                const found = inbox.data.conversations.find((c) => c.id === id);
                if (found) this.open(found);
                this.opening.set(false);
              },
              error: () => this.opening.set(false),
            });
        },
        error: (err) => {
          this.opening.set(false);
          this.toast.showNotification(
            'error',
            'Could not open that conversation',
            err?.error?.message ?? 'Please try again.'
          );
        },
      });
  }

  /** Optimistic send — the bubble appears now and is reconciled after. */
  send(body: string): void {
    const conversation = this.active();
    if (!body || !conversation) return;

    const localId = `pending-${Date.now()}`;
    this.messages.update((rows) => [
      ...rows,
      {
        id: localId,
        body,
        kind: 'TEXT',
        sender: null,
        mine: true,
        createdAt: new Date().toISOString(),
        pending: true,
        read: false,
      },
    ]);

    this.messaging
      .send(conversation.id, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          this.messages.update((rows) => rows.map((row) => (row.id === localId ? resp.data : row)));
          this.bumpConversation(conversation.id, body);
        },
        error: () => {
          // Kept and marked, never dropped: losing what somebody typed is
          // worse than showing them it did not send.
          this.messages.update((rows) =>
            rows.map((row) => (row.id === localId ? { ...row, pending: false, failed: true } : row))
          );
          this.toast.showNotification(
            'error',
            'Not sent',
            'That message did not go through. Check your connection and try again.'
          );
        },
      });
  }

  private bumpConversation(conversationId: string, preview: string): void {
    this.conversations.update((rows) => {
      const found = rows.find((row) => row.id === conversationId);
      if (!found) return rows;
      const updated: IConversationSummary = {
        ...found,
        lastMessage: {
          preview,
          at: new Date().toISOString(),
          sender: null,
          mine: true,
          read: false,
        },
        updatedAt: new Date().toISOString(),
      };
      return [updated, ...rows.filter((row) => row.id !== conversationId)];
    });
  }

  private onStreamEvent(event: IStreamEvent): void {
    if (event.type === 'conversation:new') {
      this.loadInbox();
      return;
    }

    if (event.type === 'message:read') {
      this.applyReadReceipt(event);
      return;
    }

    if (event.type !== 'message:new') return;

    const { conversationId, body, preview } = event.payload;

    if (this.active()?.id === conversationId) {
      this.messages.update((rows) => [
        ...rows,
        {
          id: event.payload.messageId ?? `live-${Date.now()}`,
          body: body ?? preview ?? '',
          kind: 'TEXT',
          sender: event.payload.sender ?? null,
          mine: false,
          createdAt: event.payload.createdAt ?? new Date().toISOString(),
        },
      ]);
      this.clearUnread(conversationId);
      return;
    }

    const known = this.conversations().some((c) => c.id === conversationId);
    if (!known) {
      this.loadInbox();
      return;
    }

    this.conversations.update((rows) => {
      const found = rows.find((row) => row.id === conversationId);
      if (!found) return rows;
      const updated: IConversationSummary = {
        ...found,
        unread: found.unread + 1,
        lastMessage: {
          preview: body ?? preview ?? '',
          at: new Date().toISOString(),
          sender: event.payload.sender ?? null,
          mine: false,
          read: false,
        },
        updatedAt: new Date().toISOString(),
      };
      return [updated, ...rows.filter((row) => row.id !== conversationId)];
    });
  }

  /** They opened the thread: everything I sent up to that moment is read. */
  private applyReadReceipt(event: IStreamEvent): void {
    const { conversationId } = event.payload;
    const readAt = new Date(event.payload.at ?? Date.now()).getTime();

    if (this.active()?.id === conversationId) {
      this.messages.update((rows) =>
        rows.map((row) =>
          row.mine && !row.read && new Date(row.createdAt).getTime() <= readAt
            ? { ...row, read: true }
            : row
        )
      );
    }

    this.conversations.update((rows) =>
      rows.map((row) => {
        if (row.id !== conversationId || !row.lastMessage?.mine) return row;
        const at = row.lastMessage.at;
        if (at && new Date(at).getTime() > readAt) return row;
        return { ...row, lastMessage: { ...row.lastMessage, read: true } };
      })
    );
  }

  rowTickFor(conversation: IConversationSummary): 'none' | 'sent' | 'read' {
    const last = conversation.lastMessage;
    if (!last?.mine || conversation.kind === 'ANNOUNCEMENT') return 'none';
    return last.read ? 'read' : 'sent';
  }

  initialsFor(conversation: IConversationSummary): string {
    if (conversation.kind === 'ANNOUNCEMENT') return '📣';
    return (conversation.title ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  trackById = (_: number, item: { id: string }) => item.id;
}
