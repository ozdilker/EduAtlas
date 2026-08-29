import { createInstitutionId, institutionIdAsString } from "@eduatlas/domain";
import { NextResponse } from "next/server";
import { assertAdminPortalAccess } from "@/server/auth/guards";
import { getInstitutionRepository } from "@/server/institutions/repository";

export const dynamic = "force-dynamic";

type SearchItem = {
  id: string;
  name: string;
  cityId: string;
  districtId: string;
  email: string;
};

function toItem(inst: {
  id: ReturnType<typeof createInstitutionId> | string;
  name: string;
  location: { cityId: string; districtId: string };
  contact: { email?: string };
}): SearchItem {
  const id =
    typeof inst.id === "string" ? inst.id : institutionIdAsString(inst.id);
  return {
    id,
    name: inst.name,
    cityId: inst.location.cityId,
    districtId: inst.location.districtId,
    email: inst.contact.email ?? "",
  };
}

/**
 * Bounded institution lookup for Growth Center manual match.
 * Equality queries / getById only — no catalog scan.
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
    const byId = new Map<string, SearchItem>();

    for (const id of candidateIds) {
      const inst = await repo.getById(createInstitutionId(id));
      if (inst) byId.set(institutionIdAsString(inst.id), toItem(inst));
    }

    if (q.includes("@") && repo.findByContactEmail) {
      const byEmail = await repo.findByContactEmail(q, { limit });
      for (const inst of byEmail) {
        byId.set(institutionIdAsString(inst.id), toItem(inst));
      }
    } else if (q.length >= 2 && repo.findByExactName) {
      const byName = await repo.findByExactName(q, {
        limit,
        ...(cityId ? { cityId } : {}),
        ...(districtId ? { districtId } : {}),
      });
      for (const inst of byName) {
        byId.set(institutionIdAsString(inst.id), toItem(inst));
      }

      // If scoped search is empty, retry exact name without district (still bounded).
      if (byName.length === 0 && districtId && repo.findByExactName) {
        const byCityOrName = await repo.findByExactName(q, {
          limit,
          ...(cityId ? { cityId } : {}),
        });
        for (const inst of byCityOrName) {
          byId.set(institutionIdAsString(inst.id), toItem(inst));
        }
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
