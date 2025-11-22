import { NextResponse } from 'next/server';

// In-memory storage for files (use database and file storage in production)
const uploadedFiles = new Map<string, Array<any>>();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const groupId = formData.get('groupId') as string;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file || !groupId) {
      return NextResponse.json(
        { error: 'File and groupId are required', success: false },
        { status: 400 }
      );
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB', success: false },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'text/plain',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, PNG, and TXT files are allowed', success: false },
        { status: 400 }
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate file ID and mock URL
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileExtension = file.name.split('.').pop();
    
    // In production, you would:
    // 1. Upload file to cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Get the actual URL
    // 3. Save metadata to database
    
    // Mock file URL (in production, this would be the actual storage URL)
    const mockUrl = `/mock/files/${fileId}.${fileExtension}`;

    // For image files, create a data URL for preview (in production, use actual storage URL)
    let fileUrl = mockUrl;
    if (file.type.startsWith('image/')) {
      // Convert to base64 for preview
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      fileUrl = `data:${file.type};base64,${base64}`;
    }

    const fileMetadata = {
      fileId,
      name: file.name,
      url: fileUrl,
      type: file.type,
      size: file.size,
      uploadedBy,
      timestamp: new Date().toISOString(),
    };

    // Store file metadata
    const groupFiles = uploadedFiles.get(groupId) || [];
    groupFiles.push(fileMetadata);
    uploadedFiles.set(groupId, groupFiles);

    return NextResponse.json(
      {
        success: true,
        fileId,
        name: file.name,
        url: fileUrl,
        message: 'File uploaded successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', success: false },
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

    const files = uploadedFiles.get(groupId) || [];
    return NextResponse.json({ success: true, files }, { status: 200 });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files', success: false },
      { status: 500 }
    );
  }
}
