alter table repositories 
add column if not exists stars_count integer default 0,
add column if not exists forks_count integer default 0,
add column if not exists watchers_count integer default 0;
