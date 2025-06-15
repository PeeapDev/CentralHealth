"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Search, Plus, Phone, Video, MoreVertical, Paperclip } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { DashboardLayout } from "@/components/patients/dashboard/dashboard-layout"

export default function MessagesPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("messages")
  const [selectedConversation, setSelectedConversation] = useState(1)
  const [newMessage, setNewMessage] = useState("")
  
  // Handle navigation from sidebar
  const handleNavigation = (page: string) => {
    if (page === "messages") {
      setCurrentPage("messages")
    } else {
      router.push(`/patient/${page}`)
    }
  }
  
  const conversations = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Attending Physician",
      lastMessage: "Your test results look good. Let's schedule a follow-up.",
      timestamp: "2 min ago",
      unread: 2,
      avatar: "SJ",
      online: true,
    },
    {
      id: 2,
      name: "Mike Wilson, RN",
      role: "Primary Nurse",
      lastMessage: "How are you feeling today? Any pain or discomfort?",
      timestamp: "1 hour ago",
      unread: 0,
      avatar: "MW",
      online: true,
    },
    {
      id: 3,
      name: "Lisa Chen, PT",
      role: "Physical Therapist",
      lastMessage: "Great progress in today's session! Keep up the exercises.",
      timestamp: "3 hours ago",
      unread: 1,
      avatar: "LC",
      online: false,
    },
    {
      id: 4,
      name: "Pharmacy Team",
      role: "Hospital Pharmacy",
      lastMessage: "Your prescription is ready for pickup.",
      timestamp: "Yesterday",
      unread: 0,
      avatar: "PT",
      online: false,
    },
  ]

  const messages = [
    {
      id: 1,
      sender: "Dr. Sarah Johnson",
      content: "Good morning, John! I've reviewed your latest test results.",
      timestamp: "10:30 AM",
      isFromUser: false,
    },
    {
      id: 2,
      sender: "You",
      content: "Good morning, Dr. Johnson. How do they look?",
      timestamp: "10:32 AM",
      isFromUser: true,
    },
    {
      id: 3,
      sender: "Dr. Sarah Johnson",
      content:
        "Your blood pressure has improved significantly, and your glucose levels are within normal range. This is excellent progress!",
      timestamp: "10:35 AM",
      isFromUser: false,
    },
    {
      id: 4,
      sender: "You",
      content: "That's great news! I've been following the diet plan you recommended.",
      timestamp: "10:37 AM",
      isFromUser: true,
    },
    {
      id: 5,
      sender: "Dr. Sarah Johnson",
      content:
        "Your test results look good. Let's schedule a follow-up appointment for next week to discuss your treatment plan.",
      timestamp: "10:40 AM",
      isFromUser: false,
    },
  ]

  const selectedConv = conversations.find((c) => c.id === selectedConversation)
  
  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
      breadcrumbs={[{ label: "Messages" }]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600">Communicate with your care team</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Message</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Conversations</CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                      selectedConversation === conversation.id ? "border-blue-500 bg-blue-50" : "border-transparent"
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={conversation.name} />
                          <AvatarFallback>{conversation.avatar}</AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{conversation.name}</p>
                          <p className="text-xs text-gray-500">{conversation.timestamp}</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{conversation.role}</p>
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unread > 0 && (
                        <Badge className="bg-blue-600 hover:bg-blue-600 text-xs">{conversation.unread}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConv && (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/placeholder.svg?height=40&width=40`} alt={selectedConv.name} />
                          <AvatarFallback>{selectedConv.avatar}</AvatarFallback>
                        </Avatar>
                        {selectedConv.online && (
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedConv.name}</h3>
                        <p className="text-sm text-gray-500">{selectedConv.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.isFromUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isFromUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.isFromUser ? "text-blue-100" : "text-gray-500"}`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end space-x-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          // Handle send message
                          setNewMessage("")
                        }
                      }}
                    />
                    <Button size="icon" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
