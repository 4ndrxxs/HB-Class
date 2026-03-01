# HB Class Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 학원 시간표 관리 앱(HB Class) — 관리자가 분 단위 시간표를 드래그&드롭으로 관리하고, 학부모가 자녀 일정을 조회하는 모바일 앱

**Architecture:** React SPA + Supabase backend. Capacitor로 APK 래핑하여 Play Store 배포. 관리자(Google 로그인)와 학부모(전화번호 OTP)가 동일한 앱을 role 기반으로 다른 뷰를 봄.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, @dnd-kit, Supabase (PostgreSQL + Auth + Realtime), Capacitor, FCM

---

## Phase 1: 프로젝트 초기 설정

### Task 1: Vite + React + TypeScript 프로젝트 생성

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `tailwind.config.js`, `postcss.config.js`
- Create: `src/index.css`

**Step 1: 프로젝트 스캐폴딩**

Run:
```bash
cd C:/Users/JW/Documents/project/HBtimetable
npm create vite@latest . -- --template react-ts
```

**Step 2: 핵심 의존성 설치**

Run:
```bash
npm install @supabase/supabase-js zustand react-router-dom @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities date-fns lucide-react
npm install -D tailwindcss @tailwindcss/vite
```

**Step 3: Tailwind CSS 설정**

`src/index.css`:
```css
@import "tailwindcss";
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' }
  }
})
```

`tsconfig.json` — paths 추가:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Step 4: 앱 실행 확인**

Run: `npm run dev`
Expected: localhost:5173에서 Vite 앱 정상 로드

**Step 5: Commit**

```bash
git init
git add -A
git commit -m "chore: init Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: shadcn/ui 설정

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/` (button, input, dialog, card 등)

**Step 1: shadcn/ui 초기화**

Run:
```bash
npx shadcn@latest init
```
설정: TypeScript, Default style, CSS variables, `@/components/ui`, `@/lib/utils`

**Step 2: 핵심 컴포넌트 설치**

Run:
```bash
npx shadcn@latest add button input card dialog tabs badge select sheet toast separator scroll-area
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add shadcn/ui with core components"
```

---

### Task 3: 프로젝트 구조 스캐폴딩

**Files:**
- Create: 디렉토리 구조 전체

**Step 1: 디렉토리 생성**

```
src/
├── components/
│   ├── ui/          (shadcn - already exists)
│   ├── layout/      (BottomNav, Header, etc.)
│   ├── schedule/    (WeekView, TimeBlock, MakeupPool, etc.)
│   ├── calendar/    (MonthView, DayCell, etc.)
│   ├── students/    (StudentList, StudentForm, etc.)
│   └── auth/        (LoginForm, PhoneVerify, etc.)
├── pages/
│   ├── admin/       (WeeklyPage, MonthlyPage, StudentsPage, SettingsPage)
│   └── parent/      (ParentWeeklyPage, ParentMonthlyPage, HistoryPage)
├── hooks/           (useStudents, useSchedule, useAuth, etc.)
├── stores/          (Zustand stores)
├── lib/
│   ├── supabase.ts  (Supabase client)
│   ├── utils.ts     (shadcn utils)
│   └── constants.ts (colors, grade labels, etc.)
├── types/           (TypeScript interfaces)
├── App.tsx
├── main.tsx
└── index.css
```

**Step 2: 타입 정의 파일 작성**

`src/types/index.ts`:
```ts
export type Role = 'admin' | 'parent'
export type GradeLevel = 'elementary' | 'middle' | 'high'
export type EventType = 'regular' | 'makeup'
export type EventStatus = 'scheduled' | 'absent' | 'completed'

export interface Profile {
  id: string
  role: Role
  name: string
  phone: string
  created_at: string
}

export interface Student {
  id: string
  name: string
  grade_level: GradeLevel
  parent_id: string | null
  memo: string | null
  created_at: string
}

export interface RegularSchedule {
  id: string
  student_id: string
  day_of_week: number
  start_time: string // "HH:MM"
  end_time: string   // "HH:MM"
}

export interface ScheduleEvent {
  id: string
  student_id: string
  date: string       // "YYYY-MM-DD"
  start_time: string // "HH:MM"
  end_time: string   // "HH:MM"
  type: EventType
  status: EventStatus
  source_event_id: string | null
  created_at: string
  updated_at: string
}

export interface AcademySettings {
  id: string
  operating_days: number[]
  day_hours: Record<string, { start: string; end: string }>
  max_capacity: number
  grid_snap_minutes: number
}

// 주간 뷰에서 사용할 확장 타입 (학생 정보 포함)
export interface ScheduleEventWithStudent extends ScheduleEvent {
  student: Student
}
```

