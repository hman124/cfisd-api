const fs = require("fs");
const sqlite3 = require("sqlite3");

const dbfile = __dirname + "/.data/cfisdapi_v1.0.3.db";
const exists = fs.existsSync(dbfile);

const db = new sqlite3.Database(dbfile);

if(!exists){
  console.log("setting up...");
  db.serialize(()=>{
    db.run("CREATE TABLE Users (username TEXT, hash TEXT, salt TEXT, grades TEXT, last_update INT)")
  });
}

module.exports = {
  all: (q, ...s)=>new Promise((r, j)=>{
    db.all(q, ...s, (err, row) => {
      if(err){r(err);}
      else {r(row);}
    });
  }), run: (q, ...s)=>new Promise((r, j)=>{
    db.run(q, ...s, err => {
      if(err){r(err);}
      else {r(true);}
    });
  })
}
