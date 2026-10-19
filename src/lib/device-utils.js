/**
 * Parses user agent into device name and device type.
 */
export function parseDeviceFromUserAgent(ua = "") {
  if (!ua) return { device: "Web Client", deviceType: "desktop" }

  let deviceType = "desktop"
  let os = "Windows"
  let browser = "Browser"

  // Detect Device Type & OS
  if (/iPad/i.test(ua)) {
    deviceType = "tablet"
    os = "iPadOS"
  } else if (/iPhone/i.test(ua)) {
    deviceType = "mobile"
    os = "iOS"
  } else if (/Android/i.test(ua)) {
    deviceType = /Tablet|SM-T/i.test(ua) ? "tablet" : "mobile"
    os = "Android"
  } else if (/Windows NT 10.0/i.test(ua)) {
    os = "Windows 11 / 10"
  } else if (/Windows/i.test(ua)) {
    os = "Windows"
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS"
  } else if (/Linux/i.test(ua)) {
    os = "Linux"
  }

  // Detect Browser
  if (/Edg\//i.test(ua)) {
    browser = "Edge"
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = "Chrome"
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = "Safari"
  } else if (/Firefox\//i.test(ua)) {
    browser = "Firefox"
  }

  return {
    device: `${browser} / ${os}`,
    deviceType
  }
}

/**
 * Extracts client IP from request headers.
 */
export function getClientIp(request) {
  if (!request || !request.headers) return "127.0.0.1"
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  return request.headers.get("x-real-ip") || "127.0.0.1"
}
