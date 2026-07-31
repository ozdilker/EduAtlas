"use client";

import { useState } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type OwnerHighlightFormItem = {
  id: string;
  title: string;
  description: string;
};

export type OwnerHighlightFieldsProps = {
  value?: readonly OwnerHighlightFormItem[];
  className?: string;
};

function createHighlightId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `highlight_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `highlight_${Date.now().toString(36)}`;
}

/**
 * Dynamic highlight editor — add / edit / delete / reorder; posts with the parent form.
 */
export function OwnerHighlightFields({ value = [], className }: OwnerHighlightFieldsProps) {
  const [items, setItems] = useState<OwnerHighlightFormItem[]>(() =>
    value.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    })),
  );

  function updateItem(index: number, patch: Partial<OwnerHighlightFormItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  }

  function moveItem(fromIndex: number, toIndex: number) {
    setItems((current) => {
      if (toIndex < 0 || toIndex >= current.length) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) {
        return current;
      }
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  return (
    <div className={cn("ea-owner-profile-highlights", className)}>
      <p className="ea-owner-profile-form__section-text">
        Kurum detay sayfasında “Öne çıkan özellikler” olarak gösterilecek başlık ve kısa açıklamaları
        ekleyin.
      </p>

      {items.length === 0 ? (
        <p className="ea-owner-profile-highlights__empty" role="status">
          Henüz öne çıkan özellik eklenmedi.
        </p>
      ) : (
        <ul className="ea-owner-profile-highlights__list">
          {items.map((item, index) => (
            <li key={item.id} className="ea-owner-profile-highlights__item">
              <input type="hidden" name={`highlights.${index}.id`} value={item.id} />
              <div className="ea-owner-profile-highlights__header">
                <span className="ea-owner-profile-highlights__index">Özellik {index + 1}</span>
                <div className="ea-owner-profile-highlights__controls">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveItem(index, index - 1)}
                    aria-label={`Özelliği yukarı taşı (${index + 1})`}
                  >
                    Yukarı
                  </Button>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, index + 1)}
                    aria-label={`Özelliği aşağı taşı (${index + 1})`}
                  >
                    Aşağı
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
                    }
                  >
                    Sil
                  </Button>
                </div>
              </div>
              <div className="ea-owner-profile-form__field">
                <label
                  className="ea-owner-profile-form__label"
                  htmlFor={`owner-highlight-title-${item.id}`}
                >
                  Başlık
                </label>
                <Input
                  id={`owner-highlight-title-${item.id}`}
                  name={`highlights.${index}.title`}
                  value={item.title}
                  maxLength={120}
                  required
                  onChange={(event) => updateItem(index, { title: event.target.value })}
                  placeholder="Örn. Güvenli kampüs"
                />
              </div>
              <div className="ea-owner-profile-form__field">
                <label
                  className="ea-owner-profile-form__label"
                  htmlFor={`owner-highlight-description-${item.id}`}
                >
                  Açıklama
                </label>
                <textarea
                  id={`owner-highlight-description-${item.id}`}
                  name={`highlights.${index}.description`}
                  className="ea-owner-profile-form__textarea"
                  rows={3}
                  maxLength={500}
                  required
                  value={item.description}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                  placeholder="Kısa bir açıklama yazın."
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() =>
          setItems((current) => [
            ...current,
            { id: createHighlightId(), title: "", description: "" },
          ])
        }
      >
        Özellik ekle
      </Button>
    </div>
  );
}
