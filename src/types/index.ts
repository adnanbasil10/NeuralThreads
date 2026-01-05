// Neural Threads - TypeScript Types
// Auto-generated types that mirror Prisma schema

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DESIGNER = 'DESIGNER',
  TAILOR = 'TAILOR',
}

export enum Location {
  MG_ROAD = 'MG_ROAD',
  COMMERCIAL_STREET = 'COMMERCIAL_STREET',
}

export enum BodyShape {
  RECTANGLE = 'RECTANGLE',
  PEAR = 'PEAR',
  HOURGLASS = 'HOURGLASS',
  APPLE = 'APPLE',
  INVERTED_TRIANGLE = 'INVERTED_TRIANGLE',
}

export enum Language {
  ENGLISH = 'ENGLISH',
  HINDI = 'HINDI',
  KANNADA = 'KANNADA',
  TAMIL = 'TAMIL',
  TELUGU = 'TELUGU',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum DesignNiche {
  BRIDAL = 'BRIDAL',
  CASUAL = 'CASUAL',
  FUSION = 'FUSION',
  ETHNIC = 'ETHNIC',
  WESTERN = 'WESTERN',
  FORMAL = 'FORMAL',
  SPORTSWEAR = 'SPORTSWEAR',
}

export enum WardrobeCategory {
  UPPERWEAR = 'UPPERWEAR',
  BOTTOMWEAR = 'BOTTOMWEAR',
  SHOES = 'SHOES',
  BAG = 'BAG',
  JACKET = 'JACKET',
  ACCESSORIES = 'ACCESSORIES',
  DRESS = 'DRESS',
  OUTERWEAR = 'OUTERWEAR',
}

export enum AlterationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PortfolioCategory {
  BRIDAL = 'BRIDAL',
  CASUAL = 'CASUAL',
  FUSION = 'FUSION',
  ETHNIC = 'ETHNIC',
  WESTERN = 'WESTERN',
  FORMAL = 'FORMAL',
  CUSTOM = 'CUSTOM',
}

// ============================================
// MODEL TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  age?: number | null;
  isEmailVerified: boolean;
  emailVerifyToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer | null;
  designer?: Designer | null;
  tailor?: Tailor | null;
}

export interface Customer {
  id: string;
  userId: string;
  user?: User;
  gender?: Gender | null;
  location?: Location | null;
  stylePreferences: string[];
  bodyShape?: BodyShape | null;
  languagePreference: Language;
  budgetMin?: number | null;
  budgetMax?: number | null;
  createdAt: Date;
  updatedAt: Date;
  chats?: Chat[];
  alterationRequests?: AlterationRequest[];
  wardrobeItems?: WardrobeItem[];
}

export interface Designer {
  id: string;
  userId: string;
  user?: User;
  location?: string | null;
  yearsExperience?: number | null;
  designNiches: DesignNiche[];
  bio?: string | null;
  languages: Language[];
  profilePhoto?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  portfolioItems?: PortfolioItem[];
  chats?: Chat[];
}

export interface Tailor {
  id: string;
  userId: string;
  user?: User;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  skills: string[];
  yearsExperience?: number | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  sampleWorks?: SampleWork[];
  alterationRequests?: AlterationRequest[];
}

export interface PortfolioItem {
  id: string;
  designerId: string;
  designer?: Designer;
  imageUrl: string;
  description?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  category?: PortfolioCategory | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SampleWork {
  id: string;
  tailorId: string;
  tailor?: Tailor;
  imageUrl: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  customerId: string;
  customer?: Customer;
  designerId: string;
  designer?: Designer;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  chat?: Chat;
  senderId: string;
  sender?: User;
  content: string;
  imageUrl?: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface AlterationRequest {
  id: string;
  customerId: string;
  customer?: Customer;
  tailorId: string;
  tailor?: Tailor;
  description: string;
  imageUrl?: string | null;
  status: AlterationStatus;
  quotedPrice?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WardrobeItem {
  id: string;
  customerId: string;
  customer?: Customer;
  imageUrl: string;
  category: WardrobeCategory;
  color?: string | null;
  brand?: string | null;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}


// ============================================
// SESSION & AUTH TYPES
// ============================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  age?: number;
}

export interface CustomerSignupData extends SignupData {
  role: UserRole.CUSTOMER;
  gender?: Gender;
  location?: Location;
  stylePreferences?: string[];
  bodyShape?: BodyShape;
  languagePreference?: Language;
  budgetMin?: number;
  budgetMax?: number;
}

export interface DesignerSignupData extends SignupData {
  role: UserRole.DESIGNER;
  location?: string;
  yearsExperience?: number;
  designNiches?: DesignNiche[];
  bio?: string;
  languages?: Language[];
  contactPhone?: string;
  contactEmail?: string;
}

export interface TailorSignupData extends SignupData {
  role: UserRole.TAILOR;
  location?: string;
  latitude?: number;
  longitude?: number;
  skills?: string[];
  yearsExperience?: number;
  contactPhone?: string;
  contactEmail?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface DesignerFilters {
  location?: string;
  designNiches?: DesignNiche[];
  minExperience?: number;
  maxExperience?: number;
  minRating?: number;
  languages?: Language[];
}

export interface TailorFilters {
  location?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  minRating?: number;
  nearbyRadius?: number; // in km
  latitude?: number;
  longitude?: number;
}

export interface ProductFilters {
  category?: PortfolioCategory;
  minBudget?: number;
  maxBudget?: number;
  designerId?: string;
}

// ============================================
// CHAT & MESSAGING TYPES
// ============================================

export interface SendMessageData {
  chatId: string;
  content: string;
  imageUrl?: string;
}

export interface CreateChatData {
  designerId: string;
}

export interface ChatWithLastMessage extends Chat {
  lastMessage?: Message;
  unreadCount: number;
}

// ============================================
// VIRTUAL TRY-ON TYPES
// ============================================

export interface CreateTryOnData {
  outfitImageUrl: string;
  bodyShape?: BodyShape;
}

export interface TryOnResult {
  id: string;
  resultImageUrl: string;
  createdAt: Date;
}
