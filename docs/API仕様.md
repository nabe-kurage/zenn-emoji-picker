# 🔌 API仕様ドキュメント

## 概要

Zenn Emoji PickerはGemini、Claude、OpenAI の3つのAI APIに対応しています。各APIの詳細仕様、認証方法、レスポンス形式について説明します。

## 対応AI API一覧

| API | モデル | 特徴 | 無料枠 | 推奨度 |
|-----|--------|------|--------|--------|
| **Gemini** | gemini-1.5-flash | 高速・高品質・無料枠あり | ✅ | ⭐⭐⭐ |
| Claude | claude-3-haiku-20240307 | 高品質な文章理解 | ❌ | ⭐⭐ |
| OpenAI | gpt-3.5-turbo | 汎用性が高い | ❌ | ⭐ |

## 1. Gemini API

### 基本情報
- **提供**: Google
- **エンドポイント**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **認証**: API Key (URL parameter)
- **ドキュメント**: [Google AI Studio](https://aistudio.google.com/)

### APIキー取得方法
1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. "Create API Key" をクリック
4. プロジェクトを選択または新規作成
5. API キーをコピー

### 料金体系
```
無料枠:
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per month

有料枠:
- Flash 1.5: $0.075 / 1M input tokens
- Pro 1.5: $1.25 / 1M input tokens
```

### リクエスト仕様
```javascript
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}

Headers:
{
  "Content-Type": "application/json"
}

Body:
{
  "contents": [
    {
      "parts": [
        {
          "text": "プロンプトテキスト"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 500,
    "responseMimeType": "application/json"
  }
}
```

### レスポンス形式
```javascript
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"main\":{\"emoji\":\"🌸\",\"reason\":\"理由\"},\"sub\":[...]}"
          }
        ]
      },
      "finishReason": "STOP",
      "index": 0
    }
  ]
}
```

### エラーレスポンス
```javascript
// 401 Unauthorized
{
  "error": {
    "code": 401,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "UNAUTHENTICATED"
  }
}

// 429 Rate Limit
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. check quota).",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

## 2. Claude API

### 基本情報
- **提供**: Anthropic
- **エンドポイント**: `https://api.anthropic.com/v1/messages`
- **認証**: API Key (Header)
- **ドキュメント**: [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)

### APIキー取得方法
1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. アカウント作成・ログイン
3. "API Keys" セクションに移動
4. "Create Key" をクリック
5. API キーをコピー

### 料金体系
```
Claude 3 Haiku:
- Input: $0.25 / 1M tokens
- Output: $1.25 / 1M tokens

Claude 3 Sonnet:
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens

Claude 3 Opus:
- Input: $15 / 1M tokens
- Output: $75 / 1M tokens
```

### リクエスト仕様
```javascript
POST https://api.anthropic.com/v1/messages

Headers:
{
  "Content-Type": "application/json",
  "x-api-key": "API_KEY",
  "anthropic-version": "2023-06-01"
}

Body:
{
  "model": "claude-3-haiku-20240307",
  "max_tokens": 500,
  "messages": [
    {
      "role": "user",
      "content": "プロンプトテキスト"
    }
  ]
}
```

### レスポンス形式
```javascript
{
  "id": "msg_123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "{\"main\":{\"emoji\":\"🌸\",\"reason\":\"理由\"},\"sub\":[...]}"
    }
  ],
  "model": "claude-3-haiku-20240307",
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 100,
    "output_tokens": 50
  }
}
```

### エラーレスポンス
```javascript
// 401 Unauthorized
{
  "type": "error",
  "error": {
    "type": "authentication_error",
    "message": "Invalid API key"
  }
}

// 429 Rate Limit
{
  "type": "error",
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}
```

## 3. OpenAI API

### 基本情報
- **提供**: OpenAI
- **エンドポイント**: `https://api.openai.com/v1/chat/completions`
- **認証**: Bearer Token
- **ドキュメント**: [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

### APIキー取得方法
1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウント作成・ログイン
3. "API keys" セクションに移動
4. "Create new secret key" をクリック
5. API キーをコピー

### 料金体系
```
GPT-3.5 Turbo:
- Input: $0.50 / 1M tokens
- Output: $1.50 / 1M tokens

GPT-4:
- Input: $10.00 / 1M tokens
- Output: $30.00 / 1M tokens

GPT-4 Turbo:
- Input: $5.00 / 1M tokens
- Output: $15.00 / 1M tokens
```

### リクエスト仕様
```javascript
POST https://api.openai.com/v1/chat/completions

Headers:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer API_KEY"
}

Body:
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "JSON形式のみで回答してください。"
    },
    {
      "role": "user",
      "content": "プロンプトテキスト"
    }
  ],
  "max_tokens": 500,
  "temperature": 0.7
}
```

### レスポンス形式
```javascript
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"main\":{\"emoji\":\"🌸\",\"reason\":\"理由\"},\"sub\":[...]}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### エラーレスポンス
```javascript
// 401 Unauthorized
{
  "error": {
    "message": "Incorrect API key provided",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}

// 429 Rate Limit
{
  "error": {
    "message": "Rate limit reached",
    "type": "rate_limit_error",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

## 共通プロンプト仕様

### プロンプト構造
```
以下のZenn記事の内容を分析し、最適な絵文字を提案してください。

記事内容:
{記事テキスト}

以下のJSON形式で出力してください:
{
  "main": { "emoji": "🌸", "reason": "記事のメインテーマを表現" },
  "sub": [
    { "emoji": "🦋", "reason": "サブ提案1の理由" },
    { "emoji": "✨", "reason": "サブ提案2の理由" }
  ]
}
```

### 期待するレスポンス形式
```javascript
{
  "main": {
    "emoji": "🌸",           // メイン絵文字（1文字）
    "reason": "記事のメインテーマを表現"  // 提案理由（50文字以内）
  },
  "sub": [
    {
      "emoji": "🦋",         // サブ絵文字1（1文字）
      "reason": "サブ提案1の理由"  // 提案理由（50文字以内）
    },
    {
      "emoji": "✨",         // サブ絵文字2（1文字）
      "reason": "サブ提案2の理由"  // 提案理由（50文字以内）
    }
  ]
}
```

## エラーハンドリング

### 共通エラーパターン

#### 1. 認証エラー
```javascript
// 検出方法
response.status === 401

// 対処法
- APIキーの確認を促す
- 設定画面へのリンクを表示
```

#### 2. レート制限エラー
```javascript
// 検出方法
response.status === 429

// 対処法
- 一時的な制限の説明
- 再試行の案内
```

#### 3. ネットワークエラー
```javascript
// 検出方法
fetch() がrejectされる

// 対処法
- 接続確認の案内
- 再試行ボタンの表示
```

#### 4. JSON解析エラー
```javascript
// 検出方法
JSON.parse() で例外

// 対処法
1. パターンマッチングで JSON 抽出を試行
2. フォールバック絵文字を返す
```

### フォールバック機能

#### デフォルト絵文字レスポンス
```javascript
{
  main: { emoji: '📝', reason: 'JSON解析に失敗しました' },
  sub: [
    { emoji: '💡', reason: 'デフォルト提案1' },
    { emoji: '✨', reason: 'デフォルト提案2' }
  ]
}
```

## API選択の推奨基準

### 用途別推奨

#### 1. 個人利用・テスト用途
**推奨**: Gemini API
- 無料枠が充実
- 高品質な絵文字提案
- 高速レスポンス

#### 2. ビジネス用途
**推奨**: Claude API
- 安定した品質
- 文章理解能力が高い
- 予測可能な料金

#### 3. 開発・実験用途
**推奨**: OpenAI API
- 豊富なドキュメント
- 大きなコミュニティ
- 多様なモデル選択肢

### 技術的考慮点

#### レスポンス速度
1. **Gemini**: 1-3秒（最速）
2. **OpenAI**: 2-5秒
3. **Claude**: 3-8秒

#### JSON対応
1. **Gemini**: ネイティブJSONサポート（最良）
2. **OpenAI**: システムプロンプトで制御可能
3. **Claude**: プロンプトエンジニアリングが必要

#### エラー処理
1. **OpenAI**: 詳細なエラーコード（最良）
2. **Claude**: 明確なエラータイプ
3. **Gemini**: 基本的なエラー情報

この仕様に基づいて、各APIとの統合が実装されています。