import db from "./database.js";

async function AddLikes(catId) {
  return db.addLikes(catId);
}

export default AddLikes;
