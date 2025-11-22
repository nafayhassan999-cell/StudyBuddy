import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { type, id, targetUserId, targetUserName, reason, description, reportedBy } = await req.json();

    // Validate required fields
    if (!type || !id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id, and reason are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['user', 'message', 'group'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type. Must be user, message, or group' },
        { status: 400 }
      );
    }

    // Create report object
    const report = {
      id: Date.now().toString(),
      type,
      targetId: id,
      targetUserId,
      targetUserName,
      reason,
      description: description || '',
      reportedBy,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    // In a real application, this would save to a database
    // For now, we'll simulate with a response
    console.log('📢 New Report Received:', report);
    console.log('🚨 Admin Notification: Review required for report #' + report.id);

    // Mock: Check if this triggers automatic warning
    const shouldWarn = reason === 'Harassment' || reason === 'Spam';
    if (shouldWarn) {
      console.log(`⚠️ Automatic warning issued to user ${targetUserName || targetUserId}`);
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully. Our team will review it shortly.',
      warning: shouldWarn,
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch reports (for admin dashboard)
export async function GET(req: NextRequest) {
  try {
    // In a real application, this would fetch from database
    // For now, return mock data
    const mockReports = [
      {
        id: '1',
        type: 'user',
        targetUserId: 'user123',
        targetUserName: 'John Doe',
        reason: 'Spam',
        description: 'Posting promotional content repeatedly',
        reportedBy: 'currentUser',
        timestamp: new Date().toISOString(),
        status: 'pending',
      },
    ];

    return NextResponse.json({
      success: true,
      reports: mockReports,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
