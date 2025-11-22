import { NextRequest, NextResponse } from "next/server";

// In-memory storage for declined requests (in production, use a database)
const declinedRequests = new Map<string, Set<number>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userEmail, requestId } = body;

    if (!userEmail || !requestId) {
      return NextResponse.json(
        { error: "Missing required fields: userEmail and requestId" },
        { status: 400 }
      );
    }

    // Get or create user's declined requests
    if (!declinedRequests.has(userEmail)) {
      declinedRequests.set(userEmail, new Set());
    }

    const userDeclined = declinedRequests.get(userEmail)!;
    
    // Add the declined request
    userDeclined.add(requestId);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return NextResponse.json(
      { 
        success: true, 
        message: "Connection request declined",
        requestId 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in decline endpoint:", error);
    return NextResponse.json(
      { error: "Failed to decline connection request" },
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

    const declined = declinedRequests.get(userEmail) || new Set();

    return NextResponse.json(
      { 
        success: true, 
        declinedRequests: Array.from(declined) 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in get declined requests endpoint:", error);
    return NextResponse.json(
      { error: "Failed to fetch declined requests" },
      { status: 500 }
    );
  }
}
