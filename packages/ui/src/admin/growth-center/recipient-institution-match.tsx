"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Button } from "../../components/button";

export type OutreachInstitutionSearchItem = Readonly<{
  id: string;
  name: string;
  cityId: string;
  districtId: string;
  email: string;
  cityName?: string;
  districtName?: string;
}>;

export function formatOutreachInstitutionLocation(
  item: Pick<
    OutreachInstitutionSearchItem,
    "cityId" | "districtId" | "cityName" | "districtName"
  >,
): string {
  const city = item.cityName?.trim() || humanizeGeoId(item.cityId);
  const district = item.districtName?.trim() || humanizeGeoId(item.districtId);
  if (city && district) return `${city} / ${district}`;
  return city || district || "—";
}

export function formatOutreachMatchedLabel(
  name: string,
  location: string,
): string {
  const n = name.trim();
  const loc = location.trim();
  if (n && loc && loc !== "—") return `${n} — ${loc}`;
  return n || loc || "—";
}

export function buildOutreachInstitutionSearchUrl(input: {
  query: string;
  cityId?: string;
  districtId?: string;
  candidateIds?: readonly string[];
  limit?: number;
  basePath?: string;
}): string {
  const base = input.basePath ?? "/api/admin/outreach-institution-search";
  const params = new URLSearchParams();
  const q = input.query.trim();
  if (q) params.set("q", q);
  if (input.cityId?.trim()) params.set("cityId", input.cityId.trim());
  if (input.districtId?.trim()) params.set("districtId", input.districtId.trim());
  if (input.candidateIds && input.candidateIds.length > 0) {
    params.set("ids", input.candidateIds.slice(0, 10).join(","));
  }
  params.set("limit", String(Math.min(10, Math.max(1, input.limit ?? 8))));
  return `${base}?${params.toString()}`;
}

function humanizeGeoId(id: string): string {
  const raw = id.trim();
  if (!raw) return "";
  return raw
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

type SearchResponse = {
  ok?: boolean;
  items?: OutreachInstitutionSearchItem[];
  message?: string;
};

async function fetchInstitutionSearch(url: string): Promise<OutreachInstitutionSearchItem[]> {
  const response = await fetch(url, { method: "GET", credentials: "same-origin" });
  const data = (await response.json()) as SearchResponse;
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Kurum araması başarısız.");
  }
  return data.items ?? [];
}

type RecipientInstitutionMatchPanelProps = Readonly<{
  campaignId: string;
  recipientId: string;
  initialQuery: string;
  candidateIds?: readonly string[];
  cityId?: string;
  districtId?: string;
  assignAction: (formData: FormData) => Promise<void>;
}>;

/**
 * Admin match UI: search + select (no raw institutionId typing).
 */
export function RecipientInstitutionMatchPanel({
  campaignId,
  recipientId,
  initialQuery,
  candidateIds,
  cityId,
  districtId,
  assignAction,
}: RecipientInstitutionMatchPanelProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<OutreachInstitutionSearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const q = initialQuery.trim() || query.trim();
    setQuery(q);
    void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once with recipient defaults
  }, [open]);

  async function runSearch(nextQuery: string) {
    setBusy(true);
    setError(null);
    try {
      const url = buildOutreachInstitutionSearchUrl({
        query: nextQuery,
        cityId,
        districtId,
        candidateIds,
      });
      const results = await fetchInstitutionSearch(url);
      setItems(results);
      if (results.length === 0) {
        setError("Sonuç bulunamadı. Kurum adını veya e-postayı netleştirin.");
      }
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Kurum araması başarısız.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Eşleştir
      </Button>
    );
  }

  return (
    <div className="ea-admin-field" aria-labelledby={`${panelId}-title`}>
      <p id={`${panelId}-title`} className="ea-admin-muted">
        Kurum ara
      </p>
      <div className="ea-admin-field" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          className="ea-admin-select"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void runSearch(query);
            }
          }}
          placeholder="Kadro Kurs"
          aria-label="Kurum ara"
          disabled={busy || pending}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => void runSearch(query)}
          disabled={busy || pending || query.trim().length < 2}
        >
          Ara
        </Button>
        <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Kapat
        </Button>
      </div>
      {busy ? <p className="ea-admin-muted">Aranıyor…</p> : null}
      {error ? (
        <p className="ea-admin-visuals__status" role="alert">
          {error}
        </p>
      ) : null}
      {items.length > 0 ? (
        <ul className="ea-admin-muted" style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
          {items.map((item) => {
            const location = formatOutreachInstitutionLocation(item);
            return (
              <li
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  padding: "0.4rem 0",
                  borderTop: "1px solid color-mix(in srgb, currentColor 12%, transparent)",
                }}
              >
                <div>
                  <strong>{item.name}</strong>
                  <div className="ea-admin-muted">{location}</div>
                </div>
                <form
                  action={(formData) => {
                    startTransition(() => {
                      void assignAction(formData);
                    });
                  }}
                >
                  <input type="hidden" name="campaignId" value={campaignId} />
                  <input type="hidden" name="recipientId" value={recipientId} />
                  <input type="hidden" name="institutionId" value={item.id} />
                  <Button type="submit" size="sm" variant="primary" disabled={pending}>
                    Seç
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

type ManualInstitutionPickerProps = Readonly<{
  fieldName?: string;
  initialQuery?: string;
  cityId?: string;
  districtId?: string;
}>;

/**
 * Optional institution picker for manual recipient add (hidden institutionId).
 */
export function ManualInstitutionPicker({
  fieldName = "institutionId",
  initialQuery = "",
  cityId,
  districtId,
}: ManualInstitutionPickerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<OutreachInstitutionSearchItem | null>(null);
  const [items, setItems] = useState<OutreachInstitutionSearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runSearch() {
    setBusy(true);
    setError(null);
    try {
      const url = buildOutreachInstitutionSearchUrl({
        query,
        cityId,
        districtId,
      });
      const results = await fetchInstitutionSearch(url);
      setItems(results);
      if (results.length === 0) {
        setError("Sonuç bulunamadı.");
      }
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Kurum araması başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ea-admin-field">
      <label htmlFor="outreach-manual-inst-search">EduAtlas kurumu</label>
      <input type="hidden" name={fieldName} value={selected?.id ?? ""} />
      {selected ? (
        <p className="ea-admin-muted" role="status">
          Seçildi:{" "}
          {formatOutreachMatchedLabel(
            selected.name,
            formatOutreachInstitutionLocation(selected),
          )}{" "}
          <Button type="button" size="sm" onClick={() => setSelected(null)}>
            Temizle
          </Button>
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              id="outreach-manual-inst-search"
              className="ea-admin-select"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kurum ara / seç"
              aria-label="EduAtlas kurumu ara"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => void runSearch()}
              disabled={busy || query.trim().length < 2}
            >
              Ara
            </Button>
          </div>
          {busy ? <p className="ea-admin-muted">Aranıyor…</p> : null}
          {error ? (
            <p className="ea-admin-visuals__status" role="alert">
              {error}
            </p>
          ) : null}
          {items.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
              {items.map((item) => (
                <li key={item.id} style={{ padding: "0.35rem 0" }}>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSelected(item);
                      setItems([]);
                    }}
                  >
                    Seç: {item.name} — {formatOutreachInstitutionLocation(item)}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
