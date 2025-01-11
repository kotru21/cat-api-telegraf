import db from "./Database.js";
// getlikes
async function GetLikes(catId) {
  return db.getLikes(catId);
}

export default GetLikes;
