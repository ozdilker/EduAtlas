import { AgentIntegrationPoint, AgentKind, AgentProposalStatus } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import { FOUNDATION_AGENT_CONTRACTS } from "./agent-specs";
import {
  createAiWorkforceOrchestrator,
  getAgentContract,
  listAgentIntegrationRoutes,
  proposeAgentArtifact,
  summarizeAiWorkforceFoundation,
} from "./ai-workforce-orchestrator";

describe("ai workforce orchestrator", () => {
  const orchestrator = createAiWorkforceOrchestrator();

  it("registers the five foundation agents with human-gated commits", () => {
    expect(orchestrator.contracts).toHaveLength(5);
    expect(orchestrator.llmIntegrationEnabled).toBe(false);
    expect(orchestrator.autonomousPublishingEnabled).toBe(false);
    expect(orchestrator.autonomousEmailingEnabled).toBe(false);

    const kinds = orchestrator.contracts.map((item) => item.kind);
    expect(kinds).toEqual([
      AgentKind.Discovery,
      AgentKind.Enrichment,
      AgentKind.Validation,
      AgentKind.Quality,
      AgentKind.Sales,
    ]);

    for (const contract of FOUNDATION_AGENT_CONTRACTS) {
      expect(contract.humanApproval.requiredBeforeCommit).toBe(true);
      expect(contract.forbiddenActions).toEqual(
        expect.arrayContaining([
          "call_llm",
          "autonomous_publish",
          "autonomous_email",
          "firestore_direct_write",
        ]),
      );
    }
  });

  it("defines inputs, outputs, triggers, permissions, and integration points per agent", () => {
    const discovery = getAgentContract(orchestrator, AgentKind.Discovery);
    expect(discovery.inputs.length).toBeGreaterThan(0);
    expect(discovery.outputs).toContain("candidate_institution_drafts");
    expect(discovery.triggers).toContain("scheduled_coverage_gap");
    expect(discovery.integrationPoints).toContain(AgentIntegrationPoint.ImportWorkflow);

    const sales = getAgentContract(orchestrator, AgentKind.Sales);
    expect(sales.humanApproval.humanOnlyActions).toContain("send_email");
    expect(sales.forbiddenActions).toContain("autonomous_email");

    const quality = getAgentContract(orchestrator, AgentKind.Quality);
    expect(quality.integrationPoints).toContain(AgentIntegrationPoint.QualityEngine);
  });

  it("routes integration points to existing application surfaces (proposals only)", () => {
    const routes = listAgentIntegrationRoutes(orchestrator);
    const byPoint = new Map(routes.map((route) => [route.integrationPoint, route]));

    expect(byPoint.get(AgentIntegrationPoint.ImportWorkflow)?.pathHint).toBe("/admin/import");
    expect(byPoint.get(AgentIntegrationPoint.ReviewQueue)?.pathHint).toBe("/admin/review");
    expect(byPoint.get(AgentIntegrationPoint.QualityEngine)?.pathHint).toContain("acquisition");
    expect(byPoint.get(AgentIntegrationPoint.OwnerPortal)?.pathHint).toBe("/owner");
    expect(byPoint.get(AgentIntegrationPoint.AdminOperations)?.pathHint).toBe("/admin");

    for (const route of routes) {
      expect(route.acceptsProposalsOnly).toBe(true);
    }
  });

  it("creates pending proposals only for declared integration points", () => {
    const proposal = proposeAgentArtifact(orchestrator, {
      agentKind: AgentKind.Discovery,
      title: "İlçe boşluğu",
      summary: "Çankaya için 3 anaokulu adayı",
      integrationPoint: AgentIntegrationPoint.ImportWorkflow,
      runId: "run_42",
      confidence: 0.7,
      source: "coverage_gap",
      now: "2026-07-15T15:00:00.000Z",
      payload: { cityId: "city_ankara", candidateCount: 3 },
    });

    expect(proposal.status).toBe(AgentProposalStatus.Proposed);
    expect(proposal.requiresHumanApproval).toBe(true);
    expect(proposal.provenance.aiGenerated).toBe(true);

    expect(() =>
      proposeAgentArtifact(orchestrator, {
        agentKind: AgentKind.Discovery,
        title: "Owner'a gizli",
        summary: "Yetkisiz",
        integrationPoint: AgentIntegrationPoint.OwnerPortal,
        runId: "run_x",
        confidence: 0.5,
        source: "test",
      }),
    ).toThrow(/cannot integrate/);
  });

  it("summarizes foundation readiness for admin/ops", () => {
    const summary = summarizeAiWorkforceFoundation(orchestrator);
    expect(summary.agentCount).toBe(5);
    expect(summary.allCommitsRequireHumanApproval).toBe(true);
    expect(summary.llmIntegrationEnabled).toBe(false);
    expect(summary.integrationPoints).toContain(AgentIntegrationPoint.ReviewQueue);
  });
});
