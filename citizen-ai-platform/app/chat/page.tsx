"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, Bot, User, ArrowLeft, Smile, Meh, Frown } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  sentiment?: "positive" | "neutral" | "negative"
}

// Enhanced AI Response System
const AI_KNOWLEDGE_BASE = {
  // Tax-related queries
  tax: {
    keywords: ["tax", "taxes", "filing", "refund", "irs", "income", "deduction", "w2", "1099"],
    responses: [
      "I can help you with tax-related questions! The current tax filing deadline is April 15th, 2024. Are you looking for information about filing your return, checking refund status, or understanding deductions?",
      "For tax assistance, I can guide you through: filing requirements, available deductions, payment options, or refund tracking. What specific tax topic would you like help with?",
      "Tax season can be complex! I'm here to help with federal and state tax questions. Are you a first-time filer, need help with business taxes, or have questions about specific forms?",
    ],
    followUp: {
      refund:
        "To check your refund status, you'll need your Social Security number, filing status, and exact refund amount. You can check online at IRS.gov or call 1-800-829-1954.",
      filing:
        "For tax filing, you can use free software if your income is under $73,000, hire a professional, or file paper forms. Would you like information about any of these options?",
      deduction:
        "Common deductions include mortgage interest, charitable donations, medical expenses, and business expenses. Are you itemizing or taking the standard deduction?",
    },
  },

  // Permit and licensing
  permits: {
    keywords: ["permit", "license", "building", "business", "construction", "zoning", "application"],
    responses: [
      "I can help you navigate the permit process! Are you looking for a building permit, business license, or another type of permit? Each has different requirements and processing times.",
      "Permit applications vary by type and location. Building permits typically take 2-4 weeks, while business licenses can be processed in 5-10 business days. What type of permit do you need?",
      "For permits, you'll generally need to submit an application, pay fees, and provide supporting documents. Some permits require inspections. What project are you planning?",
    ],
    followUp: {
      building:
        "Building permits require architectural plans, site surveys, and compliance with local codes. Fees range from $100-$2000 depending on project scope. Do you have your plans ready?",
      business:
        "Business licenses require: business registration, tax ID number, zoning compliance, and applicable fees. Some businesses need additional permits. What type of business are you starting?",
      inspection:
        "Inspections are scheduled after permit approval. You'll need inspections at various stages: foundation, framing, electrical, plumbing, and final. Would you like to schedule an inspection?",
    },
  },

  // Public services
  services: {
    keywords: ["service", "office", "hours", "location", "contact", "phone", "address", "department"],
    responses: [
      "I can help you find the right government office! Most departments are open Monday-Friday, 8:00 AM to 5:00 PM. Which specific service or department are you looking for?",
      "Government services are available both in-person and online. Many services like license renewals and permit applications can be completed online 24/7. What service do you need?",
      "Our offices provide various services including vital records, vehicle registration, voter registration, and more. Some services require appointments. What can I help you locate?",
    ],
    followUp: {
      hours:
        "Standard office hours are 8:00 AM - 5:00 PM, Monday-Friday. Some offices have extended hours on Thursdays until 7:00 PM. Emergency services are available 24/7.",
      appointment:
        "You can schedule appointments online or by calling the specific department. Walk-ins are welcome but may have longer wait times. Would you like to schedule an appointment?",
      online:
        "Many services are available online including: bill payments, permit applications, records requests, and license renewals. Visit our website portal for 24/7 access.",
    },
  },

  // Complaints and issues
  complaints: {
    keywords: ["complaint", "problem", "issue", "report", "broken", "pothole", "noise", "violation"],
    responses: [
      "I'm sorry to hear you're experiencing an issue. I can help you file a complaint or report a problem. Is this related to city services, infrastructure, noise, or another concern?",
      "Thank you for bringing this to our attention. Reporting issues helps us improve services. Can you provide details about the location and nature of the problem?",
      "I'll help you report this issue to the appropriate department. For urgent matters like water main breaks or safety hazards, we can expedite the response. Is this an emergency?",
    ],
    followUp: {
      infrastructure:
        "For road issues, potholes, or street lighting problems, I'll create a work order for our Public Works department. They typically respond within 3-5 business days.",
      noise:
        "Noise complaints are handled by Code Enforcement. You can file anonymously, and they'll investigate within 24-48 hours. Is this an ongoing issue?",
      emergency:
        "For emergencies requiring immediate attention, please call 911. For urgent non-emergency issues, our dispatch number is available 24/7 at (555) 311-CITY.",
    },
  },

  // Voting and civic engagement
  voting: {
    keywords: ["vote", "voting", "election", "ballot", "register", "polling", "candidate"],
    responses: [
      "I can help with voting information! Are you looking to register to vote, find your polling location, or get information about upcoming elections?",
      "Voting is a fundamental right! Registration deadlines vary by state, but you can often register online. Would you like help with voter registration or election information?",
      "For elections, you can vote in-person on election day, during early voting periods, or by absentee ballot in many areas. What voting information do you need?",
    ],
    followUp: {
      register:
        "To register to vote, you'll need proof of identity and residence. You can register online, by mail, or in person. The deadline is typically 30 days before an election.",
      polling:
        "Your polling location is based on your registered address. You can find it on your voter registration card or by checking our online voter portal.",
      absentee:
        "Absentee voting is available for various reasons including travel, illness, or disability. Applications must be submitted by the deadline, typically 7 days before the election.",
    },
  },

  // General help
  general: {
    keywords: ["help", "hello", "hi", "start", "information", "question"],
    responses: [
      "Hello! I'm your AI assistant for government services. I can help with taxes, permits, public services, complaints, voting, and general civic questions. What would you like to know?",
      "Welcome to Citizen AI! I'm here to help you navigate government services efficiently. I can assist with applications, provide information, or connect you with the right department. How can I help today?",
      "Hi there! I'm designed to make government services more accessible. Whether you need to file paperwork, get information, or report an issue, I'm here to guide you. What brings you here today?",
    ],
  },
}

