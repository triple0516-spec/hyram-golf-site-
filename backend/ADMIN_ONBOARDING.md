# HYRAM GOLF · 단일 소유자 관리자 계정 온보딩

**상태: 미개통 — 실제 관리자 계정은 생성되지 않았음.**

현재 `hyramgolf.kr`는 GitHub Pages 정적 호스팅이며, Supabase/PostgreSQL 인증 백엔드가 배포되었다는 확인이 없습니다. 관리자 계정을 GitHub HTML, JavaScript, localStorage, 하드코딩한 비밀번호로 구현하지 않습니다.

## 최초 관리자 계정 생성 순서
1. 실제 관리자의 이메일을 사용자에게 직접 확인받습니다. **이메일 또는 비밀번호를 GitHub나 이 대화의 공개 문서에 기록하지 않습니다.**
2. 본인 소유의 Supabase 프로젝트(또는 동등한 신뢰 가능한 Auth 제공자)를 생성하고 이메일 확인·MFA(지원되는 경우)·안전한 세션을 설정합니다.
3. `backend/db/schema.sql` 및 `backend/db/admin_roles.sql`을 관리자 권한으로 마이그레이션합니다. 새 계정 역할은 익명 사용자가 설정할 수 없습니다.
4. 인증 콜백 `https://hyramgolf.kr/auth/callback`을 별도 배포하여 실사용 로그인·이메일 확인·로그아웃을 검증합니다. 현재 `login.html`은 비활성 안내 화면이므로 초대 링크용 콜백으로 사용하지 않습니다.
5. 서버의 안전한 비밀 저장소에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 저장합니다. `HYRAM_ADMIN_EMAIL`, `HYRAM_ADMIN_REDIRECT_URL`도 운영 서버 환경변수에만 둡니다.
6. 확인 후 로컬 또는 통제된 서버에서 `HYRAM_AUTH_READY=confirmed node backend/invite_owner.mjs --execute`를 한 번 실행합니다. 기본 `node backend/invite_owner.mjs`는 **dry run**이며 아무런 계정도 만들지 않습니다.
7. 소유자가 이메일 초대를 직접 수락하고 로그인한 뒤 서버에서 `hyram_is_owner()` 검사, 비관리자 접근 거부, 세션 만료, 로그아웃, 예약 데이터 RLS를 증거와 함께 확인합니다.

### 출시 조건
- 계정·인증서버·초대 모두 **BLOCKED** (백엔드, 사용자 이메일, 운영 비밀키, 실제 콜백 미확인)
- 공개 웹에 서비스 역할 키·PG 비밀키·임의 관리자 비밀번호·고객정보 노출 금지
- `hyram_is_owner()`는 서버/DB 접근통제용이며 브라우저 UI에서 관리자 권한을 스스로 설정해서는 안 됩니다.
- 소유자 한 명만 허용하는 DB 제약 포함; 추가 직원은 별도 권한 모델 및 검증 필요
- 로그인 계정이 없는데도 관리자 화면에 "성공"을 표시하거나 예약·주문 조회를 제공하지 않음
