const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');

const petsRouter = express.Router();
const petcareRouter = express.Router();

// GET /api/v1/pets - List user's pet profiles
petsRouter.get('/', (req, res) => {
  const pets = [
    {
      id: 'pet-001',
      ownerId: 'user-101',
      name: 'Moti',
      species: 'Dog',
      breed: 'Tibetan Mastiff',
      age: 4,
      weight: 55.5,
      allergies: ['Chicken'],
      temperament: 'Calm but protective',
      medicalNotes: 'Hip dysplasia - requires gentle handling',
      vaccinationStatus: 'Up to date',
      lastVetVisit: '2024-01-20T10:00:00Z',
      createdAt: '2023-06-15T08:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z'
    },
    {
      id: 'pet-002',
      ownerId: 'user-101',
      name: 'Biralo',
      species: 'Cat',
      breed: 'Persian',
      age: 2,
      weight: 4.2,
      allergies: [],
      temperament: 'Friendly and playful',
      medicalNotes: null,
      vaccinationStatus: 'Due for booster',
      lastVetVisit: '2023-11-10T14:00:00Z',
      createdAt: '2023-08-01T12:00:00Z',
      updatedAt: '2023-11-10T14:00:00Z'
    }
  ];

  res.status(200).json({
    success: true,
    data: pets,
    meta: { total: pets.length }
  });
});

// POST /api/v1/pets - Create pet profile
petsRouter.post('/', [
  body('name').notEmpty().withMessage('Pet name is required'),
  body('species').notEmpty().withMessage('Species is required'),
  body('breed').optional().isString(),
  body('age').optional().isInt({ min: 0 }),
  body('weight').optional().isFloat({ min: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, species, breed, age, weight, allergies, temperament, medicalNotes } = req.body;

  const pet = {
    id: uuidv4(),
    ownerId: 'user-101', // from auth context in real impl
    name,
    species,
    breed: breed || null,
    age: age || null,
    weight: weight || null,
    allergies: allergies || [],
    temperament: temperament || null,
    medicalNotes: medicalNotes || null,
    vaccinationStatus: 'Unknown',
    lastVetVisit: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: pet,
    message: 'Pet profile created successfully'
  });
});

// PUT /api/v1/pets/:id - Update pet profile
petsRouter.put('/:id', [
  param('id').notEmpty().withMessage('Pet ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const updates = req.body;

  const updatedPet = {
    id,
    ownerId: 'user-101',
    name: updates.name || 'Moti',
    species: updates.species || 'Dog',
    breed: updates.breed || 'Tibetan Mastiff',
    age: updates.age || 4,
    weight: updates.weight || 55.5,
    allergies: updates.allergies || ['Chicken'],
    temperament: updates.temperament || 'Calm but protective',
    medicalNotes: updates.medicalNotes || 'Hip dysplasia - requires gentle handling',
    vaccinationStatus: updates.vaccinationStatus || 'Up to date',
    lastVetVisit: updates.lastVetVisit || '2024-01-20T10:00:00Z',
    createdAt: '2023-06-15T08:00:00Z',
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: updatedPet,
    message: 'Pet profile updated successfully'
  });
});

// POST /api/v1/petcare/booking - Book pet service
petcareRouter.post('/booking', [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('serviceType').isIn(['GROOMING', 'VET_CHECKUP', 'DENTAL', 'VACCINATION', 'MOBILE_SPA', 'BOARDING']).withMessage('Invalid service type'),
  body('scheduledDate').isISO8601().withMessage('Valid date is required'),
  body('scheduledTime').notEmpty().withMessage('Scheduled time is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    petId, serviceType, venueId, vanId, isRecurring,
    recurringSchedule, scheduledDate, scheduledTime,
    address, latitude, longitude, notes
  } = req.body;

  const booking = {
    id: uuidv4(),
    petId,
    ownerId: 'user-101',
    serviceType,
    venueId: venueId || null,
    vanId: vanId || null,
    isRecurring: isRecurring || false,
    recurringSchedule: recurringSchedule || null,
    scheduledDate,
    scheduledTime,
    address,
    latitude,
    longitude,
    status: 'pending',
    notes: notes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    data: booking,
    message: serviceType === 'MOBILE_SPA'
      ? 'Mobile spa booking created. A van will be dispatched to your location.'
      : 'Pet care booking confirmed.'
  });
});

