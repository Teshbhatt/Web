// main.js - Frontend logic for Python Chess Educational Game
// Handles: Authentication, Game Mechanics, QR Integration, API Communication

// DOM Elements - Will be populated on page load
let currentUser = null;
let gameState = null;
let currentQuestionData = null;
let qrScanner = null;
let chessBoard = null;
let isCameraActive = false;

// Page initialization based on current URL
document.addEventListener('DOMContentLoaded', () => {
    // Check user authentication status
    checkAuthStatus();
    
    // Initialize appropriate page functionality
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('game.html')) {
        initializeGamePage();
    } else if (currentPath.includes('leaderboard.html')) {
        initializeLeaderboardPage();
    } else {
        // Default to index page (login/registration)
        initializeIndexPage();
    }
});

// ==================== Authentication Functions ====================

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // If not on index page, redirect to login
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = '/index.html';
        }
        return;
    }
    
    // Validate token with the server
    fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (response.ok) return response.json();
        throw new Error('Invalid token');
    })
    .then(data => {
        currentUser = data.user;
        updateUserInterface();
    })
    .catch(error => {
        console.error('Auth validation error:', error);
        localStorage.removeItem('authToken');
        // Only redirect if not already on index page
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = '/index.html';
        }
    });
}

function login(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            currentUser = data.user;
            window.location.href = '/game.html';
        } else {
            showNotification('Login failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.');
    });
}

function register(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value; // Fixed ID here
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match');
        return;
    }
    
    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Registration successful! Please log in.');
            toggleAuthForm('login');
        } else {
            showNotification('Registration failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.');
    });
}

function showTab(tabName) {
    if (tabName === 'login') {
        toggleAuthForm('login');
    } else if (tabName === 'register') {
        toggleAuthForm('register');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    window.location.href = '/index.html';
}

function toggleAuthForm(formType) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (formType === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

// ==================== Game Page Functions ====================

function initializeGamePage() {
    // Set up game board
    initializeChessBoard();
    
    // Set up QR scanner button
    const scannerToggleBtn = document.getElementById('toggle-scanner');
    if (scannerToggleBtn) {
        scannerToggleBtn.addEventListener('click', toggleQRScanner);
    }
    
    // Fetch player stats and update UI
    fetchPlayerStats();
    
    // Add event listeners for game controls
    const submitAnswerBtn = document.getElementById('submit-answer');
    if (submitAnswerBtn) {
        submitAnswerBtn.addEventListener('click', submitAnswer);
    }
    
    // Check for position and question parameters (from QR code)
    const urlParams = new URLSearchParams(window.location.search);
    const position = urlParams.get('position');
    const questionId = urlParams.get('question');
    
    if (position && questionId) {
        moveToPositionAndLoadQuestion(position, questionId);
    }
}

function initializeChessBoard() {
    const boardElement = document.getElementById('chess-board');
    if (!boardElement) return;
    
    // Clear any existing board
    boardElement.innerHTML = '';
    
    // Create chess board grid (8x8)
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'chess-square ' + ((row + col) % 2 === 0 ? 'light' : 'dark');
            
            // Create position identifier (e.g., "A1", "B2")
            const position = String.fromCharCode(65 + col) + (8 - row);
            square.dataset.position = position;
            
            // Add click event for square selection
            square.addEventListener('click', () => selectSquare(position));
            
            boardElement.appendChild(square);
        }
    }
    
    // Initialize game state
    fetchGameState();
}

function fetchGameState() {
    const token = localStorage.getItem('authToken');
    
    fetch('/api/game/state', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        gameState = data;
        updateChessBoard();
    })
    .catch(error => {
        console.error('Error fetching game state:', error);
        showNotification('Failed to load game state');
    });
}

