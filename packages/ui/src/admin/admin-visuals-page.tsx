"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import { buildAdminNavItems } from "./admin-nav";
import { AdminShell } from "./admin-shell";

export type AdminVisualSlotView = {
  slot: string;
  label: string;
  imageUrl: string;
  hasCustomImage: boolean;
  section: "hero" | "popular" | "cities";
};

export type AdminVisualsPageData = {
  title: string;
  subtitle: string;
  heroSlot: AdminVisualSlotView;
  popularSlots: readonly AdminVisualSlotView[];
  citySlots: readonly AdminVisualSlotView[];
  updatedAtLabel?: string;
};

export type UpdateAdminHomepageVisualState = {
  ok: boolean;
  message: string;
  slot?: string;
  imageUrl?: string;
};

export type AdminVisualsPageProps = {
  data: AdminVisualsPageData;
  uploadAction: (formData: FormData) => Promise<UpdateAdminHomepageVisualState>;
};

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

type SlotCardProps = {
  item: AdminVisualSlotView;
  uploading: boolean;
  disabled: boolean;
  onPick: (slot: string) => void;
  inputRef: (slot: string, node: HTMLInputElement | null) => void;
  onFile: (slot: string, file: File | undefined) => void;
  heroLayout?: boolean;
};

function SlotCard({
  item,
  uploading,
  disabled,
  onPick,
  inputRef,
  onFile,
  heroLayout,
}: SlotCardProps) {
  return (
    <article className="ea-admin-visuals__card">
      <div
                    className={cn(
                      "ea-admin-visuals__preview",
                      heroLayout && "ea-admin-visuals__preview-hero",
                      !item.imageUrl && "ea-admin-visuals__preview-empty",
                    )}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="ea-admin-visuals__image" />
        ) : (
          <span className="ea-admin-visuals__placeholder">Görsel yok</span>
        )}
      </div>
      <div className="ea-admin-visuals__body">
        <h3 className="ea-admin-visuals__label">{item.label}</h3>
        <p className="ea-admin-muted">
          {item.hasCustomImage ? "Özel görsel yüklü" : "Varsayılan / boş"}
        </p>
        <input
          ref={(node) => inputRef(item.slot, node)}
          className="ea-admin-visuals__input"
          type="file"
          accept={ACCEPT}
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            onFile(item.slot, file);
          }}
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled}
          onClick={() => onPick(item.slot)}
        >
          {uploading ? "Yükleniyor…" : "Görseli değiştir"}
        </Button>
      </div>
    </article>
  );
}

/**
 * Admin page: default hero, popular city cards, and all-city hero images.
 */
