-- ====================================================
-- ENTERPRISE AUTHENTICATION SYSTEM MIGRATION SCRIPT
-- MS SQL Server
-- ====================================================

USE task_expense_db;
GO

-- 1. Create OTP Verifications Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'otp_verifications')
BEGIN
    CREATE TABLE otp_verifications (
        id INT PRIMARY KEY IDENTITY(1,1),
        email NVARCHAR(150) NOT NULL UNIQUE,
        otp_hash NVARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INT DEFAULT 0,
        resend_attempts INT DEFAULT 0,
        last_requested_at DATETIME DEFAULT GETDATE(),
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Table otp_verifications created successfully.';
END;
GO

-- 2. Create Login Attempts Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'login_attempts')
BEGIN
    CREATE TABLE login_attempts (
        id INT PRIMARY KEY IDENTITY(1,1),
        email NVARCHAR(150) NOT NULL,
        ip_address NVARCHAR(100),
        attempt_at DATETIME DEFAULT GETDATE(),
        is_successful BIT NOT NULL
    );
    PRINT '✅ Table login_attempts created successfully.';
END;
GO

-- 3. Create User Sessions Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
BEGIN
    CREATE TABLE user_sessions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        session_token NVARCHAR(255) NOT NULL UNIQUE,
        ip_address NVARCHAR(100),
        user_agent NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        expires_at DATETIME NOT NULL,
        is_active BIT DEFAULT 1
    );
    PRINT '✅ Table user_sessions created successfully.';
END;
GO

-- 4. Create Password Reset Tokens Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
BEGIN
    CREATE TABLE password_reset_tokens (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        token_hash NVARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Table password_reset_tokens created successfully.';
END;
GO

-- 5. Extend Users Table
-- Add gender
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'gender')
BEGIN
    ALTER TABLE users ADD gender NVARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other'));
    PRINT '✅ Added gender column to users.';
END;
GO

-- Add date_of_birth
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'date_of_birth')
BEGIN
    ALTER TABLE users ADD date_of_birth DATE;
    PRINT '✅ Added date_of_birth column to users.';
END;
GO

-- Add mobile_number
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'mobile_number')
BEGIN
    ALTER TABLE users ADD mobile_number NVARCHAR(20);
    PRINT '✅ Added mobile_number column to users.';
END;
GO

-- Copy existing phone_number values into mobile_number and add UNIQUE constraint
-- Drop old phone_number column if exists
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
BEGIN
    EXEC('UPDATE users SET mobile_number = phone_number WHERE phone_number IS NOT NULL');
    -- Drop old FK/constraints or column if not needed
    ALTER TABLE users DROP COLUMN phone_number;
    PRINT '✅ Transferred phone_number values to mobile_number and dropped phone_number.';
END;
GO

-- Add unique index for mobile_number
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Users_MobileNumber' AND object_id = OBJECT_ID('users'))
BEGIN
    CREATE UNIQUE INDEX UQ_Users_MobileNumber ON users(mobile_number) WHERE mobile_number IS NOT NULL;
    PRINT '✅ Created unique index on mobile_number.';
END;
GO

-- Add email_verified
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'email_verified')
BEGIN
    ALTER TABLE users ADD email_verified BIT DEFAULT 0;
    PRINT '✅ Added email_verified column to users.';
END;
GO

-- Add failed_login_attempts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'failed_login_attempts')
BEGIN
    ALTER TABLE users ADD failed_login_attempts INT DEFAULT 0;
    PRINT '✅ Added failed_login_attempts column to users.';
END;
GO

-- Add account_locked_until
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'account_locked_until')
BEGIN
    ALTER TABLE users ADD account_locked_until DATETIME NULL;
    PRINT '✅ Added account_locked_until column to users.';
END;
GO

-- Add role NVARCHAR(50)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role')
BEGIN
    ALTER TABLE users ADD role NVARCHAR(50) CHECK (role IN ('admin', 'manager', 'employee', 'pending')) DEFAULT 'pending';
    PRINT '✅ Added role column to users.';
END;
GO

-- Copy role values from role_id
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role_id')
BEGIN
    EXEC('UPDATE users SET role = ''admin'' WHERE role_id = 1');
    EXEC('UPDATE users SET role = ''manager'' WHERE role_id = 2');
    EXEC('UPDATE users SET role = ''employee'' WHERE role_id = 3');
    PRINT '✅ Mapped role_id values to role string column.';
END;
GO

-- Handle old Check constraint on status and alter constraint values
DECLARE @ConstraintName NVARCHAR(255);
SELECT @ConstraintName = name 
FROM sys.check_constraints 
WHERE parent_object_id = OBJECT_ID('users') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'status');

