import db from "./database.js";
// getlikes
async function GetLikes(catId) {
  return db.getLikes(catId);
}

export default GetLikes;
