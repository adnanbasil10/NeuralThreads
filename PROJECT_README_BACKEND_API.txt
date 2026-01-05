================================================================================
NEURAL THREADS - COMPLETE PROJECT DOCUMENTATION
PART 1: BACKEND API & DATABASE
================================================================================

This document provides comprehensive backend API documentation, database schema,
authentication flows, and server-side logic for the Neural Threads platform.
Use this to understand how the backend works and how to integrate with it.

================================================================================
1. PROJECT OVERVIEW
================================================================================

Neural Threads is a full-stack fashion platform connecting Customers, Designers,
and Tailors. Built with Next.js 15 (App Router), TypeScript, PostgreSQL, Prisma,
and Socket.IO for real-time features.

Tech Stack:
- Framework: Next.js 15.2.4 (App Router)
- Language: TypeScript 5
- Database: PostgreSQL (Supabase)
- ORM: Prisma 6.19.0
- Authentication: JWT (jsonwebtoken)
- Real-time: Socket.IO 4.8.1
- File Storage: Cloudinary 2.8.0
- Security: bcryptjs, express-rate-limit, CSRF protection
- Validation: validator 13.15.23

================================================================================
2. PROJECT STRUCTURE
================================================================================

neural_threads/
├── prisma/
│   ├── schema.prisma          # Database schema (all models, enums, relations)
│   ├── migrations/            # Database migration files
│   └── seed.ts                # Database seeding script
│
├── server/
│   └── socket.js              # Standalone Socket.IO server (port 3001)
│
├── src/
│   ├── app/
│   │   ├── api/               # API Routes (Next.js App Router)
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── chat/          # Chat endpoints
│   │   │   ├── chatbot/       # AI chatbot endpoints
│   │   │   ├── designers/     # Designer endpoints
│   │   │   ├── tailors/       # Tailor endpoints
│   │   │   ├── alterations/   # Alteration request endpoints
│   │   │   ├── upload/        # File upload endpoints
│   │   │   └── users/         # User management endpoints
│   │   │
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── page.tsx           # Landing page
│   │
│   ├── lib/
│   │   ├── auth/              # Authentication utilities
│   │   │   ├── jwt.ts         # JWT token management
│   │   │   ├── jwt-edge.ts    # Edge-compatible JWT verification
│   │   │   └── password.ts    # Password hashing/verification
│   │   │
│   │   ├── db/
│   │   │   └── prisma.ts      # Prisma client instance
│   │   │
│   │   ├── security/
│   │   │   ├── csrf.ts        # CSRF token validation
│   │   │   ├── rate-limit.ts  # Rate limiting configuration
│   │   │   ├── sanitizer.ts   # Input sanitization
│   │   │   └── validation.ts  # Input validation
│   │   │
│   │   ├── socket/
│   │   │   ├── client.ts      # Socket.IO client utilities
│   │   │   └── server.ts      # Socket.IO server integration
│   │   │
│   │   └── utils/             # Utility functions
│   │
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/             # React contexts
│   └── types/                # TypeScript type definitions
│
├── public/                    # Static assets
├── .env.local                 # Environment variables (not in git)
└── package.json              # Dependencies and scripts

================================================================================
3. DATABASE SCHEMA (Prisma)
================================================================================

3.1 ENUMS
---------

UserRole: CUSTOMER | DESIGNER | TAILOR
Location: MG_ROAD | COMMERCIAL_STREET
Gender: MALE | FEMALE | OTHER
BodyShape: RECTANGLE | PEAR | HOURGLASS | APPLE | INVERTED_TRIANGLE
Language: ENGLISH | HINDI | KANNADA | TAMIL | TELUGU
DesignNiche: BRIDAL | CASUAL | FUSION | ETHNIC | WESTERN | FORMAL | SPORTSWEAR
WardrobeCategory: UPPERWEAR | BOTTOMWEAR | SHOES | BAG | JACKET | ACCESSORIES | DRESS | OUTERWEAR
AlterationStatus: PENDING | ACCEPTED | IN_PROGRESS | COMPLETED | REJECTED | CANCELLED
PortfolioCategory: BRIDAL | CASUAL | FUSION | ETHNIC | WESTERN | FORMAL | CUSTOM
NotificationType: MESSAGE | CHAT_REQUEST | REVIEW | PROFILE_VIEW | ORDER_UPDATE

3.2 CORE MODELS
---------------

User
  - id: String (cuid)
  - email: String (unique)
  - password: String (hashed)
  - name: String
  - role: UserRole
  - age: Int?
  - isEmailVerified: Boolean (default: false)
  - emailVerifyToken: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer? (one-to-one)
    - designer: Designer? (one-to-one)
    - tailor: Tailor? (one-to-one)
    - sentMessages: Message[]
    - notifications: Notification[]
    - messageReactions: MessageReaction[]
  Indexes: [email], [role]

