# whiskeylog

위스키 컬렉션을 기록하고, 개봉 후 에어링 상태와 시음 노트를 관리하는 웹 앱입니다.

Next.js 프론트엔드와 Express API가 함께 동작합니다. 로그인은 Firebase Auth(Google)를 쓰고, 병 데이터는 Prisma + SQLite에 저장합니다.

## 스택

- **Web**: Next.js 16, React 19, Tailwind CSS 4
- **API**: Express 5, Zod, Prisma 7 (better-sqlite3)
- **Auth**: Firebase Authentication (Google)

## 시작하기

```bash
npm install
npm install --prefix server
cp .env.example .env.local
cp server/.env.example server/.env
```

`.env.local`에 Firebase 웹 설정값을, `server/.env`에 Firebase Admin 자격 증명과 `DATABASE_URL`을 넣습니다.

```bash
npm run db:generate --prefix server
npm run db:push --prefix server
npm run dev
```

- 웹: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000) (`GET /health`)

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Next.js와 Express를 함께 실행 |
| `npm run dev:web` | 웹만 실행 |
| `npm run dev:api` | API만 실행 |
| `npm run db:push --prefix server` | SQLite 스키마 반영 |
| `npm run db:generate --prefix server` | Prisma Client 생성 |

## API

인증이 필요한 요청은 `Authorization: Bearer <Firebase ID token>` 헤더를 붙입니다.

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| `GET` | `/api/whiskies` | 내 컬렉션 목록 |
| `POST` | `/api/whiskies` | 병 추가 |
| `GET` | `/api/whiskies/:id` | 상세 + 시음 노트 |
| `PATCH` | `/api/whiskies/:id` | 병 정보 수정 |
| `DELETE` | `/api/whiskies/:id` | 병 삭제 |
| `POST` | `/api/whiskies/:id/notes` | 시음 노트 추가 |
| `GET` | `/api/suggest/whiskies?q=` | 이름 자동완성 |
| `GET` | `/api/images/search?q=` | 병 이미지 후보 |

이미지 검색은 Bing과 Wikimedia Commons를 병렬로 조회합니다. 이름 제안은 Google Suggest와 로컬 인기 위스키 시드를 합칩니다.

## 에어링

개봉일 기준으로 경과 일수를 계산합니다.

| 단계 | 기간 |
| --- | --- |
| Fresh | 0–14일 |
| Initial Airing | 15–60일 |
| Peak Flavor | 61–180일 |
| Fully Aired | 181일 이후 |

미개봉·시음 완료 병은 단계 대신 상태 라벨만 표시합니다.
