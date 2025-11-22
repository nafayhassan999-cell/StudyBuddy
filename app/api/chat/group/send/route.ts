import { NextResponse } from 'next/server';

// In-memory storage for group messages (use database in production)
const groupMessages = new Map<string, Array<any>>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { groupId, text, sender } = body;

    if (!groupId || !text || !sender) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Store message (in production, save to database)
    const messages = groupMessages.get(groupId) || [];
    const newMessage = {
      id: Date.now(),
      sender,
      text,
      timestamp: new Date().toISOString(),
    };
    messages.push(newMessage);
    groupMessages.set(groupId, messages);

    return NextResponse.json({ success: true, message: newMessage }, { status: 200 });
  } catch (error) {
    console.error('Error sending group message:', error);
    return NextResponse.json(
      { error: 'Failed to send message', success: false },
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
        { error: 'Missing groupId', success: false },
        { status: 400 }
      );
    }

    const messages = groupMessages.get(groupId) || [];
    return NextResponse.json({ success: true, messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', success: false },
      { status: 500 }
    );
  }
}
