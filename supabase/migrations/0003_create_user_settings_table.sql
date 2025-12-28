create table if not exists user_settings (
  user_id uuid references auth.users not null primary key,
  persona text default 'toxic',
  model text default 'gemini-flash-latest',
  notifications boolean default true,
  webhook_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_settings enable row level security;

create policy "Users can view their own settings"
  on user_settings for select
  using ( auth.uid() = user_id );

create policy "Users can update their own settings"
  on user_settings for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings"
  on user_settings for insert
  with check ( auth.uid() = user_id );

-- Trigger to create a settings row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();