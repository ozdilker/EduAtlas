"use client";

import type { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../components/button";
import { Container } from "../components/container";
import type { OwnerMediaAssetView, OwnerMediaPageViewData } from "./owner-media-content";
import { OwnerPortalShell } from "./owner-portal-shell";

export type OwnerMediaPageProps = {
  data: OwnerMediaPageViewData;
  uploadAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  setPrimaryAction: (formData: FormData) => Promise<void>;
  reorderAction: (formData: FormData) => Promise<void>;
};

function PendingButton({
  children,
  ...props
}: ComponentProps<typeof Button> & { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending || props.disabled}>
      {pending ? "İşleniyor…" : children}
    </Button>
  );
}

function AssetCard({
  asset,
  deleteAction,
  setPrimaryAction,
  reorderAction,
  showReorder,
  canMoveUp,
  canMoveDown,
}: {
  asset: OwnerMediaAssetView;
  deleteAction: (formData: FormData) => Promise<void>;
  setPrimaryAction: (formData: FormData) => Promise<void>;
  reorderAction: (formData: FormData) => Promise<void>;
  showReorder: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <article className="ea-owner-media__card" data-primary={asset.isPrimary}>
      <div className="ea-owner-media__preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt={asset.fileName} loading="lazy" />
      </div>
      <div className="ea-owner-media__meta">
        <p className="ea-owner-media__filename">{asset.fileName}</p>
        <p className="ea-owner-muted">
          {asset.byteSizeLabel}
          {asset.isPrimary ? " · Birincil" : ""}
        </p>
      </div>
      <div className="ea-owner-media__card-actions">
        {!asset.isPrimary ? (
          <form action={setPrimaryAction}>
            <input type="hidden" name="mediaId" value={asset.id} />
            <PendingButton type="submit" size="sm">
              Birincil yap
            </PendingButton>
          </form>
        ) : null}
        {showReorder ? (
          <>
            <form action={reorderAction}>
              <input type="hidden" name="mediaId" value={asset.id} />
              <input type="hidden" name="direction" value="up" />
              <PendingButton type="submit" size="sm" disabled={!canMoveUp} aria-label="Yukarı taşı">
                ↑
              </PendingButton>
            </form>
            <form action={reorderAction}>
              <input type="hidden" name="mediaId" value={asset.id} />
              <input type="hidden" name="direction" value="down" />
              <PendingButton
                type="submit"
                size="sm"
                disabled={!canMoveDown}
                aria-label="Aşağı taşı"
              >
                ↓
              </PendingButton>
            </form>
          </>
        ) : null}
        <form action={deleteAction}>
          <input type="hidden" name="mediaId" value={asset.id} />
          <PendingButton type="submit" size="sm" aria-label={`${asset.fileName} sil`}>
            Sil
          </PendingButton>
        </form>
      </div>
    </article>
  );
}

function UploadSlot({
  title,
  description,
  type,
  accept,
  uploadAction,
  empty,
}: {
  title: string;
  description: string;
  type: "logo" | "cover" | "gallery";
  accept: string;
  uploadAction: (formData: FormData) => Promise<void>;
  empty: boolean;
}) {
  const inputId = `owner-media-upload-${type}`;
  return (
    <div className="ea-owner-media__upload">
      {empty ? (
        <p className="ea-owner-media__placeholder" role="note">
          {type === "logo"
            ? "Henüz logo yok. JPEG, PNG veya WebP yükleyin."
            : type === "cover"
              ? "Henüz kapak görseli yok."
              : "Galeri boş. Birden fazla görsel ekleyebilirsiniz."}
        </p>
      ) : null}
      <form
        action={uploadAction}
        className="ea-owner-media__upload-form"
        encType="multipart/form-data"
      >
        <input type="hidden" name="type" value={type} />
        <div className="ea-owner-media__field">
          <label htmlFor={inputId}>{title}</label>
          <p className="ea-owner-muted">{description}</p>
          <input id={inputId} name="file" type="file" accept={accept} required />
        </div>
        <PendingButton type="submit" variant="primary" size="sm">
          Yükle
        </PendingButton>
      </form>
    </div>
  );
}

