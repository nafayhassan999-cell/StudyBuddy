import { NextResponse } from 'next/server';

// In-memory storage for messages (use database in production)
const messages = new Map<number, Array<any>>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buddyId, text } = body;

    if (!buddyId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Store message (in production, save to database)
    const chatMessages = messages.get(buddyId) || [];
    chatMessages.push({
      text,
      timestamp: new Date().toISOString(),
      buddyId,
    });
    messages.set(buddyId, chatMessages);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buddyId = Number(searchParams.get('buddyId'));

    if (!buddyId) {
      return NextResponse.json(
        { error: 'Missing buddyId' },
        { status: 400 }
      );
    }

    const chatMessages = messages.get(buddyId) || [];
    return NextResponse.json({ messages: chatMessages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
