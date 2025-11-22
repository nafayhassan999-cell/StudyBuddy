import { NextRequest, NextResponse } from "next/server";

// CORS headers for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Mock in-memory database (in production, use a real database)
let mockProfiles: Record<string, any> = {
  default: {
    subjects: ["Math", "Physics", "Computer Science"],
    goal: "Ace exams",
    studyHours: 3,
    preferredTime: "evening",
    bio: "Passionate about STEM subjects and looking for study buddies!",
  },
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET: Retrieve profile data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default";

    // Get profile from mock database
    const profile = mockProfiles[userId] || mockProfiles.default;

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile data",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// POST: Create or update profile data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: "Request body is required",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const userId = body.userId || "default";
    
    // Save to mock database (in production, save to real database)
    mockProfiles[userId] = {
      ...mockProfiles[userId],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // Mock localStorage-like behavior (can't actually use localStorage in API routes)
    // In a real app, you'd save to a database like MongoDB, PostgreSQL, etc.
    
    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: mockProfiles[userId],
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// PUT: Update specific fields
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || "default";

    if (!mockProfiles[userId]) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // Partial update
    mockProfiles[userId] = {
      ...mockProfiles[userId],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: mockProfiles[userId],
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// DELETE: Remove profile
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "default";

    if (userId === "default") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete default profile",
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    if (!mockProfiles[userId]) {
      return NextResponse.json(
        {
          success: false,
          error: "Profile not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    delete mockProfiles[userId];

    return NextResponse.json(
      {
        success: true,
        message: "Profile deleted successfully",
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error deleting profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete profile",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