// POST /api/v1/petcare/booking/:id/dispatch - Dispatch mobile van
petcareRouter.post('/booking/:id/dispatch', [
  param('id').isUUID().withMessage('Valid booking ID is required'),
  body('vanId').notEmpty().withMessage('Van ID is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { vanId } = req.body;

  res.status(200).json({
    success: true,
    data: {
      bookingId: id,
      vanId,
      dispatchStatus: 'DISPATCHED',
      van: {
        id: vanId,
        vehicleName: 'PetCare Express 1',
        vehicleNumber: 'BA 2 KHA 7890',
        driverName: 'Bikash Tamang',
        driverPhone: '+977-9812345678',
        currentLatitude: 27.7000,
        currentLongitude: 85.3100,
        estimatedArrival: '25 minutes',
        equipmentList: ['Grooming Table', 'Wash Station', 'Dryer', 'Nail Clippers', 'Shampoo Kit']
      },
      dispatchedAt: new Date().toISOString()
    },
    message: 'Mobile spa van dispatched. Driver is on the way.'
  });
});

// GET /api/v1/petcare/vans/available - Available vans with GPS positions
petcareRouter.get('/vans/available', (req, res) => {
  const vans = [
    {
      id: 'van-001',
      vehicleName: 'PetCare Express 1',
      vehicleNumber: 'BA 2 KHA 7890',
      driverName: 'Bikash Tamang',
      driverPhone: '+977-9812345678',
      currentLatitude: 27.7000,
      currentLongitude: 85.3100,
      lastLocationUpdate: new Date(Date.now() - 30000).toISOString(),
      serviceRadius: 10.0,
      equipmentList: ['Grooming Table', 'Wash Station', 'Dryer', 'Nail Clippers', 'Shampoo Kit'],
      status: 'AVAILABLE'
    },
    {
      id: 'van-002',
      vehicleName: 'PetCare Express 2',
      vehicleNumber: 'BA 3 GA 1234',
      driverName: 'Sunita Rai',
      driverPhone: '+977-9823456789',
      currentLatitude: 27.6800,
      currentLongitude: 85.3400,
      lastLocationUpdate: new Date(Date.now() - 45000).toISOString(),
      serviceRadius: 12.0,
      equipmentList: ['Grooming Table', 'Wash Station', 'Dryer', 'Vaccination Kit', 'Dental Tools'],
      status: 'AVAILABLE'
    },
    {
      id: 'van-003',
      vehicleName: 'PetCare Mobile Vet',
      vehicleNumber: 'BA 1 CHA 5678',
      driverName: 'Dr. Anup KC',
      driverPhone: '+977-9834567890',
      currentLatitude: 27.7200,
      currentLongitude: 85.3000,
      lastLocationUpdate: new Date(Date.now() - 60000).toISOString(),
      serviceRadius: 15.0,
      equipmentList: ['Examination Table', 'Portable Ultrasound', 'Vaccination Kit', 'Surgical Tools', 'Medication Cabinet'],
      status: 'AVAILABLE'
    }
  ];

  res.status(200).json({
    success: true,
    data: vans,
    meta: {
      total: vans.length,
      timestamp: new Date().toISOString()
    }
  });
});

// PUT /api/v1/petcare/vans/:id/location - Update van GPS (driver app)
petcareRouter.put('/vans/:id/location', [
  param('id').notEmpty().withMessage('Van ID is required'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { latitude, longitude } = req.body;

  res.status(200).json({
    success: true,
    data: {
      vanId: id,
      latitude,
      longitude,
      lastLocationUpdate: new Date().toISOString()
    },
    message: 'Van location updated'
  });
});

module.exports = { petsRouter, petcareRouter };
