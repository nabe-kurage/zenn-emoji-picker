# Zenn Emoji Picker - プロジェクト構造

```
zenn-emoji-picker/
├── manifest.json                   # Manifest V3設定
├── icons/                         # 拡張機能アイコン
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── content/
│   │   ├── content.js            # Zenn編集ページでのテキスト抽出
│   │   └── content.css           # 必要に応じてスタイル調整
│   ├── background/
│   │   ├── background.js         # Service Worker（API呼び出し、キャッシュ管理）
│   │   └── api.js               # AI API呼び出し処理
│   ├── popup/
│   │   ├── popup.html           # ポップアップUI
│   │   ├── popup.js             # UI制御、絵文字表示・コピー
│   │   └── popup.css            # ポップアップスタイル
│   ├── options/
│   │   ├── options.html         # 設定画面（APIキー管理）
│   │   ├── options.js           # 設定画面制御
│   │   └── options.css          # 設定画面スタイル
│   ├── utils/
│   │   ├── storage.js           # Chrome Storage API操作
│   │   ├── encryption.js        # APIキー暗号化
│   │   ├── textProcessor.js     # テキスト抽出・処理
│   │   └── cache.js             # キャッシュ管理
│   └── constants/
│       └── config.js            # 設定定数
├── styles/
│   └── common.css               # 共通スタイル
└── README.md                    # 開発ドキュメント
```

## 主要機能とファイル構成

### 1. Content Script (content/content.js)
- Zenn編集ページの本文領域を特定
- 見出し（h1-h3）を重視したテキスト抽出
- バックグラウンドスクリプトへのメッセージ送信

### 2. Background Service Worker (background/background.js)
- API呼び出し管理
- レート制限（1分間に最大5回）
- キャッシュ機能（同じ本文の重複呼び出し防止）
- APIキー暗号化管理

### 3. Popup UI (popup/)
- 絵文字提案表示
- プレビュー機能（記事タイトル部分での表示確認）
- お気に入り機能
- 履歴機能
- コピー機能

### 4. Options Page (options/)
- APIキー設定
- プロキシサーバーURL設定
- 機能の有効/無効切り替え

### 5. Utilities (utils/)
- セキュアなデータ保存
- テキスト処理アルゴリズム
- キャッシュ管理