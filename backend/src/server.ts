import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import destinationRoutes from './routes/destinationRoutes.js';
import favoritesRoutes from './routes/favoritesRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

// Connect to Database
connectDB();

const app = express();
// Enable trust proxy for secure cookies on Render/Heroku
app.set('trust proxy', 1);

// Normalize FRONTEND_URL to prevent trailing slash mismatches in CORS origin check
const normalizedFrontend = (process.env.FRONTEND_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
const allowedOrigins = [normalizedFrontend, 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim().replace(/\/$/, '') : null;
    if (
      !origin ||
      (frontendUrl && origin === frontendUrl) ||
      allowedOrigins.includes(origin) ||
      (origin && origin.endsWith('.vercel.app')) ||
      (origin && origin.endsWith('.onrender.com'))
    ) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked: Origin '${origin}' does not match FRONTEND_URL '${frontendUrl}'`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

export { io }; // Export for logic usage elsewhere

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/users', userRoutes);

// Simple socket logic for real-time chat
io.on('connection', (socket) => {
  socket.on('join_trip', (tripId) => {
    socket.join(tripId);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'VoyageAI Backend is running' });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server with WebSocket is running at http://localhost:${PORT}`);
});
