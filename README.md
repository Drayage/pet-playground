# Pet Playground

`우리 집 동물놀이터`를 모바일과 데스크톱에서 플레이할 수 있도록 구현한 웹 카드 게임입니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

프로덕션 빌드는 다음 명령으로 확인합니다.

```bash
npm run build
npm run start
```

## PWA

- 홈 화면 설치용 Web App Manifest
- Android 및 iOS용 앱 아이콘
- 서비스 워커 기반 오프라인 실행
- 게임 화면과 카드 이미지 50장 캐시
- 새 버전 접속 시 앱 셸 캐시 갱신

지원 브라우저에서는 상단의 설치 아이콘 또는 브라우저의 `홈 화면에 추가` 메뉴로 설치할 수 있습니다.

## 주요 파일

- `src/main.jsx`: 카드 데이터, 게임 상태, 행동 처리, UI
- `src/styles.css`: 반응형 카드 및 게임 화면 스타일
- `public/manifest.webmanifest`: PWA 메타데이터
- `public/sw.js`: 오프라인 캐시 서비스 워커
- `public/assets/card-art`: 카드별 동물 이미지