// Enhanced response generation with context awareness
function getAIResponse(userMessage: string, conversationHistory: Message[] = []): string {
  const lowerMessage = userMessage.toLowerCase()
  const words = lowerMessage.split(/\s+/)

  // Check for follow-up context from previous messages
  const recentMessages = conversationHistory.slice(-4)
  let context = ""

  for (const msg of recentMessages) {
    if (msg.sender === "ai") {
      const msgLower = msg.content.toLowerCase()
      if (msgLower.includes("tax")) context = "tax"
      else if (msgLower.includes("permit")) context = "permits"
      else if (msgLower.includes("complaint")) context = "complaints"
      else if (msgLower.includes("vote")) context = "voting"
    }
  }

  // Find the best matching category
  let bestMatch = { category: "", score: 0 }

  for (const [category, data] of Object.entries(AI_KNOWLEDGE_BASE)) {
    let score = 0
    for (const keyword of data.keywords) {
      if (lowerMessage.includes(keyword)) {
        score += keyword.length // Longer keywords get higher priority
      }
    }

    if (score > bestMatch.score) {
      bestMatch = { category, score }
    }
  }

  // Check for follow-up responses if we have context
  if (context && AI_KNOWLEDGE_BASE[context]?.followUp) {
    const followUpData = AI_KNOWLEDGE_BASE[context].followUp
    for (const [key, response] of Object.entries(followUpData)) {
      if (lowerMessage.includes(key)) {
        return response
      }
    }
  }

  // Generate contextual response
  if (bestMatch.score > 0) {
    const categoryData = AI_KNOWLEDGE_BASE[bestMatch.category]
    const responses = categoryData.responses

    // Add some variety by considering message length and complexity
    let responseIndex = 0
    if (userMessage.length > 50) responseIndex = 1
    if (words.length > 10) responseIndex = 2
    if (userMessage.includes("?")) responseIndex = Math.min(responseIndex + 1, responses.length - 1)

    responseIndex = Math.min(responseIndex, responses.length - 1)
    return responses[responseIndex]
  }

  // Handle specific common questions
  if (lowerMessage.includes("hours") || lowerMessage.includes("open")) {
    return "Most government offices are open Monday through Friday, 8:00 AM to 5:00 PM. Some locations offer extended hours on Thursdays until 7:00 PM. Many services are also available online 24/7. Which specific office or service are you asking about?"
  }

  if (lowerMessage.includes("phone") || lowerMessage.includes("call")) {
    return "For general inquiries, you can call our main line at (555) 311-CITY. For specific departments: Tax Office (555) 311-TAX, Permits (555) 311-PERMIT, or Public Works (555) 311-WORK. Is there a specific department you need to reach?"
  }

  if (lowerMessage.includes("website") || lowerMessage.includes("online")) {
    return "You can access many services online at our citizen portal. Available online services include: bill payments, permit applications, tax filing, appointment scheduling, and service requests. Would you like help with a specific online service?"
  }

  if (lowerMessage.includes("cost") || lowerMessage.includes("fee") || lowerMessage.includes("price")) {
    return "Fees vary by service type. Common fees include: Building permits ($100-$2000), Business licenses ($50-$500), Vital records ($15-$25), and Vehicle registration ($25-$150). What specific service fee are you asking about?"
  }

  // Enhanced default responses based on message characteristics
  const defaultResponses = [
    "I understand you're looking for assistance. Could you provide more specific details about what government service or information you need? I can help with taxes, permits, public services, complaints, voting, and more.",
    "I'm here to help you navigate government services more efficiently. Whether you need to complete an application, get information about a process, or resolve an issue, I can guide you to the right resources. What specific topic can I assist you with?",
    "Thank you for your question. To provide the most helpful response, could you tell me more about what you're trying to accomplish? I have access to information about various government services and can point you in the right direction.",
  ]

  // Choose default response based on message characteristics
  let defaultIndex = 0
  if (userMessage.includes("need") || userMessage.includes("want")) defaultIndex = 1
  if (userMessage.includes("how") || userMessage.includes("what")) defaultIndex = 2

  return defaultResponses[defaultIndex]
}

