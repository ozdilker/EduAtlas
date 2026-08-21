/**
 * Existing EduAtlas surfaces agents may integrate with via application ports.
 * Agents never call Firestore/UI — only these named integration points.
 */
export enum AgentIntegrationPoint {
  ImportWorkflow = "import_workflow",
  ReviewQueue = "review_queue",
  QualityEngine = "quality_engine",
  OwnerPortal = "owner_portal",
  AdminOperations = "admin_operations",
}

export const AGENT_INTEGRATION_POINTS: readonly AgentIntegrationPoint[] = Object.freeze([
  AgentIntegrationPoint.ImportWorkflow,
  AgentIntegrationPoint.ReviewQueue,
  AgentIntegrationPoint.QualityEngine,
  AgentIntegrationPoint.OwnerPortal,
  AgentIntegrationPoint.AdminOperations,
]);

const POINT_SET = new Set<string>(AGENT_INTEGRATION_POINTS);

export function isAgentIntegrationPoint(value: string): value is AgentIntegrationPoint {
  return POINT_SET.has(value);
}

export function parseAgentIntegrationPoint(value: string): AgentIntegrationPoint {
  if (!isAgentIntegrationPoint(value)) {
    throw new Error(`Unknown AgentIntegrationPoint: ${value}`);
  }
  return value;
}

/** Human-readable labels for admin/ops documentation. */
export function getAgentIntegrationPointLabel(point: AgentIntegrationPoint): string {
  switch (point) {
    case AgentIntegrationPoint.ImportWorkflow:
      return "Institution Import Workflow";
    case AgentIntegrationPoint.ReviewQueue:
      return "Institution Review Queue";
    case AgentIntegrationPoint.QualityEngine:
      return "Institution Quality Engine";
    case AgentIntegrationPoint.OwnerPortal:
      return "Owner Portal";
    case AgentIntegrationPoint.AdminOperations:
      return "Admin Overview";
  }
}
