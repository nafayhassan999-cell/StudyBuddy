import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type & size
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use PDF, TXT, or DOCX.' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';

    // Handle PDF
    if (file.type === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        extractedText = data.text;
      } catch (pdfError) {
        console.error('PDF extraction failed:', pdfError);
        return NextResponse.json({ error: 'Failed to extract text from PDF. Try a different file.' }, { status: 400 });
      }
    } 
    // Handle TXT
    else if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } 
    // Handle DOCX
    else if (file.type.includes('wordprocessingml.document')) {
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (docxError) {
        console.error('DOCX extraction failed:', docxError);
        return NextResponse.json({ error: 'Failed to extract text from DOCX.' }, { status: 400 });
      }
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text found in document. It may be scanned/image-based.' }, { status: 400 });
    }

    // Call Gemini for summary
    const prompt = `Summarize this document in 200-300 words, highlighting key points, structure, and main ideas. Make it concise and easy to study from.\n\nDocument:\n${extractedText.substring(0, 4000)}`; // Limit to avoid token overflow

    const summary = await callGemini(prompt);

    return NextResponse.json({ 
      success: true, 
      summary, 
      wordCount: extractedText.split(' ').length,
      fileName: file.name
    });

  } catch (error) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
