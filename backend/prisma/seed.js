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

const LOCAL_PASSWORDS = Object.freeze({
  admin: "Admin123",
  inactive: "Inactive123",
  firstLogin: process.env.DEFAULT_USER_PASSWORD || "Password123",
  active: "Active1234",
});

const FIXED_IDS = Object.freeze({
  employees: {
    noUser: "11111111-1111-4111-8111-111111111111",
    inactive: "22222222-2222-4222-8222-222222222222",
    firstLogin: "33333333-3333-4333-8333-333333333333",
    active: "44444444-4444-4444-8444-444444444444",
    finance: "55555555-5555-4555-8555-555555555555",
    sales: "66666666-6666-4666-8666-666666666666",
  },
  users: {
    admin: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    inactive: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    firstLogin: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    active: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  },
  assets: {
    primaryLaptop: "10000000-0000-4000-8000-000000000001",
    spareLaptop: "10000000-0000-4000-8000-000000000002",
    monitor: "10000000-0000-4000-8000-000000000003",
    printer: "10000000-0000-4000-8000-000000000004",
    projector: "10000000-0000-4000-8000-000000000005",
    keyboard: "10000000-0000-4000-8000-000000000006",
    phone: "10000000-0000-4000-8000-000000000007",
    tablet: "10000000-0000-4000-8000-000000000008",
  },
  assignments: {
    activeLaptop: "20000000-0000-4000-8000-000000000001",
    activeMonitor: "20000000-0000-4000-8000-000000000002",
    returnedLaptop: "20000000-0000-4000-8000-000000000003",
    transferredProjector: "20000000-0000-4000-8000-000000000004",
  },
  maintenance: {
    pendingLaptop: "30000000-0000-4000-8000-000000000001",
    printerRepair: "30000000-0000-4000-8000-000000000002",
    completedLaptop: "30000000-0000-4000-8000-000000000003",
  },
  inventorySessions: {
    active: "40000000-0000-4000-8000-000000000001",
    completed: "40000000-0000-4000-8000-000000000002",
  },
  inventoryItems: {
    activeLaptop: "50000000-0000-4000-8000-000000000001",
    activeMonitor: "50000000-0000-4000-8000-000000000002",
    activeKeyboard: "50000000-0000-4000-8000-000000000003",
    completedPrinter: "50000000-0000-4000-8000-000000000004",
    completedProjector: "50000000-0000-4000-8000-000000000005",
  },
});

const DEPARTMENT_SEEDS = Object.freeze([
  { key: "engineering", name: "Phòng Kỹ thuật", description: "Phát triển, vận hành và hỗ trợ hệ thống công nghệ." },
  { key: "sales", name: "Phòng Kinh doanh", description: "Phụ trách khách hàng, hợp đồng và hoạt động bán hàng." },
  { key: "administration", name: "Phòng Hành chính", description: "Quản lý cơ sở vật chất và hoạt động nội bộ." },
  { key: "finance", name: "Phòng Tài chính", description: "Quản lý ngân sách, thanh toán và báo cáo tài chính." },
]);

const CATEGORY_SEEDS = Object.freeze([
  { key: "laptop", name: "Laptop", description: "Máy tính xách tay dành cho nhân viên." },
  { key: "monitor", name: "Màn hình", description: "Màn hình máy tính và thiết bị hiển thị." },
  { key: "printer", name: "Máy in", description: "Máy in và thiết bị phục vụ in ấn." },
  { key: "projector", name: "Máy chiếu", description: "Thiết bị trình chiếu cho phòng họp." },
  { key: "peripheral", name: "Thiết bị ngoại vi", description: "Bàn phím, chuột và phụ kiện máy tính." },
  { key: "mobile", name: "Thiết bị di động", description: "Điện thoại và máy tính bảng phục vụ công việc." },
]);

