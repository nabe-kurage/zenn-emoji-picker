import { Storage } from '../utils/storage.js';
import { Cache } from '../utils/cache.js';
import { EmojiAPI } from '../background/api.js';

// 設定画面コントローラー
class OptionsController {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadSettings();
    this.loadStats();
  }
  
  // DOM要素を初期化
  initializeElements() {
    // API設定
    this.apiKeyInput = document.getElementById('api-key');
    this.toggleApiKeyBtn = document.getElementById('toggle-api-key');
    this.apiTypeSelect = document.getElementById('api-type');
    this.apiModelSelect = document.getElementById('api-model');
    this.apiKeyHelp = document.getElementById('api-key-help');
    this.apiModelHelp = document.getElementById('api-model-help');
    this.testApiBtn = document.getElementById('test-api');
    this.saveApiBtn = document.getElementById('save-api');
    
    // 機能設定
    this.enableCacheCheckbox = document.getElementById('enable-cache');
    this.enableHistoryCheckbox = document.getElementById('enable-history');
    this.enableAnimationCheckbox = document.getElementById('enable-animation');
    this.maxSuggestionsSelect = document.getElementById('max-suggestions');
    this.saveSettingsBtn = document.getElementById('save-settings');
    
    // データ管理
    this.statsGrid = document.getElementById('stats-grid');
    this.clearCacheBtn = document.getElementById('clear-cache');
    this.clearFavoritesBtn = document.getElementById('clear-favorites');
    this.clearHistoryBtn = document.getElementById('clear-history');
    this.clearAllDataBtn = document.getElementById('clear-all-data');
    
    // 情報・その他
    this.extensionVersion = document.getElementById('extension-version');
    this.viewLogsBtn = document.getElementById('view-logs');
    this.exportSettingsBtn = document.getElementById('export-settings');
    this.importSettingsBtn = document.getElementById('import-settings');
    this.importFile = document.getElementById('import-file');
    
    // UI要素
    this.toast = document.getElementById('toast');
    this.toastMessage = document.getElementById('toast-message');
    this.confirmModal = document.getElementById('confirm-modal');
    this.confirmTitle = document.getElementById('confirm-title');
    this.confirmMessage = document.getElementById('confirm-message');
    this.confirmCancel = document.getElementById('confirm-cancel');
    this.confirmOk = document.getElementById('confirm-ok');
    
    // 拡張機能のバージョンを表示
    this.extensionVersion.textContent = chrome.runtime.getManifest().version;
  }
  
  // イベントをバインド
  bindEvents() {
    // APIキー表示切り替え
    this.toggleApiKeyBtn.addEventListener('click', () => {
      this.toggleApiKeyVisibility();
    });
    
    // APIタイプ変更時の処理
    this.apiTypeSelect.addEventListener('change', () => {
      this.updateAPITypeSettings();
    });
    
    // API設定
    this.testApiBtn.addEventListener('click', () => {
      this.testApiConnection();
    });
    
    this.saveApiBtn.addEventListener('click', () => {
      this.saveApiSettings();
    });
    
    // 機能設定
    this.saveSettingsBtn.addEventListener('click', () => {
      this.saveFunctionSettings();
    });
    
    // データ管理
    this.clearCacheBtn.addEventListener('click', () => {
      this.confirmAction('キャッシュをクリア', 'キャッシュをすべて削除しますか？', () => {
        this.clearCache();
      });
    });
    
    this.clearFavoritesBtn.addEventListener('click', () => {
      this.confirmAction('お気に入りをクリア', 'お気に入りをすべて削除しますか？', () => {
        this.clearFavorites();
      });
    });
    
    this.clearHistoryBtn.addEventListener('click', () => {
      this.confirmAction('履歴をクリア', '履歴をすべて削除しますか？', () => {
        this.clearHistory();
      });
    });
    
    this.clearAllDataBtn.addEventListener('click', () => {
      this.confirmAction('全データを削除', '全てのデータ（APIキー、設定、キャッシュ、お気に入り、履歴）を削除しますか？この操作は元に戻せません。', () => {
        this.clearAllData();
      });
    });
    
    // 情報・その他
    this.viewLogsBtn.addEventListener('click', () => {
      this.viewLogs();
    });
    
    this.exportSettingsBtn.addEventListener('click', () => {
      this.exportSettings();
    });
    
    this.importSettingsBtn.addEventListener('click', () => {
      this.importFile.click();
    });
    
    this.importFile.addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });
    
    // 確認ダイアログ
    this.confirmCancel.addEventListener('click', () => {
      this.hideConfirmModal();
    });
    
    this.confirmOk.addEventListener('click', () => {
      if (this.confirmCallback) {
        this.confirmCallback();
      }
      this.hideConfirmModal();
    });
    
    this.confirmModal.addEventListener('click', (e) => {
      if (e.target === this.confirmModal) {
        this.hideConfirmModal();
      }
    });
  }
  
  // 設定を読み込み
  async loadSettings() {
    try {
      // API設定
      const apiKey = await Storage.getApiKey();
      if (apiKey) {
        this.apiKeyInput.value = apiKey;
      }
      
      const settings = await Storage.getSettings();
      this.apiTypeSelect.value = settings.apiType || 'gemini';
      this.apiModelSelect.value = settings.apiModel || 'gemini-1.5-flash';
      
      // APIタイプに応じたUIを更新
      this.updateAPITypeSettings();
      
      // 機能設定
      this.enableCacheCheckbox.checked = settings.enableCache !== false;
      this.enableHistoryCheckbox.checked = settings.enableHistory !== false;
      this.enableAnimationCheckbox.checked = settings.animationEnabled !== false;
      this.maxSuggestionsSelect.value = settings.maxSuggestions || '2';
      
    } catch (error) {
      console.error('Settings load error:', error);
      this.showToast('設定の読み込みに失敗しました', 'error');
    }
  }
  
  // 統計情報を読み込み
  async loadStats() {
    try {
      const cacheStats = await Cache.getStats();
      const favorites = await Storage.getFavorites();
      const history = await Storage.getHistory();
      
      const stats = [
        {
          label: 'キャッシュエントリ',
          value: cacheStats ? cacheStats.validEntries : 0
        },
        {
          label: 'お気に入り',
          value: favorites.length
        },
        {
          label: '履歴',
          value: history.length
        },
        {
          label: 'ストレージサイズ',
          value: cacheStats ? this.formatBytes(cacheStats.totalSizeBytes) : '0 B'
        }
      ];
      
      this.displayStats(stats);
    } catch (error) {
      console.error('Stats load error:', error);
    }
  }
  
  // 統計情報を表示
  displayStats(stats) {
    this.statsGrid.innerHTML = '';
    
    stats.forEach(stat => {
      const statItem = document.createElement('div');
      statItem.className = 'stat-item';
      
      statItem.innerHTML = `
        <span class="stat-value">${stat.value}</span>
        <span class="stat-label">${stat.label}</span>
      `;
      
      this.statsGrid.appendChild(statItem);
    });
  }
  
  // APIタイプに応じたUI更新
  updateAPITypeSettings() {
    const apiType = this.apiTypeSelect.value;
    
    // モデル選択肢を更新
    this.apiModelSelect.innerHTML = '';
    
    // ヘルプテキストを更新
    let helpText = 'APIキーは暗号化して安全に保存されます。';
    let modelHelpText = '使用するAIモデルを選択してください。';
    
    switch (apiType) {
      case 'gemini':
        this.apiModelSelect.innerHTML = `
          <option value="gemini-1.5-flash">Gemini 1.5 Flash（推奨・高速・無料枠あり）</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro（高性能・無料枠あり）</option>
        `;
        helpText += ' Gemini APIは <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> で取得できます。';
        modelHelpText += ' Flashは高速で無料枠が豊富、Proはより高性能です。';
        break;
        
      case 'claude':
        this.apiModelSelect.innerHTML = `
          <option value="claude-3-haiku-20240307">Claude 3 Haiku（推奨・高速）</option>
          <option value="claude-3-sonnet-20240229">Claude 3 Sonnet（バランス型）</option>
          <option value="claude-3-opus-20240229">Claude 3 Opus（最高性能）</option>
        `;
        helpText += ' Claude APIは <a href="https://console.anthropic.com/" target="_blank">Anthropic Console</a> で取得できます。';
        modelHelpText += ' Haikuは最も高速で安価です。';
        break;
        
      case 'openai':
        this.apiModelSelect.innerHTML = `
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo（推奨・安価）</option>
          <option value="gpt-4">GPT-4（高性能）</option>
          <option value="gpt-4-turbo">GPT-4 Turbo（最新）</option>
        `;
        helpText += ' OpenAI APIは <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a> で取得できます。';
        modelHelpText += ' GPT-3.5 Turboが最も安価です。';
        break;
    }
    
    this.apiKeyHelp.innerHTML = helpText;
    this.apiModelHelp.innerHTML = modelHelpText;
    
    // プレースホルダーを更新
    const placeholders = {
      gemini: 'AIza... で始まるGemini APIキー',
      claude: 'sk-ant-... で始まるClaude APIキー',
      openai: 'sk-... で始まるOpenAI APIキー'
    };
    
    this.apiKeyInput.placeholder = placeholders[apiType] || '選択したAIサービスのAPIキーを入力';
  }
  
  // APIキーの表示/非表示を切り替え
  toggleApiKeyVisibility() {
    const isPassword = this.apiKeyInput.type === 'password';
    this.apiKeyInput.type = isPassword ? 'text' : 'password';
    this.toggleApiKeyBtn.textContent = isPassword ? '🙈' : '👁️';
  }
  
  // API接続をテスト
  async testApiConnection() {
    if (!this.apiKeyInput.value.trim()) {
      this.showToast('APIキーを入力してください', 'warning');
      return;
    }
    
    try {
      this.setButtonLoading(this.testApiBtn, true);
      
      // 一時的にAPIキーを保存
      const originalKey = await Storage.getApiKey();
      await Storage.saveApiKey(this.apiKeyInput.value.trim());
      
      // 設定も一時保存
      const originalSettings = await Storage.getSettings();
      await Storage.saveSetting('apiType', this.apiTypeSelect.value);
      await Storage.saveSetting('apiModel', this.apiModelSelect.value);
      
      // API接続テスト
      const result = await EmojiAPI.testAPIConnection(this.apiTypeSelect.value);
      
      if (result.success) {
        this.showToast('API接続テストが成功しました！', 'success');
      } else {
        this.showToast(result.message, 'error');
        
        // 失敗した場合は元のキーに戻す
        if (originalKey) {
          await Storage.saveApiKey(originalKey);
        }
        
        await Storage.saveSetting('apiType', originalSettings.apiType || 'gemini');
        await Storage.saveSetting('apiModel', originalSettings.apiModel || 'gemini-1.5-flash');
      }
      
    } catch (error) {
      console.error('API test error:', error);
      this.showToast(`接続テストに失敗しました: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(this.testApiBtn, false);
    }
  }
  
  // API設定を保存
  async saveApiSettings() {
    try {
      this.setButtonLoading(this.saveApiBtn, true);
      
      const apiKey = this.apiKeyInput.value.trim();
      const apiType = this.apiTypeSelect.value;
      const apiModel = this.apiModelSelect.value;
      
      if (!apiKey) {
        this.showToast('APIキーを入力してください', 'warning');
        return;
      }
      
      // APIキーを暗号化して保存
      await Storage.saveApiKey(apiKey);
      
      // その他の設定を保存
      await Storage.saveSetting('apiType', apiType);
      await Storage.saveSetting('apiModel', apiModel);
      
      this.showToast('API設定を保存しました', 'success');
      
    } catch (error) {
      console.error('API settings save error:', error);
      this.showToast(`設定の保存に失敗しました: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(this.saveApiBtn, false);
    }
  }
  
  // 機能設定を保存
  async saveFunctionSettings() {
    try {
      this.setButtonLoading(this.saveSettingsBtn, true);
      
      await Storage.saveSetting('enableCache', this.enableCacheCheckbox.checked);
      await Storage.saveSetting('enableHistory', this.enableHistoryCheckbox.checked);
      await Storage.saveSetting('animationEnabled', this.enableAnimationCheckbox.checked);
      await Storage.saveSetting('maxSuggestions', this.maxSuggestionsSelect.value);
      
      this.showToast('機能設定を保存しました', 'success');
      
    } catch (error) {
      console.error('Function settings save error:', error);
      this.showToast(`設定の保存に失敗しました: ${error.message}`, 'error');
    } finally {
      this.setButtonLoading(this.saveSettingsBtn, false);
    }
  }
  
  // キャッシュをクリア
  async clearCache() {
    try {
      await Cache.clear();
      this.showToast('キャッシュをクリアしました', 'success');
      this.loadStats();
    } catch (error) {
      console.error('Clear cache error:', error);
      this.showToast('キャッシュのクリアに失敗しました', 'error');
    }
  }
  
  // お気に入りをクリア
  async clearFavorites() {
    try {
      await chrome.runtime.sendMessage({ action: 'clearFavorites' });
      this.showToast('お気に入りをクリアしました', 'success');
      this.loadStats();
    } catch (error) {
      console.error('Clear favorites error:', error);
      this.showToast('お気に入りのクリアに失敗しました', 'error');
    }
  }
  
  // 履歴をクリア
  async clearHistory() {
    try {
      await chrome.runtime.sendMessage({ action: 'clearHistory' });
      this.showToast('履歴をクリアしました', 'success');
      this.loadStats();
    } catch (error) {
      console.error('Clear history error:', error);
      this.showToast('履歴のクリアに失敗しました', 'error');
    }
  }
  
  // 全データを削除
  async clearAllData() {
    try {
      await Storage.clearStorage();
      await Cache.clear();
      this.showToast('全データを削除しました', 'success');
      
      // フォームをリセット
      this.apiKeyInput.value = '';
      this.proxyUrlInput.value = '';
      this.apiModelSelect.value = 'claude-3-haiku';
      this.enableCacheCheckbox.checked = true;
      this.enableHistoryCheckbox.checked = true;
      this.enableAnimationCheckbox.checked = true;
      this.maxSuggestionsSelect.value = '2';
      
      this.loadStats();
    } catch (error) {
      console.error('Clear all data error:', error);
      this.showToast('データの削除に失敗しました', 'error');
    }
  }
  
  // ログを表示
  viewLogs() {
    // デバッグコンソールを開く
    chrome.tabs.create({
      url: 'chrome://extensions/?id=' + chrome.runtime.id
    });
  }
  
  // 設定をエクスポート
  async exportSettings() {
    try {
      const settings = await Storage.getSettings();
      const exportData = {
        version: chrome.runtime.getManifest().version,
        timestamp: new Date().toISOString(),
        settings: {
          ...settings,
          // APIキーは除外（セキュリティ上の理由）
          apiKey: undefined
        }
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenn-emoji-picker-settings-${Date.now()}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showToast('設定をエクスポートしました', 'success');
      
    } catch (error) {
      console.error('Export settings error:', error);
      this.showToast('設定のエクスポートに失敗しました', 'error');
    }
  }
  
  // 設定をインポート
  async importSettings(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.settings) {
        throw new Error('無効な設定ファイルです');
      }
      
      // 設定を適用
      const settings = importData.settings;
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          await Storage.saveSetting(key, value);
        }
      }
      
      this.showToast('設定をインポートしました', 'success');
      this.loadSettings();
      
    } catch (error) {
      console.error('Import settings error:', error);
      this.showToast(`設定のインポートに失敗しました: ${error.message}`, 'error');
    }
  }
  
  // 確認ダイアログを表示
  confirmAction(title, message, callback) {
    this.confirmTitle.textContent = title;
    this.confirmMessage.textContent = message;
    this.confirmCallback = callback;
    this.confirmModal.classList.remove('hidden');
  }
  
  // 確認ダイアログを非表示
  hideConfirmModal() {
    this.confirmModal.classList.add('hidden');
    this.confirmCallback = null;
  }
  
  // ボタンのローディング状態を設定
  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
    } else {
      button.disabled = false;
      button.classList.remove('loading');
    }
  }
  
  // トースト通知を表示
  showToast(message, type = 'success') {
    this.toastMessage.textContent = message;
    this.toast.className = `toast ${type}`;
    this.toast.classList.remove('hidden');
    
    setTimeout(() => {
      this.toast.classList.add('hidden');
    }, 4000);
  }
  
  // バイト数をフォーマット
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// ページ読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});