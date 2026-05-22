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
};