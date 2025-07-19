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
      console.log('Background received message:', request);
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
      console.log('Handling message action:', request.action);
      
      switch (request.action) {
        case 'generateEmojiSuggestions':
          console.log('Generating emoji suggestions...');
          const suggestions = await this.generateEmojiSuggestions(request.text);
          console.log('Generated suggestions:', suggestions);
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
          
        case 'removeFavorite':
          await Storage.removeFavorite(request.emoji);
          sendResponse({ success: true });
          break;
          
        case 'clearFavorites':
          // お気に入りクリア機能を追加
          await chrome.storage.local.remove(['favorites']);
          sendResponse({ success: true });
          break;
          
        case 'clearHistory':
          // 履歴クリア機能を追加
          await chrome.storage.local.remove(['history']);
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('Unknown action:', request.action);
          sendResponse({ success: false, error: '不明なアクション: ' + request.action });
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
    const apiType = settings.apiType || 'gemini';
    
    let lastError = null;
    
    // リトライ機能
    for (let attempt = 1; attempt <= CONFIG.API.MAX_RETRIES; attempt++) {
      try {
        console.log(`API call attempt ${attempt}/${CONFIG.API.MAX_RETRIES} using ${apiType}`);
        
        const result = await this.callAPIByType(text, apiType);
        
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
  
  // APIタイプに応じた呼び出し
  async callAPIByType(text, apiType) {
    const apiKey = await Storage.getApiKey();
    const prompt = CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
    
    switch (apiType) {
      case 'claude':
        return await this.callClaudeAPI(text, apiKey);
      case 'openai':
        return await this.callOpenAIAPI(text, apiKey);
      case 'gemini':
        return await this.callGeminiAPI(text, apiKey);
      default:
        throw new Error('サポートされていないAPIタイプです');
    }
  }
  
  // Claude API呼び出し
  async callClaudeAPI(text, apiKey) {
    const prompt = CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API Error (${response.status}): ${errorBody}`);
    }
    
    const result = await response.json();
    const content = result.content?.[0]?.text;
    
    if (!content) {
      throw new Error('Empty response from Claude');
    }
    
    // JSONを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    return JSON.parse(jsonMatch[0]);
  }
  
  // OpenAI API呼び出し
  async callOpenAIAPI(text, apiKey) {
    const settings = await Storage.getSettings();
    const model = settings.apiModel || 'gpt-3.5-turbo';
    const prompt = CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
    
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'あなたはZenn記事に最適な絵文字を提案するAIアシスタントです。必ずJSON形式のみで回答してください。説明文は不要です。JSONが途中で切れないよう完全な形で出力してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    };
    
    console.log('OpenAI API request:', { model, endpoint: 'https://api.openai.com/v1/chat/completions' });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
    });
    
    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenAI API error body:', errorBody);
      throw new Error(`OpenAI API Error (${response.status}): ${errorBody}`);
    }
    
    const result = await response.json();
    console.log('OpenAI API full response:', result);
    
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    console.log('OpenAI API content:', content);
    
    // JSONを抽出して解析
    try {
      // まず直接パースを試す
      return JSON.parse(content.trim());
    } catch (directParseError) {
      console.log('Direct JSON parse failed, trying extraction:', directParseError);
      
      // JSONブロックを抽出
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        console.error('No JSON found in content:', content);
        
        // フォールバック: 不完全なJSONの場合は手動で修復を試す
        return this.attemptJsonRepair(content);
      }
      
      try {
        const jsonStr = jsonMatch[1].trim();
        console.log('Extracted JSON string:', jsonStr);
        return JSON.parse(jsonStr);
      } catch (extractParseError) {
        console.error('JSON extraction parse failed:', extractParseError);
        
        // フォールバック: 不完全なJSONの場合は手動で修復を試す
        return this.attemptJsonRepair(jsonMatch[1]);
      }
    }
  }
  
  // Gemini API呼び出し
  async callGeminiAPI(text, apiKey) {
    const prompt = CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 300,
        responseMimeType: 'application/json'
      }
    };
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
    }
    
    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Empty response from Gemini');
    }
    
    // Geminiは直接JSONを返すはず
    try {
      return JSON.parse(content);
    } catch (parseError) {
      // JSONが含まれている場合を試す
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }
      return JSON.parse(jsonMatch[0]);
    }
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
  
  // JSON修復を試行
  attemptJsonRepair(jsonStr) {
    console.log('Attempting to repair JSON:', jsonStr);
    
    try {
      // 基本的な修復を試す
      let repairedJson = jsonStr.trim();
      
      // 最後にカンマがある場合は削除
      repairedJson = repairedJson.replace(/,\s*$/, '');
      
      // 閉じ括弧が不足している場合の修復
      let openBraces = (repairedJson.match(/\{/g) || []).length;
      let closeBraces = (repairedJson.match(/\}/g) || []).length;
      let openBrackets = (repairedJson.match(/\[/g) || []).length;
      let closeBrackets = (repairedJson.match(/\]/g) || []).length;
      
      // 不足している閉じ括弧を追加
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repairedJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repairedJson += '}';
      }
      
      console.log('Repaired JSON:', repairedJson);
      return JSON.parse(repairedJson);
      
    } catch (repairError) {
      console.error('JSON repair failed:', repairError);
      
      // 最後の手段: 部分的なデータからフォールバックオブジェクトを作成
      const emojiRegex = /["']emoji["']\s*:\s*["']([^"']+)["']/g;
      const reasonRegex = /["']reason["']\s*:\s*["']([^"']+)["']/g;
      
      const emojis = [];
      const reasons = [];
      
      let match;
      while ((match = emojiRegex.exec(jsonStr)) !== null) {
        emojis.push(match[1]);
      }
      
      while ((match = reasonRegex.exec(jsonStr)) !== null) {
        reasons.push(match[1]);
      }
      
      if (emojis.length > 0) {
        const result = {
          main: {
            emoji: emojis[0] || '📝',
            reason: reasons[0] || 'APIレスポンスが不完全でした'
          },
          sub: []
        };
        
        for (let i = 1; i < Math.min(emojis.length, 3); i++) {
          result.sub.push({
            emoji: emojis[i],
            reason: reasons[i] || 'APIレスポンスが不完全でした'
          });
        }
        
        // サブ絵文字が足りない場合はデフォルトを追加
        while (result.sub.length < 2) {
          result.sub.push({
            emoji: ['💡', '✨', '🚀', '🎯'][result.sub.length],
            reason: 'APIレスポンスが不完全でした'
          });
        }
        
        console.log('Created fallback response:', result);
        return result;
      }
      
      throw new Error('JSON修復に失敗しました');
    }
  }
  
  // 遅延ユーティリティ
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// サービスワーカーを初期化
new BackgroundService();