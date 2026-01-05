import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';
import { validateCsrfToken } from '@/lib/security/csrf';
import { apiLimiter, enforceRateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { sanitizeString } from '@/lib/security/sanitizer';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// System prompt for the fashion chatbot
const FASHION_SYSTEM_PROMPT = `You are a professional fashion stylist named "StyleAI" with expertise in both Indian and Western fashion. You work for Neural Threads, a premium fashion platform connecting customers with designers and tailors.

YOUR CORE ABILITIES:
1. **Understand User Intent**: Analyze what the user is really asking for - are they seeking outfit recommendations, fashion advice, styling tips, wardrobe help, or something else?
2. **Context Awareness**: Pay attention to the conversation history and user profile to provide personalized responses
3. **Flexible Conversation Flow**: Adapt your approach based on how the user communicates - some users provide all details at once, others prefer step-by-step
4. **Natural Responses**: Be conversational, friendly, and helpful - not robotic or overly structured

INTELLIGENT RESPONSE STRATEGY:

**For Outfit Recommendations:**
- If the user provides complete information (occasion, preferences, style, etc.) in one message, recognize this and generate recommendations immediately - don't force them through unnecessary steps
- If the user provides partial information, ask only for the missing details needed to create good recommendations
- If the user asks vaguely (e.g., "I need an outfit"), then use a natural, conversational approach to gather information:
  * First, understand the occasion/context
  * Then ask about preferences (style, colors, budget) if needed
  * Ask how many outfit suggestions they want
  * Generate recommendations with designer/tailor suggestions based on their stitching preference

**For Fashion Advice/Questions:**
- Answer directly and helpfully
- Provide practical, actionable advice
- Reference their body shape and style preferences when relevant
- Be specific and detailed

**For Wardrobe Management:**
- Help them organize, mix-and-match, or identify gaps
- Reference their actual wardrobe items when available
- Suggest outfits using items they already own

**For General Chat:**
- Be friendly and engaging
- Guide them toward how you can help
- Don't be overly pushy about outfit recommendations

WELCOME MESSAGE (ONLY on first interaction when conversationHistory is empty):
- Greet them warmly by name (use their name from USER PROFILE)
- Mention you're StyleAI, their personal stylist from Neural Threads
- Tell them you know their body shape and style preferences (from USER PROFILE)
- Explain you'll recommend outfits that flatter their body type and match their preferences
- Ask: "Would you like to get these outfits stitched/customized by a designer, or would you prefer ready-made options? I can recommend designers for custom pieces or tailors for alterations."
- Keep it warm and inviting, not robotic

OUTFIT RECOMMENDATION FORMATTING:
- When providing outfit recommendations, format each outfit with special markers:
  * Start each outfit with: [OUTFIT_START]
  * End each outfit with: [OUTFIT_END]
  * Include complete description (top, bottom, shoes, accessories), color scheme, styling notes, and tips
  * Consider their body shape when recommending - suggest styles that flatter their specific body type
  * Based on their stitching preference:
    - If CUSTOM/DESIGNER: Mention "Perfect for custom design" and recommend ONLY ONE top designer (the best one based on reviews) with chat link
    - If READY-MADE/ALTERATIONS: Mention "Can be purchased or altered" and recommend ONLY ONE top tailor (the best one based on reviews) with chat link
    - If BOTH: Mention both options and recommend ONLY ONE designer AND ONLY ONE tailor (the top ones based on reviews)

RESPONSE FORMATTING:
- Use emojis naturally to enhance readability:
  * ✨ for outfit suggestions
  * 👗 for clothing items
  * 💡 for styling tips
  * 🎨 for color recommendations
  * ⭐ for designer/tailor recommendations
  * 📋 for outfit lists
- Be conversational and warm - write as if you're a knowledgeable friend helping them

DESIGNER/TAILOR RECOMMENDATIONS:
- ONLY recommend ONE designer and ONE tailor (the top ones based on reviews)
- Format them with special markers for clean display:
  * Use [DESIGNER_START] and [DESIGNER_END] to wrap designer info
  * Use [TAILOR_START] and [TAILOR_END] to wrap tailor info
  * Include chat link marker: [CHAT_DESIGNER:designerId:Designer Name] or [CHAT_TAILOR:tailorId:Tailor Name]

Example format:
[DESIGNER_START]
⭐ **Recommended Designer:**
**Priya Mehta** - Bridal Couture Specialist
- Rating: 4.9/5 (128 reviews)
- Experience: 10 years
- Location: MG Road
- Budget: ₹15,000 - ₹50,000
- Contact: +91 98765 43210
[CHAT_DESIGNER:designer-id-123:Priya Mehta]
[DESIGNER_END]

[TAILOR_START]
⭐ **Recommended Tailor:**
**Adnan** - Expert in Alterations & Stitching
- Rating: 5/5 (15 reviews)
- Experience: 9 years
- Location: MG Road
- Skills: Alterations, Stitching, Bridal Work
- Contact: +91 98765 43210
[CHAT_TAILOR:tailor-id-456:Adnan]
[TAILOR_END]

Always include contact information and the chat link marker. Keep it clean and well-formatted.

KEY PRINCIPLES:
1. **Understand First, Respond Second**: Always analyze what the user is asking before responding
2. **Be Flexible**: Adapt to how the user communicates - don't force a rigid flow
3. **Be Helpful**: Provide value in every response, whether it's recommendations, advice, or guidance
4. **Be Natural**: Write like a real person, not a robot following a script
5. **Use Context**: Reference their profile, wardrobe, and conversation history to personalize responses`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    try {
      validateCsrfToken(request);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      await enforceRateLimit(request, apiLimiter, user.userId);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { success: false, error: 'Too many chatbot requests. Please slow down.' },
          {
            status: error.statusCode,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : undefined,
          }
        );
      }
      throw error;
    }

    const body = await request.json();
    const { message, conversationHistory = [], includeContext = true, conversationId, imageUrl } = body;

    const sanitizedMessage = sanitizeString(message || '');
    // Allow empty message if image is provided
    if (!sanitizedMessage && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Message or image is required' },
        { status: 400 }
      );
    }

    // Build context about the user
    let userContext = '';
    
    if (includeContext) {
      // Get customer profile with wardrobe
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
        include: {
          wardrobeItems: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (customer) {
        const bodyShapeText = customer.bodyShape 
          ? `${customer.bodyShape} (consider this when recommending outfits that flatter this body type)`
          : 'Not specified';
        const stylePrefsText = customer.stylePreferences?.length > 0
          ? customer.stylePreferences.join(', ')
          : 'Not specified';
        
        userContext = `
USER PROFILE & CONTEXT:
- Name: ${user.name}
- Body Shape: ${bodyShapeText}
- Style Preferences: ${stylePrefsText}
- Budget Range: ₹${customer.budgetMin || 0} - ₹${customer.budgetMax || 'No limit'}
- Location: ${customer.location || 'Not specified'}

IMPORTANT CONTEXT FOR UNDERSTANDING THIS USER:
- When recommending outfits, ALWAYS consider their body shape (${customer.bodyShape || 'body type'}) to suggest flattering styles
- Their style preferences are: ${stylePrefsText} - incorporate these into recommendations
- Budget awareness: They typically spend ₹${customer.budgetMin || 0} - ₹${customer.budgetMax || 'varies'} on fashion items
- Location: ${customer.location || 'Not specified'} - consider regional fashion preferences and climate

FIRST MESSAGE BEHAVIOR (ONLY when conversationHistory is empty):
When the user first starts chatting, greet them warmly and personally:
1. Greet by name: "Hello ${user.name}! 👋"
2. Introduce yourself as StyleAI, their personal stylist from Neural Threads
3. Mention you know their body shape (${customer.bodyShape || 'body type'}) and style preferences (${stylePrefsText})
4. Explain you'll recommend outfits that flatter their ${customer.bodyShape || 'body type'} and match their ${stylePrefsText} preferences
5. Ask about their preference: "Would you like to get these outfits stitched/customized by a designer, or would you prefer ready-made options? I can recommend designers for custom pieces or tailors for alterations."
Keep the welcome warm and conversational, not robotic.

WARDROBE ITEMS (${customer.wardrobeItems.length} items available):
${customer.wardrobeItems.length > 0 
  ? customer.wardrobeItems.map(item => `- ${item.category}: ${item.color || 'Unknown color'}${item.name ? ` (${item.name})` : ''}`).join('\n')
  : 'No items in wardrobe yet - user can upload items to get personalized outfit suggestions using their existing clothes'}
When suggesting outfits, you can reference these items if relevant to create mix-and-match looks.
`;
      }

      // Get ONLY the top designer (by rating and review count)
      const topDesigner = await prisma.designer.findFirst({
        select: {
          id: true,
          designNiches: true,
          yearsExperience: true,
          rating: true,
          reviewCount: true,
          location: true,
          contactPhone: true,
          contactEmail: true,
          profilePhoto: true,
          user: {
            select: { 
              id: true,
              name: true,
              email: true,
            },
          },
          portfolioItems: {
            select: {
              budgetMin: true,
              budgetMax: true,
            },
            take: 5,
          },
        },
        orderBy: [
          { reviewCount: 'desc' }, // Prioritize designers with more reviews
          { rating: 'desc' }, // Then by rating
        ],
      });

      if (topDesigner) {
        const budgetRange = topDesigner.portfolioItems.length > 0 
          ? `₹${Math.min(...topDesigner.portfolioItems.map(p => p.budgetMin || 0).filter(Boolean))} - ₹${Math.max(...topDesigner.portfolioItems.map(p => p.budgetMax || 1000000).filter(Boolean))}`
          : 'Price on request';
        userContext += `
TOP DESIGNER (recommend only this one):
ID: ${topDesigner.id} | Name: ${topDesigner.user.name} | Specialization: ${topDesigner.designNiches?.join(', ') || 'Various styles'} | Experience: ${topDesigner.yearsExperience || 0} years | Rating: ${topDesigner.rating}/5 (${topDesigner.reviewCount || 0} reviews) | Location: ${topDesigner.location || 'Not specified'} | Budget: ${budgetRange} | Phone: ${topDesigner.contactPhone || 'Not provided'} | Email: ${topDesigner.contactEmail || topDesigner.user.email}
`;
      }

      // Get ONLY the top tailor (by rating and review count)
      const topTailor = await prisma.tailor.findFirst({
        select: {
          id: true,
          skills: true,
          yearsExperience: true,
          rating: true,
          reviewCount: true,
          location: true,
          contactPhone: true,
          contactEmail: true,
          profilePhoto: true,
          user: {
            select: { 
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { reviewCount: 'desc' }, // Prioritize tailors with more reviews
          { rating: 'desc' }, // Then by rating
        ],
      });

      if (topTailor) {
        userContext += `
TOP TAILOR (recommend only this one):
ID: ${topTailor.id} | Name: ${topTailor.user.name} | Skills: ${topTailor.skills?.join(', ') || 'Various skills'} | Experience: ${topTailor.yearsExperience || 0} years | Rating: ${topTailor.rating}/5 (${topTailor.reviewCount || 0} reviews) | Location: ${topTailor.location || 'Not specified'} | Phone: ${topTailor.contactPhone || 'Not provided'} | Email: ${topTailor.contactEmail || topTailor.user.email}
`;
      }
    }

    // Build messages array with conversation history for context
    // Keep last 12 messages (6 exchanges) for better context understanding
    const history = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-12).map((entry: ChatMessage & { imageUrl?: string }) => ({
          role: entry.role,
          content: sanitizeString(entry.content),
          imageUrl: entry.imageUrl,
        }))
      : [];

    // Build the full message context
    // If image is provided, add it to the user message context
    let userMessageContent = sanitizedMessage;
    if (imageUrl) {
      userMessageContent = sanitizedMessage 
        ? `${sanitizedMessage}\n\n[User has uploaded an image: ${imageUrl}. Please analyze this image and provide helpful fashion advice, styling suggestions, or answer their questions about it.]`
        : `[User has uploaded an image: ${imageUrl}. Please analyze this image and provide helpful fashion advice, styling suggestions, or answer their questions about it.]`;
    }

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: FASHION_SYSTEM_PROMPT + (userContext ? `\n\n${userContext}` : ''),
      },
      ...history,
      {
        role: 'user',
        content: userMessageContent,
      },
    ];

    // Call Google Gemini API
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY is not set. Using mock response.');
      console.warn('Environment check:', {
        hasKey: !!GEMINI_API_KEY,
        keyLength: GEMINI_API_KEY?.length || 0,
        keyPreview: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'none'
      });
      const mockResponse = getMockResponse(sanitizedMessage);
      
      // Save mock messages to database if conversationId is provided
      let savedConversationId = conversationId;
      if (conversationId) {
        try {
          // Get customer profile
          const customer = await prisma.customer.findUnique({
            where: { userId: user.userId },
          });

          if (customer) {
            // Verify conversation belongs to this customer
            const conversation = await (prisma as any).chatbotConversation.findFirst({
              where: {
                id: conversationId,
                customerId: customer.id,
              },
            });

            if (conversation) {
              // Save user message
              await (prisma as any).chatbotMessage.create({
                data: {
                  conversationId: conversation.id,
                  role: 'user',
                  content: sanitizedMessage,
                  imageUrl: imageUrl || null,
                  isMock: false,
                },
              });

              // Save assistant mock response
              await (prisma as any).chatbotMessage.create({
                data: {
                  conversationId: conversation.id,
                  role: 'assistant',
                  content: mockResponse,
                  isMock: true,
                },
              });

              // Update conversation timestamp
              await (prisma as any).chatbotConversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() },
              });
            }
          }
        } catch (saveError) {
          console.error('Error saving mock messages to database:', saveError);
          // Don't fail the request if saving fails
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          response: mockResponse,
          conversationId: savedConversationId || Date.now().toString(),
          isMock: true, // Flag to indicate this is a mock response
        },
      });
    }

    console.log('✅ GEMINI_API_KEY found, calling Gemini API...');

    // Convert messages to Gemini format (using the newer API format)
    const systemPrompt = messages.find(m => m.role === 'system')?.content || FASHION_SYSTEM_PROMPT;
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Build contents array for Gemini API
    // Gemini uses alternating user/model messages
    interface GeminiContent {
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }
    
    const contents: GeminiContent[] = [];
    
    // Helper function to fetch image and convert to base64
    const fetchImageAsBase64 = async (imageUrl: string): Promise<{ mimeType: string; data: string } | null> => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.warn('Failed to fetch image:', imageUrl);
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        
        // Determine MIME type from response or URL
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        return {
          mimeType: contentType,
          data: base64,
        };
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    };
    
    // Add conversation history in proper format
    for (const msg of conversationMessages) {
      if (msg.role === 'user') {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        
        // Add image if present
        if ((msg as any).imageUrl) {
          const imageData = await fetchImageAsBase64((msg as any).imageUrl);
          if (imageData) {
            parts.push({ inlineData: imageData });
          }
        }
        
        // Add text content
        if (msg.content) {
          parts.push({ text: msg.content });
        }
        
        if (parts.length > 0) {
          contents.push({
            role: 'user',
            parts: parts
          });
        }
      } else if (msg.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Handle current message with image
    const currentMessageParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    // Add image if provided
    if (imageUrl) {
      const imageData = await fetchImageAsBase64(imageUrl);
      if (imageData) {
        currentMessageParts.push({ inlineData: imageData });
      }
    }
    
    // Add text content
    const messageText = sanitizedMessage || (imageUrl ? 'Please analyze this image and provide fashion advice.' : '');
    if (messageText) {
      currentMessageParts.push({ text: messageText });
    }
    
    // If no conversation history, add system prompt as first user message
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [
          { text: systemPrompt + '\n\nUser: ' },
          ...currentMessageParts
        ]
      });
    } else {
      // Add system prompt to the first user message
      if (contents[0]?.role === 'user') {
        contents[0].parts.unshift({ text: systemPrompt + '\n\n' });
      }
      
      // Add current message
      if (currentMessageParts.length > 0) {
        contents.push({
          role: 'user',
          parts: currentMessageParts
        });
      }
    }

    // Use the latest Gemini model
    const model = 'gemini-2.0-flash'; // Latest stable model
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY, // Use header-based authentication
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.8, // Slightly higher for more natural, creative responses
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2500, // Increased for more detailed, thoughtful responses
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('❌ Gemini API error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        error: errorData,
        model: model,
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      });
      
      // Return mock response on API error
      console.warn('⚠️ Gemini API error, falling back to mock response');
      const mockResponse = getMockResponse(sanitizedMessage);
      
      // Save mock messages to database if conversationId is provided
      let savedConversationId = conversationId;
      if (conversationId) {
        try {
          // Get customer profile
          const customer = await prisma.customer.findUnique({
            where: { userId: user.userId },
          });

          if (customer) {
            // Verify conversation belongs to this customer
            const conversation = await (prisma as any).chatbotConversation.findFirst({
              where: {
                id: conversationId,
                customerId: customer.id,
              },
            });

            if (conversation) {
              // Save user message
              await (prisma as any).chatbotMessage.create({
                data: {
                  conversationId: conversation.id,
                  role: 'user',
                  content: sanitizedMessage,
                  imageUrl: imageUrl || null,
                  isMock: false,
                },
              });

              // Save assistant mock response
              await (prisma as any).chatbotMessage.create({
                data: {
                  conversationId: conversation.id,
                  role: 'assistant',
                  content: mockResponse,
                  isMock: true,
                },
              });

              // Update conversation timestamp
              await (prisma as any).chatbotConversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() },
              });
            }
          }
        } catch (saveError) {
          console.error('Error saving mock messages to database:', saveError);
          // Don't fail the request if saving fails
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          response: mockResponse,
          conversationId: savedConversationId || Date.now().toString(),
          isMock: true, // Flag to indicate this is a mock response
        },
      });
    }

    const data = await geminiResponse.json();
    
    // Handle Gemini API response format
    let assistantMessage = 'I apologize, but I couldn\'t generate a response. Please try again.';
    
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        assistantMessage = candidate.content.parts[0].text || assistantMessage;
      }
    }
    
    // Log if we got a response
    if (assistantMessage && assistantMessage !== 'I apologize, but I couldn\'t generate a response. Please try again.') {
      console.log('✅ Gemini API response received successfully');
      console.log('Response length:', assistantMessage.length, 'characters');
    } else {
      console.warn('⚠️ Gemini API response was empty or invalid:', data);
    }

    // Save messages to database if conversationId is provided
    let savedConversationId = conversationId;
    if (conversationId) {
      try {
        console.log('💾 Attempting to save messages for conversationId:', conversationId);
        
        // Get customer profile
        const customer = await prisma.customer.findUnique({
          where: { userId: user.userId },
        });

        if (!customer) {
          console.warn('⚠️ Customer profile not found for userId:', user.userId);
        } else {
          // Verify conversation belongs to this customer
          const conversation = await (prisma as any).chatbotConversation.findFirst({
            where: {
              id: conversationId,
              customerId: customer.id,
            },
          });

          if (!conversation) {
            console.warn('⚠️ Conversation not found or does not belong to customer:', conversationId);
          } else {
            console.log('✅ Found conversation, saving messages...');
            
            // Save user message
            await (prisma as any).chatbotMessage.create({
              data: {
                conversationId: conversation.id,
                role: 'user',
                content: sanitizedMessage,
                imageUrl: imageUrl || null,
                isMock: false,
              },
            });
            console.log('✅ Saved user message');

            // Save assistant response
            await (prisma as any).chatbotMessage.create({
              data: {
                conversationId: conversation.id,
                role: 'assistant',
                content: assistantMessage,
                isMock: false,
              },
            });
            console.log('✅ Saved assistant message');

            // Update conversation timestamp
            await (prisma as any).chatbotConversation.update({
              where: { id: conversation.id },
              data: { updatedAt: new Date() },
            });
            console.log('✅ Updated conversation timestamp');
          }
        }
      } catch (saveError) {
        console.error('❌ Error saving messages to database:', saveError);
        if (saveError instanceof Error) {
          console.error('Error details:', {
            message: saveError.message,
            stack: saveError.stack,
          });
          // Check if it's a Prisma model not found error
          if (saveError.message.includes('chatbotConversation') || saveError.message.includes('chatbotMessage')) {
            console.error('⚠️ Prisma client needs to be regenerated. Please restart the dev server.');
          }
        }
        // Don't fail the request if saving fails
      }
    } else {
      console.log('⚠️ No conversationId provided, skipping save');
    }

    return NextResponse.json({
      success: true,
      data: {
        response: assistantMessage,
        conversationId: savedConversationId || Date.now().toString(),
        isMock: false, // Flag to indicate this is a real AI response
      },
    });
  } catch (error) {
    console.error('❌ Chatbot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to process message: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Mock response for when OpenAI API is not available
function getMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('wedding')) {
    return `✨ **Perfect Wedding Outfit Suggestions** ✨

I'd love to help you look stunning for the wedding! Here are 5 complete outfit combinations:

**Outfit 1: Classic Elegance** 👗
- A rich burgundy silk saree with gold zari border
- Paired with a contrast gold blouse with intricate embroidery
- Gold jhumka earrings and matching bangles
- Embellished gold clutch
- Gold strappy heels
💡 *Tip: Add a maang tikka for extra glamour!*

**Outfit 2: Modern Fusion** 👗
- Emerald green lehenga with contemporary embroidery
- Matching crop top blouse with bell sleeves
- Statement kundan necklace set
- Potli bag in matching green
- Block heel sandals
💡 *Tip: Keep makeup dewy for a fresh look!*

**Outfit 3: Royal Elegance** 👗
- Royal blue Anarkali suit with gold accents
- Heavy dupatta with gota patti work
- Polki jewelry set
- Embroidered mojaris
- Small evening bag
💡 *Tip: Pin the dupatta elegantly on one shoulder!*

**Outfit 4: Subtle Grace** 👗
- Pastel pink organza saree with delicate work
- Sequined blouse in matching shade
- Pearl jewelry for understated elegance
- Rose gold heels
- Pearl clutch
💡 *Tip: Perfect for day weddings!*

**Outfit 5: Bold Statement** 👗
- Red and gold banarasi lehenga
- Off-shoulder blouse with dori work
- Temple jewelry set
- Red velvet heels
- Embroidered potli
💡 *Tip: Red is always auspicious for Indian weddings!*

🎨 **Color Palette Suggestion:** Rich jewel tones like emerald, burgundy, royal blue work beautifully for evening ceremonies, while pastels are perfect for day events.

Would you like me to help you find designers who specialize in wedding wear? ⭐`;
  }

  if (lowerMessage.includes('interview') || lowerMessage.includes('office')) {
    return `✨ **Professional Interview Outfit Suggestions** ✨

Let me help you make a powerful first impression! Here are 5 polished outfit combinations:

**Outfit 1: Classic Corporate** 👗
- Navy blue tailored blazer
- White crisp cotton shirt
- Matching navy trousers
- Nude pointed-toe pumps
- Structured leather tote
💡 *Tip: Iron your shirt perfectly - details matter!*

**Outfit 2: Modern Professional** 👗
- Grey pantsuit with subtle pinstripes
- Pastel blue silk blouse
- Silver minimal jewelry
- Black stilettos
- Black laptop bag
💡 *Tip: A well-fitted suit shows attention to detail!*

**Outfit 3: Smart Casual** 👗
- Burgundy blazer
- Black turtleneck
- Tailored black pants
- Tan ankle boots
- Crossbody bag
💡 *Tip: Perfect for creative industries!*

**Outfit 4: Elegant Traditional** 👗
- Cotton saree in subtle prints (beige/cream)
- Plain contrast blouse
- Small gold studs
- Comfortable block heels
- Simple handbag
💡 *Tip: Shows cultural awareness while staying professional!*

**Outfit 5: Contemporary Chic** 👗
- Structured midi dress in forest green
- Nude belt to define waist
- Pearl studs
- Nude pumps
- Structured tote
💡 *Tip: A dress is effortlessly elegant!*

🎨 **Color Psychology:** Navy conveys trust, grey shows professionalism, and burgundy demonstrates confidence without being overpowering.

Would you like tips on grooming and accessories for your interview? 💼`;
  }

  if (lowerMessage.includes('casual') || lowerMessage.includes('weekend')) {
    return `✨ **Relaxed Weekend Outfit Ideas** ✨

Let's create some effortlessly stylish casual looks! Here are 5 comfortable yet chic combinations:

**Outfit 1: Brunch Ready** 👗
- Flowy floral midi skirt
- White cotton crop top
- Woven sandals
- Straw crossbody bag
- Layered gold necklaces
💡 *Tip: Add oversized sunglasses for extra style!*

**Outfit 2: Coffee Run Chic** 👗
- High-waisted mom jeans
- Tucked-in graphic tee
- White sneakers
- Denim jacket (tied around waist)
- Canvas tote
💡 *Tip: Roll up the jeans for a trendy touch!*

**Outfit 3: Park Stroll** 👗
- Linen co-ord set in sage green
- Comfortable slides
- Mini backpack
- Delicate anklet
- Baseball cap
💡 *Tip: Linen keeps you cool in warm weather!*

**Outfit 4: Shopping Day** 👗
- Wide-leg palazzo pants
- Fitted tank top
- Platform sandals
- Large tote for shopping
- Statement earrings
💡 *Tip: Comfortable pants are key for walking!*

**Outfit 5: Sunset Vibes** 👗
- Maxi dress in sunset colors
- Layered bracelets
- Espadrilles
- Woven clutch
- Bohemian rings
💡 *Tip: Perfect for evening beach walks!*

🎨 **Weekend Color Palette:** Earth tones, soft pastels, and classic denim work perfectly for relaxed vibes.

Would you like me to suggest items from your wardrobe for these looks? 👜`;
  }

  if (lowerMessage.includes('trend') || lowerMessage.includes('latest')) {
    return `✨ **Latest Fashion Trends 2024** ✨

Here's what's hot in fashion right now:

**🔥 Top Trends:**

1. **Quiet Luxury** 👗
   - Minimalist designs with premium fabrics
   - Neutral color palettes
   - Subtle branding
   - Focus on quality over quantity
   💡 *Tip: Invest in timeless pieces!*

2. **Bold Metallics** 👗
   - Silver and gold statement pieces
   - Metallic accessories
   - Shimmery fabrics for evening
   💡 *Tip: One metallic piece per outfit is enough!*

3. **Sustainable Fashion** 👗
   - Eco-friendly fabrics
   - Vintage and thrifted finds
   - Upcycled designs
   💡 *Tip: Quality over quantity is key!*

4. **Modern Indian Fusion** 👗
   - Contemporary cuts with traditional fabrics
   - Saree gowns and dhoti pants
   - Indo-western silhouettes
   💡 *Tip: Perfect for standing out at events!*

5. **Oversized Silhouettes** 👗
   - Baggy jeans and wide-leg pants
   - Oversized blazers
   - Relaxed fits
   💡 *Tip: Balance with fitted pieces!*

**🎨 Trending Colors:**
- Butter yellow
- Cherry red
- Cobalt blue
- Sage green
- Chocolate brown

Would you like me to recommend designers who specialize in these trending styles? ⭐`;
  }

  if (lowerMessage.includes('designer') || lowerMessage.includes('recommend')) {
    return `⭐ **Designer Recommendations** ⭐

Based on our platform's top-rated designers, here are my recommendations:

**For Bridal & Wedding Wear:**
- Look for designers specializing in Bridal and Ethnic niches
- Consider experience of 8+ years for intricate work
- Check their portfolio for your preferred style

**For Casual & Contemporary:**
- Designers with Casual and Western expertise
- Fresh perspectives from newer talents
- Focus on comfort and wearability

**For Fusion Wear:**
- Specialists in blending Indian and Western
- Creative approach to traditional silhouettes
- Perfect for modern occasions

**For Formal Wear:**
- Tailored expertise is essential
- Clean lines and premium fabrics
- Attention to fit and finish

💡 **Tips for Choosing a Designer:**
1. Browse their portfolio thoroughly
2. Check reviews and ratings
3. Discuss your vision clearly
4. Set realistic budget expectations
5. Allow enough time for custom work

Would you like me to show you specific designers from our platform based on your style preferences? I can filter by:
- Design specialty
- Location
- Budget range
- Experience level

Just let me know your requirements! 👗`;
  }

  // Default response
  return `✨ **Hello! I'm StyleAI, your personal fashion assistant!** ✨

I'm here to help you with all your fashion needs. Here's what I can do for you:

👗 **Outfit Suggestions**
- Complete looks for any occasion
- Mix and match from your wardrobe
- Seasonal outfit ideas

🎨 **Style Advice**
- Personalized recommendations based on your body shape
- Color coordination tips
- Trend updates and how to style them

👜 **Wardrobe Management**
- Organize your clothing
- Identify wardrobe gaps
- Create capsule collections

⭐ **Designer & Tailor Connections**
- Recommend the best matches for your needs
- Help you find specialists for custom work
- Budget-friendly options

**Quick Actions You Can Try:**
• "Suggest outfits for a summer wedding"
• "What should I wear to a job interview?"
• "Create casual weekend looks"
• "Latest fashion trends"
• "Find me a bridal designer"

Feel free to upload images of your clothes, and I'll help you build amazing outfits! 📸

What would you like help with today?`;
}
