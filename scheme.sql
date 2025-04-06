-- Database schema for Chess Python Learning Game

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table for Python loops
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  explanation TEXT
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Moves/Questions answered table
CREATE TABLE IF NOT EXISTS moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_session_id INTEGER,
  question_id INTEGER,
  chess_position TEXT NOT NULL,
  answered_correctly BOOLEAN,
  time_taken INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions (id),
  FOREIGN KEY (question_id) REFERENCES questions (id)
);

-- Sample Python loop questions
INSERT INTO questions 
  (question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, explanation) 
VALUES
  (
    'What will be the output of the following code?\n\nfor i in range(5):\n    print(i)',
    '0 1 2 3 4',
    '1 2 3 4 5',
    '0 1 2 3 4 5',
    '1 2 3 4',
    'a',
    'easy',
    'The range(5) function generates numbers from 0 to 4, inclusive.'
  ),
  (
    'Which loop is guaranteed to execute at least once?',
    'for loop',
    'while loop',
    'do-while loop',
    'None of the above',
    'c',
    'easy',
    'A do-while loop always executes its body at least once before checking the condition.'
  ),
  (
    'What does the ''continue'' statement do in a loop?',
    'Exits the loop entirely',
    'Skips the rest of the current iteration and moves to the next one',
    'Skips the next iteration',
    'Pauses the loop execution',
    'b',
    'medium',
    'The continue statement skips the rest of the current iteration and goes to the next iteration.'
  ),
  (
    'What will be the output of this code?\n\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1',
    '1 2 3 4 5',
    '0 1 2 3 4',
    '0 1 2 3 4 5',
    '1 2 3 4',
    'b',
    'easy',
    'The loop starts with count=0 and prints values until count is 4, incrementing after each print.'
  ),
  (
    'How do you iterate through a list and get both the index and value of each item?',
    'for i, v in list:',
    'for i, v in enumerate(list):',
    'for i in range(len(list)):',
    'for index, value in iterate(list):',
    'b',
    'medium',
    'The enumerate() function returns pairs of indices and values from an iterable.'
  ),
  (
    'What''s the output of this nested loop?\n\nfor i in range(3):\n    for j in range(2):\n        print(i, j)',
    '0,0 0,1 1,0 1,1 2,0 2,1',
    '0,0 1,0 2,0 0,1 1,1 2,1',
    '0,0 0,1 1,1 1,2 2,1 2,2',
    '0,1 0,2 1,1 1,2 2,1 2,2',
    'a',
    'medium',
    'The outer loop runs 3 times (0,1,2) and for each iteration, the inner loop runs twice (0,1).'
  ),
  (
    'What will be the value of total after this code executes?\n\ntotal = 0\nfor num in range(1, 6):\n    if num % 2 == 0:\n        total += num',
    '6',
    '15',
    '9',
    '8',
    'a',
    'medium',
    'Only even numbers (2 and 4) are added to the total: 0+2+4=6'
  ),
  (
    'What does this loop do?\n\nfor i in range(10, 0, -1):\n    print(i)',
    'Prints numbers from 10 to 1 in descending order',
    'Prints numbers from 10 to 0 in descending order',
    'Prints numbers from 0 to 10 in ascending order',
    'Causes an infinite loop',
    'a',
    'medium',
    'range(10, 0, -1) generates numbers from 10 down to 1 with a step of -1.'
  ),
  (
    'What''s the purpose of the ''else'' clause in a for loop?',
    'It executes if the loop condition becomes false',
    'It executes if the loop completes normally (without break)',
    'It''s not valid syntax in Python',
    'It executes for each iteration that doesn''t match an if condition',
    'b',
    'hard',
    'The else clause in a for loop runs when the loop completes normally, without encountering a break statement.'
  ),
  (
    'What will this code print?\n\nx = [1, 2, 3]\nfor i in x:\n    x.append(i)\n    if len(x) > 10:\n        break\n    print(len(x))',
    '4 5 6',
    '4 5 6 7 8 9 10',
    'Will cause an infinite loop',
    '3 6 9',
    'b',
    'hard',
    'The loop keeps appending to the list it''s iterating over, printing the new length until it exceeds 10.'
  );