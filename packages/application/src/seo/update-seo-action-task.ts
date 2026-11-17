import { seoActionFingerprintFromSourceKey } from "./seo-action-fingerprint";
import {
  createSeoActionTask,
  parseSeoActionTaskStatus,
  type SeoActionTask,
  type SeoActionTaskStatus,
} from "./seo-action-task";
import type { SeoActionTaskRepository } from "./seo-action-task-repository";

export class SeoActionTaskValidationError extends Error {
  override readonly name = "SeoActionTaskValidationError";
}

export type UpdateSeoActionTaskInput = Readonly<{
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly status: string;
  readonly assigneeUid?: string | null;
  readonly note?: string | null;
  readonly updatedBy: string;
  readonly now?: string;
}>;

export type UpdateSeoActionTaskDependencies = Readonly<{
  readonly seoActionTaskRepository: SeoActionTaskRepository;
  /** Resolves whether a UID is an admin-portal user (admin | super_admin | moderator). */
  readonly isAdminUid: (uid: string) => Promise<boolean>;
}>;

const FIREBASE_UID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Upserts task management fields for a derived SEO action.
 * Does not invent GSC metrics; only status / assignee / note.
 */
export async function updateSeoActionTask(
  input: UpdateSeoActionTaskInput,
  deps: UpdateSeoActionTaskDependencies,
): Promise<{ readonly task: SeoActionTask }> {
  const fingerprint = input.fingerprint.trim();
  const sourceKey = input.sourceKey.trim();
  const updatedBy = input.updatedBy.trim();
  if (!fingerprint) {
    throw new SeoActionTaskValidationError("Görev kimliği gerekli.");
  }
  if (!sourceKey.startsWith("url:") && !sourceKey.startsWith("query:")) {
    throw new SeoActionTaskValidationError("Geçersiz kaynak anahtarı.");
  }
  if (fingerprint !== seoActionFingerprintFromSourceKey(sourceKey)) {
    throw new SeoActionTaskValidationError(
      "Görev kimliği kaynak anahtarıyla uyuşmuyor.",
    );
  }
  if (!updatedBy) {
    throw new SeoActionTaskValidationError("Admin kimliği gerekli.");
  }

  let status: SeoActionTaskStatus;
  try {
    status = parseSeoActionTaskStatus(input.status);
  } catch {
    throw new SeoActionTaskValidationError("Geçersiz görev durumu.");
  }

  const assigneeRaw = input.assigneeUid?.trim() || null;
  if (assigneeRaw) {
    if (!FIREBASE_UID_PATTERN.test(assigneeRaw)) {
      throw new SeoActionTaskValidationError("Geçersiz sorumlu UID.");
    }
    const isAdmin = await deps.isAdminUid(assigneeRaw);
    if (!isAdmin) {
      throw new SeoActionTaskValidationError(
        "Sorumlu yalnızca mevcut bir admin kullanıcı olabilir.",
      );
    }
  }

  const existing = await deps.seoActionTaskRepository.getByFingerprint(fingerprint);
  if (existing && existing.sourceKey !== sourceKey) {
    throw new SeoActionTaskValidationError("Görev kimliği kaynak ile uyuşmuyor.");
  }

  const now = input.now ?? new Date().toISOString();
  const task = createSeoActionTask({
    fingerprint,
    sourceKey,
    status,
    assigneeUid: assigneeRaw,
    note: input.note,
    updatedAt: now,
    updatedBy,
  });

  const saved = await deps.seoActionTaskRepository.upsert(task);
  return { task: saved };
}

export function isSeoActionTaskValidationError(
  error: unknown,
): error is SeoActionTaskValidationError {
  return error instanceof SeoActionTaskValidationError;
}