**Step 3: 상수 파일 작성**

`src/lib/constants.ts`:
```ts
import { GradeLevel } from '@/types'

export const GRADE_COLORS: Record<GradeLevel, string> = {
  elementary: '#FCD34D',
  middle: '#60A5FA',
  high: '#F87171',
}

export const GRADE_LABELS: Record<GradeLevel, string> = {
  elementary: '초등',
  middle: '중등',
  high: '고등',
}

export const GRADE_BG_CLASSES: Record<GradeLevel, string> = {
  elementary: 'bg-yellow-300/80',
  middle: 'bg-blue-400/80',
  high: 'bg-red-400/80',
}

export const GRADE_TEXT_CLASSES: Record<GradeLevel, string> = {
  elementary: 'text-yellow-900',
  middle: 'text-blue-900',
  high: 'text-red-900',
}

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export const DEFAULT_OPERATING_DAYS = [1, 2, 3, 4, 5] // 월~금

export const DEFAULT_DAY_HOURS = {
  '1': { start: '13:00', end: '22:00' },
  '2': { start: '13:00', end: '22:00' },
  '3': { start: '13:00', end: '22:00' },
  '4': { start: '13:00', end: '22:00' },
  '5': { start: '13:00', end: '22:00' },
}
```

**Step 4: Supabase 클라이언트 작성**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

`.env.local`:
```
VITE_SUPABASE_URL=<to-be-configured>
VITE_SUPABASE_ANON_KEY=<to-be-configured>
```

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold project structure, types, constants, supabase client"
```

---

## Phase 2: Supabase 백엔드 설정

### Task 4: Supabase 프로젝트 생성 및 DB 마이그레이션

**Files:**
- Supabase Dashboard에서 수행
- Modify: `.env.local` (실제 키 입력)

**Step 1: Supabase 프로젝트 생성**

Supabase 대시보드 또는 CLI로 프로젝트 생성 후 `.env.local`에 URL, anon key 입력.

**Step 2: DB 마이그레이션 — 테이블 생성**

Supabase SQL Editor에서 실행:

```sql
-- profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'parent')),
  name text not null,
  phone text unique,
  created_at timestamptz default now()
);

-- students
create table students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_level text not null check (grade_level in ('elementary', 'middle', 'high')),
  parent_id uuid references profiles(id) on delete set null,
  memo text,
  created_at timestamptz default now()
);

-- regular_schedules
create table regular_schedules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  constraint valid_time_range check (end_time > start_time)
);

-- schedule_events
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

-- academy_settings (싱글톤)
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
  14,
  15
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

-- 관리자: 모든 데이터 접근 가능
create policy "admin_full_access_profiles" on profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or id = auth.uid()
  );

create policy "admin_full_access_students" on students
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_full_access_schedules" on regular_schedules
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_full_access_events" on schedule_events
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admin_full_access_settings" on academy_settings
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- 학부모: 자기 자녀만 조회
create policy "parent_read_own_students" on students
  for select using (parent_id = auth.uid());

create policy "parent_read_own_schedules" on regular_schedules
  for select using (
    student_id in (select id from students where parent_id = auth.uid())
  );

create policy "parent_read_own_events" on schedule_events
  for select using (
    student_id in (select id from students where parent_id = auth.uid())
  );

