import {
  createDefaultWarmupSettings,
  type OutreachWarmupSettings,
} from "./warmup-settings";
import type { OutreachWarmupSettingsRepository } from "./warmup-settings-repository";

export class InMemoryOutreachWarmupSettingsRepository
  implements OutreachWarmupSettingsRepository
{
  private current: OutreachWarmupSettings = createDefaultWarmupSettings(
    "2026-08-07T00:00:00.000Z",
  );

  async get(): Promise<OutreachWarmupSettings> {
    return this.current;
  }

  async save(settings: OutreachWarmupSettings): Promise<OutreachWarmupSettings> {
    this.current = settings;
    return settings;
  }
}

export function createInMemoryOutreachWarmupSettingsRepository(): OutreachWarmupSettingsRepository {
  return new InMemoryOutreachWarmupSettingsRepository();
}