IF @ConstraintName IS NOT NULL
BEGIN
    DECLARE @DropSql NVARCHAR(MAX) = 'ALTER TABLE users DROP CONSTRAINT ' + @ConstraintName;
    EXEC sp_executesql @DropSql;
    PRINT '✅ Old status CHECK constraint dropped.';
END;
GO

-- Alter default constraints on status
DECLARE @DefaultConstraintName NVARCHAR(255);
SELECT @DefaultConstraintName = name 
FROM sys.default_constraints 
WHERE parent_object_id = OBJECT_ID('users') 
AND parent_column_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'status');

IF @DefaultConstraintName IS NOT NULL
BEGIN
    DECLARE @DropDefaultSql NVARCHAR(MAX) = 'ALTER TABLE users DROP CONSTRAINT ' + @DefaultConstraintName;
    EXEC sp_executesql @DropDefaultSql;
    PRINT '✅ Old status DEFAULT constraint dropped.';
END;
GO

-- Update existing statuses to the new system
EXEC('UPDATE users SET status = ''approved'' WHERE status IN (''ACTIVE'', ''ACTIVE_STATUS'')');
EXEC('UPDATE users SET status = ''suspended'' WHERE status IN (''INACTIVE'', ''INACTIVE_STATUS'')');
EXEC('UPDATE users SET status = ''approved'' WHERE status IS NULL');
GO

-- Add new constraint for status and default value
ALTER TABLE users ADD CONSTRAINT CK_Users_Status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));
ALTER TABLE users ADD CONSTRAINT DF_Users_Status DEFAULT 'pending' FOR status;
PRINT '✅ Configured new status constraints and defaults.';
GO

-- Drop role_id column and roles table since role is now NVARCHAR
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Users_Roles' AND parent_object_id = OBJECT_ID('users'))
BEGIN
    ALTER TABLE users DROP CONSTRAINT FK_Users_Roles;
    PRINT '✅ Dropped foreign key FK_Users_Roles.';
END;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'role_id')
BEGIN
    ALTER TABLE users DROP COLUMN role_id;
    PRINT '✅ Dropped role_id column from users.';
END;
GO

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    DROP TABLE roles;
    PRINT '✅ Dropped old roles table.';
END;
GO

-- Verify default users are all set as 'approved'
UPDATE users SET status = 'approved' WHERE email IN ('admin@system.com', 'manager1@system.com', 'employee1@system.com');
UPDATE users SET email_verified = 1 WHERE email IN ('admin@system.com', 'manager1@system.com', 'employee1@system.com');
UPDATE users SET date_of_birth = '1990-01-01', gender = 'Male' WHERE email IN ('admin@system.com', 'manager1@system.com', 'employee1@system.com');
PRINT '✅ Seed users successfully migrated and approved.';
GO

-- 6. Split full_name into first_name and last_name
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'first_name')
BEGIN
    ALTER TABLE users ADD first_name NVARCHAR(100) NULL;
    ALTER TABLE users ADD last_name NVARCHAR(100) NULL;
    PRINT '✅ Added first_name and last_name columns to users table.';
END;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'full_name')
BEGIN
    -- Perform splitting
    -- First name: everything up to the first space (or the whole name if no space)
    -- Last name: everything after the first space (or empty string if no space)
    UPDATE users
    SET 
        first_name = CASE 
            WHEN CHARINDEX(' ', TRIM(full_name)) > 0 
            THEN SUBSTRING(TRIM(full_name), 1, CHARINDEX(' ', TRIM(full_name)) - 1)
            ELSE TRIM(full_name)
        END,
        last_name = CASE 
            WHEN CHARINDEX(' ', TRIM(full_name)) > 0 
            THEN SUBSTRING(TRIM(full_name), CHARINDEX(' ', TRIM(full_name)) + 1, LEN(TRIM(full_name)))
            ELSE ''
        END
    WHERE first_name IS NULL;
    PRINT '✅ Populated first_name and last_name from existing full_name data.';
END;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'first_name')
BEGIN
    -- Fill any remaining NULLs with empty strings before marking NOT NULL (just in case)
    UPDATE users SET first_name = '' WHERE first_name IS NULL;
    UPDATE users SET last_name = '' WHERE last_name IS NULL;

    ALTER TABLE users ALTER COLUMN first_name NVARCHAR(100) NOT NULL;
    ALTER TABLE users ALTER COLUMN last_name NVARCHAR(100) NOT NULL;
    PRINT '✅ Made first_name and last_name columns NOT NULL.';
END;
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'full_name')
BEGIN
    ALTER TABLE users DROP COLUMN full_name;
    PRINT '✅ Dropped full_name column from users.';
END;
GO