-- 학부모: 설정 읽기
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
```

**Step 3: Supabase Auth 설정**

Supabase Dashboard → Authentication:
- Google 로그인 활성화 (OAuth)
- Phone OTP 활성화

**Step 4: Commit**

```bash
git add .env.local
git commit -m "chore: configure supabase connection"
```

---

## Phase 3: 인증 & 라우팅

### Task 5: 인증 스토어 + 라우팅 + 레이아웃

**Files:**
- Create: `src/stores/authStore.ts`
- Create: `src/hooks/useAuth.ts`
- Create: `src/components/layout/BottomNav.tsx`
- Create: `src/components/layout/AppLayout.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/auth/LoginPage.tsx`
- Create: `src/components/auth/PhoneLoginPage.tsx`
- Create: `src/pages/admin/WeeklyPage.tsx` (placeholder)
- Create: `src/pages/admin/MonthlyPage.tsx` (placeholder)
- Create: `src/pages/admin/StudentsPage.tsx` (placeholder)
- Create: `src/pages/admin/SettingsPage.tsx` (placeholder)
- Create: `src/pages/parent/ParentWeeklyPage.tsx` (placeholder)
- Create: `src/pages/parent/ParentMonthlyPage.tsx` (placeholder)
- Create: `src/pages/parent/HistoryPage.tsx` (placeholder)
- Modify: `src/App.tsx`

**Step 1: Auth store 작성**

`src/stores/authStore.ts` — Zustand store. Supabase auth session 관리, profile 로드, role 확인.

**Step 2: 로그인 페이지 작성**

`src/components/auth/LoginPage.tsx` — 역할 선택 화면 (관리자: Google, 학부모: 전화번호).

**Step 3: 레이아웃 컴포넌트 작성**

`src/components/layout/BottomNav.tsx` — role에 따라 다른 탭 표시.
`src/components/layout/Header.tsx` — 앱 이름 + 주간 네비게이션.
`src/components/layout/AppLayout.tsx` — Header + children + BottomNav.

**Step 4: 라우팅 설정**

`src/App.tsx` — react-router-dom. 로그인 안 됐으면 LoginPage, role에 따라 admin/parent 라우트 분기.

**Step 5: Placeholder 페이지 작성**

각 페이지에 제목만 표시하는 placeholder 컴포넌트.

**Step 6: 로그인 → 페이지 이동 확인**

Run: `npm run dev`
Expected: Google 로그인 후 관리자 주간 뷰 표시, 하단 탭 네비게이션 동작.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: auth flow, routing, bottom nav layout"
```

---

## Phase 4: 학생 관리 (CRUD)

### Task 6: 학생 CRUD + 정규 시간표 등록

**Files:**
- Create: `src/stores/studentStore.ts`
- Create: `src/hooks/useStudents.ts`
- Create: `src/components/students/StudentList.tsx`
- Create: `src/components/students/StudentForm.tsx`
- Create: `src/components/students/StudentCard.tsx`
- Create: `src/components/students/ScheduleInput.tsx`
- Modify: `src/pages/admin/StudentsPage.tsx`

**Step 1: Student store 작성**

`src/stores/studentStore.ts` — 학생 CRUD + 정규 시간표 관리. Supabase 연동.

**Step 2: 학생 목록 컴포넌트**

`src/components/students/StudentList.tsx` — 검색 + 학년 필터 + 학생 카드 목록.
`src/components/students/StudentCard.tsx` — 이름, 학년 태그, 요일/시간 요약, 보강 대기 수.

**Step 3: 학생 등록/편집 폼**

`src/components/students/StudentForm.tsx` — Sheet(모달)로 열림. 이름, 학년, 전화번호, 정규 시간표 입력.
`src/components/students/ScheduleInput.tsx` — 요일 추가/삭제, 시작/종료 시간 선택.

**Step 4: StudentsPage 완성**

`src/pages/admin/StudentsPage.tsx` — StudentList + 우상단 "등록" 버튼 → StudentForm.

**Step 5: 동작 확인**

학생 등록 → 목록에 표시 → 편집 → 삭제. Supabase 테이블에 데이터 저장 확인.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: student CRUD with regular schedule registration"
```

---

### Task 7: CSV/JSON 일괄 임포트

**Files:**
- Create: `src/components/students/ImportDialog.tsx`
- Modify: `src/pages/admin/StudentsPage.tsx`

**Step 1: ImportDialog 작성**

파일 선택 → 미리보기 테이블 → 확인 후 일괄 삽입.
CSV 형식: `이름,학년,전화번호,월시작,월종료,화시작,화종료,...`

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: CSV/JSON bulk student import"
```

