import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { courseId, courseTitle, category } = await req.json();

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    const completedAt = new Date().toISOString();

    // Create completion record
    const completionRecord = {
      id: courseId,
      courseTitle: courseTitle || "Unknown Course",
      category: category || "General",
      completedAt,
      hoursEarned: Math.floor(Math.random() * 10) + 5, // Mock: 5-15 hours
    };

    // In a real application, you would:
    // 1. Validate user authentication
    // 2. Check if user is enrolled in the course
    // 3. Prevent duplicate completions
    // 4. Save to database
    // 5. Update user stats (total courses completed, hours studied)
    // 6. Award certificates or badges
    // 7. Send congratulations email
    // 8. Update leaderboard/progress tracking

    console.log("Course completion recorded:", {
      courseId,
      completedAt,
      hoursEarned: completionRecord.hoursEarned,
    });

    // Mock response with updated stats
    return NextResponse.json({
      success: true,
      message: "Course marked as completed successfully",
      completedAt,
      hoursEarned: completionRecord.hoursEarned,
      completion: completionRecord,
    });
  } catch (error: any) {
    console.error("Course completion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while marking course as complete",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's completed courses
export async function GET(req: NextRequest) {
  try {
    // In production, fetch from database based on authenticated user
    // For now, return empty array as client will use localStorage
    
    return NextResponse.json({
      success: true,
      completedCourses: [],
      totalCompleted: 0,
      totalHours: 0,
    });
  } catch (error) {
    console.error("Error fetching completed courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch completed courses" },
      { status: 500 }
    );
  }
}
