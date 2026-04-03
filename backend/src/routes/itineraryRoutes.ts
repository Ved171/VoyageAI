import express from 'express';
import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';
import TripMember from '../models/TripMember.js';
import User from '../models/User.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Message from '../models/Message.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { io } from '../server.js';
import multer from 'multer';

// Multer Memory Storage (Store in RAM temporarily to convert to Base64)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// All itinerary routes are protected
router.use(authenticateToken);

// --- Helpers ---
const checkAccess = async (rawTripId: string | string[] | undefined, userId: string): Promise<'owner' | 'member' | null> => {
  if (!rawTripId) return null;
  const tripId = Array.isArray(rawTripId) ? rawTripId[0] : rawTripId;
  const member = await TripMember.findOne({ tripId, userId });
  if (member) return member.role as 'owner' | 'member';
  
  // Fallback for legacy trips without TripMember mapping
  const trip = await Itinerary.findById(tripId);
  if (trip && trip.userId.toString() === userId) return 'owner';

  return null;
};

// Create a new itinerary
router.post('/', async (req: AuthRequest, res) => {
  try {
    const body = { ...req.body };

    // Sanitize travelCost.mode — Mongoose only accepts 'flight' | 'train' | 'other'
    if (body.travelCost?.mode) {
      const mode = String(body.travelCost.mode).toLowerCase();
      const allowed = ['flight', 'train', 'bus', 'car', 'other'];
      body.travelCost.mode = allowed.includes(mode) ? mode : 'other';
    }

    const newItinerary = new Itinerary({
      ...body,
      userId: req.user!.userId, // Legacy field
    });
    const savedItinerary = await newItinerary.save();

    // Automatically create the owner TripMember
    await TripMember.create({
      tripId: savedItinerary._id,
      userId: req.user!.userId,
      role: 'owner',
    });

    res.status(201).json({ ...savedItinerary.toJSON(), memberRole: 'owner' });
  } catch (error: any) {
    console.error('Error saving itinerary:', error?.message || error);
    res.status(400).json({ message: 'Error saving itinerary', error: error?.message });
  }
});

// Get all itineraries for the current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Find all TripMember records for this user
    const members = await TripMember.find({ userId });
    const tripIds = members.map(m => m.tripId);

    // Fetch itineraries where user is either a member OR is the legacy userId
    const itineraries = await Itinerary.find({
      $or: [
        { _id: { $in: tripIds } },
        { userId: userId }
      ]
    }).sort({ createdAt: -1 });

    // Map the role back into the response so frontend knows if it's shared
    const results = itineraries.map(trip => {
      const tripObj = trip.toJSON();
      const memberRec = members.find(m => m.tripId.toString() === trip._id.toString());
      const role = memberRec ? memberRec.role : (trip.userId.toString() === userId ? 'owner' : 'member');
      return { ...tripObj, memberRole: role };
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching itineraries', error);
    res.status(500).json({ message: 'Error fetching itineraries', error });
  }
});

// Get a specific itinerary
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied to this itinerary' });

    const itinerary = await Itinerary.findById(req.params.id as string);
    if (!itinerary) return res.status(404).json({ message: 'Itinerary not found' });
    
    res.json({ ...itinerary.toJSON(), memberRole: role });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching itinerary', error });
  }
});

// Update an itinerary (Collaborative Editing - Last Write Wins)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied: not a member' });

    const body = { ...req.body };
    delete body._id; // Prevent updating ID
    
    // Perform update
    const updatedItinerary = await Itinerary.findByIdAndUpdate(
      req.params.id as string,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedItinerary) return res.status(404).json({ message: 'Itinerary not found' });

    res.json({ ...updatedItinerary.toJSON(), memberRole: role });
  } catch (error) {
    console.error('Error updating itinerary:', error);
    res.status(500).json({ message: 'Error updating itinerary', error });
  }
});

