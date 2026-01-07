import { prisma } from '@/lib/db/prisma';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    });

    // Emit real-time notification via socket.io if available
    try {
      const { getIO } = await import('@/lib/socket/server');
      const io = getIO();
      if (io) {
        io.to(`user:${userId}`).emit('new-notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
      }
    } catch (socketError) {
      // Socket emission is optional - don't fail if socket server isn't available
      // The notification is still created in the database
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notification for new unread message
 */
export async function notifyNewMessage(
  recipientUserId: string,
  senderName: string,
  chatId: string,
  messagePreview: string,
  chatLink?: string
) {
  return createNotification({
    userId: recipientUserId,
    type: 'MESSAGE',
    title: `New message from ${senderName}`,
    message: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
    link: chatLink || `/customer/chats/${chatId}`,
  });
}

/**
 * Create notification for new review
 */
export async function notifyNewReview(
  designerUserId: string,
  customerName: string,
  rating: number,
  reviewId: string
) {
  return createNotification({
    userId: designerUserId,
    type: 'REVIEW',
    title: `New ${rating}-star review from ${customerName}`,
    message: `${customerName} left you a ${rating}-star review`,
    link: `/designer/reviews`,
  });
}

/**
 * Create notification for profile view milestone
 */
export async function notifyProfileViewMilestone(
  designerUserId: string,
  viewCount: number
) {
  // Only notify on milestones (100, 500, 1000, etc.)
  if (viewCount % 100 === 0 && viewCount > 0) {
    return createNotification({
      userId: designerUserId,
      type: 'PROFILE_VIEW',
      title: `Profile View Milestone! 🎉`,
      message: `Your profile has reached ${viewCount} views!`,
      link: `/designer`,
    });
  }
  return null;
}

