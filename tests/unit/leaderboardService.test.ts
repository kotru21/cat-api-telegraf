import { describe, it, expect } from "@jest/globals";
import { normalizeRow } from "../../src/web/public/js/core/services/LeaderboardService.ts";

describe("normalizeRow", () => {
  it("maps backend row to expected shape", () => {
    const input = {
      breed_id: "abys",
      breed_name: "Abyssinian",
      likes: 12,
      rank: 1,
    };
    const out = normalizeRow(input, 0);
    expect(out).toMatchObject({
      position: 1,
      catId: "abys", // falls back to breed_id when id missing
      breedName: "Abyssinian",
      likes: 12,
      change: 0,
      imageUrl: "",
    });
  });

  it("defaults missing fields safely", () => {
    const out = normalizeRow({}, 4);
    expect(out.position).toBe(5);
    expect(out.catId).toBeUndefined();
    expect(out.likes).toBeUndefined();
    expect(out.imageUrl).toBe("");
  });
});
