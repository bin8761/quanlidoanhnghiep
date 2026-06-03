const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const passwordUtils = require("../src/shared/utils/password.util");

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  quiet: true,
});

const prisma = new PrismaClient();

const ACCOUNT_EMAILS = Object.freeze({
  admin: "admin@company.local",
  noUserEmployee: "nouser.employee@company.local",
  inactive: "inactive.employee@company.local",
  firstLogin: "firstlogin.employee@company.local",
  active: "active.employee@company.local",
});

const EMPLOYEE_CODES = Object.freeze({
  noUser: "EMP001",
  inactive: "EMP002",
  firstLogin: "EMP003",
  active: "EMP004",
});

const FIXED_IDS = Object.freeze({
  employees: {
    noUser: "11111111-1111-4111-8111-111111111111",
    inactive: "22222222-2222-4222-8222-222222222222",
    firstLogin: "33333333-3333-4333-8333-333333333333",
    active: "44444444-4444-4444-8444-444444444444",
  },
  users: {
    admin: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    inactive: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    firstLogin: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    active: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  },
});

const LOCAL_PASSWORDS = Object.freeze({
  admin: "Admin123",
  inactive: "Inactive123",
  firstLogin: process.env.DEFAULT_USER_PASSWORD || "Password123",
  active: "Active1234",
});

async function buildPasswordHashes() {
  const [adminHash, inactiveHash, firstLoginHash, activeHash] = await Promise.all([
    passwordUtils.hashPassword(LOCAL_PASSWORDS.admin),
    passwordUtils.hashPassword(LOCAL_PASSWORDS.inactive),
    passwordUtils.hashPassword(LOCAL_PASSWORDS.firstLogin),
    passwordUtils.hashPassword(LOCAL_PASSWORDS.active),
  ]);

  return Object.freeze({
    adminHash,
    inactiveHash,
    firstLoginHash,
    activeHash,
  });
}

async function upsertEmployee(id, employeeCode, fullName, email) {
  return prisma.employee.upsert({
    where: {
      employeeCode,
    },
    update: {
      id,
      fullName,
      email,
      status: "ACTIVE",
    },
    create: {
      id,
      employeeCode,
      fullName,
      email,
      status: "ACTIVE",
    },
  });
}

async function main() {
  const hashes = await buildPasswordHashes();

  const noUserEmployee = await upsertEmployee(
    FIXED_IDS.employees.noUser,
    EMPLOYEE_CODES.noUser,
    "No User Employee",
    ACCOUNT_EMAILS.noUserEmployee,
  );
  const inactiveEmployee = await upsertEmployee(
    FIXED_IDS.employees.inactive,
    EMPLOYEE_CODES.inactive,
    "Inactive User Employee",
    ACCOUNT_EMAILS.inactive,
  );
  const firstLoginEmployee = await upsertEmployee(
    FIXED_IDS.employees.firstLogin,
    EMPLOYEE_CODES.firstLogin,
    "First Login Employee",
    ACCOUNT_EMAILS.firstLogin,
  );
  const activeEmployee = await upsertEmployee(
    FIXED_IDS.employees.active,
    EMPLOYEE_CODES.active,
    "Active User Employee",
    ACCOUNT_EMAILS.active,
  );

  await prisma.user.deleteMany({
    where: {
      OR: [
        {
          email: ACCOUNT_EMAILS.noUserEmployee,
        },
        {
          employeeId: noUserEmployee.id,
        },
      ],
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      email: ACCOUNT_EMAILS.admin,
    },
    update: {
      id: FIXED_IDS.users.admin,
      employeeId: null,
      passwordHash: hashes.adminHash,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      id: FIXED_IDS.users.admin,
      email: ACCOUNT_EMAILS.admin,
      passwordHash: hashes.adminHash,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: false,
    },
  });

  const inactiveUser = await prisma.user.upsert({
    where: {
      email: ACCOUNT_EMAILS.inactive,
    },
    update: {
      id: FIXED_IDS.users.inactive,
      employeeId: inactiveEmployee.id,
      passwordHash: hashes.inactiveHash,
      role: "USER",
      isActive: false,
      mustChangePassword: false,
    },
    create: {
      id: FIXED_IDS.users.inactive,
      employeeId: inactiveEmployee.id,
      email: ACCOUNT_EMAILS.inactive,
      passwordHash: hashes.inactiveHash,
      role: "USER",
      isActive: false,
      mustChangePassword: false,
    },
  });

  const firstLoginUser = await prisma.user.upsert({
    where: {
      email: ACCOUNT_EMAILS.firstLogin,
    },
    update: {
      id: FIXED_IDS.users.firstLogin,
      employeeId: firstLoginEmployee.id,
      passwordHash: hashes.firstLoginHash,
      role: "USER",
      isActive: true,
      mustChangePassword: true,
    },
    create: {
      id: FIXED_IDS.users.firstLogin,
      employeeId: firstLoginEmployee.id,
      email: ACCOUNT_EMAILS.firstLogin,
      passwordHash: hashes.firstLoginHash,
      role: "USER",
      isActive: true,
      mustChangePassword: true,
    },
  });

  const activeUser = await prisma.user.upsert({
    where: {
      email: ACCOUNT_EMAILS.active,
    },
    update: {
      id: FIXED_IDS.users.active,
      employeeId: activeEmployee.id,
      passwordHash: hashes.activeHash,
      role: "USER",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      id: FIXED_IDS.users.active,
      employeeId: activeEmployee.id,
      email: ACCOUNT_EMAILS.active,
      passwordHash: hashes.activeHash,
      role: "USER",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.passwordResetOtp.deleteMany({
    where: {
      userId: {
        in: [adminUser.id, inactiveUser.id, firstLoginUser.id, activeUser.id],
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        seededAccounts: {
          admin: {
            email: ACCOUNT_EMAILS.admin,
            password: LOCAL_PASSWORDS.admin,
          },
          inactive: {
            email: ACCOUNT_EMAILS.inactive,
            password: LOCAL_PASSWORDS.inactive,
          },
          firstLogin: {
            email: ACCOUNT_EMAILS.firstLogin,
            password: LOCAL_PASSWORDS.firstLogin,
          },
          active: {
            email: ACCOUNT_EMAILS.active,
            password: LOCAL_PASSWORDS.active,
          },
        },
        employeeIds: {
          noUserEmployeeId: noUserEmployee.id,
          inactiveEmployeeId: inactiveEmployee.id,
          firstLoginEmployeeId: firstLoginEmployee.id,
          activeEmployeeId: activeEmployee.id,
        },
        userIds: {
          adminUserId: adminUser.id,
          inactiveUserId: inactiveUser.id,
          firstLoginUserId: firstLoginUser.id,
          activeUserId: activeUser.id,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
