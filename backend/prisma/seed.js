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
    ceo: "00000000-0000-4000-9000-000000000007",
    cto: "00000000-0000-4000-9000-000000000008",
    hrManager: "00000000-0000-4000-9000-000000000009",
    sysAdmin: "00000000-0000-4000-9000-000000000010",
    marketingLead: "00000000-0000-4000-9000-000000000011",
    designer: "00000000-0000-4000-9000-000000000012",
    support: "00000000-0000-4000-9000-000000000013",
    security: "00000000-0000-4000-9000-000000000014",
    hrSpecialist: "00000000-0000-4000-9000-000000000015",
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
  { key: "board", name: "Ban Giám đốc", description: "Lãnh đạo và quản lý chiến lược phát triển doanh nghiệp." },
  { key: "engineering", name: "Phòng Kỹ thuật", description: "Phát triển, vận hành và hỗ trợ hệ thống công nghệ." },
  { key: "sales", name: "Phòng Kinh doanh", description: "Phụ trách khách hàng, hợp đồng và hoạt động bán hàng." },
  { key: "administration", name: "Phòng Hành chính", description: "Quản lý cơ sở vật chất và hoạt động nội bộ." },
  { key: "finance", name: "Phòng Tài chính", description: "Quản lý ngân sách, thanh toán và báo cáo tài chính." },
  { key: "hr", name: "Phòng Nhân sự", description: "Tuyển dụng, đào tạo, quản lý nhân sự và chế độ phúc lợi." },
  { key: "marketing", name: "Phòng Marketing", description: "Quản lý thương hiệu, chạy chiến dịch và truyền thông." },
]);

