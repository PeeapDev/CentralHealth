import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/auth/jwt"

export async function GET(request: NextRequest, { params }: { params: Promise<{ hospitalName: string }> }) {
  try {
    // Await the params in Next.js 15
    const resolvedParams = await params;
    const { hospitalName } = resolvedParams
    
    // Get the token from cookies
    const token = request.cookies.get("hospitalToken")?.value
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Verify the token
    let payload;
    try {
      payload = await verifyToken(token)
      if (!payload) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
    
    const userId = payload.userId
    
    // Until the database migration is run, we'll return mock data
    // Later, we would query the actual messages from the database
    
    // This is mock data until the database schema is migrated
    const mockMessages = [
      {
        id: "msg1",
        chatId: "chat1",
        content: "Hello! I wanted to check on the system update status.",
        isRead: false,
        sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        sender: {
          id: "user1",
          name: "System Admin",
          profileImage: null
        }
      },
      {
        id: "msg2",
        chatId: "chat2",
        content: "Your recent patient data migration has completed successfully.",
        isRead: true,
        sentAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        sender: {
          id: "user2",
          name: "Support Team",
          profileImage: null
        }
      },
      {
        id: "msg3",
        chatId: "chat1",
        content: "Please review the updated privacy policy for your hospital.",
        isRead: false,
        sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        sender: {
          id: "user1",
          name: "System Admin",
          profileImage: null
        }
      }
    ]
    
    // Count unread messages
    const unreadCount = mockMessages.filter(msg => !msg.isRead).length
    
    return NextResponse.json({
      messages: mockMessages,
      unreadCount,
      // Note: In production, this would include pagination info
    })
    
    /* After database migration, use this code instead:
    
    // Get chats where the user is a participant
    const chats = await prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true }
    })
    
    const chatIds = chats.map(chat => chat.chatId)
    
    // Get recent messages from those chats
    const messages = await prisma.message.findMany({
      where: {
        chatId: { in: chatIds }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 10,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        }
      }
    })
    
    // Count unread messages
    const unreadCount = await prisma.message.count({
      where: {
        chatId: { in: chatIds },
        isRead: false,
        senderId: { not: userId } // Don't count user's own messages as unread
      }
    })
    
    return NextResponse.json({
      messages,
      unreadCount
    })
    */
    
  } catch (error) {
    console.error("Error fetching recent messages:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
