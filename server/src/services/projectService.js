const AppError = require("../utils/AppError");

const {
  createProject,
  findProjectById,
  getProjects,
  updateProject,
  deleteProject,
  restoreProject,
} = require(
  "../repositories/projectRepository"
);

const {
  createAuditLog,
} = require("../repositories/auditRepository");

const {
  projectAssignedEvent,
} = require(
  "../events/notificationEvents"
);


// ============================================
// CREATE PROJECT SERVICE
// ============================================

const createProjectService = async (
  data,
  user,
  ipAddress
) => {
  const project =
    await createProject(data);

  // MANAGER NOTIFICATION
  await projectAssignedEvent({
    userId:
      project.assigned_manager_id,
    projectName:
      project.project_name,
  });

  // AUDIT LOG
  await createAuditLog({
    user_id: user.id,
    action: "CREATE_PROJECT",
    entity_name: "projects",
    entity_id: project.id,
    new_values: project,
    ip_address: ipAddress,
  });

  return project;
};


// ============================================
// GET PROJECTS SERVICE
// ============================================

const getProjectsService = async (
  filters
) => {
  return await getProjects(filters);
};


// ============================================
// UPDATE PROJECT SERVICE
// ============================================

const updateProjectService = async (
  projectId,
  updateData,
  user,
  ipAddress
) => {
  const existingProject =
    await findProjectById(projectId);

  if (!existingProject) {
    throw new AppError(
      "Project not found",
      404
    );
  }

  const updatedProject =
    await updateProject(
      projectId,
      updateData
    );

  await createAuditLog({
    user_id: user.id,
    action: "UPDATE_PROJECT",
    entity_name: "projects",
    entity_id: projectId,
    old_values: existingProject,
    new_values: updatedProject,
    ip_address: ipAddress,
  });

  return updatedProject;
};


// ============================================
// DELETE PROJECT SERVICE
// ============================================

const deleteProjectService = async (
  projectId,
  user,
  ipAddress
) => {
  const existingProject =
    await findProjectById(projectId);

  await deleteProject(projectId);

  await createAuditLog({
    user_id: user.id,
    action: "DELETE_PROJECT",
    entity_name: "projects",
    entity_id: projectId,
    old_values: existingProject,
    ip_address: ipAddress,
  });
};


// ============================================
// RESTORE PROJECT SERVICE
// ============================================

const restoreProjectService =
  async (
    projectId,
    user,
    ipAddress
  ) => {
    await restoreProject(projectId);

    const restoredProject =
      await findProjectById(
        projectId
      );

    await createAuditLog({
      user_id: user.id,
      action: "RESTORE_PROJECT",
      entity_name: "projects",
      entity_id: projectId,
      new_values: restoredProject,
      ip_address: ipAddress,
    });
  };

module.exports = {
  createProjectService,
  getProjectsService,
  updateProjectService,
  deleteProjectService,
  restoreProjectService,
};