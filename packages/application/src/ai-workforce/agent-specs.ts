import {
  type AgentContract,
  AgentIntegrationPoint,
  AgentKind,
  AgentPermissionTier,
  createAgentContract,
} from "@eduatlas/domain";

const FOUNDATION_FORBIDDEN = Object.freeze([
  "call_llm",
  "autonomous_publish",
  "autonomous_email",
  "autonomous_sms",
  "firestore_direct_write",
  "approve_claim",
  "merge_institutions",
  "grant_roles",
  "mutate_published_nap",
]);

/**
 * Discovery Agent — Catalog supply coverage (AI-WORKFORCE Catalog, discovery slice).
 * Produces candidate institution drafts for Import / Review only.
 */
export const DISCOVERY_AGENT_CONTRACT: AgentContract = createAgentContract({
  kind: AgentKind.Discovery,
  mission:
    "Discover and normalize new institution candidates so EduAtlas approaches national coverage without flooding the index.",
  permissionTier: AgentPermissionTier.T1InternalWrite,
  inputs: [
    "geo_type_priority_queues",
    "seed_lists",
    "existing_institution_snapshots",
    "city_district_type_taxonomy",
    "duplicate_hints",
  ],
  outputs: [
    "candidate_institution_drafts",
    "priority_scores",
    "ingest_job_proposals_for_import_queue",
  ],
  triggers: [
    "scheduled_coverage_gap",
    "admin_fill_district_request",
    "partner_source_batch_available",
    "admin_operations_refresh",
  ],
  permissions: ["read_public_catalog", "propose_draft_candidates", "queue_import_proposals"],
  humanApprovalRationale:
    "Required before publish of any AI-proposed institution and before NAP acceptance on first publish.",
  humanOnlyActions: ["publish_institution", "accept_nap_fields", "create_published_record"],
  integrationPoints: [
    AgentIntegrationPoint.ImportWorkflow,
    AgentIntegrationPoint.ReviewQueue,
    AgentIntegrationPoint.AdminOperations,
  ],
  forbiddenActions: FOUNDATION_FORBIDDEN,
});

/**
 * Enrichment Agent — incomplete-record patches (AI-WORKFORCE Catalog, enrichment slice).
 */
export const ENRICHMENT_AGENT_CONTRACT: AgentContract = createAgentContract({
  kind: AgentKind.Enrichment,
  mission:
    "Propose enrichment patches for incomplete drafts (programs, website, descriptions) without inventing NAP truth.",
  permissionTier: AgentPermissionTier.T1InternalWrite,
  inputs: [
    "draft_institution_fields",
    "quality_missing_fields",
    "public_website_signals_policy_compliant",
    "sibling_quality_scores",
  ],
  outputs: ["enrichment_patch_proposals", "field_confidence_scores", "owner_confirm_tasks"],
  triggers: [
    "import_row_previewed",
    "draft_below_quality_threshold",
    "post_claim_completeness_check",
    "nightly_enrichment_sweep",
  ],
  permissions: ["read_draft_institutions", "propose_non_nap_patches", "propose_owner_tasks"],
  humanApprovalRationale:
    "NAP updates require Owner/Admin; non-NAP enrichments on drafts route to Review/Owner accept.",
  humanOnlyActions: ["apply_nap_patch", "overwrite_published_copy", "auto_publish_enriched_fields"],
  integrationPoints: [
    AgentIntegrationPoint.ReviewQueue,
    AgentIntegrationPoint.QualityEngine,
    AgentIntegrationPoint.OwnerPortal,
    AgentIntegrationPoint.ImportWorkflow,
  ],
  forbiddenActions: FOUNDATION_FORBIDDEN,
});

/**
 * Validation Agent — claim / ownership trust assist (AI-WORKFORCE Verification).
 */
export const VALIDATION_AGENT_CONTRACT: AgentContract = createAgentContract({
  kind: AgentKind.Validation,
  mission:
    "Evaluate claim evidence and ownership trust so Admins can approve or reject faster — recommendations only.",
  permissionTier: AgentPermissionTier.T3HumanGated,
  inputs: [
    "claim_request_fields",
    "institution_nap_and_claim_status",
    "historical_claims",
    "public_corroboration_signals",
    "risk_velocity_signals",
  ],
  outputs: [
    "verification_score_proposals",
    "evidence_checklists",
    "recommend_approve_reject_need_more_info",
    "fraud_conflict_flags",
  ],
  triggers: [
    "new_claim_request_pending",
    "evidence_url_updated",
    "admin_opens_claim_queue_item",
    "suspicious_pattern_alert",
  ],
  permissions: [
    "read_claim_queue",
    "read_related_institution",
    "write_verification_recommendations",
  ],
  humanApprovalRationale:
    "Claim approve/reject/revoke is always human-owned; agent recommendation is advisory.",
  humanOnlyActions: ["approve_claim", "reject_claim", "revoke_ownership", "download_id_to_public"],
  integrationPoints: [
    AgentIntegrationPoint.ReviewQueue,
    AgentIntegrationPoint.AdminOperations,
    AgentIntegrationPoint.OwnerPortal,
  ],
  forbiddenActions: FOUNDATION_FORBIDDEN,
});

