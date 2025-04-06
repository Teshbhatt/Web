const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// JWT Secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Questions table for Python loops
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    explanation TEXT
  )`);

  // Game sessions table
  db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    score INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Moves/Questions answered table
  db.run(`CREATE TABLE IF NOT EXISTS moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_session_id INTEGER,
    question_id INTEGER,
    chess_position TEXT NOT NULL,
    answered_correctly BOOLEAN,
    time_taken INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_session_id) REFERENCES game_sessions (id),
    FOREIGN KEY (question_id) REFERENCES questions (id)
  )`);

  // Add sample Python loop questions
  insertSampleQuestions();
}

// Insert sample Python loop questions
function insertSampleQuestions() {
  const questions = [
    {
      question_text: "What will be the output of the following code?\n\nfor i in range(5):\n    print(i)",
      option_a: "0 1 2 3 4",
      option_b: "1 2 3 4 5",
      option_c: "0 1 2 3 4 5",
      option_d: "1 2 3 4",
      correct_answer: "a",
      difficulty: "easy",
      explanation: "The range(5) function generates numbers from 0 to 4, inclusive."
    },
    {
      question_text: "Which loop is guaranteed to execute at least once?",
      option_a: "for loop",
      option_b: "while loop",
      option_c: "do-while loop",
      option_d: "None of the above",
      correct_answer: "c",
      difficulty: "easy",
      explanation: "A do-while loop always executes its body at least once before checking the condition."
    },
    {
      question_text: "What does the 'continue' statement do in a loop?",
      option_a: "Exits the loop entirely",
      option_b: "Skips the rest of the current iteration and moves to the next one",
      option_c: "Skips the next iteration",
      option_d: "Pauses the loop execution",
      correct_answer: "b",
      difficulty: "medium",
      explanation: "The continue statement skips the rest of the current iteration and goes to the next iteration."
    },
    {
      question_text: "What will be the output of this code?\n\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1",
      option_a: "1 2 3 4 5",
      option_b: "0 1 2 3 4",
      option_c: "0 1 2 3 4 5",
      option_d: "1 2 3 4",
      correct_answer: "b",
      difficulty: "easy",
      explanation: "The loop starts with count=0 and prints values until count is 4, incrementing after each print."
    },
    {
      question_text: "How do you iterate through a list and get both the index and value of each item?",
      option_a: "for i, v in list:",
      option_b: "for i, v in enumerate(list):",
      option_c: "for i in range(len(list)):",
      option_d: "for index, value in iterate(list):",
      correct_answer: "b",
      difficulty: "medium",
      explanation: "The enumerate() function returns pairs of indices and values from an iterable."
    },
    {
      question_text: "What's the output of this nested loop?\n\nfor i in range(3):\n    for j in range(2):\n        print(i, j)",
      option_a: "0,0 0,1 1,0 1,1 2,0 2,1",
      option_b: "0,0 1,0 2,0 0,1 1,1 2,1",
      option_c: "0,0 0,1 1,1 1,2 2,1 2,2",
      option_d: "0,1 0,2 1,1 1,2 2,1 2,2",
      correct_answer: "a",
      difficulty: "medium",
      explanation: "The outer loop runs 3 times (0,1,2) and for each iteration, the inner loop runs twice (0,1)."
    },
    {
      question_text: "What will be the value of total after this code executes?\n\ntotal = 0\nfor num in range(1, 6):\n    if num % 2 == 0:\n        total += num",
      option_a: "6",
      option_b: "15",
      option_c: "9",
      option_d: "8",
      correct_answer: "a",
      difficulty: "medium",
      explanation: "Only even numbers (2 and 4) are added to the total: 0+2+4=6"
    },
    {
      question_text: "What does this loop do?\n\nfor i in range(10, 0, -1):\n    print(i)",
      option_a: "Prints numbers from 10 to 1 in descending order",
      option_b: "Prints numbers from 10 to 0 in descending order",
      option_c: "Prints numbers from 0 to 10 in ascending order",
      option_d: "Causes an infinite loop",
      correct_answer: "a",
      difficulty: "medium",
      explanation: "range(10, 0, -1) generates numbers from 10 down to 1 with a step of -1."
    },
    {
      question_text: "What's the purpose of the 'else' clause in a for loop?",
      option_a: "It executes if the loop condition becomes false",
      option_b: "It executes if the loop completes normally (without break)",
      option_c: "It's not valid syntax in Python",
      option_d: "It executes for each iteration that doesn't match an if condition",
      correct_answer: "b",
      difficulty: "hard",
      explanation: "The else clause in a for loop runs when the loop completes normally, without encountering a break statement."
    },
    {
      question_text: "What will this code print?\n\nx = [1, 2, 3]\nfor i in x:\n    x.append(i)\n    if len(x) > 10:\n        break\n    print(len(x))",
      option_a: "4 5 6",
      option_b: "4 5 6 7 8 9 10",
      option_c: "Will cause an infinite loop",
      option_d: "3 6 9",
      correct_answer: "b",
      difficulty: "hard",
      explanation: "The loop keeps appending to the list it's iterating over, printing the new length until it exceeds 10."
    }
  ];

  // Check if questions already exist
  db.get("SELECT COUNT(*) as count FROM questions", [], (err, row) => {
    if (err) {
      console.error("Error checking questions table", err.message);
      return;
    }
    
    // Only insert if no questions exist
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO questions 
        (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, explanation) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      questions.forEach(q => {
        stmt.run(
          q.question_text, 
          q.option_a, 
          q.option_b, 
          q.option_c, 
          q.option_d, 
          q.correct_answer, 
          q.difficulty, 
          q.explanation
        );
      });
      
      stmt.finalize();
      console.log("Sample questions inserted");
    }
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// API ROUTES

// Register a new user
app.post('/api/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;
  
  try {
    // Check if username or email already exists
    db.get("SELECT id FROM users WHERE username = ? OR email = ?", [username, email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert the new user
      db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", 
        [username, email, hashedPassword], function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error registering user' });
          }
          
          // Generate JWT token
          const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '24h' });
          
          res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: { id: this.lastID, username, email }
          });
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/login', [
  body('username').trim().escape(),
  body('password').isLength({ min: 1 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get("SELECT id, username, email, created_at FROM users WHERE id = ?", 
    [req.user.id], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(row);
  });
});

// Start a new game session
app.post('/api/game/start', authenticateToken, (req, res) => {
  db.run("INSERT INTO game_sessions (user_id) VALUES (?)", 
    [req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error starting game session' });
      }
      
      res.status(201).json({ 
        message: 'Game session started',
        game_session_id: this.lastID
      });
  });
});

// End a game session
app.put('/api/game/:id/end', authenticateToken, (req, res) => {
  const gameId = req.params.id;
  const { score } = req.body;
  
  db.run("UPDATE game_sessions SET end_time = CURRENT_TIMESTAMP, score = ?, completed = 1 WHERE id = ? AND user_id = ?", 
    [score, gameId, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error ending game session' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Game session not found or not owned by user' });
      }
      
      res.json({ message: 'Game session ended successfully' });
  });
});

// Get a random question
app.get('/api/questions/random', (req, res) => {
  const difficulty = req.query.difficulty || 'medium';
  
  db.get("SELECT * FROM questions WHERE difficulty = ? ORDER BY RANDOM() LIMIT 1", 
    [difficulty], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ message: 'No questions found' });
      }
      
      // Don't send the correct answer to the client
      const { correct_answer, ...questionData } = row;
      
      res.json(questionData);
  });
});

// Get question by ID
app.get('/api/questions/:id', (req, res) => {
  const questionId = req.params.id;
  
  db.get("SELECT * FROM questions WHERE id = ?", [questionId], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Don't send the correct answer to the client
    const { correct_answer, ...questionData } = row;
    
    res.json(questionData);
  });
});

// Submit an answer
app.post('/api/questions/:id/answer', authenticateToken, (req, res) => {
  const questionId = req.params.id;
  const { gameSessionId, answer, chessPosition, timeTaken } = req.body;
  
  if (!gameSessionId || !answer || !chessPosition) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Get the correct answer
  db.get("SELECT correct_answer FROM questions WHERE id = ?", [questionId], (err, question) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    const isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();
    
    // Record the move/answer
    db.run("INSERT INTO moves (game_session_id, question_id, chess_position, answered_correctly, time_taken) VALUES (?, ?, ?, ?, ?)", 
      [gameSessionId, questionId, chessPosition, isCorrect ? 1 : 0, timeTaken], function(err) {
        if (err) {
          return res.status(500).json({ message: 'Error recording move' });
        }
        
        // If correct, update the score
        if (isCorrect) {
          db.run("UPDATE game_sessions SET score = score + ? WHERE id = ?", 
            [timeTaken < 10 ? 10 : 5, gameSessionId]);  // Bonus points for quick answers
        }
        
        res.json({ 
          correct: isCorrect,
          moveId: this.lastID
        });
    });
  });
});

// Get questions by position
app.get('/api/position/:position/question', (req, res) => {
  const position = req.params.position;
  
  // Select a random question with difficulty based on chess position
  // Simple algorithm: A1-H1 = easy, A8-H8 = hard, rest = medium
  let difficulty;
  
  if (position.match(/[A-H][1]/i)) {
    difficulty = 'easy';
  } else if (position.match(/[A-H][8]/i)) {
    difficulty = 'hard';
  } else {
    difficulty = 'medium';
  }
  
  db.get("SELECT * FROM questions WHERE difficulty = ? ORDER BY RANDOM() LIMIT 1", 
    [difficulty], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ message: 'No questions found' });
      }
      
      // Don't send the correct answer to the client
      const { correct_answer, ...questionData } = row;
      
      res.json({
        ...questionData,
        position
      });
  });
});

// Check an answer
app.post('/api/questions/:id/check', (req, res) => {
  const questionId = req.params.id;
  const { answer } = req.body;
  
  if (!answer) {
    return res.status(400).json({ message: 'Answer is required' });
  }
  
  db.get("SELECT correct_answer, explanation FROM questions WHERE id = ?", 
    [questionId], (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (!row) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      const correct = answer.toLowerCase() === row.correct_answer.toLowerCase();
      
      res.json({
        correct,
        explanation: row.explanation
      });
  });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  db.all(`
    SELECT u.username, g.score, g.end_time
    FROM game_sessions g
    JOIN users u ON g.user_id = u.id
    WHERE g.completed = 1 
    ORDER BY g.score DESC
    LIMIT 10
  `, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    
    res.json(rows);
  });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;