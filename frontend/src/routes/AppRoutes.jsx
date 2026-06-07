import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import AdminLayout from '../layouts/AdminLayout'
import EmployeeLayout from '../layouts/EmployeeLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/admin/DashboardPage'
import AssetsPage from '../pages/admin/AssetsPage'
import AssignmentsPage from '../pages/admin/AssignmentsPage'
import CategoriesPage from '../pages/admin/CategoriesPage'
import DepartmentsPage from '../pages/admin/DepartmentsPage'
import EmployeesPage from '../pages/admin/EmployeesPage'
import InventoryPage from '../pages/admin/InventoryPage'
import MaintenancePage from '../pages/admin/MaintenancePage'
import ManagementPage from '../pages/admin/ManagementPage'
import { managementPages } from '../pages/admin/managementData'
import ReportsPage from '../pages/admin/ReportsPage'
import EmployeeAssetsPage from '../pages/employee/EmployeeAssetsPage'
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage'
import EmployeeProfilePage from '../pages/employee/EmployeeProfilePage'
import EmployeeRequestsPage from '../pages/employee/EmployeeRequestsPage'
import EmployeeChangePasswordPage from '../pages/employee/EmployeeChangePasswordPage'
import EmployeeHistoryPage from '../pages/employee/EmployeeHistoryPage'
import EmployeeAssetDetailPage from '../pages/employee/EmployeeAssetDetailPage'

function ProtectedAdminRoute() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3f7f5]">
        <div className="text-center">
          <div
            className="mx-auto size-9 animate-spin-soft rounded-full border-3 border-brand-100 border-t-brand-600"
            aria-label="Đang tải"
          />
          <p className="mt-4 text-xs font-semibold text-slate-500">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  return <AdminLayout />
}

function ProtectedEmployeeRoute() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f3f7f5]">
        <div
          className="size-9 animate-spin-soft rounded-full border-3 border-brand-100 border-t-brand-600"
          aria-label="Đang tải"
        />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'USER') return <Navigate to="/admin/dashboard" replace />

  return <EmployeeLayout />
}

function LoginRoute() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'USER') return <Navigate to="/employee/dashboard" replace />
  return <LoginPage />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin" element={<ProtectedAdminRoute />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        {Object.entries(managementPages)
          .filter(([path]) => ![
            'assets',
            'categories',
            'employees',
            'departments',
            'assignments',
            'maintenance',
            'inventory',
            'reports',
          ].includes(path))
          .map(([path, config]) => (
          <Route key={path} path={path} element={<ManagementPage config={config} />} />
          ))}
      </Route>
      <Route path="/employee" element={<ProtectedEmployeeRoute />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboardPage />} />
        <Route path="assets" element={<EmployeeAssetsPage />} />
        <Route path="requests" element={<EmployeeRequestsPage />} />
        <Route path="profile" element={<EmployeeProfilePage />} />
        <Route path="change-password" element={<EmployeeChangePasswordPage />} />
        <Route path="history" element={<EmployeeHistoryPage />} />
        <Route path="assets/:code" element={<EmployeeAssetDetailPage />} />  {/* Demo nên đang dùng: assets/:code |  Có thể thay sang: assets/:id */}
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
