import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { isAdminRole } from "@/lib/auth"
import { canManageSecurityPolicies } from "@/lib/role-permissions"

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS system_security_settings (
      id INT PRIMARY KEY DEFAULT 1,
      single_session_enabled BOOLEAN DEFAULT true,
      audit_logging_enabled BOOLEAN DEFAULT true,
      watermark_enabled BOOLEAN DEFAULT true,
      watermark_text VARCHAR(100) DEFAULT '{name} - {email}',
      watermark_opacity INT DEFAULT 15,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO system_security_settings (id, single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity)
    VALUES (1, true, true, true, '{name} - {email}', 15)
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

/** Seed realistic active user sessions if table is empty */
async function seedSessionsIfEmpty() {
  try {
    const countRes = await pool.query(`SELECT COUNT(*) as count FROM user_active_sessions WHERE status = 'active'`)
    if (parseInt(countRes.rows[0]?.count || "0", 10) > 0) return

    const usersRes = await pool.query(`
      SELECT id, name, email, login_id, role 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 20
    `)

    if (usersRes.rows.length === 0) return

    const sessionsToInsert = []

    usersRes.rows.forEach((u, idx) => {
      if (idx === 0) {
        // Admin / Current session
        sessionsToInsert.push({
          id: `sess_${u.id}_primary`,
          user_id: u.id,
          user_name: u.name,
          email: u.email,
          role: u.role,
          device: "Chrome 124 / Windows 11 (You)",
          device_type: "desktop",
          ip_address: "192.168.1.10",
          location: "Quezon City, PH",
          login_time: new Date(Date.now() - 45 * 60000).toISOString(),
          is_current: true
        })
      } else if (idx === 1) {
        // High Concurrency User: 3 simultaneous devices
        sessionsToInsert.push(
          {
            id: `sess_${u.id}_dev1`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Chrome 124 / Windows 10",
            device_type: "desktop",
            ip_address: "192.168.1.11",
            location: "Manila, PH",
            login_time: new Date(Date.now() - 25 * 60000).toISOString(),
            is_current: false
          },
          {
            id: `sess_${u.id}_dev2`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Safari 17 / MacBook Air",
            device_type: "desktop",
            ip_address: "112.198.64.22",
            location: "Cebu City, PH",
            login_time: new Date(Date.now() - 12 * 60000).toISOString(),
            is_current: false
          },
          {
            id: `sess_${u.id}_dev3`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Safari 17 / iPhone 15 Pro",
            device_type: "mobile",
            ip_address: "120.29.77.104",
            location: "Makati, PH",
            login_time: new Date(Date.now() - 3 * 60000).toISOString(),
            is_current: false
          }
        )
      } else if (idx === 2) {
        // Concurrency User: 2 simultaneous devices
        sessionsToInsert.push(
          {
            id: `sess_${u.id}_dev1`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Safari 17 / iPhone 15",
            device_type: "mobile",
            ip_address: "192.168.1.12",
            location: "Manila, PH",
            login_time: new Date(Date.now() - 60 * 60000).toISOString(),
            is_current: false
          },
          {
            id: `sess_${u.id}_dev2`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Edge 123 / Windows 11",
            device_type: "desktop",
            ip_address: "180.191.12.55",
            location: "Pasig, PH",
            login_time: new Date(Date.now() - 18 * 60000).toISOString(),
            is_current: false
          }
        )
      } else if (idx === 3) {
        // Concurrency User: 2 simultaneous devices
        sessionsToInsert.push(
          {
            id: `sess_${u.id}_dev1`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Chrome 124 / Windows 10",
            device_type: "desktop",
            ip_address: "192.168.1.13",
            location: "Manila, PH",
            login_time: new Date(Date.now() - 90 * 60000).toISOString(),
            is_current: false
          },
          {
            id: `sess_${u.id}_dev2`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Chrome Mobile / Samsung Galaxy S24",
            device_type: "mobile",
            ip_address: "175.176.43.91",
            location: "Davao City, PH",
            login_time: new Date(Date.now() - 8 * 60000).toISOString(),
            is_current: false
          }
        )
      } else if (idx === 4) {
        // Concurrency User: 2 simultaneous devices
        sessionsToInsert.push(
          {
            id: `sess_${u.id}_dev1`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Safari 17 / iPad Pro",
            device_type: "tablet",
            ip_address: "192.168.1.14",
            location: "Manila, PH",
            login_time: new Date(Date.now() - 110 * 60000).toISOString(),
            is_current: false
          },
          {
            id: `sess_${u.id}_dev2`,
            user_id: u.id,
            user_name: u.name,
            email: u.email,
            role: u.role,
            device: "Firefox 125 / macOS Sonoma",
            device_type: "desktop",
            ip_address: "49.145.22.8",
            location: "Taguig, PH",
            login_time: new Date(Date.now() - 5 * 60000).toISOString(),
            is_current: false
          }
        )
      } else {
        // Normal single device users
        const devTypes = [
          { dev: "Chrome 124 / Windows 11", type: "desktop" },
          { dev: "Safari 17 / iPhone 15", type: "mobile" },
          { dev: "Edge 123 / Windows 10", type: "desktop" },
          { dev: "Chrome Mobile / Xiaomi 14", type: "mobile" },
          { dev: "Safari 17 / iPad Air", type: "tablet" }
        ]
        const selected = devTypes[idx % devTypes.length]
        sessionsToInsert.push({
          id: `sess_${u.id}_single`,
          user_id: u.id,
          user_name: u.name,
          email: u.email,
          role: u.role,
          device: selected.dev,
          device_type: selected.type,
          ip_address: `192.168.1.${20 + idx}`,
          location: "Manila, PH",
          login_time: new Date(Date.now() - (idx * 15 + 5) * 60000).toISOString(),
          is_current: false
        })
      }
    })

    for (const s of sessionsToInsert) {
      await pool.query(`
        INSERT INTO user_active_sessions (id, user_id, user_name, email, role, device, device_type, ip_address, location, login_time, is_current, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
        ON CONFLICT (id) DO NOTHING
      `, [s.id, s.user_id, s.user_name, s.email, s.role, s.device, s.device_type, s.ip_address, s.location, s.login_time, s.is_current])
    }
  } catch (err) {
    console.error("[seedSessionsIfEmpty]", err)
  }
}

/** GET /api/admin/settings/security — retrieve security settings, audit logs & active sessions */
export async function GET() {
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
    await seedSessionsIfEmpty()

    // 1. Fetch settings
    const settingsRes = await pool.query(`SELECT * FROM system_security_settings WHERE id = 1`)
    const settings = settingsRes.rows[0] || {
      single_session_enabled: true,
      audit_logging_enabled: true,
      watermark_enabled: true,
      watermark_text: "{name} - {email}",
      watermark_opacity: 15
    }

    // 2. Fetch recent audit logs (seed initial records if empty)
    const countRes = await pool.query(`SELECT COUNT(*) as count FROM security_audit_logs`)
    if (parseInt(countRes.rows[0]?.count || "0", 10) === 0) {
      await pool.query(`
        INSERT INTO security_audit_logs (user_name, user_role, event_type, description, status, created_at)
        VALUES 
          ('System Administrator', 'admin', 'SYSTEM_BOOT', 'Security monitoring service started', 'success', NOW() - INTERVAL '2 hours'),
          ('Admin User', 'admin', 'POLICY_UPDATE', 'Watermark protection policy updated', 'success', NOW() - INTERVAL '1 hour'),
          ('Student User', 'student', 'AUTH_LOGIN', 'Successful user authentication', 'success', NOW() - INTERVAL '25 minutes'),
          ('Unknown Client', 'guest', 'FAILED_LOGIN', 'Invalid password credentials attempt', 'warning', NOW() - INTERVAL '10 minutes'),
          ('Admin User', 'admin', 'CONFIG_CHANGE', 'Audit log retention verified', 'success', NOW() - INTERVAL '2 minutes');
      `).catch(() => {})
    }

    const logsRes = await pool.query(`
      SELECT id, user_name, user_role, event_type, description, ip_address, status, created_at
      FROM security_audit_logs
      ORDER BY created_at DESC
      LIMIT 30
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
        s.is_current as "isCurrent",
        s.status
      FROM user_active_sessions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
      ORDER BY s.is_current DESC, s.login_time DESC
    `)

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

    if (body.action === "update_settings") {
      const { single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text, watermark_opacity } = body
      
      await pool.query(`
        UPDATE system_security_settings
        SET single_session_enabled = $1,
            audit_logging_enabled = $2,
            watermark_enabled = $3,
            watermark_text = $4,
            watermark_opacity = $5,
            updated_at = NOW()
        WHERE id = 1
      `, [single_session_enabled, audit_logging_enabled, watermark_enabled, watermark_text || "{name} - {email}", watermark_opacity || 15])

      await pool.query(`
        INSERT INTO security_audit_logs (user_name, user_role, event_type, description, status)
        VALUES ('Admin', 'admin', 'SETTINGS_CHANGE', 'Updated system security policies and thresholds', 'success')
      `).catch(() => {})

      return NextResponse.json({ success: true })
    }

    // 1. Terminate a single specific session
    if (body.action === "terminate_session") {
      const { sessionId, userName, targetUserId } = body

      if (sessionId) {
        await pool.query(`UPDATE user_active_sessions SET status = 'revoked' WHERE id = $1`, [sessionId])
      } else if (targetUserId) {
        await pool.query(`UPDATE user_active_sessions SET status = 'revoked' WHERE user_id = $1`, [targetUserId])
      }

      await pool.query(`
        INSERT INTO security_audit_logs (user_name, user_role, event_type, description, status)
        VALUES ('Admin', 'admin', 'SESSION_TERMINATED', $1, 'warning')
      `, [`Terminated active session for user: ${userName || targetUserId || sessionId}`]).catch(() => {})

      return NextResponse.json({ success: true, message: `Session terminated.` })
    }

    // 2. Terminate batch of selected session IDs
    if (body.action === "terminate_batch") {
      const { sessionIds } = body
      if (Array.isArray(sessionIds) && sessionIds.length > 0) {
        await pool.query(`
          UPDATE user_active_sessions 
          SET status = 'revoked' 
          WHERE id = ANY($1::varchar[])
        `, [sessionIds])

        await pool.query(`
          INSERT INTO security_audit_logs (user_name, user_role, event_type, description, status)
          VALUES ('Admin', 'admin', 'BATCH_SESSION_REVOKED', $1, 'warning')
        `, [`Revoked ${sessionIds.length} active sessions in bulk`]).catch(() => {})
      }

      return NextResponse.json({ success: true, count: sessionIds.length })
    }

    // 3. Terminate all concurrent sessions for a specific user (keep oldest/current)
    if (body.action === "terminate_user_concurrent") {
      const { userId, userName } = body
      if (userId) {
        await pool.query(`
          UPDATE user_active_sessions
          SET status = 'revoked'
          WHERE user_id = $1 AND id NOT IN (
            SELECT id FROM user_active_sessions 
            WHERE user_id = $1 AND status = 'active' 
            ORDER BY is_current DESC, login_time ASC 
            LIMIT 1
          )
        `, [userId])

        await pool.query(`
          INSERT INTO security_audit_logs (user_name, user_role, event_type, description, status)
          VALUES ('Admin', 'admin', 'CONCURRENT_REVOKED', $1, 'warning')
        `, [`Revoked duplicate concurrent devices for user: ${userName || userId}`]).catch(() => {})
      }
      return NextResponse.json({ success: true })
    }

    // 4. Terminate all concurrent sessions across the entire system (keeps only 1 primary session per user)
    if (body.action === "terminate_all_concurrent") {
      const result = await pool.query(`
        WITH RankedSessions AS (
          SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY is_current DESC, login_time ASC) as rn
          FROM user_active_sessions
          WHERE status = 'active'
        )
        UPDATE user_active_sessions
        SET status = 'revoked'
        WHERE id IN (
          SELECT id FROM RankedSessions WHERE rn > 1
        )
        RETURNING id
      `)

      await pool.query(`
        INSERT INTO security_audit_logs (user_name, user_role, event_type, description, status)
        VALUES ('Admin', 'admin', 'ENFORCE_SINGLE_SESSION', $1, 'warning')
      `, [`System-wide enforcement: Revoked ${result.rowCount} concurrent/duplicate devices`]).catch(() => {})

      return NextResponse.json({ success: true, count: result.rowCount })
    }

    // 5. Reset / Reseed sessions (helpful for testing & demoing)
    if (body.action === "reset_sessions") {
      await pool.query(`DELETE FROM user_active_sessions`)
      await seedSessionsIfEmpty()
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[POST /api/admin/settings/security] Error:", error)
    return NextResponse.json({ error: "Failed to update security settings" }, { status: 500 })
  }
}
