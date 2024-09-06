const PORT = 8000
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const axios = require("axios")

const app = express()

app.use(express.json())

app.use(cors())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = process.env.GEMINI_API_URL

const getAIResponse = async (prompt, formData) => {
  const headers = {
    "Content-type": "application/json",
  }

  const data = {
    contents: [
      {
        parts: [
          {
            text: `You are an AI assistant helping users book museum tickets & answering any questions he might have. Provide a human interaction & answer any questions the user might ask(Don't just ask for these details multiple times. Provide the best user experience).The user might provide details like their name, email, phone number, nationality, visit date, visit time, number of adult and child tickets, and preferred language. Please ask for 2-3 pieces of information at once in a human-like manner to speed up the process. Format the received details into a JSON object on the first line of your response, without adding extra lines or triple backticks. If any details are missing, leave them empty. The current form data is: ${JSON.stringify(
              formData
            )}. On the second line, provide any additional response or instructions. The user said: ${prompt}. Note that the time is in the format "HH:mm", "HH:mm:ss", or "HH:mm:ss.SSS". The date is in the format "yyyy-MM-dd".`,
          },
        ],
      },
    ],
  }

  const params = {
    key: GEMINI_API_KEY,
  }

  try {
    const response = await axios.post(GEMINI_API_URL, data, {
      headers: headers,
      params: params,
    })

    if (response.status === 200) {
      return response.data.candidates[0].content.parts[0].text
    } else {
      return `Error: ${response.status} - ${response.statusText}`
    }
  } catch (err) {
    return `Error: ${err.response.status} - ${err.response.data}`
  }
}

app.get("/", (req, res) => {
  res.send("Hello, World!")
})

app.post("/chatGemini", async (req, res) => {
  try {
    console.log("this port is working")
    const { prompt, formData } = req.body
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is empty:" })
    }

    const aiResponse = await getAIResponse(prompt, formData)
    console.log(aiResponse)
    res.json({ message: aiResponse })
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error connecting with Gemini", error: err.message })
  }
})

app.get("/warmup", (req, res) => {
  console.log("Warm-up request received")
  // Perform any necessary initialization here
  // For example, you might want to make a test database connection
  res.status(200).send("Server is warm and ready")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
