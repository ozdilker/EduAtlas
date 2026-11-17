import { describe, expect, it } from "vitest";
import {
  seoActionFingerprintForUrl,
  seoActionFingerprintFromSourceKey,
  seoActionSourceKeyForUrl,
} from "./seo-action-fingerprint";
import { EMPTY_SEO_ACTION_PLAN, buildSeoActionPlan } from "./seo-actions";
import { mergeSeoActionTasks } from "./merge-seo-action-tasks";
import { SeoActionTaskStatus, createSeoActionTask } from "./seo-action-task";
import { updateSeoActionTask } from "./update-seo-action-task";

class FakeSeoActionTaskRepository {
  readonly byId = new Map<string, ReturnType<typeof createSeoActionTask>>();
  deleteCalls = 0;

  async getByFingerprint(fingerprint: string) {
    return this.byId.get(fingerprint) ?? null;
  }

  async getByFingerprints(fingerprints: readonly string[]) {
    return fingerprints
      .map((id) => this.byId.get(id))
      .filter((task): task is NonNullable<typeof task> => task != null);
  }

  async listAll(limit = 500) {
    return [...this.byId.values()].slice(0, limit);
  }

  async upsert(task: ReturnType<typeof createSeoActionTask>) {
    this.byId.set(task.fingerprint, task);
    return task;
  }

  /** Intentionally unused — proves persistence layer has no auto-delete path. */
  async delete(_fingerprint: string) {
    this.deleteCalls += 1;
  }
}

const ADMIN_UIDS = new Set(["admin_uid_1", "admin_uid_2", "admin_uid_3"]);

async function isAdminUid(uid: string): Promise<boolean> {
  return ADMIN_UIDS.has(uid);
}

