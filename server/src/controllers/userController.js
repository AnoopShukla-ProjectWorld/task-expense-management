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
    let {
      first_name,
      last_name,
      full_name,
      email,
      employee_id,
      password,
      role,
      department_id,
      phone_number
    } = req.body;

    if (full_name && (!first_name || !last_name)) {
      const parts = full_name.trim().split(/\s+/);
      first_name = parts[0];
      last_name = parts.slice(1).join(" ") || "";
    }

    const user =
      await createUserService({
        first_name,
        last_name,
        email,
        employee_id,
        password,
        role: role || "employee",
        department_id: department_id ? parseInt(department_id) : undefined,
        mobile_number: phone_number
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
      let {
        first_name,
        last_name,
        full_name,
        phone_number,
        status,
        role,
        department_id
      } = req.body;

      if (full_name && (!first_name || !last_name)) {
        const parts = full_name.trim().split(/\s+/);
        first_name = parts[0];
        last_name = parts.slice(1).join(" ") || "";
      }

      const user =
        await updateUserService(
          req.params.id,
          {
            first_name,
            last_name,
            mobile_number: phone_number,
            status,
            role,
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

      if (user) {
        user.phone_number = user.mobile_number;
      }

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
      const { first_name, last_name, phone_number } = req.body;
      const updateData = { first_name, last_name, mobile_number: phone_number };
      if (req.file) {
        updateData.profile_image = `/uploads/profiles/${req.file.filename}`;
      }
      const user =
        await updateProfileService(
          req.user.id,
          updateData,
          req.ip
        );

      if (user) {
        user.phone_number = user.mobile_number;
      }

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
// ONBOARDING CONTROLLERS
// ============================================

const approveUser = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !["employee", "manager"].includes(role)) {
    throw new AppError("Invalid or missing role parameter", 400);
  }

  const { approveUserService } = require("../services/userService");
  const user = await approveUserService(req.params.id, role, req.user, req.ip);

  return successResponse(res, 200, "User successfully approved and role assigned", user);
});

const rejectUser = asyncHandler(async (req, res) => {
  const { rejectUserService } = require("../services/userService");
  const user = await rejectUserService(req.params.id, req.user, req.ip);

  return successResponse(res, 200, "User registration rejected successfully", user);
});

const suspendUser = asyncHandler(async (req, res) => {
  const { suspendUserService } = require("../services/userService");
  const user = await suspendUserService(req.params.id, req.user, req.ip);

  return successResponse(res, 200, "User account suspended successfully", user);
});


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
  approveUser,
  rejectUser,
  suspendUser,
};