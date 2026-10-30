-- 밥궁합 데이터베이스 스키마
-- Supabase 대시보드 > SQL Editor에 붙여넣고 한 번 실행한다.
--
-- 설계 원칙
-- 1. 신원(이름)과 사주 데이터를 테이블로 분리하고 무작위 ID로만 잇는다(가명 처리).
-- 2. 모든 테이블에 RLS를 켜고 정책을 만들지 않는다. 그러면 공개 키(anon)로는 읽기·쓰기가
--    전부 막히고, 서버 함수가 가진 service_role 키로만 접근할 수 있다.
-- 3. AI에는 saju_results만 넘긴다. 이름과 생년월일은 AI로 나가지 않는다.

create extension if not exists pgcrypto;

-- 신원 정보: 운영자만 본다.
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique check (char_length(display_name) between 1 and 20),
  consent_at timestamptz not null,
  consent_version text not null,
  created_at timestamptz not null default now()
);

-- 원본 생년월일: 재계산·검증용. 편성이 끝나면 삭제한다.
create table if not exists birth_inputs (
  participant_id uuid primary key references participants(id) on delete cascade,
  birth_date date not null,
  birth_time time,            -- null이면 시각 미상
  created_at timestamptz not null default now()
);

-- 계산 결과: AI 편성에 쓰는 유일한 데이터.
create table if not exists saju_results (
  participant_id uuid primary key references participants(id) on delete cascade,
  year_pillar text not null,
  month_pillar text not null,
  day_pillar text not null,
  hour_pillar text,           -- 시각 미상이면 null
  day_master text not null,
  day_master_element text not null,
  gender text not null check (gender in ('male', 'female')),  -- 이성 궁합과 밥조 편성용
  elements jsonb not null,    -- {"목":1,"화":3,"토":2,"금":2,"수":0}
  cross_check_ok boolean not null,
  cross_check_detail jsonb not null,
  library_versions jsonb not null,
  created_at timestamptz not null default now()
);

-- AI 편성 기록: AI에 보낸 데이터, 도구 호출 과정, 결과를 남긴다(실명 없음).
create table if not exists grouping_runs (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  sent_to_ai jsonb not null,
  tool_log jsonb not null,
  ai_groups jsonb not null,
  ai_score integer not null,
  baseline_score integer not null,
  duration_ms integer not null,
  assignment jsonb,          -- 확정용: 조별 참여자 ID(UUID). AI에는 보내지 않는다.
  created_at timestamptz not null default now()
);

-- 공개된 밥조: 참여자가 다시 들어와 같은 정보를 입력하면 자기 조를 볼 수 있다.
create table if not exists bapjo_assignments (
  participant_id uuid primary key references participants(id) on delete cascade,
  group_no integer not null,
  group_name text not null,
  group_reason text not null,
  published_at timestamptz not null default now()
);

alter table participants enable row level security;
alter table birth_inputs enable row level security;
alter table saju_results enable row level security;
alter table grouping_runs enable row level security;
alter table bapjo_assignments enable row level security;

-- 정책을 일부러 만들지 않는다: anon/authenticated 역할은 아무것도 할 수 없다.

-- 편성 완료 후 원본 생년월일을 지우는 쿼리(운영자가 SQL Editor에서 실행):
-- delete from birth_inputs;

-- 2026-10-30 변경: 테이블을 이미 만들었다면 아래 두 줄만 실행한다.
-- delete from participants;  -- 성별 없는 테스트 데이터 정리
-- alter table saju_results add column if not exists gender text not null check (gender in ('male', 'female'));
