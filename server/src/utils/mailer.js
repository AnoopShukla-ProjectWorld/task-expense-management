const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer Transporter using environment variables
 */
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Core sendMail function
 * Attempt real SMTP mailing, and fall back gracefully to console prints on any issues.
 */
const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Workspace Portal" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ""),
        html,
      });
      console.log(`✉️  [MAIL SERVICE] - Real SMTP Email successfully sent to ${to}: Message ID: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`⚠️ [MAIL SERVICE] - Real SMTP transmission failed: ${err.message}`);
      throw err;
    }
  } else {
    console.log(`ℹ️  [MAIL SERVICE] - SMTP credentials not found in env. Running console simulation.`);
  }

  // --- LOCAL SIMULATION FALLBACK ---
  console.log("\n" + "═".repeat(60));
  console.log(`✉️  [MAIL SERVICE - SIMULATION] - Outgoing Security Email`);
  console.log(`➡️  TO:      ${to}`);
  console.log(`➡️  SUBJECT: ${subject}`);
  console.log("─".repeat(60));
  
  if (text) {
    console.log(text);
  } else {
    const plainText = html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    console.log(plainText);
  }
  
  console.log("═".repeat(60) + "\n");
  
  return new Promise((resolve) => setTimeout(resolve, 100));
};

module.exports = {
  sendMail,
};
