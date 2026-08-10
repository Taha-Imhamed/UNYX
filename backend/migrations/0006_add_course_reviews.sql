create table if not exists public.course_reviews (
  id text primary key,
  course_id text not null,
  course_title text not null,
  professor_id text null,
  professor_name text null,
  student_id text not null,
  rating integer not null,
  difficulty integer null,
  comment text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_course_reviews_unique on public.course_reviews (course_id, student_id);
create index if not exists idx_course_reviews_course_id on public.course_reviews (course_id);
