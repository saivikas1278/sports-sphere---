import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Contact form validation
const contactValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('category')
    .isIn(['general', 'technical', 'bug', 'feature', 'sales', 'partnership'])
    .withMessage('Please select a valid category'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Please select a valid priority level')
];

// POST /api/contact - Send contact form
router.post('/', contactValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, subject, category, message, priority } = req.body;

    // Prepare contact data
    const contactData = {
      name: name.trim(),
      email: email.toLowerCase(),
      subject: subject.trim(),
      category,
      message: message.trim(),
      priority
    };

    // Email sending has been disabled
    console.log('Contact form submitted:', contactData);

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you within 24 hours.',
      data: {
        messageId: `contact_${Date.now()}`,
        timestamp: new Date().toISOString(),
        expectedResponseTime: priority === 'urgent' ? '1 hour' : 
                             priority === 'high' ? '4 hours' : '24 hours'
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/contact/info - Get contact information
router.get('/info', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      supportEmail: 'leelamadhav.nulakani@gmail.com',
      responseTime: {
        urgent: '< 1 hour',
        high: '< 4 hours',
        medium: '< 24 hours',
        low: '< 24 hours'
      },
      supportHours: 'Mon-Fri: 9 AM - 6 PM EST',
      categories: [
        { value: 'general', label: 'General Questions' },
        { value: 'technical', label: 'Technical Support' },
        { value: 'bug', label: 'Bug Report' },
        { value: 'feature', label: 'Feature Request' },
        { value: 'sales', label: 'Sales Inquiry' },
        { value: 'partnership', label: 'Partnership' }
      ]
    }
  });
});

export default router;
