const express = require("express");

const cors = require("cors");

const helmet = require("helmet");

const cookieParser = require(
  "cookie-parser"
);

const path = require("path");

const compression = require(
  "compression"
);

const morgan = require(
  "morgan"
);

const env = require("./config/env");

const {
  globalLimiter,
} = require(
  "./config/rateLimiter"
);

const authRoutes = require(
  "./routes/authRoutes"
);

const testRoutes = require(
  "./routes/testRoutes"
);

const userRoutes = require(
  "./routes/userRoutes"
);

const projectRoutes = require(
  "./routes/projectRoutes"
);

const taskRoutes = require(
  "./routes/taskRoutes"
);

const expenseRoutes = require(
  "./routes/expenseRoutes"
);

const notificationRoutes =
  require(
    "./routes/notificationRoutes"
  );

const auditRoutes = require(
  "./routes/auditRoutes"
);

const reportRoutes = require(
  "./routes/reportRoutes"
);

const aiRoutes = require(
  "./routes/aiRoutes"
);

const errorMiddleware = require(
  "./middlewares/errorMiddleware"
);

const requestLoggerMiddleware =
  require(
    "./middlewares/requestLoggerMiddleware"
  );

const notFoundMiddleware =
  require(
    "./middlewares/notFoundMiddleware"
  );

const responseTime =
  require(
    "./utils/responseTime"
  );

const healthCheck = require(
  "./utils/healthCheck"
);

const app = express();


// ============================================
// SECURITY & PERFORMANCE MIDDLEWARES
// ============================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());

app.use(morgan("dev"));

app.use(globalLimiter);


// ============================================
// BODY PARSERS
// ============================================

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));

app.use(cookieParser());


// ============================================
// CORS
// ============================================

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        env.CLIENT_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// ============================================
// CUSTOM MIDDLEWARES
// ============================================

app.use(
  requestLoggerMiddleware
);

app.use(responseTime());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ============================================
// HEALTH CHECK ROUTES
// ============================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Task Expense API Running",
  });
});

app.get(
  "/health",
  healthCheck
);


// ============================================
// API ROUTES
// ============================================

app.use(
  "/api/v1/auth",
  authRoutes
);

app.use(
  "/api/v1/test",
  testRoutes
);

app.use(
  "/api/v1/users",
  userRoutes
);

app.use(
  "/api/v1/projects",
  projectRoutes
);

app.use(
  "/api/v1/tasks",
  taskRoutes
);

app.use(
  "/api/v1/expenses",
  expenseRoutes
);

app.use(
  "/api/v1/notifications",
  notificationRoutes
);

app.use(
  "/api/v1/audit",
  auditRoutes
);

app.use(
  "/api/v1/reports",
  reportRoutes
);

app.use(
  "/api/v1/ai",
  aiRoutes
);


// ============================================
// 404 HANDLER
// ============================================

app.use(notFoundMiddleware);


// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(errorMiddleware);

module.exports = app;