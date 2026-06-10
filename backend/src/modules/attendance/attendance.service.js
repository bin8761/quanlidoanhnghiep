const repository = require("./attendance.repository");
const defaultPrisma = require("../../config/database");
const AppError = require("../../shared/errors/AppError");

function createAttendanceService({ attendanceRepository = repository } = {}) {
  // Helper to get formatted date string local to Asia/Ho_Chi_Minh or UTC (YYYY-MM-DD)
  function getLocalDateString() {
    const d = new Date();
    // Offset for local timezone (GMT+7)
    const localTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return localTime.toISOString().split("T")[0];
  }

  async function getEmployeeIdByUserId(userId) {
    const user = await defaultPrisma.user.findUnique({
      where: { id: userId },
      select: { employeeId: true },
    });

    if (!user || !user.employeeId) {
      throw new AppError({
        statusCode: 400,
        message: "User does not have an associated employee record.",
        errorCode: "VALIDATION_ERROR",
      });
    }

    return user.employeeId;
  }

  return Object.freeze({
    async checkIn(userId) {
      const employeeId = await getEmployeeIdByUserId(userId);
      const date = getLocalDateString();

      const existing = await attendanceRepository.findByDate(employeeId, date);
      if (existing) {
        throw new AppError({
          statusCode: 400,
          message: "You have already checked in today.",
          errorCode: "VALIDATION_ERROR",
        });
      }

      return attendanceRepository.createCheckIn(employeeId, date, new Date());
    },

    async checkOut(userId) {
      const employeeId = await getEmployeeIdByUserId(userId);
      const date = getLocalDateString();

      const existing = await attendanceRepository.findByDate(employeeId, date);
      if (!existing) {
        throw new AppError({
          statusCode: 400,
          message: "You must check in first before checking out.",
          errorCode: "VALIDATION_ERROR",
        });
      }

      if (existing.checkOut) {
        throw new AppError({
          statusCode: 400,
          message: "You have already checked out today.",
          errorCode: "VALIDATION_ERROR",
        });
      }

      const checkOutTime = new Date();
      const elapsedMs = checkOutTime.getTime() - new Date(existing.checkIn).getTime();
      const workingHours = Math.round((elapsedMs / (1000 * 60 * 60)) * 100) / 100; // round to 2 decimals

      return attendanceRepository.updateCheckOut(existing.id, checkOutTime, workingHours);
    },

    async getStatus(userId) {
      const employeeId = await getEmployeeIdByUserId(userId);
      const date = getLocalDateString();

      const todayRecord = await attendanceRepository.findByDate(employeeId, date);

      // Get some simple weekly stats (last 7 days of logs)
      const history = await attendanceRepository.findHistory(employeeId);
      const totalDays = history.length;
      const totalHours = history.reduce((sum, item) => sum + (item.workingHours || 0), 0);

      return {
        today: todayRecord,
        stats: {
          totalDays,
          totalHours: Math.round(totalHours * 100) / 100,
        },
      };
    },

    async getMyHistory(userId) {
      const employeeId = await getEmployeeIdByUserId(userId);
      return attendanceRepository.findHistory(employeeId);
    },

    async getAllHistory(filters) {
      const page = Number(filters.page || 1);
      const pageSize = Number(filters.pageSize || 20);
      const search = filters.search || "";
      const date = filters.date || "";

      return attendanceRepository.findAll({
        page,
        pageSize,
        search,
        date,
      });
    },
  });
}

const attendanceService = createAttendanceService();

module.exports = Object.freeze({
  ...attendanceService,
  createAttendanceService,
});
