# 🎨 Zenn Emoji Picker (シンプル版)

Zenn記事の内容を分析して最適な絵文字を自動提案するChrome拡張機能です。

## ✨ 機能

- **AI分析による絵文字提案**: 記事の内容を分析し、メイン絵文字1つ+サブ絵文字2つを提案
- **複数AI対応**: Gemini（無料枠あり）、Claude、OpenAI APIに対応
- **テキスト長制限**: 2000文字を超える場合は前半800文字+後半400文字を自動抽出
- **シンプルな設定**: APIキー登録のみ

## 🚀 インストール

```bash
# Chrome拡張機能として読み込み
# 1. Chrome で chrome://extensions/ を開く
# 2. 右上の「デベロッパーモード」を有効にする
# 3. 「パッケージ化されていない拡張機能を読み込む」をクリック
# 4. このフォルダを選択
```

## ⚙️ 設定

### APIキーの取得

1. **Gemini API（推奨・無料枠あり）**
   - [Google AI Studio](https://aistudio.google.com/app/apikey) でAPIキーを作成

2. **Claude API**
   - [Anthropic Console](https://console.anthropic.com/) でAPIキーを作成

3. **OpenAI API**
   - [OpenAI Platform](https://platform.openai.com/api-keys) でAPIキーを作成

### 設定手順

1. 拡張機能アイコンを右クリック → 「オプション」
2. 使用するAI APIを選択
3. APIキーを入力
4. 「接続テスト」で動作確認
5. 「保存」

## 📖 使い方

1. Zennの記事編集ページを開く
2. 拡張機能アイコンをクリック
3. 「✨ 絵文字を提案」ボタンをクリック
4. 提案された絵文字の「コピー」ボタンをクリック

## 🗂️ ファイル構成

```
zenn-emoji-picker/
├── manifest.json       # 拡張機能設定
├── popup.html          # ポップアップUI
├── popup.js            # ポップアップ制御
├── options.html        # 設定画面
├── options.js          # 設定画面制御
├── content.js          # Zennページでのテキスト抽出
├── background.js       # API呼び出し処理
└── README.md
```

## 🔧 技術仕様

### テキスト処理
- **最大長**: 2000文字
- **長い場合**: 前半800文字 + 後半400文字を抽出
- **最小長**: 10文字以上

### API仕様
- **Gemini**: gemini-1.5-flash モデル
- **Claude**: claude-3-haiku-20240307 モデル  
- **OpenAI**: gpt-3.5-turbo モデル

### レスポンス形式
```json
{
  "main": { "emoji": "🌸", "reason": "記事のメインテーマを表現" },
  "sub": [
    { "emoji": "🦋", "reason": "サブ提案1の理由" },
    { "emoji": "✨", "reason": "サブ提案2の理由" }
  ]
}
```

## 💰 料金

### Gemini API（推奨）
- **無料枠**: 月15リクエスト/分、100万トークン/月
- 個人利用なら無料枠で十分

### Claude API / OpenAI API
- 有料プランが必要

---

**推奨**: 初めて使用する場合は無料枠のあるGemini APIをお試しください！