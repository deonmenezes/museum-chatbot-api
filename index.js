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
            text: `You are an AI assistant helping users book museum tickets. The user might provide their preferred name, actual name, age, number of tickets etc. If they provide such details, please format them into a JSON object on the first line of your response. Just don't add more lines by adding triple backticks & adding the language as json strictly. If they haven't provided all the details, keep the ones missing empty. The current form data is: ${JSON.stringify(
              formData
            )}. On the second line, provide any additional response or instructions. The user said: ${prompt}. Note that the time is in the format is "HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS". The date is in the format "yyyy-MM-dd". `,
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
