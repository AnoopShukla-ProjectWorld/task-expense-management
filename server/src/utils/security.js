const crypto = require("crypto");

const CAPTCHA_SECRET = process.env.JWT_ACCESS_SECRET || "captcha_secret_key_123";

/**
 * Hash a string using SHA-256
 */
const hashString = (str) => {
  return crypto.createHmac("sha256", CAPTCHA_SECRET).update(str).digest("hex");
};

/**
 * Generate a cryptographically secure 6-digit OTP
 */
const generateOtp = () => {
  // Generates values from 100000 to 999999
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
};

/**
 * Generate CAPTCHA text and its hash token
 */
const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars like 0, O, I, 1, l
  let text = "";
  for (let i = 0; i < 6; i++) {
    text += chars.charAt(crypto.randomInt(0, chars.length));
  }
  
  const hash = hashString(text.toUpperCase());
  return {
    text, // Send text to draw on canvas
    hash, // Send hash to verify on submit
  };
};

/**
 * Verify CAPTCHA input against hash
 */
const verifyCaptcha = (input, hash) => {
  if (!input || !hash) return false;
  return hashString(input.trim().toUpperCase()) === hash;
};

module.exports = {
  hashString,
  generateOtp,
  generateCaptcha,
  verifyCaptcha,
};
