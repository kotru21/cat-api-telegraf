import sqlite3 from "sqlite3";
var db = new sqlite3.Database("./main.db");
db.run("CREATE TABLE IF NOT EXISTS msg (id TEXT PRIMARY KEY , count INTEGER)");

async function GetLikes(result) {
  db.run(`insert into msg (id, count)
  Select '${result}', '0' Where not exists(select * from msg where id='${result}')`);
  return new Promise((resolve, reject) => {
    db.all(`SELECT count FROM msg WHERE id='${result}';`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}
export default GetLikes;
