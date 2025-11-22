import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title, description, link, uploadType, fileName } = await req.json();

    // Validate required fields
    if (!title || !description || !link) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Title must be at least 5 characters" },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: "Description must be at least 20 characters" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(link);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Generate unique course ID
    const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create course object
    const newCourse = {
      id: courseId,
      title: title.trim(),
      description: description.trim(),
      link,
      uploadType: uploadType || "link",
      fileName: fileName || null,
      createdAt: new Date().toISOString(),
      createdBy: "admin", // In production, use actual admin user ID
      status: "active",
      enrollmentCount: 0,
      rating: 0,
      views: 0,
    };

    // In a real application, you would:
    // 1. Validate admin authentication
    // 2. Save to database (MongoDB, PostgreSQL, etc.)
    // 3. Upload file to cloud storage (S3, Cloudinary, etc.)
    // 4. Create course metadata
    // 5. Send notifications to subscribers
    // 6. Log admin action

    // Mock database save simulation
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("Course created successfully:", {
      courseId,
      title: newCourse.title,
      uploadType: newCourse.uploadType,
    });

    return NextResponse.json({
      success: true,
      courseId,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error: any) {
    console.error("Course creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while creating the course",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all courses (optional)
export async function GET() {
  try {
    // In production, fetch from database
    // For now, return mock data structure
    const mockCourses = [
      {
        id: "course_1",
        title: "Introduction to React",
        description: "Learn the fundamentals of React including components, state, and props",
        link: "https://www.youtube.com/watch?v=example",
        uploadType: "link",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        enrollmentCount: 245,
        rating: 4.8,
        views: 1250,
      },
      {
        id: "course_2",
        title: "Advanced TypeScript Patterns",
        description: "Master advanced TypeScript techniques and design patterns for large-scale applications",
        link: "https://cdn.studybuddy.com/courses/typescript-advanced.pdf",
        uploadType: "file",
        fileName: "typescript-advanced.pdf",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        enrollmentCount: 187,
        rating: 4.9,
        views: 890,
      },
    ];

    return NextResponse.json({
      success: true,
      courses: mockCourses,
      count: mockCourses.length,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
