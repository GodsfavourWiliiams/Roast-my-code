alter table user_settings 
add column if not exists installation_id bigint,
add column if not exists auto_run_new_repos boolean default true;