Customer
  - id: String (cuid)
  - userId: String (unique, foreign key → User.id)
  - gender: Gender?
  - location: Location?
  - stylePreferences: String[] (array)
  - bodyShape: BodyShape?
  - languagePreference: Language (default: ENGLISH)
  - budgetMin: Float?
  - budgetMax: Float?
  Relations:
    - user: User (one-to-one)
    - chats: Chat[]
    - alterationRequests: AlterationRequest[]
    - designRequests: DesignRequest[]
    - wardrobeItems: WardrobeItem[]
    - reviews: Review[]
    - chatbotConversations: ChatbotConversation[]
  Indexes: [userId], [location]

Designer
  - id: String (cuid)
  - userId: String (unique, foreign key → User.id)
  - location: String?
  - yearsExperience: Int?
  - designNiches: DesignNiche[] (array)
  - bio: String? (Text)
  - languages: Language[] (array)
  - profilePhoto: String?
  - contactPhone: String?
  - contactEmail: String?
  - rating: Float (default: 0)
  - reviewCount: Int (default: 0)
  - profileViews: Int (default: 0)
  Relations:
    - user: User (one-to-one)
    - portfolioItems: PortfolioItem[]
    - chats: Chat[]
    - designRequests: DesignRequest[]
    - reviews: Review[]
  Indexes: [userId], [location]

Tailor
  - id: String (cuid)
  - userId: String (unique, foreign key → User.id)
  - location: String?
  - latitude: Float?
  - longitude: Float?
  - locationPoint: Geography(Point, 4326)? (PostGIS for distance queries)
  - skills: String[] (array)
  - yearsExperience: Int?
  - profilePhoto: String?
  - contactPhone: String?
  - contactEmail: String?
  - rating: Float (default: 0)
  - reviewCount: Int (default: 0)
  Relations:
    - user: User (one-to-one)
    - sampleWorks: SampleWork[]
    - alterationRequests: AlterationRequest[]
    - reviews: Review[]
    - chats: Chat[]
  Indexes: [userId], [location], [latitude, longitude]

3.3 FEATURE MODELS
-----------------

Chat
  - id: String (cuid)
  - customerId: String (foreign key → Customer.id)
  - designerId: String? (foreign key → Designer.id)
  - tailorId: String? (foreign key → Tailor.id)
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer
    - designer: Designer?
    - tailor: Tailor?
    - messages: Message[]
  Constraints:
    - Unique: [customerId, designerId]
    - Unique: [customerId, tailorId]
  Indexes: [customerId], [designerId], [tailorId], [updatedAt]

Message
  - id: String (cuid)
  - chatId: String (foreign key → Chat.id)
  - senderId: String (foreign key → User.id)
  - content: String (Text)
  - imageUrl: String?
  - isRead: Boolean (default: false)
  - readAt: DateTime?
  - readBy: String? (User ID who read the message)
  - createdAt: DateTime
  Relations:
    - chat: Chat
    - sender: User
    - reactions: MessageReaction[]
  Indexes: [chatId], [senderId], [createdAt], [chatId, isRead, senderId], [chatId, createdAt], [readBy]

MessageReaction
  - id: String (cuid)
  - messageId: String (foreign key → Message.id)
  - userId: String (foreign key → User.id)
  - emoji: String (emoji character)
  - createdAt: DateTime
  Relations:
    - message: Message
    - user: User
  Constraints:
    - Unique: [messageId, userId, emoji]
  Indexes: [messageId], [userId]

PortfolioItem
  - id: String (cuid)
  - designerId: String (foreign key → Designer.id)
  - imageUrl: String
  - description: String? (Text)
  - budgetMin: Float?
  - budgetMax: Float?
  - category: PortfolioCategory?
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - designer: Designer
  Indexes: [designerId], [category]

SampleWork
  - id: String (cuid)
  - tailorId: String (foreign key → Tailor.id)
  - imageUrl: String
  - description: String? (Text)
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - tailor: Tailor
  Indexes: [tailorId]

AlterationRequest
  - id: String (cuid)
  - customerId: String (foreign key → Customer.id)
  - tailorId: String (foreign key → Tailor.id)
  - description: String (Text)
  - imageUrl: String?
  - status: AlterationStatus (default: PENDING)
  - quotedPrice: Float?
  - notes: String? (Text)
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer
    - tailor: Tailor
  Indexes: [customerId], [tailorId], [status]

DesignRequest
  - id: String (cuid)
  - customerId: String (foreign key → Customer.id)
  - designerId: String (foreign key → Designer.id)
  - description: String (Text)
  - imageUrl: String?
  - referenceImageUrl: String?
  - status: AlterationStatus (default: PENDING)
  - quotedPrice: Float?
  - notes: String? (Text)
  - chatId: String? (link to chat conversation)
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer
    - designer: Designer
  Indexes: [customerId], [designerId], [status]

