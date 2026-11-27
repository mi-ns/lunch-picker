# 인하대 후문 점심 뽑기 v2
- 운영: https://lunch-picker-opal.vercel.app/
- 공용 목록은 기존 config.json, 일반 이용 가능. 웹 관리자는 공용 목록을 수정할 수 없음.
- 방 만들기: 12자리 무작위 초대 코드, 별도 6자리 관리자 PIN, 기본 40개 식당 복사. 초대 코드는 URL에 넣지 않고 탭의 sessionStorage에 보관. 방별 설정 및 변경 이력은 Redis에 저장.
- 관리자 로그인은 해당 방만 유효한 HttpOnly 세션(8시간), 서버에 PIN scrypt 해시 저장. 최근 20개 버전 복구 지원. 공유 PIN이므로 개인별 변경자 식별 불가.
- 입력 제한: 이름 30자, 종류 20자, 메뉴 80자, 링크·HTML·제어문자 금지, 중복 차단. 욕설을 완전히 막는 것은 아님.
- 서버 공유 제한: IP+방 PIN 시도 5회/15분, 방 전체 30회/15분, 방 생성 IP별 5회/일, 읽기 및 저장 제한. 공격자가 방 전체 로그인 한도를 소진할 수 있음.

## Vercel 최초 설정
Vercel 프로젝트 Storage에서 Upstash Redis를 연결하고 Production 환경변수 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (또는 KV_REST_API_URL / KV_REST_API_TOKEN)을 설정한 뒤 재배포. 비밀값은 채팅이나 공개 저장소에 넣지 마세요. 기존 LUNCH_GITHUB_TOKEN / LUNCH_ADMIN_PASSWORD는 v2에서 사용하지 않습니다. 이전에 등록한 토큰은 폐기해도 됩니다. 방 생성 및 관리에는 실제 Redis 연결이 필요합니다. 공용 목록은 GitHub Pages에서도 사용 가능하며 방 관리 링크는 Vercel로 이동합니다.
