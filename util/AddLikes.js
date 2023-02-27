import sqlite3 from "sqlite3";
var db = new sqlite3.Database("./main.db");
async function AddLikes(result) {
  //   db.serialize(function () {
  //     // Create a table
  //     db.run("CREATE TABLE IF NOT EXISTS msg (id TEXT PRIMARY KEY , count INTEGER)");
  //   });
  //   db.run(`insert into msg (id, count)
  //   Select '${result}', '0' Where not exists(select * from msg where id='${result}')`);
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
