import db from "./database.js";

async function GetLikes(catId) {
  return db.getLikes(catId);
}

export default GetLikes;
