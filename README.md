# Hacard Web

하이큐!! 바보카 BREAK 비공식 카드 도감 및 덱 메이커.

## 실행 및 빌드

Node.js 22.18 이상에서 실행합니다.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

정적 사이트 출력 디렉터리는 `dist`입니다. 호스팅 서비스의 빌드 명령은 `npm run build`로 설정합니다.

## 배포용 데이터

`src/data/catalog.json`은 검증된 카드 원문과 한국어 번역을 포함하는 화면용 데이터입니다. 데이터 수집·번역 스크립트, 원본 데이터 사전, 테스트 파일은 이 저장소에 포함하지 않습니다. 카드 데이터 변경 시 로컬 원본 프로젝트에서 재생성한 `catalog.json`을 갱신하세요. Python은 배포에 필요하지 않습니다.

카드 이미지는 공식 사이트에서 불러옵니다. 한국어 번역은 비공식 AI 초안이며 이미지와 작품의 권리는 각 권리자에게 있습니다.

덱은 사용자의 브라우저에 저장됩니다. 다른 도메인으로 이동할 때는 기존 사이트에서 덱 JSON을 내보내고 새 사이트에서 가져오세요.

## GitHub Pages

사이트: https://cocardtcg.github.io/hacard-web/

`main` 브랜치에 푸시하면 GitHub Actions가 설치·빌드 후 `dist`를 GitHub Pages에 배포합니다. 진행 상태는 저장소의 Actions 탭에서 확인할 수 있습니다. 저장소 Settings → Pages의 배포 소스는 GitHub Actions로 설정합니다.
