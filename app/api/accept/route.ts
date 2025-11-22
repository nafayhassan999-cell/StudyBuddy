import { NextRequest, NextResponse } from "next/server";

// In-memory storage for accepted connections (in production, use a database)
const acceptedConnections = new Map<string, Set<number>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, requestId, buddyName, buddyEmail } = body;

    if (!userEmail || !requestId) {
      return NextResponse.json(
        { error: "Missing required fields: userEmail and requestId" },
        { status: 400 }
      );
    }

    // Get or create user's accepted connections
    if (!acceptedConnections.has(userEmail)) {
      acceptedConnections.set(userEmail, new Set());
    }

    const userConnections = acceptedConnections.get(userEmail)!;
    
    // Add the accepted connection
    userConnections.add(requestId);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      { 
        success: true, 
        message: `Accepted connection request from ${buddyName || 'user'}`,
        requestId,
        buddyEmail 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in accept endpoint:", error);
    return NextResponse.json(
      { error: "Failed to accept connection request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Missing email parameter" },
        { status: 400 }
      );
    }

    const connections = acceptedConnections.get(userEmail) || new Set();

    return NextResponse.json(
      { 
        success: true, 
        acceptedConnections: Array.from(connections) 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in get accepted connections endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch accepted connections" },
      { status: 500 }
    );
  }
}
