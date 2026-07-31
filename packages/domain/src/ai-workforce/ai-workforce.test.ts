import { describe, expect, it } from "vitest";
import {
  AgentIntegrationPoint,
  AgentKind,
  AgentPermissionTier,
  AgentProposalStatus,
  agentTierMayAutocommit,
  agentTierMayPropose,
  assertAgentCannotApprove,
  createAgentContract,
  createAgentProposal,
  getAgentIntegrationPointLabel,
  isPendingAgentProposal,
} from "../index";

describe("ai workforce domain", () => {
  it("never allows autocommit at any permission tier", () => {
    for (const tier of Object.values(AgentPermissionTier)) {
      expect(agentTierMayAutocommit(tier)).toBe(false);
    }
    expect(agentTierMayPropose(AgentPermissionTier.T1InternalWrite)).toBe(true);
    expect(agentTierMayPropose(AgentPermissionTier.T4Forbidden)).toBe(false);
  });

  it("creates proposals locked to proposed + requiresHumanApproval", () => {
    const proposal = createAgentProposal({
      id: "p1",
      agentKind: AgentKind.Discovery,
      title: "Yeni aday",
      summary: "Ankara anaokulu adayı",
      integrationPoint: AgentIntegrationPoint.ImportWorkflow,
      runId: "run_1",
      confidence: 0.8,
      source: "seed_list",
      producedAt: "2026-07-15T12:00:00.000Z",
      createdAt: "2026-07-15T12:00:00.000Z",
    });

    expect(proposal.status).toBe(AgentProposalStatus.Proposed);
    expect(proposal.requiresHumanApproval).toBe(true);
    expect(proposal.provenance.aiGenerated).toBe(true);
    expect(isPendingAgentProposal(proposal)).toBe(true);
  });

  it("rejects agent attempt to treat Approved as agent-writable", () => {
    expect(() => assertAgentCannotApprove(AgentProposalStatus.Approved)).toThrow(/Human approval/);
    expect(() => assertAgentCannotApprove(AgentProposalStatus.Proposed)).not.toThrow();
  });

  it("validates agent contracts require inputs, outputs, triggers, integrations", () => {
    expect(() =>
      createAgentContract({
        kind: AgentKind.Quality,
        mission: " ",
        permissionTier: AgentPermissionTier.T1InternalWrite,
        inputs: ["a"],
        outputs: ["b"],
        triggers: ["c"],
        permissions: ["d"],
        humanApprovalRationale: "yes",
        humanOnlyActions: ["publish"],
        integrationPoints: [AgentIntegrationPoint.QualityEngine],
        forbiddenActions: ["call_llm"],
      }),
    ).toThrow(/mission/);

    const contract = createAgentContract({
      kind: AgentKind.Sales,
      mission: "Activate claims",
      permissionTier: AgentPermissionTier.T2ModeratedWrite,
      inputs: ["claim_status"],
      outputs: ["outreach_drafts"],
      triggers: ["weekly_digest"],
      permissions: ["propose_outreach"],
      humanApprovalRationale: "No autonomous email",
      humanOnlyActions: ["send_email"],
      integrationPoints: [AgentIntegrationPoint.AdminOperations],
      forbiddenActions: ["autonomous_email"],
    });
    expect(contract.humanApproval.requiredBeforeCommit).toBe(true);
    expect(getAgentIntegrationPointLabel(AgentIntegrationPoint.ReviewQueue)).toContain("Review");
  });
});
