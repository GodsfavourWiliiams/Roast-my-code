-- Add suspended column
alter table user_settings add column if not exists suspended boolean default false;

-- Remove redundant webhook_enabled column
alter table user_settings drop column if exists webhook_enabled;
