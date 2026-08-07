import type { OutreachWarmupSettings } from "./warmup-settings";

/**
 * Persistence port for platform warm-up stage settings.
 */
export interface OutreachWarmupSettingsRepository {
  get(): Promise<OutreachWarmupSettings>;
  save(settings: OutreachWarmupSettings): Promise<OutreachWarmupSettings>;
}
