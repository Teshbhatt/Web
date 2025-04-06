const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Database path
const dbPath = path.join(dbDir, 'chess_python_game.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables using schema.sql
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  fs.readFile(schemaPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading schema file:', err.message);
      return;
    }
    
    // Execute schema SQL statements
    db.exec(data, (err) => {
      if (err) {
        console.error('Error initializing database schema:', err.message);
      } else {
        console.log('Database schema initialized successfully');
        // Populate initial data if tables are empty
        checkAndPopulateQuestions();
      }
    });
  });
}

// Check if questions table is empty and populate with initial data if needed
function checkAndPopulateQuestions() {
  db.get('SELECT COUNT(*) as count FROM questions', (err, row) => {
    if (err) {
      console.error('Error checking questions table:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('Populating questions table with initial data...');
      populateQuestionsTable();
    }
  });
}

// Add initial Python loop questions
function populateQuestionsTable() {
  const questions = [
    {
      question: 'What is the output of the following code?\n\nfor i in range(5):\n    print(i)',
      options: JSON.stringify(['0 1 2 3 4', '1 2 3 4 5', '0 1 2 3 4 5', '0 1 2 3']),
      correct_answer: '0 1 2 3 4',
      difficulty: 'easy',
      chess_position: 'A1'
    },
    {
      question: 'Which loop is used when you want to repeat a block of code an unknown number of times until a condition is met?',
      options: JSON.stringify(['for loop', 'while loop', 'do-while loop', 'repeat loop']),
      correct_answer: 'while loop',
      difficulty: 'easy',
      chess_position: 'A2'
    },
    {
      question: 'What is the output of this code?\n\nfor i in range(1, 10, 2):\n    print(i, end=" ")',
      options: JSON.stringify(['1 3 5 7 9', '1 2 3 4 5 6 7 8 9', '2 4 6 8', '0 2 4 6 8']),
      correct_answer: '1 3 5 7 9',
      difficulty: 'medium',
      chess_position: 'A3'
    },
    {
      question: 'How do you exit a loop prematurely in Python?',
      options: JSON.stringify(['exit', 'break', 'return', 'continue']),
      correct_answer: 'break',
      difficulty: 'easy',
      chess_position: 'A4'
    },
    {
      question: 'What does the "continue" statement do in a loop?',
      options: JSON.stringify(['Exits the loop completely', 'Skips the current iteration and continues with the next', 'Pauses the loop execution', 'Restarts the loop from the beginning']),
      correct_answer: 'Skips the current iteration and continues with the next',
      difficulty: 'medium',
      chess_position: 'A5'
    },
    {
      question: 'What will be the output of this code?\n\ni = 0\nwhile i < 5:\n    if i == 3:\n        break\n    print(i)\n    i += 1',
      options: JSON.stringify(['0 1 2', '0 1 2 3 4', '0 1 2 3', '0 1 2 4']),
      correct_answer: '0 1 2',
      difficulty: 'medium',
      chess_position: 'A6'
    },
    {
      question: 'How do you iterate through a list named "fruits" in Python?',
      options: JSON.stringify(['for fruit in fruits:', 'foreach fruit in fruits:', 'for (fruit in fruits)', 'loop through fruits:']),
      correct_answer: 'for fruit in fruits:',
      difficulty: 'easy',
      chess_position: 'A7'
    },
    {
      question: 'What is the output of this nested loop?\n\nfor i in range(3):\n    for j in range(2):\n        print(i, j)',
      options: JSON.stringify(['0 0, 0 1, 1 0, 1 1, 2 0, 2 1', '0 0, 1 0, 2 0, 0 1, 1 1, 2 1', '0 0, 0 1, 0 2, 1 0, 1 1, 1 2', '0 0, 1 1, 2 2']),
      correct_answer: '0 0, 0 1, 1 0, 1 1, 2 0, 2 1',
      difficulty: 'hard',
      chess_position: 'A8'
    },
    // Add more questions for other chess positions
    {
      question: 'What Python loop would you use to iterate through a dictionary\'s keys and values simultaneously?',
      options: JSON.stringify(['for k, v in dict.items():', 'for k, v in dict:', 'foreach k, v in dict:', 'for (k, v) in dict.items():']),
      correct_answer: 'for k, v in dict.items():',
      difficulty: 'medium',
      chess_position: 'B1'
    },
    {
      question: 'How do you create an infinite loop in Python?',
      options: JSON.stringify(['while True:', 'for i in infinite:', 'loop forever:', 'while 1 == 1:']),
      correct_answer: 'while True:',
      difficulty: 'easy',
      chess_position: 'B2'
    },
    // Add more positions as needed to cover the chess board
  ];
  
  const stmt = db.prepare('INSERT INTO questions (question, options, correct_answer, difficulty, chess_position) VALUES (?, ?, ?, ?, ?)');
  
  questions.forEach((q) => {
    stmt.run(q.question, q.options, q.correct_answer, q.difficulty, q.chess_position);
  });
  
  stmt.finalize();
  console.log('Questions table populated successfully');
}

// Database query methods
const dbMethods = {
  // User related methods
  createUser: (username, email, password) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      db.run(query, [username, email, password], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  },
  
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE username = ?';
      db.get(query, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Question related methods
  getQuestionByPosition: (position) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM questions WHERE chess_position = ?';
      db.get(query, [position], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            // Parse options JSON string to array
            row.options = JSON.parse(row.options);
          }
          resolve(row);
        }
      });
    });
  },
  
  getAllQuestions: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM questions';
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse options JSON string to array for each row
          rows.forEach(row => {
            row.options = JSON.parse(row.options);
          });
          resolve(rows);
        }
      });
    });
  },

  // Game related methods
  createGame: (userId) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO games (user_id, start_time) VALUES (?, datetime("now"))';
      db.run(query, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ gameId: this.lastID });
        }
      });
    });
  },
  
  endGame: (gameId, score) => {
    return new Promise((resolve, reject) => {
      const query = 'UPDATE games SET end_time = datetime("now"), score = ? WHERE id = ?';
      db.run(query, [score, gameId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      });
    });
  },
  
  recordMove: (gameId, position, questionId, answeredCorrectly) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO moves (game_id, position, question_id, answered_correctly, timestamp) VALUES (?, ?, ?, ?, datetime("now"))';
      db.run(query, [gameId, position, questionId, answeredCorrectly ? 1 : 0], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  },

  // Leaderboard related methods
  getLeaderboard: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.username, g.score, g.end_time 
        FROM games g
        JOIN users u ON g.user_id = u.id
        WHERE g.end_time IS NOT NULL
        ORDER BY g.score DESC
        LIMIT 10
      `;
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  
  getUserStats: (userId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_games,
          SUM(score) as total_score,
          AVG(score) as avg_score,
          MAX(score) as highest_score
        FROM games
        WHERE user_id = ? AND end_time IS NOT NULL
      `;
      db.get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};

module.exports = dbMethods;