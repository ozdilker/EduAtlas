import { searchOutreachInstitutions } from "@eduatlas/application";
import { createInstitutionId, institutionIdAsString } from "@eduatlas/domain";
import { NextResponse } from "next/server";
import { assertAdminPortalAccess } from "@/server/auth/guards";
import { getInstitutionRepository } from "@/server/institutions/repository";

export const dynamic = "force-dynamic";

/**
 * Bounded institution lookup for Growth Center manual match.
 * Equality / array-contains + limit only — no catalog scan.
 */
export async function GET(request: Request) {
  try {
    await assertAdminPortalAccess("/admin/outreach");
  } catch {
    return NextResponse.json(
      { ok: false, message: "Oturum gerekli." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const cityId = (url.searchParams.get("cityId") ?? "").trim() || undefined;
  const districtId = (url.searchParams.get("districtId") ?? "").trim() || undefined;
  const idsParam = (url.searchParams.get("ids") ?? "").trim();
  const candidateIds = idsParam
    ? idsParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit") ?? 8) || 8));

  if ((!q || q.length < 2) && candidateIds.length === 0) {
    return NextResponse.json({ ok: true, items: [] });
  }

  try {
    const repo = await getInstitutionRepository();
    const byId = new Map<
      string,
      {
        id: string;
        name: string;
        cityId: string;
        districtId: string;
        email: string;
      }
    >();

    for (const id of candidateIds) {
      const inst = await repo.getById(createInstitutionId(id));
      if (inst) {
        byId.set(institutionIdAsString(inst.id), {
          id: institutionIdAsString(inst.id),
          name: inst.name,
          cityId: inst.location.cityId,
          districtId: inst.location.districtId,
          email: inst.contact.email ?? "",
        });
      }
    }

    if (q.length >= 2) {
      const result = await searchOutreachInstitutions(
        {
          query: q,
          ...(cityId ? { cityId } : {}),
          ...(districtId ? { districtId } : {}),
          limit,
        },
        repo,
      );
      for (const item of result.items) {
        byId.set(item.id, {
          id: item.id,
          name: item.name,
          cityId: item.cityId,
          districtId: item.districtId,
          email: item.email,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      items: [...byId.values()].slice(0, limit),
    });
  } catch (error) {
    console.error("[eduatlas] GET /api/admin/outreach-institution-search failed:", error);
    return NextResponse.json(
      { ok: false, message: "Kurum araması başarısız." },
      { status: 500 },
    );
  }
}
