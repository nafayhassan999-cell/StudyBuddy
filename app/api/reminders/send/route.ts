import { NextRequest, NextResponse } from 'next/server';

// TODO: For production, install and import nodemailer or SendGrid
// import nodemailer from 'nodemailer';
// 
// Configure email transport (use environment variables)
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sessionData, recipients } = body;

    // Validation
    if (!sessionId || !sessionData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { topic, date, time } = sessionData;

    // Mock email sending for development
    console.log('=== MOCK EMAIL REMINDER ===');
    console.log(`Session ID: ${sessionId}`);
    console.log(`Topic: ${topic}`);
    console.log(`Date: ${date}`);
    console.log(`Time: ${time}`);
    console.log(`Recipients (Going): ${recipients?.length || 0} users`);
    console.log('===========================');

    // In production, send actual emails:
    // for (const recipient of recipients) {
    //   await transporter.sendMail({
    //     from: process.env.SMTP_FROM || 'noreply@studybuddy.com',
    //     to: recipient.email,
    //     subject: 'Study Session Reminder - Starting Soon!',
    //     text: `Hi ${recipient.name},\n\nThis is a reminder that your study session on "${topic}" starts in 1 hour.\n\nDate: ${date}\nTime: ${time}\n\nSee you there!\n\nBest regards,\nStudyBuddy Team`,
    //     html: `
    //       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    //         <h2 style="color: #6366f1;">Study Session Reminder 📚</h2>
    //         <p>Hi ${recipient.name},</p>
    //         <p>This is a reminder that your study session starts in <strong>1 hour</strong>.</p>
    //         <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
    //           <h3 style="margin: 0 0 10px 0;">${topic}</h3>
    //           <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
    //           <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
    //         </div>
    //         <p>See you there!</p>
    //         <p style="color: #6b7280;">Best regards,<br/>StudyBuddy Team</p>
    //       </div>
    //     `,
    //   });
    // }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      recipientCount: recipients?.length || 0,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
