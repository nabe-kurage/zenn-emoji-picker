import { Storage } from '../utils/storage.js';
import { CONFIG } from '../constants/config.js';

// AI API呼び出し専用クラス
export class EmojiAPI {
  // Claude API呼び出し
  static async callClaude(text, options = {}) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }
    
    const requestBody = {
      model: options.model || 'claude-3-haiku-20240307',
      max_tokens: options.maxTokens || 300,
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(text)
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
    return this.parseClaudeResponse(result);
  }
  
  // OpenAI API呼び出し
  static async callOpenAI(text, options = {}) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }
    
    const requestBody = {
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'あなたはZenn記事に最適な絵文字を提案するAIアシスタントです。必ずJSON形式のみで回答してください。説明文は不要です。JSONが途中で切れないよう完全な形で出力してください。'
        },
        {
          role: 'user',
          content: this.buildPrompt(text)
        }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7
    };
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
  
  // Gemini API呼び出し
  static async callGemini(text, options = {}) {
    const apiKey = await Storage.getApiKey();
    if (!apiKey) {
      throw new Error('APIキーが設定されていません');
    }
    
    const model = options.model || 'gemini-1.5-flash';
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: this.buildPrompt(text)
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 300,
        responseMimeType: 'application/json'
      }
    };
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
    return this.parseGeminiResponse(result);
  }
  
  // プロンプトを構築
  static buildPrompt(text) {
    return CONFIG.PROMPT_TEMPLATE.replace('{{TEXT_CONTENT}}', text);
  }
  
  // Claudeのレスポンスを解析
  static parseClaudeResponse(response) {
    try {
      const content = response.content?.[0]?.text;
      
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
      
      console.log('OpenAI response content:', content);
      
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
    } catch (error) {
      console.error('OpenAI response parsing error:', error);
      throw new Error('OpenAI APIのレスポンス解析に失敗しました');
    }
  }
  
  // Geminiのレスポンスを解析
  static parseGeminiResponse(response) {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      
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
    } catch (error) {
      console.error('Gemini response parsing error:', error);
      throw new Error('Gemini APIのレスポンス解析に失敗しました');
    }
  }
  
  // APIの利用可能性をテスト
  static async testAPIConnection(apiType = 'gemini') {
    try {
      const testText = 'これはテスト記事です。技術について書いています。';
      
      switch (apiType) {
        case 'claude':
          await this.callClaude(testText, { maxTokens: 50 });
          break;
        case 'openai':
          await this.callOpenAI(testText, { maxTokens: 50 });
          break;
        case 'gemini':
          await this.callGemini(testText, { maxTokens: 50 });
          break;
        default:
          throw new Error('不明なAPIタイプです');
      }
      
      return { success: true, message: 'API接続テストが成功しました' };
    } catch (error) {
      return { 
        success: false, 
        message: `API接続テストが失敗しました: ${error.message}` 
      };
    }
  }
  
  // JSON修復を試行
  static attemptJsonRepair(jsonStr) {
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
  
  // 統一されたAPI呼び出し（設定に基づいて適切なAPIを選択）
  static async callAPI(text, apiType) {
    switch (apiType) {
      case 'claude':
        return await this.callClaude(text);
      case 'openai':
        return await this.callOpenAI(text);
      case 'gemini':
        return await this.callGemini(text);
      default:
        throw new Error('サポートされていないAPIタイプです');
    }
  }
}