-- ============================================
-- TASK & EXPENSE MANAGEMENT SYSTEM DATABASE
-- Enterprise Production-Grade Schema
-- MS SQL Server
-- ============================================

-- ============================================
-- SELECT DATABASE
-- ============================================
USE task_expense_db;
GO

-- ============================================
-- CREATE ROLES TABLE
-- ============================================
CREATE TABLE roles (
    id INT PRIMARY KEY IDENTITY(1,1),
    role_name NVARCHAR(50) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- ============================================
-- INSERT DEFAULT ROLES
-- ============================================
INSERT INTO roles (role_name)
VALUES
('ADMIN'),
('MANAGER'),
('EMPLOYEE');
GO

-- ============================================
-- CREATE DEPARTMENTS TABLE
-- ============================================
CREATE TABLE departments (
    id INT PRIMARY KEY IDENTITY(1,1),
    department_name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(500),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL
);
GO

-- ============================================
-- CREATE USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY IDENTITY(1,1),
    full_name NVARCHAR(150) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    employee_id NVARCHAR(50) NOT NULL UNIQUE,
    phone_number NVARCHAR(20),
    password_hash NVARCHAR(255) NOT NULL,
    profile_image NVARCHAR(255),
    role_id INT NOT NULL,
    department_id INT NULL,

    status NVARCHAR(20)
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
        DEFAULT 'ACTIVE',

    last_login DATETIME NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL,

    CONSTRAINT FK_Users_Roles
        FOREIGN KEY (role_id)
        REFERENCES roles(id),

    CONSTRAINT FK_Users_Departments
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
);
GO

-- ============================================
-- CREATE PROJECTS TABLE
-- ============================================
CREATE TABLE projects (
    id INT PRIMARY KEY IDENTITY(1,1),
    project_name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    start_date DATE NOT NULL,
    end_date DATE,

    status NVARCHAR(20)
        CHECK (status IN (
            'PLANNED',
            'ACTIVE',
            'ON_HOLD',
            'COMPLETED',
            'CANCELLED'
        ))
        DEFAULT 'PLANNED',

    priority NVARCHAR(20)
        CHECK (priority IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        ))
        DEFAULT 'MEDIUM',

    assigned_manager_id INT NOT NULL,

    completion_percentage INT DEFAULT 0
        CHECK (
            completion_percentage >= 0
            AND completion_percentage <= 100
        ),

    budget DECIMAL(18,2),

    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL,

    CONSTRAINT FK_Projects_Manager
        FOREIGN KEY (assigned_manager_id)
        REFERENCES users(id),

    CONSTRAINT UQ_Project_Name
        UNIQUE(project_name),

    CONSTRAINT CHK_Project_Dates
        CHECK (end_date >= start_date)
);
GO

-- ============================================
-- CREATE PROJECT MEMBERS TABLE
-- ============================================
CREATE TABLE project_members (
    id INT PRIMARY KEY IDENTITY(1,1),
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_ProjectMembers_Project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT FK_ProjectMembers_User
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT UQ_Project_User
        UNIQUE(project_id, user_id)
);
GO

-- ============================================
-- CREATE TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    id INT PRIMARY KEY IDENTITY(1,1),
    project_id INT NOT NULL,
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    title NVARCHAR(200) NOT NULL,

    description NVARCHAR(MAX),

    start_date DATE,

    due_date DATE,

    status NVARCHAR(20)
        CHECK (status IN (
            'PENDING',
            'IN_PROGRESS',
            'COMPLETED',
            'ON_HOLD',
            'CANCELLED'
        ))
        DEFAULT 'PENDING',

    priority NVARCHAR(20)
        CHECK (priority IN (
            'LOW',
            'MEDIUM',
            'HIGH',
            'CRITICAL'
        ))
        DEFAULT 'MEDIUM',

    completion_percentage INT DEFAULT 0
        CHECK (
            completion_percentage >= 0
            AND completion_percentage <= 100
        ),

    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL,

    CONSTRAINT FK_Tasks_Project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT FK_Tasks_AssignedTo
        FOREIGN KEY (assigned_to)
        REFERENCES users(id),

    CONSTRAINT FK_Tasks_AssignedBy
        FOREIGN KEY (assigned_by)
        REFERENCES users(id),

    CONSTRAINT CHK_Task_Dates
        CHECK (due_date >= start_date)
);
GO

-- ============================================
-- CREATE TASK COMMENTS TABLE
-- ============================================
CREATE TABLE task_comments (
    id INT PRIMARY KEY IDENTITY(1,1),
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    comment NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_TaskComments_Task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id),

    CONSTRAINT FK_TaskComments_User
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);
GO

