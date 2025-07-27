// Background Service Worker

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received:", request.action);

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
});

// API接続テスト
async function testAPI(apiType, apiKey) {
  const testText = "これはテスト記事です。技術について書いています。";

  try {
    await callAPI(apiType, apiKey, testText);
    return { success: true };
  } catch (error) {
    console.error("API test failed:", error);
    return { success: false, error: error.message };
  }
}

// 絵文字生成
async function generateEmojis(text) {
  try {
    // 設定を取得
    const result = await chrome.storage.local.get(["apiType", "apiKey"]);
    if (!result.apiKey) {
      throw new Error("APIキーが設定されていません");
    }

    const suggestions = await callAPI(result.apiType, result.apiKey, text);
    return { success: true, suggestions };
  } catch (error) {
    console.error("Generate emojis failed:", error);
    return { success: false, error: error.message };
  }
}

// API呼び出し
async function callAPI(apiType, apiKey, text) {
  const prompt = `以下のZenn記事の内容を分析し、エンジニアリングや技術要素を前提とした上で、他の記事と差別化できるような絵文字を選んで提案してください。

	※毎回同じ絵文字ではなく、記事の内容に合わせて柔軟に選んでください。  
	※出力する絵文字は、記事の内容を象徴するものを選んでください。  
	※単純に「💻」「⚙️」「🔧」といった技術的アイコンだけにならないようにしてください。  
	※またAIの記事だから「🤖」「🧠」、学習した内容だから「✏️」、アイディアだから「💡」といった単純なものにならないようにしてください。
	※たとえば、記事の雰囲気（ユーモラス／落ち着いた／創作系など）やテーマを反映する絵文字も検討してください。
	※表示する３つの絵文字は全て別のものを抽出してください。
	※サブ提案2の絵文字の絵文字には、理由にできるだけ、学び、システム、学習、知識といったワードを使わないでください。（学習用ブログサービスなので区別化ができていない印象になります）
	
	記事内容:
	${text}
	
	以下のJSON形式で出力してください（絵文字・理由ともにオリジナリティを重視してください）:
	{
		"main": { "emoji": "ここに最も適切な絵文字", "reason": "記事の主テーマを象徴する、差別化された理由" },
		"sub": [
			{ "emoji": "サブ提案1の絵文字", "reason": "サブテーマ1に合った絵文字と理由" },
			{ "emoji": "サブ提案2の絵文字", "reason": "以外性、ランダム性高く、記事の内容とは繋がりが薄いが、ある意味記事の内容を象徴すると言えなくもない絵文字と理由" }
		]
	}`;

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
    throw new Error(`Gemini API Error: ${error}`);
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
    throw new Error(`Claude API Error: ${error}`);
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
    throw new Error(`OpenAI API Error: ${error}`);
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
    console.warn("JSON解析失敗、フォールバックを使用:", content);
    return {
      main: { emoji: "📝", reason: "JSON解析に失敗しました" },
      sub: [
        { emoji: "💡", reason: "デフォルト提案1" },
        { emoji: "✨", reason: "デフォルト提案2" },
      ],
    };
  }
}

console.log("Zenn Emoji Picker: Background script loaded");
