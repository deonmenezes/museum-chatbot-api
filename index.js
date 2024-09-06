const PORT = 8000
require("dotenv").config()

const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const axios = require("axios")
const { MongoClient } = require("mongodb")

const app = express()

// MongoDB connection string
const uri =
  "mongodb+srv://deonmenezes:n6Y74Q*SqwaRmvu@cluster0.xlvdygl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
const client = new MongoClient(uri)

// Initialize an object to store conversation histories
const conversationHistories = {}

// Function to get or create a conversation history
const getConversationHistory = (userId) => {
  if (!conversationHistories[userId]) {
    conversationHistories[userId] = []
  }
  return conversationHistories[userId]
}

// Function to add a message to the conversation history
const addToConversationHistory = (userId, role, content) => {
  const history = getConversationHistory(userId)
  history.push({ role, content })
  // Optionally, limit the history size
  if (history.length > 10) {
    history.shift() // Remove the oldest message if history exceeds 10 messages
  }
}

app.use(express.json())

app.use(cors())

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = process.env.GEMINI_API_URL

const getAIResponse = async (prompt, formData, userId) => {
  // ... (rest of the getAIResponse function remains the same)
}

app.get("/", (req, res) => {
  res.send("Hello, World!")
})

app.post("/chatGemini", async (req, res) => {
  try {
    console.log("this port is working")
    const { prompt, formData, userId } = req.body
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is empty:" })
    }
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" })
    }

    addToConversationHistory(userId, "user", prompt)

    const aiResponse = await getAIResponse(prompt, formData, userId)
    console.log(aiResponse)

    // Insert form data into MongoDB
    if (Object.keys(formData).length > 0) {
      await insertFormData(formData)
    }

    res.json({ message: aiResponse })
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error processing request", error: err.message })
  }
})

// Function to insert form data into MongoDB
async function insertFormData(formData) {
  try {
    await client.connect()
    const database = client.db("museum")
    const collection = database.collection("form_data")
    const result = await collection.insertOne(formData)
    console.log(`Inserted document with _id: ${result.insertedId}`)
  } catch (err) {
    console.error("Error inserting form data:", err)
  } finally {
    await client.close()
  }
}

app.get("/warmup", (req, res) => {
  console.log("Warm-up request received")
  res.status(200).send("Server is warm and ready")
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
