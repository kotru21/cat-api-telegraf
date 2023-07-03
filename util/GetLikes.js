import sqlite3 from "sqlite3";
var db = new sqlite3.Database("./main.db");

async function GetLikes(catId) {
  db.run(`insert into msg (id, count)
  Select '${catId}', '0' Where not exists(select * from msg where id='${catId}')`);
  return new Promise((resolve, reject) => {
    db.all(`SELECT count FROM msg WHERE id='${catId}';`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
export default GetLikes;
