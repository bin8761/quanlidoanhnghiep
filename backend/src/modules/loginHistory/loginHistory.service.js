const repository = require("./loginHistory.repository");
const { parseUserAgent } = require("../../shared/utils/userAgent");

function createLoginHistoryService({ loginHistoryRepository = repository } = {}) {
  return Object.freeze({
    async recordLogin({ userId, ipAddress, userAgent, status = "SUCCESS" }) {
      const { os, browser, device } = parseUserAgent(userAgent);
      return loginHistoryRepository.create({
        userId,
        ipAddress,
        os,
        browser,
        device,
        status,
      });
    },

    async recordLogout(userId) {
      const activeSession = await loginHistoryRepository.findLatestActiveSession(userId);
      if (activeSession) {
        return loginHistoryRepository.update(activeSession.id, {
          logoutAt: new Date(),
        });
      }
      return null;
    },

    async getAllLogs(filters) {
      const page = Number(filters.page || 1);
      const pageSize = Number(filters.pageSize || 10);
      const search = filters.search || "";
      const status = filters.status || "";

      return loginHistoryRepository.findMany({
        page,
        pageSize,
        search,
        status,
      });
    },

    async getMyLogs(userId, filters) {
      const page = Number(filters.page || 1);
      const pageSize = Number(filters.pageSize || 10);

      return loginHistoryRepository.findByUserId(userId, {
        page,
        pageSize,
      });
    },
  });
}

const loginHistoryService = createLoginHistoryService();

module.exports = Object.freeze({
  ...loginHistoryService,
  createLoginHistoryService,
});
