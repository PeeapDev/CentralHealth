"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Phone, Send, User, FileText, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  address?: string
  city?: string
  country?: string
  bio?: string
  joinedDate: string
  profileImage?: string
  notifications: {
    email: boolean
    sms: boolean
    app: boolean
  }
}

interface RecentChat {
  id: string
  name: string
  hospitalName: string
  profileImage?: string
  lastMessage: string
  lastMessageTime: string
  unread: number
}

export default function SuperadminProfilePage() {
  // Single state object for profile data to reduce re-renders
  const [profileData, setProfileData] = useState({
    name: 'Super Admin',
    email: 'admin@example.com',
    phone: '+1 (555) 123-4567',
    role: 'Superadmin',
    address: '123 Admin Street, Admin City, AC 12345',
    bio: 'System administrator with full access to all features and settings.',
    profileImage: '/placeholder-user.jpg',
    notifications: {
      email: true,
      sms: false,
      app: true
    }
  })
  const [editMode, setEditMode] = useState<boolean>(false)
  
  // State for chat functionality - minimized to essential
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newChatMessage, setNewChatMessage] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load profile data
  useEffect(() => {
    // In a real app, you would fetch the profile data from an API
    // We'll be ready to integrate with real data later
  }, [])

  // Simulated function to fetch chat messages - optimized
  const fetchChatMessages = (chatId: string) => {
    // Immediate state update without timeout
    setChatMessages([])
  }

  // Load initial data when component mounts
  useEffect(() => {
    fetchRecentChats()
  }, [])
  
  // Simplified chat data
  const fetchRecentChats = () => {
    // Use minimal data structure to improve performance
    setRecentChats([
      {
        id: '1',
        name: 'General Hospital',
        hospitalName: 'General Hospital Admin',
        profileImage: '/placeholder-user.jpg',
        lastMessage: 'When will the new update be available?',
        lastMessageTime: new Date().toLocaleString(),
        unread: 2,
      }
    ])
  }

  // Function to handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  // Function to handle profile edit
  const handleSaveProfile = () => {
    // This would save to an API in a real application
    setEditMode(false)
  }

  // Function to handle selecting a chat
  const handleSelectChat = (chat: RecentChat) => {
    setSelectedChat(chat)
    fetchChatMessages(chat.id)
  }

  // Function to send a new message
  const sendMessage = () => {
    if (!selectedChat || !newChatMessage.trim()) return

    try {
      // In a real app, this would be an API call to send the message
      // For now, just prepare the function structure for later implementation
      // const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: newChatMessage })
      // })
      
      // if (response.ok) {
      //   // Refresh messages
      //   fetchChatMessages(selectedChat.id)
      //   setNewChatMessage('')
      // }

      // For now, just clear the input
      setNewChatMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and view recent communications</p>
      </div>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="chats">Recent Chats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and preferences
                  </CardDescription>
                </div>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
                ) : (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image */}
                <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={profileData.profileImage} alt="Profile image" />
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {editMode ? (
                        <Input 
                          id="name" 
                          value={profileData.name}
                          onChange={(e) => handleInputChange(e, 'name')}
                        />
                      ) : (
                        <div className="flex items-center h-10 px-3 rounded-md border">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{profileData.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      {editMode ? (
                        <Input 
                          id="email" 
                          type="email" 
                          value={profileData.email}
                          onChange={(e) => handleInputChange(e, 'email')}
                        />
                      ) : (
                        <div className="flex items-center h-10 px-3 rounded-md border">
                          <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{profileData.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {editMode ? (
                        <Input 
                          id="phone" 
                          value={profileData.phone}
                          onChange={(e) => handleInputChange(e, 'phone')}
                        />
                      ) : (
                        <div className="flex items-center h-10 px-3 rounded-md border">
                          <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>{profileData.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{profileData.role}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {editMode ? (
                        <Textarea 
                          id="bio" 
                          value={profileData.bio}
                          onChange={(e) => handleInputChange(e, 'bio')}
                          rows={4}
                        />
                      ) : (
                        <div className="p-3 rounded-md border min-h-[100px] whitespace-pre-wrap">
                          {profileData.bio}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat Communications</CardTitle>
              <CardDescription>
                Communicate with hospital administrators directly from your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex h-[600px] overflow-hidden border rounded-md">
                {/* Contacts list - Gmail style */}
                <div className="w-64 border-r flex flex-col bg-white">
                  <div className="p-3 border-b flex items-center justify-between">
                    <Button variant="outline" size="sm" className="rounded-full text-sm font-normal shadow-sm bg-white border-gray-300 hover:bg-gray-50 px-4">
                      <span className="mr-1">+</span> New chat
                    </Button>
                  </div>
                  
                  <div className="px-3 py-2">
                    <div className="relative">
                      <Input 
                        placeholder="Search in chat and spaces" 
                        className="pl-9 bg-gray-100 border-0 rounded-full text-sm h-9"
                      />
                      <div className="absolute left-3 top-2.5 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </div>
                    </div>
                  </div>
                  
                  {recentChats.length > 0 ? (
                    <ScrollArea className="flex-1">
                      <div className="divide-y">
                        {recentChats.map((chat) => (
                          <button
                            key={chat.id}
                            className={`w-full text-left py-1.5 px-3 hover:bg-gray-100 transition-colors flex items-start ${
                              selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleSelectChat(chat)}
                          >
                            <div className="relative mr-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={chat.profileImage || "/placeholder-user.jpg"} alt={chat.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">{chat.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {chat.unread > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] font-medium">
                                  {chat.unread}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 border-b pb-2">
                              <div className="flex items-center justify-between">
                                <span className="font-normal text-sm truncate">{chat.name}</span>
                                <span className="text-xs text-gray-500 ml-1">{
                                  typeof chat.lastMessageTime === 'string' 
                                  ? chat.lastMessageTime 
                                  : new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                }</span>
                              </div>
                              <p className="text-xs truncate text-gray-600">
                                <span className="inline-block mr-1">Hey! {chat.lastMessage.substring(0, 40)}{chat.lastMessage.length > 40 ? '...' : ''}</span>
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <div>
                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                        <p className="mt-2 text-muted-foreground">No contacts found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Once hospital administrators send you messages, they will appear here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chat area - WhatsApp style */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  {selectedChat ? (
                    <>
                      {/* Chat header */}
                      <div className="py-2 px-3 border-b flex items-center justify-between">
                        <div className="flex items-center">
                          <h3 className="font-medium text-base flex items-center">
                            {selectedChat.name} 
                            <span className="text-xs ml-2 text-gray-500">-</span>
                            <span className="text-xs ml-2 text-green-600 font-normal">Active</span>
                          </h3>
                        </div>
                        <div className="flex items-center">
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="2" y1="12" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Chat messages */}
                      <ScrollArea className="flex-1 px-4 py-4">
                        {chatMessages.length > 0 ? (
                          <div className="space-y-2">
                            {/* Messages will be displayed here once fetched from API */}
                            <div ref={messagesEndRef} />
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="text-center text-gray-600 mb-8">
                              <div className="opacity-70 text-sm uppercase tracking-wider mb-1">HISTORY TURNED OFF</div>
                              <div className="text-xs">Messages sent with history off are deleted after 24h</div>
                            </div>
                            
                            <div className="border rounded-lg p-4 max-w-md w-full text-left mb-4">
                              <div className="flex mb-2">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarImage src="/placeholder-user.jpg" />
                                  <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">A</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium flex items-center">
                                    Admin <span className="text-gray-500 text-xs ml-2">10 min</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm">
                                Hi {selectedChat.name}, how's it going today? Welcome back to work. I have rescheduled our meeting. I hope it could work for you. :)
                              </div>
                              <div className="mt-3">
                                <img src="https://placehold.co/300x100/e8f0fe/0d6efd?text=Welcome+Back" alt="Welcome back" className="rounded-md w-36" />
                              </div>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                      
                      {/* Message input */}
                      <div className="p-3 bg-white border-t flex items-center">
                        <div className="flex-1 border border-gray-300 rounded-full px-4 py-1 flex items-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-transparent hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                          </Button>
                          <Input
                            placeholder="History is off"
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-8"
                          />
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-transparent hover:text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/></svg>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-transparent hover:text-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 21h10a2 2 0 0 0 2-2V9.414a1 1 0 0 0-.293-.707l-5.414-5.414A1 1 0 0 0 12.586 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"/></svg>
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={sendMessage}
                              disabled={!newChatMessage.trim()}
                              className="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-transparent hover:text-gray-700"
                              variant="ghost"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                      <div className="text-center max-w-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-gray-400"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10"/><path d="M7 11h10"/><path d="M7 15h10"/></svg>
                        <h3 className="text-xl font-normal mb-1 text-gray-700">No conversations selected</h3>
                        <p className="text-gray-500 mb-6 text-sm">
                          Choose one from the left sidebar or start a new chat
                        </p>
                        <div className="flex justify-center">
                          <Button 
                            variant="outline" 
                            className="rounded-md px-4 shadow-sm border-gray-300"
                            onClick={() => fetchRecentChats()}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            Compose
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
