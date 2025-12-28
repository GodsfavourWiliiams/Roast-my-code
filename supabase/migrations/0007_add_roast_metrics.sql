alter table roasts 
add column if not exists violations_count integer default 0,
add column if not exists critical_issues_count integer default 0;
