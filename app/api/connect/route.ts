import { NextRequest, NextResponse } from "next/server";

// In-memory storage for connections (in production, use a database)
const connections = new Map<string, Set<number>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, buddyId, buddyName } = body;

    if (!userEmail || !buddyId) {
      return NextResponse.json(
        { error: "Missing required fields: userEmail and buddyId" },
        { status: 400 }
      );
    }

    // Get or create user's connections
    if (!connections.has(userEmail)) {
      connections.set(userEmail, new Set());
    }

    const userConnections = connections.get(userEmail)!;
    
    // Add the connection
    userConnections.add(buddyId);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(
      { 
        success: true, 
        message: `Connection request sent to ${buddyName || 'user'}`,
        buddyId 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in connect endpoint:", error);
    return NextResponse.json(
      { error: "Failed to send connection request" },
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

    const userConnections = connections.get(userEmail) || new Set();

    return NextResponse.json(
      { 
        success: true, 
        connections: Array.from(userConnections) 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in get connections endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