WardrobeItem
  - id: String (cuid)
  - customerId: String (foreign key → Customer.id)
  - imageUrl: String
  - category: WardrobeCategory
  - subcategory: PortfolioCategory?
  - color: String?
  - brand: String?
  - name: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer
  Indexes: [customerId], [category], [subcategory]

Review
  - id: String (cuid)
  - customerId: String (foreign key → Customer.id)
  - designerId: String? (foreign key → Designer.id)
  - tailorId: String? (foreign key → Tailor.id)
  - rating: Int (1-5 stars)
  - comment: String? (Text)
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer
    - designer: Designer?
    - tailor: Tailor?
  Constraints:
    - Unique: [customerId, designerId]
    - Unique: [customerId, tailorId]
  Indexes: [customerId], [designerId], [tailorId]

Notification
  - id: String (cuid)
  - userId: String (foreign key → User.id)
  - type: NotificationType
  - title: String
  - message: String (Text)
  - link: String? (URL)
  - isRead: Boolean (default: false)
  - createdAt: DateTime
  Relations:
    - user: User
  Indexes: [userId], [isRead], [createdAt]

ChatbotConversation
  - id: String (cuid)
  - customerId: String (foreign key → Customer.id)
  - title: String?
  - createdAt: DateTime
  - updatedAt: DateTime
  Relations:
    - customer: Customer
    - messages: ChatbotMessage[]
  Indexes: [customerId], [createdAt]

ChatbotMessage
  - id: String (cuid)
  - conversationId: String (foreign key → ChatbotConversation.id)
  - role: String ('user' | 'assistant')
  - content: String (Text)
  - imageUrl: String?
  - isMock: Boolean (default: false)
  - createdAt: DateTime
  Relations:
    - conversation: ChatbotConversation
  Indexes: [conversationId], [createdAt]

================================================================================
4. AUTHENTICATION SYSTEM
================================================================================

4.1 JWT TOKEN STRUCTURE
-----------------------
Access Token (auth_token cookie):
  - Payload: { userId, email, role, name, tokenType: 'access' }
  - Expiry: 7 days (configurable via JWT_ACCESS_EXPIRY)
  - Cookie: HTTP-only, secure (production), sameSite: 'lax', path: '/'

Refresh Token (auth_refresh cookie):
  - Payload: { userId, email, role, name, tokenType: 'refresh' }
  - Expiry: 30 days (configurable via JWT_REFRESH_EXPIRY)
  - Cookie: HTTP-only, secure (production), sameSite: 'strict', path: '/'

4.2 AUTHENTICATION FLOW
-----------------------
1. User submits login form → POST /api/auth/login
2. Server validates credentials → Database query
3. Server generates JWT tokens → signToken(), signRefreshToken()
4. Server sets cookies → setAuthCookie(), setRefreshCookie()
5. Client receives response → Redirects to role-based dashboard
6. Middleware verifies token → verifyTokenEdge() on protected routes
7. Token refresh → POST /api/auth/refresh (when access token expires)

