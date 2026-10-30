# 밥궁합

사주로 찾는 나와 잘 맞는 밥조. 학회원이 웹에서 생년월일을 입력하면 서버가 만세력으로 사주를 계산해 DB에 저장하고, 이후 AI 에이전트(Google Gemini)가 궁합 도구를 호출해 밥조를 편성한다.

## 구조

| 구성 | 사용 기술 | 비용 |
| --- | --- | --- |
| 입력 페이지 | `public/index.html` (HTML/CSS/JS) | 무료 |
| 서버 함수 | `api/submit.js` (Vercel Functions, Node 18+) | 무료 |
| 사주 계산 | `lib/saju.js`: `manseryeok`로 계산, `lunar-javascript`로 교차검증 | 무료 |
| 데이터베이스 | Supabase PostgreSQL, `supabase/schema.sql` | 무료 |
| AI 편성 | `api/group.js`, `lib/agent.js`: Gemini 함수 호출 에이전트, `lib/compat.js`: 궁합 점수와 기준선 | 무료 등급 |
| 결과 풀이 | `lib/reading.js`(성격·연애·재물·직업), `lib/match.js`(잘 맞는 이성), `lib/specials.js`(매력 지수·도화/홍염/역마/괴강·2027년 운세) | 무료 |
| 운영자 페이지 | `public/admin.html` | 무료 |

처리 순서: 입력 → 초대코드·동의·입력값 검증 → 사주 계산(진태양시 보정) → 교차검증 → DB 저장 → 본인 사주만 화면에 표시.

## 보안 설계 요약

- **최소 수집과 동의**: 이름(닉네임), 양력 생년월일, 시각(선택)만 받고, 제출 전에 동의를 받는다. 동의 시각과 문구 버전을 저장한다.
- **가명 처리**: 신원(`participants`), 원본 생년월일(`birth_inputs`), 사주 결과(`saju_results`)를 테이블로 나누고 무작위 UUID로만 잇는다.
- **접근 통제**: 세 테이블 모두 RLS를 켜고 정책을 두지 않는다. 브라우저용 공개 키로는 아무것도 읽거나 쓸 수 없고, 서버 함수의 `service_role` 키로만 접근한다. 이 키는 Vercel 환경변수에만 둔다.
- **AI 전송 최소화와 재식별 방지**: AI에는 매번 새로 섞은 가명 번호(P01…), 성별, 일간·일지, 오행 개수만 보낸다. 연주·월주까지 보내면 생년월일을 역산할 수 있어서 뺐다. Gemini 무료 등급은 입력이 서비스 개선에 쓰일 수 있다는 위험을 이 최소화로 낮추고, 남은 위험은 동의 안내에 고지했다.
- **AI 판단 통제**: 궁합 점수는 코드(`lib/compat.js`)가 계산하고, AI는 도구를 호출해 판단만 한다. 최종안은 `submit_groups` 도구로만 제출되며 서버가 규칙(전원 한 번씩, 조 인원)을 검사해 통과해야 확정된다. AI에 보낸 데이터, 도구 호출 과정, 결과, 코드 최적화 기준선 점수를 `grouping_runs`에 남긴다.
- **가용성**: AI 호출이 실패하면(무료 한도 초과, 모델 종료, 45초 시간 초과) 코드 최적화 편성안을 대신 보여주고 `fallback:` 표시와 사유를 기록한다. 25명 기준 코드 편성은 1초 안에 끝난다. 모델은 `GEMINI_MODEL` 환경변수로 바꿀 수 있다.
- **운영자 페이지**: `/admin.html`은 `ADMIN_PASSWORD`로 보호하고(상수 시간 비교), 실명은 서버에서만 가명 번호와 다시 연결한다.
- **악용 방지**: 초대코드, 봇용 숨김 필드, 같은 이름 중복 차단.
- **보관 기간**: 편성 직후 `delete from birth_inputs;`로 원본 생년월일을 삭제하고, 프로젝트가 끝나면 전부 삭제한다.
- **계산 정확성**: 두 라이브러리 결과가 다르면 `cross_check_ok = false`로 표시한다. `npm run crosscheck`로 대량 검증(2026-10-30 기준 5,000건 100% 일치).
- **공급망**: 라이브러리 버전을 고정하고 `npm audit`으로 점검한다(2026-10-30 기준 취약점 0건).

## 공개 저장소 보안 원칙

- 비밀값(Supabase 키, Claude API 키, 초대코드)은 Vercel 환경변수에만 둔다. `.env*`는 `.gitignore`로 막는다.
- 비밀값을 실수로 커밋하면 커밋 삭제로 끝내지 않고 즉시 키를 재발급한다.
- 실제 참여자 데이터와 그 데이터가 보이는 스크린샷은 저장소에 올리지 않는다. 테스트에는 가상 데이터만 쓴다.

## 배포 방법

1. **GitHub**: 새 공개 저장소를 만들고 이 폴더를 올린다.
2. **Supabase** (supabase.com, GitHub로 가입)
   - New project 생성, 리전은 Seoul(ap-northeast-2).
   - SQL Editor에서 `supabase/schema.sql` 전체를 실행.
   - Project Settings > API에서 `Project URL`과 `service_role` 키를 복사.
3. **Vercel** (vercel.com, GitHub로 가입)
   - Add New > Project에서 GitHub 저장소를 가져온다. Framework Preset은 `Other`.
   - Environment Variables에 다음 세 개를 넣고 Deploy.
     - `SUPABASE_URL`: Supabase Project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service_role 키
     - `INVITE_CODE`: 아무도 추측 못 할 무작위 문자열(저장소에 적지 않는다)
     - `ADMIN_PASSWORD`: 운영자 페이지 비밀번호
     - `GEMINI_API_KEY`: Google AI Studio API 키(무료 등급)
     - `GEMINI_MODEL`(선택): 기본값 `gemini-3.6-flash`
4. 학회원에게 `https://<배포주소>/?code=<INVITE_CODE>` 링크를 보낸다.

## 로컬 검증

```bash
npm install
npm run crosscheck
npm audit
```
