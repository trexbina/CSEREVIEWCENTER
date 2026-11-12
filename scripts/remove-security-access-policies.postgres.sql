-- Run once against an existing PostgreSQL database before deploying this removal.
-- This permanently deletes the retired Security & Access Policies data.
DROP TABLE IF EXISTS user_active_sessions;
DROP TABLE IF EXISTS security_audit_logs;
DROP TABLE IF EXISTS system_security_settings;

UPDATE custom_roles
SET permissions = permissions - '/admin/settings/security';
