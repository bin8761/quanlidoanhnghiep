import { expect, test } from '@playwright/test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { PrismaClient } = require('../../backend/node_modules/@prisma/client')
const workflowAssetCodes = new Set()

test.afterEach(async () => {
  if (!workflowAssetCodes.size) return

  const prisma = new PrismaClient()
  try {
    const assets = await prisma.asset.findMany({
      where: { assetCode: { in: [...workflowAssetCodes] } },
      select: { id: true },
    })
    const assetIds = assets.map((asset) => asset.id)
    await prisma.assetAssignment.deleteMany({ where: { assetId: { in: assetIds } } })
    await prisma.asset.deleteMany({ where: { id: { in: assetIds } } })
  } finally {
    workflowAssetCodes.clear()
    await prisma.$disconnect()
  }
})

function collectConsoleErrors(page) {
  const errors = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

async function loginAsAdmin(page) {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
}

async function loginAsEmployee(page) {
  await page.goto('/login')
  await page.getByLabel('Email công ty').fill('active.employee@company.local')
  await page.getByLabel('Mật khẩu').fill('Active1234')
  await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  await expect(page).toHaveURL(/\/employee\/dashboard$/)
}

test('desktop login and dashboard render without console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 1440, height: 960 })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()
  await expect(page.getByLabel('Email công ty')).toBeVisible()
  await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Chào buổi (sáng|chiều|tối), Quản trị viên/ })).toBeVisible()
  await expect(page.getByText('Tổng tài sản', { exact: true })).toBeVisible()
  await page.keyboard.press('Control+k')
  const quickSearch = page.getByRole('dialog', { name: 'Đi tới chức năng' })
  await expect(quickSearch).toBeVisible()
  await quickSearch.getByPlaceholder('Nhập tên chức năng...').fill('Báo cáo')
  await quickSearch.getByRole('button', { name: /Báo cáo tài sản/ }).click()
  await expect(page).toHaveURL(/\/admin\/reports$/)
  await page.goto('/admin/dashboard')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/desktop-dashboard.png', fullPage: true })

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('mobile login, dashboard and sidebar remain usable', async ({ page }) => {
  const errors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()
  await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard$/)

  await page.getByTitle('Mở menu').click()
  const sidebar = page.getByRole('complementary')
  await expect(page.getByRole('navigation', { name: 'Điều hướng quản trị' })).toBeVisible()
  await expect(sidebar.getByText('EAM Workspace', { exact: true })).toBeVisible()
  await expect(sidebar).toHaveCSS('width', '272px')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/mobile-sidebar.png' })

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('management table, empty state and modal work without console errors', async ({ page }) => {
  const errors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 1280, height: 900 })
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Tài sản', exact: true }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Quản lý tài sản' })).toBeVisible()
  const search = page.getByPlaceholder('Tìm theo mã, tên hoặc serial...')
  await search.fill('không tồn tại')
  await expect(page.getByText('Không tìm thấy dữ liệu')).toBeVisible()
  await search.fill('')

  await page.getByRole('button', { name: 'Thêm tài sản' }).click()
  await expect(page.getByRole('dialog', { name: 'Thêm tài sản' })).toBeVisible()
  await expect(page.getByLabel('Mã tài sản')).toBeVisible()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'test-results/desktop-management-modal.png' })

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('registration page validates employee registration fields', async ({ page }) => {
  const errors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  await expect(page.getByText('Xem không gian demo')).toHaveCount(0)
  await page.getByRole('link', { name: 'Đăng ký bằng mã nhân viên' }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeVisible()

  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page.getByText('Vui lòng nhập mã nhân viên.')).toBeVisible()
  await expect(page.getByText('Email không hợp lệ.')).toBeVisible()
  await expect(page.getByText('Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số.')).toBeVisible()

  expect(errors).toEqual([])
})

