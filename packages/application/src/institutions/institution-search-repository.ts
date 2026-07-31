import type { InstitutionSearchQuery } from "./institution-search-query";
import type { InstitutionSearchResult } from "./institution-search-result";

/**
 * Search index port for public institution discovery.
 * Separate from persistence — adapters may use Firestore fallback or an external engine.
 * No Firebase imports in this package.
 */
export interface InstitutionSearchRepository {
  /**
   * Executes a ranked search against the public institution index.
   */
  search(query: InstitutionSearchQuery): Promise<InstitutionSearchResult>;
}
