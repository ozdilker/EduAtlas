import {
  type AgentContract,
  AgentIntegrationPoint,
  type AgentKind,
  type AgentProposal,
  AgentProposalStatus,
  agentTierMayAutocommit,
  agentTierMayPropose,
  assertAgentCannotApprove,
  createAgentProposal,
  getAgentIntegrationPointLabel,
  isPendingAgentProposal,
} from "@eduatlas/domain";
import { FOUNDATION_AGENT_CONTRACTS } from "./agent-specs";

/**
 * Read-only registry of foundation agent contracts.
 * No LLM routing, no side effects, no repository calls.
 */
export type AiWorkforceOrchestrator = Readonly<{
  readonly contracts: readonly AgentContract[];
  readonly version: "foundation_p0";
  readonly autonomousPublishingEnabled: false;
  readonly autonomousEmailingEnabled: false;
  readonly llmIntegrationEnabled: false;
}>;

/**
 * Builds the P0 AI Data Workforce orchestrator registry.
 * Specification only — proposals remain inert until humans approve via existing queues.
 */
export function createAiWorkforceOrchestrator(
  contracts: readonly AgentContract[] = FOUNDATION_AGENT_CONTRACTS,
): AiWorkforceOrchestrator {
  if (contracts.length === 0) {
    throw new Error("AiWorkforceOrchestrator requires at least one agent contract.");
  }

  for (const contract of contracts) {
    if (!agentTierMayPropose(contract.permissionTier)) {
      throw new Error(`Agent ${contract.kind} has a forbidden permission tier.`);
    }
    if (agentTierMayAutocommit(contract.permissionTier)) {
      throw new Error(`Agent ${contract.kind} must not autocommit (AI-WORKFORCE).`);
    }
    if (!contract.humanApproval.requiredBeforeCommit) {
      throw new Error(`Agent ${contract.kind} must require human approval before commit.`);
    }
  }

  return Object.freeze({
    contracts: Object.freeze([...contracts]),
    version: "foundation_p0" as const,
    autonomousPublishingEnabled: false as const,
    autonomousEmailingEnabled: false as const,
    llmIntegrationEnabled: false as const,
  });
}

export function getAgentContract(
  orchestrator: AiWorkforceOrchestrator,
  kind: AgentKind,
): AgentContract {
  const contract = orchestrator.contracts.find((item) => item.kind === kind);
  if (!contract) {
    throw new Error(`Agent contract not registered: ${kind}`);
  }
  return contract;
}

export type ProposeAgentArtifactInput = Readonly<{
  readonly agentKind: AgentKind;
  readonly title: string;
  readonly summary: string;
  readonly integrationPoint: AgentIntegrationPoint;
  readonly payload?: Readonly<Record<string, unknown>>;
  readonly runId: string;
  readonly confidence: number;
  readonly source: string;
  readonly now?: string;
}>;

/**
 * Produces a pending proposal for a registered agent.
 * Validates the integration point is declared on the agent contract.
 * Never writes to repositories or Firestore.
 */
export function proposeAgentArtifact(
  orchestrator: AiWorkforceOrchestrator,
  input: ProposeAgentArtifactInput,
): AgentProposal {
  if (orchestrator.llmIntegrationEnabled) {
    throw new Error("LLM integration is disabled in the foundation orchestrator.");
  }
  if (orchestrator.autonomousPublishingEnabled) {
    throw new Error("Autonomous publishing is disabled in the foundation orchestrator.");
  }
  if (orchestrator.autonomousEmailingEnabled) {
    throw new Error("Autonomous emailing is disabled in the foundation orchestrator.");
  }

  const contract = getAgentContract(orchestrator, input.agentKind);

  if (!contract.integrationPoints.includes(input.integrationPoint)) {
    throw new Error(
      `Agent ${input.agentKind} cannot integrate with ${getAgentIntegrationPointLabel(input.integrationPoint)}.`,
    );
  }

  assertAgentCannotApprove(AgentProposalStatus.Proposed);

  const now = input.now ?? new Date().toISOString();
  const proposal = createAgentProposal({
    id: `proposal_${input.agentKind}_${input.runId}`,
    agentKind: input.agentKind,
    title: input.title,
    summary: input.summary,
    integrationPoint: input.integrationPoint,
    payload: input.payload,
    runId: input.runId,
    confidence: input.confidence,
    source: input.source,
    producedAt: now,
    createdAt: now,
  });

  if (!isPendingAgentProposal(proposal)) {
    throw new Error("Agent proposals must remain pending until human approval.");
  }

  return proposal;
}

