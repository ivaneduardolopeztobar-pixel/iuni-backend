const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const path = require('path');
const { helmet, generalLimiter } = require('./middleware/security');
const morgan = require('morgan');


const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV === 'development';

// Seguridad HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
const allowedOrigins = isDev
  ? ['http://localhost:5173','http://localhost:5174','http://localhost:5175','http://localhost:5176']
  : ['https://iuni.com'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(isDev ? 'dev' : 'combined'));

// Rate limit global
app.use('/api/', generalLimiter);

// Archivos estaticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/employer', require('./routes/employer.routes'));
app.use('/api/jobs', require('./routes/jobs.routes'));
app.use('/api/applications', require('./routes/applications.routes'));
app.use('/api/favorites', require('./routes/favorites.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/views', require('./routes/profileviews.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/reset', require('./routes/reset.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/alerts', require('./routes/jobalerts.routes'));
app.use('/api/metrics', require('./routes/metrics.routes'));
app.use('/', require('./routes/sitemap.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'IUNI' }));

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => console.log(`IUNI backend running on port ${PORT} [${process.env.NODE_ENV}]`));
