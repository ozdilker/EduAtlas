import { describe, expect, it } from "vitest";
import { BillingEntitlement, resolveLeadVisibility } from "./entitlements";
import { maskEmail, maskMessage, maskPersonName, maskPhone } from "./mask-lead-pii";

describe("mask lead PII", () => {
  it("masks Turkish-style names", () => {
    expect(maskPersonName("Ahmet Yılmaz")).toBe("Ahmet Y*****");
  });

  it("masks phones keeping first two digits", () => {
    expect(maskPhone("0532 123 45 67")).toBe("05********");
  });

  it("masks emails", () => {
    expect(maskEmail("ahmet@gmail.com")).toBe("ah****@gmail.com");
  });

  it("masks messages to a placeholder", () => {
    expect(maskMessage("Detaylı bilgi istiyorum")).toMatch(/^•+$/);
  });
});

describe("resolveLeadVisibility", () => {
  const free = {
    [BillingEntitlement.FreeLeadQuota]: 3,
  };

  it("opens first three leads on FREE quota", () => {
    expect(resolveLeadVisibility({ ordinal: 1, entitlements: free })).toBe("full");
    expect(resolveLeadVisibility({ ordinal: 3, entitlements: free })).toBe("full");
    expect(resolveLeadVisibility({ ordinal: 4, entitlements: free })).toBe("masked");
  });

  it("opens all when unlimitedLeads is set", () => {
    expect(
      resolveLeadVisibility({
        ordinal: 99,
        entitlements: { [BillingEntitlement.UnlimitedLeads]: true },
      }),
    ).toBe("full");
  });
});
