const multer = require("multer");
const AppError = require("../shared/errors/AppError");
const ERROR_CODES = require("../shared/errors/errorCodes");

// Cấu hình lưu trữ tạm trong bộ nhớ RAM
const storage = multer.memoryStorage();

// Lọc định dạng file
const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new AppError({
        message: "Chỉ cho phép tải lên hình ảnh định dạng JPEG, PNG hoặc WEBP.",
        statusCode: 400,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      }),
      false
    );
  }
};

// Giới hạn dung lượng 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware nhận upload 1 file ảnh
 * @param {string} fieldName - Tên field chứa file trong form-data
 */
const uploadSingleImage = (fieldName) => {
  const uploadMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new AppError({
                message: "Dung lượng hình ảnh vượt quá giới hạn cho phép (Tối đa 5MB).",
                statusCode: 400,
                errorCode: ERROR_CODES.VALIDATION_ERROR,
              })
            );
          }
          return next(
            new AppError({
              message: `Lỗi tải lên hình ảnh: ${err.message}`,
              statusCode: 400,
              errorCode: ERROR_CODES.VALIDATION_ERROR,
            })
          );
        }
        return next(err);
      }
      return next();
    });
  };
};

module.exports = {
  uploadSingleImage,
};
