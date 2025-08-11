// 設定画面のJavaScript

const apiTypeSelect = document.getElementById("apiType");
const apiKeyInput = document.getElementById("apiKey");
const testBtn = document.getElementById("testBtn");
const saveBtn = document.getElementById("saveBtn");
const messageDiv = document.getElementById("message");
const apiInfo = document.getElementById("apiInfo");
const apiTitle = document.getElementById("apiTitle");
const apiDescription = document.getElementById("apiDescription");
const apiLink = document.getElementById("apiLink");
const persistKeyCheckbox = document.getElementById("persistKey");
const clearKeyBtn = document.getElementById("clearKeyBtn");

// API情報データ
const apiInfoData = {
  gemini: {
    title: "🤖 Gemini API",
    description:
      "Googleの高性能AI API。無料枠があり、高速で高品質な絵文字提案が可能です。",
    link: "https://aistudio.google.com/app/apikey",
  },
  claude: {
    title: "🧠 Claude API",
    description:
      "Anthropicの高品質AI API。文章理解に優れ、的確な絵文字提案を行います。",
    link: "https://console.anthropic.com/",
  },
  openai: {
    title: "⚡ OpenAI API",
    description:
      "OpenAIの汎用AI API。豊富なドキュメントとコミュニティサポートがあります。",
    link: "https://platform.openai.com/api-keys",
  },
};

// 初期化
async function init() {
  await loadSettings();
  updateApiInfo();
}

// 設定読み込み
async function loadSettings() {
  try {
    // session優先
    const session = await chrome.storage.session.get(["apiType", "apiKey"]);
    const local = await chrome.storage.local.get(["apiType", "apiKey"]);

    const apiType = session.apiType || local.apiType || "";
    const apiKey = session.apiKey || local.apiKey || "";
    const persisted = Boolean(local.apiKey);

    if (apiType) apiTypeSelect.value = apiType;
    if (apiKey) apiKeyInput.value = apiKey;
    persistKeyCheckbox.checked = persisted;
  } catch (error) {
    showMessage("設定の読み込みに失敗しました", "error");
  }
}

// API情報更新
function updateApiInfo() {
  const selectedApi = apiTypeSelect.value;

  if (!selectedApi || !apiInfoData[selectedApi]) {
    apiInfo.style.display = "none";
    return;
  }

  const info = apiInfoData[selectedApi];

  apiTitle.textContent = info.title;
  apiDescription.textContent = info.description;
  apiLink.href = info.link;

  apiInfo.style.display = "block";
}

// 設定保存
async function saveSettings() {
  const apiType = apiTypeSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const persist = persistKeyCheckbox.checked;

  if (!apiType) {
    showMessage("APIタイプを選択してください", "error");
    return;
  }

  if (!apiKey) {
    showMessage("APIキーを入力してください", "error");
    return;
  }

  try {
    // まず全てクリア
    await chrome.storage.session.remove(["apiType", "apiKey"]);
    await chrome.storage.local.remove(["apiType", "apiKey"]);

    // sessionに保存
    await chrome.storage.session.set({ apiType, apiKey });

    // 永続保存が選択されていればlocalにも保存
    if (persist) {
      await chrome.storage.local.set({ apiType, apiKey });
    }

    showMessage("設定を保存しました", "success");
  } catch (error) {
    showMessage("設定の保存に失敗しました", "error");
  }
}

// 接続テスト
async function testConnection() {
  const apiType = apiTypeSelect.value;
  const apiKey = apiKeyInput.value.trim();

  if (!apiType) {
    showMessage("APIタイプを選択してください", "error");
    return;
  }

  if (!apiKey) {
    showMessage("APIキーを入力してください", "error");
    return;
  }

  // ボタン状態更新
  testBtn.disabled = true;
  testBtn.innerHTML = "<span>🔄</span> テスト中...";

  try {
    const response = await chrome.runtime.sendMessage({
      action: "testAPI",
      apiType: apiType,
      apiKey: apiKey,
    });

    if (response.success) {
      showMessage("✅ 接続に成功しました！", "success");
    } else {
      showMessage("❌ 接続に失敗しました", "error");
    }
  } catch (error) {
    showMessage("❌ 接続テストに失敗しました", "error");
  } finally {
    // ボタン状態リセット
    testBtn.disabled = false;
    testBtn.innerHTML = "<span>🔍</span> 接続テスト";
  }
}

// キー削除
async function clearKey() {
  try {
    await chrome.storage.session.remove(["apiType", "apiKey"]);
    await chrome.storage.local.remove(["apiType", "apiKey"]);
    apiKeyInput.value = "";
    persistKeyCheckbox.checked = false;
    showMessage("APIキーを削除しました", "success");
  } catch (error) {
    showMessage("APIキーの削除に失敗しました", "error");
  }
}

// メッセージ表示
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = "block";

  // 成功メッセージは3秒後に自動で非表示
  if (type === "success") {
    setTimeout(() => {
      messageDiv.style.display = "none";
    }, 3000);
  }
}

// イベントリスナー
apiTypeSelect.addEventListener("change", updateApiInfo);
saveBtn.addEventListener("click", saveSettings);
testBtn.addEventListener("click", testConnection);
clearKeyBtn.addEventListener("click", (e) => {
  e.preventDefault();
  clearKey();
});

// APIキー入力でエラーメッセージを非表示
apiKeyInput.addEventListener("input", () => {
  if (messageDiv.className.includes("error")) {
    messageDiv.style.display = "none";
  }
});

// 初期化実行
init();
