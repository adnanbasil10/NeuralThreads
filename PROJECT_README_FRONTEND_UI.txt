================================================================================
NEURAL THREADS - COMPLETE PROJECT DOCUMENTATION
PART 2: FRONTEND UI & INTEGRATION
================================================================================

This document provides comprehensive frontend documentation, UI components,
state management, and how the frontend integrates with the backend APIs.
Use this to understand how to build UI that cooperates with the backend logic.

================================================================================
1. FRONTEND ARCHITECTURE
================================================================================

1.1 FRAMEWORK & STYLING
------------------------
- Framework: Next.js 15.2.4 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS 3.4.1
- Icons: Lucide React 0.555.0
- State Management: React Hooks (useState, useEffect, useContext)
- Data Fetching: Custom hooks (useFetch, useCsrfToken)
- Real-time: Socket.IO Client 4.8.1

1.2 PROJECT STRUCTURE
---------------------
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── customer/        # Customer dashboard pages
│   │   ├── designer/        # Designer dashboard pages
│   │   ├── tailor/          # Tailor dashboard pages
│   │   └── layout.tsx       # Dashboard layout with sidebar
│   │
│   ├── api/                 # API routes (backend)
│   └── page.tsx             # Landing page
│
├── components/
│   ├── auth/                # Authentication components
│   ├── chat/                # Chat components
│   │   ├── ChatList.tsx     # Chat conversation list
│   │   ├── ChatWindow.tsx   # Individual chat interface
│   │   ├── MessageBubble.tsx # Message display component
│   │   └── ConversationItem.tsx # Chat list item
│   │
│   ├── chatbot/             # AI chatbot components
│   │   └── ChatbotInterface.tsx
│   │
│   ├── layout/              # Layout components
│   │   ├── ResponsiveSidebar.tsx
│   │   ├── MobileBottomNav.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── Providers.tsx
│   │
│   └── ui/                  # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── FormInput.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       ├── EmptyState.tsx
│       ├── Toast.tsx
│       ├── PasswordStrengthMeter.tsx
│       ├── ImageUpload.tsx
│       └── ...
│
├── hooks/
│   ├── useFetch.ts          # Data fetching hook
│   ├── useCsrfToken.ts      # CSRF token management
│   └── ...
│
├── contexts/
│   ├── CsrfContext.tsx      # CSRF token context
│   └── ...
│
├── lib/
│   ├── socket/
│   │   └── client.ts        # Socket.IO client utilities
│   └── utils/
│       └── translation.tsx  # Multi-language support
│
└── types/
    └── index.ts             # TypeScript type definitions

================================================================================
2. AUTHENTICATION UI FLOW
================================================================================

2.1 LANDING PAGE → SIGNUP
--------------------------
File: src/app/page.tsx

Navigation:
  - "Get Started" button → /signup
  - "Sign In" link → /login

Components:
  - Navigation bar with language selector
  - Hero section with CTAs
  - Features section
  - Designer spotlight
  - Footer

2.2 SIGNUP SELECTION PAGE
--------------------------
File: src/app/(auth)/signup/page.tsx

UI Elements:
  - Three role cards: Customer, Designer, Tailor
  - Each card links to role-specific signup:
    * /signup/customer
    * /signup/designer
    * /signup/tailor
  - "Sign In" link at bottom

2.3 ROLE-SPECIFIC SIGNUP PAGES
------------------------------
Files:
  - src/app/(auth)/signup/customer/page.tsx
  - src/app/(auth)/signup/designer/page.tsx
  - src/app/(auth)/signup/tailor/page.tsx

Common Features:
  - Multi-step forms
  - Form validation
  - Password strength meter
  - CSRF token handling
  - Error display
  - Loading states

Customer Signup Steps:
  1. Personal Info (name, email, password, age, gender)
  2. Style Preferences (body shape, style preferences array)
  3. Location & Language
  4. Budget Range

Designer Signup Steps:
  1. Personal Info
  2. Professional Info (location, experience, niches, bio)
  3. Languages & Contact
  4. Profile Photo Upload

Tailor Signup Steps:
  1. Personal Info
  2. Location (with map coordinates)
  3. Skills & Experience
  4. Contact Info

