# MY HUB · 나의 업무 관리

GitHub Pages 주소: https://yhbae106.github.io/Sales_Forecast/my-hub/

- 매출 예측·마감 관리, SLA·DCM 관리, 기고 수금내역서 연결
- 업무 추가/수정/삭제, 검색, 분류, 즐겨찾기, 최근 방문
- 직접 입력하는 진행 상태, 마감일, 메모
- JSON 백업 및 다른 PC에서 복원 (동일 URL 중복 제외)

## 저장 방식
기본 목록은 `catalog.json`에서 관리합니다. 개인 변경 내용은 브라우저 localStorage에 저장되며 GitHub에 자동 게시되지 않습니다. 기기 변경 전 백업 후 복원하세요. 이전 ChatGPT Sites 버전의 계정 데이터와는 별도입니다. 브라우저 데이터 삭제 시 개인 변경 내용이 사라질 수 있습니다. 비밀값을 소스나 catalog에 넣지 마세요.

## 개발
`npm install` 후 `npm run build`. 생성한 `hub.js`와 수정한 소스를 함께 커밋합니다. `npm test`로 저장/복원 동작을 검증합니다. 루트의 기존 GitHub Pages 배포 워크플로가 이 폴더도 배포합니다. 별도 Node 서버나 외부 JS CDN이 필요하지 않습니다.

기존 업무 사이트의 데이터·권한·계산식은 변경하지 않습니다. iframe이 차단되거나 로그인이 필요하면 새 탭 열기를 사용합니다.
