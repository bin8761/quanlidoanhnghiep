import { expect, test } from '@playwright/test'

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
  await expect(page.getByRole('heading', { name: 'Chào buổi sáng, Quản trị viên' })).toBeVisible()
  await expect(page.getByText('Tổng tài sản', { exact: true })).toBeVisible()
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
  await page.getByRole('link', { name: 'Tài sản' }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Quản lý tài sản' })).toBeVisible()
  const search = page.getByPlaceholder('Tìm theo mã hoặc tên tài sản...')
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

  await page.getByRole('link', { name: 'Danh mục' }).click()
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
