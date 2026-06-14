const repository = require("./supportChat.repository");
const logger = require("../../config/logger");
const AppError = require("../../shared/errors/AppError");
const ERROR_CODES = require("../../shared/errors/errorCodes");
const { ADMIN, USER } = require("../../shared/constants/roles");

const HANDOVER_KEYWORDS = [
  "admin",
  "hỗ trợ",
  "nhân viên",
  "hotline",
  "liên hệ",
  "gặp người",
  "người hỗ trợ",
  "chat trực tiếp",
  "live chat",
  "ho tro",
  "gap nguoi",
  "nhan vien",
  "tro chuyen"
];

function isHandoverIntent(messageText) {
  const normalizedText = messageText.toLowerCase().trim();
  return HANDOVER_KEYWORDS.some(keyword => normalizedText.includes(keyword));
}

// Fallback rule-based responder
function getRuleBasedResponse(messageText, context) {
  const normalizedText = messageText.toLowerCase().trim();

  // 1. Assets keyword check
  if (
    normalizedText.includes("tài sản") ||
    normalizedText.includes("tai san") ||
    normalizedText.includes("thiết bị") ||
    normalizedText.includes("thiet bi") ||
    normalizedText.includes("máy tính") ||
    normalizedText.includes("laptop") ||
    normalizedText.includes("đang giữ") ||
    normalizedText.includes("dang giu")
  ) {
    if (!context.assignments || context.assignments.length === 0) {
      return "Hiện tại hệ thống không ghi nhận bạn đang bàn giao tài sản nào. Nếu có sai sót, vui lòng gõ **'hỗ trợ'** để gặp Hỗ trợ viên.";
    }

    let response = `Chào **${context.fullName}**, đây là danh sách tài sản đang được bàn giao cho bạn:\n\n`;
    context.assignments.forEach((a, index) => {
      const purchaseDateStr = a.asset.purchaseDate 
        ? new Date(a.asset.purchaseDate).toLocaleDateString("vi-VN") 
        : "Không rõ";
      response += `${index + 1}. **${a.asset.name}**\n`;
      response += `   - Mã tài sản: \`${a.asset.assetCode}\`\n`;
      response += `   - Serial: \`${a.asset.serialNumber || "N/A"}\`\n`;
      response += `   - Ngày nhận: ${new Date(a.assignedAt).toLocaleDateString("vi-VN")}\n`;
      response += `   - Trạng thái thiết bị: *${a.asset.status}*\n\n`;
    });
    return response;
  }

  // 2. Requests keyword check
  if (
    normalizedText.includes("yêu cầu") ||
    normalizedText.includes("yeu cau") ||
    normalizedText.includes("sự cố") ||
    normalizedText.includes("su co") ||
    normalizedText.includes("bảo trì") ||
    normalizedText.includes("bao tri") ||
    normalizedText.includes("phiếu") ||
    normalizedText.includes("phieu")
  ) {
    if (!context.supportRequests || context.supportRequests.length === 0) {
      return "Hiện tại bạn chưa gửi yêu cầu hỗ trợ nào gần đây.";
    }

    let response = `Chào **${context.fullName}**, đây là 5 phiếu yêu cầu hỗ trợ gần đây nhất của bạn:\n\n`;
    context.supportRequests.forEach((r, index) => {
      const dateStr = new Date(r.createdAt).toLocaleDateString("vi-VN");
      response += `${index + 1}. **Phiếu ${r.id.slice(0, 8)}** (Ngày tạo: ${dateStr})\n`;
      response += `   - Loại: \`${r.type}\` | Ưu tiên: \`${r.priority}\`\n`;
      response += `   - Trạng thái: **${r.status}**\n`;
      response += `   - Mô tả: "${r.description}"\n\n`;
    });
    return response;
  }

  // Default greeting / menu
  return `Chào **${context.fullName}**! Tôi là Trợ lý ảo EAM. Tôi có thể hỗ trợ bạn nhanh các tác vụ sau:\n\n` +
    `1. Gõ **'tài sản'** để liệt kê danh sách thiết bị bạn đang sử dụng.\n` +
    `2. Gõ **'yêu cầu'** để kiểm tra trạng thái các phiếu sự cố/bảo trì gần đây.\n` +
    `3. Gõ **'hỗ trợ'** hoặc **'gặp admin'** để chuyển kết nối đến Hỗ trợ viên trực tuyến.\n\n` +
    `Bạn muốn tôi giúp gì ạ?`;
}

