-- ============================================
-- HB Class Database Schema
-- ============================================

-- profiles (사용자 프로필)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'parent')),
  name text not null,
  phone text unique,
  created_at timestamptz default now()
);

-- students (학생)
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text not null check (grade_level in ('elementary', 'middle', 'high')),
  parent_id uuid references profiles(id) on delete set null,
  memo text,
  created_at timestamptz default now()
);

-- regular_schedules (정규 시간표 템플릿)
create table regular_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- schedule_events (실제 일정 인스턴스)
create table schedule_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  type text not null default 'regular' check (type in ('regular', 'makeup')),
  status text not null default 'scheduled' check (status in ('scheduled', 'absent', 'completed')),
  source_event_id uuid references schedule_events(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_event_time check (end_time > start_time)
);

-- academy_settings (학원 설정 - 싱글톤)
create table academy_settings (
  id uuid primary key default gen_random_uuid(),
  operating_days int[] not null default '{1,2,3,4,5}',
  day_hours jsonb not null default '{"1":{"start":"13:00","end":"22:00"},"2":{"start":"13:00","end":"22:00"},"3":{"start":"13:00","end":"22:00"},"4":{"start":"13:00","end":"22:00"},"5":{"start":"13:00","end":"22:00"}}',
  max_capacity int not null default 14,
  grid_snap_minutes int not null default 15,
  updated_at timestamptz default now()
);

-- 초기 설정 레코드
insert into academy_settings (operating_days, day_hours, max_capacity, grid_snap_minutes) values (
  '{1,2,3,4,5}',
  '{"1":{"start":"13:00","end":"22:00"},"2":{"start":"13:00","end":"22:00"},"3":{"start":"13:00","end":"22:00"},"4":{"start":"13:00","end":"22:00"},"5":{"start":"13:00","end":"22:00"}}',
  14, 15
);

-- 인덱스
create index idx_events_date on schedule_events(date);
create index idx_events_student on schedule_events(student_id);
create index idx_regular_student on regular_schedules(student_id);
create index idx_students_parent on students(parent_id);

-- RLS 정책
alter table profiles enable row level security;
alter table students enable row level security;
alter table regular_schedules enable row level security;
alter table schedule_events enable row level security;
alter table academy_settings enable row level security;

-- 관리자 전체 접근
create policy "admin_all_profiles" on profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or id = auth.uid()
  );

create policy "admin_all_students" on students
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_all_schedules" on regular_schedules
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_all_events" on schedule_events
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_all_settings" on academy_settings
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 학부모 읽기 전용
create policy "parent_read_students" on students
  for select using (parent_id = auth.uid());

create policy "parent_read_schedules" on regular_schedules
  for select using (
    student_id in (select id from students where parent_id = auth.uid())
  );

create policy "parent_read_events" on schedule_events
  for select using (
    student_id in (select id from students where parent_id = auth.uid())
  );

create policy "parent_read_settings" on academy_settings
  for select using (true);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on schedule_events
  for each row execute function update_updated_at();

create trigger set_updated_at_settings
  before update on academy_settings
  for each row execute function update_updated_at();
