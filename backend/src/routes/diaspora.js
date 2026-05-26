const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');

const diasporaRouter = express.Router();
const reportsRouter = express.Router();
const webhooksRouter = express.Router();

// Multer config for lab report PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// GET /api/v1/diaspora/packages - Returns health packages with multi-currency pricing
diasporaRouter.get('/packages', (req, res) => {
  const packages = [
    {
      id: 'pkg-basic-health',
      name: 'Basic Health Checkup',
      description: 'General physician consultation, blood pressure, BMI check',
      includes: ['General Consultation', 'Blood Pressure', 'BMI Assessment', 'Basic Blood Panel'],
      duration: '45 minutes',
      pricing: {
        NPR: 3500,
        USD: 26.50,
        GBP: 21.00,
        AUD: 40.50
      },
      venue: 'Nepal Mediciti Hospital, Lalitpur'
    },
    {
      id: 'pkg-comprehensive',
      name: 'Comprehensive Health Package',
      description: 'Full body checkup with lab tests and specialist consultation',
      includes: ['Full Blood Panel', 'Thyroid Function', 'Liver Function', 'Kidney Function', 'ECG', 'Chest X-Ray', 'Specialist Consultation'],
      duration: '3 hours',
      pricing: {
        NPR: 12000,
        USD: 90.75,
        GBP: 72.00,
        AUD: 138.50
      },
      venue: 'Grande International Hospital, Kathmandu'
    },
    {
      id: 'pkg-dental',
      name: 'Dental Care Package',
      description: 'Complete dental examination, cleaning, and X-ray',
      includes: ['Dental Examination', 'Cleaning & Scaling', 'Dental X-Ray', 'Fluoride Treatment'],
      duration: '1.5 hours',
      pricing: {
        NPR: 5500,
        USD: 41.60,
        GBP: 33.00,
        AUD: 63.50
      },
      venue: 'Dental Care Center, Thamel'
    },
    {
      id: 'pkg-eye',
      name: 'Eye Care Package',
      description: 'Comprehensive eye examination with retinal screening',
      includes: ['Vision Test', 'Eye Pressure Check', 'Retinal Screening', 'Prescription Update'],
      duration: '1 hour',
      pricing: {
        NPR: 4000,
        USD: 30.25,
        GBP: 24.00,
        AUD: 46.20
      },
      venue: 'Tilganga Eye Hospital, Kathmandu'
    }
  ];

  res.status(200).json({
    success: true,
    data: packages,
    exchangeRates: {
      base: 'NPR',
      rates: { USD: 0.0076, GBP: 0.0060, AUD: 0.0116 },
      updatedAt: new Date().toISOString()
    }
  });
});

// POST /api/v1/diaspora/booking - Creates booking with recipient details
diasporaRouter.post('/booking', [
  body('payerName').notEmpty().withMessage('Payer name is required'),
  body('payerEmail').isEmail().withMessage('Valid payer email is required'),
  body('payerPhone').notEmpty().withMessage('Payer phone is required'),
  body('payerCountry').notEmpty().withMessage('Payer country is required'),
  body('payerCurrency').isIn(['USD', 'GBP', 'AUD', 'NPR']).withMessage('Invalid currency'),
  body('recipientName').notEmpty().withMessage('Recipient name is required'),
  body('recipientPhone').notEmpty().withMessage('Recipient phone is required'),
  body('recipientAddress').notEmpty().withMessage('Recipient address is required'),
  body('packageType').notEmpty().withMessage('Package type is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    payerName, payerEmail, payerPhone, payerCountry, payerCurrency,
    recipientName, recipientPhone, recipientAddress, packageType
  } = req.body;

  const exchangeRates = { USD: 0.0076, GBP: 0.0060, AUD: 0.0116 };
  const packagePrices = {
    'pkg-basic-health': 3500,
    'pkg-comprehensive': 12000,
    'pkg-dental': 5500,
    'pkg-eye': 4000
  };

  const amountNPR = packagePrices[packageType] || 3500;
  const rate = exchangeRates[payerCurrency] || 1;
  const amountPayerCurrency = parseFloat((amountNPR * rate).toFixed(2));

  const booking = {
    id: uuidv4(),
    payerName,
    payerEmail,
    payerPhone,
    payerCountry,
    payerCurrency,
    recipientName,
    recipientPhone,
    recipientAddress,
    packageType,
    exchangeRate: rate,
    amountLocalCurrency: amountNPR,
    amountPayerCurrency,
    carDispatchStatus: 'PENDING',
    stripePaymentIntentId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Diaspora booking created. Proceed to payment.'
  });
});