-- ============================================
-- CREATE EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    project_id INT NULL,
    amount DECIMAL(18,2) NOT NULL
        CHECK (amount > 0),

    category NVARCHAR(50)
        CHECK (category IN (
            'TRAVEL',
            'FOOD',
            'ACCOMMODATION',
            'OFFICE_SUPPLIES',
            'MISCELLANEOUS'
        )),

    description NVARCHAR(MAX),
    expense_date DATE NOT NULL,
    status NVARCHAR(20)
        CHECK (status IN (
            'PENDING',
            'APPROVED',
            'REJECTED'
        ))
        DEFAULT 'PENDING',

    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    rejection_reason NVARCHAR(500),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    deleted_at DATETIME NULL,

    CONSTRAINT FK_Expenses_User
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT FK_Expenses_Project
        FOREIGN KEY (project_id)
        REFERENCES projects(id),

    CONSTRAINT FK_Expenses_ReviewedBy
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
);
GO

-- ============================================
-- CREATE EXPENSE ATTACHMENTS TABLE
-- ============================================
CREATE TABLE expense_attachments (
    id INT PRIMARY KEY IDENTITY(1,1),
    expense_id INT NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_path NVARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type NVARCHAR(100),
    uploaded_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_ExpenseAttachments_Expense
        FOREIGN KEY (expense_id)
        REFERENCES expenses(id)
);
GO

-- ============================================
-- CREATE NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) DEFAULT 'GENERAL',
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Notifications_User
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);
GO

-- ============================================
-- CREATE SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    ip_address NVARCHAR(100),
    user_agent NVARCHAR(MAX),
    device_info NVARCHAR(255),
    login_at DATETIME DEFAULT GETDATE(),
    logout_at DATETIME NULL,
    is_active BIT DEFAULT 1,

    CONSTRAINT FK_Sessions_User
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);
GO

-- ============================================
-- CREATE REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    token NVARCHAR(MAX) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_revoked BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    revoked_at DATETIME NULL,

    CONSTRAINT FK_RefreshTokens_User
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);
GO

-- ============================================
-- CREATE AUDIT LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NULL,
    action NVARCHAR(255) NOT NULL,
    entity_name NVARCHAR(100),
    entity_id INT,
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    ip_address NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_AuditLogs_User
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);
GO

-- ============================================
-- USERS INDEXES
-- ============================================
CREATE INDEX IDX_Users_Email
ON users(email);

CREATE INDEX IDX_Users_EmployeeId
ON users(employee_id);

CREATE INDEX IDX_Users_IsDeleted
ON users(is_deleted);
GO

-- ============================================
-- PROJECTS INDEXES
-- ============================================
CREATE INDEX IDX_Projects_Status
ON projects(status);

CREATE INDEX IDX_Projects_IsDeleted
ON projects(is_deleted);
GO

-- ============================================
-- TASKS INDEXES
-- ============================================
CREATE INDEX IDX_Tasks_AssignedTo
ON tasks(assigned_to);

CREATE INDEX IDX_Tasks_Project
ON tasks(project_id);

CREATE INDEX IDX_Tasks_Status
ON tasks(status);

CREATE INDEX IDX_Tasks_IsDeleted
ON tasks(is_deleted);
GO

-- ============================================
-- EXPENSES INDEXES
-- ============================================
CREATE INDEX IDX_Expenses_User
ON expenses(user_id);

CREATE INDEX IDX_Expenses_Status
ON expenses(status);

CREATE INDEX IDX_Expenses_IsDeleted
ON expenses(is_deleted);
GO

-- ============================================
-- NOTIFICATIONS INDEXES
-- ============================================
CREATE INDEX IDX_Notifications_User
ON notifications(user_id);

CREATE INDEX IDX_Notifications_IsRead
ON notifications(is_read);
GO

-- ============================================
-- SESSIONS INDEXES
-- ============================================
CREATE INDEX IDX_Sessions_User
ON sessions(user_id);

CREATE INDEX IDX_Sessions_IsActive
ON sessions(is_active);
GO

-- ============================================
-- REFRESH TOKENS INDEXES
-- ============================================
CREATE INDEX IDX_RefreshTokens_User
ON refresh_tokens(user_id);

CREATE INDEX IDX_RefreshTokens_IsRevoked
ON refresh_tokens(is_revoked);
GO

-- ============================================
-- AUDIT LOGS INDEXES
-- ============================================
CREATE INDEX IDX_AuditLogs_User
ON audit_logs(user_id);
GO

-- ============================================
-- VERIFY DEFAULT ROLES
-- ============================================
SELECT * FROM roles;
GO