const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, query, validationResult } = require('express-validator');
const { transition, canTransition, getAvailableTransitions } = require('../state-machines/tattooDeposit');

const router = express.Router();

// GET /api/v1/tattoo/artists - List artists with availability and filters
router.get('/artists', [
  query('style').optional().isString(),
  query('minRate').optional().isFloat({ min: 0 }),
  query('maxRate').optional().isFloat({ min: 0 }),
  query('available').optional().isBoolean()
], (req, res) => {
  const artists = [
    {
      id: 'artist-001',
      userId: 'user-101',
      venueId: 'venue-tattoo-01',
      stageName: 'InkMaster Roshan',
      bio: 'Traditional Nepali and modern fusion tattoo artist with 8 years experience',
      hourlyRate: 2500,
      specializations: ['Traditional Nepali', 'Mandala', 'Watercolor', 'Geometric'],
      yearsExperience: 8,
      instagramHandle: '@inkmasterroshan',
      portfolioUrl: 'https://fresho.app/artists/roshan',
      isAvailable: true,
      rating: 4.8,
      totalBookings: 156,
      venue: {
        name: 'Thamel Ink Studio',
        address: 'Thamel, Kathmandu'
      }
    },
    {
      id: 'artist-002',
      userId: 'user-102',
      venueId: 'venue-tattoo-02',
      stageName: 'Maya Ink',
      bio: 'Specializing in fine line work and botanical tattoos',
      hourlyRate: 3000,
      specializations: ['Fine Line', 'Botanical', 'Minimalist', 'Script'],
      yearsExperience: 5,
      instagramHandle: '@mayainkktm',
      portfolioUrl: 'https://fresho.app/artists/maya',
      isAvailable: true,
      rating: 4.9,
      totalBookings: 89,
      venue: {
        name: 'Patan Art Tattoo',
        address: 'Mangalbazar, Patan'
      }
    },
    {
      id: 'artist-003',
      userId: 'user-103',
      venueId: 'venue-tattoo-01',
      stageName: 'Dark Lotus',
      bio: 'Blackwork and dotwork specialist. Cover-up expert.',
      hourlyRate: 3500,
      specializations: ['Blackwork', 'Dotwork', 'Cover-up', 'Japanese'],
      yearsExperience: 12,
      instagramHandle: '@darklotusink',
      portfolioUrl: 'https://fresho.app/artists/darklotus',
      isAvailable: false,
      rating: 4.7,
      totalBookings: 243,
      venue: {
        name: 'Thamel Ink Studio',
        address: 'Thamel, Kathmandu'
      }
    }
  ];

  res.status(200).json({
    success: true,
    data: artists,
    meta: {
      total: artists.length,
      filters: {
        style: req.query.style || null,
        minRate: req.query.minRate || null,
        maxRate: req.query.maxRate || null,
        available: req.query.available || null
      }
    }
  });
});

// GET /api/v1/tattoo/artists/:id/gallery - Artist portfolio images
router.get('/artists/:id/gallery', [
  param('id').notEmpty().withMessage('Artist ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;

  const gallery = [
    {
      id: 'img-001',
      artistId: id,
      imageUrl: 'https://storage.fresho.app/tattoo-gallery/mandala-full-sleeve.jpg',
      thumbnailUrl: 'https://storage.fresho.app/tattoo-gallery/thumbs/mandala-full-sleeve.jpg',
      title: 'Mandala Full Sleeve',
      description: 'Intricate mandala pattern with geometric elements',
      style: 'Mandala',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'img-002',
      artistId: id,
      imageUrl: 'https://storage.fresho.app/tattoo-gallery/nepal-traditional.jpg',
      thumbnailUrl: 'https://storage.fresho.app/tattoo-gallery/thumbs/nepal-traditional.jpg',
      title: 'Traditional Newari Design',
      description: 'Inspired by Patan Durbar Square wood carvings',
      style: 'Traditional Nepali',
      createdAt: '2024-02-01T14:30:00Z'
    },
    {
      id: 'img-003',
      artistId: id,
      imageUrl: 'https://storage.fresho.app/tattoo-gallery/watercolor-lotus.jpg',
      thumbnailUrl: 'https://storage.fresho.app/tattoo-gallery/thumbs/watercolor-lotus.jpg',
      title: 'Watercolor Lotus',
      description: 'Vibrant watercolor style lotus with splatter effects',
      style: 'Watercolor',
      createdAt: '2024-02-20T09:15:00Z'
    }
  ];

  res.status(200).json({
    success: true,
    data: gallery,
    meta: {
      artistId: id,
      total: gallery.length
    }
  });
});

// POST /api/v1/tattoo/booking - Create booking with deposit calculation
router.post('/booking', [
  body('artistId').notEmpty().withMessage('Artist ID is required'),
  body('clientId').notEmpty().withMessage('Client ID is required'),
  body('estimatedHours').isFloat({ min: 0.5 }).withMessage('Estimated hours must be at least 0.5')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { artistId, clientId, estimatedHours } = req.body;

  // Deposit is 25% of estimated total
  const hourlyRate = 2500; // fetched from artist profile in real impl
  const estimatedTotal = hourlyRate * estimatedHours;
  const depositAmount = Math.round(estimatedTotal * 0.25);

  const booking = {
    id: uuidv4(),
    artistId,
    clientId,
    depositAmount,
    depositStatus: 'PENDING_DEPOSIT',
    estimatedHours,
    actualHours: null,
    hourlyRate,
    finalBillAmount: null,
    depositPaidAt: null,
    confirmedAt: null,
    arrivedAt: null,
    completedAt: null,
    disputeReason: null,
    disputeResolution: null,
    availableTransitions: getAvailableTransitions('PENDING_DEPOSIT'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: booking,
    message: `Booking created. Deposit of NPR ${depositAmount} required to confirm.`
  });
});

// POST /api/v1/tattoo/booking/:id/deposit/pay - Pay deposit (uses state machine)
router.post('/booking/:id/deposit/pay', [
  param('id').isUUID().withMessage('Valid booking ID is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const currentState = 'PENDING_DEPOSIT';
  const context = { paymentConfirmed: true };

  if (!canTransition(currentState, 'PAY_DEPOSIT', context)) {
    return res.status(422).json({
      success: false,
      error: 'Cannot process deposit payment in current state'
    });
  }

  const newState = transition(currentState, 'PAY_DEPOSIT', context);

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      previousStatus: currentState,
      currentStatus: newState,
      depositPaidAt: new Date().toISOString(),
      availableTransitions: getAvailableTransitions(newState),
      message: 'Deposit paid successfully. Awaiting artist confirmation.'
    }
  });
});

