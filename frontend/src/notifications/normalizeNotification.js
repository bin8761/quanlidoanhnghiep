const LEGACY_TITLES = Object.freeze({
  'Ban vua duoc ban giao tai san': 'Bạn vừa được bàn giao tài sản',
  'Co yeu cau ho tro moi': 'Có yêu cầu hỗ trợ mới',
  'Yeu cau ho tro da duoc cap nhat': 'Yêu cầu hỗ trợ đã được cập nhật',
})

const LEGACY_PHRASES = Object.freeze([
  ['khong lien ket tai san', 'không liên kết tài sản'],
  ['Yeu cau ho tro', 'Yêu cầu hỗ trợ'],
  ['Nhan vien', 'Nhân viên'],
  ['Tai san', 'Tài sản'],
  [' vua gui yeu cau ', ' vừa gửi yêu cầu '],
  [' da duoc ban giao cho ban', ' đã được bàn giao cho bạn'],
  [' hien dang cho bo sung', ' hiện đang chờ bổ sung'],
  [' hien dang xu ly', ' hiện đang xử lý'],
  [' hien cho xu ly', ' hiện chờ xử lý'],
  [' hien da duyet', ' hiện đã duyệt'],
  [' hien hoan tat', ' hiện hoàn tất'],
  [' hien bi tu choi', ' hiện bị từ chối'],
  [' hien da huy', ' hiện đã hủy'],
])

function restoreVietnamese(value) {
  return LEGACY_PHRASES.reduce(
    (text, [legacy, normalized]) => text.replaceAll(legacy, normalized),
    String(value || ''),
  )
}

export function normalizeNotification(notification) {
  if (!notification) return notification

  return {
    ...notification,
    title: LEGACY_TITLES[notification.title] || restoreVietnamese(notification.title),
    message: restoreVietnamese(notification.message),
  }
}

export function normalizeNotifications(notifications = []) {
  return notifications.map(normalizeNotification)
}
