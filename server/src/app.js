require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const errorResponse = require('./utils/errorResponse');
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');

const app = express();
const httpServer = createServer(app);
const devOrigins = process.env.NODE_ENV !== 'production' ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'] : [];
const prodOrigins = ['https://tamilarasu-enterprises-1.onrender.com'];
const allowedOrigins = [process.env.CLIENT_URL, process.env.ADMIN_URL, ...prodOrigins, ...devOrigins].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow no-origin requests (curl, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/$/, ''); // remove trailing slash just in case
    const isAllowed = allowedOrigins.some(allowedUrl => {
       const cleanAllowed = allowedUrl.replace(/\/$/, '');
       return cleanOrigin === cleanAllowed;
    });

    if (isAllowed || cleanOrigin.includes('onrender.com')) {
      callback(null, true);
    } else {
      console.error(`Blocked by CORS: origin="${origin}", allowed="${allowedOrigins.join(',')}"`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  }
};

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH'] }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*", "wss:", "https:"],
    }
  }
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Store socket io instance to be accessible from controllers
app.set('io', io);

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/adminOrder.routes');
const serviceRoutes = require('./routes/service.routes');

app.use('/api/', limiter); // Apply limiter only to API routes

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/services', serviceRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Serve static frontend files (Client and Admin)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/admin', express.static(path.join(__dirname, '../../admin/dist')));
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Catch-all routes for React Router
app.use('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../admin/dist/index.html'));
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  return errorResponse(res, 500, 'Internal Server Error', err);
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.role !== 'ADMIN') return next(new Error('Admin access required'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  socket.join('admins');
  console.log('Admin connected:', socket.id, socket.user?.email);
});

module.exports = { app, httpServer };