/**
 * Script to verify Person 2 - Backend Core Management APIs against a running local MySQL instance.
 */
const { exec } = require("child_process");

const BASE_URL = "http://localhost:5000/api";
let adminToken = "";

// Helper to handle API responses
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { rawText: text };
  }

  return {
    status: response.status,
    ok: response.ok,
    body: json,
  };
}

async function run() {
  console.log("====================================================");
  console.log("STARTING CORE MANAGEMENT API VERIFICATION (PERSON 2)");
  console.log("====================================================\n");

  const results = [];

  function record(module, action, passed, details = "") {
    results.push({ module, action, passed: passed ? "✅ PASS" : "❌ FAIL", details });
    console.log(`[${module}] ${action}: ${passed ? "✅ PASS" : "❌ FAIL"} ${details}`);
  }

  try {
    // 1. LOGIN
    const loginRes = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@company.local",
        password: "Admin123",
      }),
    });

    if (loginRes.status === 200 && loginRes.body.success) {
      adminToken = loginRes.body.data.accessToken;
      record("Auth", "Admin Login", true, "Obtained accessToken");
    } else {
      record("Auth", "Admin Login", false, `Status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
      throw new Error("Unable to log in as admin. Terminating verification.");
    }

    // 2. CATEGORY CRUD
    let testCategoryName = `Test Laptop ${Date.now()}`;
    let createdCategory = null;

    // POST Create Category
    const createCatRes = await request("/categories", {
      method: "POST",
      body: JSON.stringify({
        name: testCategoryName,
        description: "Temporary category for API verification",
      }),
    });
    if (createCatRes.status === 201 && createCatRes.body.success) {
      createdCategory = createCatRes.body.data;
      record("Categories", "Create Category", true, `Created ID ${createdCategory.id}`);
    } else {
      record("Categories", "Create Category", false, `Status ${createCatRes.status}`);
    }

    if (createdCategory) {
      // GET List Categories
      const listCatsRes = await request("/categories");
      const foundInList = listCatsRes.body.data?.some(c => c.id === createdCategory.id);
      record("Categories", "List Categories", listCatsRes.status === 200 && foundInList, `Found in list: ${foundInList}`);

      // PUT Update Category
      const updateCatRes = await request(`/categories/${createdCategory.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: `${testCategoryName} (Updated)`,
          description: "Updated category description",
        }),
      });
      record("Categories", "Update Category", updateCatRes.status === 200 && updateCatRes.body.data?.name.includes("(Updated)"));

      // DELETE Category
      const deleteCatRes = await request(`/categories/${createdCategory.id}`, {
        method: "DELETE",
      });
      record("Categories", "Delete Category", deleteCatRes.status === 200);
    }

    // 3. DEPARTMENT CRUD
    let testDeptName = `Test Dept ${Date.now()}`;
    let createdDept = null;

    // POST Create Department
    const createDeptRes = await request("/departments", {
      method: "POST",
      body: JSON.stringify({
        name: testDeptName,
        description: "Temporary department for API verification",
      }),
    });
    if (createDeptRes.status === 201 && createDeptRes.body.success) {
      createdDept = createDeptRes.body.data;
      record("Departments", "Create Department", true, `Created ID ${createdDept.id}`);
    } else {
      record("Departments", "Create Department", false, `Status ${createDeptRes.status}`);
    }

    if (createdDept) {
      // GET List Departments
      const listDeptsRes = await request("/departments");
      const foundInList = listDeptsRes.body.data?.some(d => d.id === createdDept.id);
      record("Departments", "List Departments", listDeptsRes.status === 200 && foundInList, `Found in list: ${foundInList}`);

      // PUT Update Department
      const updateDeptRes = await request(`/departments/${createdDept.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: `${testDeptName} (Updated)`,
          description: "Updated department description",
        }),
      });
      record("Departments", "Update Department", updateDeptRes.status === 200 && updateDeptRes.body.data?.name.includes("(Updated)"));
    }

    // 4. EMPLOYEE CRUD
    let testEmpCode = `EMP-TEST-${Date.now()}`;
    let createdEmp = null;

    // POST Create Employee
    const createEmpRes = await request("/employees", {
      method: "POST",
      body: JSON.stringify({
        employeeCode: testEmpCode,
        fullName: "Test Verification Employee",
        email: `verify.${Date.now()}@company.local`,
        departmentId: createdDept ? createdDept.id : null,
      }),
    });
    if (createEmpRes.status === 201 && createEmpRes.body.success) {
      createdEmp = createEmpRes.body.data;
      record("Employees", "Create Employee", true, `Created ID ${createdEmp.id}`);
    } else {
      record("Employees", "Create Employee", false, `Status ${createEmpRes.status}: ${JSON.stringify(createEmpRes.body)}`);
    }

    if (createdEmp) {
      // GET List Employees
      const listEmpsRes = await request("/employees");
      const foundInList = listEmpsRes.body.data?.some(e => e.id === createdEmp.id);
      record("Employees", "List Employees", listEmpsRes.status === 200 && foundInList, `Found in list: ${foundInList}`);

      // GET Employee Details
      const getEmpRes = await request(`/employees/${createdEmp.id}`);
      record("Employees", "Get Employee Details", getEmpRes.status === 200 && getEmpRes.body.data?.employeeCode === testEmpCode);

      // PUT Update Employee
      const updateEmpRes = await request(`/employees/${createdEmp.id}`, {
        method: "PUT",
        body: JSON.stringify({
          fullName: "Test Verification Employee (Updated)",
        }),
      });
      record("Employees", "Update Employee", updateEmpRes.status === 200 && updateEmpRes.body.data?.fullName.includes("(Updated)"));
    }

    // 5. ASSET CRUD
    let testAssetCode = `AST-TEST-${Date.now()}`;
    let createdAsset = null;

    // First need a permanent or temporary Category for the Asset
    let assetCat = null;
    const makeAssetCatRes = await request("/categories", {
      method: "POST",
      body: JSON.stringify({
        name: `Asset Category ${Date.now()}`,
        description: "Category for asset verification",
      }),
    });
    if (makeAssetCatRes.status === 201) {
      assetCat = makeAssetCatRes.body.data;
    }

    if (assetCat) {
      // POST Create Asset
      const createAssetRes = await request("/assets", {
        method: "POST",
        body: JSON.stringify({
          assetCode: testAssetCode,
          name: "Test Macbook Pro Verification",
          categoryId: assetCat.id,
          serialNumber: "SN-VERIFY-123",
          value: 2500,
          purchaseDate: new Date().toISOString(),
          status: "AVAILABLE",
          notes: "Asset created for API tests",
        }),
      });

      if (createAssetRes.status === 201 && createAssetRes.body.success) {
        createdAsset = createAssetRes.body.data;
        record("Assets", "Create Asset", true, `Created ID ${createdAsset.id}`);
      } else {
        record("Assets", "Create Asset", false, `Status ${createAssetRes.status}: ${JSON.stringify(createAssetRes.body)}`);
      }
    }

    if (createdAsset) {
      // GET List Assets
      const listAssetsRes = await request("/assets");
      const foundInList = listAssetsRes.body.data?.some(a => a.id === createdAsset.id);
      record("Assets", "List Assets", listAssetsRes.status === 200 && foundInList, `Found in list: ${foundInList}`);

      // GET Asset Details
      const getAssetRes = await request(`/assets/${createdAsset.id}`);
      record("Assets", "Get Asset Details", getAssetRes.status === 200 && getAssetRes.body.data?.assetCode === testAssetCode);

      // GET Asset with search filter
      const searchAssetsRes = await request(`/assets?search=Macbook`);
      const searchFound = searchAssetsRes.body.data?.some(a => a.id === createdAsset.id);
      record("Assets", "Search Assets Filter", searchAssetsRes.status === 200 && searchFound, `Keyword search found asset: ${searchFound}`);

      // PUT Update Asset
      const updateAssetRes = await request(`/assets/${createdAsset.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: "Test Macbook Pro Verification (Updated)",
          status: "MAINTENANCE",
        }),
      });
      record("Assets", "Update Asset", updateAssetRes.status === 200 && updateAssetRes.body.data?.status === "MAINTENANCE");

      // DELETE Asset
      const deleteAssetRes = await request(`/assets/${createdAsset.id}`, {
        method: "DELETE",
      });
      record("Assets", "Delete Asset", deleteAssetRes.status === 200);
    }

    // CLEANUPS
    console.log("\nStarting Cleanups...");

    if (createdEmp) {
      const delEmpRes = await request(`/employees/${createdEmp.id}`, { method: "DELETE" });
      record("Cleanups", "Delete Test Employee", delEmpRes.status === 200);
    }

    if (createdDept) {
      const delDeptRes = await request(`/departments/${createdDept.id}`, { method: "DELETE" });
      record("Cleanups", "Delete Test Department", delDeptRes.status === 200);
    }

    if (assetCat) {
      const delCatRes = await request(`/categories/${assetCat.id}`, { method: "DELETE" });
      record("Cleanups", "Delete Test Asset Category", delCatRes.status === 200);
    }

  } catch (err) {
    console.error("Fatal error during API verification script:", err);
  }

  console.log("\n====================================================");
  console.log("API VERIFICATION SUMMARY:");
  console.log("====================================================");
  console.table(results);
}

run();
