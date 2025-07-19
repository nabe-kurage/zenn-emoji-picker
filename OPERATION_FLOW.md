# 🎨 Zenn Emoji Picker - 操作フロー図

## 📋 目次
1. [設定画面での操作](#設定画面での操作)
2. [ポップアップでの操作](#ポップアップでの操作)
3. [背景処理](#背景処理)
4. [ファイル間の関係図](#ファイル間の関係図)

---

## ⚙️ 設定画面での操作

### 🔍 「接続テスト」ボタンを押した際

```
[設定画面] options.html
     ↓ click event
[設定画面JS] src/options/options.js:306
     ↓ testApiConnection()
[一時保存] Storage.saveApiKey() + Storage.saveSetting()
     ↓
[API呼び出し] src/background/api.js:232
     ↓ EmojiAPI.testAPIConnection(apiType)
[API選択] switch (apiType)
     ├─ Claude: api.js:210 → callClaude()
     ├─ OpenAI: api.js:213 → callOpenAI()
     └─ Gemini: api.js:216 → callGemini()
     ↓
[結果表示] options.js:309 → showToast()
```

**関連ファイル:**
- `src/options/options.html:66` - ボタン定義
- `src/options/options.js:73` - イベントリスナー
- `src/options/options.js:284` - testApiConnection()メソッド
- `src/background/api.js:204` - testAPIConnection()メソッド

### 💾 「保存」ボタンを押した際

```
[設定画面] options.html
     ↓ click event
[設定画面JS] src/options/options.js:77
     ↓ saveApiSettings()
[暗号化保存] src/utils/storage.js:11
     ↓ Storage.saveApiKey()
[暗号化処理] src/utils/encryption.js:7
     ↓ Encryption.encrypt()
[設定保存] src/utils/storage.js:130
     ↓ Storage.saveSetting()
[Chrome保存] chrome.storage.local.set()
     ↓
[完了通知] options.js:351 → showToast()
```

**関連ファイル:**
- `src/options/options.html:69` - ボタン定義
- `src/options/options.js:77` - イベントリスナー
- `src/options/options.js:330` - saveApiSettings()メソッド
- `src/utils/storage.js:11` - saveApiKey()メソッド
- `src/utils/encryption.js:7` - encrypt()メソッド

---

## 🎯 ポップアップでの操作

### ✨ 「分析開始」ボタンを押した際

```
[ポップアップ] src/popup/popup.html
     ↓ click event
[ポップアップJS] src/popup/popup.js:24
     ↓ analyzeArticle()
[SW確認] popup.js:230 → checkServiceWorker()
     ↓ chrome.runtime.sendMessage({action: 'ping'})
[Background] src/background/background.js:61
     ↓ handleMessage() → case 'ping'
[SW応答] background.js:63 → sendResponse({success: true})
     ↓
[テキスト抽出] popup.js:242 → chrome.tabs.sendMessage()
     ↓ {action: 'extractText'}
[Content Script] src/content/content.js:53
     ↓ handleMessage() → case 'extractText'
[エディター検索] content.js:103 → findEditor()
[テキスト処理] src/utils/textProcessor.js:23
     ↓ TextProcessor.extractOptimizedText()
[Content応答] content.js:68 → sendResponse({success: true, text})
     ↓
[AI API呼び出し] popup.js:258 → generateSuggestions()
     ↓ chrome.runtime.sendMessage({action: 'generateEmojiSuggestions'})
[Background] background.js:66
     ↓ generateEmojiSuggestions()
[API実行] background.js:132 → callEmojiAPI()
[API選択] background.js:205 → callAPIByType()
     ├─ Claude: background.js:222 → callClaudeAPI()
     ├─ OpenAI: background.js:268 → callOpenAIAPI()
     └─ Gemini: background.js:345 → callGeminiAPI()
     ↓
[レスポンス検証] background.js:450 → validateAPIResponse()
[結果応答] background.js:65 → sendResponse({success: true, suggestions})
     ↓
[結果表示] popup.js:261 → displaySuggestions()
```

**関連ファイル:**
- `src/popup/popup.html:92` - ボタン定義
- `src/popup/popup.js:24` - イベントリスナー
- `src/popup/popup.js:222` - analyzeArticle()メソッド
- `src/content/content.js:53` - メッセージハンドラー
- `src/background/background.js:55` - メッセージハンドラー

### ⭐ 「お気に入り追加」ボタンを押した際

```
[ポップアップ] src/popup/popup.html (動的生成)
     ↓ click event
[ポップアップJS] popup.js:398 → toggleFavorite()
     ↓ chrome.runtime.sendMessage({action: 'saveToFavorites'})
[Background] src/background/background.js:68
     ↓ Storage.saveFavoriteEmoji()
[ストレージ] src/utils/storage.js:50
     ↓ chrome.storage.local.get() & set()
[完了通知] popup.js:401 → showToast()
```

### 📋 「コピー」ボタンを押した際

```
[ポップアップ] src/popup/popup.html (動的生成)
     ↓ click event
[ポップアップJS] popup.js:384 → copyEmoji()
     ↓ navigator.clipboard.writeText()
[完了通知] popup.js:387 → showToast()
```

**関連ファイル:**
- `src/popup/popup.js:320` - createSubEmojiElement() (ボタン生成)
- `src/popup/popup.js:384` - copyEmoji()メソッド
- `src/popup/popup.js:398` - toggleFavorite()メソッド

---

## 🔄 背景処理

### 📡 メッセージ通信の流れ

```
[フロントエンド] popup.js / options.js
     ↓ chrome.runtime.sendMessage()
[Service Worker] src/background/background.js:21
     ↓ chrome.runtime.onMessage.addListener()
[メッセージ処理] background.js:55 → handleMessage()
     ↓ switch(request.action)
[各種処理] 
     ├─ ping → 63行目
     ├─ generateEmojiSuggestions → 66行目
     ├─ saveToFavorites → 73行目
     ├─ getFavorites → 78行目
     ├─ getHistory → 83行目
     └─ その他...
     ↓ sendResponse()
[フロントエンド] レスポンス受信
```

### 🗄️ ストレージ操作の流れ

```
[操作要求] 
     ↓
[Storage Utility] src/utils/storage.js
     ├─ saveApiKey() → 暗号化保存
     ├─ getApiKey() → 復号化取得
     ├─ saveFavoriteEmoji() → お気に入り保存
     ├─ getFavorites() → お気に入り取得
     └─ saveHistory() → 履歴保存
     ↓
[Chrome Storage] chrome.storage.local
```

---

## 📊 ファイル間の関係図

```
┌─────────────────┐    ┌─────────────────┐
│   Popup UI      │    │   Options UI    │
│ popup.html/js   │    │ options.html/js │
└─────┬───────────┘    └─────┬───────────┘
      │                      │
      │ chrome.runtime       │ chrome.runtime
      │ .sendMessage()       │ .sendMessage()
      │                      │
      └──────┬───────────────┘
             │
    ┌─────────▼─────────┐
    │  Background SW    │
    │   background.js   │
    └─────────┬─────────┘
             │
   ┌─────────┼─────────┐
   │         │         │
   ▼         ▼         ▼
┌─────┐  ┌─────┐  ┌─────┐
│Utils│  │ API │  │Cache│
│     │  │     │  │     │
└─────┘  └─────┘  └─────┘
   │
   ▼
┌─────────────┐
│   Storage   │
│   + Crypto  │
└─────────────┘

[Content Script]
┌─────────────────┐
│   content.js    │ ← chrome.tabs.sendMessage()
│ (Zennページ内)   │
└─────────────────┘
```

### 🗂️ ファイル別責任範囲

| ファイル | 主な責任 | 主要メソッド |
|---------|---------|-------------|
| `popup.js` | UI制御、ユーザー操作 | `analyzeArticle()`, `generateSuggestions()` |
| `options.js` | 設定管理、テスト機能 | `testApiConnection()`, `saveApiSettings()` |
| `background.js` | メッセージ処理、API統合 | `handleMessage()`, `generateEmojiSuggestions()` |
| `content.js` | ページ内容抽出 | `extractArticleText()`, `findEditor()` |
| `api.js` | 外部API呼び出し | `callClaude()`, `callOpenAI()`, `callGemini()` |
| `storage.js` | データ保存・取得 | `saveApiKey()`, `getFavorites()` |
| `encryption.js` | 暗号化・復号化 | `encrypt()`, `decrypt()` |

---

## 🐛 デバッグ時の確認ポイント

### コンソールの確認場所

1. **ポップアップのエラー**: ポップアップを開いてF12
2. **設定画面のエラー**: 設定画面でF12
3. **Background Scriptのエラー**: 拡張機能ページの「Service Worker」リンク
4. **Content Scriptのエラー**: Zennページで通常のF12

### よくあるエラーと確認場所

| エラー | 確認場所 | 関連ファイル |
|--------|---------|-------------|
| 接続テスト失敗 | options.js:306 | api.js:204 |
| メッセージ通信エラー | background.js:21 | popup.js:274 |
| テキスト抽出失敗 | content.js:53 | content.js:103 |
| API呼び出し失敗 | background.js:132 | api.js:各call関数 |

---

この資料を参考に、特定の操作で問題が発生した際は該当する行番号とファイルを確認してデバッグしてください。