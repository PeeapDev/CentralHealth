"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Define hospital interface
interface Hospital {
  id: string;
  name: string;
  admin_email: string;
  admin_name?: string;
  domain?: string;
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

export default function SuperadminChatPage() {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  
  // Fetch actual hospitals from the system
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        // Just use placeholder data for now since the API endpoint isn't ready
        // Later this will be replaced with real API data
        const mockHospitals = [
          {
            id: "hosp-001",
            name: "Central Hospital",
            admin_email: "admin@centralhospital.com",
            admin_name: "Central Hospital Admin",
            domain: "central.hospital-fhir.com",
            lastActive: new Date().toISOString(),
            unreadCount: 0
          },
          {
            id: "hosp-002",
            name: "Memorial Hospital",
            admin_email: "admin@memorialhospital.com",
            admin_name: "Memorial Hospital Admin",
            domain: "memorial.hospital-fhir.com",
            lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            unreadCount: 2
          },
          {
            id: "hosp-003",
            name: "City Medical Center",
            admin_email: "admin@citymedical.com",
            admin_name: "City Medical Admin",
            domain: "city.hospital-fhir.com",
            lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            unreadCount: 0
          },
          {
            id: "hosp-004",
            name: "University Health",
            admin_email: "admin@universityhealth.edu",
            admin_name: "University Hospital Admin",
            domain: "university.hospital-fhir.com",
            lastActive: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            unreadCount: 0
          }
        ];
        
        setHospitals(mockHospitals);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        toast.error("Failed to load hospitals");
        setLoading(false);
      }
    };
    
    fetchHospitals();
  }, []);
  
  // Get initials from name for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Chat Communication</h2>
        <p className="text-muted-foreground">Communicate with hospital administrators directly</p>
      </div>
      
      {/* Simple fixed layout */}
      <div className="flex h-[500px] border rounded-lg overflow-hidden">
        {/* Left sidebar - fixed width */}
        <div className="w-[280px] bg-blue-50 border-r">
          {/* Super admin profile */}
          <div className="bg-blue-600 p-3 text-white">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-blue-800 text-white">SA</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">Super Admin</div>
                <div className="text-xs">ID: SA-X1</div>
              </div>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="p-3">
            <Button className="w-full mb-3 bg-blue-600 hover:bg-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              Broadcast Message
            </Button>
            <div className="relative">
              <Input 
                placeholder="Search users and admins..." 
                className="pl-8 bg-white" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
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
                  <div className="text-xs font-semibold text-gray-500 mb-2 px-2">HOSPITAL ADMINISTRATORS</div>
                  
                  {!Array.isArray(hospitals) || hospitals.length === 0 ? (
                    <div className="text-center py-3 text-sm text-gray-500">
                      No hospitals found in the system
                    </div>
                  ) : (
                    Array.isArray(hospitals) && hospitals
                      .filter(hospital => 
                        searchQuery === "" || 
                        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (hospital.admin_name && hospital.admin_name.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((hospital, index) => (
                        <div key={hospital.id}>
                          {index > 0 && <div className="h-[1px] bg-gray-200 my-1 mx-2"></div>}
                          <button 
                            onClick={() => setSelectedChat(hospital.id)}
                            className={`w-full flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                              selectedChat === hospital.id ? 'bg-gray-100' : ''
                            }`}
                          >
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarFallback className="bg-blue-100 text-blue-800">{getInitials(hospital.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 relative">
                              <div className="flex justify-between">
                                <span className="font-medium text-sm truncate">{hospital.admin_name || `${hospital.name} Admin`}</span>
                                <span className="text-xs text-gray-500">
                                  {hospital.lastActive ? new Date(hospital.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                                </span>
                              </div>
                              <p className="text-xs truncate text-gray-600">
                                <span className="text-blue-600">[{hospital.name}]</span> 
                                {hospital.id === 'hosp-001' ? 'Waiting for your response...' : 
                                 hospital.id === 'hosp-002' ? 'Need assistance with patient records' : 
                                 'No recent messages'}
                              </p>
                              {hospital.unreadCount && hospital.unreadCount > 0 && (
                                <div className="absolute top-0 right-0">
                                  <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{hospital.unreadCount}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        </div>
                      ))
                  )}
                  
                  <div className="flex flex-col space-y-2 items-center mt-4 mb-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="text-xs w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push('/superadmin/hospitals')}
                    >
                      Manage Hospitals
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs w-full text-blue-600 border-blue-200"
                      onClick={() => {
                        toast.info('Refreshing hospital list...');
                        setLoading(true);
                        // This would trigger a re-fetch of the hospitals
                        setTimeout(() => setLoading(false), 1000);
                      }}
                    >
                      Refresh List
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        {/* Right side - Chat content */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarFallback className="bg-blue-200 text-blue-800">HA</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <h3 className="text-sm font-medium leading-none text-white">
                  {selectedChat ? (hospitals.find(h => h.id === selectedChat)?.admin_name || `${hospitals.find(h => h.id === selectedChat)?.name} Admin` || 'Hospital Administrator') : 'Hospital Administrator'}
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  {selectedChat ? hospitals.find(h => h.id === selectedChat)?.name || 'Hospital' : 'Select a contact'} • Online
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </Button>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M8 9h8"/><path d="M8 13h6"/><path d="M18 2a3 3 0 0 1 2.995 2.824L21 5v14a3 3 0 0 1-2.824 2.995L18 22H6a3 3 0 0 1-2.995-2.824L3 19V5a3 3 0 0 1 2.824-2.995L6 2h12z"/></svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
              <p className="text-sm text-gray-500 max-w-md">
                {selectedChat ? 
                  `Start the conversation with ${hospitals.find(h => h.id === selectedChat)?.admin_name || `${hospitals.find(h => h.id === selectedChat)?.name} Admin` || 'Hospital Administrator'}` : 
                  'Select a hospital administrator to start messaging'}
              </p>
            </div>
          </div>
          
          {/* Message input */}
          <div className="p-3 bg-white border-t flex items-center">
            <Button size="icon" variant="ghost" className="text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </Button>
            <Button size="icon" variant="ghost" className="text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </Button>
            <div className="flex-1 mx-2">
              <Input 
                placeholder="Type a message" 
                className="border-blue-200 rounded-full" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
