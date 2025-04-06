/**
 * QR Code utility functions for the Chess Python Learning Game
 * This file contains functions for generating and handling QR codes
 */

// Import QR Code library (you'll need to install it: npm install qrcode)
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Directory to store generated QR codes
const QR_DIR = path.join(__dirname, 'public', 'qrcodes');

// Ensure the directory exists
if (!fs.existsSync(QR_DIR)){
  fs.mkdirSync(QR_DIR, { recursive: true });
}

/**
 * Generate a QR code for a chess position
 * @param {string} position - Chess board position (e.g., "A1", "C4")
 * @param {string} baseUrl - Base URL for the app (used in QR code content)
 * @returns {Promise<string>} - Path to the generated QR code image
 */
async function generatePositionQRCode(position, baseUrl) {
  // Create a URL that will open the game with the specific position
  const url = `${baseUrl}/game.html?position=${position}`;
  
  // File path for the QR code image
  const filePath = path.join(QR_DIR, `${position}.png`);
  
  try {
    // Generate QR code
    await QRCode.toFile(filePath, url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300
    });
    
    console.log(`QR code generated for position ${position}`);
    return `/qrcodes/${position}.png`;
  } catch (error) {
    console.error(`Error generating QR code for position ${position}:`, error);
    throw error;
  }
}

/**
 * Generate QR codes for all chess positions
 * @param {string} baseUrl - Base URL for the app
 * @returns {Promise<void>}
 */
async function generateAllPositionQRCodes(baseUrl) {
  const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const rows = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  console.log('Generating QR codes for all chess positions...');
  
  for (const col of columns) {
    for (const row of rows) {
      const position = `${col}${row}`;
      await generatePositionQRCode(position, baseUrl);
    }
  }
  
  console.log('All QR codes generated successfully!');
}

module.exports = {
  generatePositionQRCode,
  generateAllPositionQRCodes
};