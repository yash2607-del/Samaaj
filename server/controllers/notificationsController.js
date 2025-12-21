import Notification from '../Models/Notification.js';

const getNotifications = async (req, res) => {
  try {
    const { id } = req.user;
    const notifications = await Notification.find({ userId: id })
      .populate('complaintId', 'title category')
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ userId: id, isRead: false });

    res.json({ data: notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { id } = req.user;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Notification not found' });

    res.json({ data: notification });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const { id } = req.user;
    await Notification.updateMany({ userId: id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  getNotifications,
  markRead,
  markAllRead
};
