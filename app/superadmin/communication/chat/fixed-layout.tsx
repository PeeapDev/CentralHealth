"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function SuperadminChatPage() {
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState("")
  
  // This is a simplified version with minimal state and logic
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
              <Input placeholder="Search..." className="pl-8 bg-white" />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>
          
          {/* Contact list */}
          <div className="overflow-auto" style={{ height: "calc(500px - 130px)" }}>
            <div className="p-2">
              <button 
                onClick={() => setSelectedChat(1)}
                className="w-full flex items-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-blue-100 text-blue-800">HA</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm truncate">Hospital Administrator</span>
                    <span className="text-xs text-gray-500">3:14 PM</span>
                  </div>
                  <p className="text-xs truncate text-gray-600">
                    Waiting for your response...
                  </p>
                </div>
              </button>
            </div>
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
              <div>
                <div className="font-medium">Hospital Administrator</div>
                <div className="text-xs text-blue-100">Central Hospital • Online</div>
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
                Start the conversation by sending a message to Hospital Administrator below
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
