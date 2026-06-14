const departmentsRepository = require("./departments.repository");
const employeesRepository = require("../employees/employees.repository");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const defaultPrisma = require("../../config/database");

function createDepartmentsService({ repository = departmentsRepository } = {}) {
  return Object.freeze({
    async getAllDepartments() {
      const departments = await repository.findAll();
      const valueStats = await repository.getAssetValueStats();
      return departments.map(dept => ({
        ...dept,
        totalAssetValue: valueStats[dept.id] || 0
      }));
    },

    async getDepartmentById(id) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Không tìm thấy phòng ban",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }
      return department;
    },

    async getDepartmentDetail(id) {
      const department = await repository.findByIdDetail(id);
      if (!department) {
        throw new AppError({
          message: "Không tìm thấy phòng ban",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }

      // Calculate asset values
      const totalAssetValue = department.ownedAssets.reduce((sum, asset) => {
        return sum + (asset.value ? Number(asset.value) : 0);
      }, 0);

      // Annual Budget vs Used Budget (assets + repair costs of completed support requests)
      const budgetAnnual = department.annualBudget ? Number(department.annualBudget) : 0;
      const assetCosts = totalAssetValue;
      const repairCosts = department.supportRequests
        .filter(req => req.status === "COMPLETED")
        .reduce((sum, req) => sum + (req.repairCost ? Number(req.repairCost) : 0), 0);
      
      const budgetUsed = assetCosts + repairCosts;
      const budgetRemaining = budgetAnnual - budgetUsed;

      return {
        ...department,
        totalAssetValue,
        budgetUsed,
        budgetRemaining
      };
    },

    async createDepartment(data, actorId) {
      // Validate unique code
      const existingCode = await repository.findByCode(data.code);
      if (existingCode) {
        throw new AppError({
          message: "Mã phòng ban đã tồn tại",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      // Validate unique name
      const existingName = await repository.findByName(data.name);
      if (existingName) {
        throw new AppError({
          message: "Tên phòng ban đã tồn tại",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      let managerId = data.managerId || null;
      if (managerId === "") managerId = null;

      if (managerId) {
        const manager = await employeesRepository.findById(managerId);
        if (!manager) {
          throw new AppError({
            message: "Trưởng phòng được gán không tồn tại",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      // Check if parent department exists
      if (data.parentId) {
        const parent = await repository.findById(data.parentId);
        if (!parent) {
          throw new AppError({
            message: "Phòng ban cha không tồn tại",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      const newDept = await repository.create({
        ...data,
        managerId,
      });

      // Write audit log
      if (actorId) {
        await repository.createAuditLog(newDept.id, actorId, "CREATE", {
          code: newDept.code,
          name: newDept.name,
          branch: newDept.branch,
          annualBudget: Number(newDept.annualBudget),
          status: newDept.status
        });
      }

      return newDept;
    },

    async updateDepartment(id, data, actorId) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Không tìm thấy phòng ban",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }

      // Validate unique code if changed
      if (data.code && data.code !== department.code) {
        const existingCode = await repository.findByCode(data.code);
        if (existingCode) {
          throw new AppError({
            message: "Mã phòng ban đã tồn tại",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      // Validate unique name if changed
      if (data.name && data.name !== department.name) {
        const existingName = await repository.findByName(data.name);
        if (existingName) {
          throw new AppError({
            message: "Tên phòng ban đã tồn tại",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      let managerId = data.managerId;
      if (managerId === "") managerId = null;

      if (managerId) {
        const manager = await employeesRepository.findById(managerId);
        if (!manager) {
          throw new AppError({
            message: "Trưởng phòng được gán không tồn tại",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }
      }

      // Validate parent department cycle
      if (data.parentId !== undefined && data.parentId !== null) {
        const parentId = Number(data.parentId);
        if (parentId === Number(id)) {
          throw new AppError({
            message: "Không thể chọn chính phòng ban này làm phòng ban cha",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        // Check if parent exists
        const parent = await repository.findById(parentId);
        if (!parent) {
          throw new AppError({
            message: "Phòng ban cha không tồn tại",
            statusCode: 400,
            errorCode: ERROR_CODES.VALIDATION_ERROR,
          });
        }

        // Cycle detection
        let currentParentId = parentId;
        while (currentParentId) {
          if (currentParentId === Number(id)) {
            throw new AppError({
              message: "Không thể chọn phòng ban con làm phòng ban cha (Lỗi vòng lặp phân cấp)",
              statusCode: 400,
              errorCode: ERROR_CODES.VALIDATION_ERROR,
            });
          }
          const parentDept = await repository.findById(currentParentId);
          currentParentId = parentDept ? parentDept.parentId : null;
        }
      }

      // Compute changes for audit logging
      const changes = {};
      const fields = [
        "code", "name", "description", "managerId", "email", 
        "phone", "establishedDate", "branch", "status", "parentId", "annualBudget"
      ];
      for (const field of fields) {
        if (data[field] !== undefined) {
          let oldVal = department[field];
          let newVal = data[field];

          // Normalize values for comparison
          if (field === "annualBudget") {
            if (Number(oldVal) === Number(newVal)) continue;
            oldVal = Number(oldVal);
            newVal = Number(newVal);
          } else if (field === "establishedDate") {
            const oldTime = oldVal ? new Date(oldVal).getTime() : null;
            const newTime = newVal ? new Date(newVal).getTime() : null;
            if (oldTime === newTime) continue;
          } else if (oldVal === newVal) {
            continue;
          }

          changes[field] = { old: oldVal, new: newVal };
        }
      }

      const updatedDept = await repository.update(id, {
        ...department,
        ...data,
        managerId,
      });

      // Write audit log if changes were made
      if (actorId && Object.keys(changes).length > 0) {
        await repository.createAuditLog(id, actorId, "UPDATE", changes);
      }

      return updatedDept;
    },

    async deleteDepartment(id, actorId) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Không tìm thấy phòng ban",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }

      const employeeCount = await repository.countEmployees(id);
      if (employeeCount > 0) {
        throw new AppError({
          message: "Không thể xóa phòng ban đang có nhân viên trực thuộc",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      // Check if it has child departments
      const children = await repository.countChildren(id);
      if (children > 0) {
        throw new AppError({
          message: "Không thể xóa phòng ban đang có các phòng ban con trực thuộc",
          statusCode: 400,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
        });
      }

      const deleted = await repository.delete(id);

      if (actorId) {
        // Ghi nhận log xóa trước khi mất liên kết
        await repository.createAuditLog(id, actorId, "DELETE", {
          code: department.code,
          name: department.name
        }).catch(() => {}); // Nuốt lỗi nếu không lưu được log do cascade delete
      }

      return deleted;
    },

    async updateDepartmentQuotas(id, quotas, actorId) {
      const department = await repository.findById(id);
      if (!department) {
        throw new AppError({
          message: "Không tìm thấy phòng ban",
          statusCode: 404,
          errorCode: "DEPARTMENT_NOT_FOUND",
        });
      }

      const updatedQuotas = await repository.updateQuotas(id, quotas);

      if (actorId) {
        await repository.createAuditLog(id, actorId, "UPDATE_QUOTAS", quotas);
      }

      return updatedQuotas;
    },

    async getDashboardSummary() {
      const totalDepartments = await defaultPrisma.department.count();
      const totalEmployees = await defaultPrisma.employee.count({
        where: { status: "ACTIVE" }
      });
      const totalAssets = await defaultPrisma.asset.count({
        where: { status: { not: "DISPOSED" } }
      });
      const assetValueAgg = await defaultPrisma.asset.aggregate({
        where: { status: { not: "DISPOSED" } },
        _sum: { value: true }
      });
      const totalAssetValue = assetValueAgg._sum.value ? Number(assetValueAgg._sum.value) : 0;

      return {
        totalDepartments,
        totalEmployees,
        totalAssets,
        totalAssetValue
      };
    }
  });
}

const departmentsService = createDepartmentsService();

module.exports = Object.freeze({
  ...departmentsService,
  createDepartmentsService,
});