describe("seo action task persistence (Faz 6C/6D verification)", () => {
  const url = "https://eduatlas.com.tr/institutions/ornek-okul";

  function planFor(ctr: number, position: number) {
    return buildSeoActionPlan({
      pages: [
        {
          url,
          clicks: 5,
          impressions: 600,
          ctr,
          position,
          institutionName: "Örnek Okul",
          profileHref: "/institutions/ornek-okul",
          matchStatus: "matched",
        },
      ],
      queries: [],
    });
  }

  function deps(repo: FakeSeoActionTaskRepository) {
    return { seoActionTaskRepository: repo, isAdminUid };
  }

  it("defaults new actions to pending without a stored task", () => {
    const plan = planFor(0.01, 8);
    const managed = mergeSeoActionTasks(plan, []);
    expect(managed.activeActions).toHaveLength(1);
    expect(managed.activeActions[0]?.task.status).toBe("pending");
    expect(managed.activeActions[0]?.task.isPersisted).toBe(false);
    expect(managed.completedActions).toHaveLength(0);
    expect(managed.orphanedTasks).toHaveLength(0);
  });

  it("persists in_progress and restores status/assignee/note after re-merge", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const plan = planFor(0.01, 8);
    const action = plan.prioritizedActions[0]!;

    await updateSeoActionTask(
      {
        fingerprint: action.fingerprint,
        sourceKey: action.sourceKey,
        status: "in_progress",
        assigneeUid: "admin_uid_1",
        note: "title taslağı",
        updatedBy: "admin_uid_1",
        now: "2026-11-16T16:00:00.000Z",
      },
      deps(repo),
    );

    const stored = await repo.getByFingerprint(action.fingerprint);
    expect(stored?.status).toBe(SeoActionTaskStatus.InProgress);
    expect(stored?.assigneeUid).toBe("admin_uid_1");
    expect(stored?.note).toBe("title taslağı");

    const managed = mergeSeoActionTasks(plan, [stored!]);
    expect(managed.activeActions).toHaveLength(1);
    expect(managed.activeActions[0]?.task.status).toBe("in_progress");
    expect(managed.activeActions[0]?.task.assigneeUid).toBe("admin_uid_1");
    expect(managed.activeActions[0]?.task.note).toBe("title taslağı");
    expect(managed.completedActions).toHaveLength(0);
  });

  it("moves done tasks into completedActions", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const plan = planFor(0.01, 8);
    const action = plan.prioritizedActions[0]!;

    const { task } = await updateSeoActionTask(
      {
        fingerprint: action.fingerprint,
        sourceKey: action.sourceKey,
        status: "done",
        assigneeUid: "admin_uid_1",
        note: "yayında",
        updatedBy: "admin_uid_1",
      },
      deps(repo),
    );

    const managed = mergeSeoActionTasks(plan, [task]);
    expect(managed.activeActions).toHaveLength(0);
    expect(managed.completedActions).toHaveLength(1);
    expect(managed.completedActions[0]?.task.status).toBe("done");
  });

  it("keeps fingerprint stable when action kind changes for the same URL", () => {
    const combined = planFor(0.01, 8).prioritizedActions[0]!;
    const rankingOnly = planFor(0.05, 8).prioritizedActions[0]!;

    expect(combined.kind).toBe("ctr_and_ranking_page");
    expect(rankingOnly.kind).toBe("ranking_page");
    expect(combined.fingerprint).toBe(rankingOnly.fingerprint);
    expect(combined.fingerprint).toBe(seoActionFingerprintForUrl(url));
    expect(combined.sourceKey).toBe(seoActionSourceKeyForUrl(url));
  });

  it("preserves task state across a simulated snapshot refresh (re-derived plan)", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const firstPlan = planFor(0.01, 8);
    const action = firstPlan.prioritizedActions[0]!;

    await updateSeoActionTask(
      {
        fingerprint: action.fingerprint,
        sourceKey: action.sourceKey,
        status: "in_progress",
        assigneeUid: "admin_uid_2",
        note: "snapshot sonrası korunmalı",
        updatedBy: "admin_uid_2",
        now: "2026-11-16T16:10:00.000Z",
      },
      deps(repo),
    );

    const refreshedPlan = planFor(0.015, 9);
    const stored = await repo.getByFingerprint(action.fingerprint);
    const managed = mergeSeoActionTasks(refreshedPlan, stored ? [stored] : []);

    expect(managed.activeActions[0]?.fingerprint).toBe(action.fingerprint);
    expect(managed.activeActions[0]?.task.status).toBe("in_progress");
    expect(managed.activeActions[0]?.task.assigneeUid).toBe("admin_uid_2");
    expect(managed.activeActions[0]?.task.note).toBe("snapshot sonrası korunmalı");
    expect(managed.activeActions[0]?.impressions).toBe(600);
  });

  it("lists orphaned tasks separately without deleting them", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const fingerprint = seoActionFingerprintForUrl(url);
    const sourceKey = seoActionSourceKeyForUrl(url);

    await updateSeoActionTask(
      {
        fingerprint,
        sourceKey,
        status: "in_progress",
        assigneeUid: "admin_uid_3",
        note: "orphan adayı",
        updatedBy: "admin_uid_3",
      },
      deps(repo),
    );

    expect(repo.byId.has(fingerprint)).toBe(true);

    const managed = mergeSeoActionTasks(EMPTY_SEO_ACTION_PLAN, [...repo.byId.values()]);
    expect(managed.prioritizedActions).toHaveLength(0);
    expect(managed.activeActions).toHaveLength(0);
    expect(managed.orphanedTasks).toHaveLength(1);
    expect(managed.orphanedTasks[0]?.fingerprint).toBe(fingerprint);
    expect(managed.orphanedTasks[0]?.targetLabel).toBe(url);
    expect(managed.orphanedTasks[0]?.task.note).toBe("orphan adayı");
    expect(managed.orphanedTasks[0]?.task.status).toBe("in_progress");
    expect(repo.byId.has(fingerprint)).toBe(true);
    expect(repo.deleteCalls).toBe(0);
  });

  it("upserts the same fingerprint without creating duplicate records", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const fingerprint = seoActionFingerprintForUrl(url);
    const sourceKey = seoActionSourceKeyForUrl(url);

    await updateSeoActionTask(
      {
        fingerprint,
        sourceKey,
        status: "pending",
        updatedBy: "admin_uid_1",
      },
      deps(repo),
    );
    await updateSeoActionTask(
      {
        fingerprint,
        sourceKey,
        status: "done",
        assigneeUid: "admin_uid_1",
        note: "ikinci yazım",
        updatedBy: "admin_uid_1",
      },
      deps(repo),
    );

    expect(repo.byId.size).toBe(1);
    expect(repo.byId.get(fingerprint)?.status).toBe("done");
    expect(repo.byId.get(fingerprint)?.note).toBe("ikinci yazım");
  });

  it("rejects mismatched fingerprint vs sourceKey hash", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const sourceKey = seoActionSourceKeyForUrl(url);
    const wrongFingerprint = seoActionFingerprintFromSourceKey("url:https://other.example/x");

    await expect(
      updateSeoActionTask(
        {
          fingerprint: wrongFingerprint,
          sourceKey,
          status: "pending",
          updatedBy: "admin_uid_1",
        },
        deps(repo),
      ),
    ).rejects.toThrow(/kaynak anahtarıyla uyuşmuyor/);
    expect(repo.byId.size).toBe(0);
  });

  it("rejects non-admin assignee and accepts valid admin assignee", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const fingerprint = seoActionFingerprintForUrl(url);
    const sourceKey = seoActionSourceKeyForUrl(url);

    await expect(
      updateSeoActionTask(
        {
          fingerprint,
          sourceKey,
          status: "pending",
          assigneeUid: "parent_uid_9",
          updatedBy: "admin_uid_1",
        },
        deps(repo),
      ),
    ).rejects.toThrow(/mevcut bir admin/);

    const { task } = await updateSeoActionTask(
      {
        fingerprint,
        sourceKey,
        status: "in_progress",
        assigneeUid: "admin_uid_1",
        updatedBy: "admin_uid_1",
      },
      deps(repo),
    );
    expect(task.assigneeUid).toBe("admin_uid_1");

    const cleared = await updateSeoActionTask(
      {
        fingerprint,
        sourceKey,
        status: "pending",
        assigneeUid: null,
        updatedBy: "admin_uid_1",
      },
      deps(repo),
    );
    expect(cleared.task.assigneeUid).toBeNull();
  });

  it("rejects invalid status and invalid assignee uid format", async () => {
    const repo = new FakeSeoActionTaskRepository();
    const fingerprint = seoActionFingerprintForUrl(url);
    const sourceKey = seoActionSourceKeyForUrl(url);

    await expect(
      updateSeoActionTask(
        {
          fingerprint,
          sourceKey,
          status: "archived",
          updatedBy: "admin_uid_1",
        },
        deps(repo),
      ),
    ).rejects.toThrow(/Geçersiz görev durumu/);

    await expect(
      updateSeoActionTask(
        {
          fingerprint,
          sourceKey,
          status: "pending",
          assigneeUid: "bad uid!",
          updatedBy: "admin_uid_1",
        },
        deps(repo),
      ),
    ).rejects.toThrow(/Geçersiz sorumlu UID/);
  });
});
