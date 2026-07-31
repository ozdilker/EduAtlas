/**
 * Weekly working hours for an institution (Monday–Sunday).
 */

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS_TR: Readonly<Record<Weekday, string>> = Object.freeze({
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
});

export type DayWorkingHours = Readonly<{
  readonly isOpen: boolean;
  /** Local time `HH:mm` when open. */
  readonly openTime?: string;
  /** Local time `HH:mm` when open. */
  readonly closeTime?: string;
}>;

export type InstitutionWorkingHours = Readonly<Record<Weekday, DayWorkingHours>>;

export type CreateDayWorkingHoursInput = {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
};

export type CreateInstitutionWorkingHoursInput = Partial<
  Record<Weekday, CreateDayWorkingHoursInput>
>;

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function assertTime(value: string, field: string): string {
  const trimmed = value.trim();
  if (!TIME_PATTERN.test(trimmed)) {
    throw new Error(`${field} must be HH:mm.`);
  }
  return trimmed;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Creates an immutable day schedule entry.
 */
export function createDayWorkingHours(input: CreateDayWorkingHoursInput): DayWorkingHours {
  if (!input.isOpen) {
    return Object.freeze({ isOpen: false });
  }

  const openTime = assertTime(input.openTime ?? "", "DayWorkingHours.openTime");
  const closeTime = assertTime(input.closeTime ?? "", "DayWorkingHours.closeTime");

  if (toMinutes(closeTime) <= toMinutes(openTime)) {
    throw new Error("DayWorkingHours.closeTime must be after openTime.");
  }

  return Object.freeze({
    isOpen: true,
    openTime,
    closeTime,
  });
}

/**
 * Builds a full Mon–Sun schedule. Missing days default to closed.
 */
export function createInstitutionWorkingHours(
  input: CreateInstitutionWorkingHoursInput = {},
): InstitutionWorkingHours {
  const days = {} as Record<Weekday, DayWorkingHours>;
  for (const day of WEEKDAYS) {
    days[day] = createDayWorkingHours(input[day] ?? { isOpen: false });
  }
  return Object.freeze(days);
}

/**
 * Empty schedule (all days closed) for forms without saved hours.
 */
export function createEmptyInstitutionWorkingHours(): InstitutionWorkingHours {
  return createInstitutionWorkingHours();
}

export function isWeekday(value: string): value is Weekday {
  return (WEEKDAYS as readonly string[]).includes(value);
}
