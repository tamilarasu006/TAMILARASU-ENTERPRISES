const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch notifications', error);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (notification.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update notification', error);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update notifications', error);
  }
};

// Internal utility to create notifications
exports.createNotification = async (userId, title, message, type = 'SYSTEM', link = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link
      }
    });

    const { getIo } = require('../utils/socket');
    const io = getIo();
    if (io) {
      io.to(userId).emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
