// Background Service Worker
import { makeWildcardPoolOneThird } from "./pool.js";

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "testAPI") {
    testAPI(request.apiType, request.apiKey)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "generateEmojis") {
    generateEmojis(request.text)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "hasApiKey") {
    getApiSettings()
      .then(({ apiKey, storageSource }) => {
        sendResponse({
          success: true,
          hasApiKey: Boolean(apiKey),
          storage: storageSource || "none",
        });
      })
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// API接続テスト
async function testAPI(apiType, apiKey) {
  const testText = "これはテスト記事です。技術について書いています。";

  try {
    // 引数にapiKeyがなければ保存値を利用
    let resolvedApiType = apiType;
    let resolvedApiKey = apiKey;
    if (!resolvedApiKey || !resolvedApiType) {
      const settings = await getApiSettings();
      resolvedApiType = resolvedApiType || settings.apiType;
      resolvedApiKey = resolvedApiKey || settings.apiKey;
    }

    if (!resolvedApiKey) throw new Error("APIキーが設定されていません");
    if (!resolvedApiType) throw new Error("APIタイプが設定されていません");

    await callAPI(resolvedApiType, resolvedApiKey, testText);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 絵文字生成
async function generateEmojis(text) {
  try {
    const { apiType, apiKey } = await getApiSettings();
    if (!apiKey) throw new Error("APIキーが設定されていません");
    if (!apiType) throw new Error("APIタイプが設定されていません");

    const suggestions = await callAPI(apiType, apiKey, text);
    return { success: true, suggestions };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 保存済み設定の取得（session優先、なければlocal）
async function getApiSettings() {
  const session = await chrome.storage.session.get(["apiType", "apiKey"]);
  if (session.apiKey) {
    return {
      apiType: session.apiType,
      apiKey: session.apiKey,
      storageSource: "session",
    };
  }
  const local = await chrome.storage.local.get(["apiType", "apiKey"]);
  return {
    apiType: local.apiType,
    apiKey: local.apiKey,
    storageSource: local.apiKey ? "local" : undefined,
  };
}

// API呼び出し
async function callAPI(apiType, apiKey, text) {
  const pool = makeWildcardPoolOneThird();
  // Debug: 生成されたプールをログ出力（拡張機能のサービスワーカーログで確認可能）
  // try {
  //   console.log("[Zenn Emoji Picker] WILDCARD_POOL", {
  //     size: pool.emojis.length,
  //     emojis: pool.emojis,
  //     categories: Object.keys(pool.categories),
  //   });
  //   console.table(pool.emoji2cat);
  // } catch (_) {}

  const prompt = `
		あなたはZennの記事に合う見出し用絵文字を選ぶアシスタントです。
		必ず以下の条件を守って3つの異なる絵文字を提案します。

		【選択ルール】
		- main（1つ目）：制限なし（定番やブラックリスト絵文字も可）
		- sub[0], sub[1]（2つ目・3つ目）：必ず WILDCARD_POOL 内の絵文字を選ぶ
		- sub[0] と sub[1] は必ず異なるカテゴリから選ぶ
		- WILDCARD_POOL に含まれない場合は再選定し、必ず含まれる状態で出力する
		- 国旗は除外（もし選ばれた場合は別候補に置き換える）

		【WILDCARD_POOL（カテゴリごと）】
		${JSON.stringify(pool, null, 2)}

		【理由作成ルール】
		- reason に絵文字は書かない
		- 「かっこいい」「印象が良い」など抽象表現は禁止
		- 理由は「本文中の具体的な要素」＋「その要素を比喩的に表す」で書く
		- 本文中の実際の単語や出来事を必ず含める

		【出力形式（JSONのみ）】
		{
			"main": { "emoji": "X", "reason": "..." },
			"sub": [
				{ "emoji": "Y", "reason": "..." },
				{ "emoji": "Z", "reason": "..." }
			],
			"_meta": { "tone": "本文から推定したトーン" }
		}

		【本文】
		${text}

		【例】
		入力本文: "深夜のデバッグ作業で偶然バグの原因を発見した話"
		出力例:
		{
			"main": { "emoji": "🔦", "reason": "夜間の作業で隠れたバグを探し当てた様子を懐中電灯に例えた" },
			"sub": [
				{ "emoji": "🌋", "reason": "予想外の原因が噴き出した瞬間を火山の爆発になぞらえた" },
				{ "emoji": "🦉", "reason": "深夜に冷静に観察して解決に至った様子を夜行性の鳥に例えた" }
			],
			"_meta": { "tone": "落ち着いたが緊張感のある雰囲気" }
		}
`;

  switch (apiType) {
    case "gemini":
      return await callGemini(apiKey, prompt);
    case "claude":
      return await callClaude(apiKey, prompt);
    case "openai":
      return await callOpenAI(apiKey, prompt);
    default:
      throw new Error("サポートされていないAPIタイプです");
  }
}

// Gemini API
async function callGemini(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API Error`);
  }

  const result = await response.json();
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Geminiからレスポンスがありません");
  }

  return parseJSON(content);
}

// Claude API
async function callClaude(apiKey, prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API Error`);
  }

  const result = await response.json();
  const content = result.content?.[0]?.text;

  if (!content) {
    throw new Error("Claudeからレスポンスがありません");
  }

  return parseJSON(content);
}

// OpenAI API
async function callOpenAI(apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "JSON形式のみで回答してください。" },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API Error`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAIからレスポンスがありません");
  }

  return parseJSON(content);
}

// JSON解析
function parseJSON(content) {
  try {
    // 直接パース
    return JSON.parse(content.trim());
  } catch (error1) {
    try {
      // JSONブロック抽出
      const jsonMatch =
        content.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
        content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1].trim());
      }
    } catch (error2) {
      // 何もできない場合
    }

    // フォールバック
    // 解析失敗時は詳細をログに出さない
    return {
      main: { emoji: "📝", reason: "JSON解析に失敗しました" },
      sub: [
        { emoji: "💡", reason: "デフォルト提案1" },
        { emoji: "✨", reason: "デフォルト提案2" },
      ],
    };
  }
}
