import { Storage } from '../utils/storage.js';
import { Cache } from '../utils/cache.js';
import { TextProcessor } from '../utils/textProcessor.js';
import { CONFIG } from '../constants/config.js';

// Service Worker（バックグラウンドスクリプト）
class BackgroundService {
  constructor() {
    this.rateLimit = new Map(); // レート制限管理
    this.initializeListeners();
  }
  
  // リスナーを初期化
  initializeListeners() {
    // 拡張機能アイコンクリック時
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
    
    // メッセージ処理
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 非同期レスポンス
    });
    
    // インストール時の初期化
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });
    
    console.log('Zenn Emoji Picker: Background service initialized');
  }
  
  // アクションクリック処理
  async handleActionClick(tab) {
    try {
      // Zennの編集ページかチェック
      if (!tab.url.includes('zenn.dev') || !tab.url.includes('/edit')) {
        // 通知やポップアップで案内
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#ff6b6b' });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '' });
        }, 3000);
        return;
      }
      
      // ポップアップを開く（manifest.jsonで設定済み）
    } catch (error) {
      console.error('Action click error:', error);
    }
  }
  
  // メッセージハンドラ
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'generateEmojiSuggestions':
          const suggestions = await this.generateEmojiSuggestions(request.text);
          sendResponse({ success: true, suggestions });
          break;
          
        case 'saveToFavorites':
          await Storage.saveFavoriteEmoji(request.emoji, request.reason);
          sendResponse({ success: true });
          break;
          
        case 'getFavorites':
          const favorites = await Storage.getFavorites();
          sendResponse({ success: true, favorites });
          break;
          
        case 'getHistory':
          const history = await Storage.getHistory();
          sendResponse({ success: true, history });
          break;
          
        case 'clearCache':
          await Cache.clear();
          sendResponse({ success: true });
          break;
          
        case 'getCacheStats':
          const stats = await Cache.getStats();
          sendResponse({ success: true, stats });
          break;
          
        default:
          sendResponse({ success: false, error: '不明なアクション' });
      }
    } catch (error) {
      console.error('Background message error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // インストール時の処理
  async handleInstallation(details) {
    if (details.reason === 'install') {
      // 初回インストール時の設定
      await Storage.saveSetting('firstInstall', Date.now());
      
      // オプションページを開く
      chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
      // アップデート時の処理
      console.log('Extension updated to version', chrome.runtime.getManifest().version);
    }
  }
  
  // 絵文字提案を生成
  async generateEmojiSuggestions(text) {
    // レート制限チェック
    if (!this.checkRateLimit()) {
      throw new Error('リクエストが多すぎます。1分後に再試行してください。');
    }
    
    // テキストハッシュを生成
    const textHash = await TextProcessor.generateTextHash(text);
    
    // キャッシュチェック
    const cachedResult = await Cache.get(textHash);
    if (cachedResult) {
      console.log('Using cached emoji suggestions');
      return cachedResult;
    }
    
    // API呼び出し
    const suggestions = await this.callEmojiAPI(text);
    
    // キャッシュに保存
    await Cache.set(textHash, suggestions);
    
    // 履歴に保存
    await Storage.saveHistory(suggestions, textHash);
    
    return suggestions;
  }
  
  // レート制限チェック
  checkRateLimit() {
    const now = Date.now();
    const timeWindow = CONFIG.API.RATE_LIMIT.TIME_WINDOW;
    const maxRequests = CONFIG.API.RATE_LIMIT.MAX_REQUESTS;
    
    // 古いエントリを削除
    for (const [timestamp] of this.rateLimit) {
      if (now - timestamp > timeWindow) {
        this.rateLimit.delete(timestamp);
      }
    }
    
    // 制限チェック
    if (this.rateLimit.size >= maxRequests) {
      return false;
    }
    
    // 新しいリクエストを記録
    this.rateLimit.set(now, true);
    return true;
  }
  
  // AI API呼び出し
  async callEmojiAPI(text) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません。設定画面から設定してください。');
    }
    
    const settings = await Storage.getSettings();
    const proxyUrl = settings.proxyUrl || 'https://your-proxy-server.com';
    
    const prompt = CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
    
    const requestBody = {
      model: 'claude-3-haiku',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7
    };
    
    let lastError = null;
    
    // リトライ機能
    for (let attempt = 1; attempt <= CONFIG.API.MAX_RETRIES; attempt++) {
      try {
        console.log(`API call attempt ${attempt}/${CONFIG.API.MAX_RETRIES}`);
        
        const response = await fetch(`${proxyUrl}/api/emoji-suggestion`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-Extension-Version': chrome.runtime.getManifest().version
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
        
        const result = await response.json();
        
        // レスポンス形式を検証
        const validatedSuggestions = this.validateAPIResponse(result);
        
        console.log('API call successful');
        return validatedSuggestions;
        
      } catch (error) {
        lastError = error;
        console.error(`API call attempt ${attempt} failed:`, error);
        
        // 最後の試行でない場合は待機
        if (attempt < CONFIG.API.MAX_RETRIES) {
          await this.delay(1000 * attempt); // 指数バックオフ
        }
      }
    }
    
    // 全ての試行が失敗した場合、フォールバック
    console.warn('All API attempts failed, using fallback');
    return this.getFallbackSuggestions(lastError.message);
  }
  
  // APIレスポンスを検証
  validateAPIResponse(response) {
    // 基本構造をチェック
    if (!response.main || !response.sub || !Array.isArray(response.sub)) {
      throw new Error('Invalid API response format');
    }
    
    // メイン絵文字をチェック
    if (!response.main.emoji || !response.main.reason) {
      throw new Error('Invalid main emoji format');
    }
    
    // サブ絵文字をチェック
    if (response.sub.length < 2) {
      throw new Error('Insufficient sub emoji suggestions');
    }
    
    for (const sub of response.sub) {
      if (!sub.emoji || !sub.reason) {
        throw new Error('Invalid sub emoji format');
      }
    }
    
    // 絵文字が実際にUnicode絵文字かチェック
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    
    if (!emojiRegex.test(response.main.emoji)) {
      throw new Error('Main emoji is not a valid Unicode emoji');
    }
    
    for (const sub of response.sub) {
      if (!emojiRegex.test(sub.emoji)) {
        throw new Error('Sub emoji is not a valid Unicode emoji');
      }
    }
    
    return response;
  }
  
  // フォールバック絵文字提案
  getFallbackSuggestions(errorMessage) {
    const fallbackEmojis = [
      { emoji: '📝', reason: '記事作成を表現' },
      { emoji: '💡', reason: 'アイデアや学びを象徴' },
      { emoji: '🚀', reason: '新しい挑戦を表現' },
      { emoji: '🔧', reason: '技術的な内容を表現' },
      { emoji: '🌟', reason: '特別な内容を強調' },
      { emoji: '🎯', reason: '目標達成を表現' }
    ];
    
    // ランダムに選択
    const shuffled = fallbackEmojis.sort(() => 0.5 - Math.random());
    
    return {
      main: shuffled[0],
      sub: shuffled.slice(1, 3),
      isFallback: true,
      errorMessage
    };
  }
  
  // 遅延ユーティリティ
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// サービスワーカーを初期化
new BackgroundService();