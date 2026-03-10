# 抽選システム 仕様書

**リポジトリ**: `howlrs/lottery`
**最終更新**: 2026-03-10

---

## 1. システム概要

Web ベースの抽選（くじ引き）システム。管理者がイベント・景品を登録し、ユーザーがルーレットを回して景品を獲得する。当選時にはユニークトークン（QR コード）が発行され、管理者が引換確認を行う。

### 主要機能

| 区分 | 機能 |
|------|------|
| ユーザー向け | イベント一覧閲覧、ルーレット抽選、当選トークン（QR）受取 |
| 管理者向け | イベント作成・管理、景品 CRUD、当選履歴閲覧、トークン検証・引換処理 |
| 共通 | 日本語／英語切替（i18n）、レスポンシブ UI |

---

## 2. 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.0.6 |
| フロントエンド | React | 19.2.0 |
| スタイリング | Tailwind CSS | 4 |
| ORM | Prisma | 5.22.0 |
| データベース | SQLite | - |
| 言語 | TypeScript | 5 |
| テスト (Unit/Integration) | Jest | 30.2.0 |
| テスト (E2E) | Playwright | 1.57.0 |
| QR コード生成 | qrcode.react | - |
| QR コード読取 | html5-qrcode | - |
| アニメーション | canvas-confetti | - |

---

## 3. ディレクトリ構成

```
lottery/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # トップ（イベント一覧）
│   │   ├── layout.tsx                  # ルートレイアウト（i18n Provider）
│   │   ├── events/[slug]/page.tsx      # ルーレット画面
│   │   ├── admin/
│   │   │   ├── page.tsx                # 管理ダッシュボード
│   │   │   └── events/[id]/page.tsx    # 景品管理・引換画面
│   │   └── api/                        # API ルート（後述）
│   ├── components/
│   │   └── LanguageSwitcher.tsx         # 言語切替コンポーネント
│   ├── i18n/
│   │   ├── LanguageContext.tsx          # 言語 Provider + Hook
│   │   └── translations.ts            # 翻訳定義（EN/JA）
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma クライアント（シングルトン）
│   │   └── rewards.ts                  # 当選確率再計算ロジック
│   └── __tests__/                      # Jest テスト
├── prisma/
│   ├── schema.prisma                   # DB スキーマ定義
│   ├── migrations/                     # マイグレーション履歴
│   └── dev.db                          # SQLite データファイル
├── tests/e2e/                          # Playwright E2E テスト
├── scripts/seed.js                     # シードスクリプト
└── docs/                               # ドキュメント類
```

---

## 4. データベース設計

### 4.1 ER 図（概念）

```
Event 1 ──── N Reward 1 ──── N WinLog
```

### 4.2 テーブル定義

#### Event（イベント）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | String (UUID) | PK | 一意識別子 |
| title | String | NOT NULL | イベント名 |
| slug | String | UNIQUE, NOT NULL | URL スラグ |
| description | String | NULL 可 | 説明文 |
| is_active | Boolean | DEFAULT true | 有効フラグ |
| created_at | DateTime | DEFAULT now() | 作成日時 |
| updated_at | DateTime | 自動更新 | 更新日時 |

#### Reward（景品）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | String (UUID) | PK | 一意識別子 |
| event_id | String | FK → Event.id | 所属イベント |
| name | String | NOT NULL | 景品名 |
| description | String | NULL 可 | 説明文 |
| value | Int | NOT NULL | 価値（金額等） |
| count | Int | NOT NULL | 残り在庫数 |
| probability | Float | NOT NULL | 当選確率（%） |
| is_lose | Boolean | DEFAULT false | ハズレフラグ |
| created_at | DateTime | DEFAULT now() | 作成日時 |
| updated_at | DateTime | 自動更新 | 更新日時 |

#### WinLog（当選記録）

| カラム | 型 | 制約 | 説明 |
|--------|----|------|------|
| id | String (UUID) | PK | 一意識別子 |
| reward_id | String | FK → Reward.id | 当選景品 |
| token | String | UNIQUE | 引換トークン（UUID） |
| is_redeemed | Boolean | DEFAULT false | 引換済フラグ |
| redeemed_at | DateTime | NULL 可 | 引換日時 |
| won_at | DateTime | DEFAULT now() | 当選日時 |

### 4.3 リレーション

- **Event → Reward**: 1対多（Cascade Delete）
- **Reward → WinLog**: 1対多（Cascade Delete）

---

## 5. 画面仕様

### 5.1 ユーザー画面

#### `/` — イベント一覧

- 有効な全イベントをカード形式で一覧表示
- 各カードクリックで `/events/[slug]` に遷移

#### `/events/[slug]` — ルーレット抽選画面

- SVG ベースのルーレットホイール表示
  - セグメントサイズは各景品の当選確率に比例
  - 各セグメントに景品名を表示
