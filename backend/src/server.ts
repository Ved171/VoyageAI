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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const app = express();

// CORS — allow frontend with credentials
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
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

app.use('/api/users', userRoutes);

// Simple socket logic for real-time chat
io.on('connection', (socket) => {
  console.log('⚡ User connected over WebSocket');

  socket.on('join_trip', (tripId) => {
    socket.join(tripId);
    console.log(`📡 User joined trip room: ${tripId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User joined personal room: user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected');
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
