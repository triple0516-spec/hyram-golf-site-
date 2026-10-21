# HYRAM GOLF — 실결제·예약 확정 TEST GATE (2026-10-21)

## 판정 원칙
- **운영 홈페이지 GitHub Pages 배포:** PASS (별도 실사이트 검증 증빙 있음).
- **실제 Toss Payments 상점 테스트 결제 승인·취소:** BLOCKED / NOT TESTED.
- **테스트 예약 DB 생성·읽기·담당자 확정·취소:** BLOCKED / NOT TESTED.
- **고객 실결제·실제 골프장 예약 확정:** BLOCKED. 고객 동의·판매 조건·파트너 재고·결제사 계약 필요.
- 가짜 주문번호·성공 화면·메모리 데이터만으로 PASS라고 표시하지 않음.

## 현재 확인된 저장소 상태
- https://hyramgolf.kr 은 정적 GitHub Pages. 결제 및 예약 운영 API 서버 구현이 저장소에서 발견되지 않음.
- backend/db/schema.sql 은 **테이블 생성 초안**. 해당 SQL이 실제 운영 DB에 적용됐다는 확인 자료 없음.
- backend/README.md 및 backend/TOSS_PAYMENT_GATE.md 에서 실제 DB·PG 서버 연결이 완료 전이라고 명시.
- 현재 상담 폼은 접수 초안이며 실제 예약 자동 저장·확정 기능이 아님.
- 토스 공식 결제 승인은 서버에서 paymentKey, orderId, amount 를 서버 보유 주문기록과 검증한 뒤 인증된 POST /v1/payments/confirm 으로 요청. 실거래 영수증/테스트 결제 기록으로 검증 필요.

## 필요한 구성
1. **스테이징 주문·예약 DB 및 API**, 서버 전용 시크릿 보관, 관리자 권한과 고객 데이터 접근 제어. 공개 브라우저에 서비스 역할 키·Toss 시크릿 절대 노출 금지.
2. **토스페이먼츠 상점 전용 테스트 client/secret 세트**와 Toss 테스트 결제창 연동. 문서 예제 키는 상점 실제 테스트 키를 대체하지 못함.
3. 서버에서 SKU·회원 자격·할인 A안·최종 원화를 계산. Toss 응답의 주문번호·금액·결제상태를 읽고 DB에 저장하며 중복 승인 방지.
4. 레슨·피팅 testOnly 예약 생성 후 서버/DB 확정 검증. 외부 골프장 실시간 확정은 XGOLF 등 제휴 서비스와 개별 계약 및 티타임 검증 필요.
5. 승인·실패·중단·변조·중복 승인·전액/부분 취소·웹훅·환불·개인정보 보존 등 별도 검증.

## 준비한 실제 스테이징 자동 검증
파일: qa/verify_payment_reservation_staging.mjs

서버는 **HTTPS staging/test/dev/sandbox 서브도메인**을 사용하고 반드시 /api/health 가 아래 값을 반환해야 테스트를 시작함.
- environment: staging
- paymentMode: test
- bookingMode: sandbox

운영 hyramgolf.kr 본 도메인은 코드가 거절하므로 **진짜 카드 결제나 진짜 고객/강사 일정을 변경하지 않음**.

환경변수는 환경/CI의 secret에서만 지정:
- HYRAM_STAGING_API_ORIGIN: 별도 스테이징 API 서버 기본 URL.
- HYRAM_E2E_OPERATOR_TOKEN: TEST 전용 API 인증 토큰.
- HYRAM_E2E_TEST_SKU: 실제 스테이징에 준비된 합성 테스트 상품 ID.
- HYRAM_E2E_MODE: prepare 또는 verify.
- verify에 추가: HYRAM_E2E_ORDER_ID, HYRAM_E2E_AMOUNT, HYRAM_E2E_PAYMENT_KEY.

### 1단계: prepare
- 스테이징 서버 환경 확인, 잘못된 예약 입력 4xx 거절 확인
- 합성 예약 201 생성, DB 조회, 담당자 확인·예약 상태 confirmed 확인
- 예약 cancelled로 정리
- 서버에서 테스트 주문 발급, 금액 변경 요청 4xx 거절 확인
- 생성된 TEST ORDER ID와 테스트 금액 출력
- 출력값을 사용해 **실제 토스 테스트 결제창에서 인증**을 수행 (카드가 실제 청구되지 않는 가상 승인 환경)

### 2단계: verify
- 실제 테스트 결제창에서 발급된 paymentKey를 활용하여 서버 주문·금액 재확인
- Toss 테스트 승인 → DONE 상태 DB 조회
- 중복 승인 요청이 추가 청구 없이 멱등 처리되는지 확인
- Toss 테스트 결제 취소 → DB CANCELED 상태 조회

### 아직 남는 수동 증거
- Toss 개발자센터 **테스트 결제내역**의 결제 승인 및 취소 항목 실제 조회
- 실제 웹 successUrl과 failureUrl 리다이렉트 동작
- 운영 PG 키/실거래 환경 및 주문취소·웹훅 등별도 승인 게이트
- 예약 제휴사 실제 티타임/강사 실제 일정 사용 가능 여부, 알림 전달 검증
- Supabase 예약 레코드 실존, RLS/미인증 읽기 차단, 감사 로그 확인

### 주의
API 경로는 **앞으로 운영할 백엔드 계약 테스트**에 필요한 명세다. API 서버가 아직 없다면 실행 결과는 BLOCKED로 보고, 성공으로 위장하지 않는다. 스테이징 키/고객 정보를 GitHub 파일·PR·채팅으로 공유하지 않는다.
