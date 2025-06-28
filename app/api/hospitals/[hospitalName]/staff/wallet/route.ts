import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Define TypeScript interfaces for wallet data
interface WalletTransaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  time: string;
  reference: string;
  linkedId: string;
  createdBy?: string;
  createdAt?: string;
}

interface WalletData {
  userId: string;
  balance: number;
  currency: string;
  pendingSalary: number;
  lastPayment: string | null;
  nextPayment: string | null;
  transactions: WalletTransaction[];
}

interface TransactionRequest {
  userId: string;
  amount: string | number;
  type: string;
  description: string;
  status?: string;
  date?: string;
  time?: string;
  reference?: string;
  linkedId?: string;
}

// Base directory for staff wallet data
const STAFF_WALLET_DIR = path.join(process.cwd(), "data", "staff-wallet");

// Ensure wallet directory exists
if (!fs.existsSync(STAFF_WALLET_DIR)) {
  fs.mkdirSync(STAFF_WALLET_DIR, { recursive: true });
}

// Function to get staff wallet data
const getStaffWalletData = async (userId: string): Promise<WalletData> => {
  const walletFilePath = path.join(STAFF_WALLET_DIR, `${userId}.json`);
  
  // Check if wallet file exists, if not create a default one
  if (!fs.existsSync(walletFilePath)) {
    const defaultWallet: WalletData = {
      userId,
      balance: 0,
      currency: "USD",
      pendingSalary: 0,
      lastPayment: null,
      nextPayment: null,
      transactions: []
    };
    
    fs.writeFileSync(walletFilePath, JSON.stringify(defaultWallet, null, 2));
    return defaultWallet;
  }
  
  // Read wallet data from file
  const walletData = JSON.parse(fs.readFileSync(walletFilePath, "utf8")) as WalletData;
  return walletData;
};

// Function to update staff wallet data
const updateStaffWalletData = async (userId: string, walletData: WalletData): Promise<WalletData> => {
  const walletFilePath = path.join(STAFF_WALLET_DIR, `${userId}.json`);
  fs.writeFileSync(walletFilePath, JSON.stringify(walletData, null, 2));
  return walletData;
};

// GET handler to retrieve staff wallet data
export async function GET(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract user ID from session
    const userId = session.user.id;
    
    // Get staff wallet data
    const walletData = await getStaffWalletData(userId);
    
    // Return wallet data without full transactions list to reduce payload size
    const { transactions, ...walletInfo } = walletData;
    
    // Get only the 10 most recent transactions
    const recentTransactions = transactions 
      ? transactions.sort((a: WalletTransaction, b: WalletTransaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        ).slice(0, 10) 
      : [];

    return NextResponse.json({ 
      wallet: walletInfo,
      transactions: recentTransactions
    });
  } catch (error: any) {
    console.error("Error fetching staff wallet data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve wallet data" },
      { status: 500 }
    );
  }
}

// POST handler to add transactions to staff wallet
export async function POST(
  request: NextRequest,
  { params }: { params: { hospitalName: string } }
) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if user is a hospital admin or finance role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json(
        { error: "Insufficient permissions to create wallet transactions" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json() as TransactionRequest;
    
    // Validate required fields
    if (!body.userId || !body.amount || !body.type || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get staff wallet data
    const walletData = await getStaffWalletData(body.userId);

    // Create a new transaction
    const newTransaction: WalletTransaction = {
      id: uuidv4(),
      type: body.type,
      description: body.description,
      amount: parseFloat(body.amount),
      status: body.status || "completed",
      date: body.date || new Date().toISOString().split("T")[0],
      time: body.time || new Date().toLocaleTimeString(),
      reference: body.reference || `TXN-${Date.now()}`,
      linkedId: body.linkedId || `TRX-${Date.now().toString(36)}`,
      createdBy: session.user.id,
      createdAt: new Date().toISOString()
    };

    // Update wallet balance
    walletData.balance = parseFloat(walletData.balance) + parseFloat(body.amount);
    
    // Update last payment date if this is a salary transaction
    if (body.type.toLowerCase() === "salary" && body.status === "completed") {
      walletData.lastPayment = body.date || new Date().toISOString().split("T")[0];
      
      // Calculate next payment (usually a month later)
      const nextPaymentDate = new Date(walletData.lastPayment);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      walletData.nextPayment = nextPaymentDate.toISOString().split("T")[0];
      
      // If this was a pending salary being paid, clear pending salary
      walletData.pendingSalary = 0;
    }
    
    // If this is a pending salary being scheduled
    if (body.type.toLowerCase() === "salary" && body.status === "pending") {
      walletData.pendingSalary = parseFloat(body.amount);
      walletData.nextPayment = body.date;
    }

    // Add transaction to wallet
    walletData.transactions = walletData.transactions || [];
    walletData.transactions.push(newTransaction);

    // Save updated wallet data
    await updateStaffWalletData(body.userId, walletData);

    return NextResponse.json({ 
      success: true,
      transaction: newTransaction,
      currentBalance: walletData.balance
    });
  } catch (error: any) {
    console.error("Error adding transaction to wallet:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
