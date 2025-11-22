import { NextResponse } from 'next/server';

// In-memory storage for invites (use database in production)
const groupInvites = new Map<string, number[]>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, userIds } = body;

    // Validate required fields
    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required', success: false },
        { status: 400 }
      );
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one user must be selected', success: false },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Store invites (in production, send notifications and save to database)
    const existingInvites = groupInvites.get(groupId) || [];
    const uniqueSet = new Set([...existingInvites, ...userIds]);
    const updatedInvites = Array.from(uniqueSet);
    groupInvites.set(groupId, updatedInvites);

    return NextResponse.json(
      {
        success: true,
        message: `Invites sent to ${userIds.length} ${userIds.length === 1 ? 'user' : 'users'}`,
        invitedCount: userIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending invites:', error);
    return NextResponse.json(
      { error: 'Failed to send invites', success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required', success: false },
        { status: 400 }
      );
    }

    // Get invites for specific group
    const invites = groupInvites.get(groupId) || [];

    return NextResponse.json(
      {
        success: true,
        invites,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites', success: false },
      { status: 500 }
    );
  }
}
