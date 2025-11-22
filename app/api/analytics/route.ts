import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Mock analytics data
    // In a real application, this would fetch from a database based on user ID
    
    const mockQuizzes = [
      { date: '2024-11-01', score: 75, topic: 'Mathematics' },
      { date: '2024-11-03', score: 82, topic: 'Physics' },
      { date: '2024-11-05', score: 68, topic: 'Chemistry' },
      { date: '2024-11-07', score: 90, topic: 'Mathematics' },
      { date: '2024-11-08', score: 85, topic: 'Biology' },
      { date: '2024-11-10', score: 78, topic: 'Physics' },
      { date: '2024-11-11', score: 92, topic: 'Computer Science' },
      { date: '2024-11-12', score: 88, topic: 'Mathematics' },
    ];

    const mockSessions = [
      { 
        date: '2024-11-10', 
        duration: 2.5, 
        topic: 'Mathematics Study Group',
        attendees: 5 
      },
      { 
        date: '2024-11-08', 
        duration: 1.8, 
        topic: 'Physics Problem Solving',
        attendees: 4 
      },
      { 
        date: '2024-11-05', 
        duration: 3.2, 
        topic: 'Chemistry Lab Review',
        attendees: 6 
      },
      { 
        date: '2024-11-03', 
        duration: 2.0, 
        topic: 'History Discussion',
        attendees: 3 
      },
      { 
        date: '2024-11-01', 
        duration: 1.5, 
        topic: 'Computer Science Project',
        attendees: 4 
      },
    ];

    // Calculate statistics
    const avgScore = mockQuizzes.reduce((sum, q) => sum + q.score, 0) / mockQuizzes.length;
    const avgTime = mockSessions.reduce((sum, s) => sum + s.duration, 0) / mockSessions.length;
    
    // Identify weakest topic
    const topicScores: Record<string, number[]> = {};
    mockQuizzes.forEach(quiz => {
      if (!topicScores[quiz.topic]) {
        topicScores[quiz.topic] = [];
      }
      topicScores[quiz.topic].push(quiz.score);
    });

    let weakestTopic = 'General';
    let lowestAvg = 100;

    Object.entries(topicScores).forEach(([topic, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < lowestAvg) {
        lowestAvg = avg;
        weakestTopic = topic;
      }
    });

    const analyticsData = {
      quizzes: mockQuizzes,
      sessions: mockSessions,
      avgScore: Math.round(avgScore),
      avgTime: avgTime.toFixed(1),
      totalSessions: mockSessions.length,
      weakestTopic,
      insight: avgScore >= 80 
        ? `Excellent performance! Keep up the great work! 🎉`
        : avgScore >= 60
        ? `Good progress! Consider reviewing ${weakestTopic} for improvement.`
        : `Focus on ${weakestTopic} to boost your scores. You've got this! 💪`,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
