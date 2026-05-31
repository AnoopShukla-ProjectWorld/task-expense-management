const bcrypt = require("bcrypt");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/apiResponse");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const {
  findUserByEmail,
  findUserByEmailOrMobile,
  findUserById,
  updateLastLogin,
  incrementFailedLoginAttempts,
  lockAccount,
  resetFailedLoginAttempts,
  saveRefreshToken,
  createSession,
  deactivateSession,
  saveOtpVerification,
  findOtpVerification,
  incrementOtpAttempts,
  invalidateOtp,
  savePasswordResetToken,
  findPasswordResetToken,
  usePasswordResetToken,
} = require("../repositories/authRepository");
const { createUser } = require("../repositories/userRepository");
const { generateCaptcha, verifyCaptcha, generateOtp, hashString } = require("../utils/security");
const { sendMail } = require("../utils/mailer");
const cookieOptions = require("../config/cookieConfig");

// ============================================
// GENERATE CAPTCHA ENDPOINT
// ============================================
const getCaptcha = asyncHandler(async (req, res) => {
  const captcha = generateCaptcha();
  return successResponse(res, 200, "CAPTCHA generated successfully", captcha);
});

const net = require("net");
const dns = require("dns");

// ============================================
// DNS MX & SMTP MAILBOX VALIDATION HELPERS
// ============================================
const resolveMxPromise = (domain) => {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve([]);
      } else {
        const sorted = addresses
          .sort((a, b) => a.priority - b.priority)
          .map((addr) => addr.exchange);
        resolve(sorted);
      }
    });
  });
};

const runSmtpCheck = (hosts, email) => {
  return new Promise((resolve) => {
    let index = 0;

    const tryNext = () => {
      if (index >= hosts.length) {
        // Safe fallback: if connection failed on all hosts, allow email
        return resolve(true);
      }

      const host = hosts[index];
      index++;

      const socket = new net.Socket();
      socket.setTimeout(2500); // 2.5s connection timeout

      let step = 0;
      let resolved = false;

      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        socket.destroy();
        resolve(result);
      };

      socket.connect(25, host);

      socket.on("connect", () => {
        // Connected! Wait for greeting
      });

      socket.on("timeout", () => {
        socket.destroy();
        tryNext();
      });

      socket.on("error", () => {
        tryNext();
      });

      socket.on("data", (data) => {
        const response = data.toString();
        const code = parseInt(response.substring(0, 3), 10);

        if (step === 0) {
          // Welcome response, expected 220
          if (code === 220) {
            socket.write("HELO task-expense-management.com\r\n");
            step = 1;
          } else {
            tryNext();
          }
        } else if (step === 1) {
          // HELO response, expected 250
          if (code === 250) {
            socket.write("MAIL FROM:<verify@task-expense-management.com>\r\n");
            step = 2;
          } else {
            tryNext();
          }
        } else if (step === 2) {
          // MAIL FROM response, expected 250
          if (code === 250) {
            socket.write(`RCPT TO:<${email.trim()}>\r\n`);
            step = 3;
          } else {
            tryNext();
          }
        } else if (step === 3) {
          // RCPT TO response
          if (code === 250) {
            socket.write("QUIT\r\n");
            finish(true);
          } else if (code >= 500 && code < 600) {
            // Permanent failure (550 User Unknown / Address not found / etc)
            socket.write("QUIT\r\n");
            finish(false);
          } else {
            socket.write("QUIT\r\n");
            finish(true);
          }
        }
      });
    };

    tryNext();
  });
};

const verifyMailbox = (email) => {
  return new Promise(async (resolve) => {
    const domain = email.trim().split("@")[1];
    const mxRecords = await resolveMxPromise(domain);
    if (mxRecords.length === 0) {
      dns.resolve4(domain, (err, addresses) => {
        if (err || !addresses || addresses.length === 0) {
          resolve(false); // No MX and no A record: domain doesn't exist
        } else {
          runSmtpCheck([domain], email).then(resolve);
        }
      });
      return;
    }
    runSmtpCheck(mxRecords, email).then(resolve);
  });
};

