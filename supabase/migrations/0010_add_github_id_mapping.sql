alter table user_settings add column if not exists github_id bigint;
create index if not exists idx_user_settings_github_id on user_settings(github_id);
