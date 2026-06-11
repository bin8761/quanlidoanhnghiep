const defaultPrisma = require("../../config/database");

function resolvePrismaClient(prismaClient) {
  return prismaClient || defaultPrisma;
}

function createAttendanceRepository(prismaClient) {
  const activePrisma = resolvePrismaClient(prismaClient);

  return Object.freeze({
    async findByDate(employeeId, date) {
      return activePrisma.timeAttendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date,
          },
        },
      });
    },

    async createCheckIn(employeeId, date, checkInTime) {
      return activePrisma.timeAttendance.create({
        data: {
          employeeId,
          date,
          checkIn: checkInTime,
        },
      });
    },

    async updateCheckOut(id, checkOutTime, workingHours) {
      return activePrisma.timeAttendance.update({
        where: { id },
        data: {
          checkOut: checkOutTime,
          workingHours,
        },
      });
    },

    async findHistory(employeeId) {
      return activePrisma.timeAttendance.findMany({
        where: { employeeId },
        orderBy: { date: "desc" },
      });
    },

    async findAll({ page = 1, pageSize = 20, search = "", date = "" }) {
      const skip = (page - 1) * pageSize;
      const where = {};

      if (date) {
        where.date = date;
      }

      if (search) {
        where.employee = {
          fullName: { contains: search },
        };
      }

      const [items, totalCount] = await Promise.all([
        activePrisma.timeAttendance.findMany({
          where,
          include: {
            employee: {
              select: {
                fullName: true,
                employeeCode: true,
                position: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: [{ date: "desc" }, { checkIn: "desc" }],
          skip,
          take: pageSize,
        }),
        activePrisma.timeAttendance.count({ where }),
      ]);

      return {
        items,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    },
  });
}

const attendanceRepository = createAttendanceRepository();

module.exports = Object.freeze({
  ...attendanceRepository,
  createAttendanceRepository,
});
