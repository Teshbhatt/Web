const express = require('express');
const router = express.Router();
const db = require('./database');
const auth = require('./auth');
const qrcodeUtil = require('./qrcode-util'); // You mentioned this was already created

// Authentication routes
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', auth.verifyToken, auth.getCurrentUser);

// Question routes
router.get('/questions/:position', async (req, res) => {
  try {
    const { position } = req.params;
    const question = await db.getQuestionByPosition(position);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found for this position' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/questions/answer', auth.verifyToken, async (req, res) => {
  try {
    const { position, answer, gameId } = req.body;
    
    if (!position || !answer || !gameId) {
      return res.status(400).json({ error: 'Position, answer, and gameId are required' });
    }
    
    const question = await db.getQuestionByPosition(position);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check if the answer is correct
    const isCorrect = question.correct_answer === answer;
    
    // Record the move in the database
    await db.recordMove(gameId, position, question.id, isCorrect);
    
    res.json({
      correct: isCorrect,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer. Try again.',
      nextStep: isCorrect ? 'move' : 'retry'
    });
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Game routes
router.post('/games/start', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.createGame(userId);
    
    res.status(201).json({
      message: 'Game started successfully',
      gameId: result.gameId
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/games/:gameId/end', auth.verifyToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { score } = req.body;
    
    if (!score && score !== 0) {
      return res.status(400).json({ error: 'Score is required' });
    }
    
    await db.endGame(gameId, score);
    
    res.json({
      message: 'Game ended successfully'
    });
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leaderboard routes
router.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await db.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User stats
router.get('/users/stats', auth.verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await db.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// QR code routes (assuming qrcode-util.js is already created)
router.get('/qrcode/:position', async (req, res) => {
  try {
    const { position } = req.params;
    
    // Check if position exists in the database
    const question = await db.getQuestionByPosition(position);
    if (!question) {
      return res.status(404).json({ error: 'Invalid chess position' });
    }
    
    // Get QR code (assuming qrcodeUtil has a method called generateQRCode)
    const qrCodeUrl = await qrcodeUtil.generateQRCode(position);
    
    res.json({
      position,
      qrCodeUrl
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export the router
module.exports = router;