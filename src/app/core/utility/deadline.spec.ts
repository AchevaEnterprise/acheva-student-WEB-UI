import { deadlinePassed } from './deadline';

describe('deadlinePassed', () => {
  const at = (iso: string) => new Date(iso);

  it('is open all through the deadline day', () => {
    expect(deadlinePassed('2026-11-30', at('2026-11-30T09:00:00'))).toBe(false);
    expect(deadlinePassed('2026-11-30', at('2026-11-30T23:30:00'))).toBe(false);
  });

  it('has passed from the next day', () => {
    expect(deadlinePassed('2026-11-30', at('2026-12-01T00:00:01'))).toBe(true);
  });

  it('is open before the deadline, and with no deadline at all', () => {
    expect(deadlinePassed('2026-11-30', at('2026-11-11T12:00:00'))).toBe(false);
    expect(deadlinePassed(null)).toBe(false);
  });
});