// Delete an itinerary (Owner only)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (role !== 'owner') return res.status(403).json({ message: 'Only owners can delete trips' });

    const deletedItinerary = await Itinerary.findByIdAndDelete(req.params.id as string);
    if (!deletedItinerary) return res.status(404).json({ message: 'Itinerary not found' });

    // Clean up mapping
    await TripMember.deleteMany({ tripId: req.params.id as string });

    res.json({ message: 'Itinerary deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting itinerary', error });
  }
});

// --- Collaborative Members Endpoints ---

// Get all members for a trip
router.get('/:id/members', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const members = await TripMember.find({ tripId: req.params.id as string }).populate('userId', 'name email');
    
    // Backward compatibility for legacy trips: ensure the creator is always a member
    const trip = await Itinerary.findById(req.params.id as string);
    if (trip && trip.userId) {
      // Check if the trip owner is already in the members list
      const ownerExists = members.some(m => 
        (m.userId as any)?._id?.toString() === trip.userId.toString() || 
        (m.userId as any) === trip.userId.toString()
      );
      
      if (!ownerExists) {
        // Automatically add the legacy creator to the TripMembers collection
        const newOwnerMember = await TripMember.create({
          tripId: new mongoose.Types.ObjectId(req.params.id as string),
          userId: trip.userId,
          role: 'owner'
        });
        
        const populatedOwner = await TripMember.findById((newOwnerMember as any)._id).populate('userId', 'name email');
        if (populatedOwner) {
          // Push to the array so it's returned immediately
          members.unshift(populatedOwner);
        }
      }
    }

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error });
  }
});

// Add a member (Owner only)
router.post('/:id/members', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (role !== 'owner') return res.status(403).json({ message: 'Only owners can add members' });

    const { targetUserId, role: assignRole = 'member' } = req.body;

    if (!targetUserId) return res.status(400).json({ message: 'Target user ID required' });

    // Check if user exists
    const user = await User.findById(targetUserId as string);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // UPSERT
    const member = await TripMember.findOneAndUpdate(
      { tripId: req.params.id as string, userId: targetUserId as string },
      { role: assignRole },
      { new: true, upsert: true }
    ).populate('userId', 'name email');

    // Emit notification to the target user
    io.to(`user_${targetUserId}`).emit('trip_added', { tripId: req.params.id });

    res.status(201).json(member);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User is already a member' });
    }
    res.status(500).json({ message: 'Error adding member', error });
  }
});

// Remove a member or Leave trip
router.delete('/:id/members/:userId', async (req: AuthRequest, res) => {
  try {
    const callerId = req.user!.userId;
    const itineraryId = req.params.id as string;
    const callerRole = await checkAccess(itineraryId, callerId);
    if (!callerRole) return res.status(403).json({ message: 'Access denied' });

    const targetUserId = req.params.userId === 'me' ? callerId : req.params.userId as string;
    
    // Leave trip logic
    if (targetUserId === callerId) {
      if (callerRole === 'owner') {
        return res.status(400).json({ message: 'Owners cannot leave the trip directly. Transfer ownership or delete the trip.' });
      }
      await TripMember.findOneAndDelete({ tripId: req.params.id as string, userId: callerId });
      return res.json({ message: 'Successfully left the trip' });
    }

    // Removing someone else
    if (callerRole !== 'owner') {
      return res.status(403).json({ message: 'Only owners can remove other members' });
    }

    await TripMember.findOneAndDelete({ tripId: req.params.id as string, userId: targetUserId as string });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error });
  }
});

// --- Expense Management Endpoints ---

// Get all expenses for a trip
router.get('/:id/expenses', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const expenses = await Expense.find({ tripId: req.params.id as string })
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses', error });
  }
});

// Add an expense
router.post('/:id/expenses', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const { title, amount, paidBy, date, notes, participants } = req.body;

    if (!title || !amount || !paidBy || !participants || !participants.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate the split sum equals total amount (allowing tiny rounding floats)
    const sum = participants.reduce((acc: number, p: any) => acc + Number(p.shareAmount), 0);
    if (Math.abs(sum - amount) > 0.1) {
      return res.status(400).json({ message: 'Split amounts must equal the total amount' });
    }

    const expense = new Expense({
      tripId: req.params.id,
      title,
      amount,
      paidBy,
      createdBy: req.user!.userId,
      date: date || new Date(),
      notes,
      participants
    });

    const saved = await expense.save();
    // Repopulate for immediate frontend rendering
    const populated = await Expense.findById((saved as any)._id)
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('participants.userId', 'name email');

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding expense', error: error?.message });
  }
});

