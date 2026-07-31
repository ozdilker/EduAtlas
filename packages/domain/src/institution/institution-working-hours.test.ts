import { describe, expect, it } from "vitest";
import {
  createDayWorkingHours,
  createEmptyInstitutionWorkingHours,
  createInstitutionWorkingHours,
  WEEKDAYS,
} from "./institution-working-hours";

describe("institution working hours", () => {
  it("creates a closed day without times", () => {
    expect(createDayWorkingHours({ isOpen: false })).toEqual({ isOpen: false });
  });

  it("requires open/close times when open", () => {
    expect(() => createDayWorkingHours({ isOpen: true })).toThrow(/HH:mm/);
    expect(
      createDayWorkingHours({ isOpen: true, openTime: "09:00", closeTime: "18:00" }),
    ).toEqual({
      isOpen: true,
      openTime: "09:00",
      closeTime: "18:00",
    });
  });

  it("rejects close time before open time", () => {
    expect(() =>
      createDayWorkingHours({ isOpen: true, openTime: "18:00", closeTime: "09:00" }),
    ).toThrow(/after openTime/);
  });

  it("defaults missing weekdays to closed", () => {
    const hours = createInstitutionWorkingHours({
      monday: { isOpen: true, openTime: "08:30", closeTime: "17:00" },
    });
    expect(hours.monday.isOpen).toBe(true);
    expect(hours.sunday.isOpen).toBe(false);
    expect(WEEKDAYS).toHaveLength(7);
    expect(createEmptyInstitutionWorkingHours().friday.isOpen).toBe(false);
  });
});
