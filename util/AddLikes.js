import db from "./Database.js";

async function AddLikes(catId, imageUrl, breedName) {
  return db.addLikes(catId, imageUrl, breedName);
}

export default AddLikes;
