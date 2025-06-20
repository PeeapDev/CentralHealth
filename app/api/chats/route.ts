import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for creating a new chat
const createChatSchema = z.object({
  name: z.string().optional(),
  participantIds: z.array(z.string().uuid()).min(1),
  type: z.enum(["direct", "group", "hospital_patient"]),
  initialMessage: z.string().optional(),
})

// Schema for getting chats with filters
const getChatsSchema = z.object({
  limit: z.number().int().positive().default(20),
  cursor: z.string().optional(),
  type: z.enum(["direct", "group", "hospital_patient"]).optional(),
})

// GET /api/chats - Get user's chats with pagination
export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuth(req)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Safe non-null assertion after check above
    const currentUser = authResult.user

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")
    const cursor = searchParams.get("cursor")
    const type = searchParams.get("type") as "direct" | "group" | "hospital_patient" | null

    // Validate params
    const validatedParams = getChatsSchema.parse({
      limit,
      cursor: cursor || undefined,
      type: type || undefined,
    })

    // Get all chats where the user is a participant
    const chats = await prisma.chat.findMany({
      where: {
        ...(validatedParams.type && { type: validatedParams.type }),
        participants: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      take: validatedParams.limit + 1, // Take one extra to determine if there are more
      ...(validatedParams.cursor && {
        cursor: {
          id: validatedParams.cursor,
        },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true,
              },
            },
          },
        },
      },
    })

    // Determine if there are more chats
    let nextCursor = undefined
    if (chats.length > validatedParams.limit) {
      const nextItem = chats.pop() // Remove the extra item
      nextCursor = nextItem?.id
    }

    // Get the last message and unread count for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        // Get the last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            chatId: chat.id,
          },
          orderBy: {
            id: "desc", 
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        })

        // Get unread count for the current user
        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            NOT: {
              senderId: currentUser.id,
            },
            ...(await doesFieldExist('Message', 'read') ? { read: false } : {}),
          },
        })

        // Type assertion needed because Prisma model might not match our code
        // Add explicit type to avoid 'any' error
        const chatWithParticipants = chat as unknown as { participants: Array<{ user: { id: string; name: string | null; role: string; profileImage: string | null } }> }
        const formattedParticipants = chatWithParticipants.participants.map((participant) => ({
          id: participant.user.id,
          name: participant.user.name || "Unknown",
          role: participant.user.role,
          avatar: participant.user.profileImage,
        }))

        return {
          id: chat.id,
          name: chat.name,
          type: chat.type,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          participants: formattedParticipants,
          lastMessage,
          unreadCount,
        }
      })
    )

    return NextResponse.json({
      chats: chatsWithDetails,
      nextCursor,
    })
  } catch (error) {
    console.error("Error getting chats:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
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

// POST /api/chats - Create a new chat
export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuth(req)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Safe non-null assertion after check above
    const currentUser = authResult.user

    const body = await req.json()
    
    // Validate request body
    const validatedBody = createChatSchema.parse(body)

    // Make sure the current user is included in participants
    if (!validatedBody.participantIds.includes(currentUser.id)) {
      validatedBody.participantIds.push(currentUser.id)
    }

    // For direct chats, check if a chat already exists between these users
    if (validatedBody.type === "direct" && validatedBody.participantIds.length === 1) {
      // Include the current user in the participants
      validatedBody.participantIds.push(currentUser.id)
      // Find direct chat where both users are participants and no one else
      const existingDirectChat = await prisma.chat.findFirst({
        where: {
          type: "direct",
          AND: [
            // Both users are participants
            {
              participants: {
                some: {
                  userId: currentUser.id,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: validatedBody.participantIds[0],
                },
              },
            },
            // Check that there are exactly 2 participants
            {
              participants: {
                none: {
                  userId: {
                    notIn: [...validatedBody.participantIds, currentUser.id],
                  },
                },
              },
            },
          ],
        },
        // Include participant data and count
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  profileImage: true,
                },
              },
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      })

      // If a direct chat already exists between these users, return it
      if (existingDirectChat) {
        // Get the last message
        const lastMessage = await prisma.message.findFirst({
          where: {
            chatId: existingDirectChat.id,
          },
          orderBy: {
            id: "desc", 
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        })

        // Get unread count for the current user
        const unreadCount = await prisma.message.count({
          where: {
            chatId: existingDirectChat.id,
            NOT: {
              senderId: currentUser.id,
            },
            ...(await doesFieldExist('Message', 'read') ? { read: false } : {}),
          },
        })

        // Type assertion needed because Prisma model might not match our code
        // Add explicit type to avoid 'any' error
        const chatWithParticipants = existingDirectChat as unknown as { participants: Array<{ user: { id: string; name: string | null; role: string; profileImage: string | null } }> }
        const formattedParticipants = chatWithParticipants.participants.map((participant) => ({
          id: participant.user.id,
          name: participant.user.name || "Unknown",
          role: participant.user.role,
          avatar: participant.user.profileImage,
        }))

        return NextResponse.json({
          id: existingDirectChat.id,
          name: existingDirectChat.name,
          type: existingDirectChat.type,
          createdAt: existingDirectChat.createdAt,
          updatedAt: existingDirectChat.updatedAt,
          participants: formattedParticipants,
          lastMessage,
          unreadCount,
          alreadyExists: true,
        })
      }
    }

    // Create the new chat
    const newChat = await prisma.chat.create({
      data: {
        name: validatedBody.name,
        type: validatedBody.type,
        // Create participant records for each user
        participants: {
          create: validatedBody.participantIds.map(userId => ({
            userId,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                profileImage: true,
              },
            },
          },
        },
      },
    })

    // If an initial message was provided, create it
    let initialMessage = null
    if (validatedBody.initialMessage) {
      initialMessage = await prisma.message.create({
        data: {
          content: validatedBody.initialMessage,
          chatId: newChat.id,
          senderId: currentUser.id,
          ...(await doesFieldExist('Message', 'read') ? { read: false } : {}),
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
    }

    // Type assertion needed because Prisma model might not match our code
    // Add explicit type to avoid 'any' error
    const chatWithParticipants = newChat as unknown as { participants: Array<{ user: { id: string; name: string | null; role: string; profileImage: string | null } }> }
    const formattedParticipants = chatWithParticipants.participants.map((participant) => ({
      id: participant.user.id,
      name: participant.user.name || "Unknown",
      role: participant.user.role,
      avatar: participant.user.profileImage,
    }))

    return NextResponse.json({
      id: newChat.id,
      name: newChat.name,
      type: newChat.type,
      createdAt: newChat.createdAt,
      updatedAt: newChat.updatedAt,
      participants: formattedParticipants,
      lastMessage: initialMessage,
      unreadCount: 0,
      alreadyExists: false,
    })
  } catch (error) {
    console.error("Error creating chat:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
