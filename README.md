# 모바일 특화 지도 맛집 기록 앱 (localStorage)

## 실행 방법

이 프로젝트는 **정적 파일**이라 빌드 없이 실행됩니다.  
단, `index.html`을 파일로 직접 열면(예: `file://`) 브라우저 정책 때문에 `assets/*.svg` 로딩이 막힐 수 있습니다.  
아래처럼 **로컬 서버로 실행**해 주세요.

### Python (권장)

```bash
python3 -m http.server 5173
```

그 다음 브라우저에서 아래 주소로 접속:

- `http://localhost:5173`

### Node (대안)

```bash
npx serve .
```

## 사용 방법

- **전국 지도(1단계)**: 시/도를 탭하면 확대됩니다.
- **구/군 지도(2단계)**: 구/군을 탭하면 바텀 시트가 올라오고 기록을 저장할 수 있습니다.
- **기록 보기**: 지도 아래 피드에서 해당 구/군의 기록을 카드로 확인합니다.
- **저장 위치**: 브라우저 `localStorage` (`matzip-map-records:v1`)

## 지도/라이선스

- `assets/korea_admin_divisions.svg`: Wikimedia Commons 업로더/라이선스 표기(원본: “Administrative divisions map of South Korea.svg”, CC BY-SA 3.0)

