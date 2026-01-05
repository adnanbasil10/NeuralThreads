import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function GET() {
  try {
    // Get current user from token
    const tokenUser = await getCurrentUser();

    if (!tokenUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch full user data from database (optimized - only fetch needed profile)
    let user: any;
    if (tokenUser.role === 'CUSTOMER') {
      user = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          age: true,
          isEmailVerified: true,
          createdAt: true,
          customer: true,
        },
      });
    } else if (tokenUser.role === 'DESIGNER') {
      user = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          age: true,
          isEmailVerified: true,
          createdAt: true,
          designer: true,
        },
      });
    } else if (tokenUser.role === 'TAILOR') {
      user = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          age: true,
          isEmailVerified: true,
          createdAt: true,
          tailor: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: tokenUser.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          age: true,
          isEmailVerified: true,
          createdAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get role-specific profile
    const profile = user.customer || user.designer || user.tailor || null;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          age: user.age,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
          profile,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching user data' },
      { status: 500 }
    );
  }
}


