export const SeoActionTaskStatus = Object.freeze({
  Pending: "pending",
  InProgress: "in_progress",
  Done: "done",
} as const);

export type SeoActionTaskStatus =
  (typeof SeoActionTaskStatus)[keyof typeof SeoActionTaskStatus];

const STATUS_VALUES = new Set<string>(Object.values(SeoActionTaskStatus));

export function isSeoActionTaskStatus(value: string): value is SeoActionTaskStatus {
  return STATUS_VALUES.has(value);
}

export function parseSeoActionTaskStatus(raw: string): SeoActionTaskStatus {
  const value = raw.trim();
  if (!isSeoActionTaskStatus(value)) {
    throw new Error(`Unknown SeoActionTaskStatus: ${raw}`);
  }
  return value;
}

export type SeoActionTask = Readonly<{
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly status: SeoActionTaskStatus;
  readonly assigneeUid: string | null;
  readonly note: string | null;
  readonly updatedAt: string;
  readonly updatedBy: string;
}>;

export type CreateSeoActionTaskInput = Readonly<{
  readonly fingerprint: string;
  readonly sourceKey: string;
  readonly status?: SeoActionTaskStatus;
  readonly assigneeUid?: string | null;
  readonly note?: string | null;
  readonly updatedAt: string;
  readonly updatedBy: string;
}>;

export function createSeoActionTask(input: CreateSeoActionTaskInput): SeoActionTask {
  const fingerprint = input.fingerprint.trim();
  const sourceKey = input.sourceKey.trim();
  const updatedBy = input.updatedBy.trim();
  if (!fingerprint) throw new Error("fingerprint required");
  if (!sourceKey) throw new Error("sourceKey required");
  if (!updatedBy) throw new Error("updatedBy required");

  const assigneeUid = input.assigneeUid?.trim() || null;
  const noteRaw = input.note?.trim() || null;
  const note = noteRaw ? noteRaw.slice(0, 500) : null;

  return Object.freeze({
    fingerprint,
    sourceKey,
    status: input.status ?? SeoActionTaskStatus.Pending,
    assigneeUid,
    note,
    updatedAt: input.updatedAt,
    updatedBy,
  });
}

export type SeoActionTaskView = Readonly<{
  readonly status: SeoActionTaskStatus;
  readonly assigneeUid: string | null;
  readonly note: string | null;
  readonly updatedAt: string | null;
  readonly isPersisted: boolean;
}>;

export function defaultSeoActionTaskView(): SeoActionTaskView {
  return Object.freeze({
    status: SeoActionTaskStatus.Pending,
    assigneeUid: null,
    note: null,
    updatedAt: null,
    isPersisted: false,
  });
}

export function toSeoActionTaskView(task: SeoActionTask): SeoActionTaskView {
  return Object.freeze({
    status: task.status,
    assigneeUid: task.assigneeUid,
    note: task.note,
    updatedAt: task.updatedAt,
    isPersisted: true,
  });
}
