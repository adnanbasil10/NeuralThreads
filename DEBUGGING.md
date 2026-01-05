# Debugging Guide

## How to Check Server Console for Backend Errors

### 1. Find the Server Console

The server console is the **terminal window** where you ran `npm run dev`. 

**To find it:**
- Look for a terminal/command prompt window
- It should show output like:
  ```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in X seconds
  ```

### 2. What to Look For

When you try to sign up, watch the server console for:

**Error Messages:**
- Red text or error indicators
- Messages starting with `Error:`, `Failed:`, `Signup error:`
- Stack traces (showing file paths and line numbers)

**Common Error Patterns:**
```
Signup error: [Error details]
Failed to parse request body: [details]
CSRF token validation failed
Database connection error
Prisma error: [details]
```

### 3. Real-Time Monitoring

**Steps:**
1. Keep the server console visible
2. Fill out the signup form
3. Click "Submit" or "Create Account"
4. **Immediately watch the server console** - errors appear instantly

### 4. Browser Console vs Server Console

**Browser Console (F12):**
- Shows **client-side** errors
- Network request details
- JavaScript errors in the browser

**Server Console (Terminal):**
- Shows **backend** errors
- API route execution errors
- Database errors
- Server-side validation errors

### 5. Example Error Output

**Good (No Errors):**
```
POST /api/auth/signup 201 in 234ms
```

**Bad (With Errors):**
```
Signup error: Error: Invalid CSRF token
    at validateCsrfToken (src/lib/security/csrf.ts:32:15)
    at POST (src/app/api/auth/signup/route.ts:61:11)
POST /api/auth/signup 500 in 12ms
```

### 6. If You Don't See the Server Console

**Option 1: Check if server is running**
```bash
# In a new terminal, check if port 3000 is in use
netstat -ano | findstr :3000
```

**Option 2: Restart the server**
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

**Option 3: Check for background processes**
- Look for Node.js processes in Task Manager (Windows) or Activity Monitor (Mac)
- The server might be running in the background

### 7. Enabling More Detailed Logging

The code now includes enhanced logging. You should see:
- Request details
- Error stack traces
- Response status codes
- Validation errors

### 8. Common Issues and Solutions

**Issue: "Cannot find server console"**
- Solution: The server might not be running. Start it with `npm run dev`

**Issue: "No errors shown but signup fails"**
- Solution: Check browser console (F12) for client-side errors
- Check network tab in browser DevTools to see the actual HTTP response

**Issue: "Errors appear but unclear"**
- Solution: Look for the first error in the stack trace - that's usually the root cause
- Check the file path and line number mentioned in the error

### 9. Quick Debug Checklist

When signup fails:
- [ ] Is the server running? (Check terminal)
- [ ] Are there errors in server console? (Watch terminal)
- [ ] Are there errors in browser console? (Press F12)
- [ ] What's the HTTP status code? (Check Network tab in browser)
- [ ] Is the response JSON or HTML? (Check Network tab)

### 10. Getting Help

When reporting errors, include:
1. **Server console output** (copy/paste the error)
2. **Browser console output** (copy/paste the error)
3. **Network request details** (from browser DevTools → Network tab)
4. **Steps to reproduce** (what you did before the error)









