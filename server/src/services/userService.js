const bcrypt = require("bcrypt");

const AppError = require("../utils/AppError");

const {
  createUser,
  getUsers,
  updateUser,
  softDeleteUser,
  restoreUser,
  findUserByEmail,
  findUserById,
} = require("../repositories/userRepository");

const {
  logActivity,
} = require("./auditService");


// ============================================
// CREATE USER SERVICE
// ============================================

const createUserService = async (
  userData,
  currentUser = null,
  ipAddress = null
) => {
  const existingUser =
    await findUserByEmail(
      userData.email
    );

  if (existingUser) {
    throw new AppError(
      "Email already exists",
      400
    );
  }

  let employeeId = userData.employee_id;
  if (!employeeId || employeeId.trim() === "" || employeeId === "Auto-Generated") {
    const { getNextEmployeeId } = require("../repositories/userRepository");
    employeeId = await getNextEmployeeId();
  }

  const hashedPassword =
    await bcrypt.hash(
      userData.password,
      12
    );

  const user =
    await createUser({
      ...userData,
      employee_id: employeeId,
      password_hash:
        hashedPassword,
    });

  // AUDIT LOG
  await logActivity({
    user_id:
      currentUser?.id || null,
    action: "CREATE_USER",
    entity_name: "USER",
    entity_id: user.id,
    new_values: user,
    ip_address: ipAddress,
  });

  return user;
};


// ============================================
// GET USERS SERVICE
// ============================================

const getUsersService = async (
  filters
) => {
  return await getUsers(filters);
};


// ============================================
// GET USER BY ID SERVICE
// ============================================

const getUserByIdService =
  async (userId) => {
    const user =
      await findUserById(userId);

    if (!user) {
      throw new AppError(
        "User not found",
        404
      );
    }

    return user;
  };


// ============================================
// UPDATE USER SERVICE
// ============================================

const updateUserService =
  async (
    userId,
    data,
    currentUser = null,
    ipAddress = null
  ) => {
    const existingUser =
      await findUserById(
        userId
      );

    if (!existingUser) {
      throw new AppError(
        "User not found",
        404
      );
    }

    const updatedUser =
      await updateUser(
        userId,
        data
      );

    // AUDIT LOG
    await logActivity({
      user_id:
        currentUser?.id || null,
      action: "UPDATE_USER",
      entity_name: "USER",
      entity_id: Number(userId),
      old_values: existingUser,
      new_values: updatedUser,
      ip_address: ipAddress,
    });

    return updatedUser;
  };


// ============================================
// SOFT DELETE USER SERVICE
// ============================================

const softDeleteUserService =
  async (
    userId,
    currentUser = null,
    ipAddress = null
  ) => {
    const user =
      await findUserById(userId);

    if (!user) {
      throw new AppError(
        "User not found",
        404
      );
    }

    // Prevent administrative self-deletion
    if (currentUser && Number(currentUser.id) === Number(userId)) {
      throw new AppError(
        "You cannot delete your own administrative account.",
        400
      );
    }

    await softDeleteUser(userId);

    // AUDIT LOG
    await logActivity({
      user_id:
        currentUser?.id || null,
      action: "DELETE_USER",
      entity_name: "USER",
      entity_id: Number(userId),
      old_values: user,
      ip_address: ipAddress,
    });
  };


// ============================================
// RESTORE USER SERVICE
// ============================================

const restoreUserService =
  async (
    userId,
    currentUser = null,
    ipAddress = null
  ) => {
    await restoreUser(userId);

    // AUDIT LOG
    await logActivity({
      user_id:
        currentUser?.id || null,
      action: "RESTORE_USER",
      entity_name: "USER",
      entity_id: Number(userId),
      ip_address: ipAddress,
    });
  };


// ============================================
// GET PROFILE SERVICE
// ============================================

const getProfileService =
  async (userId) => {
    return await findUserById(
      userId
    );
  };


