================================================================================
NEURAL THREADS - COGNITIVE COUTURE PLATFORM
================================================================================

Where Creativity Meets Craftsmanship

Neural Threads is a comprehensive fashion platform that connects customers with 
elite designers and master tailors. Built with cutting-edge technology, it 
provides a seamless experience for discovering fashion, creating custom designs, 
managing alterations, and getting AI-powered style recommendations.

================================================================================
PROJECT OVERVIEW
================================================================================

Neural Threads is a full-stack web application that serves as a marketplace 
and collaboration platform for the fashion industry. It enables:

- Customers to discover designers, find tailors, get personalized style advice, 
  and manage their wardrobe
- Designers to showcase their portfolio, connect with customers, and manage 
  design requests
- Tailors to display their work, receive alteration requests, and communicate 
  with customers

The platform combines traditional craftsmanship with modern technology, 
featuring real-time chat, AI-powered styling, location-based tailor discovery, 
and a comprehensive wardrobe management system.

================================================================================
KEY FEATURES
================================================================================

MULTI-ROLE PLATFORM
- Customer Dashboard: Browse designers, find tailors, manage wardrobe, chat 
  with professionals
- Designer Dashboard: Portfolio management, design requests, customer 
  communication
- Tailor Dashboard: Sample work gallery, alteration requests, customer 
  management

REAL-TIME COMMUNICATION
- Instant messaging between customers, designers, and tailors
- Typing indicators and read receipts
- Message reactions (emoji)
- Online/offline status
- Socket.IO-powered real-time updates

AI-POWERED STYLIST
- Personalized fashion recommendations
- Wardrobe analysis and suggestions
- Style advice based on preferences
- Multi-conversation support

LOCATION-BASED SERVICES
- Find tailors near you using PostGIS
- Distance-based filtering and sorting
- Map integration ready

PORTFOLIO & GALLERY
- Designers can showcase their work
- Tailors can display sample work
- Customers can save favorite designs to wardrobe
- Image upload and management via Cloudinary

MULTI-LANGUAGE SUPPORT
- English, Hindi, Kannada, Tamil, Telugu
- Language preference saved per user
- Full UI translation

ENTERPRISE-GRADE SECURITY
- JWT-based authentication
- CSRF protection
- Rate limiting
- Input validation and sanitization
- Password strength requirements
- Secure file uploads

================================================================================
TECH STACK
================================================================================

FRONTEND
- Framework: Next.js 15.2.4 (App Router)
- Language: TypeScript 5
- Styling: Tailwind CSS 3.4.1
- Icons: Lucide React
- State Management: React Hooks + Context API
- Real-time: Socket.IO Client 4.8.1

BACKEND
- Runtime: Node.js
- Framework: Next.js API Routes
- Database: PostgreSQL (Supabase)
- ORM: Prisma 6.19.0
- Authentication: JWT (jsonwebtoken)
- Real-time Server: Socket.IO 4.8.1
- File Storage: Cloudinary 2.8.0

SECURITY & VALIDATION
- Password Hashing: bcryptjs
- Rate Limiting: express-rate-limit
- Input Validation: validator
- Input Sanitization: DOMPurify
- Spatial Queries: PostGIS

================================================================================
PROJECT STRUCTURE
================================================================================

neural_threads/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│
├── server/
│   └── socket.js              # Socket.IO server
│
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   └── page.tsx           # Landing page
│   │
│   ├── components/            # React components
│   │   ├── chat/              # Chat components
│   │   ├── chatbot/           # AI chatbot
│   │   ├── layout/            # Layout components
│   │   └── ui/                # Reusable UI components
│   │
│   ├── lib/                   # Utilities
│   │   ├── auth/              # Authentication
│   │   ├── db/                # Database
│   │   ├── security/          # Security utilities
│   │   └── socket/            # Socket.IO utilities
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React contexts
│   └── types/                 # TypeScript types
│
└── public/                    # Static assets

================================================================================
GETTING STARTED
================================================================================

PREREQUISITES
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Cloudinary account (for image uploads)
- Environment variables configured

INSTALLATION

1. Clone the repository
   git clone <repository-url>
   cd neural_threads

2. Install dependencies
   npm install

3. Set up environment variables
   Create a .env.local file:
   
   DATABASE_URL="postgresql://user:password@host:port/database"
   JWT_SECRET="your-secret-key"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   SOCKET_PORT=3001
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

4. Set up the database
   # Generate Prisma client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # (Optional) Seed database
   npm run db:seed

5. Start the development servers
   # Terminal 1: Next.js dev server
   npm run dev
   
   # Terminal 2: Socket.IO server
   npm run socket

6. Open your browser
   Navigate to http://localhost:3000

================================================================================
USAGE
================================================================================

FOR CUSTOMERS

1. Sign Up → Choose "Customer" role
2. Complete Profile → Add style preferences, body shape, budget
3. Browse Designers → Filter by location, niche, experience, rating
4. Find Tailors → Search by location and skills
5. Start Conversations → Chat with designers and tailors
6. Save to Wardrobe → Save favorite designs
7. Get AI Style Advice → Chat with AI stylist

FOR DESIGNERS

1. Sign Up → Choose "Designer" role
2. Complete Profile → Add experience, niches, bio, languages
3. Upload Portfolio → Showcase your designs
4. Manage Requests → Accept/reject design requests
5. Chat with Customers → Communicate about projects

FOR TAILORS

1. Sign Up → Choose "Tailor" role
2. Complete Profile → Add location, skills, experience
3. Upload Sample Work → Showcase your craftsmanship
4. Manage Requests → Accept/reject alteration requests
5. Chat with Customers → Discuss alteration details

================================================================================
DOCUMENTATION
================================================================================

