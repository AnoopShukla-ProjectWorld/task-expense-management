const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require("../utils/apiResponse");

const {
  logActivity,
} = require(
  "../services/auditService"
);

const {
  createUserService,
  getUsersService,
  getUserByIdService,
  updateUserService,
  softDeleteUserService,
  restoreUserService,
  getProfileService,
  updateProfileService,
} = require("../services/userService");


// ============================================
// CREATE USER
// ============================================

const createUser = asyncHandler(
  async (req, res) => {
    const {
      full_name,
      email,
      employee_id,
      password,
      role_id,
      department_id,
      phone_number
    } = req.body;

    const user =
      await createUserService({
        full_name,
        email,
        employee_id,
        password,
        role_id: role_id ? parseInt(role_id) : undefined,
        department_id: department_id ? parseInt(department_id) : undefined,
        phone_number
      });

    // AUDIT LOG
    await logActivity({
      user_id: req.user.id,
      action: "CREATE_USER",
      entity_name: "USER",
      entity_id: user.id,
      new_values: user,
      ip_address: req.ip,
    });

    return successResponse(
      res,
      201,
      "User created successfully",
      user
    );
  }
);


// ============================================
// GET USERS
// ============================================

const getUsers = asyncHandler(
  async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
    } = req.query;

    const users =
      await getUsersService({
        page: Number(page),
        limit: Number(limit),
        search,
        role,
        status,
      });

    return successResponse(
      res,
      200,
      "Users fetched successfully",
      users
    );
  }
);


// ============================================
// GET USER BY ID
// ============================================

const getUserById =
  asyncHandler(
    async (req, res) => {
      const user =
        await getUserByIdService(
          req.params.id
        );

      return successResponse(
        res,
        200,
        "User fetched successfully",
        user
      );
    }
  );


// ============================================
// UPDATE USER
// ============================================

const updateUser =
  asyncHandler(
    async (req, res) => {
      const {
        full_name,
        phone_number,
        status,
        role_id,
        department_id
      } = req.body;

      const user =
        await updateUserService(
          req.params.id,
          {
            full_name,
            phone_number,
            status,
            role_id: role_id ? parseInt(role_id) : undefined,
            department_id: department_id ? parseInt(department_id) : undefined
          }
        );

      // AUDIT LOG
      await logActivity({
        user_id: req.user.id,
        action: "UPDATE_USER",
        entity_name: "USER",
        entity_id: Number(
          req.params.id
        ),
        new_values: user,
        ip_address: req.ip,
      });

      return successResponse(
        res,
        200,
        "User updated successfully",
        user
      );
    }
  );


// ============================================
// DELETE USER
// ============================================

const deleteUser =
  asyncHandler(
    async (req, res) => {
      await softDeleteUserService(
        req.params.id
      );

      // AUDIT LOG
      await logActivity({
        user_id: req.user.id,
        action: "DELETE_USER",
        entity_name: "USER",
        entity_id: Number(
          req.params.id
        ),
        ip_address: req.ip,
      });

      return successResponse(
        res,
        200,
        "User deleted successfully"
      );
    }
  );


// ============================================
// RESTORE USER
// ============================================

const restoreUser =
  asyncHandler(
    async (req, res) => {
      await restoreUserService(
        req.params.id
      );

      // AUDIT LOG
      await logActivity({
        user_id: req.user.id,
        action: "RESTORE_USER",
        entity_name: "USER",
        entity_id: Number(
          req.params.id
        ),
        ip_address: req.ip,
      });

      return successResponse(
        res,
        200,
        "User restored successfully"
      );
    }
  );


// ============================================
// GET PROFILE
// ============================================

const getProfile =
  asyncHandler(
    async (req, res) => {
      const user =
        await getProfileService(
          req.user.id
        );

      return successResponse(
        res,
        200,
        "Profile fetched successfully",
        user
      );
    }
  );


// ============================================
// UPDATE PROFILE
// ============================================

const updateProfile =
  asyncHandler(
    async (req, res) => {
      const { full_name, phone_number } = req.body;
      const user =
        await updateProfileService(
          req.user.id,
          { full_name, phone_number },
          req.ip
        );

      // AUDIT LOG
      await logActivity({
        user_id: req.user.id,
        action:
          "UPDATE_PROFILE",
        entity_name: "USER",
        entity_id:
          req.user.id,
        new_values: user,
        ip_address: req.ip,
      });

      return successResponse(
        res,
        200,
        "Profile updated successfully",
        user
      );
    }
  );


// ============================================
// EXPORTS
// ============================================

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  restoreUser,
  getProfile,
  updateProfile,
};