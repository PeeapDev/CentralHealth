"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

// Define the shape of our context
interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinChat: (chatId: string) => void
  leaveChat: (chatId: string) => void
  sendTypingStatus: (chatId: string, isTyping: boolean) => void
  markMessagesAsRead: (chatId: string, messageId: string) => void
}

// Create the context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinChat: () => {},
  leaveChat: () => {},
  sendTypingStatus: () => {},
  markMessagesAsRead: () => {},
})

// Export the context provider component
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { status } = useSession()

  // Initialize socket connection when the user is authenticated
  useEffect(() => {
    if (status === "authenticated") {
      // Create socket connection
      const socketInstance = io({
        path: "/api/socket",
        addTrailingSlash: false,
      })

      // Set up event listeners
      socketInstance.on("connect", () => {
        console.log("Socket connected")
        setIsConnected(true)
      })

      socketInstance.on("disconnect", () => {
        console.log("Socket disconnected")
        setIsConnected(false)
      })

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connect error:", err)
        setIsConnected(false)
        toast.error("Connection error. Reconnecting...", {
          id: "socket-error",
        })
      })

      // Store the socket instance
      setSocket(socketInstance)

      // Clean up on unmount
      return () => {
        socketInstance.disconnect()
      }
    }
  }, [status])

  // Join a chat room
  const joinChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit("join-chat", chatId)
    }
  }

  // Leave a chat room
  const leaveChat = (chatId: string) => {
    if (socket && isConnected) {
      socket.emit("leave-chat", chatId)
    }
  }

  // Send typing status
  const sendTypingStatus = (chatId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit("typing", {
        chatId,
        typing: isTyping,
      })
    }
  }

  // Mark messages as read
  const markMessagesAsRead = (chatId: string, messageId: string) => {
    if (socket && isConnected) {
      socket.emit("mark-read", {
        chatId,
        messageId,
      })
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChat,
        leaveChat,
        sendTypingStatus,
        markMessagesAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

// Export a hook for consuming the context
export function useSocket() {
  return useContext(SocketContext)
}