function updateChessBoard() {
    if (!gameState || !gameState.pieces) return;
    
    // Clear existing pieces
    const squares = document.querySelectorAll('.chess-square');
    squares.forEach(square => {
        const pieceElement = square.querySelector('.chess-piece');
        if (pieceElement) {
            square.removeChild(pieceElement);
        }
    });
    
    // Place pieces according to game state
    gameState.pieces.forEach(piece => {
        const square = document.querySelector(`.chess-square[data-position="${piece.position}"]`);
        if (square) {
            const pieceElement = document.createElement('div');
            pieceElement.className = `chess-piece ${piece.color} ${piece.type}`;
            square.appendChild(pieceElement);
        }
    });
    
    // Update game status display
    updateGameStatus();
}

function updateGameStatus() {
    const statusElement = document.getElementById('game-status');
    if (!statusElement || !gameState) return;
    
    statusElement.textContent = `Current turn: ${gameState.currentTurn}`;
    
    // If a question is active, show the question panel
    if (gameState.activeQuestion) {
        loadQuestion(gameState.activeQuestion);
    }
}

function selectSquare(position) {
    if (!currentUser || !gameState) return;
    
    // If a question is already active, can't move until answered
    if (gameState.activeQuestion) {
        showNotification('Answer the current question before making a move');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    
    fetch('/api/game/move', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            gameState = data.gameState;
            updateChessBoard();
            
            // If move triggers a question
            if (data.question) {
                loadQuestion(data.question.id);
            }
        } else {
            showNotification(data.message || 'Invalid move');
        }
    })
    .catch(error => {
        console.error('Error processing move:', error);
        showNotification('Failed to process move');
    });
}

