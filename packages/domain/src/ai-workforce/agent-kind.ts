/**
 * Sprint-007 foundation agents for the AI Data Workforce.
 * Maps onto AI-WORKFORCE.md Catalog (discovery/enrichment), Verification,
 * Quality, and Sales — without activating LLM runtimes.
 */
export enum AgentKind {
  Discovery = "discovery",
  Enrichment = "enrichment",
  Validation = "validation",
  Quality = "quality",
  Sales = "sales",
}

export const AGENT_KINDS: readonly AgentKind[] = Object.freeze([
  AgentKind.Discovery,
  AgentKind.Enrichment,
  AgentKind.Validation,
  AgentKind.Quality,
  AgentKind.Sales,
]);

const KIND_SET = new Set<string>(AGENT_KINDS);

export function isAgentKind(value: string): value is AgentKind {
  return KIND_SET.has(value);
}

export function parseAgentKind(value: string): AgentKind {
  if (!isAgentKind(value)) {
    throw new Error(`Unknown AgentKind: ${value}`);
  }
  return value;
}