/**
 * Mapping from integration points to existing application surfaces.
 * Documentation for wiring later sprints — no runtime calls here.
 */
export type AgentIntegrationRoute = Readonly<{
  readonly integrationPoint: AgentIntegrationPoint;
  readonly applicationSurface: string;
  readonly pathHint: string;
  readonly acceptsProposalsOnly: true;
}>;

export function listAgentIntegrationRoutes(
  orchestrator: AiWorkforceOrchestrator,
): readonly AgentIntegrationRoute[] {
  const points = new Set(orchestrator.contracts.flatMap((contract) => contract.integrationPoints));

  const routes: AgentIntegrationRoute[] = [];
  for (const point of points) {
    routes.push(routeFor(point));
  }
  return Object.freeze(routes);
}

function routeFor(point: AgentIntegrationPoint): AgentIntegrationRoute {
  switch (point) {
    case AgentIntegrationPoint.ImportWorkflow:
      return Object.freeze({
        integrationPoint: point,
        applicationSurface: "previewImport / executeImport (human-triggered)",
        pathHint: "/admin/import",
        acceptsProposalsOnly: true as const,
      });
    case AgentIntegrationPoint.ReviewQueue:
      return Object.freeze({
        integrationPoint: point,
        applicationSurface: "getInstitutionReviewQueue / reviewInstitution (human-triggered)",
        pathHint: "/admin/review",
        acceptsProposalsOnly: true as const,
      });
    case AgentIntegrationPoint.QualityEngine:
      return Object.freeze({
        integrationPoint: point,
        applicationSurface: "calculateInstitutionQuality (read-only scoring port)",
        pathHint: "/admin/acquisition?sort=lowest",
        acceptsProposalsOnly: true as const,
      });
    case AgentIntegrationPoint.OwnerPortal:
      return Object.freeze({
        integrationPoint: point,
        applicationSurface: "owner recommendations / profile completeness",
        pathHint: "/owner",
        acceptsProposalsOnly: true as const,
      });
    case AgentIntegrationPoint.AdminOperations:
      return Object.freeze({
        integrationPoint: point,
        applicationSurface: "admin overview / Growth Center (read-only proposals)",
        pathHint: "/admin",
        acceptsProposalsOnly: true as const,
      });
  }
}

/**
 * Summarizes foundation readiness for Admin Operations / docs.
 */
export type AiWorkforceFoundationSummary = Readonly<{
  readonly agentCount: number;
  readonly agentKinds: readonly AgentKind[];
  readonly integrationPoints: readonly string[];
  readonly llmIntegrationEnabled: false;
  readonly autonomousPublishingEnabled: false;
  readonly autonomousEmailingEnabled: false;
  readonly allCommitsRequireHumanApproval: true;
}>;

export function summarizeAiWorkforceFoundation(
  orchestrator: AiWorkforceOrchestrator,
): AiWorkforceFoundationSummary {
  return Object.freeze({
    agentCount: orchestrator.contracts.length,
    agentKinds: Object.freeze(orchestrator.contracts.map((item) => item.kind)),
    integrationPoints: Object.freeze(
      listAgentIntegrationRoutes(orchestrator).map((route) => route.integrationPoint),
    ),
    llmIntegrationEnabled: false as const,
    autonomousPublishingEnabled: false as const,
    autonomousEmailingEnabled: false as const,
    allCommitsRequireHumanApproval: true as const,
  });
}