- 「SPIN」ボタンで回転開始
- 「STOP」ボタンで回転停止（イージングアウトで減速、約3秒）
- 結果表示:
  - **当選時**: 紙吹雪アニメーション + 景品名 + QR コード（トークン）表示
  - **ハズレ時**: ハズレ演出

### 5.2 管理画面

#### `/admin` — 管理ダッシュボード

- 全イベント一覧（作成日時順）
- 「新規イベント作成」フォーム（タイトル、スラグ、説明）
- 各イベントの詳細管理ページへのリンク

#### `/admin/events/[id]` — イベント詳細管理

- **景品管理セクション**
  - 景品の追加・編集・削除
  - 入力項目: 名前、説明、価値、在庫数、ハズレフラグ
  - 確率は在庫数から自動計算（編集不可）
- **当選履歴セクション**
  - 当選者一覧（景品名、トークン、当選日時、引換状況）
- **トークン検証・引換セクション**
  - テキスト入力またはQRコードスキャンでトークン検証
  - 検証成功時に景品情報表示、引換ボタンで引換済に更新

---

## 6. API 仕様

### 6.1 イベント API

#### `GET /api/events`

全イベントを取得する。

**レスポンス**: `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "夏祭り抽選会",
    "slug": "summer-festival",
    "description": "夏祭りの抽選イベント",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/events`

新規イベントを作成する。

**リクエストボディ**:
```json
{
  "title": "夏祭り抽選会",
  "slug": "summer-festival",
  "description": "夏祭りの抽選イベント"
}
```

