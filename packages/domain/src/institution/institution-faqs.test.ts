import { describe, expect, it } from "vitest";
import { createInstitutionFaqs, INSTITUTION_FAQ_MAX_ITEMS } from "./institution-faqs";

describe("institution faqs", () => {
  it("normalizes ordered FAQ items and keeps ids", () => {
    const faqs = createInstitutionFaqs([
      { id: "faq_a", question: "Ücretler nasıl?", answer: "Yıllık ödeme planı vardır." },
      { id: "faq_b", question: "Servis var mı?", answer: "Evet, belirli güzergâhlarda." },
    ]);

    expect(faqs).toEqual([
      { id: "faq_a", question: "Ücretler nasıl?", answer: "Yıllık ödeme planı vardır." },
      { id: "faq_b", question: "Servis var mı?", answer: "Evet, belirli güzergâhlarda." },
    ]);
    expect(Object.isFrozen(faqs)).toBe(true);
  });

  it("drops empty rows and generates ids when missing", () => {
    const faqs = createInstitutionFaqs([
      { question: "  ", answer: "" },
      { question: "Kayıt ne zaman?", answer: "Her dönem başında." },
    ]);

    expect(faqs).toHaveLength(1);
    expect(faqs[0]?.id).toBe("faq_2");
    expect(faqs[0]?.question).toBe("Kayıt ne zaman?");
  });

  it("rejects incomplete or oversized items", () => {
    expect(() =>
      createInstitutionFaqs([{ question: "Soru?", answer: "" }]),
    ).toThrow(/answer is required/);

    expect(() =>
      createInstitutionFaqs([
        { question: "Q", answer: "A".repeat(2001) },
      ]),
    ).toThrow(/answer must be at most/);

    expect(() =>
      createInstitutionFaqs(
        Array.from({ length: INSTITUTION_FAQ_MAX_ITEMS + 1 }, (_, index) => ({
          question: `Soru ${index}`,
          answer: `Cevap ${index}`,
        })),
      ),
    ).toThrow(/at most/);
  });
});