test('employee can use dashboard, mobile navigation and create a support request', async ({ page }) => {
  const errors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await loginAsEmployee(page)
  await expect(page.getByRole('heading', { name: /Chào bạn/ })).toBeVisible()
  await expect(page.getByText('Tài sản đang giữ')).toBeVisible()

  await page.getByTitle('Mở menu').click()
  await expect(page.getByRole('navigation', { name: 'Điều hướng nhân viên' })).toBeVisible()
  await page.getByRole('link', { name: 'Yêu cầu hỗ trợ' }).click()
  await expect(page).toHaveURL(/\/employee\/requests$/)

  await page.getByRole('button', { name: 'Tạo yêu cầu' }).click()
  await page
    .getByLabel('Mô tả sự cố')
    .fill('Bàn phím bị mất kết nối khi sử dụng trong thời gian dài')
  await page.getByRole('button', { name: 'Gửi yêu cầu' }).click()
  await expect(page.getByText('Yêu cầu hỗ trợ đã được gửi thành công.')).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('admin can create, update and delete a category through the real API', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  const categoryName = `Playwright Category ${Date.now()}`
  const updatedName = `${categoryName} Updated`

  await page.setViewportSize({ width: 1280, height: 900 })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Danh mục', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Danh mục tài sản' })).toBeVisible()

  await page.getByRole('button', { name: 'Thêm danh mục' }).click()
  await page.getByLabel('Tên danh mục').fill(categoryName)
  await page.getByLabel('Mô tả').fill('Danh mục tạo bởi kiểm thử giao diện')
  await page
    .getByRole('dialog', { name: 'Thêm danh mục' })
    .getByRole('button', { name: 'Thêm danh mục', exact: true })
    .click()
  await expect(page.getByText('Thêm danh mục thành công.')).toBeVisible()

  const search = page.getByPlaceholder('Tìm danh mục...')
  await search.fill(categoryName)
  await expect(page.getByText(categoryName, { exact: true })).toBeVisible()

  await page.getByTitle(`Sửa ${categoryName}`).click()
  await page.getByLabel('Tên danh mục').fill(updatedName)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Cập nhật danh mục thành công.')).toBeVisible()

  await search.fill(updatedName)
  await expect(page.getByText(updatedName, { exact: true })).toBeVisible()
  await page.getByTitle(`Xóa ${updatedName}`).click()
  await page
    .getByRole('dialog', { name: `Xóa danh mục "${updatedName}"?` })
    .getByRole('button', { name: 'Xóa danh mục' })
    .click()
  await expect(page.getByText('Xóa danh mục thành công.')).toBeVisible()

  await search.fill(updatedName)
  await expect(page.getByText('Không tìm thấy dữ liệu')).toBeVisible()
  expect(errors).toEqual([])
})

