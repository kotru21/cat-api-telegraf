import { describe, it, expect } from "@jest/globals";
import { renderLikes } from "../../src/web/public/js/core/ui/likes.ts";
import "../setup/setupEnv";

describe("renderLikes", () => {
  it("renders list of like cards", () => {
    document.body.innerHTML = '<div id="c"></div>';
    const container = document.getElementById("c");
    const data = [
      { catId: "1", breedName: "Breed A", imageUrl: "", likes: 2 },
      { catId: "2", breedName: "Breed B", imageUrl: "", likes: 5 },
    ];
    const cards = renderLikes({
      container: container as HTMLElement,
      data,
      onRemove: () => {},
    });
    expect(cards.length).toBe(2);
    expect(container?.querySelectorAll(".cat-card").length).toBe(2);
    expect(container?.textContent).toContain("Breed A");
  });

  it("returns empty if no container", () => {
    const cards = renderLikes({
      container: null as any,
      data: [],
      onRemove: () => {},
    });
    expect(cards).toEqual([]);
  });
});
