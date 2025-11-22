import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.split('.').pop();

    // Extract text based on file type
    let text = '';

    if (fileExt === 'txt') {
      // Handle TXT files
      text = await file.text();
    } else if (fileExt === 'pdf') {
      // Handle PDF files with pdfjs-dist
      try {
        const arrayBuffer = await file.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: typedArray,
          useSystemFonts: true,
        });
        
        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        
        // Extract text from all pages
        const textPromises = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          textPromises.push(
            pdfDocument.getPage(pageNum).then(async (page) => {
              const textContent = await page.getTextContent();
              return textContent.items.map((item: any) => item.str).join(' ');
            })
          );
        }
        
        const pageTexts = await Promise.all(textPromises);
        text = pageTexts.join('\n\n');
        
      } catch (pdfError: any) {
        console.error('PDF parsing error:', pdfError);
        return NextResponse.json({
          success: false,
          error: `Failed to parse PDF file: ${pdfError.message || 'Unknown error'}. Please ensure it's a valid PDF document.`,
        }, { status: 400 });
      }
    } else if (fileExt === 'docx') {
      // For DOCX files - in production, use mammoth library
      return NextResponse.json({
        success: false,
        error: 'DOCX parsing requires mammoth library. For now, please convert to TXT or use TXT files.',
        note: 'To enable DOCX support: npm install mammoth, then uncomment the DOCX parsing code in the API route.',
      }, { status: 400 });
      
      // TODO: Uncomment when mammoth is installed
      // const mammoth = require('mammoth');
      // const arrayBuffer = await file.arrayBuffer();
      // const buffer = Buffer.from(arrayBuffer);
      // const result = await mammoth.extractRawText({ buffer });
      // text = result.value;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please upload PDF or TXT files.' },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'No text content found in the file' },
        { status: 400 }
      );
    }

    // Limit text length to avoid token limits
    const maxTextLength = 10000; // ~10k characters
    if (text.length > maxTextLength) {
      text = text.substring(0, maxTextLength) + '... [truncated]';
    }

    // Generate summary using Gemini with retry logic
    const prompt = `Summarize this document in a clear, structured format using markdown. Include:
- Main topic/title
- Key points (as bullet points)
- Important details or findings
- Conclusion or takeaways

Document content:
${text}`;

    let summary;
    let lastError;
    
    // Retry logic for handling temporary API issues
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        summary = await callGemini(prompt);
        break; // Success, exit retry loop
      } catch (err: any) {
        lastError = err;
        console.log(`Summarize attempt ${attempt} failed:`, err.message);
        
        // If it's a 503 (overloaded) or temporary error, wait before retrying
        if (err.message?.includes('503') || err.message?.includes('overloaded') || err.message?.includes('temporarily')) {
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Wait 2s, 4s
            continue;
          }
        } else {
          // For other errors, don't retry
          throw err;
        }
      }
    }
    
    // If all retries failed
    if (!summary) {
      throw lastError || new Error('Failed to generate summary after retries');
    }

    return NextResponse.json({
      success: true,
      summary: summary,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Error summarizing document:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to summarize document. Please try again.';
    
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      errorMessage = 'Google AI is currently overloaded. Please wait a moment and try again.';
    } else if (error.message?.includes('API key')) {
      errorMessage = 'API configuration error. Please restart the server.';
    } else if (error.message?.includes('No text response')) {
      errorMessage = 'AI did not generate a response. Please try again.';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
