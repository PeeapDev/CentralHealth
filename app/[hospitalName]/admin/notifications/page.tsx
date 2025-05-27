"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Plus, Search, Users, MoreVertical, User, Bell } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Chat {
  id: string
  name?: string
  type: "direct" | "group" | "broadcast"
  participants: {
    id: string
    name: string
    profileImage?: string
  }[]
  lastMessage?: {
    content: string
    sentAt: string
  }
  unreadCount: number
}

interface Message {
  id: string
  chatId: string
  content: string
  sentAt: string
  isRead: boolean
  sender: {
    id: string
    name: string
    profileImage?: string
  }
}

// Helper function to format chat name for display
function getChatDisplayName(chat: Chat, currentUserId: string = "currentUser"): string {
  if (chat.name) return chat.name
  if (chat.type === "direct") {
    // For direct chats, show the other participant's name
    const otherParticipant = chat.participants.find(p => p.id !== currentUserId)
    return otherParticipant?.name || "Unknown User"
  }
  return "Chat"
}

export default function NotificationsPage({ params }: { params: { hospitalName: string } }) {
  const { hospitalName } = params
  const searchParams = useSearchParams()
  const selectedChatId = searchParams?.get('chat') || null
  
  const [activeTab, setActiveTab] = useState<string>("all")
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>("") 
  const [loading, setLoading] = useState<boolean>(true)
  const [userData, setUserData] = useState<any>(null)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Load user data and initialize chats
  useEffect(() => {
    // Get user data from local storage
    const authData = localStorage.getItem("hospitalAuth")
    if (authData) {
      try {
        const parsedData = JSON.parse(authData)
        setUserData(parsedData)
      } catch (error) {
        console.error("Error parsing auth data:", error)
      }
    }
    
    // Fetch chats
    fetchChats()
    
    // Set up polling for new messages
    messageRefreshInterval.current = setInterval(() => {
      if (selectedChat) {
        // In a real app, we would poll for new messages
        // For now, we'll just simulate occasional new messages
        if (Math.random() > 0.7) { // 30% chance of new message during each poll
          // This is just for demo purposes
          console.log("Polling for new messages...")
        }
      }
    }, 10000) // Poll every 10 seconds
    
    return () => {
      if (messageRefreshInterval.current) {
        clearInterval(messageRefreshInterval.current)
      }
    }
  }, [])
  
  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Fetch chats from API
  const fetchChats = async () => {
    try {
      // In a real app, this would come from an API
      // For now, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockChats: Chat[] = [
        {
          id: "chat1",
          type: "direct",
          participants: [
            {
              id: "user1",
              name: "System Admin",
              profileImage: undefined
            },
            {
              id: "currentUser",
              name: userData?.name || "Hospital Admin",
              profileImage: userData?.profileImage || null
            }
          ],
          lastMessage: {
            content: "Please review the updated privacy policy for your hospital.",
            sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
          },
          unreadCount: 2
        },
        {
          id: "chat2",
          type: "direct",
          participants: [
            {
              id: "user2",
              name: "Support Team",
              profileImage: undefined
            },
            {
              id: "currentUser",
              name: userData?.name || "Hospital Admin",
              profileImage: userData?.profileImage || null
            }
          ],
          lastMessage: {
            content: "Your recent patient data migration has completed successfully.",
            sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
          },
          unreadCount: 0
        },
        {
          id: "chat3",
          name: "Hospital Announcements",
          type: "broadcast",
          participants: [
            {
              id: "system",
              name: "System",
              profileImage: undefined
            },
            {
              id: "currentUser",
              name: userData?.name || "Hospital Admin",
              profileImage: userData?.profileImage || null
            }
          ],
          lastMessage: {
            content: "New system update available. Please save your work before the scheduled maintenance.",
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
          },
          unreadCount: 0
        }
      ]
      
      setChats(mockChats)
      
      // If a chat ID is specified in the URL, select that chat
      if (selectedChatId) {
        const chat = mockChats.find(c => c.id === selectedChatId)
        if (chat) {
          setSelectedChat(chat)
          fetchMessages(chat.id)
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error("Error fetching chats:", error)
      toast.error("Failed to load chats")
      setLoading(false)
    }
  }

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId: string) => {
    try {
      // In a real app, this would come from an API
      // For now, we'll use mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockMessages: Message[] = [
        {
          id: "msg1",
          chatId,
          content: "Hello! I wanted to check on the system update status.",
          sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          isRead: true,
          sender: {
            id: chatId === "chat1" ? "user1" : chatId === "chat2" ? "user2" : "system",
            name: chatId === "chat1" ? "System Admin" : chatId === "chat2" ? "Support Team" : "System",
            profileImage: undefined
          }
        },
        {
          id: "msg2",
          chatId,
          content: "I'm reviewing my hospital settings and had some questions.",
          sentAt: new Date(Date.now() - 1000 * 60 * 119).toISOString(),
          isRead: true,
          sender: {
            id: "currentUser",
            name: userData?.name || "Hospital Admin",
            profileImage: userData?.profileImage || null
          }
        },
        {
          id: "msg3",
          chatId,
          content: chatId === "chat1" ? "Please review the updated privacy policy for your hospital." : 
                 chatId === "chat2" ? "Your recent patient data migration has completed successfully." : 
                 "New system update available. Please save your work before the scheduled maintenance.",
          sentAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
          isRead: false,
          sender: {
            id: chatId === "chat1" ? "user1" : chatId === "chat2" ? "user2" : "system",
            name: chatId === "chat1" ? "System Admin" : chatId === "chat2" ? "Support Team" : "System",
            profileImage: undefined
          }
        }
      ]
      
      // Add more messages for chat1
      if (chatId === "chat1") {
        mockMessages.push(
          {
            id: "msg4",
            chatId,
            content: "We'll be updating the system security patches tomorrow at 3 AM.",
            sentAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
            isRead: false,
            sender: {
              id: "user1",
              name: "System Admin",
              profileImage: undefined
            }
          }
        )
      }
      
      setMessages(mockMessages)
      
      // Mark messages as read
      // In a real app, this would be an API call
      markMessagesAsRead(chatId)
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
      
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
    }
  }

  // Mark messages as read
  const markMessagesAsRead = (chatId: string) => {
    // Update UI state
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    )
    
    // In a real app, make an API call to mark messages as read
  }
  
  // Send a new message
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return
    
    try {
      // Create new message object
      const message: Message = {
        id: `msg-${Date.now()}`,
        chatId: selectedChat.id,
        content: newMessage,
        sentAt: new Date().toISOString(),
        isRead: true,
        sender: {
          id: "currentUser",
          name: userData?.name || "Hospital Admin",
          profileImage: userData?.profileImage || null
        }
      }
      
      // Update UI immediately
      setMessages(prev => [...prev, message])
      setNewMessage("")
      
      // Update last message in chat list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === selectedChat.id 
            ? { 
                ...chat, 
                lastMessage: { 
                  content: message.content, 
                  sentAt: message.sentAt 
                } 
              } 
            : chat
        )
      )
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
      
      // In a real app, send message to API
      // await fetch(`/api/hospitals/${hospitalName}/messages`, {
      //   method: 'POST',
      //   body: JSON.stringify({ chatId: selectedChat.id, content: newMessage })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Simulate response in 1-2 seconds for demo purposes
      if (selectedChat.id !== "chat3") { // Don't auto-reply in broadcast chats
        setTimeout(() => {
          const responseMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            chatId: selectedChat.id,
            content: 
              selectedChat.id === "chat1" 
                ? "Thanks for your message. Is there anything specific about the privacy policy you'd like to discuss?" 
                : "Do you have any questions about the data migration?",
            sentAt: new Date().toISOString(),
            isRead: true,
            sender: {
              id: selectedChat.id === "chat1" ? "user1" : "user2",
              name: selectedChat.id === "chat1" ? "System Admin" : "Support Team",
              profileImage: undefined
            }
          }
          
          setMessages(prev => [...prev, responseMessage])
          
          // Update last message in chat list
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === selectedChat.id 
                ? { 
                    ...chat, 
                    lastMessage: { 
                      content: responseMessage.content, 
                      sentAt: responseMessage.sentAt 
                    } 
                  } 
                : chat
            )
          )
          
          // Scroll to bottom
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
            }
          }, 100)
        }, Math.random() * 1000 + 1000) // Random delay between 1-2 seconds
      }
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  // Handle selecting a chat
  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat)
    fetchMessages(chat.id)
  }
  
  // Filter chats based on active tab
  const filteredChats = chats.filter(chat => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return chat.unreadCount > 0
    if (activeTab === "direct") return chat.type === "direct"
    if (activeTab === "broadcast") return chat.type === "broadcast"
    return true
  })
  
  // Handle sending a message when pressing Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  return (
    <div className="flex-1 space-y-6 p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Notifications & Messages"
        description="View and manage your system notifications and chat messages"
      />
      
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Chats Sidebar */}
        <Card className="col-span-4 xl:col-span-3 flex flex-col h-full">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">New message</span>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-10" />
            </div>
            
            <Tabs defaultValue="all" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="direct">Direct</TabsTrigger>
                <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto p-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading chats...</p>
                </div>
              </div>
            ) : filteredChats.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="flex flex-col">
                  {filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={cn(
                        "flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors",
                        selectedChat?.id === chat.id && "bg-muted/50",
                        chat.unreadCount > 0 && "bg-muted/30"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={
                            chat.type === "direct" 
                              ? chat.participants.find(p => p.id !== "currentUser")?.profileImage || "/placeholder.svg" 
                              : "/placeholder.svg"
                          } 
                        />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {chat.type === "direct" 
                            ? getInitials(chat.participants.find(p => p.id !== "currentUser")?.name || "") 
                            : chat.type === "broadcast" 
                              ? "BC" 
                              : "GP"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {getChatDisplayName(chat)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {chat.lastMessage ? format(new Date(chat.lastMessage.sentAt), 'MMM d, h:mm a') : ''}
                          </p>
                        </div>
                        {chat.lastMessage && (
                          <p className="truncate text-sm text-muted-foreground">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {chat.unreadCount > 0 && (
                        <Badge variant="secondary" className="rounded-full">{chat.unreadCount}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No messages found</p>
                <p className="text-xs text-muted-foreground">
                  {activeTab !== "all" 
                    ? "Try changing your filter selection" 
                    : "Start a new conversation to see messages here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Chat Window */}
        <Card className="col-span-8 xl:col-span-9 flex flex-col h-full">
          {selectedChat ? (
            <>
              <CardHeader className="border-b py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage 
                        src={
                          selectedChat.type === "direct" 
                            ? selectedChat.participants.find(p => p.id !== "currentUser")?.profileImage || "/placeholder.svg" 
                            : "/placeholder.svg"
                        } 
                      />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {selectedChat.type === "direct" 
                          ? getInitials(selectedChat.participants.find(p => p.id !== "currentUser")?.name || "") 
                          : selectedChat.type === "broadcast" 
                            ? "BC" 
                            : "GP"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {getChatDisplayName(selectedChat)}
                      </CardTitle>
                      {selectedChat.type === "direct" && (
                        <CardDescription className="text-xs">
                          {selectedChat.participants.find(p => p.id !== "currentUser")?.id === "user1" 
                            ? "System Administrator" 
                            : selectedChat.participants.find(p => p.id !== "currentUser")?.id === "user2" 
                            ? "Support Team" 
                            : "User"}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Manage participants</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Mute notifications</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="flex flex-col gap-4 p-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id} 
                        className={cn(
                          "flex max-w-[75%] flex-col gap-2",
                          message.sender.id === "currentUser" 
                            ? "ml-auto items-end" 
                            : "items-start"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {message.sender.id !== "currentUser" && (
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender.profileImage || "/placeholder.svg"} />
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {getInitials(message.sender.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {message.sender.id === "currentUser" ? "You" : message.sender.name} • {format(new Date(message.sentAt), 'h:mm a')}
                          </span>
                        </div>
                        <div 
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm",
                            message.sender.id === "currentUser" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
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
              
              <CardFooter className="border-t p-3">
                <div className="flex w-full items-center gap-2">
                  <Input
                    placeholder={selectedChat.type === "broadcast" ? "Cannot reply to broadcast messages" : "Type your message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={selectedChat.type === "broadcast"}
                    className="flex-1"
                  />
                  <Button 
                    size="icon" 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim() || selectedChat.type === "broadcast"}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </div>
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No chat selected</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select a conversation from the sidebar to view messages
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
