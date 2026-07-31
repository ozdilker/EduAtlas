import {
  parseRecommendationPriority,
  type RecommendationPriority,
} from "./recommendation-priority";
import { parseRecommendationType, type RecommendationType } from "./recommendation-type";

/**
 * Read-only Sales Agent recommendation for Institution Owners.
 * Rule-based in v1 — no LLM, no automatic actions.
 */
export type OwnerRecommendation = Readonly<{
  readonly id: string;
  readonly institutionId: string;
  readonly type: RecommendationType;
  readonly priority: RecommendationPriority;
  readonly ruleId: string;
  readonly title: string;
  readonly message: string;
  readonly createdAt: string;
}>;

export type CreateOwnerRecommendationInput = {
  id: string;
  institutionId: string;
  type: RecommendationType | string;
  priority: RecommendationPriority | string;
  ruleId: string;
  title: string;
  message: string;
  createdAt: string;
};

/**
 * Creates an immutable OwnerRecommendation.
 */
export function createOwnerRecommendation(
  input: CreateOwnerRecommendationInput,
): OwnerRecommendation {
  const id = input.id.trim();
  const institutionId = input.institutionId.trim();
  const ruleId = input.ruleId.trim();
  const title = input.title.trim();
  const message = input.message.trim();
  const type = typeof input.type === "string" ? parseRecommendationType(input.type) : input.type;
  const priority =
    typeof input.priority === "string"
      ? parseRecommendationPriority(input.priority)
      : input.priority;

  if (!id) {
    throw new Error("OwnerRecommendation.id is required.");
  }
  if (!institutionId) {
    throw new Error("OwnerRecommendation.institutionId is required.");
  }
  if (!ruleId) {
    throw new Error("OwnerRecommendation.ruleId is required.");
  }
  if (!title) {
    throw new Error("OwnerRecommendation.title is required.");
  }
  if (!message) {
    throw new Error("OwnerRecommendation.message is required.");
  }
  if (Number.isNaN(Date.parse(input.createdAt))) {
    throw new Error("OwnerRecommendation.createdAt must be a valid ISO timestamp.");
  }

  return Object.freeze({
    id,
    institutionId,
    type,
    priority,
    ruleId,
    title,
    message,
    createdAt: input.createdAt,
  });
}
