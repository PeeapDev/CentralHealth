"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, MessageSquare, Search, Settings, LogOut, User, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface HospitalHeaderProps {
  hospitalName: string
}

// Helper function to get initials from name
function getInitials(name?: string): string {
  if (!name) return "U"
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

export function HospitalHeader({ hospitalName }: HospitalHeaderProps) {
  const router = useRouter()

  // Get user data from localStorage if available
  const [userData, setUserData] = useState<{ id?: string; name?: string; email?: string }>({})
  const [unreadMessages, setUnreadMessages] = useState<number>(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Fetch recent messages and unread count
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/hospitals/${hospitalName}/messages/recent`)
      if (response.ok) {
        const data = await response.json()
        setRecentMessages(data.messages || [])
        setUnreadMessages(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }
  
  useEffect(() => {
    // Try to get user data from local storage
    const authData = localStorage.getItem("hospitalAuth")
    if (authData) {
      try {
        const parsedData = JSON.parse(authData)
        setUserData(parsedData)
        
        // Fetch initial messages
        fetchMessages()
        
        // Set up polling for new messages
        refreshInterval.current = setInterval(fetchMessages, 30000) // Poll every 30 seconds
      } catch (error) {
        console.error("Error parsing auth data:", error)
      }
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [])

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("auth")
    localStorage.removeItem("hospitalAuth")

    // Clear cookies - redirect to API endpoint that will clear cookies
    router.push(`/api/auth/logout?redirect=/${hospitalName}/auth/login`)
    
    // Show success message
    toast.success("Logged out successfully")
  }

  return (
    <header className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold capitalize">{hospitalName.replace("-", " ")} - Admin Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search patients, appointments..." className="w-64 pl-10" />
          </div>

          {/* Chat Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {unreadMessages}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <h3 className="font-medium">Messages</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/${hospitalName}/admin/notifications`)}
                  >
                    <span className="sr-only">View all messages</span>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              
              <ScrollArea className="h-[300px]">
                {recentMessages.length > 0 ? (
                  <div className="flex flex-col">
                    {recentMessages.map((message) => (
                      <Link
                        key={message.id}
                        href={`/${hospitalName}/admin/notifications?chat=${message.chatId}`}
                        className={cn(
                          "flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors",
                          !message.isRead && "bg-muted/30"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={message.sender.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-600 text-white">
                            {getInitials(message.sender.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">{message.sender.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(message.sentAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {message.content}
                          </p>
                        </div>
                        {!message.isRead && (
                          <Badge variant="destructive" className="h-2 w-2 rounded-full p-0" />
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground">
                      Check back later or start a new conversation
                    </p>
                  </div>
                )}
              </ScrollArea>
              
              <Separator />
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => router.push(`/${hospitalName}/admin/notifications`)}
                >
                  View All Messages
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" alt="Admin" />
                  <AvatarFallback className="bg-blue-600 text-white">
                  {userData?.name ? userData.name.split(" ").map(n => n[0]).join("").toUpperCase() : "AD"}
                </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userData?.name || "Hospital Admin"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userData?.email || `admin@${hospitalName.replace("-", "")}.com`}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/${hospitalName}/admin/profile`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