async function buildPasswordHashes() {
  const [adminHash, inactiveHash, firstLoginHash, activeHash] = await Promise.all([
    passwordUtils.hashPassword(LOCAL_PASSWORDS.admin),
    passwordUtils.hashPassword(LOCAL_PASSWORDS.inactive),
    passwordUtils.hashPassword(LOCAL_PASSWORDS.firstLogin),
    passwordUtils.hashPassword(LOCAL_PASSWORDS.active),
  ]);

  return { adminHash, inactiveHash, firstLoginHash, activeHash };
}

async function seedDepartments() {
  const departments = {};

  for (const seed of DEPARTMENT_SEEDS) {
    departments[seed.key] = await prisma.department.upsert({
      where: { name: seed.name },
      update: { description: seed.description },
      create: { name: seed.name, description: seed.description },
    });
  }

  return departments;
}

async function seedCategories() {
  const categories = {};

  for (const seed of CATEGORY_SEEDS) {
    categories[seed.key] = await prisma.assetCategory.upsert({
      where: { name: seed.name },
      update: { description: seed.description },
      create: { name: seed.name, description: seed.description },
    });
  }

  return categories;
}

async function seedLocations() {
  const locations = {};

  locations.floor1 = await prisma.location.upsert({
    where: { name: "Tầng 1 - Phòng Hành chính & Kinh doanh" },
    update: {
      description: "Khu vực làm việc tầng 1 dành cho ban giám đốc, phòng kinh doanh và phòng hành chính nhân sự.",
      floorPlanUrl: "/floorplans/floor1.png",
    },
    create: {
      name: "Tầng 1 - Phòng Hành chính & Kinh doanh",
      description: "Khu vực làm việc tầng 1 dành cho ban giám đốc, phòng kinh doanh và phòng hành chính nhân sự.",
      floorPlanUrl: "/floorplans/floor1.png",
    },
  });

  locations.floor2 = await prisma.location.upsert({
    where: { name: "Tầng 2 - Phòng Kỹ thuật & R&D" },
    update: {
      description: "Khu vực làm việc tầng 2 dành cho đội ngũ phát triển công nghệ, máy chủ và vận hành mạng.",
      floorPlanUrl: "/floorplans/floor2.png",
    },
    create: {
      name: "Tầng 2 - Phòng Kỹ thuật & R&D",
      description: "Khu vực làm việc tầng 2 dành cho đội ngũ phát triển công nghệ, máy chủ và vận hành mạng.",
      floorPlanUrl: "/floorplans/floor2.png",
    },
  });

  return locations;
}

async function upsertEmployee({ id, employeeCode, fullName, email, departmentId, locationId, deskX, deskY, status = "ACTIVE" }) {
  return prisma.employee.upsert({
    where: { employeeCode },
    update: { fullName, email, departmentId, locationId, deskX, deskY, status },
    create: { id, employeeCode, fullName, email, departmentId, locationId, deskX, deskY, status },
  });
}

async function seedEmployees(departments, locations) {
  const employees = {};

  employees.noUser = await upsertEmployee({
    id: FIXED_IDS.employees.noUser,
    employeeCode: "EMP001",
    fullName: "Nhân viên 1",
    email: ACCOUNT_EMAILS.noUserEmployee,
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 32.5,
    deskY: 42.0,
  });
  employees.inactive = await upsertEmployee({
    id: FIXED_IDS.employees.inactive,
    employeeCode: "EMP002",
    fullName: "Inactive User Employee",
    email: ACCOUNT_EMAILS.inactive,
    departmentId: departments.administration.id,
    locationId: locations.floor1.id,
    deskX: 25.0,
    deskY: 30.0,
  });
  employees.firstLogin = await upsertEmployee({
    id: FIXED_IDS.employees.firstLogin,
    employeeCode: "EMP003",
    fullName: "First Login Employee",
    email: ACCOUNT_EMAILS.firstLogin,
    departmentId: departments.sales.id,
    locationId: locations.floor1.id,
    deskX: 42.0,
    deskY: 55.0,
  });
  employees.active = await upsertEmployee({
    id: FIXED_IDS.employees.active,
    employeeCode: "EMP004",
    fullName: "Active User Employee",
    email: ACCOUNT_EMAILS.active,
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 68.0,
    deskY: 38.5,
  });
  employees.finance = await upsertEmployee({
    id: FIXED_IDS.employees.finance,
    employeeCode: "EMP005",
    fullName: "Nguyễn Minh Anh",
    email: "minhanh@company.local",
    departmentId: departments.finance.id,
    locationId: locations.floor1.id,
    deskX: 72.0,
    deskY: 28.0,
  });
  employees.sales = await upsertEmployee({
    id: FIXED_IDS.employees.sales,
    employeeCode: "EMP006",
    fullName: "Trần Hoàng Nam",
    email: "hoangnam@company.local",
    departmentId: departments.sales.id,
    locationId: locations.floor1.id,
    deskX: 55.0,
    deskY: 65.0,
  });

  return employees;
}