// Call Gemini API via fetch HTTP
async function getGeminiResponse(messageText, historyMessages, context) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const formattedAssetsList = context.assignments && context.assignments.length > 0
    ? context.assignments.map(a => `- ${a.asset.name} (Mã: ${a.asset.assetCode}, Serial: ${a.asset.serialNumber || "N/A"}, Ngày nhận: ${a.assignedAt ? new Date(a.assignedAt).toLocaleDateString("vi-VN") : "N/A"}, Trạng thái: ${a.asset.status})`).join("\n")
    : "Không có tài sản nào được bàn giao.";

  const formattedRequestsList = context.supportRequests && context.supportRequests.length > 0
    ? context.supportRequests.map(r => `- Phiếu ${r.id.slice(0, 8)}: Loại: ${r.type}, Trạng thái: ${r.status}, Nội dung: "${r.description}", Ngày tạo: ${new Date(r.createdAt).toLocaleDateString("vi-VN")}`).join("\n")
    : "Không có yêu cầu hỗ trợ nào gần đây.";

  const systemInstructionText = 
    `Bạn là Trợ lý ảo EAM (Enterprise Asset Management) của doanh nghiệp. Nhiệm vụ của bạn là hỗ trợ nhân viên giải đáp thắc mắc về tài sản và phiếu yêu cầu bảo trì.\n` +
    `Hãy luôn trả lời bằng Tiếng Việt thân thiện, lịch sự, chuyên nghiệp và ngắn gọn.\n\n` +
    `Thông tin của nhân viên đang hội thoại:\n` +
    `- Họ tên: ${context.fullName}\n` +
    `- Email: ${context.email}\n` +
    `- Phòng ban: ${context.department?.name || "Không thuộc phòng ban nào"}\n` +
    `- Vị trí/Chức vụ: ${context.position || "Nhân viên"}\n` +
    `- Nơi làm việc (Vị trí): ${context.location?.name || "Không xác định"}\n\n` +
    `Dữ liệu tài sản hiện tại nhân viên đang sử dụng:\n${formattedAssetsList}\n\n` +
    `Dữ liệu các yêu cầu hỗ trợ/bảo trì gần đây của nhân viên này:\n${formattedRequestsList}\n\n` +
    `HƯỚNG DẪN TRẢ LỜI:\n` +
    `1. Nếu nhân viên hỏi về tài sản họ đang giữ hoặc thông tin liên quan, hãy sử dụng Dữ liệu tài sản ở trên để trả lời rõ ràng (in đậm tên tài sản, mã tài sản, ngày bàn giao). Nếu không khớp bất kỳ tài sản nào, hãy báo cho nhân viên rõ.\n` +
    `2. Nếu nhân viên hỏi về tình trạng sửa chữa, yêu cầu bảo trì, hãy sử dụng Dữ liệu yêu cầu hỗ trợ ở trên để trả lời (nêu trạng thái, mô tả).\n` +
    `3. Nếu nhân viên muốn chat với admin/hỗ trợ viên trực tiếp, hãy trả lời lịch sự rằng bạn sẽ chuyển kết nối cho hỗ trợ viên ngay bây giờ.\n` +
    `4. Tránh bịa đặt thông tin không có trong danh sách tài sản/yêu cầu ở trên. Định dạng câu trả lời bằng Markdown (in đậm, danh sách) để hiển thị đẹp mắt.`;

  // Map database messages to Gemini contents payload format
  // Gemini 1.5 payload structure: { role: 'user'|'model', parts: [{ text: '...' }] }
  // limit to last 20 messages for prompt history
  const recentMessages = historyMessages.slice(-20);
  const contents = recentMessages.map(m => ({
    role: m.senderType === "USER" ? "user" : "model",
    parts: [{ text: m.message }]
  }));

  // Append current user message if it is not already in history
  if (contents.length === 0 || contents[contents.length - 1].parts[0].text !== messageText) {
    contents.push({
      role: "user",
      parts: [{ text: messageText }]
    });
  }

  const payload = {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const result = await response.json();
  const botText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!botText) {
    throw new Error("Invalid response format from Gemini API");
  }

  return botText.trim();
}

