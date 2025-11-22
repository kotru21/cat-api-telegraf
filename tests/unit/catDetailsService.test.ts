import { describe, it, expect } from "@jest/globals";
import { normalizeCatDetails } from "../../src/web/public/js/core/services/CatDetailsService.ts";

describe("normalizeCatDetails", () => {
  it("normalizes full payload", () => {
    const raw = {
      id: "1",
      breed_name: "Test",
      description: "Desc",
      count: 3,
      wikipedia_url: "http://w",
      origin: "RU",
      temperament: "Calm",
      life_span: "10",
      weight_metric: "3",
      weight_imperial: "6",
      image_url: "img",
    };
    const n = normalizeCatDetails(raw);
    expect(n).toMatchObject({
      breedName: "Test",
      likes: 3,
      wikipediaUrl: "http://w",
      weightMetric: "3",
      weightImperial: "6",
    });
  });
  it("handles null gracefully", () => {
    expect(normalizeCatDetails(null)).toBeNull();
  });
});
