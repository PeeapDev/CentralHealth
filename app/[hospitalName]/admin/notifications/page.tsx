"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, Plus, Search } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
  const [searchQuery, setSearchQuery] = useState<string>("") 
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>("") 
  const [loading, setLoading] = useState<boolean>(true)
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false)
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
    
    // Set up polling for new messages - check for new messages every 30 seconds
    messageRefreshInterval.current = setInterval(() => {
      if (selectedChat) {
        // Refresh messages for current chat
        fetchMessages(selectedChat.id)
      }
    }, 30000)
    
    return () => {
      if (messageRefreshInterval.current) {
        clearInterval(messageRefreshInterval.current)
      }
    }
  }, [])

  // If chat ID is specified in the URL, select that chat
  useEffect(() => {
    if (selectedChatId && chats.length > 0) {
      const chat = chats.find((c: Chat) => c.id === selectedChatId)
      if (chat) {
        selectChat(chat)
      }
    }
  }, [selectedChatId, chats])
  
  // Helper function to get user initials
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Fetch chats from API
  const fetchChats = async () => {
    try {
      setLoading(true)
      // Fetch actual chat data from API
      const response = await fetch(`/api/hospitals/${hospitalName}/chats`)
      
      if (!response.ok) {
        // If API isn't available yet, use a minimal placeholder instead of demo data
        console.warn('Chat API not available, using minimal placeholder')
        
        // Just one placeholder conversation with the government admin
        const placeholderChats: Chat[] = [
          {
            id: "superadmin",
            type: "direct",
            participants: [
              {
                id: "superadmin",
                name: "Government Admin",
                profileImage: undefined
              },
              {
                id: "currentUser",
                name: userData?.name || "Hospital Admin",
                profileImage: userData?.profileImage || null
              }
            ],
            lastMessage: {
              content: "No messages yet. Start a conversation with Government Admin.",
              sentAt: new Date().toISOString()
            },
            unreadCount: 0
          }
        ]
        
        setChats(placeholderChats)
      } else {
        // Parse real API response
        const data = await response.json()
        setChats(data.chats || [])
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
      toast.error("Failed to load chats")
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true)
      // Fetch actual messages from API
      const response = await fetch(`/api/hospitals/${hospitalName}/chats/${chatId}/messages`)
      
      if (!response.ok) {
        // If API isn't available yet, use empty array instead of demo data
        console.warn('Messages API not available, using empty placeholder')
        setMessages([])
      } else {
        // Parse real API response
        const data = await response.json()
        setMessages(data.messages || [])
      }
      
      // Mark messages as read
      markMessagesAsRead(chatId)
      
      // Scroll to bottom
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  // Mark messages as read
  const markMessagesAsRead = async (chatId: string) => {
    try {
      // API call to mark messages as read
      const response = await fetch(`/api/hospitals/${hospitalName}/chats/${chatId}/read`, {
        method: 'POST',
      })
      
      if (response.ok) {
        // Update local chat data to show 0 unread count
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        )
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }
  
  // Send a new message
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return
    
    // Create message object
    const tempMessageId = `temp-${Date.now()}`
    const messageToSend: Message = {
      id: tempMessageId,
      chatId: selectedChat.id,
      content: newMessage,
      sentAt: new Date().toISOString(),
      isRead: false,
      sender: {
        id: userData?.id || "currentUser",
        name: userData?.name || "Hospital Admin",
        profileImage: userData?.profileImage
      }
    }
    
    // Add to messages immediately (optimistic update)
    setMessages(prev => [...prev, messageToSend])
    
    // Clear input
    setNewMessage("")
    
    // Scroll to bottom
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
    
    try {
      // Send to API
      const response = await fetch(`/api/hospitals/${hospitalName}/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageToSend.content })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      // Get the actual message ID from response
      const data = await response.json()
      
      // Update the message with actual ID
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessageId ? { ...msg, id: data.message.id } : msg
        )
      )
      
      // Update last message in chat list
      setChats(prev => 
        prev.map(chat => 
          chat.id === selectedChat.id 
            ? {
                ...chat,
                lastMessage: {
                  content: messageToSend.content,
                  sentAt: messageToSend.sentAt
                }
              }
            : chat
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))
    }
  }
  
  // Handle sending a message when pressing Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // Filter chats based on active tab
  const filteredChats = chats.filter((chat: Chat) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return chat.unreadCount > 0;
    return chat.type === activeTab;
  }).filter((chat: Chat) => {
    if (!searchQuery) return true;
    return getChatDisplayName(chat).toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Select a chat
  const selectChat = (chat: Chat) => {
    setSelectedChat(chat)
    fetchMessages(chat.id)
  }

  return (
    <div className="flex-1 space-y-6 p-6 max-w-[1600px] mx-auto">
      <PageHeader title="Notifications & Messages" description="View and manage your system notifications and chat messages" />
      
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Chats Sidebar */}
        <div className="col-span-4 xl:col-span-3 flex flex-col h-full border rounded-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center mt-4 space-x-1">
              <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All
              </Button>
              <Button
                variant={activeTab === "unread" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("unread")}
              >
                Unread
                {chats.reduce((acc, chat) => acc + chat.unreadCount, 0) > 0 && (
                  <span className="ml-1 rounded-full bg-primary-foreground px-2 py-0.5 text-xs font-semibold">
                    {chats.reduce((acc, chat) => acc + chat.unreadCount, 0)}
                  </span>
                )}
              </Button>
              <Button
                variant={activeTab === "direct" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("direct")}
              >
                Direct
              </Button>
              <Button
                variant={activeTab === "group" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("group")}
              >
                Groups
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-muted-foreground">Loading chats...</div>
              </div>
            ) : filteredChats.length > 0 ? (
              <div className="divide-y">
                {filteredChats.map((chat) => {
                  const chatName = getChatDisplayName(chat, userData?.id)
                  const otherParticipant = chat.participants.find(p => p.id !== (userData?.id || "currentUser"))
                  const isSelected = selectedChat?.id === chat.id
                  
                  return (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-accent transition-colors",
                        isSelected && "bg-accent",
                        chat.unreadCount > 0 && "font-medium"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar>
                          {otherParticipant?.profileImage ? (
                            <AvatarImage src={otherParticipant.profileImage} alt={chatName} />
                          ) : (
                            <AvatarFallback>{getInitials(chatName)}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-baseline gap-2">
                            <p className="font-medium truncate">{chatName}</p>
                            {chat.lastMessage && (
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(chat.lastMessage.sentAt), "MMM d")}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-1">
                            {chat.lastMessage ? (
                              <p className="text-sm text-muted-foreground truncate">
                                {chat.lastMessage.content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No messages yet
                              </p>
                            )}
                            
                            {chat.unreadCount > 0 && (
                              <div className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold ml-2">
                                {chat.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                <div className="text-muted-foreground text-sm text-center px-4">
                  {searchQuery
                    ? "No chats match your search"
                    : activeTab !== "all"
                    ? `No ${activeTab === "unread" ? "unread" : activeTab} conversations`
                    : "No conversations yet"}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Chat Area */}
        <div className="col-span-8 xl:col-span-9 flex flex-col h-full border rounded-md overflow-hidden">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {selectedChat.participants.find(p => p.id !== (userData?.id || "currentUser"))?.profileImage ? (
                      <AvatarImage 
                        src={selectedChat.participants.find(p => p.id !== (userData?.id || "currentUser"))?.profileImage || ""} 
                        alt={getChatDisplayName(selectedChat, userData?.id)} 
                      />
                    ) : (
                      <AvatarFallback>{getInitials(getChatDisplayName(selectedChat, userData?.id))}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{getChatDisplayName(selectedChat, userData?.id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedChat.type === "direct" ? "Direct Message" : 
                       selectedChat.type === "group" ? `${selectedChat.participants.length} participants` : 
                       "Broadcast Channel"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="text-muted-foreground">Loading messages...</div>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCurrentUser = message.sender.id === (userData?.id || "currentUser")
                      return (
                        <div key={message.id} className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "flex gap-2 max-w-[80%]",
                            isCurrentUser ? "flex-row-reverse" : "flex-row"
                          )}>
                            <Avatar className="h-8 w-8">
                              {message.sender.profileImage ? (
                                <AvatarImage src={message.sender.profileImage} alt={message.sender.name} />
                              ) : (
                                <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{message.sender.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.sentAt), "MMM d, h:mm a")}
                                </span>
                              </div>
                              <div className={cn(
                                "p-3 rounded-lg",
                                isCurrentUser 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                {message.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    <div className="text-muted-foreground text-center">
                      No messages yet. Start the conversation by sending a message.
                    </div>
                  </div>
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium">Select a Conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose a conversation from the sidebar or start a new one to begin messaging.
                </p>
              </div>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
