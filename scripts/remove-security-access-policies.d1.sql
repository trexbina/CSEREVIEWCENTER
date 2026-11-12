-- Run once against an existing Cloudflare D1 database before deploying this removal.
DROP TABLE IF EXISTS user_active_sessions;
DROP TABLE IF EXISTS security_audit_logs;
DROP TABLE IF EXISTS system_security_settings;

UPDATE custom_roles
SET permissions = '[]'
WHERE permissions = '["/admin/settings/security"]';

UPDATE custom_roles
SET permissions = REPLACE(permissions, ',"/admin/settings/security"', '');

UPDATE custom_roles
SET permissions = REPLACE(permissions, '"/admin/settings/security",', '');
