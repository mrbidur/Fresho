const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const diasporaRoutes = require('./routes/diaspora');
const tattooRoutes = require('./routes/tattoo');
const petcareRoutes = require('./routes/petcare');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'fresho-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/v1/diaspora', diasporaRoutes.diasporaRouter);
app.use('/api/v1/reports', diasporaRoutes.reportsRouter);
app.use('/api/v1/webhooks', diasporaRoutes.webhooksRouter);
app.use('/api/v1/tattoo', tattooRoutes);
app.use('/api/v1/pets', petcareRoutes.petsRouter);
app.use('/api/v1/petcare', petcareRoutes.petcareRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Fresho backend running on port ${PORT}`);
});

module.exports = app;
