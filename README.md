# 인하대 후문 점심 뽑기

- 운영 사이트: https://lunch-picker-opal.vercel.app/
- 관리자: https://lunch-picker-opal.vercel.app/?admin=1
- GitHub Pages는 일반 추첨용으로 유지합니다.

## 관리자 설정 (Vercel)

프로젝트 Settings → Environment Variables에서 Production 환경에 다음 두 값을 직접 등록하고 재배포하세요.

- LUNCH_ADMIN_PASSWORD: 12자 이상인 고유하고 강력한 관리자 비밀번호
- LUNCH_GITHUB_TOKEN: mi-ns/lunch-picker 저장소만 선택한 fine-grained personal access token, Contents: Read and write 권한. 토큰은 비밀 환경변수로 관리하고 소스 코드나 채팅에 올리지 않습니다.

이후 관리자 페이지에서 비밀번호로 로그인하면 세션은 최대 8시간 유지되며, 공통 설정 저장 시 별도 GitHub 토큰 입력이 필요 없습니다. 설정 저장은 GitHub config.json에 커밋으로 기록됩니다. 일반 사용자는 GitHub의 공통 설정을 읽으며 CDN 반영 지연이 있을 수 있습니다. 이전 설정에 충돌하면 새로고침 후 다시 편집합니다. 비밀번호나 토큰을 변경하면 재배포가 필요합니다.

신규 식당 후보의 영업 여부와 지점명은 별도 확인이 필요합니다.