// ============================================
// INDIAN MOBILE VALIDATION RULES
// ============================================
const validateIndianMobile = (number) => {
  if (!/^[6-9]\d{9}$/.test(number)) return false;
  // Reject repeated patterns
  if (/^(\d)\1{9}$/.test(number)) return false;
  // Reject simple sequential patterns
  if (number === "1234567890") return false;
  return true;
};

// ============================================
// SEND EMAIL REGISTRATION OTP
// ============================================
const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, website } = req.body;

  // Honeypot Protection
  if (website) {
    return successResponse(res, 200, "OTP has been sent successfully to your registered email address.");
  }

  if (!email) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  // Validate format
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  if (!emailRegex.test(email)) {
    throw new AppError("Please enter a valid email address.", 400);
  }

  // SMTP Mailbox Existence Validation
  const isMailboxActive = await verifyMailbox(email);
  if (!isMailboxActive) {
    throw new AppError("The email address you entered does not exist. Please enter a valid active email address.", 400);
  }

  // Check if email already exists in active users
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new AppError("Email address is already registered", 400);
  }

  const otp = generateOtp();
  const otpHash = hashString(otp);
  const expiresAt = new Date(Date.now() + 90 * 1000); // 90 seconds expiry

  const emailDbKey = `${email.trim().toLowerCase()}_email`;

  // Check rate limiting / resends count
  const existingVerification = await findOtpVerification(emailDbKey);
  if (existingVerification && existingVerification.resend_attempts >= 3) {
    const timeSinceLastRequest = Date.now() - new Date(existingVerification.last_requested_at).getTime();
    if (timeSinceLastRequest < 60 * 1000) {
      throw new AppError("Too many resend attempts. Please wait a minute.", 429);
    }
  }

  // Send real/simulated Email OTP FIRST before saving it to the database
  try {
    await sendMail({
      to: email,
      subject: "Task & Expense Management - Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; text-align: center;">Email Verification Code</h2>
          <p style="font-size: 16px; color: #333333;">Use the following 6-digit verification code to complete your email verification at the time of signup:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #666666; text-align: center;">This code will expire in 90 seconds. If you did not request this, please ignore this email.</p>
        </div>
      `,
      text: `Your verification code is: ${otp}. It will expire in 90 seconds.`,
    });
  } catch (err) {
    throw new AppError(`Email delivery failed: ${err.message || "Please check your network and try again."}`, 400);
  }

  // Only store the OTP inside the database if the mail was successfully dispatched!
  await saveOtpVerification(emailDbKey, otpHash, expiresAt);

  return successResponse(res, 200, "OTP has been sent successfully to your registered email address.");
});

// ============================================
// VERIFY EMAIL OTP
// ============================================
const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const emailDbKey = `${email.trim().toLowerCase()}_email`;
  const verification = await findOtpVerification(emailDbKey);
  if (!verification) {
    throw new AppError("OTP expired. Please request a new OTP.", 400);
  }

  // Check attempts threshold
  if (verification.attempts >= 5) {
    await invalidateOtp(emailDbKey);
    throw new AppError("OTP expired. Please request a new OTP.", 400);
  }

  // Check expiration
  if (new Date() > new Date(verification.expires_at)) {
    await invalidateOtp(emailDbKey);
    throw new AppError("OTP expired. Please request a new OTP.", 400);
  }

  // Verify OTP
  const hashedInput = hashString(otp.trim());
  if (hashedInput !== verification.otp_hash) {
    await incrementOtpAttempts(emailDbKey);
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  // Mark verification session in database
  await invalidateOtp(emailDbKey);

  return successResponse(res, 200, "Email verified successfully.", { verified: true });
});

// ============================================
// SEND MOBILE OTP (Firebase Simulated Sandbox)
// ============================================
const sendMobileOtp = asyncHandler(async (req, res) => {
  const { email, mobile_number } = req.body;

  if (!email || !mobile_number) {
    throw new AppError("Email and Mobile number are required", 400);
  }

  // Validate Indian Mobile
  if (!validateIndianMobile(mobile_number)) {
    throw new AppError("Please enter a valid Indian mobile number.", 400);
  }

  // Check if mobile number already exists in active users
  const existingMobile = await findUserByEmailOrMobile(mobile_number);
  if (existingMobile) {
    throw new AppError("Mobile number is already registered", 400);
  }

  const otp = generateOtp();
  const otpHash = hashString(otp);
  const expiresAt = new Date(Date.now() + 90 * 1000); // 90 seconds expiry

  const mobileDbKey = `${email.trim().toLowerCase()}_mobile`;

  // Check rate limiting / resends count
  const existingVerification = await findOtpVerification(mobileDbKey);
  if (existingVerification && existingVerification.resend_attempts >= 3) {
    const timeSinceLastRequest = Date.now() - new Date(existingVerification.last_requested_at).getTime();
    if (timeSinceLastRequest < 60 * 1000) {
      throw new AppError("Too many resend attempts. Please wait a minute.", 429);
    }
  }

  await saveOtpVerification(mobileDbKey, otpHash, expiresAt);

  // Simulated Mobile OTP logged inside console for free sandbox multi-factor setup
  console.log(`📱 [SMS SERVICE] - Verification code sent to ${mobile_number}: [${otp}]`);

  return successResponse(res, 200, "OTP has been sent successfully to your mobile number.");
});

// ============================================
// VERIFY MOBILE OTP
// ============================================
const verifyMobileOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new AppError("Email and OTP are required", 400);
  }

  const mobileDbKey = `${email.trim().toLowerCase()}_mobile`;
  const verification = await findOtpVerification(mobileDbKey);
  if (!verification) {
    throw new AppError("OTP expired. Please request a new OTP.", 400);
  }

  // Check attempts threshold
  if (verification.attempts >= 5) {
    await invalidateOtp(mobileDbKey);
    throw new AppError("OTP expired. Please request a new OTP.", 400);
  }

  // Check expiration
  if (new Date() > new Date(verification.expires_at)) {
    await invalidateOtp(mobileDbKey);
    throw new AppError("OTP expired. Please request a new OTP.", 400);
  }

  // Verify OTP
  const hashedInput = hashString(otp.trim());
  if (hashedInput !== verification.otp_hash) {
    await incrementOtpAttempts(mobileDbKey);
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  // Mark verification session in database
  await invalidateOtp(mobileDbKey);

  return successResponse(res, 200, "Mobile number verified successfully.", { verified: true });
});

// ============================================
// PUBLIC REGISTER
// ============================================
const register = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, mobile_number, gender, date_of_birth, password, confirmPassword, captchaInput, captchaHash } = req.body;

  // Basic checks
  if (!first_name || !last_name || !email || !mobile_number || !gender || !date_of_birth || !password) {
    throw new AppError("All fields are required", 400);
  }

  // Enforce name alphabetical checks
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(first_name)) {
    throw new AppError("First name can only contain letters, spaces, hyphens, and apostrophes", 400);
  }
  if (!nameRegex.test(last_name)) {
    throw new AppError("Last name can only contain letters, spaces, hyphens, and apostrophes", 400);
  }

  // Enforce Gender Check
  if (!["Male", "Female", "Other"].includes(gender)) {
    throw new AppError("Gender selection is mandatory", 400);
  }

  if (password !== confirmPassword) {
    throw new AppError("Passwords do not match", 400);
  }

  // Enforce 18+ Validation
  const birthDate = new Date(date_of_birth);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  const m = new Date().getMonth() - birthDate.getMonth();
  if (age < 18 || (age === 18 && m < 0)) {
    throw new AppError("You must be 18 years or older to register", 400);
  }

  // Enforce Password Rules
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new AppError("Password does not meet enterprise security strength rules", 400);
  }

  // Enforce CAPTCHA Check
  if (!verifyCaptcha(captchaInput, captchaHash)) {
    throw new AppError("Invalid CAPTCHA validation. Please try again.", 400);
  }

  // Encrypt password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Generate a unique pending employee_id to satisfy SQL Server NOT NULL constraint
  const pendingEmployeeId = `PEND-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // Create pending account
  const newUser = await createUser({
    first_name: first_name.trim(),
    last_name: last_name.trim(),
    email: email.trim().toLowerCase(),
    employee_id: pendingEmployeeId,
    mobile_number: mobile_number.trim(),
    gender,
    date_of_birth,
    password_hash: passwordHash,
    role: null,
    status: "pending",
    email_verified: 0,
  });

  return successResponse(res, 201, "Account successfully submitted! Your registration is now pending administrator review and role assignment.", {
    user: {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      full_name: newUser.full_name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
    }
  });
});

// ============================================
// PUBLIC LOGIN (Unified Manager/Employee Portal)
// ============================================
const login = asyncHandler(async (req, res) => {
  const { emailOrMobile, password, captchaInput, captchaHash } = req.body;

  if (!emailOrMobile || !password) {
    throw new AppError("Credentials are required", 400);
  }

  // Find User
  const user = await findUserByEmailOrMobile(emailOrMobile);
  if (!user) {
    throw new AppError("Invalid email/mobile or password", 401);
  }

  // Check Account Lock status
  if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
    const diff = new Date(user.account_locked_until).getTime() - Date.now();
    const mins = Math.ceil(diff / (60 * 1000));
    throw new AppError(`This account has been temporarily locked due to too many failed attempts. Please try again in ${mins} minutes.`, 423);
  }

  // Failed login attempts limit and lockout are handled below via password verification, no CAPTCHA is requested for public users.

  // Validate Password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    await incrementFailedLoginAttempts(emailOrMobile);
    const newFailures = user.failed_login_attempts + 1;
    
    if (newFailures >= 5) {
      await lockAccount(emailOrMobile, 15);
      throw new AppError("Too many incorrect password attempts. Your account is locked for 15 minutes.", 423);
    }
    
    throw new AppError(`Invalid email/mobile or password. ${5 - newFailures} attempts remaining.`, 401);
  }

  // Verify Role Restrictions (Admin can NEVER log in via public portal)
  if (user.role === "admin") {
    throw new AppError("Access denied. Administrators must authenticate via the secure portal.", 403);
  }

  // Verify Approval State
  if (user.status === "pending") {
    throw new AppError("Your account registration is currently pending administrator review and approval.", 403);
  }

  if (user.status === "suspended") {
    throw new AppError("This account has been suspended by the administrator.", 403);
  }

  if (user.status === "rejected") {
    throw new AppError("This registration application has been rejected by the administrator.", 403);
  }

  // Clear failed log attempts
  await resetFailedLoginAttempts(emailOrMobile);

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role ? user.role.toUpperCase() : null, // Map to uppercase internally for compat
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  await createSession({ userId: user.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] });
  await updateLastLogin(user.id);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return successResponse(res, 200, "Login successful", {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role.toUpperCase(),
      profile_image: user.profile_image,
    }
  });
});

