"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

// Define contact interface (superadmin and other hospitals)
interface Contact {
  id: string;
  name: string;
  role: string;
  hospitalName?: string;
  lastActive?: string;
  unreadCount?: number;
}

// Define message interface
interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  isRead: boolean;
}

export default function HospitalAdminChatPage() {
  const router = useRouter();
  const params = useParams();
  const hospitalName = params?.hospitalName as string || 'This Hospital';
  
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  // Get initials from name for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  // Fetch contacts (superadmin + other hospitals)
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        // In production, this would fetch from a real API endpoint
        // For now, using mock data for demonstration
        const mockContacts: Contact[] = [
          {
            id: "superadmin",
            name: "Government Admin",
            role: "superadmin",
            lastActive: new Date().toISOString(),
            unreadCount: 0
          },
          {
            id: "hosp-002",
            name: "Memorial Hospital",
            role: "hospital",
            hospitalName: "Memorial Hospital",
            lastActive: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            unreadCount: 2
          },
          {
            id: "hosp-003",
            name: "City Medical Center",
            role: "hospital",
            hospitalName: "City Medical Center",
            lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            unreadCount: 0
          },
          {
            id: "hosp-004",
            name: "University Health",
            role: "hospital",
            hospitalName: "University Health",
            lastActive: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            unreadCount: 0
          }
        ];
        
        setContacts(mockContacts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Failed to load contacts");
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, []);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    
    // Here we would typically send the message to the API
    // For now, we'll just simulate it locally
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: message,
      timestamp: new Date().toISOString(),
      senderId: "current-hospital", // This would be the current hospital's ID
      senderName: hospitalName || "This Hospital",
      receiverId: selectedChat,
      receiverName: contacts.find(c => c.id === selectedChat)?.name || "Unknown",
      isRead: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessage("");
    
    toast.success("Message sent");
  };
  
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat Communications</h1>
        <p className="text-gray-500">Communicate with Government Admin and other hospitals</p>
      </div>
      
      <div className="grid grid-cols-12 gap-4 h-[500px] rounded-lg border overflow-hidden">
        {/* Left sidebar - contacts */}
        <div className="col-span-5 bg-gray-50 border-r">
          <div className="p-4 border-b">
            <div className="relative">
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-8"
              />
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="absolute right-3 top-3 text-gray-400"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
          </div>
          
          {/* Contact list */}
          <div className="overflow-auto" style={{ height: "calc(500px - 130px)" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent" />
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold text-gray-500 mb-2 px-2">GOVERNMENT ADMIN</div>
                  
                  {/* Superadmin contact */}
                  {contacts
                    .filter(contact => contact.role === "superadmin")
                    .map(contact => (
                      <div key={contact.id}>
                        <button 
                          onClick={() => setSelectedChat(contact.id)}
                          className={`w-full flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                            selectedChat === contact.id ? 'bg-gray-100' : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback className="bg-red-100 text-red-800">{getInitials(contact.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 relative">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm truncate">{contact.name}</span>
                              <span className="text-xs text-gray-500">
                                {contact.lastActive ? new Date(contact.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                              </span>
                            </div>
                            <p className="text-xs truncate text-gray-600">
                              <span className="text-red-600">[Government]</span> 
                              {contact.id === 'superadmin' ? 'Click to message government admin' : 'No recent messages'}
                            </p>
                            {contact.unreadCount && contact.unreadCount > 0 && (
                              <div className="absolute top-0 right-0">
                                <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{contact.unreadCount}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                  
                  <div className="text-xs font-semibold text-gray-500 mt-4 mb-2 px-2">OTHER HOSPITALS</div>
                  
                  {/* Other hospitals */}
                  {contacts
                    .filter(contact => 
                      contact.role === "hospital" && 
                      (searchQuery === "" || 
                       contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((contact, index) => (
                      <div key={contact.id}>
                        {index > 0 && <div className="h-[1px] bg-gray-200 my-1 mx-2"></div>}
                        <button 
                          onClick={() => setSelectedChat(contact.id)}
                          className={`w-full flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                            selectedChat === contact.id ? 'bg-gray-100' : ''
                          }`}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback className="bg-blue-100 text-blue-800">{getInitials(contact.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 relative">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm truncate">{contact.name}</span>
                              <span className="text-xs text-gray-500">
                                {contact.lastActive ? new Date(contact.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                              </span>
                            </div>
                            <p className="text-xs truncate text-gray-600">
                              <span className="text-blue-600">[{contact.hospitalName}]</span> 
                              {contact.id === 'hosp-002' ? 'Can you help with a patient transfer?' : 'No recent messages'}
                            </p>
                            {contact.unreadCount && contact.unreadCount > 0 && (
                              <div className="absolute top-0 right-0">
                                <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{contact.unreadCount}</span>
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        {/* Right panel - chat area */}
        <div className="col-span-7 flex flex-col">
          {/* Chat header */}
          <div className="p-4 border-b bg-blue-600 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-blue-200 text-blue-800">
                    {selectedChat ? getInitials(contacts.find(c => c.id === selectedChat)?.name || 'Unknown') : 'UN'}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <h3 className="text-sm font-medium leading-none text-white">
                    {selectedChat ? (contacts.find(c => c.id === selectedChat)?.name || 'Unknown Contact') : 'Select a contact'}
                  </h3>
                  <p className="text-xs text-blue-100 mt-1">
                    {selectedChat ? 
                      (contacts.find(c => c.id === selectedChat)?.role === 'superadmin' ? 
                        'Government Admin • Online' : 
                        `${contacts.find(c => c.id === selectedChat)?.hospitalName || 'Hospital'} • Online`) : 
                      'Select a contact to start chatting'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                <span className="sr-only">Menu</span>
              </Button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-auto p-4">
            {!selectedChat ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 2a3 3 0 0 1 2.995 2.824L21 5v14a3 3 0 0 1-2.824 2.995L18 22H6a3 3 0 0 1-2.995-2.824L3 19V5a3 3 0 0 1 2.824-2.995L6 2h12z"/></svg>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    Select a contact to start messaging
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {/* Message bubbles would go here */}
                {messages.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className={`mb-4 ${msg.senderId === 'current-hospital' ? 'text-right' : ''}`}>
                      <div className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${msg.senderId === 'current-hospital' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          {/* Message input */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0 border border-gray-200 rounded-full shadow-none h-10 py-6 px-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={!selectedChat}
              />
              <Button 
                size="icon" 
                className="ml-2 rounded-full h-10 w-10 p-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700"
                disabled={!message.trim() || !selectedChat}
                onClick={handleSendMessage}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/></svg>
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
