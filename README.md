# 🎨 Zenn Emoji Picker

Zenn記事の内容を分析して最適な絵文字を自動提案するChrome拡張機能です。

## ✨ 機能

- **AI分析による絵文字提案**: 記事の内容を分析し、メイン絵文字1つ+サブ絵文字2つを提案
- **複数AI対応**: Gemini（無料枠あり）、Claude、OpenAI APIに対応
- **お気に入り機能**: よく使う絵文字を保存・管理
- **履歴機能**: 過去の提案を確認・再利用
- **プレビュー機能**: 記事タイトルでの見た目を確認
- **キャッシュ機能**: 同じ内容での重複API呼び出しを防止
- **セキュア**: APIキーは暗号化して安全に保存

## 🚀 インストール

### 開発版として使用

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/zenn-emoji-picker.git
cd zenn-emoji-picker

# Chrome拡張機能として読み込み
# 1. Chrome で chrome://extensions/ を開く
# 2. 右上の「デベロッパーモード」を有効にする
# 3. 「パッケージ化されていない拡張機能を読み込む」をクリック
# 4. このフォルダを選択
```

## ⚙️ 設定

### APIキーの取得・設定

1. **Gemini API（推奨・無料枠あり）**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを作成
   - 月15リクエスト/分、100万トークン/月の無料枠があります

2. **Claude API**
   - [Anthropic Console](https://console.anthropic.com/) でAPIキーを作成
   - 有料プランが必要

3. **OpenAI API**
   - [OpenAI Platform](https://platform.openai.com/api-keys) でAPIキーを作成
   - 有料プランが必要

### 設定手順

1. 拡張機能アイコンをクリック
2. 「⚙️ 設定」ボタンをクリック
3. 使用するAI APIを選択
4. 対応するAPIキーを入力
5. 「🔍 接続テスト」で動作確認
6. 「💾 保存」で設定完了

## 📖 使い方

### 基本的な使い方

1. Zennの記事編集ページを開く
2. 拡張機能アイコンをクリック
3. 「✨ 分析開始」ボタンをクリック
4. 提案された絵文字をクリックしてコピー

### 高度な機能

- **お気に入り**: ⭐ボタンで絵文字をお気に入りに追加
- **履歴**: 過去の提案を「履歴」タブで確認
- **プレビュー**: 「👀 プレビュー」で記事タイトルでの見た目を確認
- **再提案**: 「🔄 もう一度提案」で新しい候補を取得

## 🏗️ 技術仕様

### サポートするAI API

| API | モデル | 特徴 | 無料枠 |
|-----|--------|------|--------|
| **Gemini** | 1.5 Flash, 1.5 Pro | 高速、高性能 | ✅ あり |
| Claude | 3 Haiku, Sonnet, Opus | 高品質な文章理解 | ❌ なし |
| OpenAI | GPT-3.5, GPT-4 | 汎用性が高い | ❌ なし |

### アーキテクチャ

```
Chrome拡張機能
├── Content Script    # Zenn編集ページでのテキスト抽出
├── Background Service # 直接API呼び出し、キャッシュ、データ管理
├── Popup UI          # メインインターフェース
└── Options Page      # 設定画面
```

### セキュリティ

- **APIキー暗号化**: Web Crypto APIを使用して暗号化
- **レート制限**: 1分間に最大5回のAPI呼び出し制限
- **データ保護**: APIキーは拡張機能内でのみ保存

## 🛠️ 開発

### プロジェクト構造

```
zenn-emoji-picker/
├── manifest.json              # 拡張機能の設定
├── src/
│   ├── content/              # Content Script
│   ├── background/           # Background Service Worker
│   ├── popup/               # ポップアップUI
│   ├── options/             # 設定画面
│   ├── utils/               # ユーティリティ
│   └── constants/           # 定数定義
├── styles/                  # 共通スタイル
├── icons/                   # アイコン（要追加）
└── README.md
```

### 必要なアイコンファイル

`icons/` フォルダに以下のサイズのPNGファイルを配置してください：

- `icon16.png` (16x16px)
- `icon32.png` (32x32px)
- `icon48.png` (48x48px)
- `icon128.png` (128x128px)

### 設定ファイル

主要な設定は `src/constants/config.js` で管理されています：

- API設定（タイムアウト、リトライ回数）
- テキスト処理設定（最大長、要約設定）
- キャッシュ設定（有効期限、最大エントリ数）
- UI設定（アニメーション、履歴数）

## 💰 料金について

### Gemini API（推奨）
- **無料枠**: 月15リクエスト/分、100万トークン/月
- **有料**: $0.00015/1000トークン（Flash）
- 個人利用なら無料枠で十分な場合が多いです

### Claude API
- **Haiku**: $0.25/百万トークン（入力）
- **Sonnet**: $3/百万トークン（入力）

### OpenAI API
- **GPT-3.5**: $0.5/百万トークン（入力）
- **GPT-4**: $10/百万トークン（入力）

## 🤝 貢献

バグ報告や機能提案は [Issues](https://github.com/your-repo/zenn-emoji-picker/issues) でお知らせください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🙏 謝辞

- [Zenn](https://zenn.dev/) - 素晴らしい技術記事プラットフォーム
- [Google AI](https://ai.google/) - Gemini API
- [Anthropic](https://www.anthropic.com/) - Claude API
- [OpenAI](https://openai.com/) - OpenAI API

---

**おすすめ設定**: 初めて使用する場合は、無料枠のあるGemini APIから始めることをおすすめします！