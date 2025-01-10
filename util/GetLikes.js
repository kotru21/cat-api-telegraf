import db from "./Database.js";

async function GetLikes(catId) {
  return db.getLikes(catId);
}

export default GetLikes;
