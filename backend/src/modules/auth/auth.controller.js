const authService = require("./auth.service");
const loginHistoryService = require("../loginHistory/loginHistory.service");
const { sendSuccess } = require("../../shared/response/apiResponse");
const { AUTH_RESPONSE_MESSAGES } = require("./auth.constants");

const authController = {
  async register(req, res, next) {
    try {
      const registeredUser = await authService.register(req.body);

      return sendSuccess(res, {
        statusCode: 201,
        message: AUTH_RESPONSE_MESSAGES.REGISTER_SUCCESS,
        data: registeredUser,
      });
    } catch (error) {
      return next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const loginResult = await authService.login(email, password);

      // Record successful login history
      try {
        await loginHistoryService.recordLogin({
          userId: loginResult.user.id,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
          status: "SUCCESS",
        });
      } catch (err) {
        console.error("Failed to record successful login history:", err);
      }

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.LOGIN_SUCCESS,
        data: loginResult,
      });
    } catch (error) {
      // Record failed login history if user exists
      try {
        const defaultPrisma = require("../../config/database");
        const user = await defaultPrisma.user.findUnique({
          where: { email: req.body.email },
        });
        if (user) {
          await loginHistoryService.recordLogin({
            userId: user.id,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers["user-agent"],
            status: "FAILED",
          });
        }
      } catch (err) {
        console.error("Failed to record failed login history:", err);
      }
      return next(error);
    }
  },

  async me(req, res, next) {
    try {
      const currentUser = await authService.getCurrentUser(req.user);

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.CURRENT_USER_SUCCESS,
        data: currentUser,
      });
    } catch (error) {
      return next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const userId = req.user.id;
      await authService.logout(req.user, {
        requestId: req.requestId,
      });

      // Record logout history
      try {
        await loginHistoryService.recordLogout(userId);
      } catch (err) {
        console.error("Failed to record logout history:", err);
      }

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.LOGOUT_SUCCESS,
      });
    } catch (error) {
      return next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword, confirmNewPassword } = req.body;

      await authService.changePassword(req.user, {
        currentPassword,
        newPassword,
        confirmNewPassword,
        requestId: req.requestId,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.PASSWORD_CHANGED_SUCCESS,
      });
    } catch (error) {
      return next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      await authService.requestForgotPasswordOtp({
        email,
        requestId: req.requestId,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.FORGOT_PASSWORD_OTP_SENT,
      });
    } catch (error) {
      return next(error);
    }
  },

  async verifyForgotPasswordOtp(req, res, next) {
    try {
      const { email, otp } = req.body;

      const verificationResult = await authService.verifyForgotPasswordOtp({
        email,
        otp,
        requestId: req.requestId,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.OTP_VERIFIED_SUCCESS,
        data: verificationResult,
      });
    } catch (error) {
      return next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword, confirmNewPassword } = req.body;

      await authService.resetPassword({
        email,
        otp,
        newPassword,
        confirmNewPassword,
        requestId: req.requestId,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.PASSWORD_RESET_SUCCESS,
      });
    } catch (error) {
      return next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const { employeeId } = req.body;

      const createdUser = await authService.createEmployeeUser({
        employeeId,
        requestId: req.requestId,
        authenticatedUser: req.user,
      });

      return sendSuccess(res, {
        statusCode: 201,
        message: AUTH_RESPONSE_MESSAGES.USER_CREATED_SUCCESS,
        data: createdUser,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const updatedUser = await authService.updateUserStatus({
        userId: id,
        isActive,
        requestId: req.requestId,
        authenticatedUser: req.user,
      });

      return sendSuccess(res, {
        statusCode: 200,
        message: AUTH_RESPONSE_MESSAGES.USER_STATUS_UPDATED_SUCCESS,
        data: updatedUser,
      });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = authController;
