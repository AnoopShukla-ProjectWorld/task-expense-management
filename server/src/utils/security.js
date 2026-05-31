const crypto = require("crypto");
const svgCaptcha = require("svg-captcha");

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
 * Generate CAPTCHA text and its hash token as a secure Base64 vector path image
 */
const generateCaptcha = () => {
  const captcha = svgCaptcha.create({
    size: 6,
    noise: 3,
    color: true,
    background: '#f8fafc',
    width: 200,
    height: 60,
    fontSize: 44,
    charPreset: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // Removed ambiguous characters
  });

  const hash = hashString(captcha.text.toUpperCase());
  
  // Convert pure SVG string (which only has paths, NO text nodes) to Base64 Image URI
  const base64 = Buffer.from(captcha.data).toString("base64");
  const dataUri = `data:image/svg+xml;base64,${base64}`;

    return {
      image: dataUri, // Send visual representation
      hash,          // Send SHA-256 hash to verify
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
