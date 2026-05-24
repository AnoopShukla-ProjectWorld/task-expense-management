import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaLock,
  FaCheckCircle,
  FaRedo,
  FaArrowRight,
  FaSpinner,
  FaVenusMars,
  FaShieldAlt,
  FaExclamationTriangle,
  FaInfoCircle
} from "react-icons/fa";
import {
  getCaptchaApi,
  verifyCaptchaApi,
  sendRegistrationOtpApi,
  verifyRegistrationOtpApi,
  sendMobileOtpApi,
  verifyMobileOtpApi,
  registerApi,
} from "../../services/authService";
import { auth } from "../../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const RegisterPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // States
  const [captchaText, setCaptchaText] = useState("");
  const [captchaHash, setCaptchaHash] = useState("");
  const [isCaptchaLoading, setIsCaptchaLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);
  
  // Email Verification states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailTimer, setEmailTimer] = useState(0);
  const [hasSentEmailAtLeastOnce, setHasSentEmailAtLeastOnce] = useState(false);

  // Mobile Verification states
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobileOtp, setIsVerifyingMobileOtp] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileOtpCode, setMobileOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [mobileTimer, setMobileTimer] = useState(0);
  const [hasSentMobileAtLeastOnce, setHasSentMobileAtLeastOnce] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: ""
    }
  });

  const passwordVal = watch("password", "");
  const emailVal = watch("email", "");
  const mobileVal = watch("mobile_number", "");

  // Password strength logic
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Weak", color: "bg-red-500" });

  useEffect(() => {
    if (!passwordVal) {
      setPasswordStrength({ score: 0, text: "None", color: "bg-slate-300 dark:bg-slate-800" });
      return;
    }
    let score = 0;
    if (passwordVal.length >= 8) score++;
    if (/[A-Z]/.test(passwordVal)) score++;
    if (/[a-z]/.test(passwordVal)) score++;
    if (/[0-9]/.test(passwordVal)) score++;
    if (/[@$!%*?&]/.test(passwordVal)) score++;

    let text = "Weak";
    let color = "bg-red-500";
    if (score >= 4) {
      text = "Strong";
      color = "bg-emerald-500 shadow-lg shadow-emerald-500/30";
    } else if (score >= 3) {
      text = "Medium";
      color = "bg-amber-500 shadow-lg shadow-amber-500/30";
    }
    setPasswordStrength({ score, text, color });
  }, [passwordVal]);

  // OTP Countdown Timer Hooks & Formatting
  useEffect(() => {
    let emailInterval = null;
    if (emailTimer > 0) {
      emailInterval = setInterval(() => {
        setEmailTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (emailInterval) clearInterval(emailInterval);
    };
  }, [emailTimer]);

  useEffect(() => {
    let mobileInterval = null;
    if (mobileTimer > 0) {
      mobileInterval = setInterval(() => {
        setMobileTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (mobileInterval) clearInterval(mobileInterval);
    };
  }, [mobileTimer]);

  // Clean Side Effects on Expiry
  useEffect(() => {
    if (emailTimer === 0 && emailOtpSent) {
      setEmailOtpSent(false);
      setEmailOtpCode("");
      setIsSendingEmailOtp(false); // Clear infinite loading state
      toast.error("Email verification code expired. Please request a new OTP.");
    }
  }, [emailTimer, emailOtpSent]);

  useEffect(() => {
    if (mobileTimer === 0 && mobileOtpSent) {
      setMobileOtpSent(false);
      setMobileOtpCode("");
      setIsSendingMobileOtp(false); // Clear infinite loading state
      toast.error("Mobile verification code expired. Please request a new OTP.");
    }
  }, [mobileTimer, mobileOtpSent]);

  const formatTimer = (timeInSeconds) => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Load CAPTCHA
  const fetchCaptcha = async () => {
    setIsCaptchaLoading(true);
    setCaptchaVerified(false);
    setValue("captchaInput", "");
    try {
      const response = await getCaptchaApi();
      if (response.success) {
        setCaptchaText(response.data.text);
        setCaptchaHash(response.data.hash);
      }
    } catch (err) {
      toast.error("Failed to generate CAPTCHA. Please refresh.");
    } finally {
      setIsCaptchaLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Draw CAPTCHA text on canvas
  useEffect(() => {
    if (canvasRef.current && captchaText) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background noise
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#f8fafc");
      gradient.addColorStop(1, "#cbd5e1");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distortions: draw random noise lines
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // Draw captcha text with unique distortions
      ctx.font = "bold 26px 'Outfit', sans-serif";
      ctx.textBaseline = "middle";
      const charWidth = canvas.width / 6;

      for (let i = 0; i < captchaText.length; i++) {
        ctx.fillStyle = ["#1e293b", "#2563eb", "#4f46e5", "#0d9488", "#b91c1c"][Math.floor(Math.random() * 5)];
        ctx.save();
        // Skew & rotate
        const x = i * charWidth + charWidth / 2;
        const y = canvas.height / 2 + (Math.random() * 8 - 4);
        const angle = (Math.random() * 40 - 20) * Math.PI / 180;
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(captchaText[i], -10, 10);
        ctx.restore();
      }

      // Add random dots
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }, [captchaText]);

  const validateIndianMobile = (number) => {
    if (!/^[6-9]\d{9}$/.test(number)) return false;
    // Reject repeated patterns
    if (/^(\d)\1{9}$/.test(number)) return false;
    // Reject sequential patterns
    if (number === "1234567890") return false;
    return true;
  };

  const handleVerifyCaptcha = async () => {
    const captchaInput = getValues("captchaInput");
    if (!captchaInput) {
      toast.error("Please enter the CAPTCHA code first.");
      return;
    }
    setIsVerifyingCaptcha(true);
    try {
      const response = await verifyCaptchaApi({
        captchaInput: captchaInput.trim().toUpperCase(),
        captchaHash: captchaHash
      });
      if (response.success) {
        setCaptchaVerified(true);
        toast.success("Anti-Bot Shield verification successful!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid CAPTCHA validation. Please try again.");
      setCaptchaVerified(false);
    } finally {
      setIsVerifyingCaptcha(false);
    }
  };

  // Request Email OTP verification
  const handleSendEmailOtp = async () => {
    // Validate fields above the email verification
    const isValid = await trigger(["first_name", "last_name", "gender", "date_of_birth", "email"]);
    if (!isValid) {
      const values = getValues();
      if (!values.first_name) {
        toast.error("First name is required");
        return;
      }
      if (!/^[a-zA-Z\s'-]*$/.test(values.first_name)) {
        toast.error("First name can only contain alphabetical characters");
        return;
      }
      if (!values.last_name) {
        toast.error("Last name is required");
        return;
      }
      if (!/^[a-zA-Z\s'-]*$/.test(values.last_name)) {
        toast.error("Last name can only contain alphabetical characters");
        return;
      }
      if (!values.gender) {
        toast.error("Gender selection is mandatory");
        return;
      }
      if (!values.date_of_birth) {
        toast.error("Date of birth is required.");
        return;
      }
      const ageRes = validateAge(values.date_of_birth);
      if (ageRes !== true) {
        toast.error(ageRes);
        return;
      }
      if (!values.email) {
        toast.error("Please enter a valid email address.");
        return;
      }
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      return;
    }

    const email = getValues("email");

    // Lock input field instantly (before the async API call begins)
    setIsSendingEmailOtp(true);
    // Clear any previous error/card state
    setEmailOtpSent(false);
    setEmailOtpCode("");
    setEmailTimer(0);

    try {
      const response = await sendRegistrationOtpApi({ email });
      if (response.success) {
        setEmailOtpSent(true);
        setEmailTimer(90);
        setHasSentEmailAtLeastOnce(true);
        setIsSendingEmailOtp(false); // Reset loader on success!
        toast.success("OTP has been sent successfully to your registered email address.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
      // Reset completely on failure
      setEmailOtpSent(false);
      setEmailOtpCode("");
      setEmailTimer(0);
      setIsSendingEmailOtp(false);
    }
  };

  // Verify Email OTP code
  const handleVerifyEmailOtp = async () => {
    const email = getValues("email");
    if (emailTimer === 0) {
      toast.error("OTP has expired. Please click 'Resend OTP' to get a new code.");
      return;
    }
    if (!emailOtpCode || emailOtpCode.trim().length !== 6) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    setIsVerifyingEmailOtp(true);
    try {
      const response = await verifyRegistrationOtpApi({ email, otp: emailOtpCode.trim() });
      if (response.success) {
        setEmailVerified(true);
        setEmailOtpSent(false);
        setEmailTimer(0);
        toast.success("Email verified successfully.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("expired")) {
        toast.error("OTP expired. Please request a new OTP.");
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  const initRecaptcha = () => {
    if (!auth) return null;
    try {
      if (window.recaptchaVerifier) {
        return window.recaptchaVerifier;
      }
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
          // Response expired
        }
      });
      window.recaptchaVerifier = verifier;
      return verifier;
    } catch (err) {
      console.error("Recaptcha initialization error:", err);
      return null;
    }
  };

  // Request Mobile OTP verification
  const handleSendMobileOtp = async () => {
    // Validate fields above mobile verification
    const isValid = await trigger(["first_name", "last_name", "gender", "date_of_birth", "mobile_number"]);
    if (!isValid) {
      const values = getValues();
      if (!values.first_name) {
        toast.error("First name is required");
        return;
      }
      if (!/^[a-zA-Z\s'-]*$/.test(values.first_name)) {
        toast.error("First name can only contain alphabetical characters");
        return;
      }
      if (!values.last_name) {
        toast.error("Last name is required");
        return;
      }
      if (!/^[a-zA-Z\s'-]*$/.test(values.last_name)) {
        toast.error("Last name can only contain alphabetical characters");
        return;
      }
      if (!values.gender) {
        toast.error("Gender selection is mandatory");
        return;
      }
      if (!values.date_of_birth) {
        toast.error("Date of birth is required.");
        return;
      }
      const ageRes = validateAge(values.date_of_birth);
      if (ageRes !== true) {
        toast.error(ageRes);
        return;
      }
      if (!values.mobile_number) {
        toast.error("Please enter a valid Indian mobile number.");
        return;
      }
      if (!validateIndianMobile(values.mobile_number)) {
        toast.error("Please enter a valid Indian mobile number.");
        return;
      }
      return;
    }

    const email = getValues("email");
    const mobile = getValues("mobile_number");

    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }

    // Lock input field instantly (before the async API call begins)
    setIsSendingMobileOtp(true);
    setMobileOtpSent(false);
    setMobileOtpCode("");
    setMobileTimer(0);

    if (auth) {
      // Live Firebase Auth Dispatches
      try {
        const verifier = initRecaptcha();
        if (!verifier) {
          throw new Error("Failed to initialize recaptcha verifier.");
        }
        const formattedMobile = `+91${mobile.trim()}`;
        const confirmation = await signInWithPhoneNumber(auth, formattedMobile, verifier);
        setConfirmationResult(confirmation);
        setMobileOtpSent(true);
        setMobileTimer(90);
        setHasSentMobileAtLeastOnce(true);
        setIsSendingMobileOtp(false); // Reset loader on success!
        toast.success("SMS verification code dispatched successfully!");
      } catch (err) {
        console.error("Firebase SMS send failed:", err);
        toast.error(err.message || "Failed to send SMS OTP. Please try again.");
        setMobileOtpSent(false);
        setMobileOtpCode("");
        setMobileTimer(0);
        setIsSendingMobileOtp(false);
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          } catch(e) {}
        }
      }
    } else {
      // Simulated Sandbox Fallback
      try {
        const response = await sendMobileOtpApi({ email, mobile_number: mobile });
        if (response.success) {
          setConfirmationResult(null);
          setMobileOtpSent(true);
          setMobileTimer(90);
          setHasSentMobileAtLeastOnce(true);
          setIsSendingMobileOtp(false); // Reset loader on success!
          toast.success("OTP has been sent successfully to your mobile number.");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
        setMobileOtpSent(false);
        setMobileOtpCode("");
        setMobileTimer(0);
        setIsSendingMobileOtp(false);
      }
    }
  };

  // Verify Mobile OTP code
  const handleVerifyMobileOtp = async () => {
    const email = getValues("email");
    if (mobileTimer === 0) {
      toast.error("OTP has expired. Please click 'Resend OTP' to get a new code.");
      return;
    }
    if (!mobileOtpCode || mobileOtpCode.trim().length !== 6) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    setIsVerifyingMobileOtp(true);

    if (confirmationResult) {
      // Live Firebase Verification
      try {
        await confirmationResult.confirm(mobileOtpCode.trim());
        setMobileVerified(true);
        setMobileOtpSent(false);
        setMobileTimer(0);
        toast.success("Mobile number verified successfully.");
      } catch (err) {
        console.error("Firebase verify failed:", err);
        toast.error("Invalid verification code. Please try again.");
      } finally {
        setIsVerifyingMobileOtp(false);
      }
    } else {
      // Simulated verification fallback
      try {
        const response = await verifyMobileOtpApi({ email, otp: mobileOtpCode.trim() });
        if (response.success) {
          setMobileVerified(true);
          setMobileOtpSent(false);
          setMobileTimer(0);
          toast.success("Mobile number verified successfully.");
        }
      } catch (err) {
        const msg = err.response?.data?.message || "";
        if (msg.toLowerCase().includes("expired")) {
          toast.error("OTP expired. Please request a new OTP.");
        } else {
          toast.error("Invalid OTP. Please try again.");
        }
      } finally {
        setIsVerifyingMobileOtp(false);
      }
    }
  };

  // Submit signup
  const onSubmit = async (data) => {
    if (!emailVerified || !mobileVerified) {
      toast.error("Verification of Email & Mobile is mandatory before registering.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerApi({
        ...data,
        captchaInput: data.captchaInput,
        captchaHash: captchaHash
      });

      if (response.success) {
        toast.success("Registration completed successfully.");
        navigate("/login");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("captcha")) {
        toast.error("Please complete CAPTCHA verification.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      fetchCaptcha(); // Refresh CAPTCHA on failure
      setIsSubmitting(false);
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    const year = today.getFullYear() - 18;
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 18+ birth validation
  const validateAge = (dob) => {
    if (!dob) return "Date of birth is required.";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 18 || "You must be at least 18 years old.";
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[var(--bg-primary)] overflow-y-auto py-12 px-4 transition-colors duration-300">
      
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-15%] w-[45%] h-[45%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-15%] w-[45%] h-[45%] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl z-10"
      >
        <div className="glass-panel bg-[var(--bg-secondary)] rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800/80 shadow-2xl relative">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white text-xl mb-3">
              <FaShieldAlt />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Create Employee Workspace Portal Account
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Fill details, verify credentials, and submit for Administrator activation
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* First Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  First Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    placeholder="Anoop"
                    {...register("first_name", { 
                      required: "First name is required",
                      pattern: {
                        value: /^[a-zA-Z\s'-]*$/,
                        message: "First name can only contain alphabetical characters"
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200 disabled:opacity-60"
                  />
                </div>
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.first_name.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    placeholder="Shukla"
                    {...register("last_name", { 
                      required: "Last name is required",
                      pattern: {
                        value: /^[a-zA-Z\s'-]*$/,
                        message: "Last name can only contain alphabetical characters"
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200 disabled:opacity-60"
                  />
                </div>
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.last_name.message}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaVenusMars />
                  </span>
                  <select
                    {...register("gender", { required: "Gender selection is mandatory" })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200 disabled:opacity-60 appearance-none cursor-pointer"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.gender.message}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaCalendarAlt />
                  </span>
                  <input
                    type="date"
                    max={getMaxDate()}
                    {...register("date_of_birth", { 
                      required: "Date of birth is required.",
                      validate: validateAge
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200 disabled:opacity-60"
                  />
                </div>
                {errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.date_of_birth.message}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                      <FaPhone />
                    </span>
                    <input
                      type="tel"
                      disabled={isSendingMobileOtp || mobileOtpSent || mobileVerified}
                      placeholder="9417000000"
                      {...register("mobile_number", { 
                        required: "Please enter a valid Indian mobile number.",
                        validate: (val) => validateIndianMobile(val) || "Please enter a valid Indian mobile number."
                      })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200 disabled:opacity-60"
                    />
                  </div>

                  {!mobileVerified && !mobileOtpSent && (
                    <button
                      type="button"
                      disabled={isSendingMobileOtp}
                      onClick={handleSendMobileOtp}
                      className="px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-blue-500/15 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingMobileOtp ? (
                        <FaSpinner className="animate-spin text-sm" />
                      ) : (
                        hasSentMobileAtLeastOnce ? "Resend Mobile OTP" : "Send Mobile OTP"
                      )}
                    </button>
                  )}

                  {mobileOtpSent && !mobileVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOtpSent(false);
                        setIsSendingMobileOtp(false);
                        setMobileOtpCode("");
                        setMobileTimer(0);
                        setHasSentMobileAtLeastOnce(false);
                        setConfirmationResult(null);
                        if (window.recaptchaVerifier) {
                          try {
                            window.recaptchaVerifier.clear();
                            window.recaptchaVerifier = null;
                          } catch(e) {}
                        }
                      }}
                      className="px-5 rounded-2xl bg-slate-250 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all duration-300 flex items-center cursor-pointer"
                    >
                      Change Mobile
                    </button>
                  )}
                </div>
                {errors.mobile_number && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.mobile_number.message}</p>
                )}

                {mobileVerified && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    <FaCheckCircle /> Mobile number verified successfully.
                  </div>
                )}

                {/* MOBILE OTP VERIFICATION CARD DISPLAY */}
                <AnimatePresence>
                  {mobileOtpSent && !mobileVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50 dark:bg-slate-900/40 p-5 border border-blue-500/20 rounded-2xl space-y-3 mt-3 w-full"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <FaInfoCircle /> Mobile Verification Code
                        </h4>
                        {mobileTimer > 0 ? (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            Expires in {formatTimer(mobileTimer)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg">
                            ⚠️ OTP Expired
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        We have sent a verification code to <strong>{mobileVal}</strong>. Please enter the 6-digit code below to verify your mobile:
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          disabled={mobileTimer === 0 || isVerifyingMobileOtp}
                          placeholder={mobileTimer === 0 ? "Expired" : "Enter 6-Digit Mobile OTP"}
                          value={mobileOtpCode}
                          onChange={(e) => setMobileOtpCode(e.target.value.replace(/\D/g, ""))}
                          className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-lg font-bold tracking-[6px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        />
                        {mobileTimer > 0 ? (
                          <button
                            type="button"
                            disabled={isVerifyingMobileOtp}
                            onClick={handleVerifyMobileOtp}
                            className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                          >
                            {isVerifyingMobileOtp ? <FaSpinner className="animate-spin text-sm" /> : "Verify Mobile OTP"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSendingMobileOtp}
                            onClick={handleSendMobileOtp}
                            className="px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                          >
                            {isSendingMobileOtp ? <FaSpinner className="animate-spin text-sm" /> : "Resend OTP"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Email Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      disabled={isSendingEmailOtp || emailOtpSent || emailVerified}
                      placeholder="name@company.com"
                      {...register("email", { 
                        required: "Please enter a valid email address.",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Please enter a valid email address."
                        }
                      })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200 disabled:opacity-60"
                    />
                  </div>

                  {!emailVerified && !emailOtpSent && (
                    <button
                      type="button"
                      disabled={isSendingEmailOtp}
                      onClick={handleSendEmailOtp}
                      className="px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-blue-500/15 cursor-pointer disabled:opacity-60"
                    >
                      {isSendingEmailOtp ? (
                        <FaSpinner className="animate-spin text-sm" />
                      ) : (
                        hasSentEmailAtLeastOnce ? "Resend Email OTP" : "Send Email OTP"
                      )}
                    </button>
                  )}

                  {emailOtpSent && !emailVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailOtpSent(false);
                        setIsSendingEmailOtp(false);
                        setEmailOtpCode("");
                        setEmailTimer(0);
                        setHasSentEmailAtLeastOnce(false);
                      }}
                      className="px-5 rounded-2xl bg-slate-250 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all duration-300 flex items-center cursor-pointer"
                    >
                      Change Email
                    </button>
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
                )}
                
                {emailVerified && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    <FaCheckCircle /> Email verified successfully.
                  </div>
                )}

                {/* EMAIL OTP VERIFICATION CARD DISPLAY */}
                <AnimatePresence>
                  {emailOtpSent && !emailVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50 dark:bg-slate-900/40 p-5 border border-blue-500/20 rounded-2xl space-y-3 mt-3 w-full"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                          <FaInfoCircle /> Email Verification Code
                        </h4>
                        {emailTimer > 0 ? (
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            Expires in {formatTimer(emailTimer)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg">
                            ⚠️ OTP Expired
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        We have sent a verification code to <strong>{emailVal}</strong>. Please enter the 6-digit code below to verify your email:
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          disabled={emailTimer === 0 || isVerifyingEmailOtp}
                          placeholder={emailTimer === 0 ? "Expired" : "Enter 6-Digit Email OTP"}
                          value={emailOtpCode}
                          onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                          className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-lg font-bold tracking-[6px] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        />
                        {emailTimer > 0 ? (
                          <button
                            type="button"
                            disabled={isVerifyingEmailOtp}
                            onClick={handleVerifyEmailOtp}
                            className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                          >
                            {isVerifyingEmailOtp ? <FaSpinner className="animate-spin text-sm" /> : "Verify Email OTP"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSendingEmailOtp}
                            onClick={handleSendEmailOtp}
                            className="px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                          >
                            {isSendingEmailOtp ? <FaSpinner className="animate-spin text-sm" /> : "Resend OTP"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    {...register("password", { 
                      required: "Password is required",
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message: "Must be 8+ chars with uppercase, lowercase, number, and special character (@$!%*?&)"
                      }
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
                )}

                {/* Password Strength Meter */}
                {passwordVal && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-bold uppercase tracking-wider">Strength: {passwordStrength.text}</span>
                      <span className="text-slate-500 font-bold">{passwordStrength.score}/5</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`} 
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 dark:text-slate-500">
                    <FaLock />
                  </span>
                  <input
                    type="password"
                    disabled={isSubmitting}
                    placeholder="••••••••"
                    {...register("confirmPassword", { 
                      required: "Please confirm your password",
                      validate: (value) => value === passwordVal || "Passwords do not match"
                    })}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-200"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* HoneyPot spam protection field (Hidden) */}
            <input type="text" className="hidden" {...register("website")} />

            {/* CAPTCHA SECTION */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mandatory Anti-Bot Shield
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  className="text-xs text-blue-600 hover:text-blue-500 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FaRedo className={isCaptchaLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <canvas 
                  ref={canvasRef} 
                  width={200} 
                  height={60} 
                  className="rounded-xl border border-slate-200 shadow-sm bg-slate-100 flex-shrink-0"
                />
                <div className="flex w-full gap-3">
                  <input
                    type="text"
                    disabled={captchaVerified}
                    placeholder={captchaVerified ? "VERIFIED" : "Enter CAPTCHA Code"}
                    {...register("captchaInput", { required: "CAPTCHA input is required" })}
                    onChange={(e) => {
                      setValue("captchaInput", e.target.value.toUpperCase());
                      setCaptchaVerified(false); // Reset if they type after verify
                    }}
                    className="w-full px-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white text-center font-bold tracking-wider placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors uppercase disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-75"
                  />
                  {!captchaVerified ? (
                    <button
                      type="button"
                      disabled={isVerifyingCaptcha}
                      onClick={handleVerifyCaptcha}
                      className="px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-blue-500/15 cursor-pointer disabled:opacity-60"
                    >
                      {isVerifyingCaptcha ? <FaSpinner className="animate-spin text-sm" /> : "Verify"}
                    </button>
                  ) : (
                    <div className="px-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-xs flex items-center gap-1.5 shadow-sm">
                      <FaCheckCircle className="text-sm" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>
              {errors.captchaInput && (
                <p className="text-xs text-red-500 font-medium">{errors.captchaInput.message}</p>
              )}
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                {...register("terms", { required: "You must accept the terms & conditions" })}
                className="mt-1 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 leading-normal cursor-pointer select-none">
                I authorize and accept the system corporate audit tracking policies, strict authentication terms, and verify that my submitted credentials are correct and match official records.
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-red-500 font-medium">{errors.terms.message}</p>
            )}

            {/* Submit button */}
            <motion.button
              whileHover={emailVerified && mobileVerified && captchaVerified && !isSubmitting && watch("first_name") && watch("last_name") && watch("gender") && watch("date_of_birth") && watch("mobile_number") && watch("email") && watch("password") && watch("confirmPassword") && watch("captchaInput") && watch("terms") ? { scale: 1.01 } : {}}
              whileTap={emailVerified && mobileVerified && captchaVerified && !isSubmitting && watch("first_name") && watch("last_name") && watch("gender") && watch("date_of_birth") && watch("mobile_number") && watch("email") && watch("password") && watch("confirmPassword") && watch("captchaInput") && watch("terms") ? { scale: 0.99 } : {}}
              disabled={!emailVerified || !mobileVerified || !captchaVerified || isSubmitting || !watch("first_name") || !watch("last_name") || !watch("gender") || !watch("date_of_birth") || !watch("mobile_number") || !watch("email") || !watch("password") || !watch("confirmPassword") || !watch("captchaInput") || !watch("terms")}
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin text-sm" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Registration to Admin</span>
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer links */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-500 font-bold transition-colors">
                Sign In
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
      {/* Hidden invisible recaptcha anchor */}
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default RegisterPage;
