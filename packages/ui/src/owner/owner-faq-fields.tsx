"use client";

import { useState } from "react";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { cn } from "../lib/cn";

export type OwnerFaqFormItem = {
  id: string;
  question: string;
  answer: string;
};

export type OwnerFaqFieldsProps = {
  value?: readonly OwnerFaqFormItem[];
  className?: string;
};

function createFaqId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `faq_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `faq_${Date.now().toString(36)}`;
}

/**
 * Dynamic FAQ editor — add / edit / delete / reorder; posts with the parent form.
 */
export function OwnerFaqFields({ value = [], className }: OwnerFaqFieldsProps) {
  const [items, setItems] = useState<OwnerFaqFormItem[]>(() =>
    value.map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
  );

  function updateItem(index: number, patch: Partial<OwnerFaqFormItem>) {
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
    <div className={cn("ea-owner-profile-faqs", className)}>
      <p className="ea-owner-profile-form__section-text">
        Velilerin sık sorduğu soruları ekleyin, düzenleyin ve sıralayın.
      </p>

      {items.length === 0 ? (
        <p className="ea-owner-profile-faqs__empty" role="status">
          Henüz SSS eklenmedi.
        </p>
      ) : (
        <ul className="ea-owner-profile-faqs__list">
          {items.map((item, index) => (
            <li key={item.id} className="ea-owner-profile-faqs__item">
              <input type="hidden" name={`faqs.${index}.id`} value={item.id} />
              <div className="ea-owner-profile-faqs__header">
                <span className="ea-owner-profile-faqs__index">Soru {index + 1}</span>
                <div className="ea-owner-profile-faqs__controls">
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveItem(index, index - 1)}
                    aria-label={`Soruyu yukarı taşı (${index + 1})`}
                  >
                    Yukarı
                  </Button>
                  <Button
                    type="button"
                    variant="tertiary"
                    size="sm"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, index + 1)}
                    aria-label={`Soruyu aşağı taşı (${index + 1})`}
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
                  htmlFor={`owner-faq-question-${item.id}`}
                >
                  Soru
                </label>
                <Input
                  id={`owner-faq-question-${item.id}`}
                  name={`faqs.${index}.question`}
                  value={item.question}
                  maxLength={300}
                  required
                  onChange={(event) => updateItem(index, { question: event.target.value })}
                  placeholder="Örn. Ücretlendirme nasıl?"
                />
              </div>
              <div className="ea-owner-profile-form__field">
                <label
                  className="ea-owner-profile-form__label"
                  htmlFor={`owner-faq-answer-${item.id}`}
                >
                  Cevap
                </label>
                <textarea
                  id={`owner-faq-answer-${item.id}`}
                  name={`faqs.${index}.answer`}
                  className="ea-owner-profile-form__textarea"
                  rows={3}
                  maxLength={2000}
                  required
                  value={item.answer}
                  onChange={(event) => updateItem(index, { answer: event.target.value })}
                  placeholder="Kısa ve net bir cevap yazın."
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
            { id: createFaqId(), question: "", answer: "" },
          ])
        }
      >
        Soru ekle
      </Button>
    </div>
  );
}
