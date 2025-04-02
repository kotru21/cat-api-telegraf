export class CatController {
  constructor(catService) {
    this.catService = catService;
  }

  getCat = async (req, res) => {
    try {
      const id = req.params.id;
      if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const catData = await this.catService.getCatById(id);
      if (!catData) return res.status(404).json({ error: "Cat not found" });
      res.json(catData);
    } catch (err) {
      console.error("Error fetching cat:", err);
      res.status(500).json({ error: "Failed to fetch cat data" });
    }
  };

  getLeaderboard = async (req, res) => {
    try {
      const rows = await this.catService.getLeaderboard();
      res.json(rows);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  };

  getSimilarCats = async (req, res) => {
    try {
      const { feature, value } = req.query;

      if (!feature || !value) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const cats = await this.catService.getCatsByFeature(feature, value);
      res.json(cats);
    } catch (err) {
      console.error("Error fetching similar cats:", err);
      res.status(500).json({ error: "Failed to fetch similar cats" });
    }
  };

  getRandomImages = async (req, res) => {
    try {
      const count = parseInt(req.query.count) || 3;
      const images = await this.catService.getRandomImages(count);
      res.json(images);
    } catch (err) {
      console.error("Error fetching random images:", err);
      res.status(500).json({ error: "Failed to fetch random images" });
    }
  };
}
