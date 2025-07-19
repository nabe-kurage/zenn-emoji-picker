// ポップアップUI制御
class PopupController {
  constructor() {
    this.currentTab = 'suggestions';
    this.currentSuggestions = null;
    this.initializeElements();
    this.bindEvents();
    this.initializeData();
  }
  
  // DOM要素を初期化
  initializeElements() {
    // タブ関連
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.tabContents = document.querySelectorAll('.tab-content');
    
    // 提案タブ
    this.statusMessage = document.getElementById('status-message');
    this.loadingSpinner = document.getElementById('loading-spinner');
    this.suggestionsContainer = document.getElementById('suggestions-container');
    this.errorContainer = document.getElementById('error-container');
    this.errorMessage = document.getElementById('error-message');
    
    this.mainEmojiChar = document.getElementById('main-emoji-char');
    this.mainEmojiReason = document.getElementById('main-emoji-reason');
    this.mainCopyBtn = document.getElementById('main-copy-btn');
    this.mainFavoriteBtn = document.getElementById('main-favorite-btn');
    this.subEmojis = document.getElementById('sub-emojis');
    
    this.regenerateBtn = document.getElementById('regenerate-btn');
    this.previewBtn = document.getElementById('preview-btn');
    this.retryBtn = document.getElementById('retry-btn');
    this.analyzeBtn = document.getElementById('analyze-btn');
    
    // お気に入り・履歴
    this.favoritesList = document.getElementById('favorites-list');
    this.favoritesEmpty = document.getElementById('favorites-empty');
    this.clearFavoritesBtn = document.getElementById('clear-favorites-btn');
    
    this.historyList = document.getElementById('history-list');
    this.historyEmpty = document.getElementById('history-empty');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');
    
    // 設定・その他
    this.settingsBtn = document.getElementById('settings-btn');
    this.toast = document.getElementById('toast');
    this.toastMessage = document.getElementById('toast-message');
    
    // プレビューモーダル
    this.previewModal = document.getElementById('preview-modal');
    this.previewEmoji = document.getElementById('preview-emoji');
    this.previewClose = document.getElementById('preview-close');
    this.previewCancel = document.getElementById('preview-cancel');
    this.previewCopy = document.getElementById('preview-copy');
  }
  
