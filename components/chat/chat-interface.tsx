"use client"

import React, { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, PaperclipIcon, Image } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

// Message types
export type MessageType = {
  id: string
  content: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  senderRole?: string
  timestamp: Date
  read: boolean
  attachments?: Array<{
    id: string
    type: string
    url: string
    name: string
  }>
}

// Chat participant types
export type Participant = {
  id: string
  name: string
  role: string
  avatar?: string
}

// Chat types
export type ChatType = {
  id: string
  name?: string
  participants: Participant[]
  messages: MessageType[]
  unreadCount: number
  lastMessage?: MessageType
}

// Props for the ChatInterface component
interface ChatInterfaceProps {
  chat: ChatType
  currentUserId: string
  currentUserRole: string
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  onLoadMoreMessages?: () => Promise<void>
  maxHeight?: string
  className?: string
}

export function ChatInterface({
  chat,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onLoadMoreMessages,
  maxHeight = "600px",
  className = ""
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chat.messages])

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() && attachments.length === 0) return
    
    setIsLoading(true)
    try {
      await onSendMessage(message, attachments.length > 0 ? attachments : undefined)
      setMessage("")
      setAttachments([])
    } catch (error) {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files)
      // Limit to 5 files per message
      if (attachments.length + fileList.length > 5) {
        toast.error("You can only attach up to 5 files per message")
        return
      }
      setAttachments(prev => [...prev, ...fileList])
    }
  }

  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  // Render a message bubble
  const renderMessage = (message: MessageType) => {
    const isCurrentUser = message.senderId === currentUserId
    const sender = chat.participants.find(p => p.id === message.senderId)
    const senderName = message.senderName || sender?.name || "Unknown"
    const senderRole = message.senderRole || sender?.role || "Unknown"
    
    return (
      <div 
        key={message.id}
        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isCurrentUser && (
          <Avatar className="h-8 w-8 mr-2 mt-1">
            <AvatarImage src={message.senderAvatar || sender?.avatar} />
            <AvatarFallback>
              {senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[75%]`}>
          {!isCurrentUser && (
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium mr-2">{senderName}</span>
              <Badge variant="outline" className="text-xs">
                {senderRole}
              </Badge>
            </div>
          )}
          
          <div 
            className={`rounded-lg py-2 px-3 ${
              isCurrentUser 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map(attachment => (
                  <div 
                    key={attachment.id} 
                    className="flex items-center bg-background/60 rounded p-1"
                  >
                    <a 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center"
                    >
                      {attachment.type.startsWith('image/') ? (
                        <Image className="h-3 w-3 mr-1" />
                      ) : (
                        <PaperclipIcon className="h-3 w-3 mr-1" />
                      )}
                      {attachment.name}
                    </a>
                  </div>
                ))}
              </div>
            )}
            
            <div className="text-[10px] mt-1 opacity-70 text-right">
              {new Date(message.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        
        {isCurrentUser && (
          <Avatar className="h-8 w-8 ml-2 mt-1">
            <AvatarImage src={message.senderAvatar || sender?.avatar} />
            <AvatarFallback>
              {senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle className="text-lg">
          {chat.name || "Hospital Communication"}
        </CardTitle>
        <CardDescription>
          {chat.participants.filter(p => p.id !== currentUserId).map(p => (
            <Badge key={p.id} variant="outline" className="mr-1">
              {p.name} ({p.role})
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>
      
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <CardContent className="p-4">
          {chat.messages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {onLoadMoreMessages && chat.messages.length >= 20 && (
                <div className="flex justify-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onLoadMoreMessages()}
                  >
                    Load previous messages
                  </Button>
                </div>
              )}
              
              {chat.messages.map(renderMessage)}
              <div ref={messageEndRef} />
            </>
          )}
        </CardContent>
      </ScrollArea>
      
      <CardFooter className="p-4 border-t">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="text-xs max-w-[100px] truncate">
                  {file.name}
                </span>
                <button 
                  className="ml-1 text-xs hover:text-destructive"
                  onClick={() => removeAttachment(index)}
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex w-full items-end gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-10 w-10 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <PaperclipIcon className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Textarea
            placeholder="Type your message..."
            className="min-h-10 flex-1 resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
          />
          
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={handleSendMessage}
            disabled={isLoading || (!message.trim() && attachments.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
