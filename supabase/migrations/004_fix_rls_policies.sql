-- ============================================
-- RLS 취약 정책 수정
-- ============================================

-- 1. "anyone_can_insert_profile" 제거 → 자기 프로필만 생성 가능으로 교체
drop policy if exists "anyone_can_insert_profile" on profiles;

create policy "users_insert_own_profile" on profiles
  for insert with check (id = auth.uid());

-- 2. "dev_public_students_select" 제거 (개발용 전체 공개 조회)
-- parent_read_students (parent_id = auth.uid()) 정책이 이미 있으므로 학부모 조회 정상 동작
drop policy if exists "dev_public_students_select" on students;

-- 3. "parent_update_student_link"는 유지
-- completeProfile()이 학부모 JWT로 students.parent_id를 업데이트하므로 필요.
-- parent_phone 기반 row 제한이 걸려있어 다른 학생 접근 불가.
-- (참고: RLS는 column-level 제한이 안 되므로, 추후 Edge Function으로 전환 검토)
