# HYRAM 관리자 인증 연동 — 운영자 작업

## 현재 상태
- 홈페이지 로그인/콜백/관리자 셸: 소스 코드 준비됨. Supabase 설정은 의도적으로 비어 있음.
- 고객 회원가입: 준비 중(별도 설계 필요). 관리자 계정 한 명만 우선.
- 실제 계정 생성, 메일 발송, 운영 DB 연결: **완료되지 않음**.

## 1. Supabase 대시보드에서 준비
1. 로그인해 본인의 HYRAM GOLF 프로젝트를 엽니다.
2. SQL Editor에서 먼저 `backend/db/admin_roles.sql`을 적용합니다.
3. Authentication → URL Configuration에서 Site URL `https://hyramgolf.kr`와 Redirect URL `https://hyramgolf.kr/auth/callback.html`을 추가합니다.
4. Authentication → Providers에서 이메일 로그인 설정을 확인합니다. 초대 메일/매직링크가 실제 도착하는지 테스트합니다. 이메일 발송량과 SMTP/템플릿도 점검합니다.
5. Authentication → Users에서 실제 OWNER 이메일 계정으로 **Send invitation**을 실행합니다. 이메일 초대와 사용자 식별자가 생성됩니다. 이 작업 전 Auth callback이 작동하도록 먼저 아래 2번 설정을 완료합니다.

## 2. 웹사이트 브라우저용 연동
- Project URL (`https://...supabase.co`)과 브라우저용 Publishable key (`sb_publishable_...`)만 `auth/site-config.mjs`에 설정합니다.
- **Secret key, service-role key, Database Password, JWT secret은 절대 저장소/HTML/채팅으로 보내지 않습니다.**
- 새 설정이 반영되면 HTTPS로 `/login.html`, `/auth/callback.html`이 열리고 미인증 상태에서 `/admin/` 내용이 잠기는지 확인합니다.
- `signInWithOtp`에는 `shouldCreateUser:false`가 설정되어 있어 일반 방문자에게 관리자 계정을 자동 생성하지 않습니다.

## 3. OWNER 역할 지정 (SQL Editor에서만 직접 실행)
- 초대 받은 계정이 `Authentication → Users`에 실제 생성됐는지 확인합니다.
- SQL Editor에 다음을 붙여넣고 `OWNER_EMAIL_HERE`를 실제 이메일로 바꿉니다.
```sql
do $$
declare v_id uuid;
begin
  select id into v_id from auth.users
  where lower(email) = lower('OWNER_EMAIL_HERE');
  if v_id is null then raise exception 'Auth user not found'; end if;
  if exists (select 1 from public.hyram_admin_members)
    then raise exception 'An owner already exists'; end if;
  insert into public.hyram_admin_members (user_id,role,owner_slot)
    values (v_id,'owner',1);
end $$;
```
- 이 이메일은 공개 GitHub 코드에 작성하지 않습니다. 앱 프런트엔드가 소유자 권한을 직접 부여하는 기능은 없습니다.

## 4. 검증
- 초대 메일 수락 → `https://hyramgolf.kr/auth/callback.html` → `/admin/`로 진입
- 승인되지 않은 계정은 로그인해도 관리자 화면 접근 불가
- 로그인 전/후 고객 개인정보·예약내역/결제 변경 API는 노출되지 않음
- 로그인·로그아웃·세션 만료·모바일 375/390px 검증
- 운영 전 MFA와 접근 로그, 서버 RLS 정책 테스트를 추가해야 합니다.
