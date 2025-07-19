import { Storage } from '../utils/storage.js';
import { CONFIG } from '../constants/config.js';

// AI API呼び出し専用クラス
export class EmojiAPI {
  static async callClaude(text, options = {}) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }
    
    const settings = await Storage.getSettings();
    const baseUrl = settings.proxyUrl || 'https://your-proxy-server.com';
    
    const requestBody = {
      model: options.model || 'claude-3-haiku',
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(text)
        }
      ],
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7
    };
    
    const response = await fetch(`${baseUrl}/api/claude`, {
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
      const errorBody = await response.text();
      throw new Error(`Claude API Error (${response.status}): ${errorBody}`);
    }
    
    const result = await response.json();
    return this.parseClaudeResponse(result);
  }
  
  static async callOpenAI(text, options = {}) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }
    
    const settings = await Storage.getSettings();
    const baseUrl = settings.proxyUrl || 'https://your-proxy-server.com';
    
    const requestBody = {
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'あなたはZenn記事に最適な絵文字を提案するAIアシスタントです。JSON形式で回答してください。'
        },
        {
          role: 'user',
          content: this.buildPrompt(text)
        }
      ],
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7
    };
    
    const response = await fetch(`${baseUrl}/api/openai`, {
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
      const errorBody = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errorBody}`);
    }
    
    const result = await response.json();
    return this.parseOpenAIResponse(result);
  }
  
  // 汎用のプロキシサーバー呼び出し
  static async callProxy(text, options = {}) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }
    
    const settings = await Storage.getSettings();
    const baseUrl = settings.proxyUrl || 'https://your-proxy-server.com';
    
    const requestBody = {
      model: options.model || 'claude-3-haiku',
      prompt: this.buildPrompt(text),
      max_tokens: options.maxTokens || 300,
      temperature: options.temperature || 0.7
    };
    
    const response = await fetch(`${baseUrl}/api/emoji-suggestion`, {
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
      const errorBody = await response.text();
      throw new Error(`Proxy API Error (${response.status}): ${errorBody}`);
    }
    
    const result = await response.json();
    return result;
  }
  
  // プロンプトを構築
  static buildPrompt(text) {
    return CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
  }
  
  // Claudeのレスポンスを解析
  static parseClaudeResponse(response) {
    try {
      // Claude APIの標準的なレスポンス形式
      const content = response.content?.[0]?.text || response.completion;
      
      if (!content) {
        throw new Error('Empty response from Claude');
      }
      
      // JSONを抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Claude response parsing error:', error);
      throw new Error('Claude APIのレスポンス解析に失敗しました');
    }
  }
  
  // OpenAIのレスポンスを解析
  static parseOpenAIResponse(response) {
    try {
      const content = response.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }
      
      // JSONを抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in OpenAI response');
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('OpenAI response parsing error:', error);
      throw new Error('OpenAI APIのレスポンス解析に失敗しました');
    }
  }
  
  // APIの利用可能性をテスト
  static async testAPIConnection(apiType = 'proxy') {
    try {
      const testText = 'これはテスト記事です。技術について書いています。';
      
      switch (apiType) {
        case 'claude':
          await this.callClaude(testText, { maxTokens: 50 });
          break;
        case 'openai':
          await this.callOpenAI(testText, { maxTokens: 50 });
          break;
        default:
          await this.callProxy(testText, { maxTokens: 50 });
      }
      
      return { success: true, message: 'API接続テストが成功しました' };
    } catch (error) {
      return { 
        success: false, 
        message: `API接続テストが失敗しました: ${error.message}` 
      };
    }
  }
}