import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    dob: "",
    happiness: 3,
    energy: 3,
    hopefulness: 3,
    sleep_hours: 8,
  });
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post("http://localhost:3001/api/submit", form).then(() => {
      // Fetch results
      axios
        .post("http://localhost:3001/api/results", {
          name: form.name,
          dob: form.dob,
        })
        .then((res) => {
          setResults(res.data);
          setStep(2);
        });
    });
  };

  useEffect(() => {
    // Fetch summary data for bonus feature
    axios
      .get("http://localhost:3001/api/summary")
      .then((res) => setSummary(res.data));
  }, []);

  if (step === 1) {
    return (
      <form onSubmit={handleSubmit}>
        <h2>Questionnaire</h2>
        <div>
          <label>Enter your full name:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Enter your date of birth (mm/dd/yyyy):</label>
          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>On a scale from 1-5, how happy do you feel?</label>
          <input
            type="number"
            name="happiness"
            min="1"
            max="5"
            value={form.happiness}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>On a scale from 1-5, how energetic do you feel?</label>
          <input
            type="number"
            name="energy"
            min="1"
            max="5"
            value={form.energy}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>
            On a scale from 1-5, how hopeful do you feel about the future?
          </label>
          <input
            type="number"
            name="hopefulness"
            min="1"
            max="5"
            value={form.hopefulness}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>How many hours did you sleep last night?</label>
          <input
            type="number"
            name="sleep_hours"
            step="0.1"
            value={form.sleep_hours}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    );
  }

  if (step === 2 && results) {
    return (
      <div>
        <h2>Your Results</h2>
        <p>
          Happiness today compared to your average happiness: {form.happiness}{" "}
          vs {results.userAvg.happiness}
        </p>
        <p>
          Your average happiness compared to others of your age:{" "}
          {results.userAvg.happiness} vs {results.ageGroupAvg.happiness}
        </p>
        <p>
          Energy level today compared to your average energy level:{" "}
          {form.energy} vs {results.userAvg.energy}
        </p>
        <p>
          Your average energy level compared to others of your age:{" "}
          {results.userAvg.energy} vs {results.ageGroupAvg.energy}
        </p>
        <p>
          Hopefulness today compared to your average hopefulness:{" "}
          {form.hopefulness} vs {results.userAvg.hopefulness}
        </p>
        <p>
          Your average hopefulness compared to others of your age:{" "}
          {results.userAvg.hopefulness} vs {results.ageGroupAvg.hopefulness}
        </p>
        <p>
          Hours of sleep today compared to your average sleeping hours:{" "}
          {form.sleep_hours} vs {results.userAvg.sleep_hours}
        </p>
        <p>
          Your average sleeping hours compared to others of your age:{" "}
          {results.userAvg.sleep_hours} vs {results.ageGroupAvg.sleep_hours}
        </p>

        {summary && (
          <div>
            <h2>Summary Per Age Group</h2>
            {Object.keys(summary).map((group) => (
              <div key={group}>
                <h3>Age Group: {group}</h3>
                <p>Average Happiness: {summary[group].happiness}</p>
                <p>Average Energy: {summary[group].energy}</p>
                <p>Average Hopefulness: {summary[group].hopefulness}</p>
                <p>Average Sleeping Hours: {summary[group].sleep_hours}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;
