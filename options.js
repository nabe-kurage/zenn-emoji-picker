// 設定画面のJavaScript

const apiTypeSelect = document.getElementById('apiType');
const apiKeyInput = document.getElementById('apiKey');
const testBtn = document.getElementById('testBtn');
const saveBtn = document.getElementById('saveBtn');
const messageDiv = document.getElementById('message');
const apiInfo = document.getElementById('apiInfo');
const apiTitle = document.getElementById('apiTitle');
const apiDescription = document.getElementById('apiDescription');
const apiLink = document.getElementById('apiLink');
const apiPricing = document.getElementById('apiPricing');

// API情報データ
const apiInfoData = {
  gemini: {
    title: '🤖 Gemini API',
    description: 'Googleの高性能AI API。無料枠があり、高速で高品質な絵文字提案が可能です。',
    link: 'https://aistudio.google.com/app/apikey',
    pricing: [
      { label: '無料枠', value: '月100万トークン', className: 'free' },
      { label: 'レート制限', value: '15 requests/分', className: 'free' }
    ]
  },
  claude: {
    title: '🧠 Claude API', 
    description: 'Anthropicの高品質AI API。文章理解に優れ、的確な絵文字提案を行います。',
    link: 'https://console.anthropic.com/',
    pricing: [
      { label: 'Haiku', value: '$0.25/M tokens', className: 'paid' },
      { label: 'Sonnet', value: '$3/M tokens', className: 'paid' }
    ]
  },
  openai: {
    title: '⚡ OpenAI API',
    description: 'OpenAIの汎用AI API。豊富なドキュメントとコミュニティサポートがあります。',
    link: 'https://platform.openai.com/api-keys',
    pricing: [
      { label: 'GPT-3.5', value: '$0.5/M tokens', className: 'paid' },
      { label: 'GPT-4', value: '$10/M tokens', className: 'paid' }
    ]
  }
};

// 初期化
async function init() {
  await loadSettings();
  updateApiInfo();
}

// 設定読み込み
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['apiType', 'apiKey']);
    
    if (result.apiType) {
      apiTypeSelect.value = result.apiType;
    }
    
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  } catch (error) {
    console.error('設定読み込みエラー:', error);
  }
}

// API情報更新
function updateApiInfo() {
  const selectedApi = apiTypeSelect.value;
  
  if (!selectedApi || !apiInfoData[selectedApi]) {
    apiInfo.style.display = 'none';
    return;
  }
  
  const info = apiInfoData[selectedApi];
  
  apiTitle.textContent = info.title;
  apiDescription.textContent = info.description;
  apiLink.href = info.link;
  
  // 料金情報を更新
  apiPricing.innerHTML = '';
  info.pricing.forEach(price => {
    const item = document.createElement('div');
    item.className = 'pricing-item';
    item.innerHTML = `
      <div class="pricing-label">${price.label}</div>
      <div class="pricing-value ${price.className}">${price.value}</div>
    `;
    apiPricing.appendChild(item);
  });
  
  apiInfo.style.display = 'block';
}

// 設定保存
async function saveSettings() {
  const apiType = apiTypeSelect.value;
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiType) {
    showMessage('APIタイプを選択してください', 'error');
    return;
  }
  
  if (!apiKey) {
    showMessage('APIキーを入力してください', 'error');
    return;
  }
  
  try {
    await chrome.storage.local.set({ apiType, apiKey });
    showMessage('設定を保存しました', 'success');
  } catch (error) {
    console.error('保存エラー:', error);
    showMessage('設定の保存に失敗しました', 'error');
  }
}

// 接続テスト
async function testConnection() {
  const apiType = apiTypeSelect.value;
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiType) {
    showMessage('APIタイプを選択してください', 'error');
    return;
  }
  
  if (!apiKey) {
    showMessage('APIキーを入力してください', 'error');
    return;
  }
  
  // ボタン状態更新
  testBtn.disabled = true;
  testBtn.innerHTML = '<span>🔄</span> テスト中...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'testAPI',
      apiType: apiType,
      apiKey: apiKey
    });
    
    if (response.success) {
      showMessage('✅ 接続に成功しました！', 'success');
    } else {
      showMessage(`❌ 接続に失敗しました: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('接続テストエラー:', error);
    showMessage('❌ 接続テストに失敗しました', 'error');
  } finally {
    // ボタン状態リセット
    testBtn.disabled = false;
    testBtn.innerHTML = '<span>🔍</span> 接続テスト';
  }
}

// メッセージ表示
function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';
  
  // 成功メッセージは3秒後に自動で非表示
  if (type === 'success') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
}

// イベントリスナー
apiTypeSelect.addEventListener('change', updateApiInfo);
saveBtn.addEventListener('click', saveSettings);
testBtn.addEventListener('click', testConnection);

// APIキー入力でエラーメッセージを非表示
apiKeyInput.addEventListener('input', () => {
  if (messageDiv.className.includes('error')) {
    messageDiv.style.display = 'none';
  }
});

// 初期化実行
init();