/**
 * Owner media foundation page — logo, cover, gallery via server actions.
 * No Firebase Storage access from the UI.
 */
export function OwnerMediaPage({
  data,
  uploadAction,
  deleteAction,
  setPrimaryAction,
  reorderAction,
}: OwnerMediaPageProps) {
  return (
    <OwnerPortalShell
      institutionName={data.institutionName}
      institutionLogoUrl={data.institutionLogoUrl}
    >
      <Container size="xl" className="ea-owner-portal">
        <header className="ea-owner-portal__hero">
          <p className="ea-owner-portal__eyebrow">Kurum paneli</p>
          <h1 className="ea-owner-portal__title">Medya</h1>
          <p className="ea-owner-portal__description">
            Logo, kapak ve galeri görsellerini yönetin. AI düzenleme ve moderasyon bu sprintte
            yoktur; yüklemeler sunucu tarafında doğrulanır.
          </p>
        </header>

        {data.notice ? (
          <p
            className={
              data.noticeTone === "error"
                ? "ea-owner-media__status ea-owner-media__status--error"
                : "ea-owner-media__status ea-owner-media__status--info"
            }
            role="status"
          >
            {data.notice}
          </p>
        ) : null}

        <p className="ea-owner-muted">
          İzin verilen biçimler: {data.limits.allowedFormatsLabel}. En fazla{" "}
          {data.limits.maxByteSizeMb} MB / görsel. Galeri limiti: {data.limits.maxGallery}.
        </p>

        <section className="ea-owner-media__section" aria-labelledby="owner-media-logo">
          <h2 id="owner-media-logo" className="ea-owner-media__section-title">
            Logo
          </h2>
          <div className="ea-owner-media__grid">
            {data.logo.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                deleteAction={deleteAction}
                setPrimaryAction={setPrimaryAction}
                reorderAction={reorderAction}
                showReorder={false}
                canMoveUp={false}
                canMoveDown={false}
              />
            ))}
          </div>
          <UploadSlot
            title="Logo yükle"
            description="Tek logo slotu — yeni yükleme mevcut logoyu değiştirir."
            type="logo"
            accept="image/jpeg,image/png,image/webp"
            uploadAction={uploadAction}
            empty={data.logo.length === 0}
          />
        </section>

        <section className="ea-owner-media__section" aria-labelledby="owner-media-cover">
          <h2 id="owner-media-cover" className="ea-owner-media__section-title">
            Kapak görseli
          </h2>
          <div className="ea-owner-media__grid">
            {data.cover.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                deleteAction={deleteAction}
                setPrimaryAction={setPrimaryAction}
                reorderAction={reorderAction}
                showReorder={false}
                canMoveUp={false}
                canMoveDown={false}
              />
            ))}
          </div>
          <UploadSlot
            title="Kapak yükle"
            description="Tek kapak slotu — yeni yükleme mevcut kapağı değiştirir."
            type="cover"
            accept="image/jpeg,image/png,image/webp"
            uploadAction={uploadAction}
            empty={data.cover.length === 0}
          />
        </section>

        <section className="ea-owner-media__section" aria-labelledby="owner-media-gallery">
          <h2 id="owner-media-gallery" className="ea-owner-media__section-title">
            Galeri
          </h2>
          <div className="ea-owner-media__grid">
            {data.gallery.map((asset, index) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                deleteAction={deleteAction}
                setPrimaryAction={setPrimaryAction}
                reorderAction={reorderAction}
                showReorder
                canMoveUp={index > 0}
                canMoveDown={index < data.gallery.length - 1}
              />
            ))}
          </div>
          <UploadSlot
            title="Galeriye ekle"
            description="Birden fazla görsel ekleyin; birincil seçin veya yukarı/aşağı ile sıralayın."
            type="gallery"
            accept="image/jpeg,image/png,image/webp"
            uploadAction={uploadAction}
            empty={data.gallery.length === 0}
          />
        </section>
      </Container>
    </OwnerPortalShell>
  );
}
