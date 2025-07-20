// 設定画面のJavaScript

const apiType = document.getElementById('apiType');
const apiKey = document.getElementById('apiKey');
const apiHelp = document.getElementById('apiHelp');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

// API情報の更新
const apiInfo = {
  gemini: {
    placeholder: 'AIza... で始まるGemini APIキー',
    help: 'Google AI Studio (https://aistudio.google.com/app/apikey) で取得'
  },
  claude: {
    placeholder: 'sk-ant-... で始まるClaude APIキー', 
    help: 'Anthropic Console (https://console.anthropic.com/) で取得'
  },
  openai: {
    placeholder: 'sk-... で始まるOpenAI APIキー',
    help: 'OpenAI Platform (https://platform.openai.com/api-keys) で取得'
  }
};

// APIタイプ変更時
apiType.addEventListener('change', () => {
  const type = apiType.value;
  const info = apiInfo[type];
  apiKey.placeholder = info.placeholder;
  apiHelp.textContent = info.help;
});

// 初期設定読み込み
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['apiType', 'apiKey']);
    if (result.apiType) {
      apiType.value = result.apiType;
      apiType.dispatchEvent(new Event('change'));
    }
    if (result.apiKey) {
      apiKey.value = result.apiKey;
    }
  } catch (error) {
    console.error('設定読み込みエラー:', error);
  }
}

// 設定保存
async function saveSettings() {
  const type = apiType.value;
  const key = apiKey.value.trim();
  
  if (!key) {
    showStatus('APIキーを入力してください', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({
      apiType: type,
      apiKey: key
    });
    showStatus('設定を保存しました', 'success');
  } catch (error) {
    console.error('保存エラー:', error);
    showStatus('保存に失敗しました', 'error');
  }
}

// 接続テスト
async function testConnection() {
  const type = apiType.value;
  const key = apiKey.value.trim();
  
  if (!key) {
    showStatus('APIキーを入力してください', 'error');
    return;
  }
  
  testBtn.disabled = true;
  testBtn.textContent = 'テスト中...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'testAPI',
      apiType: type,
      apiKey: key
    });
    
    if (response.success) {
      showStatus('接続テストが成功しました', 'success');
    } else {
      showStatus(`接続テストが失敗しました: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('テストエラー:', error);
    showStatus('接続テストに失敗しました', 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '接続テスト';
  }
}

// ステータス表示
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

// イベントリスナー
saveBtn.addEventListener('click', saveSettings);
testBtn.addEventListener('click', testConnection);

// 初期化
loadSettings();