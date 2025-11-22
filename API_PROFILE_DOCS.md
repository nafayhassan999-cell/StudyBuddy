# Profile API Documentation

## Endpoint: `/api/profile`

A Next.js API route for managing user profile data with full CRUD operations.

---

## Methods

### 1. GET - Retrieve Profile

**URL**: `GET /api/profile?userId=default`

**Query Parameters**:
- `userId` (optional): User identifier (defaults to "default")

**Response** (200):
```json
{
  "success": true,
  "data": {
    "subjects": ["Math", "Physics", "Computer Science"],
    "goal": "Ace exams",
    "studyHours": 3,
    "preferredTime": "evening",
    "bio": "Passionate about STEM subjects and looking for study buddies!"
  }
}
```

**Example**:
```javascript
const response = await fetch('/api/profile?userId=user123');
const data = await response.json();
console.log(data.data.subjects);
```

---

### 2. POST - Create/Update Profile

**URL**: `POST /api/profile`

**Body**:
```json
{
  "userId": "user123",
  "subjects": ["Math", "Chemistry"],
  "goal": "Get straight A's",
  "studyHours": 5,
  "preferredTime": "morning",
  "bio": "Love learning new things!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "user123",
    "subjects": ["Math", "Chemistry"],
    "goal": "Get straight A's",
    "studyHours": 5,
    "preferredTime": "morning",
    "bio": "Love learning new things!",
    "updatedAt": "2025-11-11T19:35:00.000Z"
  }
}
```

**Example**:
```javascript
const response = await fetch('/api/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    subjects: ['Math', 'Chemistry'],
    goal: 'Get straight A\'s'
  })
});
const data = await response.json();
```

---

### 3. PUT - Partial Update

**URL**: `PUT /api/profile`

**Body**:
```json
{
  "userId": "user123",
  "goal": "Master calculus"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated profile */ }
}
```

---

### 4. DELETE - Remove Profile

**URL**: `DELETE /api/profile?userId=user123`

**Response** (200):
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Request body is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Profile not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to fetch profile data",
  "message": "Detailed error message"
}
```

---

## CORS Headers

The API includes CORS headers for development:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## Features

✅ Full CRUD operations (GET, POST, PUT, DELETE)
✅ Error handling with try-catch blocks
✅ 500 status codes on failures
✅ CORS headers for cross-origin requests
✅ Input validation
✅ Mock in-memory database
✅ Timestamps on updates

---

## Testing

### Using Fetch API
```javascript
// GET Profile
fetch('/api/profile')
  .then(res => res.json())
  .then(data => console.log(data));

// POST Profile
fetch('/api/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subjects: ['Biology', 'English'],
    goal: 'Improve grades'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Using curl
```bash
# GET
curl http://localhost:3000/api/profile

# POST
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"subjects":["Math"],"goal":"Pass finals"}'

# DELETE
curl -X DELETE http://localhost:3000/api/profile?userId=user123
```

---

## Production Notes

⚠️ **Current Implementation**: Uses in-memory storage (data lost on server restart)

**For Production**:
- Replace `mockProfiles` with a real database (MongoDB, PostgreSQL, etc.)
- Add authentication middleware
- Implement rate limiting
- Add input sanitization
- Use environment-specific CORS origins
- Add logging and monitoring
