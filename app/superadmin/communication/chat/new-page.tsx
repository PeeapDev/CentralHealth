"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface HospitalAdmin {
  id: string
  name: string
  email: string
  hospitalName: string
  hospitalId: string
  profileImage?: string
  lastActive?: string
  unreadCount: number
}

interface Message {
  id: string
  content: string
  sentAt: string
  isRead: boolean
  sender: {
    id: string
    name: string
    role: string
    profileImage?: string
  }
  recipient: {
    id: string
    name: string
    role: string
    profileImage?: string
  }
}

export default function SuperadminChatPage() {
  const [filter, setFilter] = useState<string>("")
  const [hospitalAdmins, setHospitalAdmins] = useState<HospitalAdmin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<HospitalAdmin | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState<string>("") 
  const [loading, setLoading] = useState<boolean>(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Mock data for hospital admins
  useEffect(() => {
    // In a real app, this would be an API call
    setTimeout(() => {
      const mockAdmins: HospitalAdmin[] = [
        {
          id: "admin1",
          name: "John Doe",
          email: "john@centralhospital.com",
          hospitalName: "Central Hospital",
          hospitalId: "hospital1",
          lastActive: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          unreadCount: 3
        },
        {
          id: "admin2",
          name: "Jane Smith",
          email: "jane@westernmedical.com",
          hospitalName: "Western Medical Center",
          hospitalId: "hospital2",
          lastActive: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          unreadCount: 0
        },
        {
          id: "admin3",
          name: "Robert Johnson",
          email: "robert@easternhealth.com",
          hospitalName: "Eastern Health Clinic",
          hospitalId: "hospital3",
          lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          unreadCount: 1
        },
        {
          id: "admin4",
          name: "Sarah Williams",
          email: "sarah@southernmedical.com",
          hospitalName: "Southern Medical Hospital",
          hospitalId: "hospital4",
          lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          unreadCount: 0
        },
        {
          id: "admin5",
          name: "Michael Brown",
          email: "michael@northernclinic.com",
          hospitalName: "Northern Clinic",
          hospitalId: "hospital5",
          lastActive: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          unreadCount: 2
        }
      ]
      
      setHospitalAdmins(mockAdmins)
      setLoading(false)
    }, 1000)
  }, [])
  
  // Fetch messages when an admin is selected
  useEffect(() => {
    if (selectedAdmin) {
      fetchMessages(selectedAdmin.id)
      
      // Set up polling for new messages
      messageRefreshInterval.current = setInterval(() => {
        fetchMessages(selectedAdmin.id)
      }, 10000) // Poll every 10 seconds
    }
    
    return () => {
      if (messageRefreshInterval.current) {
        clearInterval(messageRefreshInterval.current)
      }
    }
  }, [selectedAdmin])
  
  // Fetch messages from API (mock data for now)
  const fetchMessages = async (adminId: string) => {
    try {
      // In a real app, this would be an API call
      const mockMessages: Message[] = [
        {
          id: "msg1",
          content: "Hello! How can I help you with your hospital settings today?",
          sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          isRead: true,
          sender: {
            id: "superadmin",
            name: "System Admin",
            role: "superadmin",
            profileImage: undefined
          },
          recipient: {
            id: adminId,
            name: hospitalAdmins.find(a => a.id === adminId)?.name || "Hospital Admin",
            role: "admin",
            profileImage: undefined
          }
        },
        {
          id: "msg2",
          content: "I'm having an issue with the billing module. Patients' insurance details aren't being saved properly.",
          sentAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
          isRead: true,
          sender: {
            id: adminId,
            name: hospitalAdmins.find(a => a.id === adminId)?.name || "Hospital Admin",
            role: "admin",
            profileImage: undefined
          },
          recipient: {
            id: "superadmin",
            name: "System Admin",
            role: "superadmin",
            profileImage: undefined
          }
        },
        {
          id: "msg3",
          content: "I understand. Let me look into this issue for you. Could you provide more details about when this started happening?",
          sentAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
          isRead: true,
          sender: {
            id: "superadmin",
            name: "System Admin",
            role: "superadmin",
            profileImage: undefined
          },
          recipient: {
            id: adminId,
            name: hospitalAdmins.find(a => a.id === adminId)?.name || "Hospital Admin",
            role: "admin",
            profileImage: undefined
          }
        }
      ]
      
      setMessages(mockMessages)
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
    }
  }
  
  // Send a message to the selected admin
  const sendMessage = async () => {
    if (!selectedAdmin || !messageInput.trim()) return

    try {
      const messageId = `msg${Date.now()}`
      const newMsg: Message = {
        id: messageId,
        content: messageInput,
        sentAt: new Date().toISOString(),
        isRead: false,
        sender: {
          id: "superadmin",
          name: "System Admin",
          role: "superadmin",
          profileImage: undefined
        },
        recipient: {
          id: selectedAdmin.id,
          name: selectedAdmin.name,
          role: "admin",
          profileImage: selectedAdmin.profileImage
        }
      }

      // Add message to the chat
      setMessages(prev => [...prev, newMsg])
      setMessageInput("")

      // Scroll to bottom
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }

      // Simulate a response after a delay
      setTimeout(() => {
        const responseId = `msg${Date.now()}`
        const responseMsg: Message = {
          id: responseId,
          content: `Thank you for your message. I'll look into this matter and get back to you shortly.`,
          sentAt: new Date().toISOString(),
          isRead: false,
          sender: {
            id: selectedAdmin.id,
            name: selectedAdmin.name,
            role: "admin",
            profileImage: selectedAdmin.profileImage
          },
          recipient: {
            id: "superadmin",
            name: "System Admin",
            role: "superadmin",
            profileImage: undefined
          }
        }

        // Add response to the chat
        setMessages(prev => [...prev, responseMsg])
        
        // Scroll to bottom
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
          }
        }, 100)
      }, 2000) // Respond after 2 seconds
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }
  
  // Handle sending a message when pressing Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // Filter hospital admins based on search
  const filteredAdmins = hospitalAdmins.filter(admin => {
    return filter ? 
      admin.name.toLowerCase().includes(filter.toLowerCase()) || 
      admin.hospitalName.toLowerCase().includes(filter.toLowerCase()) : 
      true
  })
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chat Communication</h1>
        <p className="text-muted-foreground">Communicate with hospital administrators directly</p>
      </div>
      
      {/* Main chat container */}
      <div className="grid grid-cols-12 gap-0 h-[calc(100vh-200px)] border rounded-md overflow-hidden">
        {/* Left side - Contact list */}
        <div className="col-span-4 xl:col-span-3 flex flex-col h-full bg-white border-r">
          <div className="flex items-center bg-gray-50 p-3">
            <div className="flex-1 flex items-center">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src="/placeholder-user.svg" />
                <AvatarFallback className="bg-blue-100 text-blue-800">SA</AvatarFallback>
              </Avatar>
              <span className="font-medium">Super Admin</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><path d="m8 10 4 4 4-4"/></svg>
              </Button>
            </div>
          </div>
          
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <Input 
                placeholder="Search or start a new chat" 
                className="pl-9 bg-gray-100 border-0 rounded-full text-sm h-9" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading admins...</p>
                </div>
              </div>
            ) : filteredAdmins.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="flex flex-col">
                  {filteredAdmins.map((admin) => (
                    <button
                      key={admin.id}
                      onClick={() => setSelectedAdmin(admin)}
                      className={cn(
                        "w-full text-left py-2 px-3 hover:bg-gray-100 transition-colors flex items-center",
                        selectedAdmin?.id === admin.id && "bg-gray-100"
                      )}
                    >
                      <div className="relative mr-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={admin.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {getInitials(admin.name)}
                          </AvatarFallback>
                        </Avatar>
                        {admin.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-[10px] font-medium">
                            {admin.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 border-b pb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{admin.name}</span>
                          <span className="text-xs text-gray-500 ml-1 shrink-0">{admin.lastActive ? format(new Date(admin.lastActive), 'h:mm a') : ''}</span>
                        </div>
                        <p className="text-xs truncate text-gray-600 mt-1">
                          <span className="inline-block mr-1">Hello! Can we meet sometime to discuss the patient records?</span>
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><rect width="5" height="5" x="7" y="7" rx="1"/><rect width="5" height="5" x="12" y="12" rx="1"/></svg>
                </div>
                <p className="text-base font-medium text-gray-900 mb-1">No chats found</p>
                <p className="text-sm text-gray-500 max-w-[200px]">
                  {filter ? "Try a different search term" : "Start communicating with hospital administrators"}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Chat Window */}
        <div className="col-span-8 xl:col-span-9 flex flex-col h-full bg-[#efeae2] bg-opacity-30">
          {selectedAdmin ? (
            <>
              <div className="bg-white border-b py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedAdmin.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {getInitials(selectedAdmin.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium leading-none">{selectedAdmin.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedAdmin.hospitalName} • {selectedAdmin.lastActive ? 'Last seen ' + format(new Date(selectedAdmin.lastActive), 'h:mm a') : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3.6a1 1 0 0 0-1.4 0L0 17.4V24h6.6l13.8-13.8a1 1 0 0 0 0-1.4l-5.2-5.2z"/><path d="m13.4 8.4 2.2 2.2"/></svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-4 p-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={cn(
                          "flex max-w-[75%] flex-col gap-2",
                          message.sender.role === "superadmin" 
                            ? "ml-auto items-end" 
                            : "items-start"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {message.sender.role !== "superadmin" && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender.profileImage || "/placeholder.svg"} />
                              <AvatarFallback className="bg-green-600 text-white text-xs">
                                {getInitials(message.sender.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs text-gray-500">
                            {message.sender.role === "superadmin" ? "You" : message.sender.name} • {format(new Date(message.sentAt), 'h:mm a')}
                          </span>
                        </div>
                        <div 
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm max-w-[80%]",
                            message.sender.role === "superadmin" 
                              ? "bg-[#d9fdd3] text-gray-800 ml-auto" 
                              : "bg-white text-gray-800 mr-auto shadow-sm"
                          )}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              
              <div className="bg-white p-3 flex items-center">
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </Button>
                <div className="relative flex-1 mx-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    className="w-full focus-visible:ring-0 focus-visible:ring-offset-0 border border-gray-200 rounded-full shadow-none h-10 py-6 px-4"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-green-500 hover:bg-green-600" 
                  onClick={sendMessage} 
                  disabled={messageInput.trim() === ""}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white/80">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"/><path d="M12 16v.01"/><path d="M12 8v4"/></svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Select a chat to start messaging</h3>
              <p className="text-sm text-gray-500 max-w-md">Choose an admin from the list or search for someone specific to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