async function seedUsers(employees, hashes) {
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: ACCOUNT_EMAILS.noUserEmployee },
        { employeeId: employees.noUser.id },
      ],
    },
  });

  const users = {};
  users.admin = await prisma.user.upsert({
    where: { email: ACCOUNT_EMAILS.admin },
    update: {
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
  users.inactive = await prisma.user.upsert({
    where: { email: ACCOUNT_EMAILS.inactive },
    update: {
      employeeId: employees.inactive.id,
      passwordHash: hashes.inactiveHash,
      role: "USER",
      isActive: false,
      mustChangePassword: false,
    },
    create: {
      id: FIXED_IDS.users.inactive,
      employeeId: employees.inactive.id,
      email: ACCOUNT_EMAILS.inactive,
      passwordHash: hashes.inactiveHash,
      role: "USER",
      isActive: false,
      mustChangePassword: false,
    },
  });
  users.firstLogin = await prisma.user.upsert({
    where: { email: ACCOUNT_EMAILS.firstLogin },
    update: {
      employeeId: employees.firstLogin.id,
      passwordHash: hashes.firstLoginHash,
      role: "USER",
      isActive: true,
      mustChangePassword: true,
    },
    create: {
      id: FIXED_IDS.users.firstLogin,
      employeeId: employees.firstLogin.id,
      email: ACCOUNT_EMAILS.firstLogin,
      passwordHash: hashes.firstLoginHash,
      role: "USER",
      isActive: true,
      mustChangePassword: true,
    },
  });
  users.active = await prisma.user.upsert({
    where: { email: ACCOUNT_EMAILS.active },
    update: {
      employeeId: employees.active.id,
      passwordHash: hashes.activeHash,
      role: "USER",
      isActive: true,
      mustChangePassword: false,
    },
    create: {
      id: FIXED_IDS.users.active,
      employeeId: employees.active.id,
      email: ACCOUNT_EMAILS.active,
      passwordHash: hashes.activeHash,
      role: "USER",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.passwordResetOtp.deleteMany({
    where: { userId: { in: Object.values(users).map((user) => user.id) } },
  });

  return users;
}

async function upsertAsset({ id, assetCode, ...data }) {
  return prisma.asset.upsert({
    where: { assetCode },
    update: data,
    create: { id, assetCode, ...data },
  });
}

async function seedAssets(categories, locations) {
  const assets = {};
  assets.primaryLaptop = await upsertAsset({
    id: FIXED_IDS.assets.primaryLaptop,
    assetCode: "LT-001",
    name: "Dell Latitude 5440",
    categoryId: categories.laptop.id,
    serialNumber: "DL5440-DEMO-001",
    purchaseDate: new Date("2025-01-15T00:00:00.000Z"),
    value: 28500000,
    status: "ASSIGNED",
    notes: "Laptop chính cấp cho nhân viên kỹ thuật.",
  });
  assets.spareLaptop = await upsertAsset({
    id: FIXED_IDS.assets.spareLaptop,
    assetCode: "LT-002",
    name: "HP EliteBook 840 G10",
    categoryId: categories.laptop.id,
    serialNumber: "HP840-DEMO-002",
    purchaseDate: new Date("2024-11-20T00:00:00.000Z"),
    value: 26000000,
    status: "AVAILABLE",
    notes: "Thiết bị dự phòng sẵn sàng bàn giao.",
  });
  assets.monitor = await upsertAsset({
    id: FIXED_IDS.assets.monitor,
    assetCode: "MN-001",
    name: "Dell P2422H",
    categoryId: categories.monitor.id,
    serialNumber: "DP2422-DEMO-001",
    purchaseDate: new Date("2024-08-12T00:00:00.000Z"),
    value: 5200000,
    status: "ASSIGNED",
    notes: "Màn hình làm việc 24 inch.",
  });
  assets.printer = await upsertAsset({
    id: FIXED_IDS.assets.printer,
    assetCode: "PR-001",
    name: "HP LaserJet Pro 4003dn",
    categoryId: categories.printer.id,
    serialNumber: "HP4003-DEMO-001",
    purchaseDate: new Date("2023-10-05T00:00:00.000Z"),
    value: 8900000,
    status: "MAINTENANCE",
    locationId: locations.floor1.id,
    locationX: 85.0,
    locationY: 75.0,
    notes: "Máy in dùng chung khu vực hành chính.",
  });
  assets.projector = await upsertAsset({
    id: FIXED_IDS.assets.projector,
    assetCode: "PJ-001",
    name: "Epson EB-X06",
    categoryId: categories.projector.id,
    serialNumber: "EPX06-DEMO-001",
    purchaseDate: new Date("2023-05-18T00:00:00.000Z"),
    value: 12500000,
    status: "AVAILABLE",
    locationId: locations.floor1.id,
    locationX: 50.0,
    locationY: 20.0,
    notes: "Máy chiếu phòng họp lớn.",
  });
  assets.keyboard = await upsertAsset({
    id: FIXED_IDS.assets.keyboard,
    assetCode: "KB-001",
    name: "Logitech MX Keys",
    categoryId: categories.peripheral.id,
    serialNumber: "LGMX-DEMO-001",
    purchaseDate: new Date("2025-02-10T00:00:00.000Z"),
    value: 2800000,
    status: "BROKEN",
    notes: "Thiết bị đang chờ đánh giá sửa chữa.",
  });
  assets.phone = await upsertAsset({
    id: FIXED_IDS.assets.phone,
    assetCode: "PH-001",
    name: "Samsung Galaxy S23",
    categoryId: categories.mobile.id,
    serialNumber: "SGS23-DEMO-001",
    purchaseDate: new Date("2024-02-02T00:00:00.000Z"),
    value: 18000000,
    status: "LOST",
    notes: "Đang trong quy trình xác minh thất lạc.",
  });
  assets.tablet = await upsertAsset({
    id: FIXED_IDS.assets.tablet,
    assetCode: "TB-001",
    name: "iPad Gen 9",
    categoryId: categories.mobile.id,
    serialNumber: "IPAD9-DEMO-001",
    purchaseDate: new Date("2022-06-22T00:00:00.000Z"),
    value: 9500000,
    status: "DISPOSED",
    notes: "Thiết bị đã thanh lý.",
  });

  return assets;
}

async function seedAssignments(assets, employees) {
  const assignmentSeeds = [
    {
      id: FIXED_IDS.assignments.activeLaptop,
      assetId: assets.primaryLaptop.id,
      employeeId: employees.active.id,
      assignedAt: new Date("2026-05-20T08:00:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Bàn giao laptop và bộ sạc phục vụ công việc.",
    },
    {
      id: FIXED_IDS.assignments.activeMonitor,
      assetId: assets.monitor.id,
      employeeId: employees.noUser.id,
      assignedAt: new Date("2026-05-22T08:30:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Bàn giao màn hình tại vị trí làm việc.",
    },
    {
      id: FIXED_IDS.assignments.returnedLaptop,
      assetId: assets.spareLaptop.id,
      employeeId: employees.finance.id,
      assignedAt: new Date("2026-03-01T08:00:00.000Z"),
      returnedAt: new Date("2026-04-30T09:00:00.000Z"),
      status: "RETURNED",
      notes: "Đã thu hồi sau khi hoàn thành dự án.",
    },
    {
      id: FIXED_IDS.assignments.transferredProjector,
      assetId: assets.projector.id,
      employeeId: employees.sales.id,
      assignedAt: new Date("2026-02-10T08:00:00.000Z"),
      returnedAt: new Date("2026-03-15T10:00:00.000Z"),
      status: "TRANSFERRED",
      notes: "Đã chuyển khỏi phòng kinh doanh và đưa về kho.",
    },
  ];

  for (const seed of assignmentSeeds) {
    await prisma.assetAssignment.upsert({
      where: { id: seed.id },
      update: seed,
      create: seed,
    });
  }
}

async function seedMaintenance(assets, employees) {
  const maintenanceSeeds = [
    {
      id: FIXED_IDS.maintenance.pendingLaptop,
      assetId: assets.primaryLaptop.id,
      requesterId: employees.active.id,
      description: "Quạt tản nhiệt phát tiếng ồn lớn khi chạy tác vụ nặng.",
      status: "PENDING",
      repairCost: null,
      notes: "Yêu cầu kiểm tra trong tuần.",
    },
    {
      id: FIXED_IDS.maintenance.printerRepair,
      assetId: assets.printer.id,
      requesterId: employees.noUser.id,
      description: "Máy in thường xuyên kẹt giấy và xuất hiện vệt mực.",
      status: "IN_PROGRESS",
      repairCost: 650000,
      notes: "Đã chuyển cho đơn vị bảo hành kiểm tra.",
    },
    {
      id: FIXED_IDS.maintenance.completedLaptop,
      assetId: assets.spareLaptop.id,
      requesterId: employees.finance.id,
      description: "Pin sụt nhanh và cần vệ sinh thiết bị.",
      status: "COMPLETED",
      repairCost: 1200000,
      notes: "Đã thay pin và vệ sinh hoàn tất.",
    },
  ];

  for (const seed of maintenanceSeeds) {
    await prisma.supportRequest.upsert({
      where: { id: seed.id },
      update: { priority: "MEDIUM", ...seed },
      create: { priority: "MEDIUM", ...seed },
    });
  }
}

async function seedInventory(departments, assets) {
  const activeSession = await prisma.inventorySession.upsert({
    where: { id: FIXED_IDS.inventorySessions.active },
    update: {
      name: "Kiểm kê quý II/2026 - Kỹ thuật",
      departmentId: departments.engineering.id,
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-06-15T00:00:00.000Z"),
      status: "IN_PROGRESS",
    },
    create: {
      id: FIXED_IDS.inventorySessions.active,
      name: "Kiểm kê quý II/2026 - Kỹ thuật",
      departmentId: departments.engineering.id,
      startDate: new Date("2026-06-01T00:00:00.000Z"),
      endDate: new Date("2026-06-15T00:00:00.000Z"),
      status: "IN_PROGRESS",
    },
  });
  const completedSession = await prisma.inventorySession.upsert({
    where: { id: FIXED_IDS.inventorySessions.completed },
    update: {
      name: "Kiểm kê tháng 5/2026 - Hành chính",
      departmentId: departments.administration.id,
      startDate: new Date("2026-05-20T00:00:00.000Z"),
      endDate: new Date("2026-05-25T00:00:00.000Z"),
      status: "COMPLETED",
    },
    create: {
      id: FIXED_IDS.inventorySessions.completed,
      name: "Kiểm kê tháng 5/2026 - Hành chính",
      departmentId: departments.administration.id,
      startDate: new Date("2026-05-20T00:00:00.000Z"),
      endDate: new Date("2026-05-25T00:00:00.000Z"),
      status: "COMPLETED",
    },
  });

  const itemSeeds = [
    {
      id: FIXED_IDS.inventoryItems.activeLaptop,
      sessionId: activeSession.id,
      assetId: assets.primaryLaptop.id,
      result: "OK",
      notes: "Đúng vị trí, hoạt động bình thường.",
    },
    {
      id: FIXED_IDS.inventoryItems.activeMonitor,
      sessionId: activeSession.id,
      assetId: assets.monitor.id,
      result: "OK",
      notes: "Đủ phụ kiện và không có hư hỏng.",
    },
    {
      id: FIXED_IDS.inventoryItems.activeKeyboard,
      sessionId: activeSession.id,
      assetId: assets.keyboard.id,
      result: "DAMAGED",
      notes: "Một số phím không phản hồi.",
    },
    {
      id: FIXED_IDS.inventoryItems.completedPrinter,
      sessionId: completedSession.id,
      assetId: assets.printer.id,
      result: "DAMAGED",
      notes: "Đã ghi nhận yêu cầu bảo trì.",
    },
    {
      id: FIXED_IDS.inventoryItems.completedProjector,
      sessionId: completedSession.id,
      assetId: assets.projector.id,
      result: "OK",
      notes: "Đủ dây nguồn và điều khiển.",
    },
  ];

  for (const seed of itemSeeds) {
    await prisma.inventoryItem.upsert({
      where: { id: seed.id },
      update: seed,
      create: seed,
    });
  }
}

async function seedTasks(users) {
  const activeUserId = users.active.id;

  await prisma.userTask.deleteMany({
    where: { userId: activeUserId },
  });

  const task1 = {
    userId: activeUserId,
    type: "INVENTORY_CONFIRMATION",
    title: "Xác nhận kiểm kê quý II/2026",
    description: "Nhân viên xác nhận tình trạng thực tế của laptop Dell Latitude 5440 (LT-001) trong đợt kiểm kê.",
    priority: "HIGH",
    status: "PENDING",
    actionUrl: "/employee/assets/LT-001",
    dueAt: new Date("2026-06-15T00:00:00.000Z"),
    referenceId: FIXED_IDS.inventorySessions.active,
  };

  const task2 = {
    userId: activeUserId,
    type: "ASSET_PERIODIC_CHECK",
    title: "Cập nhật tình trạng laptop LT-001",
    description: "Kiểm tra định kỳ tình trạng hoạt động của laptop Dell Latitude 5440.",
    priority: "MEDIUM",
    status: "PENDING",
    actionUrl: "/employee/assets/LT-001",
    dueAt: new Date("2026-06-10T00:00:00.000Z"),
  };

  await prisma.userTask.createMany({
    data: [task1, task2],
  });
}

async function main() {
  const hashes = await buildPasswordHashes();
  const departments = await seedDepartments();
  const categories = await seedCategories();
  const locations = await seedLocations();
  const employees = await seedEmployees(departments, locations);
  const users = await seedUsers(employees, hashes);
  const assets = await seedAssets(categories, locations);

  await seedAssignments(assets, employees);
  await seedMaintenance(assets, employees);
  await seedInventory(departments, assets);
  await seedTasks(users);

  const counts = await Promise.all([
    prisma.department.count(),
    prisma.employee.count(),
    prisma.assetCategory.count(),
    prisma.asset.count(),
    prisma.assetAssignment.count(),
    prisma.supportRequest.count(),
    prisma.inventorySession.count(),
    prisma.location.count(),
  ]);

  console.log(
    JSON.stringify(
      {
        message: "Demo database seeded successfully",
        seededAccounts: {
          admin: { email: ACCOUNT_EMAILS.admin, password: LOCAL_PASSWORDS.admin },
          activeEmployee: { email: ACCOUNT_EMAILS.active, password: LOCAL_PASSWORDS.active },
          firstLoginEmployee: { email: ACCOUNT_EMAILS.firstLogin, password: LOCAL_PASSWORDS.firstLogin },
          inactiveEmployee: { email: ACCOUNT_EMAILS.inactive, password: LOCAL_PASSWORDS.inactive },
          employeeWithoutAccount: { employeeCode: "EMP001", email: ACCOUNT_EMAILS.noUserEmployee },
        },
        totals: {
          departments: counts[0],
          employees: counts[1],
          categories: counts[2],
          assets: counts[3],
          assignments: counts[4],
          maintenanceRequests: counts[5],
          inventorySessions: counts[6],
          locations: counts[7],
        },
        seededUserIds: Object.fromEntries(
          Object.entries(users).map(([key, user]) => [key, user.id]),
        ),
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
