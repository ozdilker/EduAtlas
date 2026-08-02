export type DeliverySendBudget = {
  getSentInCurrentMinute(now: string): Promise<number>;
  getSentToday(now: string): Promise<number>;
  recordAcceptedSend(now: string): Promise<void>;
};

/**
 * Process-local send counters for tests / single-instance worker.
 */
export class InMemoryDeliverySendBudget implements DeliverySendBudget {
  private readonly minuteCounts = new Map<string, number>();
  private readonly dayCounts = new Map<string, number>();

  async getSentInCurrentMinute(now: string): Promise<number> {
    return this.minuteCounts.get(minuteKey(now)) ?? 0;
  }

  async getSentToday(now: string): Promise<number> {
    return this.dayCounts.get(dayKey(now)) ?? 0;
  }

  async recordAcceptedSend(now: string): Promise<void> {
    const mk = minuteKey(now);
    const dk = dayKey(now);
    this.minuteCounts.set(mk, (this.minuteCounts.get(mk) ?? 0) + 1);
    this.dayCounts.set(dk, (this.dayCounts.get(dk) ?? 0) + 1);
  }
}

export function createInMemoryDeliverySendBudget(): InMemoryDeliverySendBudget {
  return new InMemoryDeliverySendBudget();
}

function minuteKey(now: string): string {
  const d = new Date(now);
  return `${d.toISOString().slice(0, 16)}`;
}

function dayKey(now: string): string {
  return new Date(now).toISOString().slice(0, 10);
}
