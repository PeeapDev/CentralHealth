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
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Fetch actual hospital admins data
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/admins');
        // const data = await response.json();
        // setHospitalAdmins(data);
        
        // For now, using minimal placeholder data until API is connected
        setHospitalAdmins([
          {
            id: "1",
            name: "Hospital Administrator",
            email: "admin@centralhospital.com",
            hospitalName: "Central Hospital",
            hospitalId: "ch-001",
            profileImage: "",
            unreadCount: 0,
            lastActive: new Date().toISOString()
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admins:", error);
        toast.error("Failed to load administrators");
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);
  
  // Load conversation with selected admin
  const loadConversation = async (adminId: string) => {
    setMessagesLoading(true);
    const admin = hospitalAdmins.find(a => a.id === adminId);
    if (admin) setSelectedAdmin(admin);

    try {
      // In a real app, this would be an API call to fetch messages
      // const response = await fetch(`/api/messages?adminId=${adminId}`);
      // const data = await response.json();
      // setMessages(data);
      
      // Using empty array until API is connected
      const mockMessages: Message[] = [];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to load messages")
    } finally {
      setMessagesLoading(false);
    }
  }

  // Fetch messages when an admin is selected
  useEffect(() => {
    if (selectedAdmin) {
      loadConversation(selectedAdmin.id)
      
      // Set up polling for new messages
      messageRefreshInterval.current = setInterval(() => {
        loadConversation(selectedAdmin.id)
      }, 10000) // Poll every 10 seconds
    }
    
    return () => {
      if (messageRefreshInterval.current) clearInterval(messageRefreshInterval.current)
    }
  }, [selectedAdmin])
  
  // Send a message to the selected admin
  const sendMessage = async () => {
    if (!selectedAdmin || !messageInput.trim()) return

    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     recipientId: selectedAdmin.id,
      //     content: messageInput,
      //   }),
      // });
      
      // const data = await response.json();
      // if (!response.ok) throw new Error(data.message || 'Failed to send message');
      
      // For demo, create a local message
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
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
      
      setMessages(prev => [...prev, newMessage])
      setMessageInput("") // Clear input after sending
      toast.success("Message sent")
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }
  
  // Handle enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // Filter hospital admins and users based on search
  const filteredAdmins = hospitalAdmins.filter(admin => {
    if (!filter) return true;
    
    const searchTerm = filter.toLowerCase();
    return (
      admin.name.toLowerCase().includes(searchTerm) || 
      admin.hospitalName.toLowerCase().includes(searchTerm) ||
      admin.email.toLowerCase().includes(searchTerm)
    );
  });
  
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Chat Communication</h2>
        <p className="text-muted-foreground">Communicate with hospital administrators directly</p>
      </div>
      
      {/* Fixed height chat container */}
      <div className="grid grid-cols-10 gap-0 h-[750px] border rounded-lg overflow-hidden shadow-lg">
        {/* Left side - Contact list */}
        <div className="col-span-3 flex flex-col h-full bg-gradient-to-b from-blue-50 to-white border-r border-blue-200">
          <div className="flex items-center bg-blue-600 p-3 text-white">
            <div className="flex-1 flex items-center">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src="/placeholder-user.svg" />
                <AvatarFallback className="bg-blue-800 text-white font-bold">SA-X1</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium">Super Admin</span>
                <p className="text-xs text-blue-100">ID: SA-X1</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
          
          <div className="p-3 border-b border-blue-200 space-y-3">
            <Button
              variant="default"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              onClick={() => toast.info('Broadcast message feature coming soon!')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Broadcast Message
            </Button>
            <div className="relative">
              <Input 
                placeholder="Search users and admins..." 
                className="pl-9 bg-white border border-blue-200 rounded-lg text-sm h-9 focus-visible:ring-blue-400" 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent" />
                  <p className="text-sm text-gray-500">Loading contacts...</p>
                </div>
              </div>
            ) : filteredAdmins.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {filteredAdmins.map((admin) => (
                    <button
                      key={admin.id}
                      onClick={() => loadConversation(admin.id)}
                      className={cn(
                        "w-full flex items-start p-3 rounded-lg hover:bg-gray-100 transition-colors",
                        selectedAdmin?.id === admin.id && "bg-gray-100"
                      )}
                    >
                      <div className="relative mr-3">
                        <Avatar className="h-12 w-12 ring-2 ring-blue-200">
                          <AvatarImage src={admin.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                            {getInitials(admin.name)}
                          </AvatarFallback>
                        </Avatar>
                        {admin.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-medium shadow-md">
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
                          <span className="inline-block mr-1">Waiting for your response...</span>
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
        <div className="col-span-7 flex flex-col h-full bg-gradient-to-br from-blue-50 to-white">
          {selectedAdmin ? (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedAdmin.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {getInitials(selectedAdmin.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium leading-none text-white">{selectedAdmin.name}</h3>
                    <p className="text-xs text-blue-100 mt-1">
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
                <ScrollArea className="h-full w-full">
                  <div className="flex flex-col gap-4 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full py-20">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent" />
                          <p className="text-sm text-gray-500">Loading messages...</p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-20">
                        <div className="bg-blue-100 p-4 rounded-full mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 2a3 3 0 0 1 2.995 2.824L21 5v14a3 3 0 0 1-2.824 2.995L18 22H6a3 3 0 0 1-2.995-2.824L3 19V5a3 3 0 0 1 2.824-2.995L6 2h12z"/></svg>
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">No messages yet</p>
                        <p className="text-sm text-gray-500 max-w-[300px] text-center">
                          Start the conversation by sending a message to {selectedAdmin.name} below
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
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
                                ? "bg-blue-600 text-white ml-auto shadow-md" 
                                : "bg-white text-gray-800 mr-auto shadow-sm border border-blue-100"
                            )}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              
              <div className="bg-blue-50 p-3 flex items-center border-t border-blue-200">
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-blue-600 hover:bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </Button>
                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-blue-600 hover:bg-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </Button>
                <div className="relative flex-1 mx-2">
                  <Input 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    className="w-full focus-visible:ring-blue-300 focus-visible:ring-offset-0 border border-blue-200 rounded-full shadow-none h-10 py-6 px-4"
                  />
                </div>
                <Button 
                  type="button" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 shadow-md" 
                  onClick={sendMessage} 
                  disabled={messageInput.trim() === ""}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gradient-to-br from-blue-50 to-white/80">
              <div className="bg-blue-100 p-6 rounded-full mb-4 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              </div>
              <h3 className="text-2xl font-medium text-blue-700 mb-2">Begin Your Conversation</h3>
              <p className="text-sm text-blue-600 max-w-md">Select a hospital admin from the list to start communicating securely</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
