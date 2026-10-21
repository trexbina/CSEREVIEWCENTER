import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { isAdminRole } from "@/lib/auth"
import { canManageSecurityPolicies } from "@/lib/role-permissions"
import { parseDeviceFromUserAgent, getClientIp } from "@/lib/device-utils"

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_security_settings (
      id INT PRIMARY KEY DEFAULT 1,
      single_session_enabled BOOLEAN DEFAULT true,
      audit_logging_enabled BOOLEAN DEFAULT true,
      watermark_enabled BOOLEAN DEFAULT true,
      watermark_text VARCHAR(100) DEFAULT '{name} - {email}',
      watermark_opacity INT DEFAULT 15,
      watermark_size VARCHAR(20) DEFAULT 'medium',
      watermark_count INT DEFAULT 1,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE system_security_settings ADD COLUMN IF NOT EXISTS watermark_size VARCHAR(20) DEFAULT 'medium';
    ALTER TABLE system_security_settings ADD COLUMN IF NOT EXISTS watermark_count INT DEFAULT 1;

    INSERT INTO system_security_settings (id, single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity, watermark_size, watermark_count)
    VALUES (1, true, true, true, '{name} - {email}', 15, 'medium', 1)
    ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS security_audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(150),
      user_role VARCHAR(50),
      event_type VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      ip_address VARCHAR(45) DEFAULT '127.0.0.1',
      status VARCHAR(20) DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_active_sessions (
      id VARCHAR(100) PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(150),
      email VARCHAR(150),
      role VARCHAR(50) DEFAULT 'student',
      device VARCHAR(150) NOT NULL,
      device_type VARCHAR(50) DEFAULT 'desktop',
      ip_address VARCHAR(50) NOT NULL,
      location VARCHAR(100) DEFAULT 'Manila, Philippines',
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_current BOOLEAN DEFAULT false,
      status VARCHAR(20) DEFAULT 'active'
    );
  `).catch(err => console.error("[security DB init]", err))
}

/** GET /api/admin/settings/security — retrieve security settings, audit logs & active sessions */
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await canManageSecurityPolicies(session)
    if (!hasAccess) {
      return NextResponse.json({ canAccessSecurityPolicies: false }, { status: 200 })
    }

    await ensureTables()

    // Dynamically register or update the current user's session if authenticated
    if (session?.userId) {
      const userAgent = request.headers.get("user-agent") || ""
      const clientIp = getClientIp(request)
      const deviceInfo = parseDeviceFromUserAgent(userAgent)

      const currentCheck = await pool.query(
        `SELECT id FROM user_active_sessions WHERE user_id = $1 AND status = 'active'`,
        [session.userId]
      )

      if (currentCheck.rows.length === 0) {
        const userRes = await pool.query(`SELECT name, email, role FROM users WHERE id = $1`, [session.userId])
        const u = userRes.rows[0]
        const sessionId = `sess_${session.userId}_${Date.now()}`

        await pool.query(`
          INSERT INTO user_active_sessions (
            id, user_id, user_name, email, role, device, device_type, ip_address, location, login_time, last_active, is_current, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), true, 'active')
          ON CONFLICT (id) DO UPDATE SET last_active = NOW(), status = 'active'
        `, [
          sessionId,
          session.userId,
          u?.name || "Administrator",
          u?.email || session.email || "",
          u?.role || session.role || "admin",
          deviceInfo.device,
          deviceInfo.deviceType,
          clientIp,
          "Philippines"
        ])
      } else {
        await pool.query(
          `UPDATE user_active_sessions SET last_active = NOW() WHERE user_id = $1 AND status = 'active'`,
          [session.userId]
        )
      }
    }

    // 1. Fetch settings
    const settingsRes = await pool.query(`SELECT * FROM system_security_settings WHERE id = 1`)
    const settings = settingsRes.rows[0] || {
      single_session_enabled: true,
      audit_logging_enabled: true,
      watermark_enabled: true,
      watermark_text: "{name} - {email}",
      watermark_opacity: 15
    }

    // 2. Fetch real audit logs only (ordered latest first)
    const logsRes = await pool.query(`
      SELECT id, user_id, user_name, user_role, event_type, description, ip_address, status, created_at
      FROM security_audit_logs
      ORDER BY created_at DESC
      LIMIT 100
    `)

    // 3. Fetch active user sessions from user_active_sessions table
    const sessionsRes = await pool.query(`
      SELECT 
        s.id,
        s.user_id as "userId",
        COALESCE(u.name, s.user_name, 'Unknown User') as name,
        COALESCE(u.email, s.email, '') as email,
        u.login_id,
        COALESCE(u.role, s.role, 'student') as role,
        s.device,
        s.device_type as "deviceType",
        s.ip_address as ip,
        s.location,
        s.login_time as "loginTime",
        s.last_active as "lastActive",
        (s.user_id = $1) as "isCurrent",
        s.status
      FROM user_active_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
      ORDER BY (s.user_id = $1) DESC, s.last_active DESC
    `, [session.userId || 0])

    // Compute device count and concurrency for each user
    const userSessionMap = new Map()
    sessionsRes.rows.forEach(sess => {
      const uid = sess.userId ? String(sess.userId) : sess.name
      if (!userSessionMap.has(uid)) userSessionMap.set(uid, [])
      userSessionMap.get(uid).push(sess)
    })

    const activeSessions = sessionsRes.rows.map(sess => {
      const uid = sess.userId ? String(sess.userId) : sess.name
      const userSessions = userSessionMap.get(uid) || []
      const deviceIndex = userSessions.findIndex(x => x.id === sess.id) + 1
      return {
        ...sess,
        deviceCount: userSessions.length,
        deviceIndex: deviceIndex > 0 ? deviceIndex : 1,
        isConcurrent: userSessions.length > 1
      }
    })

    return NextResponse.json({
      canAccessSecurityPolicies: true,
      settings,
      logs: logsRes.rows,
      sessions: activeSessions
    })
  } catch (error) {
    console.error("[GET /api/admin/settings/security] Error:", error)
    return NextResponse.json({ error: "Failed to fetch security settings" }, { status: 500 })
  }
}

/** POST /api/admin/settings/security — update security toggles or terminate sessions */
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session || !isAdminRole(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasAccess = await canManageSecurityPolicies(session)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to modify Security & Access Policies." }, { status: 403 })
    }

    await ensureTables()
    const body = await request.json()
    const clientIp = getClientIp(request)

    const adminUserRes = await pool.query(`SELECT name FROM users WHERE id = $1`, [session.userId])
    const adminName = adminUserRes.rows[0]?.name || session.email || "Admin"

    if (body.action === "update_settings") {
      const { single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity, watermark_size, watermark_count } = body
      
      await pool.query(`
        UPDATE system_security_settings
        SET single_session_enabled = $1,
            audit_logging_enabled = $2,
            watermark_enabled = $3,
            watermark_text = $4,
            watermark_opacity = $5,
            watermark_size = $6,
            watermark_count = $7,
            updated_at = NOW()
        WHERE id = 1
      `, [
        single_session_enabled, 
        audit_logging_enabled, 
        watermark_enabled, 
        watermark_text || "{name} - {email}", 
        watermark_opacity || 15,
        watermark_size || "medium",
        Math.min(3, Math.max(1, parseInt(watermark_count, 10) || 1))
      ])

      await pool.query(`
        INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
        VALUES ($1, $2, $3, 'SETTINGS_CHANGE', 'Updated system security policies and thresholds', $4, 'success', NOW())
      `, [session.userId, adminName, session.role, clientIp]).catch(() => {})

      return NextResponse.json({ success: true })
    }

    // 1. Terminate a single specific session
    if (body.action === "terminate_session") {
      const { sessionId, userName, targetUserId } = body

      if (sessionId) {
        await pool.query(`UPDATE user_active_sessions SET status = 'revoked', last_active = NOW() WHERE id = $1`, [sessionId])
      } else if (targetUserId) {
        await pool.query(`UPDATE user_active_sessions SET status = 'revoked', last_active = NOW() WHERE user_id = $1`, [targetUserId])
      }

      await pool.query(`
        INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
        VALUES ($1, $2, $3, 'SESSION_TERMINATED', $4, $5, 'warning', NOW())
      `, [session.userId, adminName, session.role, `Terminated active session for user: ${userName || targetUserId || sessionId}`, clientIp]).catch(() => {})

      return NextResponse.json({ success: true, message: `Session terminated.` })
    }

    // 2. Terminate batch of selected session IDs
    if (body.action === "terminate_batch") {
      const { sessionIds } = body
      if (Array.isArray(sessionIds) && sessionIds.length > 0) {
        await pool.query(`
          UPDATE user_active_sessions 
          SET status = 'revoked', last_active = NOW()
          WHERE id = ANY($1::varchar[])
        `, [sessionIds])

        await pool.query(`
          INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
          VALUES ($1, $2, $3, 'BATCH_SESSION_REVOKED', $4, $5, 'warning', NOW())
        `, [session.userId, adminName, session.role, `Revoked ${sessionIds.length} active sessions in bulk`, clientIp]).catch(() => {})
      }

      return NextResponse.json({ success: true, count: sessionIds?.length || 0 })
    }

    // 3. Terminate all concurrent sessions for a specific user (keep current/newest)
    if (body.action === "terminate_user_concurrent") {
      const { userId, userName } = body
      if (userId) {
        await pool.query(`
          UPDATE user_active_sessions
          SET status = 'revoked', last_active = NOW()
          WHERE user_id = $1 AND id NOT IN (
            SELECT id FROM user_active_sessions 
            WHERE user_id = $1 AND status = 'active' 
            ORDER BY is_current DESC, last_active DESC 
            LIMIT 1
          )
        `, [userId])

        await pool.query(`
          INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
          VALUES ($1, $2, $3, 'CONCURRENT_REVOKED', $4, $5, 'warning', NOW())
        `, [session.userId, adminName, session.role, `Revoked duplicate concurrent devices for user: ${userName || userId}`, clientIp]).catch(() => {})
      }
      return NextResponse.json({ success: true })
    }

    // 4. Terminate all concurrent sessions across the entire system (keeps only 1 primary/active session per user)
    if (body.action === "terminate_all_concurrent") {
      const result = await pool.query(`
        WITH RankedSessions AS (
          SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY is_current DESC, last_active DESC) as rn
          FROM user_active_sessions
          WHERE status = 'active'
        )
        UPDATE user_active_sessions
        SET status = 'revoked', last_active = NOW()
        WHERE id IN (
          SELECT id FROM RankedSessions WHERE rn > 1
        )
        RETURNING id
      `)

      await pool.query(`
        INSERT INTO security_audit_logs (user_id, user_name, user_role, event_type, description, ip_address, status, created_at)
        VALUES ($1, $2, $3, 'ENFORCE_SINGLE_SESSION', $4, $5, 'warning', NOW())
      `, [session.userId, adminName, session.role, `System-wide enforcement: Revoked ${result.rowCount} concurrent/duplicate devices`, clientIp]).catch(() => {})

      return NextResponse.json({ success: true, count: result.rowCount })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[POST /api/admin/settings/security] Error:", error)
    return NextResponse.json({ error: "Failed to update security settings" }, { status: 500 })
  }
}
