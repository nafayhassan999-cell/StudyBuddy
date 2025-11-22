import { NextResponse } from 'next/server';

// In-memory storage for groups (use database in production)
const groups = new Map<string, any>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, subject, privacy, creatorEmail } = body;

    // Validate required fields
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Group name must be at least 3 characters', success: false },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required', success: false },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate group ID
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create group object
    const newGroup = {
      id: groupId,
      name: name.trim(),
      subject,
      privacy: privacy || 'public',
      creator: creatorEmail,
      members: [creatorEmail],
      createdAt: new Date().toISOString(),
    };

    // Store group
    groups.set(groupId, newGroup);

    return NextResponse.json(
      {
        success: true,
        groupId,
        group: newGroup,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group', success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Return all groups
    const allGroups = Array.from(groups.values());
    return NextResponse.json(
      {
        success: true,
        groups: allGroups,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups', success: false },
      { status: 500 }
    );
  }
}
