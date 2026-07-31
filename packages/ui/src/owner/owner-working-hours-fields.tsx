"use client";

import { useState } from "react";
import { Input } from "../components/input";
import { cn } from "../lib/cn";
import type { OwnerWorkingHoursFormValue } from "./owner-institution-profile-content";

const DAY_ORDER = [
  ["monday", "Pazartesi"],
  ["tuesday", "Salı"],
  ["wednesday", "Çarşamba"],
  ["thursday", "Perşembe"],
  ["friday", "Cuma"],
  ["saturday", "Cumartesi"],
  ["sunday", "Pazar"],
] as const;

export type OwnerWorkingHoursFieldsProps = {
  value: OwnerWorkingHoursFormValue;
  className?: string;
};

/**
 * Weekly working hours editor — posts with the parent profile form.
 * Open/closed state always posts via hidden fields; time inputs stay enabled
 * so values are included in FormData (disabled fields are omitted by browsers).
 */
export function OwnerWorkingHoursFields({ value, className }: OwnerWorkingHoursFieldsProps) {
  const [openDays, setOpenDays] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [day] of DAY_ORDER) {
      initial[day] = value[day].isOpen;
    }
    return initial;
  });

  return (
    <div className={cn("ea-owner-profile-hours", className)}>
      <p className="ea-owner-profile-form__section-text">
        Her gün için açık/kapalı durumu ve çalışma aralığını belirleyin.
      </p>
      <ul className="ea-owner-profile-hours__list">
        {DAY_ORDER.map(([day, label]) => {
          const dayValue = value[day];
          const isOpen = openDays[day] ?? false;
          return (
            <li key={day} className="ea-owner-profile-hours__row">
              <input type="hidden" name={`hours.${day}.isOpen`} value={isOpen ? "1" : "0"} />
              <div className="ea-owner-profile-hours__day">
                <label className="ea-owner-profile-hours__toggle">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    onChange={(event) => {
                      setOpenDays((current) => ({
                        ...current,
                        [day]: event.target.checked,
                      }));
                    }}
                  />
                  <span>{label}</span>
                </label>
                <span className="ea-owner-profile-hours__state">
                  {isOpen ? "Açık" : "Kapalı"}
                </span>
              </div>
              <div className="ea-owner-profile-hours__times" aria-disabled={!isOpen}>
                <div className="ea-owner-profile-form__field">
                  <label
                    className="ea-owner-profile-form__label"
                    htmlFor={`owner-hours-${day}-open`}
                  >
                    Açılış
                  </label>
                  <Input
                    id={`owner-hours-${day}-open`}
                    name={`hours.${day}.openTime`}
                    type="time"
                    defaultValue={dayValue.openTime}
                    readOnly={!isOpen}
                    tabIndex={isOpen ? undefined : -1}
                  />
                </div>
                <div className="ea-owner-profile-form__field">
                  <label
                    className="ea-owner-profile-form__label"
                    htmlFor={`owner-hours-${day}-close`}
                  >
                    Kapanış
                  </label>
                  <Input
                    id={`owner-hours-${day}-close`}
                    name={`hours.${day}.closeTime`}
                    type="time"
                    defaultValue={dayValue.closeTime}
                    readOnly={!isOpen}
                    tabIndex={isOpen ? undefined : -1}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