---

## Phase 5: 주간 뷰 (핵심 기능)

### Task 8: 주간 뷰 타임라인 그리드

**Files:**
- Create: `src/stores/scheduleStore.ts`
- Create: `src/hooks/useWeeklyEvents.ts`
- Create: `src/components/schedule/WeeklyView.tsx`
- Create: `src/components/schedule/TimeGrid.tsx`
- Create: `src/components/schedule/TimeBlock.tsx`
- Create: `src/components/schedule/WeekHeader.tsx`
- Create: `src/components/schedule/CapacityIndicator.tsx`
- Modify: `src/pages/admin/WeeklyPage.tsx`

**Step 1: Schedule store 작성**

`src/stores/scheduleStore.ts` — 특정 주의 이벤트 로드, 결석 처리, 보강 추가, 이벤트 이동.

**Step 2: 주간 뷰 그리드 컴포넌트**

`src/components/schedule/WeeklyView.tsx` — 주간 네비게이션 + TimeGrid + 보강 대기소.
`src/components/schedule/TimeGrid.tsx` — 세로=시간(15분 간격), 가로=요일. 이벤트 블록 배치.
`src/components/schedule/TimeBlock.tsx` — 학생 이름, 학년 태그, 시간. 학년별 색상. 보강은 점선 테두리.
`src/components/schedule/WeekHeader.tsx` — 이전주/다음주 화살표, "오늘" 버튼, 날짜 표시.
`src/components/schedule/CapacityIndicator.tsx` — 시간대별 인원 수. 14명 초과 시 빨간색 경고.

**Step 3: 주간 뷰 페이지 완성**

`src/pages/admin/WeeklyPage.tsx` — WeeklyView 렌더링.

**Step 4: 동작 확인**

학생 등록 후 해당 주에 블록 표시 확인. 시간 길이에 비례한 블록 높이. 학년별 색상. 인원 카운터.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: weekly timeline view with time blocks and capacity indicator"
```

---

### Task 9: 드래그 앤 드롭 + 보강 대기소

**Files:**
- Modify: `src/components/schedule/WeeklyView.tsx`
- Create: `src/components/schedule/MakeupPool.tsx`
- Create: `src/components/schedule/EventDetailSheet.tsx`
- Modify: `src/components/schedule/TimeBlock.tsx`
- Modify: `src/stores/scheduleStore.ts`

**Step 1: @dnd-kit 통합**

WeeklyView에 DndContext 래핑. TimeBlock을 Draggable로, 각 시간/요일 셀을 Droppable로.

**Step 2: 보강 대기소 컴포넌트**

`src/components/schedule/MakeupPool.tsx` — 결석 처리된 이벤트 표시. 드래그 가능.

**Step 3: 이벤트 상세 시트**

`src/components/schedule/EventDetailSheet.tsx` — 블록 탭 시 열림. 학생 정보 + 결석 처리 / 보강 배정 버튼.

**Step 4: 드래그 핸들러**

- 그리드 내 블록 이동 → 시간/요일 변경 (schedule_events update)
- 보강 대기소 → 그리드 드롭 → 보강 이벤트 생성 (type='makeup')
- 인원 초과 시 드롭 경고

**Step 5: 동작 확인**

블록 드래그 이동, 결석 처리 → 보강 대기소 이동, 보강 대기소에서 그리드로 드래그 → 보강 확정.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: drag-and-drop schedule management + makeup pool"
```

---

## Phase 6: 월간 뷰

### Task 10: 월간 달력 뷰

**Files:**
- Create: `src/components/calendar/MonthlyCalendar.tsx`
- Create: `src/components/calendar/DayCell.tsx`
- Create: `src/hooks/useMonthlyEvents.ts`
- Modify: `src/pages/admin/MonthlyPage.tsx`

**Step 1: 월간 이벤트 훅**

`src/hooks/useMonthlyEvents.ts` — 해당 월의 모든 이벤트를 날짜별로 그룹핑. 수업 수, 결석 수, 보강 수 집계.