API Integration:
  - POST /api/auth/signup
  - Headers: { 'x-csrf-token': csrfToken }
  - Body: Role-specific signup data
  - On Success: Redirect to /login
  - On Error: Display error message

2.4 LOGIN PAGE
--------------
File: src/app/(auth)/login/page.tsx

UI Elements:
  - Email input
  - Password input (show/hide toggle)
  - "Remember Me" checkbox (UI only, not functional)
  - "Sign In" button
  - "Forgot Password?" link (UI only)
  - "Sign Up" link → /signup

API Integration:
  - POST /api/auth/login
  - Headers: { 'x-csrf-token': csrfToken }
  - Body: { email, password }
  - On Success:
    * Cookies set automatically (auth_token, auth_refresh)
    * Extract user role from response
    * Redirect to role-based dashboard:
      - CUSTOMER → /customer
      - DESIGNER → /designer
      - TAILOR → /tailor
  - On Error: Display error message

================================================================================
3. DASHBOARD LAYOUT & NAVIGATION
================================================================================

3.1 DASHBOARD LAYOUT
--------------------
File: src/app/(dashboard)/layout.tsx

Components:
  - ResponsiveSidebar (desktop)
  - MobileBottomNav (mobile)
  - Hamburger menu button (mobile)
  - User profile section
  - Role-based menu items
  - Notifications badge

Sidebar Menu Items (Customer):
  - Browse Designs → /customer/designers
  - Find Tailors → /customer/tailors
  - My Alterations → /customer/alterations
  - My Chats → /customer/chats
  - AI Stylist → /customer/chatbot
  - My Wardrobe → /customer/wardrobe
  - Settings → /customer/settings

Sidebar Menu Items (Designer):
  - Dashboard → /designer
  - Portfolio → /designer/portfolio
  - Requests → /designer/requests
  - Chats → /designer/chats
  - Settings → /designer/settings

Sidebar Menu Items (Tailor):
  - Dashboard → /tailor
  - Requests → /tailor/requests
  - Sample Work → /tailor/sample-work
  - Chats → /tailor/chats
  - Settings → /tailor/settings

3.2 RESPONSIVE SIDEBAR
-----------------------
File: src/components/layout/ResponsiveSidebar.tsx

Features:
  - Desktop: Always visible (fixed left)
  - Mobile: Slide-in drawer (toggleable)
  - Hamburger menu button
  - Active route highlighting
  - User profile display
  - Logout button

State Management:
  - useSidebar() hook for open/close state
  - Context: SidebarProvider

3.3 MOBILE BOTTOM NAVIGATION
-----------------------------
File: src/components/layout/MobileBottomNav.tsx

Features:
  - Fixed bottom navigation (mobile only)
  - Icon-based navigation
  - Active route indicator
  - Badge for notifications/unread

================================================================================
4. CHAT SYSTEM UI
================================================================================

4.1 CHAT LIST PAGE
------------------
Files:
  - src/app/(dashboard)/customer/chats/page.tsx
  - src/app/(dashboard)/designer/chats/page.tsx
  - src/app/(dashboard)/tailor/chats/page.tsx

Component: src/components/chat/ChatList.tsx

UI Elements:
  - Header with "Messages" title and hamburger menu
  - Search bar (filter conversations)
  - Filter buttons: "Recent", "Unread First"
  - Chat list (ConversationItem components)
  - Empty state: "No conversations yet"

Features:
  - Real-time updates via Socket.IO
  - Unread message count badge
  - Last message preview
  - Online status indicator
  - Click to open chat

API Integration:
  - GET /api/chat?page=1&limit=20
  - Polling fallback (every 5 seconds if Socket.IO disconnected)
  - Auto-refresh on focus

State Management:
  - chats: Array<Chat>
  - searchQuery: string
  - filter: "recent" | "unread"
  - isLoading: boolean
  - error: string | null

4.2 INDIVIDUAL CHAT WINDOW
---------------------------
Files:
  - src/app/(dashboard)/customer/chats/[chatId]/page.tsx
  - src/app/(dashboard)/designer/chats/[chatId]/page.tsx
  - src/app/(dashboard)/tailor/chats/[chatId]/page.tsx