function loadQuestion(questionId) {
    const token = localStorage.getItem('authToken');
    
    fetch(`/api/game/question/${questionId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.question) {
            displayQuestion(data.question);
            currentQuestionData = data.question;
        } else {
            showNotification('Failed to load question');
        }
    })
    .catch(error => {
        console.error('Error loading question:', error);
        showNotification('Failed to load question');
    });
}

function displayQuestion(question) {
    const questionPanel = document.getElementById('question-panel');
    const questionText = document.getElementById('question-text');
    const answerOptions = document.getElementById('answer-options');
    
    if (!questionPanel || !questionText || !answerOptions) return;
    
    // Display the question
    questionText.textContent = question.text;
    
    // Clear previous options
    answerOptions.innerHTML = '';
    
    // Create answer options based on question type
    if (question.type === 'multiple-choice') {
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'answer-option';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'answer';
            radio.id = `option-${index}`;
            radio.value = option;
            
            const label = document.createElement('label');
            label.htmlFor = `option-${index}`;
            label.textContent = option;
            
            optionElement.appendChild(radio);
            optionElement.appendChild(label);
            answerOptions.appendChild(optionElement);
        });
    } else if (question.type === 'code-completion') {
        // Create a textarea for code completion
        const codeArea = document.createElement('textarea');
        codeArea.className = 'code-answer';
        codeArea.id = 'code-answer';
        codeArea.rows = 5;
        codeArea.placeholder = 'Write your Python code here...';
        
        // Pre-fill with partial code if provided
        if (question.partialCode) {
            codeArea.value = question.partialCode;
        }
        
        answerOptions.appendChild(codeArea);
    }
    
    // Show the question panel
    questionPanel.style.display = 'block';
}

function submitAnswer() {
    if (!currentQuestionData) {
        showNotification('No active question');
        return;
    }
    
    let answer;
    
    // Get the answer based on question type
    if (currentQuestionData.type === 'multiple-choice') {
        const selectedOption = document.querySelector('input[name="answer"]:checked');
        if (!selectedOption) {
            showNotification('Please select an answer');
            return;
        }
        answer = selectedOption.value;
    } else if (currentQuestionData.type === 'code-completion') {
        const codeArea = document.getElementById('code-answer');
        if (!codeArea || !codeArea.value.trim()) {
            showNotification('Please enter your code');
            return;
        }
        answer = codeArea.value;
    }
    
    const token = localStorage.getItem('authToken');
    
    fetch('/api/game/answer', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            questionId: currentQuestionData.id,
            answer: answer
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.correct) {
            showNotification('Correct! ' + (data.points ? `+${data.points} points` : ''));
        } else {
            showNotification('Incorrect. ' + (data.explanation || ''));
        }
        
        // Update game state
        gameState = data.gameState;
        updateChessBoard();
        
        // Hide the question panel
        const questionPanel = document.getElementById('question-panel');
        if (questionPanel) {
            questionPanel.style.display = 'none';
        }
        
        // Clear current question
        currentQuestionData = null;
        
        // Update player stats
        fetchPlayerStats();
    })
    .catch(error => {
        console.error('Error submitting answer:', error);
        showNotification('Failed to submit answer');
    });
}

function fetchPlayerStats() {
    if (!currentUser) return;
    
    const token = localStorage.getItem('authToken');
    
    fetch('/api/user/stats', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        updatePlayerStats(data);
    })
    .catch(error => {
        console.error('Error fetching player stats:', error);
    });
}

function updatePlayerStats(stats) {
    const statsContainer = document.getElementById('player-stats');
    if (!statsContainer) return;
    
    // Update stats display
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Score:</span>
            <span class="stat-value">${stats.score}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Games:</span>
            <span class="stat-value">${stats.gamesPlayed}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Correct:</span>
            <span class="stat-value">${stats.correctAnswers}</span>
        </div>
    `;
}

// ==================== QR Code Scanner Functions ====================

function toggleQRScanner() {
    const scannerContainer = document.getElementById('qr-scanner');
    const scannerToggleBtn = document.getElementById('toggle-scanner');
    
    if (!scannerContainer || !scannerToggleBtn) return;
    
    if (isCameraActive) {
        // Stop the scanner
        if (qrScanner) {
            qrScanner.stop();
            qrScanner = null;
        }
        scannerContainer.style.display = 'none';
        scannerToggleBtn.textContent = 'Scan QR Code';
        isCameraActive = false;
    } else {
        // Start the scanner
        scannerContainer.style.display = 'block';
        scannerToggleBtn.textContent = 'Close Scanner';
        
        // Initialize QR scanner if not already done
        if (!qrScanner) {
            initializeQRScanner();
        } else {
            qrScanner.start();
        }
        
        isCameraActive = true;
    }
}

function initializeQRScanner() {
    const scannerContainer = document.getElementById('qr-scanner');
    if (!scannerContainer) return;
    
    // Create video element if it doesn't exist
    let videoElement = document.getElementById('qr-video');
    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.id = 'qr-video';
        scannerContainer.appendChild(videoElement);
    }
    
    // Set up the scanner using html5-qrcode library
    // This assumes the library is included in your HTML
    qrScanner = new Html5Qrcode("qr-scanner");
    
    const qrConfig = { fps: 10, qrbox: 250 };
    
    qrScanner.start(
        { facingMode: "environment" },
        qrConfig,
        onQRCodeSuccess,
        onQRCodeError
    );
}

function onQRCodeSuccess(decodedText) {
    // Stop scanner after successful scan
    if (qrScanner) {
        qrScanner.stop();
    }
    
    // Process the QR code (expects URL with position and question params)
    try {
        const url = new URL(decodedText);
        const params = new URLSearchParams(url.search);
        const position = params.get('position');
        const questionId = params.get('question');
        
        if (position && questionId) {
            moveToPositionAndLoadQuestion(position, questionId);
        } else {
            showNotification('Invalid QR code format');
        }
    } catch (error) {
        console.error('Error parsing QR code:', error);
        showNotification('Invalid QR code');
    }
    
    // Reset scanner
    toggleQRScanner();
}

function onQRCodeError(error) {
    // Just log errors, don't show to user unless scanning fails completely
    console.error('QR scan error:', error);
}

