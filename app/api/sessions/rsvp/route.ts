import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
const rsvpStore = new Map<string, Map<string, string>>(); // sessionId -> Map(userId -> rsvpStatus)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, rsvp } = body;

    // Validation
    if (!sessionId || !userId || !rsvp) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate RSVP status
    const validStatuses = ['going', 'not-going', 'maybe'];
    if (!validStatuses.includes(rsvp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid RSVP status' },
        { status: 400 }
      );
    }

    // Get or create session RSVP map
    let sessionRsvps = rsvpStore.get(sessionId);
    if (!sessionRsvps) {
      sessionRsvps = new Map<string, string>();
      rsvpStore.set(sessionId, sessionRsvps);
    }

    // Update user's RSVP
    sessionRsvps.set(userId, rsvp);

    // Count attendees by status
    const goingCount = Array.from(sessionRsvps.values()).filter(status => status === 'going').length;
    const maybeCount = Array.from(sessionRsvps.values()).filter(status => status === 'maybe').length;
    const notGoingCount = Array.from(sessionRsvps.values()).filter(status => status === 'not-going').length;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      rsvp,
      attendees: {
        going: goingCount,
        maybe: maybeCount,
        notGoing: notGoingCount,
        total: goingCount + maybeCount,
      },
    });
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update RSVP' },
      { status: 500 }
    );
  }
}
