-- ============================================
-- HBchecker 서비스 호환 컬럼 추가
-- profiles: push_token (알림 토큰)
-- academy_settings: SMS 템플릿 + 진급 연도
-- ============================================

-- profiles: push_token for Expo Push Notifications
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_token text;

-- academy_settings: SMS 템플릿
ALTER TABLE academy_settings
  ADD COLUMN IF NOT EXISTS enter_template text DEFAULT '[Academy] {name} 학생이 등원했습니다.',
  ADD COLUMN IF NOT EXISTS leave_template text DEFAULT '[Academy] {name} 학생이 하원했습니다.',
  ADD COLUMN IF NOT EXISTS late_template text DEFAULT '[Academy] {name} 학생이 지각 등원했습니다.',
  ADD COLUMN IF NOT EXISTS report_template text DEFAULT '[HB Checker] {name} 학생의 {month}월 출석 리포트입니다.',
  ADD COLUMN IF NOT EXISTS last_promotion_year integer DEFAULT 0;