// ============================================
// SECRET ADMIN LOGIN
// ============================================
const secureAdminLogin = asyncHandler(async (req, res) => {
  const { email, password, secretPassphrase, captchaInput, captchaHash } = req.body;

  if (!email || !password || !secretPassphrase) {
    throw new AppError("All fields are required for administrative login", 400);
  }

  // Mandate CAPTCHA check on Admin portal unconditionally
  if (!verifyCaptcha(captchaInput, captchaHash)) {
    throw new AppError("Mandatory CAPTCHA validation failed.", 400);
  }

  // Enforce Secret Passphrase
  const systemPassphrase = process.env.ADMIN_SECRET_PASSPHRASE || "admin_portal_secret_2026";
  if (secretPassphrase !== systemPassphrase) {
    throw new AppError("Invalid administrative passphrase validation.", 401);
  }

  // Find User
  const user = await findUserByEmail(email);
  if (!user || user.role !== "admin") {
    throw new AppError("Invalid administrative credentials", 401);
  }

  // Check Lock status
  if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
    const diff = new Date(user.account_locked_until).getTime() - Date.now();
    const mins = Math.ceil(diff / (60 * 1000));
    throw new AppError(`Administrative account locked. Please try again in ${mins} minutes.`, 423);
  }

  // Validate Password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    await incrementFailedLoginAttempts(email);
    const newFailures = user.failed_login_attempts + 1;
    if (newFailures >= 5) {
      await lockAccount(email, 15);
      throw new AppError("Too many incorrect password attempts. Admin account locked for 15 minutes.", 423);
    }
    throw new AppError("Invalid administrative credentials", 401);
  }

  // Reset failures
  await resetFailedLoginAttempts(email);

  const payload = {
    id: user.id,
    email: user.email,
    role: "ADMIN",
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await saveRefreshToken(user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  await createSession({ userId: user.id, ipAddress: req.ip, userAgent: req.headers["user-agent"] });
  await updateLastLogin(user.id);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return successResponse(res, 200, "Administrative portal accessed successfully", {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: "ADMIN",
      profile_image: user.profile_image,
    }
  });
});

