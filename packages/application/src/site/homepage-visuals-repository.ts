import type { HomepageVisuals } from "@eduatlas/domain";

/**
 * Persistence port for homepage marketing visuals.
 */
export interface HomepageVisualsRepository {
  get(): Promise<HomepageVisuals>;
  save(visuals: HomepageVisuals): Promise<HomepageVisuals>;
}
