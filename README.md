# Zenn Emoji Picker 
<div align="center">
   <img width="100" height="100" alt="icon128" src="https://github.com/user-attachments/assets/71584a9f-852b-4737-a7d0-6e8e97e505dd" />
</div>
  
Zenn記事のエディターページで、記事の内容を分析して最適な絵文字を自動提案するChrome拡張機能です。  
  
<div style="margin-top: 24px;">
   <img width="1511" height="856" alt="スクリーンショット 2025-07-27 22 08 27" src="https://github.com/user-attachments/assets/479a3e45-5d75-43d5-bb83-413820d61829" />
</div>

## ✨ 機能

- **AI分析による絵文字提案**: 記事の内容を分析し、メイン絵文字1つ+サブ絵文字2つを提案
- **複数AI対応**: Gemini、Claude、OpenAI APIに対応
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

1. **Gemini API**
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

### レスポンス形式
```json
{
  "main": { "emoji": "🎩", "reason": "記事のメインテーマを表現" },
  "sub": [
    { "emoji": "🍀", "reason": "サブ提案1の理由" },
    { "emoji": "✨", "reason": "サブ提案2の理由" }
  ]
}
```