function moveToPositionAndLoadQuestion(position, questionId) {
    // First select the position on the board
    selectSquare(position);
    
    // Then load the specific question
    loadQuestion(questionId);
    
    // Update URL without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set('position', position);
    url.searchParams.set('question', questionId);
    window.history.pushState({}, '', url);
}

// ==================== Leaderboard Page Functions ====================

function initializeLeaderboardPage() {
    fetchLeaderboardData();
}

function fetchLeaderboardData() {
    fetch('/api/leaderboard', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        displayLeaderboard(data);
    })
    .catch(error => {
        console.error('Error fetching leaderboard:', error);
        showNotification('Failed to load leaderboard data');
    });
}

function displayLeaderboard(leaderboardData) {
    const leaderboardContainer = document.getElementById('leaderboard-table');
    if (!leaderboardContainer) return;
    
    // Clear existing data
    leaderboardContainer.innerHTML = '';
    
    // Create table headers
    const tableHeader = document.createElement('thead');
    tableHeader.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Score</th>
            <th>Games Played</th>
            <th>Correct Answers</th>
        </tr>
    `;
    leaderboardContainer.appendChild(tableHeader);
    
    // Create table body
    const tableBody = document.createElement('tbody');
    
    // Add each player to the leaderboard
    leaderboardData.forEach((player, index) => {
        const row = document.createElement('tr');
        
        // Highlight current user
        if (currentUser && player.username === currentUser.username) {
            row.className = 'current-user';
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.username}</td>
            <td>${player.score}</td>
            <td>${player.gamesPlayed}</td>
            <td>${player.correctAnswers}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    leaderboardContainer.appendChild(tableBody);
}

// ==================== Index Page Functions ====================

function initializeIndexPage() {
    // Set up login/register forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    
    if (loginForm) {
        loginForm.addEventListener('submit', login);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', register);
    }
    
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForm('login');
        });
    }
    
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthForm('register');
        });
    }
    
    // Show game info and screenshots
    displayGameInfo();
}

function displayGameInfo() {
    const gameInfoContainer = document.getElementById('game-info');
    if (!gameInfoContainer) return;
    
    // Display game information and screenshots
    gameInfoContainer.innerHTML = `
        <div class="info-section">
            <h2>Python Chess Challenge</h2>
            <p>Test your Python knowledge while playing chess! Each move on the chess board 
            presents a Python programming challenge. Answer correctly to gain advantages!</p>
            
            <div class="features">
                <div class="feature">
                    <h3>Learn Python</h3>
                    <p>Master important Python concepts through interactive challenges</p>
                </div>
                <div class="feature">
                    <h3>Play Chess</h3>
                    <p>Improve your chess skills while learning to code</p>
                </div>
                <div class="feature">
                    <h3>Compete</h3>
                    <p>Challenge friends and track your progress on the leaderboard</p>
                </div>
            </div>
        </div>
        <div class="screenshot-section">
            <img src="/images/game-screenshot.jpg" alt="Game Screenshot" class="screenshot">
        </div>
    `;
}

// ==================== Utility Functions ====================

function showNotification(message) {
    const notification = document.getElementById('notification') || createNotificationElement();
    
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function createNotificationElement() {
    const notification = document.createElement('div');
    notification.id = 'notification';
    document.body.appendChild(notification);
    return notification;
}

function updateUserInterface() {
    if (!currentUser) return;
    
    // Update user-related UI elements
    const usernameElements = document.querySelectorAll('.user-username');
    usernameElements.forEach(element => {
        element.textContent = currentUser.username;
    });
    
    // Show user-only sections
    const userOnlySections = document.querySelectorAll('.user-only');
    userOnlySections.forEach(section => {
        section.style.display = 'block';
    });
    
    // Hide guest-only sections
    const guestOnlySections = document.querySelectorAll('.guest-only');
    guestOnlySections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Setup logout buttons
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
}