// Update the analyzeSentiment function to be more sophisticated
function analyzeSentiment(text: string): "positive" | "neutral" | "negative" {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "happy",
    "satisfied",
    "thank",
    "helpful",
    "amazing",
    "wonderful",
    "perfect",
    "awesome",
    "fantastic",
    "love",
    "appreciate",
    "pleased",
    "outstanding",
    "brilliant",
    "superb",
    "marvelous",
    "terrific",
  ]

  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "angry",
    "frustrated",
    "complaint",
    "problem",
    "issue",
    "disappointed",
    "horrible",
    "disgusting",
    "hate",
    "annoyed",
    "upset",
    "furious",
    "outraged",
    "dissatisfied",
    "unacceptable",
    "ridiculous",
    "pathetic",
  ]

  const neutralWords = ["okay", "fine", "average", "normal", "standard", "typical", "regular", "usual"]

  const lowerText = text.toLowerCase()
  let positiveScore = 0
  let negativeScore = 0
  let neutralScore = 0

  // Count word occurrences with weights
  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveScore += word.length
  })

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeScore += word.length
  })

  neutralWords.forEach((word) => {
    if (lowerText.includes(word)) neutralScore += word.length
  })

  // Consider punctuation and capitalization
  if (text.includes("!")) positiveScore += 2
  if (text.includes("?")) neutralScore += 1
  if (text.toUpperCase() === text && text.length > 5) negativeScore += 3

  // Determine sentiment based on scores
  if (positiveScore > negativeScore && positiveScore > neutralScore) return "positive"
  if (negativeScore > positiveScore && negativeScore > neutralScore) return "negative"
  return "neutral"
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Welcome to Citizen AI! I'm here to help you with government services and civic inquiries. How can I assist you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      sentiment: analyzeSentiment(inputValue),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsTyping(true)

    // Simulate AI processing time with variable delay based on complexity
    const processingTime = Math.min(1000 + currentInput.length * 20, 3000)

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(currentInput, messages),
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      setIsTyping(false)
    }, processingTime)
  }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="w-4 h-4 text-green-500" />
      case "negative":
        return <Frown className="w-4 h-4 text-red-500" />
      default:
        return <Meh className="w-4 h-4 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold">AI Assistant</h1>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <span>Citizen AI Assistant</span>
                    <Badge variant="secondary" className="ml-auto">
                      Online
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] ${message.sender === "user" ? "order-2" : "order-1"}`}>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div
                              className={`flex items-center mt-1 space-x-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <span className="text-xs text-gray-500">{message.timestamp.toLocaleTimeString()}</span>
                              {message.sentiment && (
                                <div className="flex items-center space-x-1">
                                  {getSentimentIcon(message.sentiment)}
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs ${getSentimentColor(message.sentiment)}`}
                                  >
                                    {message.sentiment}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${message.sender === "user" ? "order-1 ml-2" : "order-2 mr-2"}`}
                          >
                            {message.sender === "user" ? (
                              <User className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Bot className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-5 h-5 text-gray-600" />
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask about government services, policies, or civic issues..."
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={isTyping}
                      />
                      <Button onClick={handleSendMessage} disabled={isTyping || !inputValue.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setInputValue("I need help filing my tax return and understanding deductions")}
                  >
                    Tax Filing Help
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setInputValue("How do I apply for a building permit for a home renovation?")}
                  >
                    Building Permits
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      setInputValue("I want to report a pothole on Main Street that's causing damage to cars")
                    }
                  >
                    Report Infrastructure Issue
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setInputValue("How do I register to vote and find my polling location?")}
                  >
                    Voter Registration
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() =>
                      setInputValue("What are the fees for starting a small business and getting required licenses?")
                    }
                  >
                    Business Licensing
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setInputValue("I need to schedule an appointment at the DMV for license renewal")}
                  >
                    DMV Services
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time responses</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Sentiment analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Contextual understanding</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>24/7 availability</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
