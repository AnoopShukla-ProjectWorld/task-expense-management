const bcrypt = require("bcrypt");
const { pool, sql } = require("../config/db");

async function seed() {
  console.log("🌱 Starting Database Seeding...");
  
  try {
    // 1. Wait for DB Connection
    await pool.connect();
    console.log("✅ Database connected for seeding");

    // 2. Clear Existing Data safely (due to foreign key constraints, we delete in order)
    console.log("🧹 Clearing old data...");
    await pool.request().query(`
      DELETE FROM refresh_tokens;
      DELETE FROM sessions;
      DELETE FROM audit_logs;
      DELETE FROM notifications;
      DELETE FROM expenses;
      DELETE FROM tasks;
      DELETE FROM project_members;
      DELETE FROM projects;
      DELETE FROM users WHERE email NOT IN ('system@system.com');
      DELETE FROM departments;
    `);

    // 3. Insert Departments
    console.log("🏢 Inserting Departments...");
    const deptsResult = await pool.request().query(`
      INSERT INTO departments (department_name, description)
      OUTPUT inserted.id, inserted.department_name
      VALUES 
      ('Engineering', 'Software developers and system architects'),
      ('Product Management', 'Product managers and UX designers'),
      ('Marketing', 'Digital branding and campaign management'),
      ('Finance', 'Billing, accounts and financial analytics'),
      ('Human Resources', 'Talent acquisition and onboarding');
    `);
    const depts = deptsResult.recordset;
    console.log(`Inserted ${depts.length} departments`);

    const deptMap = {};
    depts.forEach(d => {
      deptMap[d.department_name] = d.id;
    });

    // 4. Insert Roles if not exist (handled by schema, but let's fetch their IDs)
    const rolesResult = await pool.request().query("SELECT id, role_name FROM roles");
    const roleMap = {};
    rolesResult.recordset.forEach(r => {
      roleMap[r.role_name] = r.id;
    });

    // 5. Generate Hashed Password
    const passwordHash = await bcrypt.hash("password123", 12);

    // 6. Insert Users (Admin, Managers, Employees)
    console.log("👥 Inserting Users...");
    const usersResult = await pool.request().query(`
      INSERT INTO users (full_name, email, employee_id, phone_number, password_hash, role_id, department_id, status)
      OUTPUT inserted.id, inserted.full_name, inserted.email, inserted.role_id
      VALUES
      ('Aarav Sharma', 'admin@system.com', 'EMP-001', '9876543210', '${passwordHash}', ${roleMap.ADMIN}, ${deptMap.Engineering}, 'ACTIVE'),
      ('Vihaan Verma', 'manager1@system.com', 'EMP-002', '9876543211', '${passwordHash}', ${roleMap.MANAGER}, ${deptMap.Engineering}, 'ACTIVE'),
      ('Ananya Iyer', 'manager2@system.com', 'EMP-003', '9876543212', '${passwordHash}', ${roleMap.MANAGER}, ${deptMap['Product Management']}, 'ACTIVE'),
      ('Kabir Mehta', 'employee1@system.com', 'EMP-004', '9876543213', '${passwordHash}', ${roleMap.EMPLOYEE}, ${deptMap.Engineering}, 'ACTIVE'),
      ('Diya Patel', 'employee2@system.com', 'EMP-005', '9876543214', '${passwordHash}', ${roleMap.EMPLOYEE}, ${deptMap.Engineering}, 'ACTIVE'),
      ('Aditya Rao', 'employee3@system.com', 'EMP-006', '9876543215', '${passwordHash}', ${roleMap.EMPLOYEE}, ${deptMap.Marketing}, 'ACTIVE');
    `);
    const users = usersResult.recordset;
    console.log(`Inserted ${users.length} users`);

    const userMap = {};
    users.forEach(u => {
      userMap[u.email] = u.id;
    });

    // 7. Insert Projects
    console.log("📂 Inserting Projects...");
    const projectsResult = await pool.request().query(`
      INSERT INTO projects (project_name, description, start_date, end_date, status, priority, assigned_manager_id, budget, completion_percentage)
      OUTPUT inserted.id, inserted.project_name
      VALUES
      ('Apex Enterprise Suite', 'Rebuilding the core customer management portal', '2026-01-15', '2026-10-31', 'ACTIVE', 'CRITICAL', ${userMap['manager1@system.com']}, 250000.00, 45),
      ('Quantum Analytics Platform', 'Advanced reporting engines using Recharts components', '2026-03-01', '2026-12-15', 'ACTIVE', 'HIGH', ${userMap['manager1@system.com']}, 180000.00, 30),
      ('Horizon Website Launch', 'Complete visual redesign and Tailwind migration', '2026-02-10', '2026-06-30', 'ACTIVE', 'MEDIUM', ${userMap['manager2@system.com']}, 50000.00, 75),
      ('Nova Global HR Rebuild', 'Automating payroll and onboarding processes', '2026-05-01', '2026-11-30', 'PLANNED', 'HIGH', ${userMap['manager2@system.com']}, 120000.00, 0),
      ('Core Infrastructure Migration', 'Migrating standard pipelines to multi-tenant MSSQL instances', '2026-04-15', '2026-08-30', 'ACTIVE', 'HIGH', ${userMap['manager1@system.com']}, 300000.00, 15);
    `);
    const projects = projectsResult.recordset;
    console.log(`Inserted ${projects.length} projects`);

    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.project_name] = p.id;
    });

    // 8. Assign Project Members (Employees to Projects)
    console.log("🔗 Assigning Project Members...");
    await pool.request().query(`
      INSERT INTO project_members (project_id, user_id)
      VALUES
      (${projectMap['Apex Enterprise Suite']}, ${userMap['employee1@system.com']}),
      (${projectMap['Apex Enterprise Suite']}, ${userMap['employee2@system.com']}),
      (${projectMap['Quantum Analytics Platform']}, ${userMap['employee1@system.com']}),
      (${projectMap['Horizon Website Launch']}, ${userMap['employee3@system.com']}),
      (${projectMap['Nova Global HR Rebuild']}, ${userMap['employee2@system.com']}),
      (${projectMap['Core Infrastructure Migration']}, ${userMap['employee1@system.com']});
    `);
    console.log("Assigned project membership fleet");

    // 9. Insert Tasks
    console.log("📋 Inserting Tasks...");
    await pool.request().query(`
      INSERT INTO tasks (project_id, assigned_to, assigned_by, title, description, start_date, due_date, status, priority, completion_percentage)
      VALUES
      (${projectMap['Apex Enterprise Suite']}, ${userMap['employee1@system.com']}, ${userMap['manager1@system.com']}, 'Database Partitioning Setup', 'Setup partitions on the core audit logs ledger to improve index performance', '2026-02-01', '2026-06-15', 'IN_PROGRESS', 'CRITICAL', 65),
      (${projectMap['Apex Enterprise Suite']}, ${userMap['employee2@system.com']}, ${userMap['manager1@system.com']}, 'UI Design Kit Polish', 'Redesign form headers and date pickers to support strict glassmorphism and filters', '2026-03-10', '2026-05-30', 'COMPLETED', 'HIGH', 100),
      (${projectMap['Quantum Analytics Platform']}, ${userMap['employee1@system.com']}, ${userMap['manager1@system.com']}, 'Google Fonts Integration', 'Setup Outfit and Inter fonts on the tailwind stylesheet with proper loading states', '2026-03-15', '2026-04-30', 'COMPLETED', 'LOW', 100),
      (${projectMap['Horizon Website Launch']}, ${userMap['employee3@system.com']}, ${userMap['manager2@system.com']}, 'Marketing Campaign Copy', 'Draft premium copy and banners for the direct product launch campaign', '2026-05-10', '2026-06-25', 'PENDING', 'MEDIUM', 0),
      (${projectMap['Nova Global HR Rebuild']}, ${userMap['employee2@system.com']}, ${userMap['manager2@system.com']}, 'Employee Onboarding Workflow', 'Configure multi-step forms and file dropzones for document uploads', '2026-05-02', '2026-08-15', 'ON_HOLD', 'HIGH', 20);
    `);
    console.log("Tasks seeded successfully");

    // 10. Insert Expenses and Attachments
    console.log("💳 Inserting Expenses...");
    const expenseInsertResult = await pool.request().query(`
      INSERT INTO expenses (project_id, user_id, amount, category, description, expense_date, status, rejection_reason)
      OUTPUT inserted.id, inserted.description
      VALUES
      (${projectMap['Apex Enterprise Suite']}, ${userMap['employee1@system.com']}, 8500.00, 'TRAVEL', 'Cloud Servers Hosting AWS for staging environment deployment', '2026-05-10', 'APPROVED', NULL),
      (${projectMap['Apex Enterprise Suite']}, ${userMap['manager1@system.com']}, 1850.00, 'FOOD', 'Manager Strategic Lunch with product consultants', '2026-05-18', 'PENDING', NULL),
      (${projectMap['Apex Enterprise Suite']}, ${userMap['employee2@system.com']}, 4200.00, 'OFFICE_SUPPLIES', 'UI Designer Adobe Creative Cloud team monthly subscription', '2026-05-20', 'PENDING', NULL),
      (${projectMap['Horizon Website Launch']}, ${userMap['employee3@system.com']}, 15000.00, 'MISCELLANEOUS', 'Marketing Launch Ads Facebook campaigns standard credit limit', '2026-05-12', 'REJECTED', 'Budget exceeded standard marketing limits for this quarter.'),
      (${projectMap['Quantum Analytics Platform']}, ${userMap['employee1@system.com']}, 3400.00, 'OFFICE_SUPPLIES', 'Office Ergonomic Keyboard & Mouse accessories setup', '2026-05-05', 'APPROVED', NULL);
    `);
    const seededExpenses = expenseInsertResult.recordset;
    console.log(`Inserted ${seededExpenses.length} expenses`);

    // Insert attachment records for expenses that had them
    const expenseMap = {};
    seededExpenses.forEach(e => {
      expenseMap[e.description] = e.id;
    });

    console.log("📎 Inserting Expense Attachments...");
    await pool.request().query(`
      INSERT INTO expense_attachments (expense_id, file_name, file_path, file_size, mime_type)
      VALUES
      (${expenseMap['Cloud Servers Hosting AWS for staging environment deployment']}, 'aws_receipt_7834.pdf', 'uploads/expenses/aws_receipt_7834.pdf', 102450, 'application/pdf'),
      (${expenseMap['UI Designer Adobe Creative Cloud team monthly subscription']}, 'adobe_receipt.jpg', 'uploads/expenses/adobe_receipt.jpg', 204800, 'image/jpeg'),
      (${expenseMap['Marketing Launch Ads Facebook campaigns standard credit limit']}, 'fb_ads_receipt.png', 'uploads/expenses/fb_ads_receipt.png', 512000, 'image/png');
    `);
    console.log("Expense attachments seeded successfully");

    // 11. Insert Audit Logs
    console.log("📝 Inserting Audit Logs...");
    await pool.request().query(`
      INSERT INTO audit_logs (user_id, action, entity_name, entity_id, ip_address)
      VALUES
      (${userMap['admin@system.com']}, 'SYSTEM_BOOT', 'SYSTEM', 0, '127.0.0.1'),
      (${userMap['admin@system.com']}, 'CREATE_USER', 'USER', ${userMap['manager1@system.com']}, '127.0.0.1'),
      (${userMap['manager1@system.com']}, 'CREATE_PROJECT', 'PROJECT', ${projectMap['Apex Enterprise Suite']}, '192.168.1.5'),
      (${userMap['manager1@system.com']}, 'CREATE_TASK', 'TASK', 1, '192.168.1.5'),
      (${userMap['employee1@system.com']}, 'SUBMIT_EXPENSE', 'EXPENSE', 1, '192.168.1.12');
    `);
    console.log("Audit logs seeded");

    // 12. Insert Notifications
    console.log("🔔 Inserting Notifications...");
    await pool.request().query(`
      INSERT INTO notifications (user_id, title, message, is_read)
      VALUES
      (${userMap['employee1@system.com']}, 'New Task Assigned', 'Database Partitioning Setup has been assigned to you by Vihaan Verma.', 0),
      (${userMap['employee2@system.com']}, 'New Task Assigned', 'UI Design Kit Polish has been assigned to you by Vihaan Verma.', 0),
      (${userMap['manager1@system.com']}, 'New Expense Claim Submitted', 'Aarav Sharma submitted a software expense claim for ₹8,500.', 0),
      (${userMap['employee1@system.com']}, 'Expense Claim Approved', 'Your AWS software expense claim has been successfully approved.', 1);
    `);
    console.log("Notifications seeded successfully");

    console.log("✨ Seeding Completed Successfully! All Enterprise Core Data Injected.");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
  } finally {
    await pool.close();
    console.log("🔌 Connection closed");
  }
}

seed();