// ============================================
// FORGOT PASSWORD
// ============================================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const user = await findUserByEmail(email);
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashString(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    await savePasswordResetToken(user.id, tokenHash, expiresAt);

    // Send reset link email
    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
    
    await sendMail({
      to: email,
      subject: "Task & Expense Management - Reset Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
          <h2 style="color: #2563eb; text-align: center;">Reset Your Password</h2>
          <p style="font-size: 16px; color: #333333;">We received a request to reset the password for your Task & Expense Management account. Click the button below to restore access:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 12px; color: #666666;">This link is valid for 15 minutes and can only be used once. If you did not make this request, ignore this email.</p>
        </div>
      `,
      text: `Click the link to reset your password: ${resetUrl}`,
    });
  }

  return successResponse(res, 200, "If the email is registered, a password reset link has been dispatched.");
});

// ============================================
// RESET PASSWORD
// ============================================
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError("Token and Password are required", 400);
  }

  const tokenHash = hashString(token);
  const resetToken = await findPasswordResetToken(tokenHash);

  if (!resetToken) {
    throw new AppError("Invalid or expired password reset link", 400);
  }

  // Update password in db
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const { updateUser } = require("../repositories/userRepository");
  await updateUser(resetToken.user_id, { password_hash: passwordHash });
  await usePasswordResetToken(tokenHash);

  return successResponse(res, 200, "Password successfully updated! You can now log in.");
});

// ============================================
// REFRESH TOKEN (ROTATE TOKENS)
// ============================================
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    throw new AppError("Refresh token missing", 401);
  }

  const { findRefreshToken, revokeRefreshToken, saveRefreshToken } = require("../repositories/authRepository");
  const storedToken = await findRefreshToken(token);
  if (!storedToken) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const { verifyRefreshToken } = require("../utils/jwt");
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw new AppError("Expired refresh token", 401);
  }

  const payload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role.toUpperCase(),
  };

  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Rotate tokens
  await revokeRefreshToken(token);
  await saveRefreshToken(decoded.id, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return successResponse(res, 200, "Token refreshed successfully");
});

// ============================================
// GET CURRENT SESSION (getMe)
// ============================================
const getMe = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  return successResponse(res, 200, "Authenticated user retrieved", {
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role ? user.role.toUpperCase() : null,
      status: user.status,
      profile_image: user.profile_image,
    }
  });
});

// ============================================
// VERIFY CAPTCHA
// ============================================
const verifyCaptchaEndpoint = asyncHandler(async (req, res) => {
  const { captchaInput, captchaHash } = req.body;
  
  if (!captchaInput || !captchaHash) {
    throw new AppError("CAPTCHA input and hash are required", 400);
  }
  
  const isValid = verifyCaptcha(captchaInput, captchaHash);
  if (!isValid) {
    throw new AppError("Invalid CAPTCHA validation. Please try again.", 400);
  }
  
  return successResponse(res, 200, "CAPTCHA verified successfully.", { verified: true });
});

// ============================================
// LOGOUT
// ============================================
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const { revokeRefreshToken } = require("../repositories/authRepository");
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  return successResponse(res, 200, "Logout successful");
});

module.exports = {
  getCaptcha,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendMobileOtp,
  verifyMobileOtp,
  register,
  login,
  secureAdminLogin,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  verifyCaptchaEndpoint,
};