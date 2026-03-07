-- ============================================
-- Phase 2 준비: students 테이블 NOT NULL 제약 완화
-- Firebase 학생은 grade_level이 없을 수 있으므로 nullable 변경
-- ============================================

ALTER TABLE students ALTER COLUMN grade_level DROP NOT NULL;
