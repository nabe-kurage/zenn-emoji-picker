// ポップアップのJavaScript

const analyzeBtn = document.getElementById('analyzeBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const settingsLink = document.getElementById('settingsLink');
const status = document.getElementById('status');
const error = document.getElementById('error');
const loading = document.getElementById('loading');
const suggestions = document.getElementById('suggestions');
const mainEmojiChar = document.getElementById('mainEmojiChar');
const mainReason = document.getElementById('mainReason');
const mainCopyBtn = document.getElementById('mainCopyBtn');
const subEmojis = document.getElementById('subEmojis');

let currentSuggestions = null;

// ページ初期化
async function init() {
  // 現在のタブがZenn編集ページかチェック
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('zenn.dev') || !tab.url.includes('/edit')) {
    showError('Zennの記事編集ページで使用してください');
    analyzeBtn.disabled = true;
    return;
  }
  
  // APIキーが設定されているかチェック
  const result = await chrome.storage.local.get(['apiKey']);
  if (!result.apiKey) {
    showError('設定画面でAPIキーを設定してください');
    analyzeBtn.disabled = true;
    return;
  }
  
  status.textContent = '記事を分析する準備ができました';
}

// 記事分析
async function analyzeArticle() {
  try {
    setLoading(true);
    hideError();
    hideSuggestions();
    
    // 現在のタブからテキストを抽出
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractText'
    });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    // 絵文字提案を生成
    const suggestions = await generateSuggestions(response.text);
    
    currentSuggestions = suggestions;
    displaySuggestions(suggestions);
    
  } catch (err) {
    console.error('分析エラー:', err);
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

// 絵文字提案生成
async function generateSuggestions(text) {
  const response = await chrome.runtime.sendMessage({
    action: 'generateEmojis',
    text: text
  });
  
  if (!response.success) {
    throw new Error(response.error);
  }
  
  return response.suggestions;
}

// 提案表示
function displaySuggestions(suggestions) {
  // メイン絵文字
  mainEmojiChar.textContent = suggestions.main.emoji;
  mainReason.textContent = suggestions.main.reason;
  
  // サブ絵文字
  subEmojis.innerHTML = '';
  suggestions.sub.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'emoji-item';
    item.innerHTML = `
      <div class="emoji-display">
        <span class="emoji">${sub.emoji}</span>
        <button class="copy-btn">コピー</button>
      </div>
      <div class="reason">${sub.reason}</div>
    `;
    
    // コピーボタンのイベント
    item.querySelector('.copy-btn').addEventListener('click', () => {
      copyEmoji(sub.emoji);
    });
    
    subEmojis.appendChild(item);
  });
  
  showSuggestions();
}

// 絵文字コピー
async function copyEmoji(emoji) {
  try {
    await navigator.clipboard.writeText(emoji);
    status.textContent = `${emoji} をコピーしました！`;
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (err) {
    console.error('コピーエラー:', err);
    showError('コピーに失敗しました');
  }
}

// UI制御
function setLoading(isLoading) {
  loading.style.display = isLoading ? 'block' : 'none';
  analyzeBtn.disabled = isLoading;
  regenerateBtn.disabled = isLoading;
  
  if (isLoading) {
    status.textContent = '';
  }
}

function showError(message) {
  error.textContent = message;
  error.style.display = 'block';
}

function hideError() {
  error.style.display = 'none';
}

function showSuggestions() {
  suggestions.style.display = 'block';
}

function hideSuggestions() {
  suggestions.style.display = 'none';
}

// イベントリスナー
analyzeBtn.addEventListener('click', analyzeArticle);
regenerateBtn.addEventListener('click', analyzeArticle);
mainCopyBtn.addEventListener('click', () => {
  copyEmoji(mainEmojiChar.textContent);
});
settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// 初期化
init();