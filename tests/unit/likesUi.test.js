import { renderLikes } from "../../src/web/public/js/core/ui/likes.js";

describe("renderLikes", () => {
  it("renders list of like cards", () => {
    document.body.innerHTML = '<div id="c"></div>';
    const container = document.getElementById("c");
    const data = [
      { catId: "1", breedName: "Breed A", imageUrl: "", likes: 2 },
      { catId: "2", breedName: "Breed B", imageUrl: "", likes: 5 },
    ];
    const cards = renderLikes({ container, data });
    expect(cards.length).toBe(2);
    expect(container.querySelectorAll(".cat-card").length).toBe(2);
    expect(container.textContent).toContain("Breed A");
  });

  it("returns empty if no container", () => {
    const cards = renderLikes({ container: null, data: [] });
    expect(cards).toEqual([]);
  });
});