**Step 2: 달력 컴포넌트**

`src/components/calendar/MonthlyCalendar.tsx` — 달력 그리드. 이전월/다음월 네비게이션.
`src/components/calendar/DayCell.tsx` — 수업(●), 결석(✕), 보강(★) 아이콘. 탭 시 해당 주 주간 뷰로 이동.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: monthly calendar view with event indicators"
```

---

## Phase 7: 설정 페이지

### Task 11: 학원 설정 페이지

**Files:**
- Create: `src/stores/settingsStore.ts`
- Create: `src/components/settings/OperatingDaysForm.tsx`
- Create: `src/components/settings/DayHoursForm.tsx`
- Create: `src/components/settings/CapacityForm.tsx`
- Modify: `src/pages/admin/SettingsPage.tsx`

**Step 1: 설정 스토어**

`src/stores/settingsStore.ts` — academy_settings CRUD.

**Step 2: 설정 폼 컴포넌트들**

- 운영 요일 선택 (토글 버튼)
- 요일별 운영 시간 설정
- 최대 수용 인원 설정
- 그리드 스냅 단위 설정

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: academy settings page"
```

---

## Phase 8: 학부모 뷰

### Task 12: 학부모 전용 페이지

**Files:**
- Create: `src/components/parent/ParentScheduleList.tsx`
- Create: `src/components/parent/ParentHistoryList.tsx`
- Modify: `src/pages/parent/ParentWeeklyPage.tsx`
- Modify: `src/pages/parent/ParentMonthlyPage.tsx`
- Modify: `src/pages/parent/HistoryPage.tsx`

**Step 1: 학부모 주간 뷰**

자녀의 이번 주 일정을 리스트 형태로 표시. 정상/결석/보강 상태 표시.

**Step 2: 학부모 월간 뷰**

월간 달력에 자녀의 수업/결석/보강 표시.

**Step 3: 이력 페이지**

결석 → 보강 매핑 이력을 시간순 리스트로 표시.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: parent read-only views (weekly, monthly, history)"
```

---

## Phase 9: 푸시 알림 & Capacitor

### Task 13: Capacitor + FCM 설정

**Files:**
- Create: `capacitor.config.ts`
- Create: `android/` (Capacitor 생성)
- Create: `src/lib/notifications.ts`

**Step 1: Capacitor 초기화**

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "HB Class" com.hbclass.app
npm install @capacitor/push-notifications @capacitor/app @capacitor/haptics @capacitor/status-bar
npx cap add android
```

**Step 2: FCM 설정**

Firebase 프로젝트 생성 → google-services.json 다운로드 → android/app/에 배치.

**Step 3: 푸시 알림 유틸리티**

`src/lib/notifications.ts` — 토큰 등록, 알림 수신 핸들러.

**Step 4: Supabase Edge Function — 알림 발송**

결석 처리, 보강 배정, 시간 변경 시 학부모에게 FCM 알림.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: Capacitor + FCM push notifications"
```

---

## Phase 10: 주간 이벤트 자동 생성

### Task 14: Supabase Edge Function — 주간 이벤트 생성 Cron

**Files:**
- Create: `supabase/functions/generate-weekly-events/index.ts`

**Step 1: Edge Function 작성**

매주 일요일 밤에 실행. regular_schedules 기반으로 다음 주 schedule_events 자동 생성.
이미 존재하는 이벤트는 스킵 (중복 방지).

**Step 2: Cron 설정**

Supabase Dashboard → Edge Functions → Cron 스케줄 설정.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: weekly event auto-generation edge function"
```

---

## Phase 11: 최종 마무리

### Task 15: APK 빌드 및 테스트

**Step 1: 웹 빌드**

```bash
npm run build
npx cap sync
```

**Step 2: Android Studio에서 APK 빌드**

```bash
npx cap open android
```
Android Studio에서 Build → Generate Signed APK.

**Step 3: 실기기 테스트**

APK 설치 → 로그인 → 학생 등록 → 주간 뷰 확인 → 드래그&드롭 → 학부모 로그인 → 읽기 확인.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: finalize APK build config"
```
