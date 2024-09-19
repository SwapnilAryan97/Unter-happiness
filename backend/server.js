const express = require("express");
const bodyParser = require("body-parser");
const db = require("./database");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Helper functions
function getAge(dob) {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function calculateAverages(responses) {
  const total = responses.length;
  const sums = responses.reduce(
    (acc, curr) => {
      acc.happiness += curr.happiness;
      acc.energy += curr.energy;
      acc.hopefulness += curr.hopefulness;
      acc.sleep_hours += curr.sleep_hours;
      return acc;
    },
    { happiness: 0, energy: 0, hopefulness: 0, sleep_hours: 0 }
  );

  return {
    happiness: (sums.happiness / total).toFixed(2),
    energy: (sums.energy / total).toFixed(2),
    hopefulness: (sums.hopefulness / total).toFixed(2),
    sleep_hours: (sums.sleep_hours / total).toFixed(2),
  };
}

// Endpoint to submit questionnaire responses
app.post("/api/submit", (req, res) => {
  const { name, dob, happiness, energy, hopefulness, sleep_hours } = req.body;

  // Check if user exists
  db.get(
    `SELECT id FROM users WHERE name = ? AND dob = ?`,
    [name, dob],
    (err, user) => {
      if (err) return res.status(500).send(err);
      const userId = user ? user.id : null;

      // Insert new user if not exists
      if (!userId) {
        db.run(
          `INSERT INTO users (name, dob) VALUES (?, ?)`,
          [name, dob],
          function (err) {
            if (err) return res.status(500).send(err);
            insertResponse(this.lastID);
          }
        );
      } else {
        insertResponse(userId);
      }
    }
  );

  function insertResponse(userId) {
    const date = new Date().toISOString().split("T")[0];
    db.run(
      `INSERT INTO responses (user_id, date, happiness, energy, hopefulness, sleep_hours)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, date, happiness, energy, hopefulness, sleep_hours],
      (err) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Response recorded" });
      }
    );
  }
});

// Endpoint to get comparison results
app.post("/api/results", (req, res) => {
  const { name, dob } = req.body;

  db.get(
    `SELECT id, dob FROM users WHERE name = ? AND dob = ?`,
    [name, dob],
    (err, user) => {
      if (err || !user)
        return res.status(404).send({ error: "User not found" });

      const userId = user.id;
      const userAge = getAge(user.dob);

      // Fetch user responses
      db.all(
        `SELECT * FROM responses WHERE user_id = ?`,
        [userId],
        (err, userResponses) => {
          if (err) return res.status(500).send(err);
          const userAvg = calculateAverages(userResponses);

          // Fetch responses from users of the same age
          db.all(
            `SELECT responses.* FROM responses
           JOIN users ON responses.user_id = users.id
           WHERE (strftime('%Y', 'now') - strftime('%Y', users.dob)) = ?`,
            [userAge],
            (err, ageGroupResponses) => {
              if (err) return res.status(500).send(err);
              const ageGroupAvg = calculateAverages(ageGroupResponses);
              res.send({ userAvg, ageGroupAvg });
            }
          );
        }
      );
    }
  );
});

// Bonus: Endpoint for summary per age group
app.get("/api/summary", (req, res) => {
  db.all(
    `SELECT users.dob, responses.* FROM responses
     JOIN users ON responses.user_id = users.id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).send(err);

      const ageGroups = {
        "0-10": [],
        "11-15": [],
        "16-21": [],
        "22-30": [],
        "31-40": [],
        "41-50": [],
        "51-70": [],
        "71+": [],
      };

      rows.forEach((row) => {
        const age = getAge(row.dob);
        const group = getAgeGroup(age);
        ageGroups[group].push(row);
      });

      const summary = {};
      for (const group in ageGroups) {
        const responses = ageGroups[group];
        if (responses.length > 0) {
          summary[group] = calculateAverages(responses);
        }
      }

      res.send(summary);
    }
  );

  function getAgeGroup(age) {
    if (age <= 10) return "0-10";
    if (age <= 15) return "11-15";
    if (age <= 21) return "16-21";
    if (age <= 30) return "22-30";
    if (age <= 40) return "31-40";
    if (age <= 50) return "41-50";
    if (age <= 70) return "51-70";
    return "71+";
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