**レスポンス**: `201 Created`
```json
{
  "id": "uuid",
  "title": "夏祭り抽選会",
  "slug": "summer-festival",
  "description": "夏祭りの抽選イベント",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

---

### 6.2 景品 API

#### `GET /api/rewards?event_id={event_id}`

指定イベントの全景品を取得する。

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| event_id | string | Yes | イベント ID |

**レスポンス**: `200 OK`
```json
[
  {
    "id": "uuid",
    "event_id": "uuid",
    "name": "1等 旅行券",
    "description": "国内旅行券10万円分",
    "value": 100000,
    "count": 1,
    "probability": 2.5,
    "is_lose": false,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-01-01T00:00:00.000Z"
  }
]
```

#### `POST /api/rewards`

新規景品を追加する。追加後、同イベントの全景品の確率が自動再計算される。

**リクエストボディ**:
```json
{
  "event_id": "uuid",
  "name": "1等 旅行券",
  "description": "国内旅行券10万円分",
  "value": 100000,
  "count": 1,
  "is_lose": false
}
```

**レスポンス**: `201 Created`
```json
{
  "id": "uuid",
  "event_id": "uuid",
  "name": "1等 旅行券",
  "description": "国内旅行券10万円分",
  "value": 100000,
  "count": 1,
  "probability": 2.5,
  "is_lose": false,
  "created_at": "2026-01-01T00:00:00.000Z",
  "updated_at": "2026-01-01T00:00:00.000Z"
}
```

#### `PUT /api/rewards/{id}`

景品情報を更新する。更新後、確率が自動再計算される。

**リクエストボディ**:
```json
{
  "name": "1等 旅行券（変更後）",
  "description": "海外旅行券20万円分",
  "value": 200000,
  "count": 2,
  "is_lose": false
}
```

**レスポンス**: `200 OK` — 更新後の Reward オブジェクト

#### `DELETE /api/rewards/{id}`

景品を削除する。削除後、確率が自動再計算される。

**レスポンス**: `200 OK`
```json
{
  "success": true
}
```

---

### 6.3 抽選（クレーム）API

#### `POST /api/claim`

抽選結果を確定し、景品を獲得する。Prisma トランザクションにより在庫チェックと減算をアトミックに実行する。

**リクエストボディ**:
```json
{
  "reward_id": "uuid"
}
```

**レスポンス（当選時）**: `200 OK`
```json
{
  "reward": {
    "id": "uuid",
    "name": "1等 旅行券",
    "is_lose": false,
    "count": 0
  },
  "win_log": {
    "id": "uuid",
    "token": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**レスポンス（ハズレ時）**: `200 OK`
```json
{
  "reward": {
    "id": "uuid",
    "name": "残念賞",
    "is_lose": true,
    "count": 99
  }
}
```

**エラーレスポンス（在庫切れ）**: `400 Bad Request`
```json
{
  "error": "在庫がありません"
}
```

**処理フロー**:
1. `reward_id` で景品を取得
2. 在庫数 (`count`) を確認（0 の場合エラー）
3. トランザクション内で `count` を 1 減算
4. `is_lose` が `false` の場合のみ `WinLog` を作成（UUID トークン発行）
5. 確率を自動再計算

---

### 6.4 管理 API

#### `POST /api/admin/verify`

トークンの有効性を検証する。

**リクエストボディ**:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**レスポンス（有効）**: `200 OK`
```json
{
  "valid": true,
  "win_log": {
    "id": "uuid",
    "reward_name": "1等 旅行券",
    "won_at": "2026-01-15T10:30:00.000Z",
    "is_redeemed": false,
    "redeemed_at": null
  }
}
```

**レスポンス（無効）**: `404 Not Found`
```json
{
  "valid": false
}
```

#### `POST /api/admin/redeem`

トークンを引換済にする。

**リクエストボディ**:
```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**レスポンス**: `200 OK`
```json
{
  "success": true,
  "redeemed_at": "2026-01-15T14:00:00.000Z"
}
```

#### `GET /api/admin/win-logs?event_id={event_id}`

イベントの当選履歴を取得する。

**クエリパラメータ**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| event_id | string | Yes | イベント ID |

**レスポンス**: `200 OK`
```json
[
  {
    "id": "uuid",
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "is_redeemed": true,
    "redeemed_at": "2026-01-15T14:00:00.000Z",
    "won_at": "2026-01-15T10:30:00.000Z",
    "reward": {
      "name": "1等 旅行券",
      "value": 100000
    }
  }
]
```

---

## 7. ビジネスロジック

### 7.1 当選確率の自動計算

景品の追加・更新・削除時に、同イベント内の全景品の確率を再計算する。

**計算式**:
```
probability = (reward.count / Σ all_rewards.count) × 100
```

- 小数第2位まで四捨五入
- 全景品の在庫合計が 0 の場合、全確率を 0 に設定

**例**:
| 景品 | 在庫数 | 確率 |
|------|--------|------|
| 1等 旅行券 | 1 | 2.50% |
| 2等 商品券 | 3 | 7.50% |
| 3等 お菓子 | 6 | 15.00% |
| ハズレ | 30 | 75.00% |
| **合計** | **40** | **100.00%** |

### 7.2 抽選トランザクション

クレーム処理は Prisma の `$transaction` を使用し、以下をアトミックに実行:

1. 景品の在庫確認
2. 在庫数を 1 減算
3. 当選記録（WinLog）の作成（ハズレ以外）
4. 確率の再計算

これにより、同時リクエストによる在庫の二重消費を防止する。

### 7.3 トークンライフサイクル

```
当選 → トークン発行（UUID）→ QR コード表示 → 管理者が検証 → 引換済に更新
```

---

## 8. 多言語対応（i18n）

### 対応言語

- 日本語（JA）
- 英語（EN）

### 実装方式

- React Context API による言語切替
- `localStorage` に選択言語を永続化
- 初回アクセス時はブラウザの言語設定を自動検出
- 全 UI テキストを翻訳定義ファイルで管理

---

## 9. セットアップ手順

### 前提条件

- Node.js（v18 以上推奨）
- npm

### インストール

```bash
# 依存パッケージのインストール
npm install

# データベースの作成・マイグレーション
npx prisma db push

# サンプルデータの投入
npx prisma db seed

# 開発サーバー起動（http://localhost:3000）
npm run dev
```

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| DATABASE_URL | SQLite データベースパス | `file:./dev.db` |

---

## 10. テスト

### ユニットテスト / 統合テスト

```bash
npm test              # 全テスト実行
npm run test:watch    # ウォッチモードで実行
```

**テスト対象**:
- `src/lib/rewards.ts` — 確率再計算ロジック（ユニットテスト）
- `src/app/api/claim/route.ts` — クレーム API（統合テスト）

### E2E テスト

```bash
npm run test:e2e      # Playwright E2E テスト実行
```

**テストシナリオ**: 管理者によるイベント・景品作成 → ユーザーのルーレット参加 → 当選 → トークン検証・引換

### Docker でのテスト実行

```bash
docker compose -f docker-compose.test.yml up --build
```

---

## 11. 利用フロー

### 管理者フロー

1. `/admin` にアクセス
2. 新規イベントを作成（タイトル、スラグ、説明）
3. `/admin/events/[id]` で景品を追加（名前、在庫数、価値、ハズレフラグ）
4. 確率が自動計算される
5. イベント開催中は当選履歴を確認
6. 当選者のトークン（QR コード）をスキャンまたは手入力で検証
7. 検証成功後、「引換」ボタンで引換済に更新

### ユーザーフロー

1. `/` にアクセスしてイベント一覧を閲覧
2. 参加したいイベントを選択
3. `/events/[slug]` でルーレットホイールを確認
4. 「SPIN」ボタンをクリックして回転開始
5. 「STOP」ボタンをクリックして停止
6. 結果表示:
   - **当選**: 紙吹雪 + 景品情報 + QR コード（トークン）を受取
   - **ハズレ**: ハズレ表示
7. 当選時は QR コードを管理者に提示して景品を受取