test('admin can manage departments, employees and assets through the real APIs', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  const suffix = Date.now()
  const departmentName = `QA Department ${suffix}`
  const updatedDepartmentName = `${departmentName} Updated`
  const employeeCode = `QA${String(suffix).slice(-6)}`
  const employeeName = `QA Employee ${suffix}`
  const updatedEmployeeName = `${employeeName} Updated`
  const employeeEmail = `qa.employee.${suffix}@company.local`
  const assetCode = `QA-${String(suffix).slice(-6)}`
  const assetName = `QA Laptop ${suffix}`
  const updatedAssetName = `${assetName} Updated`

  await page.setViewportSize({ width: 1440, height: 960 })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Phòng ban', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm phòng ban' }).click()
  await page.getByLabel('Tên phòng ban').fill(departmentName)
  await page.getByLabel('Mô tả').fill('Phòng ban được tạo bởi kiểm thử UI')
  await page
    .getByRole('dialog', { name: 'Thêm phòng ban' })
    .getByRole('button', { name: 'Thêm phòng ban', exact: true })
    .click()
  await expect(page.getByText('Thêm phòng ban thành công.')).toBeVisible()
  await page.getByTitle(`Sửa ${departmentName}`).click()
  await page.getByLabel('Tên phòng ban').fill(updatedDepartmentName)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Cập nhật phòng ban thành công.')).toBeVisible()

  await page.getByRole('link', { name: 'Nhân viên', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm nhân viên' }).click()
  await page.getByLabel('Mã nhân viên').fill(employeeCode)
  await page.getByLabel('Họ và tên').fill(employeeName)
  await page.getByLabel('Email công ty').fill(employeeEmail)
  const employeeDialog = page.getByRole('dialog', { name: 'Thêm nhân viên' })
  await employeeDialog.getByLabel('Phòng ban', { exact: true }).selectOption({ label: updatedDepartmentName })
  await employeeDialog
    .getByRole('button', { name: 'Thêm nhân viên', exact: true })
    .click()
  await expect(page.getByText('Thêm nhân viên thành công.')).toBeVisible()
  await page.getByTitle(`Sửa ${employeeName}`).click()
  await page.getByLabel('Họ và tên').fill(updatedEmployeeName)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Cập nhật nhân viên thành công.')).toBeVisible()

  await page.getByRole('link', { name: 'Tài sản', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm tài sản' }).click()
  await page.getByLabel('Mã tài sản').fill(assetCode)
  await page.getByLabel('Tên tài sản').fill(assetName)
  const assetDialog = page.getByRole('dialog', { name: 'Thêm tài sản' })
  await assetDialog.getByLabel('Danh mục', { exact: true }).selectOption({ label: 'Laptop' })
  await page.getByLabel('Số serial').fill(`SN-${suffix}`)
  await page.getByLabel('Giá trị (VND)').fill('25000000')
  await page
    .getByRole('dialog', { name: 'Thêm tài sản' })
    .getByRole('button', { name: 'Thêm tài sản', exact: true })
    .click()
  await expect(page.getByText('Thêm tài sản thành công.')).toBeVisible()
  await page.getByTitle(`Sửa ${assetName}`).click()
  await page.getByLabel('Tên tài sản').fill(updatedAssetName)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Cập nhật tài sản thành công.')).toBeVisible()
  await page.getByTitle(`Xóa ${updatedAssetName}`).click()
  await page
    .getByRole('dialog', { name: `Xóa tài sản "${updatedAssetName}"?` })
    .getByRole('button', { name: 'Xóa tài sản' })
    .click()
  await expect(page.getByText('Xóa tài sản thành công.')).toBeVisible()

  await page.getByRole('link', { name: 'Nhân viên', exact: true }).click()
  await page.getByTitle(`Xóa ${updatedEmployeeName}`).click()
  await page
    .getByRole('dialog', { name: `Xóa nhân viên "${updatedEmployeeName}"?` })
    .getByRole('button', { name: 'Xóa nhân viên' })
    .click()
  await expect(page.getByText('Xóa nhân viên thành công.')).toBeVisible()

  await page.getByRole('link', { name: 'Phòng ban', exact: true }).click()
  await page.getByTitle(`Xóa ${updatedDepartmentName}`).click()
  await page
    .getByRole('dialog', { name: `Xóa phòng ban "${updatedDepartmentName}"?` })
    .getByRole('button', { name: 'Xóa phòng ban' })
    .click()
  await expect(page.getByText('Xóa phòng ban thành công.')).toBeVisible()

  expect(errors).toEqual([])
})

test('employee can view asset detail and history pages', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  await loginAsEmployee(page)

  await page.getByRole('link', { name: 'Tài sản của tôi' }).click()
  await page.getByText('LT-0248').first().click() // hoặc click card
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Dell Latitude')

  await page.goto('/employee/history')
  await expect(page.getByRole('button', { name: 'Lịch sử bàn giao' })).toBeVisible()

  expect(errors).toEqual([])
})

test('admin can assign, transfer and return an asset through the real APIs', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  const suffix = Date.now()
  const assetCode = `WF-${String(suffix).slice(-6)}`
  const assetName = `Workflow Asset ${suffix}`
  workflowAssetCodes.add(assetCode)

  await page.setViewportSize({ width: 1440, height: 960 })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Tài sản', exact: true }).click()
  await page.getByRole('button', { name: 'Thêm tài sản' }).click()
  const assetDialog = page.getByRole('dialog', { name: 'Thêm tài sản' })
  await assetDialog.getByLabel('Mã tài sản').fill(assetCode)
  await assetDialog.getByLabel('Tên tài sản').fill(assetName)
  await assetDialog.getByLabel('Danh mục').selectOption({ label: 'Laptop' })
  await assetDialog.getByRole('button', { name: 'Thêm tài sản', exact: true }).click()
  await expect(page.getByText('Thêm tài sản thành công.')).toBeVisible()

  await page.getByRole('link', { name: 'Bàn giao', exact: true }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Quản lý bàn giao' })).toBeVisible()
  await page.screenshot({ path: 'test-results/week3-assignment-desktop.png', fullPage: true })
  await page.getByRole('button', { name: 'Tạo bàn giao' }).click()

  const assignDialog = page.getByRole('dialog', { name: 'Tạo bàn giao tài sản' })
  await assignDialog.getByLabel('Tài sản').selectOption({ label: `${assetCode} - ${assetName}` })
  await assignDialog.getByLabel('Nhân viên nhận').selectOption({ label: 'EMP001 - Nhân viên 1' })
  await assignDialog.getByLabel('Ghi chú').fill('Bàn giao từ kiểm thử giao diện tuần 3')
  await assignDialog.getByRole('button', { name: 'Xác nhận bàn giao' }).click()
  await expect(page.getByText('Bàn giao tài sản thành công.')).toBeVisible()

  await page.getByTitle(`Chuyển giao ${assetCode}`).click()
  const transferDialog = page.getByRole('dialog', { name: `Chuyển giao ${assetCode}` })
  await transferDialog
    .getByLabel('Nhân viên nhận mới')
    .selectOption({ label: 'EMP002 - Inactive User Employee' })
  await transferDialog.getByLabel('Ghi chú chuyển giao').fill('Chuyển giao để kiểm thử lịch sử')
  await transferDialog.getByRole('button', { name: 'Xác nhận chuyển giao' }).click()
  await expect(page.getByText('Chuyển giao tài sản thành công.')).toBeVisible()

  await page.getByTitle(`Thu hồi ${assetCode}`).click()
  const returnDialog = page.getByRole('dialog', { name: `Thu hồi ${assetCode}` })
  await returnDialog.getByLabel('Tình trạng sau thu hồi').selectOption('AVAILABLE')
  await returnDialog.getByLabel('Biên bản / ghi chú').fill('Tài sản hoạt động bình thường')
  await returnDialog.getByRole('button', { name: 'Xác nhận thu hồi' }).click()
  await expect(page.getByText('Thu hồi tài sản thành công.')).toBeVisible()

  await page.getByLabel('Trạng thái').selectOption('RETURNED')
  await expect(page.getByRole('table').getByText('Đã thu hồi').first()).toBeVisible()
  await page.getByLabel('Trạng thái').selectOption('TRANSFERRED')
  await expect(page.getByRole('table').getByText('Đã chuyển giao').first()).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/week3-assignment-mobile.png', fullPage: true })
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('admin can open maintenance, inventory and report workflows', async ({ page }) => {
  const errors = collectConsoleErrors(page)

  await page.setViewportSize({ width: 1440, height: 960 })
  await loginAsAdmin(page)

  await page.getByRole('link', { name: 'Bảo trì', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Yêu cầu bảo trì' })).toBeVisible()
  await page.getByRole('button', { name: 'Tạo yêu cầu' }).click()
  const maintenanceDialog = page.getByRole('dialog', { name: 'Tạo yêu cầu bảo trì' })
  await expect(maintenanceDialog).toBeVisible()
  await maintenanceDialog.getByRole('button', { name: 'Đóng' }).click()

  await page.getByRole('link', { name: 'Kiểm kê', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Phiên kiểm kê' })).toBeVisible()
  await page.getByRole('button', { name: 'Tạo phiên kiểm kê' }).click()
  const inventoryDialog = page.getByRole('dialog', { name: 'Tạo phiên kiểm kê' })
  await expect(inventoryDialog).toBeVisible()
  await inventoryDialog.getByRole('button', { name: 'Đóng' }).click()

  await page.getByRole('link', { name: 'Báo cáo', exact: true }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Báo cáo tài sản' })).toBeVisible()
  await expect(page.getByText('Tổng tài sản')).toBeVisible()
  await expect(page.getByText('Tài sản theo danh mục')).toBeVisible()
  await page.screenshot({ path: 'test-results/week4-reports-desktop.png', fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'test-results/week4-reports-mobile.png', fullPage: true })
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  expect(hasHorizontalOverflow).toBe(false)
  expect(errors).toEqual([])
})

test('all admin pages remain responsive and console-clean', async ({ page }) => {
  const errors = collectConsoleErrors(page)
  const routes = [
    '/admin/dashboard',
    '/admin/assets',
    '/admin/categories',
    '/admin/employees',
    '/admin/departments',
    '/admin/assignments',
    '/admin/maintenance',
    '/admin/inventory',
    '/admin/reports',
  ]

  await page.setViewportSize({ width: 1366, height: 900 })
  await loginAsAdmin(page)

  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    const hasDesktopOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasDesktopOverflow, `desktop overflow at ${route}`).toBe(false)
  }

  await page.goto('/admin/dashboard')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/week5-admin-dashboard-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(500)

  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    const hasMobileOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(hasMobileOverflow, `mobile overflow at ${route}`).toBe(false)
  }

  await page.goto('/admin/dashboard')
  await page.waitForTimeout(600)
  await page.screenshot({ path: 'test-results/week5-admin-dashboard-mobile.png', fullPage: true })
  expect(errors).toEqual([])
})
