const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const EMAIL = process.env.OFFICIAL_EMAIL || "your_email@chitkara.edu.in";
const GEMINI_KEY = process.env.GEMINI_API_KEY;


const success = (data) => ({
  is_success: true,
  official_email: EMAIL,
  data,
});

const failure = (message) => ({
  is_success: false,
  official_email: EMAIL,
  error: message,
});

function fibonacci(n) {
  if (n < 0) throw new Error("Fibonacci input must be non-negative");
  if (n === 0) return [];
  if (n === 1) return [0];

  const result = [0, 1];

  for (let i = 2; i < n; i++) {
    result.push(result[i - 1] + result[i - 2]);
  }

  return result;
}

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function primeArray(arr) {
  return arr.filter(isPrime);
}

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function hcfArray(arr) {
  return arr.reduce((acc, val) => gcd(acc, val));
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function lcmArray(arr) {
  return arr.reduce((acc, val) => lcm(acc, val));
}



async function askGemini(question) {
  if (!GEMINI_KEY) throw new Error("Gemini API key missing");

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${GEMINI_KEY}`;

  try {
    const response = await axios.post(url, {
      contents: [
        {
          parts: [{ text: `Answer in ONE word only: ${question}` }],
        },
      ],
    });

    return (
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Unknown"
    );
  } catch (err) {
    console.error("Gemini error detail:", err.response?.data || err.message);
    throw new Error("Gemini API request failed");
  }
}



app.get("/health", (req, res) => {
  return res.status(200).json({
    is_success: true,
    official_email: EMAIL,
  });
});

app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json(failure("Invalid JSON body"));
    }

    const keys = Object.keys(body);

    if (keys.length !== 1) {
      return res
        .status(400)
        .json(failure("Exactly one functional key must be provided"));
    }

    const key = keys[0];
    const value = body[key];

    switch (key) {
      case "fibonacci": {
        if (!Number.isInteger(value) || value < 0) {
          return res.status(400).json(failure("Invalid fibonacci input"));
        }

        return res.status(200).json(success(fibonacci(value)));
      }

      case "prime": {
        if (!Array.isArray(value) || !value.every(Number.isInteger)) {
          return res.status(400).json(failure("Prime input must be integer array"));
        }

        return res.status(200).json(success(primeArray(value)));
      }

      case "hcf": {
        if (!Array.isArray(value) || !value.every(Number.isInteger)) {
          return res.status(400).json(failure("HCF input must be integer array"));
        }

        return res.status(200).json(success(hcfArray(value)));
      }

      case "lcm": {
        if (!Array.isArray(value) || !value.every(Number.isInteger)) {
          return res.status(400).json(failure("LCM input must be integer array"));
        }

        return res.status(200).json(success(lcmArray(value)));
      }

      case "AI": {
        if (typeof value !== "string" || !value.trim()) {
          return res.status(400).json(failure("AI input must be question string"));
        }

        const answer = await askGemini(value);
        return res.status(200).json(success(answer));
      }

      default:
        return res.status(400).json(failure("Unsupported key"));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(failure("Internal server error"));
  }
});

app.use((req, res) => {
  return res.status(404).json(failure("Route not found"));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Official Email: ${EMAIL}`);
  console.log(`Gemini Key Loaded: ${GEMINI_KEY ? "Yes" : "No"}`);
});