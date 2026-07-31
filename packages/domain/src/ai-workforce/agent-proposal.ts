import type { AgentKind } from "./agent-kind";

/**
 * Lifecycle of an AI workforce proposal.
 * Foundation rule: agents only produce `proposed` artifacts;
 * commit/`approved` transitions are human-owned (never auto-applied by agents).
 */
export enum AgentProposalStatus {
  Proposed = "proposed",
  Approved = "approved",
  Rejected = "rejected",
  Expired = "expired",
}

/**
 * Provenance attached to every AI-touched proposal (AI-WORKFORCE §2).
 */
export type AgentProposalProvenance = Readonly<{
  readonly agentKind: AgentKind;
  readonly runId: string;
  readonly confidence: number;
  readonly aiGenerated: true;
  readonly source: string;
  readonly producedAt: string;
}>;

/**
 * Generic agent proposal — an inert recommendation until a human approves it.
 * No domain entity is mutated by creating a proposal.
 */
export type AgentProposal = Readonly<{
  readonly id: string;
  readonly agentKind: AgentKind;
  readonly status: AgentProposalStatus;
  readonly title: string;
  readonly summary: string;
  /** Integration surface this proposal would feed when approved. */
  readonly integrationPoint: string;
  /** Structured payload keys only — no Firebase documents. */
  readonly payload: Readonly<Record<string, unknown>>;
  readonly provenance: AgentProposalProvenance;
  readonly requiresHumanApproval: true;
  readonly createdAt: string;
}>;

export type CreateAgentProposalInput = {
  id: string;
  agentKind: AgentKind;
  title: string;
  summary: string;
  integrationPoint: string;
  payload?: Readonly<Record<string, unknown>>;
  runId: string;
  confidence: number;
  source: string;
  producedAt: string;
  createdAt: string;
};

/**
 * Creates an immutable proposal always locked to `proposed` status.
 * Agents cannot create approved/rejected proposals.
 */
export function createAgentProposal(input: CreateAgentProposalInput): AgentProposal {
  const id = input.id.trim();
  const title = input.title.trim();
  const summary = input.summary.trim();
  const integrationPoint = input.integrationPoint.trim();
  const runId = input.runId.trim();
  const source = input.source.trim();

  if (!id) throw new Error("AgentProposal.id is required.");
  if (!title) throw new Error("AgentProposal.title is required.");
  if (!summary) throw new Error("AgentProposal.summary is required.");
  if (!integrationPoint) throw new Error("AgentProposal.integrationPoint is required.");
  if (!runId) throw new Error("AgentProposal provenance.runId is required.");
  if (!source) throw new Error("AgentProposal provenance.source is required.");
  if (input.confidence < 0 || input.confidence > 1) {
    throw new Error("AgentProposal provenance.confidence must be between 0 and 1.");
  }
  if (Number.isNaN(Date.parse(input.producedAt))) {
    throw new Error("AgentProposal provenance.producedAt must be a valid ISO timestamp.");
  }
  if (Number.isNaN(Date.parse(input.createdAt))) {
    throw new Error("AgentProposal.createdAt must be a valid ISO timestamp.");
  }

  return Object.freeze({
    id,
    agentKind: input.agentKind,
    status: AgentProposalStatus.Proposed,
    title,
    summary,
    integrationPoint,
    payload: Object.freeze({ ...(input.payload ?? {}) }),
    provenance: Object.freeze({
      agentKind: input.agentKind,
      runId,
      confidence: input.confidence,
      aiGenerated: true as const,
      source,
      producedAt: input.producedAt,
    }),
    requiresHumanApproval: true as const,
    createdAt: input.createdAt,
  });
}

/**
 * True only when the proposal is still awaiting human decision.
 * Agents must never treat non-proposed statuses as agent-writable.
 */
export function isPendingAgentProposal(proposal: AgentProposal): boolean {
  return proposal.status === AgentProposalStatus.Proposed && proposal.requiresHumanApproval;
}

/**
 * Foundation guard: agents cannot mark proposals approved.
 * Approval is an Admin/Owner use case outside this package.
 */
export function assertAgentCannotApprove(status: AgentProposalStatus): void {
  if (status === AgentProposalStatus.Approved) {
    throw new Error(
      "Agents cannot approve proposals. Human approval is required (AI-WORKFORCE propose→review→commit).",
    );
  }
}