const CATEGORY_SEEDS = Object.freeze([
  { key: "laptop", name: "Laptop", description: "Máy tính xách tay dành cho nhân viên." },
  { key: "monitor", name: "Màn hình", description: "Màn hình máy tính và thiết bị hiển thị." },
  { key: "printer", name: "Máy in", description: "Máy in và thiết bị phục vụ in ấn." },
  { key: "projector", name: "Máy chiếu", description: "Thiết bị trình chiếu cho phòng họp." },
  { key: "peripheral", name: "Thiết bị ngoại vi", description: "Bàn phím, chuột và phụ kiện máy tính." },
  { key: "mobile", name: "Thiết bị di động", description: "Điện thoại và máy tính bảng phục vụ công việc." },
  { key: "network", name: "Thiết bị mạng", description: "Router, Switch, Firewall và thiết bị Access Point phát Wifi." },
  { key: "server", name: "Máy chủ & Lưu trữ", description: "Thiết bị Server, tủ đĩa NAS, tủ Rack và bộ lưu điện UPS." },
  { key: "office", name: "Thiết bị văn phòng", description: "Máy hủy tài liệu, máy scan độc lập, điện thoại để bàn IP Phone." },
  { key: "meeting", name: "Thiết bị phòng họp", description: "Màn hình TV họp lớn, loa hội nghị họp trực tuyến." },
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

async function upsertEmployee({ id, employeeCode, fullName, email, departmentId, locationId, deskX, deskY, position = "Staff", phone = null, joinDate = new Date(), status = "ACTIVE" }) {
  return prisma.employee.upsert({
    where: { employeeCode },
    update: { fullName, email, departmentId, locationId, deskX, deskY, position, phone, joinDate, status },
    create: { id, employeeCode, fullName, email, departmentId, locationId, deskX, deskY, position, phone, joinDate, status },
  });
}

async function seedEmployees(departments, locations) {
  const employees = {};

  employees.noUser = await upsertEmployee({
    id: FIXED_IDS.employees.noUser,
    employeeCode: "EMP001",
    fullName: "Nguyễn Hữu Đạt",
    email: ACCOUNT_EMAILS.noUserEmployee,
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 63.0,
    deskY: 42.0,
    position: "Lead Developer",
    phone: "0912345678",
    joinDate: new Date("2023-01-10T00:00:00.000Z"),
  });
  employees.inactive = await upsertEmployee({
    id: FIXED_IDS.employees.inactive,
    employeeCode: "EMP002",
    fullName: "Lê Thị Hoa",
    email: ACCOUNT_EMAILS.inactive,
    departmentId: departments.administration.id,
    locationId: locations.floor1.id,
    deskX: 38.0,
    deskY: 39.5,
    position: "Admin Specialist",
    phone: "0923456789",
    joinDate: new Date("2024-05-15T00:00:00.000Z"),
    status: "INACTIVE",
  });
  employees.firstLogin = await upsertEmployee({
    id: FIXED_IDS.employees.firstLogin,
    employeeCode: "EMP003",
    fullName: "Phạm Văn Hùng",
    email: ACCOUNT_EMAILS.firstLogin,
    departmentId: departments.sales.id,
    locationId: locations.floor1.id,
    deskX: 28.5,
    deskY: 19.0,
    position: "Sales Manager",
    phone: "0934567890",
    joinDate: new Date("2023-09-01T00:00:00.000Z"),
  });
  employees.active = await upsertEmployee({
    id: FIXED_IDS.employees.active,
    employeeCode: "EMP004",
    fullName: "Hoàng Văn Sơn",
    email: ACCOUNT_EMAILS.active,
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 69.0,
    deskY: 35.0,
    position: "Senior Frontend Developer",
    phone: "0945678901",
    joinDate: new Date("2024-02-20T00:00:00.000Z"),
  });
  employees.finance = await upsertEmployee({
    id: FIXED_IDS.employees.finance,
    employeeCode: "EMP005",
    fullName: "Nguyễn Minh Anh",
    email: "minhanh@company.local",
    departmentId: departments.finance.id,
    locationId: locations.floor1.id,
    deskX: 55.6,
    deskY: 75.4,
    position: "Chief Accountant",
    phone: "0956789012",
    joinDate: new Date("2022-03-15T00:00:00.000Z"),
  });
  employees.sales = await upsertEmployee({
    id: FIXED_IDS.employees.sales,
    employeeCode: "EMP006",
    fullName: "Trần Hoàng Nam",
    email: "hoangnam@company.local",
    departmentId: departments.sales.id,
    locationId: locations.floor1.id,
    deskX: 47.5,
    deskY: 50.2,
    position: "Account Executive",
    phone: "0967890123",
    joinDate: new Date("2025-01-05T00:00:00.000Z"),
  });
  employees.ceo = await upsertEmployee({
    id: FIXED_IDS.employees.ceo,
    employeeCode: "EMP007",
    fullName: "Nguyễn Quang Huy",
    email: "quanghuy@company.local",
    departmentId: departments.board.id,
    locationId: locations.floor1.id,
    deskX: 43.8,
    deskY: 75.4,
    position: "Chief Executive Officer (CEO)",
    phone: "0901112223",
    joinDate: new Date("2020-01-01T00:00:00.000Z"),
  });
  employees.cto = await upsertEmployee({
    id: FIXED_IDS.employees.cto,
    employeeCode: "EMP008",
    fullName: "Phạm Minh Tuấn",
    email: "minhtuan@company.local",
    departmentId: departments.board.id,
    locationId: locations.floor2.id,
    deskX: 45.0,
    deskY: 22.0,
    position: "Chief Technology Officer (CTO)",
    phone: "0902223334",
    joinDate: new Date("2020-01-01T00:00:00.000Z"),
  });
  employees.hrManager = await upsertEmployee({
    id: FIXED_IDS.employees.hrManager,
    employeeCode: "EMP009",
    fullName: "Vũ Thị Mai",
    email: "thimai@company.local",
    departmentId: departments.hr.id,
    locationId: locations.floor1.id,
    deskX: 38.0,
    deskY: 39.5,
    position: "HR Manager",
    phone: "0978901234",
    joinDate: new Date("2022-08-10T00:00:00.000Z"),
  });
  employees.sysAdmin = await upsertEmployee({
    id: FIXED_IDS.employees.sysAdmin,
    employeeCode: "EMP010",
    fullName: "Lê Hoàng Long",
    email: "hoanglong@company.local",
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 79.0,
    deskY: 21.0,
    position: "System Administrator",
    phone: "0989012345",
    joinDate: new Date("2023-05-20T00:00:00.000Z"),
  });
  employees.marketingLead = await upsertEmployee({
    id: FIXED_IDS.employees.marketingLead,
    employeeCode: "EMP011",
    fullName: "Đỗ Thu Hà",
    email: "thuha@company.local",
    departmentId: departments.marketing.id,
    locationId: locations.floor1.id,
    deskX: 38.0,
    deskY: 19.0,
    position: "Marketing Lead",
    phone: "0990123456",
    joinDate: new Date("2024-03-01T00:00:00.000Z"),
  });
  employees.designer = await upsertEmployee({
    id: FIXED_IDS.employees.designer,
    employeeCode: "EMP012",
    fullName: "Ngô Minh Trí",
    email: "minhtri@company.local",
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 63.0,
    deskY: 35.0,
    position: "UX/UI Designer",
    phone: "0903334445",
    joinDate: new Date("2024-07-01T00:00:00.000Z"),
  });
  employees.support = await upsertEmployee({
    id: FIXED_IDS.employees.support,
    employeeCode: "EMP013",
    fullName: "Bùi Thanh Thảo",
    email: "thanhthao@company.local",
    departmentId: departments.sales.id,
    locationId: locations.floor1.id,
    deskX: 56.8,
    deskY: 50.2,
    position: "Customer Support Specialist",
    phone: "0904445556",
    joinDate: new Date("2025-02-15T00:00:00.000Z"),
  });
  employees.security = await upsertEmployee({
    id: FIXED_IDS.employees.security,
    employeeCode: "EMP014",
    fullName: "Hoàng Quốc Anh",
    email: "quocanh@company.local",
    departmentId: departments.engineering.id,
    locationId: locations.floor2.id,
    deskX: 79.0,
    deskY: 35.0,
    position: "Cyber Security Engineer",
    phone: "0905556667",
    joinDate: new Date("2024-10-01T00:00:00.000Z"),
  });
  employees.hrSpecialist = await upsertEmployee({
    id: FIXED_IDS.employees.hrSpecialist,
    employeeCode: "EMP015",
    fullName: "Trịnh Thu Hương",
    email: "thuhuong@company.local",
    departmentId: departments.hr.id,
    locationId: locations.floor1.id,
    deskX: 38.0,
    deskY: 50.2,
    position: "Talent Acquisition Specialist",
    phone: "0906667778",
    joinDate: new Date("2025-04-01T00:00:00.000Z"),
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
  const createData = { assetCode, ...data };
  if (id) createData.id = id;
  return prisma.asset.upsert({
    where: { assetCode },
    update: data,
    create: createData,
  });
}

async function seedAssets(categories, locations) {
  const assets = {};

  // Laptop
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
  assets.macbook = await upsertAsset({
    assetCode: "LT-003",
    name: "MacBook Pro 14 M3 Pro",
    categoryId: categories.laptop.id,
    serialNumber: "MBP14M3-DEMO-003",
    purchaseDate: new Date("2025-03-01T00:00:00.000Z"),
    value: 49500000,
    status: "ASSIGNED",
    notes: "Laptop cấu hình cao dành cho thiết kế/quản lý.",
  });
  assets.thinkpad = await upsertAsset({
    assetCode: "LT-004",
    name: "Lenovo ThinkPad T14 Gen 4",
    categoryId: categories.laptop.id,
    serialNumber: "TPT14-DEMO-004",
    purchaseDate: new Date("2024-12-15T00:00:00.000Z"),
    value: 24500000,
    status: "ASSIGNED",
    notes: "Laptop văn phòng dòng doanh nghiệp siêu bền.",
  });

  // Monitor
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
  assets.monitorLG = await upsertAsset({
    assetCode: "MN-002",
    name: "LG UltraGear 27UP600 27\" 4K",
    categoryId: categories.monitor.id,
    serialNumber: "LG27-DEMO-002",
    purchaseDate: new Date("2025-01-20T00:00:00.000Z"),
    value: 7500000,
    status: "ASSIGNED",
    notes: "Màn hình đồ họa độ phân giải cao.",
  });
  assets.monitorDellSharp = await upsertAsset({
    assetCode: "MN-003",
    name: "Dell UltraSharp U2424H",
    categoryId: categories.monitor.id,
    serialNumber: "DP2424-DEMO-003",
    purchaseDate: new Date("2025-02-15T00:00:00.000Z"),
    value: 6200000,
    status: "ASSIGNED",
    notes: "Màn hình UltraSharp cao cấp chống mỏi mắt.",
  });

  // Printer
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
    locationX: 71.0,
    locationY: 16.5,
    notes: "Máy in dùng chung khu vực hành chính.",
  });
  assets.printerCanon = await upsertAsset({
    assetCode: "PR-002",
    name: "Canon imageCLASS MF272dw",
    categoryId: categories.printer.id,
    serialNumber: "CN272-DEMO-002",
    purchaseDate: new Date("2024-05-10T00:00:00.000Z"),
    value: 4800000,
    status: "AVAILABLE",
    locationId: locations.floor1.id,
    locationX: 45.0,
    locationY: 78.0,
    notes: "Máy in/scan đa năng đặt tại phòng Admin Tầng 1.",
  });

  // Projector
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
    locationX: 22.6,
    locationY: 68.0,
    notes: "Máy chiếu phòng họp lớn.",
  });
  assets.tvSony = await upsertAsset({
    assetCode: "PJ-002",
    name: "Sony Bravia 65\" 4K TV",
    categoryId: categories.projector.id,
    serialNumber: "SN65-DEMO-002",
    purchaseDate: new Date("2024-03-20T00:00:00.000Z"),
    value: 16500000,
    status: "AVAILABLE",
    locationId: locations.floor1.id,
    locationX: 12.0,
    locationY: 68.0,
    notes: "Màn hình TV trình chiếu hội nghị phòng họp A.",
  });

  // Peripheral
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
  assets.mouseLogi = await upsertAsset({
    assetCode: "KB-002",
    name: "Logitech Signature M650",
    categoryId: categories.peripheral.id,
    serialNumber: "LGM650-DEMO-002",
    purchaseDate: new Date("2025-02-10T00:00:00.000Z"),
    value: 850000,
    status: "AVAILABLE",
    notes: "Chuột không dây công thái học dự phòng.",
  });

  // Mobile
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
  assets.iphone = await upsertAsset({
    assetCode: "PH-002",
    name: "iPhone 15 Pro 256GB",
    categoryId: categories.mobile.id,
    serialNumber: "IP15P-DEMO-002",
    purchaseDate: new Date("2024-09-30T00:00:00.000Z"),
    value: 28900000,
    status: "ASSIGNED",
    notes: "Điện thoại công tác cấp cho quản lý kinh doanh.",
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

  // Network
  assets.switchCisco = await upsertAsset({
    assetCode: "NW-001",
    name: "Cisco Catalyst 2960-L Switch",
    categoryId: categories.network.id,
    serialNumber: "CS2960-DEMO-001",
    purchaseDate: new Date("2023-11-12T00:00:00.000Z"),
    value: 18500000,
    status: "AVAILABLE",
    locationId: locations.floor2.id,
    locationX: 82.0,
    locationY: 80.0,
    notes: "Switch mạng trung tâm tầng 2 trong tủ Rack.",
  });
  assets.firewallSophos = await upsertAsset({
    assetCode: "NW-002",
    name: "Sophos XGS 136 Firewall",
    categoryId: categories.network.id,
    serialNumber: "SP136-DEMO-002",
    purchaseDate: new Date("2024-01-15T00:00:00.000Z"),
    value: 35000000,
    status: "AVAILABLE",
    locationId: locations.floor2.id,
    locationX: 82.0,
    locationY: 72.0,
    notes: "Thiết bị tường lửa cổng mạng chính của công ty.",
  });
  assets.apAruba = await upsertAsset({
    assetCode: "NW-003",
    name: "Aruba AP-515 Access Point",
    categoryId: categories.network.id,
    serialNumber: "AR515-DEMO-003",
    purchaseDate: new Date("2024-05-18T00:00:00.000Z"),
    value: 12000000,
    status: "AVAILABLE",
    locationId: locations.floor2.id,
    locationX: 52.0,
    locationY: 30.0,
    notes: "Thiết bị phát Wifi 6 gắn trần Tầng 2.",
  });

  // Server
  assets.serverDell = await upsertAsset({
    assetCode: "SV-001",
    name: "Dell PowerEdge R760 Server",
    categoryId: categories.server.id,
    serialNumber: "DPE760-DEMO-001",
    purchaseDate: new Date("2024-06-25T00:00:00.000Z"),
    value: 145000000,
    status: "AVAILABLE",
    locationId: locations.floor2.id,
    locationX: 76.0,
    locationY: 72.0,
    notes: "Máy chủ Server chạy hệ thống ảo hóa dữ liệu nội bộ.",
  });
  assets.nasSynology = await upsertAsset({
    assetCode: "SV-002",
    name: "Synology NAS DS923+",
    categoryId: categories.server.id,
    serialNumber: "SY923-DEMO-002",
    purchaseDate: new Date("2024-08-10T00:00:00.000Z"),
    value: 18900000,
    status: "AVAILABLE",
    locationId: locations.floor2.id,
    locationX: 76.0,
    locationY: 80.0,
    notes: "Ổ đĩa mạng trung tâm lưu trữ và sao lưu dữ liệu.",
  });
  assets.upsApc = await upsertAsset({
    assetCode: "SV-003",
    name: "APC Smart-UPS 1500VA",
    categoryId: categories.server.id,
    serialNumber: "APC1500-DEMO-003",
    purchaseDate: new Date("2023-09-05T00:00:00.000Z"),
    value: 11200000,
    status: "MAINTENANCE",
    locationId: locations.floor2.id,
    locationX: 82.0,
    locationY: 88.0,
    notes: "Bộ lưu điện dự phòng cấp nguồn tủ Rack khi mất điện.",
  });

  // Office Equipment
  assets.shredderSilicon = await upsertAsset({
    assetCode: "OF-001",
    name: "Silicon PS-800C Shredder",
    categoryId: categories.office.id,
    serialNumber: "SL800-DEMO-001",
    purchaseDate: new Date("2024-04-12T00:00:00.000Z"),
    value: 3200000,
    status: "AVAILABLE",
    locationId: locations.floor1.id,
    locationX: 84.0,
    notes: "Máy hủy tài liệu giấy hành chính tại quầy in.",
  });
  assets.scannerFujitsu = await upsertAsset({
    assetCode: "OF-002",
    name: "Fujitsu ScanSnap iX1600",
    categoryId: categories.office.id,
    serialNumber: "FJ1600-DEMO-002",
    purchaseDate: new Date("2024-07-22T00:00:00.000Z"),
    value: 11500000,
    status: "AVAILABLE",
    locationId: locations.floor1.id,
    locationX: 38.0,
    locationY: 78.0,
    notes: "Máy quét tài liệu scan trực tiếp lưu cloud.",
  });

  // Meeting Room Equipment
  assets.speakerJabra = await upsertAsset({
    assetCode: "MT-001",
    name: "Jabra Speak 750",
    categoryId: categories.meeting.id,
    serialNumber: "JB750-DEMO-001",
    purchaseDate: new Date("2024-10-18T00:00:00.000Z"),
    value: 6800000,
    status: "AVAILABLE",
    notes: "Loa và mic Bluetooth di động phục vụ họp trực tuyến.",
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
      notes: "Bàn giao laptop và bộ sạc phục vụ công việc lập trình.",
    },
    {
      id: FIXED_IDS.assignments.activeMonitor,
      assetId: assets.monitor.id,
      employeeId: employees.noUser.id,
      assignedAt: new Date("2026-05-22T08:30:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Bàn giao màn hình làm việc tại vị trí.",
    },
    {
      id: FIXED_IDS.assignments.returnedLaptop,
      assetId: assets.spareLaptop.id,
      employeeId: employees.finance.id,
      assignedAt: new Date("2026-03-01T08:00:00.000Z"),
      returnedAt: new Date("2026-04-30T09:00:00.000Z"),
      status: "RETURNED",
      notes: "Đã thu hồi sau khi hoàn thành dự án kiểm toán tài chính năm.",
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
    {
      id: "20000000-0000-4000-8000-000000000005",
      assetId: assets.macbook.id,
      employeeId: employees.ceo.id,
      assignedAt: new Date("2025-03-02T09:00:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Bàn giao MacBook Pro 14 M3 Pro cấp cho CEO làm việc.",
    },
    {
      id: "20000000-0000-4000-8000-000000000006",
      assetId: assets.thinkpad.id,
      employeeId: employees.hrManager.id,
      assignedAt: new Date("2024-12-16T09:00:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Bàn giao Lenovo ThinkPad T14 Gen 4 cho Trưởng phòng Nhân sự.",
    },
    {
      id: "20000000-0000-4000-8000-000000000007",
      assetId: assets.monitorDellSharp.id,
      employeeId: employees.finance.id,
      assignedAt: new Date("2025-02-16T08:30:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Màn hình Dell UltraSharp bổ sung cho bàn Kế toán trưởng.",
    },
    {
      id: "20000000-0000-4000-8000-000000000008",
      assetId: assets.monitorLG.id,
      employeeId: employees.designer.id,
      assignedAt: new Date("2025-01-21T09:30:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Màn hình đồ họa LG 27 inch cấp cho Designer thiết kế UI/UX.",
    },
    {
      id: "20000000-0000-4000-8000-000000000009",
      assetId: assets.iphone.id,
      employeeId: employees.sales.id,
      assignedAt: new Date("2024-10-01T08:00:00.000Z"),
      returnedAt: null,
      status: "ACTIVE",
      notes: "Điện thoại iPhone 15 Pro cấp cho Trưởng nhóm Kinh doanh liên hệ khách hàng.",
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
    {
      id: "30000000-0000-4000-8000-000000000004",
      assetId: assets.firewallSophos.id,
      requesterId: employees.cto.id,
      description: "Cấu hình cổng VPN và thiết lập các quy tắc bảo mật mạng (Firewall rules) cho văn phòng làm việc mới.",
      status: "COMPLETED",
      repairCost: 0,
      notes: "Phê duyệt bởi CTO.",
      resolution: "Đã hoàn thành cấu hình VPN cho các phòng ban, mở các cổng cần thiết cho kết nối Server.",
      completedAt: new Date("2026-04-10T17:00:00.000Z"),
    },
    {
      id: "30000000-0000-4000-8000-000000000005",
      assetId: assets.serverDell.id,
      requesterId: employees.sysAdmin.id,
      description: "Hệ thống RAID báo động một ổ đĩa SSD SAS 1.92TB bị hỏng cần thay thế dự phòng nóng.",
      status: "COMPLETED",
      repairCost: 8500000,
      resolution: "Đã thay ổ cứng mới SSD Enterprise Dell, hệ thống RAID đã rebuilt hoàn tất 100%.",
      completedAt: new Date("2026-05-12T11:30:00.000Z"),
    },
    {
      id: "30000000-0000-4000-8000-000000000006",
      assetId: assets.upsApc.id,
      requesterId: employees.sysAdmin.id,
      description: "Bộ lưu điện UPS APC báo động lỗi ắc quy (Replace Battery). Cần mua cụm ắc quy dự phòng mới và thay thế gấp.",
      status: "IN_PROGRESS",
      repairCost: 4500000,
      notes: "Đã gửi đề xuất mua sắm ắc quy chính hãng APC, đang chờ duyệt chi ngân sách từ phòng kế toán.",
    },
    {
      id: "30000000-0000-4000-8000-000000000007",
      assetId: assets.macbook.id,
      requesterId: employees.ceo.id,
      description: "Màn hình MacBook Pro thỉnh thoảng có hiện tượng giật sọc ngang màu xanh ở cạnh dưới.",
      status: "PENDING",
      notes: "Cần kiểm tra xem do cáp màn hình hay lỗi card đồ họa.",
    },
    {
      id: "30000000-0000-4000-8000-000000000008",
      assetId: assets.iphone.id,
      requesterId: employees.sales.id,
      description: "Điện thoại bị rơi vỡ mặt kính màn hình trong quá trình đi công tác gặp gỡ khách hàng.",
      status: "COMPLETED",
      repairCost: 3800000,
      resolution: "Đã ép lại mặt kính màn hình chính hãng tại trung tâm ủy quyền Apple.",
      completedAt: new Date("2026-05-02T16:00:00.000Z"),
    },
    {
      id: "30000000-0000-4000-8000-000000000009",
      assetId: assets.printerCanon.id,
      requesterId: employees.hrSpecialist.id,
      description: "Máy in Canon thường xuyên bị kẹt giấy ở khay nạp và phát tiếng kêu lộc cộc.",
      status: "COMPLETED",
      repairCost: 350000,
      resolution: "Vệ sinh quả lô cuốn giấy (roller) và trục ép, máy hoạt động êm trở lại.",
      completedAt: new Date("2026-05-25T10:30:00.000Z"),
    },
    {
      id: "30000000-0000-4000-8000-000000000010",
      assetId: assets.scannerFujitsu.id,
      requesterId: employees.hrManager.id,
      description: "Tài liệu sau khi quét bằng khay nạp tự động ADF bị lệch góc khoảng 3-5 độ.",
      status: "PENDING",
      notes: "Hỗ trợ căn chỉnh lại khay dẫn giấy hoặc cài đặt lại driver.",
    },
    {
      id: "30000000-0000-4000-8000-000000000011",
      assetId: assets.apAruba.id,
      requesterId: employees.designer.id,
      description: "Sóng Wifi ở khu vực bàn thiết kế chập chờn, thường xuyên bị ngắt kết nối vào buổi chiều khi đông người dùng.",
      status: "COMPLETED",
      repairCost: 0,
      resolution: "Đã tối ưu lại kênh phát sóng (channel bonding) và công suất phát trên controller Aruba để giảm nhiễu.",
      completedAt: new Date("2026-06-03T15:00:00.000Z"),
    },
    {
      id: "30000000-0000-4000-8000-000000000012",
      assetId: assets.keyboard.id,
      requesterId: employees.active.id,
      description: "Bàn phím Logitech MX Keys bị đổ nước trà, phím Spacebar và phím Enter bị kẹt cứng bấm không nhận.",
      status: "COMPLETED",
      repairCost: 0,
      resolution: "Không thể khắc phục do chập mạch phím, đã lập biên bản báo hỏng và cấp bàn phím mới thay thế.",
      completedAt: new Date("2026-05-18T09:00:00.000Z"),
    },
    {
      id: "30000000-0000-4000-8000-000000000013",
      assetId: assets.switchCisco.id,
      requesterId: employees.security.id,
      description: "Cần chia thêm VLAN khách (Guest WiFi VLAN 50) để cách ly truy cập với mạng nội bộ văn phòng.",
      status: "COMPLETED",
      repairCost: 0,
      resolution: "Cấu hình xong Trunk port trên Cisco Switch và cấu hình DHCP Server cấp IP riêng cho VLAN 50.",
      completedAt: new Date("2026-05-30T14:30:00.000Z"),
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
