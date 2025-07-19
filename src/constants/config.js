// 設定定数
export const CONFIG = {
  // API設定
  API: {
    MAX_RETRIES: 3,
    TIMEOUT: 10000, // 10秒
    RATE_LIMIT: {
      MAX_REQUESTS: 5,
      TIME_WINDOW: 60000 // 1分
    }
  },
  
  // テキスト処理設定
  TEXT_PROCESSING: {
    MAX_LENGTH: 2000,
    HEADING_PRIORITY: 3, // 見出しの重み
    SUMMARY_LENGTH: {
      START: 800,
      END: 400
    }
  },
  
  // キャッシュ設定
  CACHE: {
    EXPIRY_TIME: 24 * 60 * 60 * 1000, // 24時間
    MAX_ENTRIES: 100
  },
  
  // UI設定
  UI: {
    ANIMATION_DURATION: 300,
    MAX_HISTORY_ITEMS: 20,
    MAX_FAVORITES: 30
  },
  
  // プロンプト設定
  PROMPT_TEMPLATE: `あなたはZenn記事に最適な絵文字を提案するAIです。以下の記事内容を分析し、記事の雰囲気や内容に最も適した絵文字を提案してください。

記事内容:
{{TEXT_CONTENT}}

要件:
- メイン絵文字1つ：記事全体のテーマを表現
- サブ絵文字2つ：異なる視点からの提案
- 各絵文字に簡潔な理由を添付
- 必ずJSON形式のみで出力
- 説明文や余計なテキストは不要

出力は以下のJSON形式で出力してください：
{
  "main": { "emoji": "🌸", "reason": "記事のメインテーマを表現する理由" },
  "sub": [
    { "emoji": "🦋", "reason": "サブ提案の理由1" },
    { "emoji": "✨", "reason": "サブ提案の理由2" }
  ]
}`,
  
  // Zennページ設定
  ZENN: {
    SELECTORS: {
      EDITOR: '.editor-wrapper .CodeMirror',
      TITLE: 'input[placeholder="記事のタイトル"]',
      CONTENT: '.CodeMirror-code',
      HEADINGS: 'h1, h2, h3'
    }
  }
};