  // イベントをバインド
  bindEvents() {
    // タブ切り替え
    this.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.switchTab(button.dataset.tab);
      });
    });
    
    // 分析ボタン
    this.analyzeBtn.addEventListener('click', () => {
      this.analyzeArticle();
    });
    
    // 再生成ボタン
    this.regenerateBtn.addEventListener('click', () => {
      this.regenerateSuggestions();
    });
    
    // 再試行ボタン
    this.retryBtn.addEventListener('click', () => {
      this.analyzeArticle();
    });
    
    // プレビューボタン
    this.previewBtn.addEventListener('click', () => {
      this.showPreview();
    });
    
    // メイン絵文字のアクション
    this.mainCopyBtn.addEventListener('click', () => {
      this.copyEmoji(this.mainEmojiChar.textContent);
    });
    
    this.mainFavoriteBtn.addEventListener('click', () => {
      this.toggleFavorite(
        this.mainEmojiChar.textContent,
        this.mainEmojiReason.textContent
      );
    });
    
    // お気に入り・履歴のクリア
    this.clearFavoritesBtn.addEventListener('click', () => {
      this.clearFavorites();
    });
    
    this.clearHistoryBtn.addEventListener('click', () => {
      this.clearHistory();
    });
    
    // 設定ボタン
    this.settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // プレビューモーダル
    this.previewClose.addEventListener('click', () => {
      this.hidePreview();
    });
    
    this.previewCancel.addEventListener('click', () => {
      this.hidePreview();
    });
    
    this.previewCopy.addEventListener('click', () => {
      this.copyFromPreview();
    });
    
    this.previewModal.addEventListener('click', (e) => {
      if (e.target === this.previewModal) {
        this.hidePreview();
      }
    });
  }
  
  // 初期データを読み込み
  async initializeData() {
    try {
      // Service Workerの状態を確認
      await this.checkServiceWorker();
      
      // 現在のページがZenn編集ページかチェック
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('zenn.dev') || !tab.url.includes('/edit')) {
        this.showStatus('Zennの記事編集ページで使用してください', 'warning');
        this.analyzeBtn.disabled = true;
        return;
      }
      
      // お気に入りと履歴を読み込み
      await this.loadFavorites();
      await this.loadHistory();
      
      this.showStatus('記事を分析する準備ができました');
    } catch (error) {
      console.error('Initialization error:', error);
      this.showStatus('初期化に失敗しました', 'error');
    }
  }
  
  // Service Workerの状態を確認
  async checkServiceWorker() {
    try {
      console.log('Checking service worker status...');
      
      // 簡単なpingメッセージを送信
      const response = await chrome.runtime.sendMessage({ action: 'ping' });
      
      if (response && response.success) {
        console.log('Service worker is active');
      } else {
        console.warn('Service worker response:', response);
        throw new Error('Service worker not responding correctly');
      }
    } catch (error) {
      console.error('Service worker check failed:', error);
      
      // Service Workerを再起動してみる
      try {
        await this.restartServiceWorker();
      } catch (restartError) {
        console.error('Service worker restart failed:', restartError);
        throw new Error('バックグラウンドスクリプトとの通信に失敗しました。拡張機能を再読み込みしてください。');
      }
    }
  }
  
  // Service Workerを再起動
  async restartServiceWorker() {
    console.log('Attempting to restart service worker...');
    
    // 短い待機後に再試行
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await chrome.runtime.sendMessage({ action: 'ping' });
    if (!response || !response.success) {
      throw new Error('Service worker restart failed');
    }
    
    console.log('Service worker restarted successfully');
  }
  
  // タブを切り替え
  switchTab(tabName) {
    this.currentTab = tabName;
    
    // タブボタンの状態を更新
    this.tabButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    // タブコンテンツの表示を更新
    this.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // タブ固有の処理
    if (tabName === 'favorites') {
      this.loadFavorites();
    } else if (tabName === 'history') {
      this.loadHistory();
    }
  }
  
  // 記事を分析
  async analyzeArticle() {
    try {
      this.setAnalyzing(true);
      this.hideError();
      this.hideSuggestions();
      
      // Service Workerが生きているか確認
      try {
        await this.checkServiceWorker();
      } catch (serviceWorkerError) {
        console.error('Service worker check failed:', serviceWorkerError);
        throw new Error('バックグラウンドサービスに接続できません。拡張機能を再読み込みしてください。');
      }
      
      // 現在のタブからテキストを抽出
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, {
          action: 'extractText'
        });
      } catch (contentScriptError) {
        console.error('Content script error:', contentScriptError);
        throw new Error('ページからテキストを抽出できません。ページを再読み込みしてください。');
      }
      
      if (!response || !response.success) {
        throw new Error(response?.error || 'テキストの抽出に失敗しました');
      }
      
      if (!response.text || response.text.trim().length === 0) {
        throw new Error('記事の内容が見つかりません。記事を書いてから再試行してください。');
      }
      
      // AI APIを呼び出して絵文字を提案
      const suggestions = await this.generateSuggestions(response.text);
      
      this.currentSuggestions = suggestions;
      this.displaySuggestions(suggestions);
      this.setAnalyzing(false);
      
    } catch (error) {
      console.error('Analysis error:', error);
      this.setAnalyzing(false);
      this.showError(error.message);
    }
  }
  
  // 絵文字提案を生成
  async generateSuggestions(text) {
    console.log('Sending message to background script:', { action: 'generateEmojiSuggestions', textLength: text.length });
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'generateEmojiSuggestions',
        text: text
      });
      
      console.log('Received response from background:', response);
      
      if (!response) {
        throw new Error('バックグラウンドスクリプトからレスポンスがありません');
      }
      
      if (!response.success) {
        throw new Error(response.error || '絵文字提案の生成に失敗しました');
      }
      
      return response.suggestions;
    } catch (error) {
      console.error('Message sending error:', error);
      throw error;
    }
  }
  
  // 提案を再生成
  async regenerateSuggestions() {
    if (!this.currentSuggestions) {
      this.analyzeArticle();
      return;
    }
    
    try {
      this.setAnalyzing(true);
      
      // 現在のタブからテキストを再取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractText'
      });
      
      if (!response.success) {
        throw new Error(response.error || 'テキストの抽出に失敗しました');
      }
      
      const suggestions = await this.generateSuggestions(response.text);
      
      this.currentSuggestions = suggestions;
      this.displaySuggestions(suggestions);
      this.setAnalyzing(false);
      
    } catch (error) {
      console.error('Regeneration error:', error);
      this.setAnalyzing(false);
      this.showError(error.message);
    }
  }
  
  // 提案を表示
  displaySuggestions(suggestions) {
    // フォールバック表示の処理
    if (suggestions.isFallback) {
      this.showStatus(`API呼び出しに失敗しました。フォールバック絵文字を表示します。`, 'warning');
    } else {
      this.showStatus('絵文字の提案が完了しました');
    }
    
    // メイン絵文字を表示
    this.mainEmojiChar.textContent = suggestions.main.emoji;
    this.mainEmojiReason.textContent = suggestions.main.reason;
    
    // サブ絵文字を表示
    this.subEmojis.innerHTML = '';
    suggestions.sub.forEach((sub, index) => {
      const subItem = this.createSubEmojiElement(sub, index);
      this.subEmojis.appendChild(subItem);
    });
    
    this.showSuggestions();
  }
  
  // サブ絵文字要素を作成
  createSubEmojiElement(sub, index) {
    const item = document.createElement('div');
    item.className = 'emoji-item';
    
    item.innerHTML = `
      <div class="emoji-display">
        <span class="emoji-char">${sub.emoji}</span>
        <button class="copy-button" title="コピー">📋</button>
        <button class="favorite-button" title="お気に入りに追加">⭐</button>
      </div>
      <div class="emoji-reason">${sub.reason}</div>
    `;
    
    // イベントを追加
    const copyBtn = item.querySelector('.copy-button');
    const favoriteBtn = item.querySelector('.favorite-button');
    
    copyBtn.addEventListener('click', () => {
      this.copyEmoji(sub.emoji);
    });
    
    favoriteBtn.addEventListener('click', () => {
      this.toggleFavorite(sub.emoji, sub.reason);
    });
    
    return item;
  }
  
  // 絵文字をコピー
  async copyEmoji(emoji) {
    try {
      await navigator.clipboard.writeText(emoji);
      this.showToast(`絵文字 ${emoji} をコピーしました！`);
    } catch (error) {
      console.error('Copy error:', error);
      this.showToast('コピーに失敗しました', 'error');
    }
  }
  
  // お気に入りの切り替え
  async toggleFavorite(emoji, reason) {
    try {
      await chrome.runtime.sendMessage({
        action: 'saveToFavorites',
        emoji: emoji,
        reason: reason
      });
      
      this.showToast(`${emoji} をお気に入りに追加しました！`);
      
      // お気に入りタブが表示されている場合は更新
      if (this.currentTab === 'favorites') {
        this.loadFavorites();
      }
    } catch (error) {
      console.error('Favorite error:', error);
      this.showToast('お気に入りの追加に失敗しました', 'error');
    }
  }
  
  // お気に入りを読み込み
  async loadFavorites() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getFavorites'
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      this.displayFavorites(response.favorites);
    } catch (error) {
      console.error('Load favorites error:', error);
      this.showToast('お気に入りの読み込みに失敗しました', 'error');
    }
  }
  
  // お気に入りを表示
  displayFavorites(favorites) {
    if (favorites.length === 0) {
      this.favoritesList.style.display = 'none';
      this.favoritesEmpty.classList.remove('hidden');
      return;
    }
    
    this.favoritesList.style.display = 'block';
    this.favoritesEmpty.classList.add('hidden');
    
    this.favoritesList.innerHTML = '';
    
    favorites.forEach(favorite => {
      const item = document.createElement('div');
      item.className = 'favorite-item';
      
      item.innerHTML = `
        <div class="item-content">
          <span class="item-emoji">${favorite.emoji}</span>
          <span class="item-text">${favorite.reason}</span>
        </div>
        <div class="item-actions">
          <button class="item-action copy-action" title="コピー">📋</button>
          <button class="item-action remove-action" title="削除">🗑️</button>
        </div>
      `;
      
      // イベントを追加
      const copyAction = item.querySelector('.copy-action');
      const removeAction = item.querySelector('.remove-action');
      
      copyAction.addEventListener('click', () => {
        this.copyEmoji(favorite.emoji);
      });
      
      removeAction.addEventListener('click', () => {
        this.removeFavorite(favorite.emoji);
      });
      
      this.favoritesList.appendChild(item);
    });
  }
  
  // お気に入りを削除
  async removeFavorite(emoji) {
    try {
      await chrome.runtime.sendMessage({
        action: 'removeFavorite',
        emoji: emoji
      });
      
      this.showToast(`${emoji} をお気に入りから削除しました`);
      this.loadFavorites();
    } catch (error) {
      console.error('Remove favorite error:', error);
      this.showToast('お気に入りの削除に失敗しました', 'error');
    }
  }
  
  // 履歴を読み込み
  async loadHistory() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getHistory'
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
      
      this.displayHistory(response.history);
    } catch (error) {
      console.error('Load history error:', error);
      this.showToast('履歴の読み込みに失敗しました', 'error');
    }
  }
  
  // 履歴を表示
  displayHistory(history) {
    if (history.length === 0) {
      this.historyList.style.display = 'none';
      this.historyEmpty.classList.remove('hidden');
      return;
    }
    
    this.historyList.style.display = 'block';
    this.historyEmpty.classList.add('hidden');
    
    this.historyList.innerHTML = '';
    
    history.forEach((entry, index) => {
      const suggestions = entry.suggestions;
      const timestamp = new Date(entry.timestamp).toLocaleString('ja-JP');
      
      const item = document.createElement('div');
      item.className = 'history-item';
      
      item.innerHTML = `
        <div class="item-content">
          <span class="item-emoji">${suggestions.main.emoji}</span>
          <span class="item-text">${timestamp}</span>
        </div>
        <div class="item-actions">
          <button class="item-action use-action" title="この提案を使用">↩️</button>
        </div>
      `;
      
      const useAction = item.querySelector('.use-action');
      useAction.addEventListener('click', () => {
        this.usePreviousSuggestion(suggestions);
      });
      
      this.historyList.appendChild(item);
    });
  }
  
  // 過去の提案を使用
  usePreviousSuggestion(suggestions) {
    this.currentSuggestions = suggestions;
    this.displaySuggestions(suggestions);
    this.switchTab('suggestions');
    this.showToast('過去の提案を復元しました');
  }
  
  // プレビューを表示
  showPreview() {
    if (!this.currentSuggestions) {
      this.showToast('提案がありません', 'warning');
      return;
    }
    
    this.previewEmoji.textContent = this.currentSuggestions.main.emoji;
    this.previewModal.classList.remove('hidden');
  }
  
  // プレビューを非表示
  hidePreview() {
    this.previewModal.classList.add('hidden');
  }
  
  // プレビューからコピー
  copyFromPreview() {
    const emoji = this.previewEmoji.textContent;
    this.copyEmoji(emoji);
    this.hidePreview();
  }
  
  // お気に入りをクリア
  async clearFavorites() {
    if (!confirm('お気に入りをすべて削除しますか？')) {
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({
        action: 'clearFavorites'
      });
      
      this.loadFavorites();
      this.showToast('お気に入りをクリアしました');
    } catch (error) {
      console.error('Clear favorites error:', error);
      this.showToast('お気に入りのクリアに失敗しました', 'error');
    }
  }
  
  // 履歴をクリア
  async clearHistory() {
    if (!confirm('履歴をすべて削除しますか？')) {
      return;
    }
    
    try {
      await chrome.runtime.sendMessage({
        action: 'clearHistory'
      });
      
      this.loadHistory();
      this.showToast('履歴をクリアしました');
    } catch (error) {
      console.error('Clear history error:', error);
      this.showToast('履歴のクリアに失敗しました', 'error');
    }
  }
  
  // UI状態管理
  setAnalyzing(analyzing) {
    if (analyzing) {
      this.loadingSpinner.classList.remove('hidden');
      this.statusMessage.classList.add('hidden');
      this.analyzeBtn.disabled = true;
      this.regenerateBtn.disabled = true;
    } else {
      this.loadingSpinner.classList.add('hidden');
      this.statusMessage.classList.remove('hidden');
      this.analyzeBtn.disabled = false;
      this.regenerateBtn.disabled = false;
    }
  }
  
  showSuggestions() {
    this.suggestionsContainer.classList.remove('hidden');
    this.suggestionsContainer.classList.add('fade-in');
  }
  
  hideSuggestions() {
    this.suggestionsContainer.classList.add('hidden');
  }
  
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorContainer.classList.remove('hidden');
  }
  
  hideError() {
    this.errorContainer.classList.add('hidden');
  }
  
  showStatus(message, type = 'info') {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
  }
  
  showToast(message, type = 'success') {
    this.toastMessage.textContent = message;
    this.toast.className = `toast ${type}`;
    this.toast.classList.remove('hidden');
    
    setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 3000);
  }
}

// ページ読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});