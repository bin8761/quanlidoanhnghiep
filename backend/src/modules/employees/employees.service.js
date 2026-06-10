const employeesRepository = require("./employees.repository");
const departmentsRepository = require("../departments/departments.repository");
const locationsRepository = require("../locations/locations.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");

function createEmployeesService({ repository = employeesRepository, deptRepository = departmentsRepository, locRepository = locationsRepository } = {}) {
  async function createEmployee(data) {
    const normalizedData = { ...data };
    if (!normalizedData.employeeCode || normalizedData.employeeCode.trim() === "") {
      normalizedData.employeeCode = await repository.getNextEmployeeCode();
    }

    const existingCode = await repository.findByEmployeeCode(normalizedData.employeeCode);
    if (existingCode) {
      throw new AppError({
        message: "Employee code already exists",
        statusCode: 400,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const existingEmail = await repository.findByEmail(normalizedData.email);
    if (existingEmail) {
      throw new AppError({
        message: "Employee email already exists",
        statusCode: 400,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    if (normalizedData.departmentId) {
      const dept = await deptRepository.findById(normalizedData.departmentId);
      if (!dept) {
        throw new AppError({
          message: "Department not found",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }
    }

    return repository.create(normalizedData);
  }

  return Object.freeze({
    async getAllEmployees(filters = {}) {
      return repository.findAll(filters);
    },

    async getEmployeeById(id, authenticatedUser) {
      const employee = await repository.findById(id);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND, // Matches user/employee not found error pattern
        });
      }

      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(id, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }
      }

      return employee;
    },

    createEmployee,

    async importEmployees(rows) {
      const results = [];

      for (const row of rows) {
        try {
          const created = await createEmployee(row);
          results.push({
            rowNumber: row.rowNumber,
            success: true,
            id: created.id,
            code: created.employeeCode,
          });
        } catch (error) {
          results.push({
            rowNumber: row.rowNumber,
            success: false,
            code: row.employeeCode || null,
            message: error.message || "Unable to import employee",
          });
        }
      }

      return {
        total: results.length,
        imported: results.filter((item) => item.success).length,
        failed: results.filter((item) => !item.success).length,
        results,
      };
    },

    async updateEmployee(id, data, authenticatedUser) {
      const employee = await repository.findById(id);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
        });
      }

      // Role check: non-admin can only edit their own profile
      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(id, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }

        // Lock check: allowProfileUpdate must be true
        if (!employee.allowProfileUpdate) {
          throw new AppError({
            message: "Quyền cập nhật thông tin cá nhân của bạn đã bị khóa bởi Quản trị viên",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        // Field constraints: employee cannot edit protected fields
        const protectedFields = [
          "employeeCode",
          "email",
          "departmentId",
          "locationId",
          "deskX",
          "deskY",
          "position",
          "joinDate",
          "status",
          "allowProfileUpdate"
        ];
        for (const field of protectedFields) {
          if (typeof data[field] !== "undefined") {
            let isDifferent = false;
            if (field === "joinDate" || field === "dateOfBirth") {
              const oldTime = employee[field] ? new Date(employee[field]).getTime() : 0;
              const newTime = data[field] ? new Date(data[field]).getTime() : 0;
              isDifferent = oldTime !== newTime;
            } else {
              isDifferent = data[field] !== employee[field];
            }
            if (isDifferent) {
              throw new AppError({
                message: `Bạn không được phép tự chỉnh sửa trường thông tin công việc cố định: ${field}`,
                statusCode: 400,
                errorCode: ERROR_CODES.VALIDATION_ERROR,
              });
            }
          }
        }
      }

      if (data.email && data.email !== employee.email) {
        const existingEmail = await repository.findByEmail(data.email);
        if (existingEmail) {
          throw new AppError({
            message: "Employee email already exists",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      if (data.departmentId) {
        const dept = await deptRepository.findById(data.departmentId);
        if (!dept) {
          throw new AppError({
            message: "Department not found",
            statusCode: 404,
            errorCode: "DEPARTMENT_NOT_FOUND",
          });
        }
      }

      if (data.locationId) {
        const loc = await locRepository.findById(data.locationId);
        if (!loc) {
          throw new AppError({
            message: "Location not found",
            statusCode: 404,
            errorCode: "LOCATION_NOT_FOUND",
          });
        }
      }

      // Log updates: compare old and new values
      const logFields = [
        "fullName", "email", "status", "avatarUrl", "position", "joinDate", "phone",
        "personalEmail", "dateOfBirth", "gender", "permanentAddress", "currentAddress",
        "emergencyContact", "education", "skills", "certificates", "hometown", "ethnicity",
        "nationality", "identityCardNumber", "allowProfileUpdate"
      ];
      const logsToCreate = [];
      for (const field of logFields) {
        if (typeof data[field] !== "undefined") {
          let oldValue = employee[field];
          let newValue = data[field];
          let isDifferent = false;

          if (typeof oldValue === "object" || typeof newValue === "object") {
            isDifferent = JSON.stringify(oldValue) !== JSON.stringify(newValue);
            oldValue = oldValue ? JSON.stringify(oldValue) : null;
            newValue = newValue ? JSON.stringify(newValue) : null;
          } else if (oldValue instanceof Date || newValue instanceof Date || field === "joinDate" || field === "dateOfBirth") {
            const oldTime = oldValue ? new Date(oldValue).getTime() : 0;
            const newTime = newValue ? new Date(newValue).getTime() : 0;
            isDifferent = oldTime !== newTime;
            oldValue = oldValue ? new Date(oldValue).toISOString() : null;
            newValue = newValue ? new Date(newValue).toISOString() : null;
          } else {
            isDifferent = String(oldValue ?? "") !== String(newValue ?? "");
          }

          if (isDifferent) {
            logsToCreate.push({
              fieldName: field,
              oldValue: oldValue !== null ? String(oldValue) : null,
              newValue: newValue !== null ? String(newValue) : null,
            });
          }
        }
      }

      const updated = await repository.update(id, data);

      // Save logs if update was successful
      if (authenticatedUser && logsToCreate.length > 0) {
        for (const log of logsToCreate) {
          await repository.createProfileLog({
            employeeId: id,
            actorId: authenticatedUser.userId,
            fieldName: log.fieldName,
            oldValue: log.oldValue,
            newValue: log.newValue,
          });
        }
      }

      return updated;
    },

    async deleteEmployee(id) {
      const employee = await repository.findById(id);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
        });
      }

      const hasUser = await repository.hasUserAccount(id);
      if (hasUser) {
        throw new AppError({
          message: "Cannot delete employee linked to a user account",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const assignmentCount = await repository.countAssignments(id);
      if (assignmentCount > 0) {
        throw new AppError({
          message: "Cannot delete employee with active asset assignments",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      return repository.delete(id);
    },

    // Attachments service
    async getAttachments(employeeId, authenticatedUser) {
      // Access check
      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(employeeId, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }
      }
      return repository.findAttachmentsByEmployeeId(employeeId);
    },

    async uploadAttachment(employeeId, data, authenticatedUser) {
      // Access check & Lock check
      const employee = await repository.findById(employeeId);
      if (!employee) {
        throw new AppError({
          message: "Employee not found",
          statusCode: 404,
          errorCode: ERROR_CODES.AUTH_USER_NOT_FOUND,
        });
      }

      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(employeeId, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }

        if (!employee.allowProfileUpdate) {
          throw new AppError({
            message: "Quyền cập nhật hồ sơ của bạn đã bị khóa bởi Quản trị viên",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      return repository.createAttachment({
        employeeId,
        fileName: data.fileName,
        fileType: data.fileType,
        fileUrl: data.fileUrl,
        uploadedById: authenticatedUser.userId,
      });
    },

    async deleteAttachment(employeeId, attachmentId, authenticatedUser) {
      const attachment = await repository.findAttachmentById(attachmentId);
      if (!attachment) {
        throw new AppError({
          message: "Attachment not found",
          statusCode: 404,
          errorCode: "ATTACHMENT_NOT_FOUND",
        });
      }

      if (attachment.employeeId !== employeeId) {
        throw new AppError({
          message: "Attachment does not belong to this employee",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      // Access check & Lock check
      const employee = await repository.findById(employeeId);
      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(employeeId, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }

        if (!employee.allowProfileUpdate) {
          throw new AppError({
            message: "Quyền cập nhật hồ sơ của bạn đã bị khóa bởi Quản trị viên",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      return repository.deleteAttachment(attachmentId);
    },

    // Logs service
    async getProfileLogs(employeeId, authenticatedUser) {
      if (authenticatedUser && authenticatedUser.role !== "ADMIN") {
        const isLinked = await repository.isEmployeeLinkedToUser(employeeId, authenticatedUser.userId);
        if (!isLinked) {
          throw new AppError({
            message: "Forbidden",
            statusCode: 403,
            errorCode: ERROR_CODES.AUTH_FORBIDDEN,
          });
        }
      }
      return repository.findProfileLogsByEmployeeId(employeeId);
    },
  });
}

const employeesService = createEmployeesService();

module.exports = Object.freeze({
  ...employeesService,
  createEmployeesService,
});
