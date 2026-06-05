import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../auth/auth-context'
import AdminLayout from '../layouts/AdminLayout'
import EmployeeLayout from '../layouts/EmployeeLayout'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/admin/DashboardPage'
import CategoriesPage from '../pages/admin/CategoriesPage'
import ManagementPage from '../pages/admin/ManagementPage'
import { managementPages } from '../pages/admin/managementData'
import EmployeeAssetsPage from '../pages/employee/EmployeeAssetsPage'
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage'
import EmployeeProfilePage from '../pages/employee/EmployeeProfilePage'
import EmployeeRequestsPage from '../pages/employee/EmployeeRequestsPage'

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
        <Route path="categories" element={<CategoriesPage />} />
        {Object.entries(managementPages)
          .filter(([path]) => path !== 'categories')
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
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
