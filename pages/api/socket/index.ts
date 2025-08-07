import { Server as HTTPServer } from 'http'
import { Socket as NetSocket } from 'net'
import { Server as IOServer } from 'socket.io'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parse } from 'cookie'
import { decode } from 'next-auth/jwt'

// Store all active connections
interface SocketWithAuth extends NetSocket {
  userId?: string
  socketId?: string
}

interface ServerWithIO extends HTTPServer {
  io?: IOServer
}

// Store active user connections
const userSockets: Map<string, string[]> = new Map()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow websocket connections
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // Get the server instance
  const httpServer: ServerWithIO = res.socket?.server as ServerWithIO
  
  // If socket.io server doesn't exist on the HTTP server, create it
  if (!httpServer.io) {
    console.log('* Socket.io server initialized')
    
    const io = new IOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    })
    
    // Save the io instance
    httpServer.io = io
    
    // Handle connections
    io.on('connection', async (socket) => {
      try {
        // Authenticate socket connection
        const cookieStr = socket.handshake.headers.cookie || ''
        const cookies = parse(cookieStr)
        
        // Get the session token from cookies
        const sessionToken = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token']
        
        if (!sessionToken) {
          console.log('No session token found, disconnecting socket')
          socket.disconnect()
          return
        }
        
        // Verify the token
        const secret = process.env.NEXTAUTH_SECRET || ''
        const decoded = await decode({
          token: sessionToken,
          secret
        })
        
        if (!decoded || !decoded.sub) {
          console.log('Invalid session token, disconnecting socket')
          socket.disconnect()
          return
        }
        
        const userId = decoded.sub
        
        // Add user ID to socket for reference
        const socketWithAuth = socket as unknown as SocketWithAuth
        socketWithAuth.userId = userId
        socketWithAuth.socketId = socket.id
        
        // Store user's socket in active connections
        if (!userSockets.has(userId)) {
          userSockets.set(userId, [])
        }
        userSockets.get(userId)?.push(socket.id)
        
        console.log(`User ${userId} connected with socket ${socket.id}`)
        
        // Listen for joining specific chat rooms
        socket.on('join-chat', async (chatId) => {
          // Verify user is participant in this chat
          const participant = await prisma.chatParticipant.findFirst({
            where: {
              chatId,
              userId
            }
          })
          
          if (participant) {
            socket.join(`chat-${chatId}`)
            console.log(`User ${userId} joined chat ${chatId}`)
          } else {
            console.log(`User ${userId} not allowed to join chat ${chatId}`)
          }
        })
        
        // Listen for leaving chat rooms
        socket.on('leave-chat', (chatId) => {
          socket.leave(`chat-${chatId}`)
          console.log(`User ${userId} left chat ${chatId}`)
        })
        
        // Listen for new messages
        socket.on('new-message', async (data) => {
          // This will be handled by the REST API endpoint
          // We're just using this for typing/read receipts
          if (data.chatId) {
            socket.to(`chat-${data.chatId}`).emit('typing', {
              userId,
              chatId: data.chatId,
              typing: false
            })
          }
        })
        
        // Listen for typing indicators
        socket.on('typing', (data) => {
          if (data.chatId) {
            socket.to(`chat-${data.chatId}`).emit('typing', {
              userId,
              chatId: data.chatId,
              typing: data.typing
            })
          }
        })
        
        // Listen for read receipts
        socket.on('mark-read', async (data) => {
          if (data.chatId && data.messageId) {
            // Update the message as read in the database
            await prisma.message.update({
              where: {
                id: data.messageId,
              },
              data: {
                read: true,
              },
            })
            
            // Notify other users in the chat
            socket.to(`chat-${data.chatId}`).emit('message-read', {
              userId,
              chatId: data.chatId,
              messageId: data.messageId,
            })
          }
        })
        
        // Handle disconnection
        socket.on('disconnect', () => {
          // Remove socket from user's active connections
          const userSocketIds = userSockets.get(userId) || []
          const updatedSocketIds = userSocketIds.filter(id => id !== socket.id)
          
          if (updatedSocketIds.length === 0) {
            userSockets.delete(userId)
          } else {
            userSockets.set(userId, updatedSocketIds)
          }
          
          console.log(`User ${userId} disconnected socket ${socket.id}`)
        })
      } catch (error) {
        console.error('Socket authentication error:', error)
        socket.disconnect()
      }
    })
    
    // Setup a broadcast mechanism for new messages
    // This will be called by the message API endpoint
    io.of('/').adapter.on('create-room', (room) => {
      console.log(`Room ${room} was created`)
    })
    
    io.of('/').adapter.on('join-room', (room, id) => {
      console.log(`Socket ${id} joined room ${room}`)
    })
    
    io.of('/').adapter.on('leave-room', (room, id) => {
      console.log(`Socket ${id} left room ${room}`)
    })
  }
  
  // Endpoint just to initialize the socket.io server
  res.end()
}
