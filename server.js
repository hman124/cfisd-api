const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

const db = require("./database.js");
const crypto = require("crypto");

const cors = require("cors");

app.use(cors());

function toHash(salt, password) {
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

async function fromDatabase(username, password) {
  const [user] = await db.all(
    "SELECT hash,salt,grades,last_update FROM Users WHERE username=?",
    username
  );
  if (user) {
    const new_hash = toHash(user.salt, password);
    if (new_hash == user.hash) {
      return {
        success: true,
        update: false,
        data: JSON.parse(user.grades),
        age: Date.now() - user.last_update
      };
    } else {
      return { success: false, message: "Unauthorized", update: false };
    }
  } else {
    return { success: false, message: "No records found", update: true };
  }
}

async function getGrades(username, password) {
  const cached = await fromDatabase(username, password);
  if (cached.age < 1000 * 60 * 60 * 5 && !cached.update) {
    return {...cached};
  } else {
    //create a browser instance
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    //Creates a Page Instance, similar to creating a new Tab
    const page = await browser.newPage();

    //navigate to sign in page
    await page.goto("https://launchpad.classlink.com/cfisd");

    //input username and password
    await page.evaluate(
      (val) => {
        document.querySelector("#username").value = val.username;
        document.querySelector("#password").value = val.password;
      },
      { username, password }
    );

    //click sign in and wait for home access center button
    await Promise.all([page.click("#signin"), page.waitForTimeout(5000)]);

    await Promise.any([
      page.waitForSelector(
        "application[aria-label='Student Home Access Center']"
      ),
      page.waitForSelector("#signin"),
    ]);
 
    if (page.url().includes("launchpad.classlink.com/cfisd")) {
      //page hasn't redirected, must be incorrect login
      await browser.close(); //Closes the Browser Instance
      return { success: false, message: "Unauthorized" };
    } else {
      //click home access button and wait for the page to open
      const [hac] = await Promise.all([
        new Promise((resolve) => page.once("popup", resolve)),
        page.click("application[aria-label='Student Home Access Center']"),
      ]);

      //wait for page to load
      await hac.waitForSelector(".sg-homeview-table");

      //get table rows
      const fromtable = await hac.$$("table.sg-homeview-table tbody tr");
      const grades = Array.from(fromtable);

      //parse grades and course names from the rows
      const final = await Promise.all([
        ...grades.map(async (x) => {
          const [g, c] = await Promise.all([
            x.$("#average"),
            x.$("#courseName"),
          ]);
          const [gc, cc] = await Promise.all([
            g.getProperty("textContent"),
            c.getProperty("textContent"),
          ]);
          const [gj, cj] = await Promise.all([gc.jsonValue(), cc.jsonValue()]);
          if (/^[0-9]{2,3} ?$/.test(gj)) {
            return { grade: gj, course: cj };
          } else {
            return false;
          }
        }),
      ]);
      await browser.close(); //Closes the Browser Instance

      return { success: true, data: final.filter((x) => !!x) };
    }
  }
}

async function updateDatabase(username, password, grades) {
  const [user] = await db.all(
    "SELECT hash,salt FROM Users WHERE username=?",
    username
  );
  const grades_str = JSON.stringify(grades);
  if (user) {
    const new_hash = toHash(user.salt, password);
    if (new_hash == user.hash) {
      await db.run(
        "UPDATE Users SET grades=? WHERE username=?",
        grades_str,
        username
      );
      return { success: true };
    } else {
      return { success: false, message: "Unauthorized User" };
    }
  } else {
    const salt = crypto.randomBytes(25).toString("utf8");
    const hash = toHash(salt, password);
    await db.run(
      "INSERT INTO Users (username, hash, salt, grades, last_update) VALUES (?,?,?,?,?)",
      username,
      hash,
      salt,
      grades_str,
      Date.now()
    );
    return { success: true };
  }
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/grades", async (req, res) => {
  const { username, password } = req.query;
  const grades = await getGrades(username, password);
  res.json(grades);
  if(grades.success) {
    await updateDatabase(username, password, grades.data);
  }
});

app.listen(process.env.PORT);
