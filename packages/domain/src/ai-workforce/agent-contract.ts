import type { AgentKind } from "./agent-kind";
import type { AgentPermissionTier } from "./agent-permission-tier";
import type { AgentIntegrationPoint } from "./integration-point";

/**
 * Human-approval policy for an agent action class (AI-WORKFORCE §2.2 / §15).
 */
export type AgentHumanApprovalPolicy = Readonly<{
  /** Always true in the foundation — no silent publish/email/claim decisions. */
  readonly requiredBeforeCommit: true;
  readonly rationale: string;
  /** High-impact actions that remain human-only forever for this agent. */
  readonly humanOnlyActions: readonly string[];
}>;

/**
 * Declarative contract for one AI workforce agent.
 * Pure specification — no runtime, no LLM, no I/O.
 */
export type AgentContract = Readonly<{
  readonly kind: AgentKind;
  readonly mission: string;
  readonly permissionTier: AgentPermissionTier;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly triggers: readonly string[];
  readonly permissions: readonly string[];
  readonly humanApproval: AgentHumanApprovalPolicy;
  readonly integrationPoints: readonly AgentIntegrationPoint[];
  /**
   * Explicit non-goals enforced at the contract level.
   * e.g. no LLM calls, no autonomous publish, no autonomous email.
   */
  readonly forbiddenActions: readonly string[];
}>;

export type CreateAgentContractInput = {
  kind: AgentKind;
  mission: string;
  permissionTier: AgentPermissionTier;
  inputs: readonly string[];
  outputs: readonly string[];
  triggers: readonly string[];
  permissions: readonly string[];
  humanApprovalRationale: string;
  humanOnlyActions: readonly string[];
  integrationPoints: readonly AgentIntegrationPoint[];
  forbiddenActions: readonly string[];
};

/**
 * Freeze a complete agent contract. Always marks commits as human-gated.
 */
export function createAgentContract(input: CreateAgentContractInput): AgentContract {
  const mission = input.mission.trim();
  if (!mission) {
    throw new Error("AgentContract.mission is required.");
  }
  if (input.inputs.length === 0) {
    throw new Error("AgentContract.inputs must not be empty.");
  }
  if (input.outputs.length === 0) {
    throw new Error("AgentContract.outputs must not be empty.");
  }
  if (input.triggers.length === 0) {
    throw new Error("AgentContract.triggers must not be empty.");
  }
  if (input.integrationPoints.length === 0) {
    throw new Error("AgentContract.integrationPoints must not be empty.");
  }

  return Object.freeze({
    kind: input.kind,
    mission,
    permissionTier: input.permissionTier,
    inputs: Object.freeze([...input.inputs]),
    outputs: Object.freeze([...input.outputs]),
    triggers: Object.freeze([...input.triggers]),
    permissions: Object.freeze([...input.permissions]),
    humanApproval: Object.freeze({
      requiredBeforeCommit: true as const,
      rationale: input.humanApprovalRationale.trim(),
      humanOnlyActions: Object.freeze([...input.humanOnlyActions]),
    }),
    integrationPoints: Object.freeze([...input.integrationPoints]),
    forbiddenActions: Object.freeze([...input.forbiddenActions]),
  });
}
