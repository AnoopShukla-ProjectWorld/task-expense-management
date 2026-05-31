const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  successResponse,
} = require("../utils/apiResponse");

const {
  createProjectService,
  getProjectsService,
  updateProjectService,
  deleteProjectService,
  restoreProjectService,
} = require(
  "../services/projectService"
);


// ============================================
// CREATE PROJECT
// ============================================

const createProject = asyncHandler(
  async (req, res) => {
    const projectData = { ...req.body };
    if (req.file) {
      projectData.document_path = `/uploads/projects/${req.file.filename}`;
    }

    const project =
      await createProjectService(
        projectData,
        req.user
      );

    return successResponse(
      res,
      201,
      "Project created successfully",
      project
    );
  }
);


// ============================================
// GET PROJECTS
// ============================================

const getProjects = asyncHandler(
  async (req, res) => {
    const projects =
      await getProjectsService({
        page:
          Number(req.query.page) || 1,
        limit:
          Number(req.query.limit) ||
          10,
        search: req.query.search,
        status: req.query.status,
        userId: req.user.id,
        userRole: req.user.role,
      });

    return successResponse(
      res,
      200,
      "Projects fetched successfully",
      projects
    );
  }
);


// ============================================
// UPDATE PROJECT
// ============================================

const updateProject = asyncHandler(
  async (req, res) => {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.document_path = `/uploads/projects/${req.file.filename}`;
    }

    const project =
      await updateProjectService(
        req.params.id,
        updateData,
        req.user
      );

    return successResponse(
      res,
      200,
      "Project updated successfully",
      project
    );
  }
);


// ============================================
// DELETE PROJECT
// ============================================

const deleteProject = asyncHandler(
  async (req, res) => {
    await deleteProjectService(
      req.params.id,
      req.user
    );

    return successResponse(
      res,
      200,
      "Project deleted successfully"
    );
  }
);


// ============================================
// RESTORE PROJECT
// ============================================

const restoreProject =
  asyncHandler(
    async (req, res) => {
      await restoreProjectService(
        req.params.id,
        req.user
      );

      return successResponse(
        res,
        200,
        "Project restored successfully"
      );
    }
  );

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  restoreProject,
};