// POST /api/v1/tattoo/booking/:id/confirm - Artist confirms booking
router.post('/booking/:id/confirm', [
  param('id').isUUID().withMessage('Valid booking ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const currentState = 'DEPOSIT_PAID';
  const context = { artistAccepted: true };

  if (!canTransition(currentState, 'ARTIST_CONFIRM', context)) {
    return res.status(422).json({
      success: false,
      error: 'Cannot confirm booking in current state'
    });
  }

  const newState = transition(currentState, 'ARTIST_CONFIRM', context);

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      previousStatus: currentState,
      currentStatus: newState,
      confirmedAt: new Date().toISOString(),
      availableTransitions: getAvailableTransitions(newState),
      message: 'Booking confirmed by artist.'
    }
  });
});

// POST /api/v1/tattoo/booking/:id/arrive - Client arrives (deduct deposit from final)
router.post('/booking/:id/arrive', [
  param('id').isUUID().withMessage('Valid booking ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const currentState = 'CONFIRMED';
  const context = { clientArrived: true };

  if (!canTransition(currentState, 'CLIENT_ARRIVE', context)) {
    return res.status(422).json({
      success: false,
      error: 'Cannot mark arrival in current state'
    });
  }

  const newState = transition(currentState, 'CLIENT_ARRIVE', context);

  // Calculate estimated final bill with deposit deduction
  const hourlyRate = 2500;
  const estimatedHours = 3;
  const depositAmount = Math.round(hourlyRate * estimatedHours * 0.25);
  const estimatedFinal = (hourlyRate * estimatedHours) - depositAmount;

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      previousStatus: currentState,
      currentStatus: newState,
      arrivedAt: new Date().toISOString(),
      depositAmount,
      estimatedRemainingPayment: estimatedFinal,
      availableTransitions: getAvailableTransitions(newState),
      message: `Client arrived. Deposit of NPR ${depositAmount} will be deducted from final bill.`
    }
  });
});

// POST /api/v1/tattoo/booking/:id/no-show - Mark no-show (forfeit deposit)
router.post('/booking/:id/no-show', [
  param('id').isUUID().withMessage('Valid booking ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const currentState = 'CONFIRMED';
  const context = {
    pastAppointmentTime: true,
    gracePeriodElapsed: true
  };

  if (!canTransition(currentState, 'MARK_NO_SHOW', context)) {
    return res.status(422).json({
      success: false,
      error: 'Cannot mark no-show. Grace period may not have elapsed.'
    });
  }

  const newState = transition(currentState, 'MARK_NO_SHOW', context);

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      previousStatus: currentState,
      currentStatus: newState,
      depositForfeited: true,
      forfeitedAmount: 1875,
      disputeWindowEnds: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      availableTransitions: getAvailableTransitions(newState),
      message: 'Client marked as no-show. Deposit forfeited. Client has 48 hours to dispute.'
    }
  });
});

// POST /api/v1/tattoo/booking/:id/dispute - Client disputes forfeiture
router.post('/booking/:id/dispute', [
  param('id').isUUID().withMessage('Valid booking ID is required'),
  body('reason').notEmpty().withMessage('Dispute reason is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { reason } = req.body;
  const currentState = 'NO_SHOW';
  const context = { withinDisputeWindow: true };

  if (!canTransition(currentState, 'DISPUTE', context)) {
    return res.status(422).json({
      success: false,
      error: 'Cannot dispute. Dispute window may have closed.'
    });
  }

  const newState = transition(currentState, 'DISPUTE', context);

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      previousStatus: currentState,
      currentStatus: newState,
      disputeReason: reason,
      disputeFiledAt: new Date().toISOString(),
      estimatedResolutionTime: '48-72 hours',
      availableTransitions: getAvailableTransitions(newState),
      message: 'Dispute filed. Our team will review within 48-72 hours.'
    }
  });
});

module.exports = router;
