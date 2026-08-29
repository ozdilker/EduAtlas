import { NextResponse } from "next/server";
import { assertAdminPortalAccess } from "@/server/auth/guards";
import { getInstitutionRepository } from "@/server/institutions/repository";

export const dynamic = "force-dynamic";

/**
 * Bounded institution lookup for Growth Center manual match.
 * Uses equality queries only (contactEmail / exact nameFolded) — no catalog scan.
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
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit") ?? 8) || 8));

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, items: [] });
  }

  try {
    const repo = await getInstitutionRepository();
    const items: Array<{
      id: string;
      name: string;
      cityId: string;
      districtId: string;
      email: string;
    }> = [];

    if (q.includes("@") && repo.findByContactEmail) {
      const byEmail = await repo.findByContactEmail(q, { limit });
      for (const inst of byEmail) {
        items.push({
          id: String(inst.id),
          name: inst.name,
          cityId: inst.location.cityId,
          districtId: inst.location.districtId,
          email: inst.contact.email ?? "",
        });
      }
    } else if (repo.findByExactName) {
      const byName = await repo.findByExactName(q, {
        limit,
        ...(cityId ? { cityId } : {}),
        ...(districtId ? { districtId } : {}),
      });
      for (const inst of byName) {
        items.push({
          id: String(inst.id),
          name: inst.name,
          cityId: inst.location.cityId,
          districtId: inst.location.districtId,
          email: inst.contact.email ?? "",
        });
      }
    }

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[eduatlas] GET /api/admin/outreach-institution-search failed:", error);
    return NextResponse.json(
      { ok: false, message: "Kurum araması başarısız." },
      { status: 500 },
    );
  }
}