4.3 MIDDLEWARE PROTECTION
-------------------------
Protected Routes: /customer/*, /designer/*, /tailor/*
Auth Routes: /login, /signup

Middleware Logic:
  1. Extract token from 'auth_token' cookie
  2. Verify token using verifyTokenEdge()
  3. If protected route + no token → Redirect to /login?redirect={pathname}
  4. If auth route + token exists → Redirect to role-based dashboard
  5. If wrong role on protected route → Redirect to correct dashboard
  6. Set no-cache headers for protected/auth routes

4.4 CSRF PROTECTION
-------------------
- All POST/PUT/DELETE requests require CSRF token
- Token stored in HTTP-only cookie (csrf_token)
- Token sent in x-csrf-token header
- Token validation: validateCsrfToken() in API routes
- Token refresh: GET /api/csrf-token

4.5 RATE LIMITING
-----------------
Login: 5 attempts per 15 minutes (loginLimiter)
Signup: Prevents mass account creation (signupLimiter)
Chat: 300 requests per 15 minutes (chatLimiter)
Wardrobe: 150 requests per 15 minutes (wardrobeLimiter)
General API: 200 requests per 15 minutes (apiLimiter)

================================================================================
5. API ENDPOINTS - AUTHENTICATION
================================================================================

5.1 POST /api/auth/signup
-------------------------
Purpose: Create new user account
Authentication: None (public)
CSRF: Required (x-csrf-token header)
Rate Limit: signupLimiter

Request Body (Customer):
{
  email: string (validated, sanitized)
  password: string (min 8 chars, uppercase, lowercase, number, special char)
  name: string (validated, sanitized)
  role: "CUSTOMER"
  age?: number
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY"
  location?: "MG_ROAD" | "COMMERCIAL_STREET"
  languagePreference?: "ENGLISH" | "HINDI" | "KANNADA" | "TAMIL" | "TELUGU"
  bodyShape?: "RECTANGLE" | "PEAR" | "HOURGLASS" | "APPLE" | "INVERTED_TRIANGLE"
  stylePreferences?: string[] (max 20 items)
  budgetMin?: number
  budgetMax?: number
}

Request Body (Designer):
{
  email: string
  password: string
  name: string
  role: "DESIGNER"
  designerLocation?: string
  yearsExperience?: number
  designNiches?: ("BRIDAL" | "CASUAL" | "FUSION" | "ETHNIC" | "WESTERN" | "FORMAL" | "SPORTSWEAR")[]
  bio?: string
  languages?: ("ENGLISH" | "HINDI" | "KANNADA" | "TAMIL" | "TELUGU")[]
  contactPhone?: string (validated)
  contactEmail?: string (validated)
  profilePhoto?: string (Cloudinary URL)
}

Request Body (Tailor):
{
  email: string
  password: string
  name: string
  role: "TAILOR"
  tailorLocation?: string
  latitude?: number
  longitude?: number
  yearsExperience?: number
  skills?: string[]
  contactPhone?: string
  contactEmail?: string
}

Response Success (200):
{
  success: true
  data: {
    user: {
      id: string
      email: string
      name: string
      role: "CUSTOMER" | "DESIGNER" | "TAILOR"
      isEmailVerified: boolean
    }
    profile: Customer | Designer | Tailor
  }
}

Response Error (400/403/429/500):
{
  success: false
  error: string
  code?: string
}

5.2 POST /api/auth/login
------------------------
Purpose: Authenticate user and create session
Authentication: None (public)
CSRF: Required (x-csrf-token header)
Rate Limit: loginLimiter (5 attempts/15min)

Request Body:
{
  email: string (normalized to lowercase, trimmed)
  password: string
}

Response Success (200):
{
  success: true
  message: "Login successful"
  data: {
    user: {
      id: string
      email: string
      name: string
      role: "CUSTOMER" | "DESIGNER" | "TAILOR"
      age?: number
      isEmailVerified: boolean
      profile: Customer | Designer | Tailor
    }
    redirectTo: "/customer" | "/designer" | "/tailor"
  }
}
Cookies Set: auth_token, auth_refresh

Response Error (400/401/403/429/500):
{
  success: false
  error: string
  code?: string
}

5.3 POST /api/auth/logout
-------------------------
Purpose: End user session
Authentication: Optional
CSRF: Not required

Response Success (200):
{
  success: true
  message: "Logged out successfully"
}
Cookies Cleared: auth_token, auth_refresh

5.4 POST /api/auth/refresh
--------------------------
Purpose: Refresh access token using refresh token
Authentication: Refresh token in cookie
CSRF: Not required

Response Success (200):
{
  success: true
  data: {
    token: string (new access token)
  }
}
Cookie Updated: auth_token

Response Error (401/500):
{
  success: false
  error: string
}

5.5 GET /api/auth/me
--------------------
Purpose: Get current authenticated user data
Authentication: Required (JWT token in cookie)
CSRF: Not required

Response Success (200):
{
  success: true
  data: {
    user: {
      id: string
      email: string
      name: string
      role: "CUSTOMER" | "DESIGNER" | "TAILOR"
      age?: number
      isEmailVerified: boolean
      createdAt: string
      customer?: Customer
      designer?: Designer
      tailor?: Tailor
    }
  }
}

Response Error (401/500):
{
  success: false
  error: string
}

5.6 GET /api/csrf-token
-----------------------
Purpose: Get CSRF token for form submissions
Authentication: None (public)
CSRF: Not required

Response Success (200):
{
  success: true
  token: string
}
Cookie Set: csrf_token (HTTP-only, secure, sameSite: 'lax')

================================================================================
6. API ENDPOINTS - CHAT
================================================================================

6.1 GET /api/chat
-----------------
Purpose: Get user's chat conversations
Authentication: Required
CSRF: Not required (GET request)

Query Parameters:
  - page?: number (default: 1)
  - limit?: number (default: 20)

Response Success (200):
{
  success: true
  data: {
    chats: Array<{
      id: string
      customerId: string
      designerId?: string
      tailorId?: string
      lastMessage?: {
        id: string
        content: string
        senderId: string
        createdAt: string
      }
      unreadCount: number
      otherUser: {
        id: string
        name: string
        role: "CUSTOMER" | "DESIGNER" | "TAILOR"
        profilePhoto?: string
      }
      updatedAt: string
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

6.2 POST /api/chat
------------------
Purpose: Create new chat conversation
Authentication: Required
CSRF: Required

Request Body:
{
  designerId?: string (if chatting with designer)
  tailorId?: string (if chatting with tailor)
}

Response Success (200):
{
  success: true
  data: {
    chat: {
      id: string
      customerId: string
      designerId?: string
      tailorId?: string
      createdAt: string
    }
  }
}

6.3 GET /api/chat/messages
---------------------------
Purpose: Get messages for a chat
Authentication: Required
CSRF: Not required (GET request)

Query Parameters:
  - chatId: string (required)
  - cursor?: string (for pagination)
  - limit?: number (default: 50, max: 100)

Response Success (200):
{
  success: true
  data: {
    messages: Array<{
      id: string
      chatId: string
      senderId: string
      senderName: string
      content: string
      imageUrl?: string
      isRead: boolean
      readAt?: string
      readBy?: string
      createdAt: string
      reactions?: Array<{
        id: string
        emoji: string
        userId: string
        userName?: string
      }>
    }>
    nextCursor?: string (for pagination)
    hasMore: boolean
  }
}

6.4 POST /api/chat/messages
----------------------------
Purpose: Send a message
Authentication: Required
CSRF: Required
Rate Limit: chatLimiter (300 requests/15min)

Request Body:
{
  chatId: string
  content: string (required, sanitized)
  imageUrl?: string
}

Response Success (200):
{
  success: true
  data: {
    message: {
      id: string
      chatId: string
      senderId: string
      senderName: string
      content: string
      imageUrl?: string
      isRead: boolean
      createdAt: string
    }
  }
}
Socket Event: 'receive-message' emitted to chat room

6.5 POST /api/chat/messages/[messageId]/read
---------------------------------------------
Purpose: Mark message as read
Authentication: Required
CSRF: Required
Rate Limit: chatLimiter

Response Success (200):
{
  success: true
  data: {
    message: {
      id: string
      isRead: boolean
      readAt: string
      readBy: string
    }
  }
}
Socket Event: 'message-read' emitted to chat room

6.6 POST /api/chat/messages/[messageId]/reactions
--------------------------------------------------
Purpose: Add/remove emoji reaction to message
Authentication: Required
CSRF: Required
Rate Limit: chatLimiter

Request Body:
{
  emoji: string (emoji character, e.g., "👍", "❤️", "😂")
}

Response Success (200):
{
  success: true
  data: {
    reaction?: {
      id: string
      emoji: string
      userId: string
      createdAt: string
    }
    removed: boolean (true if reaction was removed)
  }
}
Socket Event: 'message-reaction' emitted to chat room

================================================================================
7. API ENDPOINTS - DESIGNERS
================================================================================

7.1 GET /api/designers
----------------------
Purpose: List designers with filters
Authentication: Optional (public endpoint)
CSRF: Not required

Query Parameters:
  - location?: string
  - niche?: "BRIDAL" | "CASUAL" | "FUSION" | "ETHNIC" | "WESTERN" | "FORMAL" | "SPORTSWEAR"
  - experience?: number (minimum years)
  - languages?: string[] (comma-separated or array)
  - rating?: number (minimum rating)
  - search?: string (search in name, bio)
  - page?: number (default: 1)
  - limit?: number (default: 20)

Response Success (200):
{
  success: true
  data: {
    designers: Array<{
      id: string
      userId: string
      name: string
      location?: string
      yearsExperience?: number
      designNiches: string[]
      bio?: string
      languages: string[]
      profilePhoto?: string
      contactPhone?: string
      contactEmail?: string
      rating: number
      reviewCount: number
      profileViews: number
      portfolioCount: number
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

7.2 GET /api/designers/[id]
----------------------------
Purpose: Get designer details
Authentication: Optional
CSRF: Not required

Response Success (200):
{
  success: true
  data: {
    designer: {
      id: string
      userId: string
      name: string
      location?: string
      yearsExperience?: number
      designNiches: string[]
      bio?: string
      languages: string[]
      profilePhoto?: string
      contactPhone?: string
      contactEmail?: string
      rating: number
      reviewCount: number
      profileViews: number
      portfolioItems: Array<{
        id: string
        imageUrl: string
        description?: string
        budgetMin?: number
        budgetMax?: number
        category?: string
      }>
    }
  }
}

7.3 GET /api/designers/portfolio
---------------------------------
Purpose: Get designer's portfolio items
Authentication: Required (designer only)
CSRF: Not required

Response Success (200):
{
  success: true
  data: {
    portfolioItems: Array<{
      id: string
      imageUrl: string
      description?: string
      budgetMin?: number
      budgetMax?: number
      category?: string
      createdAt: string
    }>
  }
}

7.4 POST /api/designers/portfolio
----------------------------------
Purpose: Add portfolio item
Authentication: Required (designer only)
CSRF: Required

Request Body:
{
  imageUrl: string (Cloudinary URL)
  description?: string
  budgetMin?: number
  budgetMax?: number
  category?: "BRIDAL" | "CASUAL" | "FUSION" | "ETHNIC" | "WESTERN" | "FORMAL" | "CUSTOM"
}

Response Success (200):
{
  success: true
  data: {
    portfolioItem: {
      id: string
      imageUrl: string
      description?: string
      budgetMin?: number
      budgetMax?: number
      category?: string
      createdAt: string
    }
  }
}

7.5 PUT /api/designers/portfolio/[id]
--------------------------------------
Purpose: Update portfolio item
Authentication: Required (designer only, owner)
CSRF: Required

Request Body: (same as POST, all fields optional)

7.6 DELETE /api/designers/portfolio/[id]
-----------------------------------------
Purpose: Delete portfolio item
Authentication: Required (designer only, owner)
CSRF: Required

Response Success (200):
{
  success: true
  message: "Portfolio item deleted"
}

================================================================================
8. API ENDPOINTS - TAILORS
================================================================================

8.1 GET /api/tailors
--------------------
Purpose: List tailors with location-based filtering
Authentication: Optional (public endpoint)
CSRF: Not required

Query Parameters:
  - latitude?: number (required for distance filtering)
  - longitude?: number (required for distance filtering)
  - radius?: number (kilometers, default: 50)
  - skills?: string[] (comma-separated or array)
  - experience?: number (minimum years)
  - search?: string
  - page?: number (default: 1)
  - limit?: number (default: 20)

Response Success (200):
{
  success: true
  data: {
    tailors: Array<{
      id: string
      userId: string
      name: string
      location?: string
      latitude?: number
      longitude?: number
      distance?: number (kilometers, if lat/lng provided)
      skills: string[]
      yearsExperience?: number
      profilePhoto?: string
      contactPhone?: string
      contactEmail?: string
      rating: number
      reviewCount: number
    }>
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

Note: Uses PostGIS ST_DWithin for efficient distance filtering when lat/lng provided.

8.2 GET /api/tailors/[id]
--------------------------
Purpose: Get tailor details
Authentication: Optional
CSRF: Not required

Response Success (200):
{
  success: true
  data: {
    tailor: {
      id: string
      userId: string
      name: string
      location?: string
      latitude?: number
      longitude?: number
      skills: string[]
      yearsExperience?: number
      profilePhoto?: string
      contactPhone?: string
      contactEmail?: string
      rating: number
      reviewCount: number
      sampleWorks: Array<{
        id: string
        imageUrl: string
        description?: string
      }>
    }
  }
}

8.3 GET /api/tailors/sample-work
---------------------------------
Purpose: Get tailor's sample work
Authentication: Required (tailor only)
CSRF: Not required

8.4 POST /api/tailors/sample-work
----------------------------------
Purpose: Add sample work
Authentication: Required (tailor only)
CSRF: Required

Request Body:
{
  imageUrl: string (Cloudinary URL)
  description?: string
}

8.5 DELETE /api/tailors/sample-work/[id]
-----------------------------------------
Purpose: Delete sample work
Authentication: Required (tailor only, owner)
CSRF: Required

================================================================================
9. API ENDPOINTS - ALTERATIONS & REQUESTS
================================================================================

9.1 GET /api/alterations
-------------------------
Purpose: Get alteration requests
Authentication: Required
CSRF: Not required

Query Parameters:
  - status?: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED"
  - page?: number
  - limit?: number

Response (Customer):
  Returns requests created by customer

Response (Tailor):
  Returns requests assigned to tailor

9.2 POST /api/alterations
--------------------------
Purpose: Create alteration request
Authentication: Required (customer only)
CSRF: Required

Request Body:
{
  tailorId: string
  description: string (required, sanitized)
  imageUrl?: string
}

Response Success (200):
{
  success: true
  data: {
    request: {
      id: string
      customerId: string
      tailorId: string
      description: string
      imageUrl?: string
      status: "PENDING"
      createdAt: string
    }
  }
}
Notification: Created for tailor

9.3 PUT /api/alterations/[id]
------------------------------
Purpose: Update alteration request status
Authentication: Required (tailor only, assigned tailor)
CSRF: Required

Request Body:
{
  status?: "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED"
  quotedPrice?: number
  notes?: string
}

9.4 GET /api/design-requests
-----------------------------
Purpose: Get design requests
Authentication: Required
CSRF: Not required

9.5 POST /api/design-requests
------------------------------
Purpose: Create design request
Authentication: Required (customer only)
CSRF: Required

Request Body:
{
  designerId: string
  description: string
  imageUrl?: string
  referenceImageUrl?: string
}

================================================================================
10. API ENDPOINTS - WARDROBE & CHATBOT
================================================================================

10.1 GET /api/chatbot/wardrobe
-------------------------------
Purpose: Get customer's wardrobe items
Authentication: Required (customer only)
CSRF: Not required

Response Success (200):
{
  success: true
  data: {
    wardrobeItems: Array<{
      id: string
      imageUrl: string
      category: "UPPERWEAR" | "BOTTOMWEAR" | "SHOES" | "BAG" | "JACKET" | "ACCESSORIES" | "DRESS" | "OUTERWEAR"
      subcategory?: string
      color?: string
      brand?: string
      name?: string
      createdAt: string
    }>
  }
}

10.2 POST /api/chatbot/wardrobe
--------------------------------
Purpose: Add wardrobe item (saved from Browse Designs/Portfolio)
Authentication: Required (customer only)
CSRF: Required
Rate Limit: wardrobeLimiter (150 requests/15min)

Request Body:
{
  imageUrl: string (required, Cloudinary URL)
  category: "UPPERWEAR" | "BOTTOMWEAR" | "SHOES" | "BAG" | "JACKET" | "ACCESSORIES" | "DRESS" | "OUTERWEAR"
  subcategory?: string
  color?: string
  brand?: string
  name?: string
}

10.3 DELETE /api/chatbot/wardrobe
----------------------------------
Purpose: Delete wardrobe item
Authentication: Required (customer only, owner)
CSRF: Required
Rate Limit: wardrobeLimiter

10.4 POST /api/chatbot
----------------------
Purpose: Send message to AI chatbot
Authentication: Required (customer only)
CSRF: Required

Request Body:
{
  conversationId?: string (create new if not provided)
  message: string
  imageUrl?: string
}

Response Success (200):
{
  success: true
  data: {
    conversationId: string
    userMessage: {
      id: string
      role: "user"
      content: string
      createdAt: string
    }
    assistantMessage: {
      id: string
      role: "assistant"
      content: string
      isMock: boolean
      createdAt: string
    }
  }
}

10.5 GET /api/chatbot/conversations
------------------------------------
Purpose: Get chatbot conversations
Authentication: Required (customer only)
CSRF: Not required

10.6 GET /api/chatbot/conversations/[id]/messages
-------------------------------------------------
Purpose: Get messages for conversation
Authentication: Required (customer only, owner)
CSRF: Not required

================================================================================
11. API ENDPOINTS - FILE UPLOAD
================================================================================

11.1 POST /api/upload
---------------------
Purpose: Upload file to Cloudinary
Authentication: Required
CSRF: Required

Request: multipart/form-data
  - file: File (image, max size: 10MB)
  - folder?: string (Cloudinary folder)

Response Success (200):
{
  success: true
  data: {
    publicId: string
    url: string (Cloudinary URL)
    secureUrl: string
    width: number
    height: number
    format: string
    bytes: number
  }
}

11.2 DELETE /api/upload/[publicId]
----------------------------------
Purpose: Delete file from Cloudinary
Authentication: Required
CSRF: Required

Response Success (200):
{
  success: true
  message: "File deleted"
}

================================================================================
12. API ENDPOINTS - USER MANAGEMENT
================================================================================

12.1 GET /api/users/profile
----------------------------
Purpose: Get user profile
Authentication: Required
CSRF: Not required

12.2 PUT /api/users/profile
-----------------------------
Purpose: Update user profile
Authentication: Required
CSRF: Required

Request Body: (role-specific fields)

12.3 PUT /api/users/password
-----------------------------
Purpose: Change password
Authentication: Required
CSRF: Required

Request Body:
{
  currentPassword: string
  newPassword: string (validated)
}

12.4 DELETE /api/users/account
-------------------------------
Purpose: Delete user account
Authentication: Required
CSRF: Required

Response Success (200):
{
  success: true
  message: "Account deleted"
}
Cookies Cleared: auth_token, auth_refresh

================================================================================
13. SOCKET.IO REAL-TIME COMMUNICATION
================================================================================

13.1 SOCKET SERVER
------------------
File: server/socket.js
Port: 3001 (configurable via SOCKET_PORT)
Run: npm run socket

Events:
  - 'join' / 'register': User joins (userId, userName, role)
  - 'disconnect': User disconnects
  - 'typing': Typing indicator (chatId, userId, userName, isTyping)
  - 'user-online' / 'userOnline': User comes online
  - 'user-offline' / 'userOffline': User goes offline

Rooms:
  - `user:${userId}`: User-specific room
  - `chat:${chatId}`: Chat room for messages

HTTP Endpoint: POST /emit
  Body: { chatId, event, message }
  Purpose: Allow API routes to emit socket events

13.2 SOCKET CLIENT
------------------
File: src/lib/socket/client.ts

Functions:
  - getSocket(): Get or create socket instance
  - connectSocket(userId, userName, role): Connect and register user
  - disconnectSocket(): Disconnect socket
  - sendMessage(chatId, content, imageUrl?): Send message (deprecated, use API)
  - joinChat(chatId): Join chat room
  - leaveChat(chatId): Leave chat room
  - onReceiveMessage(callback): Listen for new messages
  - onTyping(callback): Listen for typing indicators
  - onMessageRead(callback): Listen for read receipts
  - onMessageReaction(callback): Listen for message reactions
  - markMessagesAsRead(chatId, messageIds): Mark messages as read
  - sendReaction(messageId, emoji): Add/remove reaction

Socket Events (Client → Server):
  - 'join': Join user room
  - 'register': Register user
  - 'typing': Send typing indicator
  - 'join-chat': Join chat room
  - 'leave-chat': Leave chat room

Socket Events (Server → Client):
  - 'receive-message': New message received
  - 'typing': Typing indicator update
  - 'message-read': Message read receipt
  - 'message-reaction': Message reaction update
  - 'user-online': User came online
  - 'user-offline': User went offline

================================================================================
14. ENVIRONMENT VARIABLES
================================================================================

Required:
  DATABASE_URL: PostgreSQL connection string
  JWT_SECRET: Secret key for JWT tokens
  CLOUDINARY_CLOUD_NAME: Cloudinary cloud name
  CLOUDINARY_API_KEY: Cloudinary API key
  CLOUDINARY_API_SECRET: Cloudinary API secret

Optional:
  JWT_ACCESS_EXPIRY: Access token expiry (default: "7d")
  JWT_REFRESH_EXPIRY: Refresh token expiry (default: "30d")
  SOCKET_PORT: Socket.IO server port (default: 3001)
  NEXT_PUBLIC_SOCKET_URL: Socket.IO client URL (default: "http://localhost:3001")
  NEXTAUTH_URL: Base URL for auth callbacks (default: "http://localhost:3000")
  NODE_ENV: "development" | "production"

================================================================================
15. DATABASE CONNECTION & MIGRATIONS
================================================================================

15.1 PRISMA SETUP
-----------------
Connection: PostgreSQL (Supabase)
Connection Pooling: Enabled (PgBouncer compatible)
Location: src/lib/db/prisma.ts

15.2 MIGRATIONS
---------------
Generate Migration: npm run db:migrate
Apply Migrations: npm run db:migrate:prod
Reset Database: npm run db:reset
View Database: npm run db:studio

15.3 POSTGIS SETUP
------------------
PostGIS extension required for tailor distance queries
Migration: prisma/migrations/add_postgis_to_tailor.sql
  - Enables PostGIS extension
  - Adds locationPoint geography column
  - Creates spatial GIST index

================================================================================
16. SECURITY FEATURES
================================================================================

16.1 INPUT VALIDATION
---------------------
- Email: validator.isEmail()
- Password: Min 8 chars, uppercase, lowercase, number, special char
- Name: Alphanumeric + spaces, max length
- Phone: Valid phone format
- Enum values: Validated against Prisma enum types
- Arrays: Max length validation

16.2 INPUT SANITIZATION
------------------------
- HTML: DOMPurify.sanitize()
- Strings: sanitizeString() (removes dangerous characters)
- Arrays: sanitizeArray()
- SQL Injection: Prevented by Prisma parameterized queries

16.3 CSRF PROTECTION
--------------------
- Token in HTTP-only cookie
- Token in x-csrf-token header
- Validation on all POST/PUT/DELETE requests
- Token refresh endpoint

16.4 RATE LIMITING
------------------
- Express-rate-limit middleware
- Per-endpoint limits
- Retry-After header on 429 responses
- IP-based tracking

16.5 PASSWORD SECURITY
----------------------
- Bcrypt hashing (10 rounds)
- Password strength validation
- Common password rejection
- No password in API responses

16.6 JWT SECURITY
-----------------
- HTTP-only cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite: 'lax' (access), 'strict' (refresh)
- Token expiration
- Refresh token mechanism

================================================================================
17. ERROR HANDLING
================================================================================

17.1 ERROR RESPONSE FORMAT
--------------------------
{
  success: false
  error: string (user-friendly message)
  code?: string (error code for debugging)
  details?: any (development only)
}

17.2 HTTP STATUS CODES
----------------------
200: Success
400: Bad Request (validation error)
401: Unauthorized (authentication required)
403: Forbidden (CSRF invalid, insufficient permissions)
404: Not Found
429: Too Many Requests (rate limit exceeded)
500: Internal Server Error

17.3 ERROR LOGGING
------------------
- Console.error() for server errors
- Detailed error messages in development
- Sanitized error messages in production
- Database error handling with user-friendly messages

================================================================================
END OF PART 1: BACKEND API & DATABASE
================================================================================