// ============================================
// UPDATE PROFILE SERVICE
// ============================================

const updateProfileService =
  async (
    userId,
    data,
    ipAddress = null
  ) => {
    const existingUser =
      await findUserById(
        userId
      );

    const updatedUser =
      await updateUser(
        userId,
        data
      );

    // AUDIT LOG
    await logActivity({
      user_id: userId,
      action:
        "UPDATE_PROFILE",
      entity_name: "USER",
      entity_id: userId,
      old_values:
        existingUser,
      new_values:
        updatedUser,
      ip_address: ipAddress,
    });

    return updatedUser;
  };


// ============================================
// ONBOARDING SERVICES
// ============================================

const approveUserService = async (userId, role, currentUser = null, ipAddress = null) => {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  const { getNextEmployeeId } = require("../repositories/userRepository");
  const employeeId = await getNextEmployeeId();

  const updatedUser = await updateUser(userId, {
    role,
    status: "approved",
    employee_id: employeeId,
    email_verified: 1,
  });

  // AUDIT LOG
  await logActivity({
    user_id: currentUser?.id || null,
    action: "APPROVE_USER",
    entity_name: "USER",
    entity_id: Number(userId),
    old_values: existingUser,
    new_values: updatedUser,
    ip_address: ipAddress,
  });

  // Send Onboarding Welcoming Email
  const { sendMail } = require("../utils/mailer");
  await sendMail({
    to: updatedUser.email,
    subject: "Welcome to Task & Expense Management System!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #10b981; text-align: center;">Account Approved!</h2>
        <p style="font-size: 16px; color: #333333;">Hello <strong>${updatedUser.full_name}</strong>,</p>
        <p style="font-size: 16px; color: #333333;">We are excited to inform you that your registration has been successfully reviewed and approved by the system administrator.</p>
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
          <p style="margin: 0; font-size: 15px; color: #14532d;">➡️ Assigned Role: <strong>${role.toUpperCase()}</strong></p>
          <p style="margin: 5px 0 0 0; font-size: 15px; color: #14532d;">➡️ Employee ID: <strong>${employeeId}</strong></p>
        </div>
        <p style="font-size: 16px; color: #333333;">You can now log in using your registered Email or Mobile number to access your workspace portal dashboard.</p>
        <p style="font-size: 12px; color: #666666; text-align: center; margin-top: 30px;">Task & Expense Management System © 2026</p>
      </div>
    `,
    text: `Congratulations! Your account has been approved. Assigned Role: ${role.toUpperCase()}, Employee ID: ${employeeId}.`,
  });

  return updatedUser;
};

const rejectUserService = async (userId, currentUser = null, ipAddress = null) => {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  const updatedUser = await updateUser(userId, { status: "rejected" });

  await logActivity({
    user_id: currentUser?.id || null,
    action: "REJECT_USER",
    entity_name: "USER",
    entity_id: Number(userId),
    old_values: existingUser,
    new_values: updatedUser,
    ip_address: ipAddress,
  });

  return updatedUser;
};

const suspendUserService = async (userId, currentUser = null, ipAddress = null) => {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  // Prevent administrative self-suspension
  if (currentUser && Number(currentUser.id) === Number(userId)) {
    throw new AppError("You cannot suspend your own administrative account.", 400);
  }

  const updatedUser = await updateUser(userId, { status: "suspended" });

  await logActivity({
    user_id: currentUser?.id || null,
    action: "SUSPEND_USER",
    entity_name: "USER",
    entity_id: Number(userId),
    old_values: existingUser,
    new_values: updatedUser,
    ip_address: ipAddress,
  });

  return updatedUser;
};


// ============================================
// EXPORTS
// ============================================

module.exports = {
  createUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  softDeleteUserService,
  restoreUserService,
  getProfileService,
  updateProfileService,
  approveUserService,
  rejectUserService,
  suspendUserService,
};