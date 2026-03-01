-- 학생 테이블에 학부모 전화번호 컬럼 추가
alter table students add column parent_phone text;

-- 학부모가 직접 가입할 수 있도록 profiles insert 정책 추가
create policy "anyone_can_insert_profile" on profiles
  for insert with check (true);

-- 학부모 가입 시 자기 프로필 읽기
create policy "users_read_own_profile" on profiles
  for select using (id = auth.uid());

-- 학부모가 가입 후 매칭된 학생 parent_id 업데이트를 위한 정책
create policy "parent_update_student_link" on students
  for update using (
    parent_phone = (select phone from profiles where id = auth.uid())
  ) with check (
    parent_phone = (select phone from profiles where id = auth.uid())
  );

-- 개발용: 인증 없이 전체 접근
create policy "dev_public_students_select" on students
  for select using (true);
