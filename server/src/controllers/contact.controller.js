const prisma = require('../prisma');
const errorResponse = require('../utils/errorResponse');
const { sendEmail } = require('../services/emailService');

const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }

    // Save to database
    const contactMsg = await prisma.contactMessage.create({
      data: { name, email, phone, subject, message }
    });

    // Email to Super Admin
    try {
      const emailText = `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subject}\n\nMessage:\n${message}`;
      // In a real scenario, fetch the SUPER_ADMIN email from DB or use environment variable
      // For now we send it to a standard support email or fallback
      const adminEmail = 'tamilarasuv423@gmail.com'; 
      await sendEmail(adminEmail, `[Contact Form] ${subject}`, emailText);
    } catch (emailError) {
      console.error('[CONTACT EMAIL ERROR]', emailError);
      // We don't fail the request if the email fails, the message is still in DB
    }

    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('[CONTACT SUBMIT ERROR]', error);
    return errorResponse(res, 500, 'Failed to submit message', error);
  }
};

const getContactMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch messages', error);
  }
};

const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update message', error);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.delete({ where: { id } });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete message', error);
  }
};

module.exports = {
  submitContact,
  getContactMessages,
  markMessageRead,
  deleteMessage
};
