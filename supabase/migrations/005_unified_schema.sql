-- ============================================
-- Phase 1: Firebase → Supabase 통합 스키마
-- HBchecker + HBscore + HBtimetable 통합
-- ============================================

-- ─── 1. students 테이블 확장 ───

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS grade text,
  ADD COLUMN IF NOT EXISTS current_status text DEFAULT 'absent',
  ADD COLUMN IF NOT EXISTS level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sub_level integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS started_at date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS withdrawn_at date,
  ADD COLUMN IF NOT EXISTS score_drop_risk boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS firebase_id text;

-- current_status 체크 제약 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_current_status_check'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_current_status_check
      CHECK (current_status IN ('present', 'absent', 'leave'));
  END IF;
END $$;

-- firebase_id 인덱스 (마이그레이션 매핑용)
CREATE INDEX IF NOT EXISTS idx_students_firebase_id ON students(firebase_id);

-- ─── 2. profiles 테이블 확장 ───

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS kiosk_device_id text,
  ADD COLUMN IF NOT EXISTS kiosk_last_heartbeat timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- username 유니크 인덱스 (NULL 허용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique
  ON profiles (username) WHERE username IS NOT NULL;

-- role 체크 제약 확장 (teacher, developer, viewer, kiosk 추가)
-- 기존 체크 제약 제거 후 재생성
DO $$
BEGIN
  -- 기존 role 체크 제약 찾아서 제거
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conrelid = 'profiles'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%role%'
      LIMIT 1
    );
  END IF;

  ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'parent', 'teacher', 'developer', 'viewer', 'kiosk'));
END $$;

-- ─── 3. attendance_logs (출석 로그) ───

CREATE TABLE IF NOT EXISTS attendance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  check_in_time timestamptz,
  check_out_time timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_logs(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(date);

-- ─── 4. homework_logs (숙제 로그) ───

CREATE TABLE IF NOT EXISTS homework_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean GENERATED ALWAYS AS (score >= 80) STORED,
  note text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homework_student_date ON homework_logs(student_id, date);

-- ─── 5. test_categories (시험 카테고리) ───

CREATE TABLE IF NOT EXISTS test_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('WORD', 'MOCK', 'SCHOOL')),
  max_score numeric DEFAULT 100,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  academy_id uuid REFERENCES academy_settings(id),
  created_at timestamptz DEFAULT now()
);

-- ─── 6. scores (성적) ───

CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES test_categories(id),
  score numeric NOT NULL,
  date date NOT NULL,
  note text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scores_student_date ON scores(student_id, date);
CREATE INDEX IF NOT EXISTS idx_scores_category ON scores(category_id);

-- ─── 7. audit_logs (감사 로그) ───

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  user_id uuid REFERENCES profiles(id),
  device_info text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ─── 8. sms_logs (SMS 로그) ───

CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  template_type text,
  sent_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- ─── 9. RLS 정책 ───

ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Admin/Teacher 전체 접근
CREATE POLICY "admin_all_attendance" ON attendance_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'developer'))
  );

CREATE POLICY "admin_all_homework" ON homework_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'developer'))
  );

CREATE POLICY "admin_all_categories" ON test_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'developer'))
  );

CREATE POLICY "admin_all_scores" ON scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'developer'))
  );

CREATE POLICY "admin_all_audit" ON audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'developer'))
  );

CREATE POLICY "admin_all_sms" ON sms_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher', 'developer'))
  );

-- 학부모: 자녀 데이터만 읽기
CREATE POLICY "parent_read_attendance" ON attendance_logs
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "parent_read_homework" ON homework_logs
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

CREATE POLICY "parent_read_scores" ON scores
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
  );

-- 카테고리는 인증된 모든 사용자 읽기 허용
CREATE POLICY "authenticated_read_categories" ON test_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── 10. 유용한 DB 함수 ───

-- 출석 통계 (월별)
CREATE OR REPLACE FUNCTION get_attendance_stats(p_student_id uuid, p_month date)
RETURNS TABLE(present_count bigint, absent_count bigint, leave_count bigint) AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'present'),
    COUNT(*) FILTER (WHERE status = 'absent'),
    COUNT(*) FILTER (WHERE status = 'leave')
  FROM attendance_logs
  WHERE student_id = p_student_id
    AND date >= date_trunc('month', p_month)
    AND date < date_trunc('month', p_month) + interval '1 month';
$$ LANGUAGE sql STABLE;

-- 성적 하락 위험 감지
CREATE OR REPLACE FUNCTION check_score_drop_risk(p_student_id uuid)
RETURNS boolean AS $$
  WITH ranked AS (
    SELECT score, ROW_NUMBER() OVER (ORDER BY date DESC, created_at DESC) AS rn
    FROM scores WHERE student_id = p_student_id
  ),
  recent AS (SELECT AVG(score) as avg FROM ranked WHERE rn <= 3),
  older AS (SELECT AVG(score) as avg FROM ranked WHERE rn BETWEEN 4 AND 6)
  SELECT COALESCE(
    (SELECT avg FROM recent) - (SELECT avg FROM older) < -20,
    false
  );
$$ LANGUAGE sql STABLE;

-- 학생 일괄 퇴실 (22:00 자동 퇴실용)
CREATE OR REPLACE FUNCTION batch_leave_students()
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  -- 현재 'present' 상태 학생을 'leave'로 변경
  WITH updated AS (
    UPDATE students
    SET current_status = 'leave'
    WHERE current_status = 'present'
    RETURNING id
  )
  INSERT INTO attendance_logs (student_id, date, status, check_out_time)
  SELECT id, CURRENT_DATE, 'leave', now()
  FROM updated;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 (students에도 적용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_students'
  ) THEN
    -- students에 updated_at 컬럼 추가
    ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    CREATE TRIGGER set_updated_at_students
      BEFORE UPDATE ON students
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
