# HB Class - 학원 시간표 관리 앱 설계 문서

## 1. 개요

- **앱 이름**: HB Class
- **목적**: 학원 시간표의 직관적 조회 및 결석/보강 일정 관리
- **타겟 사용자**:
  - 관리자(원장): 전체 시간표 관리, 수정, 권한 제어 (Full Access)
  - 학부모: 자녀의 시간표 조회 (Read-Only, 앱 설치 + 전화번호 가입)
- **배포**: Google Play Store (Capacitor)

## 2. 기술 스택

| 레이어 | 기술 | 역할 |
|--------|------|------|
| UI 프레임워크 | React 18 + TypeScript | SPA 프론트엔드 |
| 빌드 | Vite | 빠른 빌드/HMR |
| 모바일 배포 | Capacitor | 웹앱 → APK 래핑 |
| 상태 관리 | Zustand | 경량 상태 관리 |
| UI 컴포넌트 | Tailwind CSS + shadcn/ui | 심플하고 직관적인 UI |
| 드래그&드롭 | @dnd-kit/core | 일정 블록 이동 |
| 백엔드/DB | Supabase (PostgreSQL) | DB + Auth + Realtime |
| 인증 | Supabase Auth | Google 로그인 + Phone OTP |
| 푸시 알림 | Firebase Cloud Messaging | Capacitor 플러그인 연동 |

## 3. 데이터베이스 스키마

### profiles
- id (UUID, PK, = auth.user.id)
- role: 'admin' | 'parent'
- name: string
- phone: string (unique)
- created_at: timestamp

### students
- id (UUID, PK)
- name: string
- grade_level: 'elementary' | 'middle' | 'high'
- parent_id: FK → profiles.id
- memo: text (nullable)
- created_at: timestamp

### regular_schedules (정규 시간표 - 요일별 반복 템플릿)
- id (UUID, PK)
- student_id: FK → students.id
- day_of_week: 0~6 (일~토)
- start_time: time (HH:MM)
- end_time: time (HH:MM)
- created_at: timestamp

### schedule_events (특정 날짜의 실제 일정 인스턴스)
- id (UUID, PK)
- student_id: FK → students.id
- date: date
- start_time: time (HH:MM)
- end_time: time (HH:MM)
- type: 'regular' | 'makeup'
- status: 'scheduled' | 'absent' | 'completed'
- source_event_id: FK → schedule_events.id (nullable, 보강의 원래 결석 이벤트)
- created_at: timestamp
- updated_at: timestamp

### academy_settings
- id (UUID, PK)
- operating_days: int[] (0~6)
- day_hours: jsonb (요일별 운영 시간)
- max_capacity: int (default: 14)
- grid_snap_minutes: int (default: 15)
- updated_at: timestamp

## 4. 데이터 흐름

```
정규 시간표 등록 (admin)
       │
       ▼
[매주 자동 생성 - Supabase Edge Function Cron]
       │
       ▼
schedule_events (type='regular', status='scheduled')
       │
       ├─ 결석 처리 → status='absent'
       │
       └─ 보강 추가 → 새 event (type='makeup', source_event_id=결석ID)
```

## 5. 화면 구성

### 5.1 네비게이션

관리자 하단 탭: 주간 | 월간 | 학생 | 설정
학부모 하단 탭: 주간 | 월간 | 이력

### 5.2 주간 뷰 (관리자 메인)
- 세로축: 시간 (15분 스냅 그리드), 가로축: 운영 요일
- 학생 블록: 높이 = 수업 시간에 비례, 색상 = 학년별
  - 초등: #FCD34D (노란색)
  - 중등: #60A5FA (파란색)
  - 고등: #F87171 (빨간색)
  - 보강: 점선 테두리
- 인원 카운터: 각 시간대별 피크 인원 표시
- 용량 초과 시: 배경 빨간색 + 상단 경고 배너
- 보강 대기소: 화면 하단, 결석 처리된 블록 표시

### 5.3 주간 뷰 인터랙션
- 블록 탭: 학생 상세 팝업 (결석/보강 처리 버튼 포함)
- 블록 길게 누르기 → 드래그: 다른 요일/시간으로 이동
- 보강 대기소 블록 → 그리드로 드래그: 보강 확정

### 5.4 월간 뷰
- 달력 형태, 날짜별 수업 수 / 결석 / 보강 아이콘 표시
- 날짜 탭 시 해당 주의 주간 뷰로 이동

### 5.5 학생 관리
- 학생 목록 (검색 + 학년 필터)
- 학생 등록/편집: 이름, 학년, 학부모 전화번호, 요일별 정규 시간표
- CSV/JSON 일괄 임포트

### 5.6 학부모 뷰
- 읽기 전용, 자녀 정보만 표시
- 주간 시간표 (리스트 형태)
- 월간 달력
- 결석/보강 이력

## 6. 인증

- 관리자: Google 로그인 (Supabase Auth)
- 학부모: 전화번호 OTP 가입 (Supabase Auth Phone)
- 학생 등록 시 학부모 전화번호 입력 → 해당 번호로 가입 시 자동 연결

## 7. 푸시 알림

- Firebase Cloud Messaging + Capacitor Push Plugin
- 알림 트리거:
  - 보강 일정 배정 시 → 학부모에게 알림
  - 결석 처리 시 → 학부모에게 알림
  - 시간 변경 시 → 학부모에게 알림

## 8. 주요 제약사항

- 동시 수용 인원 최대 14명 (설정에서 변경 가능)
- 타임라인 그리드 최소 단위 15분 스냅 (설정에서 변경 가능)
- 데이터 입력은 분 단위, 시각화만 스냅 적용

## 9. 에러 처리

- 인원 초과 시: 시각적 경고 (저장은 허용하되 경고 표시)
- 시간 겹침: 같은 학생의 같은 날짜 시간 겹침 시 경고
- 네트워크 오류: 오프라인 시 읽기만 가능, 수정은 온라인 복귀 후 재시도
- 인증 만료: 자동 토큰 갱신, 실패 시 로그인 화면 이동
