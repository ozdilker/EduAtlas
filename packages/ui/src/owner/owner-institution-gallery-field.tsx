"use client";

import {
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "../components/button";
import { cn } from "../lib/cn";

const GALLERY_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
const POINTER_DRAG_THRESHOLD_PX = 8;

export type OwnerGalleryUploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
};

export type OwnerInstitutionGalleryFieldProps = {
  institutionName: string;
  images: readonly string[];
  maxImages: number;
  uploads?: readonly OwnerGalleryUploadItem[];
  error?: string;
  message?: string;
  disabled?: boolean;
  deletingUrl?: string | null;
  reordering?: boolean;
  onFilesSelected: (files: File[]) => void;
  onDeleteImage?: (imageUrl: string) => void;
  /** Called when the user finishes a drag reorder with a new URL order. */
  onReorderImages?: (orderedUrls: readonly string[]) => void;
  className?: string;
};

function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return [...items];
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) {
    return [...items];
  }
  next.splice(toIndex, 0, item);
  return next;
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((url, index) => url === right[index]);
}

/**
 * Gallery grid + multi-file picker for the owner profile form.
 * Supports HTML5 + pointer drag-and-drop reordering (desktop and mobile).
 */
export function OwnerInstitutionGalleryField({
  institutionName,
  images,
  maxImages,
  uploads = [],
  error,
  message,
  disabled = false,
  deletingUrl = null,
  reordering = false,
  onFilesSelected,
  onDeleteImage,
  onReorderImages,
  className,
}: OwnerInstitutionGalleryFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const pointerDragRef = useRef<{
    pointerId: number;
    originX: number;
    originY: number;
    active: boolean;
    fromIndex: number;
  } | null>(null);

  const displayImages = draftOrder ?? [...images];
  const atLimit = images.length >= maxImages;
  const busy =
    uploads.some((item) => item.status === "uploading") || disabled || reordering;
  const canReorder = Boolean(onReorderImages) && !busy && displayImages.length > 1;

  useEffect(() => {
    if (dragIndex === null) {
      setDraftOrder(null);
    }
  }, [images, dragIndex]);

  function beginDrag(index: number) {
    setDragIndex(index);
    setDraftOrder([...images]);
  }

  function previewMove(toIndex: number) {
    if (dragIndex === null || dragIndex === toIndex) {
      return;
    }
    setDraftOrder((current) => {
      const base = current ?? [...images];
      return moveItem(base, dragIndex, toIndex);
    });
    setDragIndex(toIndex);
  }

  function commitDrag() {
    const nextOrder = draftOrder;
    const previous = [...images];
    setDragIndex(null);
    setDraftOrder(null);
    pointerDragRef.current = null;

    if (!onReorderImages || !nextOrder || sameOrder(nextOrder, previous)) {
      return;
    }
    onReorderImages(nextOrder);
  }

  function cancelDrag() {
    setDragIndex(null);
    setDraftOrder(null);
    pointerDragRef.current = null;
  }

  function handleHtmlDragStart(index: number, event: ReactDragEvent<HTMLLIElement>) {
    if (!canReorder) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    beginDrag(index);
  }

  function handleHtmlDragEnter(index: number, event: ReactDragEvent<HTMLLIElement>) {
    event.preventDefault();
    if (dragIndex === null || !canReorder) {
      return;
    }
    previewMove(index);
  }

  function handleHtmlDragOver(event: ReactDragEvent<HTMLLIElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handlePointerDown(index: number, event: ReactPointerEvent<HTMLLIElement>) {
    if (!canReorder || event.button !== 0) {
      return;
    }
    // Ignore primary mouse HTML5 path — use native drag there.
    if (event.pointerType === "mouse") {
      return;
    }
    pointerDragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      active: false,
      fromIndex: index,
    };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLUListElement>) {
    const state = pointerDragRef.current;
    if (!state || event.pointerId !== state.pointerId || !canReorder) {
      return;
    }

    const dx = event.clientX - state.originX;
    const dy = event.clientY - state.originY;
    if (!state.active) {
      if (Math.hypot(dx, dy) < POINTER_DRAG_THRESHOLD_PX) {
        return;
      }
      state.active = true;
      beginDrag(state.fromIndex);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const item = el?.closest<HTMLElement>("[data-gallery-index]");
    if (!item) {
      return;
    }
    const toIndex = Number(item.dataset.galleryIndex);
    if (Number.isInteger(toIndex)) {
      previewMove(toIndex);
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLUListElement>) {
    const state = pointerDragRef.current;
    if (!state || event.pointerId !== state.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (state.active) {
      commitDrag();
    } else {
      pointerDragRef.current = null;
    }
  }

  return (
    <div className={cn("ea-owner-profile-gallery", className)}>
      {displayImages.length > 0 ? (
        <ul
          className={cn(
            "ea-owner-profile-gallery__grid",
            dragIndex !== null && "ea-owner-profile-gallery__grid--dragging",
          )}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={cancelDrag}
        >
          {displayImages.map((url, index) => {
            const isDeleting = deletingUrl === url;
            const isDragging = dragIndex === index;
            return (
              <li
                key={`${url}-${index}`}
                data-gallery-index={index}
                className={cn(
                  "ea-owner-profile-gallery__item",
                  canReorder && "ea-owner-profile-gallery__item--sortable",
                  isDragging && "ea-owner-profile-gallery__item--dragging",
                )}
                draggable={canReorder}
                onDragStart={(event) => handleHtmlDragStart(index, event)}
                onDragEnter={(event) => handleHtmlDragEnter(index, event)}
                onDragOver={handleHtmlDragOver}
                onDragEnd={commitDrag}
                onPointerDown={(event) => handlePointerDown(index, event)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${institutionName} galeri görseli ${index + 1}`}
                  className="ea-owner-profile-gallery__image"
                  loading="lazy"
                  draggable={false}
                />
                {onDeleteImage ? (
                  <button
                    type="button"
                    className="ea-owner-profile-gallery__delete"
                    disabled={busy || isDeleting}
                    aria-label={`${institutionName} galeri görseli ${index + 1} sil`}
                    onClick={() => onDeleteImage(url)}
                    onPointerDown={(event) => event.stopPropagation()}
                    onDragStart={(event) => event.preventDefault()}
                  >
                    {isDeleting ? "Siliniyor…" : "Sil"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="ea-owner-profile-gallery__placeholder" role="status">
          <span>Henüz galeri görseli yok</span>
        </div>
      )}

      {uploads.length > 0 ? (
        <ul className="ea-owner-profile-gallery__uploads" aria-live="polite">
          {uploads.map((item) => (
            <li key={item.id} className="ea-owner-profile-gallery__upload">
              <div className="ea-owner-profile-gallery__upload-meta">
                <span className="ea-owner-profile-gallery__upload-name">{item.fileName}</span>
                <span className="ea-owner-profile-gallery__upload-status">
                  {item.status === "uploading"
                    ? `${item.progress}%`
                    : item.status === "success"
                      ? "Tamam"
                      : "Hata"}
                </span>
              </div>
              {item.status === "uploading" ? (
                <div
                  className="ea-owner-profile-gallery__progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.progress}
                  aria-label={`${item.fileName} yükleme`}
                >
                  <div className="ea-owner-profile-gallery__progress-track">
                    <div
                      className="ea-owner-profile-gallery__progress-bar"
                      style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                    />
                  </div>
                </div>
              ) : null}
              {item.status === "error" && item.error ? (
                <p className="ea-owner-profile-gallery__upload-error">{item.error}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="ea-owner-profile-gallery__actions">
        <input
          ref={inputRef}
          id={inputId}
          className="ea-owner-profile-gallery__input"
          type="file"
          accept={GALLERY_ACCEPT}
          multiple
          disabled={busy || atLimit}
          onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (selected.length > 0) {
              onFilesSelected(selected);
            }
          }}
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy || atLimit}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Yükleniyor…" : "Fotoğraf Ekle"}
        </Button>
        <p className="ea-owner-profile-gallery__hint">
          JPG, JPEG, PNG veya WEBP · en fazla 10 MB · {images.length}/{maxImages} görsel
          {images.length > 1 ? " · sürükleyerek sıralayın" : ""}
        </p>
      </div>

      {atLimit ? (
        <p
          className="ea-owner-profile-gallery__status ea-owner-profile-gallery__status--error"
          role="status"
        >
          Galeri limiti doldu ({maxImages} görsel).
        </p>
      ) : null}

      {error ? (
        <p
          className="ea-owner-profile-gallery__status ea-owner-profile-gallery__status--error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!error && message ? (
        <p
          className="ea-owner-profile-gallery__status ea-owner-profile-gallery__status--success"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