Component: src/components/chat/ChatWindow.tsx

UI Elements:
  - Chat header (other user's name, online status)
  - Message list (MessageBubble components)
  - Message input area
  - Send button
  - Image upload button
  - Typing indicator
  - Scroll to bottom button
  - Emoji reaction picker (on double-click)

Features:
  - Real-time message delivery (Socket.IO)
  - Message read receipts (double checkmark)
  - Typing indicators
  - Emoji reactions (double-click message)
  - Image sharing
  - Message grouping by date
  - Auto-scroll to bottom
  - Infinite scroll (pagination)

API Integration:
  - GET /api/chat/messages?chatId={chatId}&limit=50
  - POST /api/chat/messages (send message)
  - POST /api/chat/messages/[messageId]/read (mark as read)
  - POST /api/chat/messages/[messageId]/reactions (add/remove reaction)

Socket.IO Events:
  - 'receive-message': New message received
  - 'typing': Typing indicator update
  - 'message-read': Read receipt update
  - 'message-reaction': Reaction update

State Management:
  - messages: Array<Message>
  - messageReactions: Map<messageId, Array<Reaction>>
  - typingUsers: Set<string>
  - isLoading: boolean
  - isSending: boolean
  - error: string | null

4.3 MESSAGE BUBBLE COMPONENT
-----------------------------
File: src/components/chat/MessageBubble.tsx

Props:
  - message: Message object
  - isOwn: boolean
  - readAt?: Date
  - readBy?: string
  - reactions?: Array<Reaction>
  - onReaction?: (messageId: string, emoji: string) => void
  - onMarkRead?: (messageId: string) => void

UI Elements:
  - Message content (text or image)
  - Timestamp
  - Read receipt icon (single/double checkmark)
  - Reaction emojis (below message)
  - Emoji picker (on double-click)

Styling:
  - Own messages: Dark gradient (from-stone-700 via-stone-800 to-stone-900), white text
  - Other messages: Light background (bg-stone-100), dark text
  - Spacing: mb-2 between messages
  - Rounded corners, shadows

4.4 CHAT UI INTEGRATION WITH BACKEND
-------------------------------------

Message Sending Flow:
  1. User types message → Update input state
  2. User clicks send → POST /api/chat/messages
  3. API validates and saves to database
  4. API emits Socket.IO event 'receive-message'
  5. Socket.IO broadcasts to chat room
  6. All connected clients receive message
  7. UI updates message list

Read Receipt Flow:
  1. Message appears in viewport
  2. Auto-mark as read → POST /api/chat/messages/[id]/read
  3. API updates database (isRead, readAt, readBy)
  4. API emits Socket.IO event 'message-read'
  5. Other users see double checkmark

Reaction Flow:
  1. User double-clicks message
  2. Emoji picker appears
  3. User selects emoji → POST /api/chat/messages/[id]/reactions
  4. API toggles reaction (add if not exists, remove if exists)
  5. API emits Socket.IO event 'message-reaction'
  6. All users see updated reactions

Typing Indicator Flow:
  1. User types in input → Socket.IO emit 'typing' event
  2. Socket.IO broadcasts to chat room
  3. Other users see typing indicator
  4. Auto-clear after 3 seconds of no typing

================================================================================
5. DESIGNER & TAILOR BROWSING UI
================================================================================

5.1 BROWSE DESIGNERS PAGE
--------------------------
File: src/app/(dashboard)/customer/designers/page.tsx

UI Elements:
  - Search bar
  - Filter drawer (mobile) / Sidebar (desktop)
  - Designer cards grid
  - Pagination
  - Empty state
  - Loading skeleton

Filters:
  - Location dropdown
  - Design Niche checkboxes
  - Experience slider
  - Languages checkboxes
  - Rating slider
  - Search input

API Integration:
  - GET /api/designers?location=...&niche=...&experience=...&languages=...&rating=...&search=...&page=1&limit=20
  - Debounced search (300ms)
  - Filter state in URL query params

Designer Card Display:
  - Profile photo
  - Name
  - Location
  - Design niches
  - Rating (stars)
  - Review count
  - Experience years
  - "View Profile" button

5.2 DESIGNER PROFILE PAGE
--------------------------
File: src/app/(dashboard)/customer/designers/[id]/page.tsx

UI Elements:
  - Designer header (photo, name, location, rating)
  - Bio section
  - Portfolio grid (images)
  - Reviews section
  - "Start Conversation" button
  - "Save to Wardrobe" button (for portfolio items)

API Integration:
  - GET /api/designers/[id]
  - POST /api/chat (create chat)
  - POST /api/chatbot/wardrobe (save portfolio item)

5.3 FIND TAILORS PAGE
----------------------
File: src/app/(dashboard)/customer/tailors/page.tsx

UI Elements:
  - Location input (latitude/longitude)
  - Radius slider
  - Skills filter
  - Experience filter
  - Tailor cards grid
  - Distance display (if location provided)

API Integration:
  - GET /api/tailors?latitude=...&longitude=...&radius=...&skills=...&experience=...&page=1&limit=20
  - Uses PostGIS for distance calculation
  - Distance shown in kilometers

Tailor Card Display:
  - Profile photo
  - Name
  - Location
  - Distance (if location provided)
  - Skills list
  - Rating
  - "View Profile" button

================================================================================
6. PORTFOLIO & SAMPLE WORK UI
================================================================================

6.1 DESIGNER PORTFOLIO PAGE
----------------------------
File: src/app/(dashboard)/designer/portfolio/page.tsx

UI Elements:
  - "Add Portfolio Item" button
  - Portfolio grid (images)
  - Edit/Delete buttons (on hover)
  - Empty state

API Integration:
  - GET /api/designers/portfolio
  - POST /api/designers/portfolio
  - PUT /api/designers/portfolio/[id]
  - DELETE /api/designers/portfolio/[id]

Add Portfolio Item Flow:
  1. Click "Add Portfolio Item"
  2. Modal opens with form
  3. Upload image → POST /api/upload
  4. Get Cloudinary URL
  5. Submit form → POST /api/designers/portfolio
  6. Refresh portfolio list

6.2 TAILOR SAMPLE WORK PAGE
---------------------------
File: src/app/(dashboard)/tailor/sample-work/page.tsx

UI Elements:
  - "Add Sample Work" button
  - Sample work grid
  - Edit/Delete buttons

API Integration:
  - GET /api/tailors/sample-work
  - POST /api/tailors/sample-work
  - DELETE /api/tailors/sample-work/[id]

================================================================================
7. WARDROBE UI
================================================================================

7.1 WARDROBE PAGE
-----------------
File: src/app/(dashboard)/customer/wardrobe/page.tsx

UI Elements:
  - Wardrobe items grid
  - Category filter
  - Empty state with "Browse Designs" button
  - Delete button (on hover)

Features:
  - Only displays items saved from Browse Designs/Portfolio
  - No manual upload (removed)
  - Items organized by category

API Integration:
  - GET /api/chatbot/wardrobe
  - DELETE /api/chatbot/wardrobe (delete item)

Save to Wardrobe Flow (from Designer Portfolio):
  1. User views designer portfolio item
  2. Clicks "Save to Wardrobe"
  3. POST /api/chatbot/wardrobe
  4. Body: { imageUrl, category, subcategory, ... }
  5. Item added to wardrobe
  6. Success toast notification

================================================================================
8. AI CHATBOT UI
================================================================================

8.1 CHATBOT INTERFACE
---------------------
File: src/components/chatbot/ChatbotInterface.tsx

UI Elements:
  - Conversation list (sidebar)
  - Chat window
  - Message input
  - Image upload
  - Send button
  - Wardrobe context toggle

Features:
  - Multi-conversation support
  - Wardrobe context integration
  - Image sharing
  - Message history
  - Loading states

API Integration:
  - POST /api/chatbot (send message)
  - GET /api/chatbot/conversations
  - GET /api/chatbot/conversations/[id]/messages
  - GET /api/chatbot/wardrobe (for context)

Message Flow:
  1. User types message
  2. POST /api/chatbot with conversationId
  3. API processes with AI (or mock response)
  4. Response includes userMessage and assistantMessage
  5. UI displays both messages
  6. Conversation saved to database

================================================================================
9. ALTERATIONS & REQUESTS UI
================================================================================

9.1 CUSTOMER ALTERATIONS PAGE
------------------------------
File: src/app/(dashboard)/customer/alterations/page.tsx

UI Elements:
  - "Request Alteration" button
  - Alteration requests list
  - Status badges
  - Filter by status

API Integration:
  - GET /api/alterations?status=...
  - POST /api/alterations

Create Request Flow:
  1. Click "Request Alteration"
  2. Modal opens with form
  3. Select tailor
  4. Enter description
  5. Upload image (optional)
  6. Submit → POST /api/alterations
  7. Request created, notification sent to tailor

9.2 DESIGNER REQUESTS PAGE
---------------------------
File: src/app/(dashboard)/designer/requests/page.tsx

UI Elements:
  - Design requests list
  - Status filter
  - Accept/Reject buttons
  - Quote price input

API Integration:
  - GET /api/design-requests
  - PUT /api/design-requests/[id]

9.3 TAILOR REQUESTS PAGE
------------------------
File: src/app/(dashboard)/tailor/requests/page.tsx

UI Elements:
  - Alteration requests list
  - Status badges
  - Accept/Reject/Update Status buttons
  - Quote price input

API Integration:
  - GET /api/alterations
  - PUT /api/alterations/[id]

================================================================================
10. REUSABLE UI COMPONENTS
================================================================================

10.1 BUTTON COMPONENT
----------------------
File: src/components/ui/Button.tsx

Props:
  - variant: "primary" | "secondary" | "outline" | "ghost" | "danger"
  - size: "sm" | "md" | "lg"
  - disabled: boolean
  - loading: boolean
  - onClick: () => void
  - children: ReactNode

10.2 INPUT COMPONENT
--------------------
File: src/components/ui/Input.tsx

Props:
  - type: string
  - placeholder: string
  - value: string
  - onChange: (e: ChangeEvent) => void
  - error: string | null
  - disabled: boolean

10.3 LOADING SPINNER
--------------------
File: src/components/ui/LoadingSpinner.tsx

Usage:
  <LoadingSpinner size="sm" | "md" | "lg" />

10.4 ERROR MESSAGE
------------------
File: src/components/ui/ErrorMessage.tsx

Props:
  - message: string
  - onDismiss?: () => void

10.5 EMPTY STATE
----------------
File: src/components/ui/EmptyState.tsx

Props:
  - icon: ReactNode
  - title: string
  - description: string
  - action?: { label: string, onClick: () => void }

10.6 TOAST NOTIFICATION
------------------------
File: src/components/ui/Toast.tsx

Usage:
  const toast = useToast();
  toast.success("Message sent!");
  toast.error("Failed to send message");
  toast.info("Processing...");

10.7 PASSWORD STRENGTH METER
----------------------------
File: src/components/ui/PasswordStrengthMeter.tsx

Props:
  - password: string
  - onStrengthChange?: (strength: number) => void

Features:
  - Visual strength indicator (weak/medium/strong)
  - Requirements checklist
  - Real-time validation

10.8 IMAGE UPLOAD
-----------------
File: src/components/ui/ImageUpload.tsx

Props:
  - onUpload: (url: string) => void
  - maxSize: number (default: 10MB)
  - acceptedTypes: string[] (default: ["image/*"])

Features:
  - Drag & drop
  - File validation
  - Preview
  - Upload progress
  - Error handling

API Integration:
  - POST /api/upload
  - Returns Cloudinary URL
  - Calls onUpload callback with URL

================================================================================
11. CUSTOM HOOKS
================================================================================

11.1 useFetch HOOK
-------------------
File: src/hooks/useFetch.ts

Usage:
  const { data, loading, error, refetch } = useFetch<T>(
    '/api/endpoint',
    {
      method: 'POST',
      body: { ... },
      onSuccess: (data) => { ... },
      onError: (error) => { ... }
    }
  );

Features:
  - Automatic loading/error states
  - CSRF token injection
  - Caching
  - Refetch capability
  - Optimistic updates

11.2 useCsrfToken HOOK
-----------------------
File: src/hooks/useCsrfToken.ts

Usage:
  const { csrfToken, refreshCsrfToken, isFetchingCsrfToken } = useCsrfToken();

Features:
  - Automatic token fetching
  - Token refresh
  - Loading state
  - Error handling

API Integration:
  - GET /api/csrf-token
  - Token stored in HTTP-only cookie
  - Token returned in response

11.3 useSidebar HOOK
---------------------
File: src/contexts/SidebarContext.tsx (implied)

Usage:
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();

Features:
  - Sidebar open/close state
  - Toggle function
  - Responsive behavior

================================================================================
12. STATE MANAGEMENT PATTERNS
================================================================================

12.1 LOCAL STATE (useState)
----------------------------
Used for:
  - Form inputs
  - UI toggles (modals, dropdowns)
  - Loading states
  - Error messages
  - Pagination (page, limit)

12.2 SERVER STATE (useFetch)
----------------------------
Used for:
  - API data fetching
  - Automatic refetching
  - Caching
  - Optimistic updates

12.3 CONTEXT STATE
------------------
Used for:
  - CSRF token (CsrfContext)
  - Sidebar state (SidebarContext)
  - User authentication (implicit via cookies)

12.4 REAL-TIME STATE (Socket.IO)
----------------------------------
Used for:
  - Chat messages
  - Typing indicators
  - Online status
  - Read receipts
  - Message reactions

================================================================================
13. FORM HANDLING PATTERNS
================================================================================

13.1 FORM VALIDATION
---------------------
Client-side:
  - Required field checks
  - Email format validation
  - Password strength validation
  - Enum value validation
  - Array length validation

Server-side:
  - All client validations repeated
  - Additional security checks
  - Input sanitization
  - CSRF token validation

13.2 FORM SUBMISSION FLOW
--------------------------
1. User fills form
2. Client-side validation
3. Show validation errors if any
4. Fetch CSRF token (if not cached)
5. Submit form → POST /api/endpoint
6. Show loading state
7. Handle response:
   - Success: Show success message, redirect/refresh
   - Error: Display error message

13.3 ERROR DISPLAY
------------------
- Inline errors (below input fields)
- Toast notifications (for API errors)
- ErrorMessage component (for page-level errors)
- Console logging (development only)

================================================================================
14. REAL-TIME INTEGRATION (Socket.IO)
================================================================================

14.1 SOCKET CONNECTION
-----------------------
File: src/lib/socket/client.ts

Initialization:
  - getSocket(): Creates socket instance
  - connectSocket(userId, userName, role): Connects and registers
  - Auto-reconnection enabled
  - Connection state tracked

14.2 EVENT LISTENERS
--------------------
Setup in ChatWindow component:

  - onReceiveMessage((message) => {
      // Add message to state
      setMessages(prev => [...prev, message]);
    });

  - onTyping((data) => {
      // Update typing indicator
      setTypingUsers(prev => new Set([...prev, data.userId]));
    });

  - onMessageRead((data) => {
      // Update read receipt
      updateMessageReadStatus(data.messageId, data.readBy);
    });

  - onMessageReaction((data) => {
      // Update reactions
      updateMessageReactions(data.messageId, data.reaction);
    });

14.3 EVENT EMISSION
--------------------
Typing Indicator:
  socket.emit('typing', { chatId, userId, userName, isTyping: true });

Join Chat:
  socket.emit('join-chat', chatId);

Leave Chat:
  socket.emit('leave-chat', chatId);

14.4 FALLBACK POLLING
---------------------
If Socket.IO disconnected:
  - Poll GET /api/chat/messages every 5 seconds
  - Stop polling when socket reconnects
  - Show connection status indicator

================================================================================
15. MULTI-LANGUAGE SUPPORT
================================================================================

15.1 TRANSLATION SYSTEM
------------------------
File: src/lib/utils/translation.tsx

Languages Supported:
  - English (en)
  - Hindi (hi)
  - Kannada (kn)
  - Tamil (ta)
  - Telugu (te)

Translation Files:
  - public/locales/en.json
  - public/locales/hi.json
  - public/locales/kn.json
  - public/locales/ta.json
  - public/locales/te.json

Usage:
  const { t, currentLanguage, setLanguage } = useTranslation();
  <p>{t('common.welcome')}</p>

15.2 LANGUAGE SWITCHER
-----------------------
File: src/components/layout/LanguageSwitcher.tsx

Features:
  - Dropdown selector
  - Flag icons
  - Persistent preference (localStorage)
  - Updates all UI text

================================================================================
16. RESPONSIVE DESIGN PATTERNS
================================================================================

16.1 BREAKPOINTS
----------------
Tailwind CSS breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

16.2 MOBILE-FIRST APPROACH
---------------------------
- Base styles for mobile
- lg: prefix for desktop styles
- Hidden/shown based on screen size:
  - lg:hidden (mobile only)
  - hidden lg:block (desktop only)

16.3 RESPONSIVE COMPONENTS
---------------------------
- Sidebar: Desktop (always visible) / Mobile (drawer)
- Navigation: Desktop (sidebar) / Mobile (bottom nav)
- Grids: 1 column (mobile) → 2-3 columns (desktop)
- Forms: Full width (mobile) → Centered with max-width (desktop)

================================================================================
17. ERROR HANDLING PATTERNS
================================================================================

17.1 API ERROR HANDLING
-----------------------
try {
  const response = await fetch('/api/endpoint', { ... });
  const data = await response.json();
  
  if (!response.ok) {
    if (data.error) {
      setError(data.error);
    } else {
      setError('An error occurred');
    }
    return;
  }
  
  // Handle success
} catch (error) {
  setError('Network error. Please try again.');
}

17.2 VALIDATION ERROR DISPLAY
------------------------------
- Field-level errors: Below input field
- Form-level errors: Top of form
- API errors: Toast notification or error banner

17.3 NETWORK ERROR HANDLING
---------------------------
- Retry mechanism for failed requests
- Offline detection
- Connection status indicator
- Graceful degradation (polling fallback)

================================================================================
18. PERFORMANCE OPTIMIZATIONS
================================================================================

18.1 CODE SPLITTING
-------------------
- Dynamic imports for heavy components
- Lazy loading for routes
- Image optimization (Next.js Image component)

18.2 MEMOIZATION
----------------
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers

18.3 DEBOUNCING
---------------
- Search input: 300ms
- Typing indicator: 1 second
- Reaction fetches: 500ms

18.4 POLLING OPTIMIZATION
--------------------------
- Only poll when Socket.IO disconnected
- Stop polling on component unmount
- Increase interval if no updates

================================================================================
19. UI/UX BEST PRACTICES
================================================================================

19.1 LOADING STATES
-------------------
- Skeleton loaders for content
- Spinner for buttons
- Progress indicators for uploads
- Disable buttons during submission

19.2 EMPTY STATES
-----------------
- Helpful messages
- Action buttons (e.g., "Browse Designs")
- Illustrations/icons
- Clear call-to-action

19.3 FEEDBACK
-------------
- Success toasts
- Error messages
- Validation feedback
- Confirmation dialogs (for destructive actions)

19.4 ACCESSIBILITY
-------------------
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

================================================================================
20. INTEGRATION CHECKLIST
================================================================================

When building UI that integrates with backend:

✅ Authentication:
  - Fetch CSRF token before POST requests
  - Include x-csrf-token header
  - Handle 401 errors (redirect to login)
  - Handle 403 errors (CSRF invalid, refresh token)

✅ API Calls:
  - Use correct HTTP method (GET/POST/PUT/DELETE)
  - Include required headers
  - Validate request body format
  - Handle response format
  - Display loading states
  - Handle errors gracefully

✅ Real-time Features:
  - Initialize Socket.IO connection
  - Join appropriate rooms
  - Listen for events
  - Update UI on events
  - Handle disconnection
  - Implement polling fallback

✅ Form Handling:
  - Client-side validation
  - CSRF token inclusion
  - Error display
  - Success feedback
  - Loading states
  - Disable during submission

✅ State Management:
  - Use appropriate state type (local/server/context)
  - Avoid unnecessary re-renders
  - Memoize expensive computations
  - Clean up on unmount

✅ Error Handling:
  - Network errors
  - Validation errors
  - API errors
  - User-friendly messages
  - Retry mechanisms

================================================================================
END OF PART 2: FRONTEND UI & INTEGRATION
================================================================================

