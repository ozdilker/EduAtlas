/**
 * Permission tiers from AI-WORKFORCE.md §2.3.
 * No agent holds super_admin; T4 is forbidden and never assigned.
 */
export enum AgentPermissionTier {
  /** Read public catalog; draft text; score; queue suggestions. */
  T0ReadDraft = "t0_read_draft",
  /** Write drafts, scores, suggestions, flags — not published NAP. */
  T1InternalWrite = "t1_internal_write",
  /** Moderated write after soft gates (e.g. outreach queues). */
  T2ModeratedWrite = "t2_moderated_write",
  /** Propose only; commit requires Admin/Owner. */
  T3HumanGated = "t3_human_gated",
  /** Forbidden: role grants, billing, secrets, Rules bypass. */
  T4Forbidden = "t4_forbidden",
}

const TIER_SET = new Set<string>(Object.values(AgentPermissionTier));

export function isAgentPermissionTier(value: string): value is AgentPermissionTier {
  return TIER_SET.has(value);
}

/**
 * Whether an agent at this tier may ever autonomously commit to published state.
 * Foundation rule: never — all commit paths require human approval.
 */
export function agentTierMayAutocommit(_tier: AgentPermissionTier): boolean {
  return false;
}

/**
 * Whether the tier may produce proposal artifacts (drafts/scores/queues).
 */
export function agentTierMayPropose(tier: AgentPermissionTier): boolean {
  return tier !== AgentPermissionTier.T4Forbidden;
}
