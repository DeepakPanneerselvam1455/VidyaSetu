-- Enable the moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'student');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call handle_new_user on auth.users insert
-- Drop first to avoid error if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add updatedAt column and trigger to tables
-- We need to do this for each table.

-- PROFILES
alter table public.profiles add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.profiles
  for each row execute procedure moddatetime("updatedAt");

-- COURSES
alter table public.courses add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.courses
  for each row execute procedure moddatetime("updatedAt");

-- QUIZZES
alter table public.quizzes add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.quizzes
  for each row execute procedure moddatetime("updatedAt");

-- QUIZ_ATTEMPTS
alter table public.quiz_attempts add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.quiz_attempts
  for each row execute procedure moddatetime("updatedAt");

-- FORUM_CATEGORIES
alter table public.forum_categories add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.forum_categories
  for each row execute procedure moddatetime("updatedAt");

-- FORUM_THREADS
alter table public.forum_threads add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.forum_threads
  for each row execute procedure moddatetime("updatedAt");

-- FORUM_POSTS
alter table public.forum_posts add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.forum_posts
  for each row execute procedure moddatetime("updatedAt");

-- MENTORSHIP_REQUESTS
alter table public.mentorship_requests add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.mentorship_requests
  for each row execute procedure moddatetime("updatedAt");

-- TUTORING_SESSIONS
alter table public.tutoring_sessions add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.tutoring_sessions
  for each row execute procedure moddatetime("updatedAt");

-- ACTIVITY_LOGS
alter table public.activity_logs add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.activity_logs
  for each row execute procedure moddatetime("updatedAt");

-- USER_PROGRESS
alter table public.user_progress add column if not exists "updatedAt" timestamp with time zone default timezone('utc'::text, now()) not null;
create or replace trigger handle_updated_at before update on public.user_progress
  for each row execute procedure moddatetime("updatedAt");
