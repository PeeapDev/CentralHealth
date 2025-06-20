"use client"

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatType } from "./chat-interface"
import { formatDistanceToNow } from "date-fns"
import { MessageSquare, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ChatListProps {
  chats: ChatType[]
  selectedChatId?: string
  onSelectChat: (chatId: string) => void
  onNewChat?: () => void
  canCreateNewChat?: boolean
  maxHeight?: string
  className?: string
}

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  canCreateNewChat = false,
  maxHeight = "600px",
  className = ""
}: ChatListProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  
  // Filter chats based on search query
  const filteredChats = React.useMemo(() => {
    if (!searchQuery.trim()) return chats
    
    const query = searchQuery.toLowerCase()
    return chats.filter(chat => {
      // Search by chat name
      if (chat.name?.toLowerCase().includes(query)) return true
      
      // Search by participant names
      if (chat.participants.some(p => p.name.toLowerCase().includes(query))) return true
      
      // Search by last message content
      if (chat.lastMessage?.content.toLowerCase().includes(query)) return true
      
      return false
    })
  }, [chats, searchQuery])
  
  // Sort chats by last message date (most recent first)
  const sortedChats = React.useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      const dateA = a.lastMessage?.timestamp || new Date(0)
      const dateB = b.lastMessage?.timestamp || new Date(0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [filteredChats])

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Messages</CardTitle>
          {canCreateNewChat && onNewChat && (
            <Button 
              size="sm" 
              onClick={onNewChat}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      
      <ScrollArea style={{ maxHeight }}>
        <CardContent className="p-0">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
              {searchQuery ? (
                <p>No conversations matching your search</p>
              ) : (
                <>
                  <p className="font-medium">No conversations yet</p>
                  {canCreateNewChat && (
                    <Button 
                      variant="link" 
                      onClick={onNewChat} 
                      className="mt-2"
                    >
                      Start a new conversation
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div>
              {sortedChats.map((chat) => {
                const isSelected = chat.id === selectedChatId
                
                // Format participants for display (excluding current user)
                const participantNames = chat.participants
                  .map(p => p.name)
                  .join(", ")
                
                // Get last message info
                const lastMessage = chat.lastMessage
                const lastMessageTime = lastMessage 
                  ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: true })
                  : ""
                
                return (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`
                      flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0
                      ${isSelected ? "bg-muted" : ""}
                    `}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {chat.name ? (
                        <AvatarFallback>
                          {chat.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback>
                          {chat.participants[0]?.name.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm truncate">
                          {chat.name || participantNames}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {lastMessageTime}
                        </span>
                      </div>
                      
                      {lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMessage.content || "Attachment"}
                        </p>
                      )}
                      
                      <div className="flex items-center mt-1">
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="text-[10px] h-5 min-w-[20px]">
                            {chat.unreadCount}
                          </Badge>
                        )}
                        
                        {chat.participants.length > 2 && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            {chat.participants.length} participants
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