export function AdminVisualsPage({ data, uploadAction }: AdminVisualsPageProps) {
  const [heroSlot, setHeroSlot] = useState(data.heroSlot);
  const [popularSlots, setPopularSlots] = useState(data.popularSlots);
  const [citySlots, setCitySlots] = useState(data.citySlots);
  const [cityQuery, setCityQuery] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [pendingSlot, setPendingSlot] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLocaleLowerCase("tr");
    if (!q) {
      return citySlots;
    }
    return citySlots.filter((item) => item.label.toLocaleLowerCase("tr").includes(q));
  }, [cityQuery, citySlots]);

  function patchSlot(slot: string, imageUrl: string) {
    if (slot === "hero") {
      setHeroSlot((prev) => ({ ...prev, imageUrl, hasCustomImage: true }));
      return;
    }
    setPopularSlots((prev) =>
      prev.map((item) =>
        item.slot === slot ? { ...item, imageUrl, hasCustomImage: true } : item,
      ),
    );
    setCitySlots((prev) =>
      prev.map((item) =>
        item.slot === slot ? { ...item, imageUrl, hasCustomImage: true } : item,
      ),
    );
  }

  function onPick(slot: string) {
    inputRefs.current[slot]?.click();
  }

  function onFile(slot: string, file: File | undefined) {
    if (!file) {
      return;
    }
    const formData = new FormData();
    formData.set("slot", slot);
    formData.set("file", file);

    setPendingSlot(slot);
    setMessage(undefined);
    setError(undefined);

    startTransition(async () => {
      const result = await uploadAction(formData);
      setPendingSlot(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(result.message);
      if (result.imageUrl) {
        patchSlot(slot, result.imageUrl);
      }
    });
  }

  const bindRef = (slot: string, node: HTMLInputElement | null) => {
    inputRefs.current[slot] = node;
  };

  return (
    <AdminShell activeNavId="visuals" navItems={buildAdminNavItems()}>
      <header className="ea-admin-page-header">
        <div>
          <h1 className="ea-admin-page-header__title">{data.title}</h1>
          <p className="ea-admin-page-header__subtitle">{data.subtitle}</p>
        </div>
        {data.updatedAtLabel ? (
          <p className="ea-admin-page-header__meta">Güncellendi: {data.updatedAtLabel}</p>
        ) : null}
      </header>

      {message ? (
        <p className="ea-admin-visuals__status" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="ea-admin-visuals__error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="ea-admin-visuals" aria-labelledby="admin-visuals-hero-heading">
        <h2 id="admin-visuals-hero-heading" className="ea-admin-section-title">
          Varsayılan hero
        </h2>
        <p className="ea-admin-muted">Şehir seçilmediğinde veya şehir görseli yoksa kullanılır.</p>
        <ul className="ea-admin-visuals__grid ea-admin-visuals__grid-hero">
          <li>
            <SlotCard
              item={heroSlot}
              heroLayout
              uploading={isPending && pendingSlot === heroSlot.slot}
              disabled={isPending}
              onPick={onPick}
              inputRef={bindRef}
              onFile={onFile}
            />
          </li>
        </ul>
      </section>

      <section className="ea-admin-visuals" aria-labelledby="admin-visuals-popular-heading">
        <h2 id="admin-visuals-popular-heading" className="ea-admin-section-title">
          Popüler şehir kartları
        </h2>
        <p className="ea-admin-muted">Ana sayfadaki “Popüler şehirler” bölümü için.</p>
        <ul className="ea-admin-visuals__grid">
          {popularSlots.map((item) => (
            <li key={`popular-${item.slot}`}>
              <SlotCard
                item={item}
                uploading={isPending && pendingSlot === item.slot}
                disabled={isPending}
                onPick={onPick}
                inputRef={bindRef}
                onFile={onFile}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="ea-admin-visuals" aria-labelledby="admin-visuals-cities-heading">
        <div className="ea-admin-visuals__cities-header">
          <div>
            <h2 id="admin-visuals-cities-heading" className="ea-admin-section-title">
              Şehir hero görselleri
            </h2>
            <p className="ea-admin-muted">
              Arama çubuğundan şehir seçildiğinde hero arka planı bu görselle değişir (alfabetik).
            </p>
          </div>
          <Input
            type="search"
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            placeholder="Şehir ara…"
            aria-label="Şehir listesinde ara"
            className="ea-admin-visuals__city-filter"
          />
        </div>
        <ul className="ea-admin-visuals__grid">
          {filteredCities.map((item) => (
            <li key={`city-${item.slot}`}>
              <SlotCard
                item={item}
                uploading={isPending && pendingSlot === item.slot}
                disabled={isPending}
                onPick={onPick}
                inputRef={bindRef}
                onFile={onFile}
              />
            </li>
          ))}
        </ul>
        {filteredCities.length === 0 ? (
          <p className="ea-admin-muted">Eşleşen şehir yok.</p>
        ) : null}
      </section>

      <p className="ea-admin-muted ea-admin-visuals__hint">
        JPG, PNG veya WEBP · en fazla 10 MB. Değişiklikler ana sayfada hemen yansır.
      </p>
    </AdminShell>
  );
}
