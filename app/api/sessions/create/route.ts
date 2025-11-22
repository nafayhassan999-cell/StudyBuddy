import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
const sessionsStore = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, date, time, topic, createdBy } = body;

    // Validation
    if (!groupId || !date || !time || !topic || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date is in the future
    const sessionDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (sessionDate < today) {
      return NextResponse.json(
        { success: false, error: 'Session date must be in the future' },
        { status: 400 }
      );
    }

    // Validate topic length
    if (topic.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Topic must be at least 5 characters' },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session object
    const newSession = {
      id: sessionId,
      groupId,
      date,
      time,
      topic: topic.trim(),
      createdBy,
      createdAt: new Date().toISOString(),
    };

    // Store session
    const groupSessions = sessionsStore.get(groupId) || [];
    groupSessions.push(newSession);
    sessionsStore.set(groupId, groupSessions);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      sessionId,
      session: newSession,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
