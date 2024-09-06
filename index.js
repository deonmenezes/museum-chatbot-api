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
  "mongodb+srv://aarushs:UDrBFrLq8CHW9qYB@cluster0.3rnmp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&ssl=false"
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
  const headers = {
    "Content-type": "application/json",
  }
  // Get the conversation history for this user
  const history = getConversationHistory(userId)

  // Prepare the conversation history for the AI
  const conversationContext = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n")

  const data = {
    contents: [
      {
        parts: [
          {
            text: `You are an AI assistant helping users book museum tickets & answering any questions they might have. Provide a human interaction & answer any questions the user might ask(Don't just ask for these details multiple times. Provide the best user experience).The user might provide details like their name, email, phone number, nationality, visit date, visit time, number of adult and child tickets, and preferred language. Please ask for 2-3 pieces of information at once in a human-like manner to speed up the process. Format the received details into a JSON object on the first line of your response, without adding extra lines or triple backticks. If any details are missing, leave them empty. The current form data is: ${JSON.stringify(
              formData
            )}. On the second line, provide any additional response or instructions. Here's the conversation history:\n${conversationContext}\nThe user's latest message is: ${prompt}. Note that the time is in the format "HH:mm", "HH:mm:ss", or "HH:mm:ss.SSS". The date is in the format "yyyy-MM-dd". Once all the details are collected, provide this link to the user, so he can redirect when he clicks on the link you provide in the chat: https://museum-chatbot-gray.vercel.app/payment.tsx`,
          },
        ],
      },
    ],
  }
}

const isFormComplete = (formData) => {
  const requiredFields = [
    "name",
    "email",
    "phone",
    "nationality",
    "visit_date",
    "visit_time",
    "adult_tickets",
    "child_tickets",
    "language",
  ]
  return requiredFields.every(
    (field) => formData.hasOwnProperty(field) && formData[field]
  )
}

const formDataStore = {}

const updateFormData = (userId, newData) => {
  if (!formDataStore[userId]) {
    formDataStore[userId] = {}
  }
  Object.assign(formDataStore[userId], newData)
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

    // Update form data
    if (formData) {
      updateFormData(userId, formData)
    }

    const aiResponse = await getAIResponse(
      prompt,
      formDataStore[userId],
      userId
    )
    console.log(aiResponse)

    // Check if form is complete and insert into MongoDB if it is
    if (isFormComplete(formDataStore[userId])) {
      await insertFormData(formDataStore[userId])
      // Clear the form data after insertion
      delete formDataStore[userId]
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
    console.log("Connected to mongodb")
    const database = client.db("museum")
    const collection = database.collection("form")
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
