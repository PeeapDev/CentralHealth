import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for getting messages in a chat
const getMessagesSchema = z.object({
  chatId: z.string().uuid(),
  limit: z.number().int().positive().default(20),
  cursor: z.string().optional(),
})

// Schema for creating a new message
const createMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string(),
  })).optional(),
})

// GET /api/messages - Get messages for a chat with pagination
export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuth(req)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const chatId = searchParams.get("chatId")
    const limit = parseInt(searchParams.get("limit") || "20")
    const cursor = searchParams.get("cursor")

    // Validate params
    const validatedParams = getMessagesSchema.parse({
      chatId,
      limit,
      cursor: cursor || undefined,
    })

    // Check if the user is a participant in this chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: validatedParams.chatId,
        userId: authResult.user.id,
      },
    })

    if (!chatParticipant) {
      return NextResponse.json({ error: "Not a participant in this chat" }, { status: 403 })
    }

    // Get messages with cursor-based pagination
    const messages = await prisma.message.findMany({
      where: {
        chatId: validatedParams.chatId,
      },
      take: validatedParams.limit + 1, // Take one extra to determine if there are more
      ...(validatedParams.cursor && {
        cursor: {
          id: validatedParams.cursor,
        },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: {
        createdAt: "desc", // Newest messages first
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true,
          },
        },
      },
    })

    // Determine if there are more messages
    let nextCursor = undefined
    if (messages.length > validatedParams.limit) {
      const nextItem = messages.pop() // Remove the extra item
      nextCursor = nextItem?.id
    }

    // Mark retrieved messages as read for the current user
    await prisma.message.updateMany({
      where: {
        chatId: validatedParams.chatId,
        NOT: {
          senderId: authResult.user.id,
        },
        // Check if Message model has 'read' field - might need schema update
        ...(await doesFieldExist('Message', 'read') ? { read: false } : {}),
      },
      data: {
        // Only set read=true if field exists
        ...(await doesFieldExist('Message', 'read') ? { read: true } : {}),
      },
    })

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to chronological order for display
      nextCursor,
    })
  } catch (error) {
    console.error("Error getting messages:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Socket.IO server interface
interface ServerIO {
  io?: any;
}

// Helper function to check if field exists in model
async function doesFieldExist(model: string, field: string): Promise<boolean> {
  try {
    // This is a simplified check - in production you'd want to use Prisma's introspection
    // or maintain a schema version indicator
    return true; // Default to true for now - safer to attempt to use the field
  } catch (error) {
    console.error(`Error checking field ${field} on model ${model}:`, error);
    return false;
  }
}

// POST /api/messages - Create a new message
export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuth(req)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate request body
    const validatedBody = createMessageSchema.parse(body)

    // Check if the user is a participant in this chat
    const chatParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: validatedBody.chatId,
        userId: authResult.user.id,
      },
    })

    if (!chatParticipant) {
      return NextResponse.json({ error: "Not a participant in this chat" }, { status: 403 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: validatedBody.content,
        chatId: validatedBody.chatId,
        senderId: authResult.user.id,
        // Only add read field if it exists in schema
        ...(await doesFieldExist('Message', 'read') ? { read: false } : {}),
        attachments: validatedBody.attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
            profileImage: true,
          },
        },
      },
    })

    // Update the chat's updatedAt timestamp
    await prisma.chat.update({
      where: {
        id: validatedBody.chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    // Get Socket.IO server instance
    const socketServer = (req as any).socket?.server as ServerIO
    if (socketServer?.io) {
      // Emit the new message to all participants in the chat
      socketServer.io.to(`chat-${validatedBody.chatId}`).emit('new-message', message)
      
      // Also emit a chat update to notify of new messages
      socketServer.io.to(`chat-${validatedBody.chatId}`).emit('chat-updated', {
        chatId: validatedBody.chatId,
        lastMessage: message
      })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error creating message:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