// Delete an expense
router.delete('/:id/expenses/:expenseId', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const expense = await Expense.findById(req.params.expenseId as string);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    // Only owner of trip or creator of expense can delete
    if (role !== 'owner' && expense.createdBy.toString() !== req.user!.userId) {
      return res.status(403).json({ message: 'Only trip owners or expense creators can delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.expenseId as string);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error });
  }
});

// Get settlements
router.get('/:id/settlements', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const settlements = await Settlement.find({ tripId: req.params.id as string })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ date: -1, createdAt: -1 });
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settlements', error });
  }
});

// Add settlement
router.post('/:id/settlements', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const { toUser, amount, date } = req.body;
    if (!toUser || !amount) return res.status(400).json({ message: 'Missing fields' });

    const settlement = new Settlement({
      tripId: req.params.id,
      fromUser: req.user!.userId,
      toUser,
      amount,
      date: date || new Date()
    });

    const saved = await settlement.save();
    const populated = await Settlement.findById((saved as any)._id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error adding settlement', error });
  }
});

// Get Ledger / Balance Summary
router.get('/:id/expenses/summary', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const role = await checkAccess(tripId, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied' });

    const expenses = await Expense.find({ tripId });
    const settlements = await Settlement.find({ tripId });

    // Initialize balances map
    const balances: Record<string, number> = {};
    const getBal = (u: string) => balances[u] || 0;

    let totalExpenses = 0;

    // Process Expenses
    expenses.forEach(exp => {
      totalExpenses += exp.amount;
      const payerId = exp.paidBy.toString();
      
      // Credit the payer
      balances[payerId] = getBal(payerId) + exp.amount;

      // Debit the participants
      exp.participants.forEach(p => {
        const pId = p.userId.toString();
        balances[pId] = getBal(pId) - p.shareAmount;
      });
    });

    // Process Settlements
    settlements.forEach(settle => {
      const fromId = settle.fromUser.toString();
      const toId = settle.toUser.toString();

      // fromUser paid toUser, so fromUser balance goes up (debts drop), toUser balance goes down
      balances[fromId] = getBal(fromId) + settle.amount;
      balances[toId] = getBal(toId) - settle.amount;
    });

    res.json({
      totalTripExpenses: totalExpenses,
      balances
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error calculating summary', error });
  }
});

// --- Chat Management Endpoints ---

// Get trip chat messages
router.get('/:id/messages', async (req: AuthRequest, res) => {
  try {
    const role = await checkAccess(req.params.id, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Access denied to this trip chat' });

    const messages = await Message.find({ tripId: req.params.id as string })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // Pagination could be added but for now last 50

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history', error });
  }
});

// Send a message (Text or Image)
router.post('/:id/messages', upload.single('image'), async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const role = await checkAccess(tripId, req.user!.userId);
    if (!role) return res.status(403).json({ message: 'Only members can send messages' });

    let fileData = '';
    const multerReq = req as any;
    if (multerReq.file) {
      // Convert buffer to base64 string
      const base64 = multerReq.file.buffer.toString('base64');
      fileData = `data:${multerReq.file.mimetype};base64,${base64}`;
    }

    const newMessage = new Message({
      tripId,
      userId: (req as any).user!.userId,
      messageText: (req as any).body.text,
      messageType: multerReq.file ? 'image' : 'text',
      fileData
    });

    const saved = await newMessage.save();
    const populated = await Message.findById((saved as any)._id).populate('userId', 'name email');

    if (populated) {
      // Broadcast to trip room
      io.to(tripId).emit('message_received', populated);
    }

    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: 'Error sending message', error: error?.message });
  }
});

export default router;
