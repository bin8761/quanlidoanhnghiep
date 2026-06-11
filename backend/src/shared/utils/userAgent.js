function parseUserAgent(userAgentString) {
  const ua = userAgentString || "";
  let os = "Unknown OS";
  let browser = "Unknown Browser";
  let device = "Desktop";

  // OS detection
  if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
    device = /ipad/i.test(ua) ? "Tablet" : "Mobile";
  } else if (/android/i.test(ua)) {
    os = "Android";
    device = "Mobile";
    if (/tablet/i.test(ua)) {
      device = "Tablet";
    }
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // Browser detection
  if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/opr\//i.test(ua)) {
    browser = "Opera";
  }

  // Simple device type override
  if (/mobile|phone/i.test(ua) && device === "Desktop") {
    device = "Mobile";
  }

  return { os, browser, device };
}

module.exports = { parseUserAgent };