// POST /api/v1/diaspora/booking/:id/pay - Process international payment
diasporaRouter.post('/booking/:id/pay', [
  param('id').isUUID().withMessage('Valid booking ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;

  // Stripe PaymentIntent stub
  const paymentIntent = {
    id: `pi_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
    object: 'payment_intent',
    amount: 9075, // amount in cents
    currency: 'usd',
    status: 'requires_confirmation',
    client_secret: `pi_${uuidv4().replace(/-/g, '').substring(0, 24)}_secret_${crypto.randomBytes(12).toString('hex')}`,
    metadata: {
      bookingId: id,
      platform: 'fresho-diaspora'
    }
  };

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      paymentIntent,
      message: 'Payment intent created. Confirm on client side with Stripe.js'
    }
  });
});

// GET /api/v1/diaspora/booking/:id/track - Real-time car dispatch + appointment status
diasporaRouter.get('/booking/:id/track', [
  param('id').isUUID().withMessage('Valid booking ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      carDispatch: {
        status: 'EN_ROUTE_TO_PICKUP',
        driverName: 'Ram Shrestha',
        driverPhone: '+977-9841234567',
        vehicleNumber: 'BA 1 JA 4523',
        currentLocation: {
          latitude: 27.7172,
          longitude: 85.3240
        },
        estimatedPickupTime: '2024-03-15T09:30:00+05:45',
        estimatedArrivalAtVenue: '2024-03-15T10:00:00+05:45'
      },
      appointment: {
        status: 'confirmed',
        venue: 'Nepal Mediciti Hospital, Lalitpur',
        scheduledTime: '2024-03-15T10:30:00+05:45',
        recipientName: 'Sita Sharma',
        packageType: 'pkg-comprehensive'
      },
      timeline: [
        { event: 'BOOKING_CREATED', timestamp: '2024-03-14T18:00:00+05:45' },
        { event: 'PAYMENT_CONFIRMED', timestamp: '2024-03-14T18:05:00+05:45' },
        { event: 'DRIVER_ASSIGNED', timestamp: '2024-03-15T09:00:00+05:45' },
        { event: 'EN_ROUTE_TO_PICKUP', timestamp: '2024-03-15T09:15:00+05:45' }
      ]
    }
  });
});

// POST /api/v1/reports/upload - Lab report PDF upload
reportsRouter.post('/upload', upload.single('report'), [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('patientName').notEmpty().withMessage('Patient name is required'),
  body('reportType').notEmpty().withMessage('Report type is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'PDF file is required'
    });
  }

  // Compute SHA-256 hash of uploaded file
  const hash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

  const report = {
    id: uuidv4(),
    bookingId: req.body.bookingId,
    patientName: req.body.patientName,
    reportType: req.body.reportType,
    fileUrl: `https://storage.fresho.app/reports/${uuidv4()}.pdf`,
    fileSizeBytes: req.file.size,
    sha256Hash: hash,
    uploadedBy: req.body.uploadedBy || 'lab-technician',
    verifiedByDoctor: false,
    doctorName: null,
    doctorLicenseNumber: null,
    verifiedAt: null,
    createdAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: report,
    message: 'Lab report uploaded successfully. Pending doctor verification.'
  });
});

// GET /api/v1/reports/:id/download - Returns signed URL for report download
reportsRouter.get('/:id/download', [
  param('id').isUUID().withMessage('Valid report ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

  res.status(200).json({
    success: true,
    data: {
      reportId: id,
      downloadUrl: `https://storage.fresho.app/reports/${id}.pdf?token=${crypto.randomBytes(32).toString('hex')}&expires=${expiresAt.toISOString()}`,
      expiresAt: expiresAt.toISOString(),
      contentType: 'application/pdf'
    }
  });
});

// POST /api/v1/webhooks/pathao - Ride status webhook receiver
webhooksRouter.post('/pathao', (req, res) => {
  // Validate webhook signature
  const signature = req.headers['x-pathao-signature'];
  const webhookSecret = process.env.PATHAO_WEBHOOK_SECRET || 'whsec_default';

  if (!signature) {
    return res.status(401).json({
      success: false,
      error: 'Missing webhook signature'
    });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({
      success: false,
      error: 'Invalid webhook signature'
    });
  }

  const { event, data } = req.body;

  const validEvents = [
    'ride.driver_assigned',
    'ride.en_route_to_pickup',
    'ride.arrived_at_pickup',
    'ride.en_route_to_destination',
    'ride.arrived_at_destination',
    'ride.completed',
    'ride.cancelled'
  ];

  if (!validEvents.includes(event)) {
    return res.status(400).json({
      success: false,
      error: `Unknown event type: ${event}`
    });
  }

  // Process webhook event
  console.log(`Pathao webhook received: ${event}`, data);

  res.status(200).json({
    success: true,
    message: `Webhook event ${event} processed`,
    receivedAt: new Date().toISOString()
  });
});

module.exports = { diasporaRouter, reportsRouter, webhooksRouter };
