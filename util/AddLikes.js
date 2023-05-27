import sqlite3 from "sqlite3";
var db = new sqlite3.Database("./main.db");

async function AddLikes(result) {
  return new Promise((resolve, reject) => {
    db.all(`UPDATE msg SET count = count + 1 WHERE id='${result}';`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
export default AddLikes;