/**
 * Quality Agent — completeness / publish readiness scores (AI-WORKFORCE Quality).
 * Aligns with the existing Institution Quality Engine as its scoring port.
 */
export const QUALITY_AGENT_CONTRACT: AgentContract = createAgentContract({
  kind: AgentKind.Quality,
  mission:
    "Score institution completeness and publish readiness so Review and SEO priorities reflect trust, not vanity volume.",
  permissionTier: AgentPermissionTier.T1InternalWrite,
  inputs: [
    "institution_fields_vs_publish_checklist",
    "quality_engine_dimensions",
    "thin_content_signals",
    "duplicate_and_verification_scores",
  ],
  outputs: [
    "quality_score_proposals",
    "publish_blocker_lists",
    "seo_risk_flags",
    "prioritized_fix_queues",
  ],
  triggers: [
    "institution_create_or_update",
    "pre_publish_validation",
    "nightly_catalog_quality_sweep",
    "post_claim_completeness_check",
    "import_quality_preview",
  ],
  permissions: ["read_catalog", "propose_quality_scores", "propose_fix_queue_items"],
  humanApprovalRationale:
    "Unpublish/noindex requires Admin; auto-score proposals feed Review/Quality Engine without publishing.",
  humanOnlyActions: ["unpublish_institution", "force_noindex", "override_publish_gates"],
  integrationPoints: [
    AgentIntegrationPoint.QualityEngine,
    AgentIntegrationPoint.ReviewQueue,
    AgentIntegrationPoint.AdminOperations,
    AgentIntegrationPoint.ImportWorkflow,
  ],
  forbiddenActions: FOUNDATION_FORBIDDEN,
});

/**
 * Sales Agent — claim / premium activation assist (AI-WORKFORCE Sales).
 * Outreach drafts only — never autonomous messaging.
 */
export const SALES_AGENT_CONTRACT: AgentContract = createAgentContract({
  kind: AgentKind.Sales,
  mission:
    "Prioritize claim and premium activation for unclaimed or under-activated institutions — without dark patterns or spam.",
  permissionTier: AgentPermissionTier.T2ModeratedWrite,
  inputs: [
    "claim_status_and_completeness",
    "aggregate_lead_volume",
    "public_owner_contact_channels",
    "prior_outreach_history",
    "business_model_free_vs_paid_rules",
  ],
  outputs: [
    "prioritized_claim_outreach_lists",
    "outreach_message_drafts",
    "why_claim_briefs",
    "premium_upsell_suggestions",
    "campaign_segment_definitions",
  ],
  triggers: [
    "high_lead_unclaimed_institution",
    "claim_rejected_cooldown_elapsed",
    "profile_sales_ready_threshold",
    "weekly_activation_digest",
    "manual_sales_queue_refresh",
  ],
  permissions: [
    "read_aggregate_lead_counts",
    "propose_outreach_queue_items",
    "draft_campaign_segments",
  ],
  humanApprovalRationale:
    "Required for first send of any outreach template and for bulk sends; premium pricing never AI-owned.",
  humanOnlyActions: [
    "send_email",
    "send_sms",
    "change_premium_pricing",
    "read_full_lead_message_pii_for_scoring",
  ],
  integrationPoints: [
    AgentIntegrationPoint.AdminOperations,
    AgentIntegrationPoint.OwnerPortal,
    AgentIntegrationPoint.ReviewQueue,
  ],
  forbiddenActions: FOUNDATION_FORBIDDEN,
});

export const FOUNDATION_AGENT_CONTRACTS: readonly AgentContract[] = Object.freeze([
  DISCOVERY_AGENT_CONTRACT,
  ENRICHMENT_AGENT_CONTRACT,
  VALIDATION_AGENT_CONTRACT,
  QUALITY_AGENT_CONTRACT,
  SALES_AGENT_CONTRACT,
]);