const supportChatService = Object.freeze({
  async handleEmployeeMessage(userId, messageText) {
    // 1. Resolve employee id
    const employee = await repository.findEmployeeByUserId(userId);
    if (!employee) {
      throw new AppError({
        message: "Authenticated user is not linked to an active employee profile",
        statusCode: 403,
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }

    if (employee.status !== "ACTIVE") {
      throw new AppError({
        message: "Employee profile is inactive",
        statusCode: 403,
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }

    // 2. Find or create session
    let session = await repository.findActiveSessionByEmployeeId(employee.id);
    if (!session) {
      session = await repository.createSession(employee.id);
    }

    // 3. Save user message
    await repository.saveMessage(session.id, "USER", null, messageText);

    // 4. Check for handover intent FIRST (live chat trigger)
    if (session.status === "BOT" && isHandoverIntent(messageText)) {
      // Transition session to ACTIVE
      await repository.updateSessionStatus(session.id, "ACTIVE");
      
      const systemHandoverMessage = "Đã kết nối trực tiếp với Hỗ trợ viên. Hỗ trợ viên sẽ sớm phản hồi bạn trong khung chat này.";
      await repository.saveMessage(session.id, "BOT", null, systemHandoverMessage);
      return repository.getSessionMessages(session.id);
    }

    // 5. If session status is ACTIVE, do not respond automatically (wait for Admin)
    if (session.status === "ACTIVE") {
      return repository.getSessionMessages(session.id);
    }

    // 6. Respond in BOT mode
    // Get full employee details/context
    const context = await repository.getEmployeeContext(employee.id);
    const historyMessages = await repository.getSessionMessages(session.id);

    let botResponse = "";
    try {
      if (process.env.GEMINI_API_KEY) {
        botResponse = await getGeminiResponse(messageText, historyMessages, context);
      } else {
        botResponse = getRuleBasedResponse(messageText, context);
      }
    } catch (error) {
      logger.error({ err: error, sessionId: session.id }, "Gemini AI response generation failed. Falling back to rule-based.");
      // Fallback
      botResponse = getRuleBasedResponse(messageText, context);
    }

    // Save bot message
    await repository.saveMessage(session.id, "BOT", null, botResponse);

    return repository.getSessionMessages(session.id);
  },

  async getEmployeeMessages(userId) {
    const employee = await repository.findEmployeeByUserId(userId);
    if (!employee) return [];

    const session = await repository.findActiveSessionByEmployeeId(employee.id);
    if (!session) return [];

    return repository.getSessionMessages(session.id);
  },

  async listActiveSessionsForAdmin(adminUser) {
    if (adminUser.role !== ADMIN) {
      throw new AppError({
        message: "Only administrators can view support chat sessions",
        statusCode: 403,
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }
    return repository.listActiveSessions();
  },

  async getSessionMessagesForAdmin(adminUser, sessionId) {
    if (adminUser.role !== ADMIN) {
      throw new AppError({
        message: "Forbidden",
        statusCode: 403,
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }

    const session = await repository.findSessionById(sessionId);
    if (!session) {
      throw new AppError({
        message: "Chat session not found",
        statusCode: 404,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const messages = await repository.getSessionMessages(sessionId);
    const context = await repository.getEmployeeContext(session.employeeId);

    return { session, messages, employeeContext: context };
  },

  async sendAdminMessage(adminUser, sessionId, messageText) {
    if (adminUser.role !== ADMIN) {
      throw new AppError({
        message: "Forbidden",
        statusCode: 403,
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }

    const session = await repository.findSessionById(sessionId);
    if (!session) {
      throw new AppError({
        message: "Chat session not found",
        statusCode: 404,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    if (session.status === "CLOSED") {
      throw new AppError({
        message: "Cannot send messages to a closed session",
        statusCode: 400,
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    // Save admin message
    await repository.saveMessage(sessionId, "ADMIN", adminUser.userId, messageText);

    // If session was BOT, transition it to ACTIVE because admin replied
    if (session.status === "BOT") {
      await repository.updateSessionStatus(sessionId, "ACTIVE");
    }

    return repository.getSessionMessages(sessionId);
  },

  async closeSession(adminUser, sessionId) {
    if (adminUser.role !== ADMIN) {
      throw new AppError({
        message: "Forbidden",
        statusCode: 403,
        errorCode: ERROR_CODES.AUTH_FORBIDDEN,
      });
    }

    const session = await repository.findSessionById(sessionId);
    if (!session) {
      throw new AppError({
        message: "Chat session not found",
        statusCode: 404,
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    await repository.updateSessionStatus(sessionId, "CLOSED");
    await repository.saveMessage(sessionId, "BOT", null, "Phiên hỗ trợ này đã được hỗ trợ viên đóng lại. Hãy gửi tin nhắn mới nếu bạn cần hỗ trợ thêm!");

    return { success: true };
  },
});

module.exports = supportChatService;
