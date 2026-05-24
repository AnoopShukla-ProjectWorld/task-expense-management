const fs = require("fs");
const path = require("path");
const { pool, poolConnect } = require("./db");

const runMigration = async () => {
  try {
    await poolConnect;
    console.log("🚀 Starting Database Migrations...");

    // Read migration.sql
    const sqlFilePath = path.join(__dirname, "../../../database/migration.sql");
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Migration SQL file not found at: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    // Split SQL by GO keyword (case-insensitive, on word boundaries)
    // Matches GO on its own line
    const queries = sqlContent
      .split(/\r?\n\s*GO\s*\r?\n/i)
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      for (const query of queries) {
        // Execute each batch in transaction
        await transaction.request().query(query);
      }
      await transaction.commit();
      console.log("✅ Database Migrations completed successfully!");
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

runMigration();
