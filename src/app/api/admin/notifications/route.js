import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"

const ADMIN_ROLES = ["admin", "super_admin", "academic_admin", "registrar"]

// Initialize admin notification tracking table
let tableInitialized = false
async function ensureAdminNotificationTable() {
  if (tableInitialized) return
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_notification_states (
        id SERIAL PRIMARY KEY,
        admin_id INT NOT NULL,
        notification_id VARCHAR(150) NOT NULL,
        is_read BOOLEAN DEFAULT TRUE,
        is_dismissed BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(admin_id, notification_id)
      );
      CREATE INDEX IF NOT EXISTS idx_admin_notif_states ON admin_notification_states (admin_id, notification_id);
    `)
    tableInitialized = true
  } catch (err) {
    console.error("[admin/notifications] Error initializing states table:", err)
  }
}

/**
 * GET /api/admin/notifications
 * Returns dynamic, lightweight notifications for Admin/Super Admin:
 * - High-Concurrency Warnings (users active on multiple devices)
 * - Exam Integrity Violations (tab-switching, DevTools attempts, screen capture alerts)
 * - Critical Security Audit Alerts
 * 
 * Optimized for minimal bandwidth with HTTP caching headers & tight payloads.
 */
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || (!ADMIN_ROLES.includes(session.role) && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureAdminNotificationTable()

    const adminId = session.userId || session.id || 1

    // Fetch read and dismissed state for this admin
    const { rows: stateRows } = await pool.query(
      `SELECT notification_id, is_read, is_dismissed 
       FROM admin_notification_states 
       WHERE admin_id = $1`,
      [adminId]
    ).catch(() => ({ rows: [] }))

    const readMap = new Map()
    const dismissedSet = new Set()

    stateRows.forEach((r) => {
      if (r.is_dismissed) dismissedSet.add(r.notification_id)
      if (r.is_read) readMap.set(r.notification_id, true)
    })

    const notifications = []

    // ── 1. Dynamic High-Concurrency Warnings ──────────────────────────────────
    try {
      const concurrencyRes = await pool.query(`
        SELECT 
          s.user_id,
          COALESCE(u.name, s.user_name, 'Unknown User') as user_name,
          COALESCE(u.role, s.role, 'student') as role,
          COUNT(*) as session_count,
          STRING_AGG(DISTINCT s.device, ' • ') as devices,
          MAX(s.last_active) as latest_activity,
          MAX(s.ip_address) as latest_ip
        FROM user_active_sessions s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
        GROUP BY s.user_id, COALESCE(u.name, s.user_name, 'Unknown User'), COALESCE(u.role, s.role, 'student')
        HAVING COUNT(*) > 1
        ORDER BY latest_activity DESC
        LIMIT 10
      `)

      concurrencyRes.rows.forEach((row) => {
        const notifId = `concurrency_${row.user_id}_${row.session_count}`
        if (!dismissedSet.has(notifId)) {
          notifications.push({
            id: notifId,
            type: "concurrency",
            category: "High Concurrency",
            title: `High-Concurrency Warning: ${row.user_name}`,
            message: `${row.user_name} (${row.role}) has ${row.session_count} concurrent active sessions detected across: ${row.devices}.`,
            severity: "warning",
            link: "/admin/settings/sessions",
            created_at: row.latest_activity,
            is_read: readMap.has(notifId)
          })
        }
      })
    } catch (conErr) {
      console.error("[admin/notifications] Error evaluating concurrency:", conErr)
    }

    // ── 2. Dynamic Exam Integrity & Security Alerts ──────────────────────────
    try {
      const auditRes = await pool.query(`
        SELECT id, user_id, user_name, user_role, event_type, description, ip_address, status, created_at
        FROM security_audit_logs
        WHERE 
          event_type IN (
            'EXAM_INTEGRITY_VIOLATION', 
            'DEVTOOLS_DETECTED', 
            'SECURITY_VIOLATION', 
            'SUSPICIOUS_TAB_SWITCH', 
            'CLIPBOARD_CAPTURE_ATTEMPT',
            'ENFORCE_SINGLE_SESSION',
            'CONCURRENT_REVOKED',
            'SESSION_TERMINATED'
          )
          OR (status IN ('warning', 'danger') AND event_type NOT IN ('AUTH_LOGIN', 'AUTH_LOGOUT'))
          OR event_type ILIKE '%INTEGRITY%'
          OR event_type ILIKE '%VIOLATION%'
        ORDER BY created_at DESC
        LIMIT 15
      `)

      auditRes.rows.forEach((log) => {
        const notifId = `audit_${log.id}`
        if (!dismissedSet.has(notifId)) {
          const isIntegrity = 
            log.event_type.includes("INTEGRITY") || 
            log.event_type.includes("DEVTOOLS") || 
            log.event_type.includes("VIOLATION") ||
            log.event_type.includes("TAB_SWITCH") ||
            log.event_type.includes("CAPTURE")

          notifications.push({
            id: notifId,
            type: isIntegrity ? "integrity" : "security",
            category: isIntegrity ? "Exam Integrity" : "Security Alert",
            title: isIntegrity 
              ? `Exam Integrity Alert: ${log.user_name || "Student"}`
              : `Security Alert: ${log.event_type}`,
            message: `${log.description}${log.ip_address ? ` [IP: ${log.ip_address}]` : ""}`,
            severity: log.status === "danger" ? "critical" : "warning",
            link: "/admin/settings/sessions",
            created_at: log.created_at,
            is_read: readMap.has(notifId)
          })
        }
      })
    } catch (auditErr) {
      console.error("[admin/notifications] Error evaluating audit logs:", auditErr)
    }

    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const unreadCount = notifications.filter((n) => !n.is_read).length

    // Lightweight bandwidth response with cache control
    return NextResponse.json(
      { notifications, unreadCount },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120"
        }
      }
    )
  } catch (err) {
    console.error("[admin/notifications GET] Error:", err)
    return NextResponse.json({ error: "Failed to load notifications." }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/notifications
 * Mark one or all notifications as read for current admin
 */
export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session || (!ADMIN_ROLES.includes(session.role) && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureAdminNotificationTable()
    const adminId = session.userId || session.id || 1
    const body = await request.json().catch(() => ({}))
    const { id, markAll, notificationIds } = body

    if (markAll && Array.isArray(notificationIds) && notificationIds.length > 0) {
      for (const nid of notificationIds) {
        await pool.query(
          `INSERT INTO admin_notification_states (admin_id, notification_id, is_read, updated_at)
           VALUES ($1, $2, TRUE, NOW())
           ON CONFLICT (admin_id, notification_id)
           DO UPDATE SET is_read = TRUE, updated_at = NOW()`,
          [adminId, String(nid)]
        )
      }
      return NextResponse.json({ success: true, message: "All notifications marked as read." })
    }

    if (id) {
      await pool.query(
        `INSERT INTO admin_notification_states (admin_id, notification_id, is_read, updated_at)
         VALUES ($1, $2, TRUE, NOW())
         ON CONFLICT (admin_id, notification_id)
         DO UPDATE SET is_read = TRUE, updated_at = NOW()`,
        [adminId, String(id)]
      )
      return NextResponse.json({ success: true, message: "Notification marked as read." })
    }

    return NextResponse.json({ error: "Missing notification id" }, { status: 400 })
  } catch (err) {
    console.error("[admin/notifications PATCH] Error:", err)
    return NextResponse.json({ error: "Failed to update notification." }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/notifications
 * Dismiss notifications for the current admin
 */
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session || (!ADMIN_ROLES.includes(session.role) && session.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    await ensureAdminNotificationTable()
    const adminId = session.userId || session.id || 1

    let body = {}
    try {
      body = await request.json()
    } catch {
      // Body may be empty on Clear All
    }

    const { id, notificationIds } = body

    if (id) {
      await pool.query(
        `INSERT INTO admin_notification_states (admin_id, notification_id, is_dismissed, updated_at)
         VALUES ($1, $2, TRUE, NOW())
         ON CONFLICT (admin_id, notification_id)
         DO UPDATE SET is_dismissed = TRUE, updated_at = NOW()`,
        [adminId, String(id)]
      )
      return NextResponse.json({ success: true, message: "Notification dismissed." })
    }

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      for (const nid of notificationIds) {
        await pool.query(
          `INSERT INTO admin_notification_states (admin_id, notification_id, is_dismissed, updated_at)
           VALUES ($1, $2, TRUE, NOW())
           ON CONFLICT (admin_id, notification_id)
           DO UPDATE SET is_dismissed = TRUE, updated_at = NOW()`,
          [adminId, String(nid)]
        )
      }
      return NextResponse.json({ success: true, message: "All notifications dismissed." })
    }

    return NextResponse.json({ success: true, message: "Notifications cleared." })
  } catch (err) {
    console.error("[admin/notifications DELETE] Error:", err)
    return NextResponse.json({ error: "Failed to delete notifications." }, { status: 500 })
  }
}