For detailed documentation, see:

- PROJECT_README_BACKEND_API.txt - Complete API reference, database schema, 
  authentication flows
- PROJECT_README_FRONTEND_UI.txt - UI components, state management, integration 
  patterns
- LANDING_PAGE_COMPLETE_DOCUMENTATION.txt - Landing page features and flows
- CUSTOMER_DASHBOARD_COMPLETE_DOCUMENTATION.txt - Customer features and 
  workflows

================================================================================
AVAILABLE SCRIPTS
================================================================================

Development:
  npm run dev              # Start Next.js dev server
  npm run dev:network      # Start dev server on network
  npm run socket           # Start Socket.IO server

Database:
  npm run db:generate      # Generate Prisma client
  npm run db:push          # Push schema to database
  npm run db:migrate       # Run migrations
  npm run db:studio        # Open Prisma Studio
  npm run db:seed          # Seed database

Production:
  npm run build            # Build for production
  npm run start            # Start production server

Code Quality:
  npm run lint             # Run ESLint
  npm run lint:fix         # Fix linting issues
  npm run type-check       # TypeScript type checking

================================================================================
AUTHENTICATION & SECURITY
================================================================================

AUTHENTICATION FLOW

1. User signs up → Account created
2. User logs in → JWT tokens set in HTTP-only cookies
3. Protected routes verify token via middleware
4. Token refresh available for extended sessions

SECURITY FEATURES

- JWT Tokens: Secure, HTTP-only cookies
- CSRF Protection: All POST/PUT/DELETE requests protected
- Rate Limiting: Prevents abuse on sensitive endpoints
- Input Validation: Client and server-side validation
- Input Sanitization: XSS and injection prevention
- Password Security: Bcrypt hashing, strength requirements

================================================================================
API ENDPOINTS
================================================================================

AUTHENTICATION
- POST /api/auth/signup - Create account
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user
- POST /api/auth/refresh - Refresh token

CHAT
- GET /api/chat - Get conversations
- POST /api/chat - Create conversation
- GET /api/chat/messages - Get messages
- POST /api/chat/messages - Send message
- POST /api/chat/messages/[id]/read - Mark as read
- POST /api/chat/messages/[id]/reactions - Add reaction

DESIGNERS
- GET /api/designers - List designers (with filters)
- GET /api/designers/[id] - Get designer details
- GET /api/designers/portfolio - Get portfolio
- POST /api/designers/portfolio - Add portfolio item

TAILORS
- GET /api/tailors - List tailors (location-based)
- GET /api/tailors/[id] - Get tailor details
- GET /api/tailors/sample-work - Get sample work
- POST /api/tailors/sample-work - Add sample work

OTHER
- POST /api/chatbot - AI chatbot
- GET /api/chatbot/wardrobe - Get wardrobe
- POST /api/chatbot/wardrobe - Add wardrobe item
- POST /api/upload - Upload file
- GET /api/alterations - Get alteration requests
- POST /api/alterations - Create alteration request

See PROJECT_README_BACKEND_API.txt for complete API reference.

================================================================================
DATABASE SCHEMA
================================================================================

The application uses PostgreSQL with Prisma ORM. Key models:

- User: Core user accounts (customers, designers, tailors)
- Customer: Customer-specific profile data
- Designer: Designer profile and portfolio
- Tailor: Tailor profile and sample work
- Chat: Conversation threads
- Message: Chat messages with read receipts and reactions
- PortfolioItem: Designer portfolio items
- SampleWork: Tailor sample work
- AlterationRequest: Alteration requests
- DesignRequest: Design requests
- WardrobeItem: Customer wardrobe items
- Review: Reviews and ratings
- Notification: User notifications

See PROJECT_README_BACKEND_API.txt for complete schema details.

================================================================================
REAL-TIME FEATURES
================================================================================

The platform uses Socket.IO for real-time communication:

- Chat Messages: Instant message delivery
- Typing Indicators: Show when someone is typing
- Read Receipts: Double checkmark when message is read
- Message Reactions: Real-time emoji reactions
- Online Status: See who's online/offline

Socket.IO server runs on port 3001 (configurable).

================================================================================
UI/UX FEATURES
================================================================================

- Responsive Design: Mobile-first, works on all devices
- Dark/Light Theme: Consistent color scheme
- Loading States: Skeleton loaders and spinners
- Error Handling: User-friendly error messages
- Empty States: Helpful messages with actions
- Toast Notifications: Success/error feedback
- Form Validation: Real-time validation feedback
- Accessibility: Semantic HTML, ARIA labels, keyboard navigation

================================================================================
DEPLOYMENT
================================================================================

ENVIRONMENT SETUP

1. Set up PostgreSQL database (Supabase recommended)
2. Configure Cloudinary account
3. Set environment variables
4. Run database migrations
5. Build and deploy

PRODUCTION CONSIDERATIONS

- Use HTTPS for secure cookies
- Set secure JWT secret
- Configure CORS properly
- Set up monitoring and logging
- Use connection pooling for database
- Enable rate limiting
- Set up CDN for static assets

================================================================================
CONTRIBUTING
================================================================================

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

================================================================================
LICENSE
================================================================================

[Add your license here]

================================================================================
TEAM
================================================================================

Neural Threads - Cognitive Couture Platform

================================================================================
SUPPORT
================================================================================

For issues, questions, or contributions, please open an issue on the repository.

================================================================================
ROADMAP
================================================================================

- [ ] Email verification
- [ ] Password reset flow
- [ ] Social login (OAuth)
- [ ] Payment integration
- [ ] Advanced search filters
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Admin panel

================================================================================

Built with ❤️ using Next.js, TypeScript, and PostgreSQL

================================================================================

