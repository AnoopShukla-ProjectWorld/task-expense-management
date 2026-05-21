const multer = require("multer");

const path = require("path");

const AppError = require(
  "../utils/AppError"
);


// ============================================
// STORAGE CONFIG
// ============================================

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    cb
  ) => {
    cb(
      null,
      "src/uploads/expenses"
    );
  },

  filename: (
    req,
    file,
    cb
  ) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(
        Math.random() * 1e9
      ) +
      path.extname(
        file.originalname
      );

    cb(null, uniqueName);
  },
});


// ============================================
// FILE FILTER
// ============================================

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
  ];

  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type",
        400
      ),
      false
    );
  }
};


// ============================================
// MULTER CONFIG
// ============================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },
});

module.exports = upload;