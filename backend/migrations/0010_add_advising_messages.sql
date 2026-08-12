create table if not exists public.advising_messages (
  id text primary key,
  student_id text not null,
  advisor_id text not null,
  sender_role text not null,
  sender_name text not null,
  body text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_advising_messages_student_id on public.advising_messages (student_id);
create index if not exists idx_advising_messages_advisor_id on public.advising_messages (advisor_id);
