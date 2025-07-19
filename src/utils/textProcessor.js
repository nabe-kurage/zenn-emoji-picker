import { CONFIG } from '../constants/config.js';

// テキスト処理ユーティリティ
export class TextProcessor {
  // テキストハッシュを生成（キャッシュキー用）
  static async generateTextHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Zenn記事からテキストを抽出・最適化
  static extractOptimizedText(content) {
    if (!content) {
      return '';
    }
    
    // Markdownの構造を解析
    const lines = content.split('\n');
    const processedLines = [];
    
    let headings = [];
    let codeBlocks = [];
    let regularText = [];
    
    let inCodeBlock = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // コードブロックの処理
      if (trimmedLine.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      
      if (inCodeBlock) {
        codeBlocks.push(trimmedLine);
        continue;
      }
      
      // 見出しの抽出（重要度が高い）
      if (trimmedLine.match(/^#{1,3}\s+/)) {
        headings.push(trimmedLine.replace(/^#+\s+/, ''));
        continue;
      }
      
      // リストアイテム
      if (trimmedLine.match(/^[\-\*\+]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        regularText.push(trimmedLine.replace(/^[\-\*\+\d\.]\s+/, ''));
        continue;
      }
      
      // 引用
      if (trimmedLine.startsWith('>')) {
        regularText.push(trimmedLine.replace(/^>\s*/, ''));
        continue;
      }
      
      // 通常のテキスト
      if (trimmedLine.length > 0) {
        // Markdownリンクを除去
        const cleanText = trimmedLine
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/`([^`]+)`/g, '$1')
          .replace(/\*\*([^\*]+)\*\*/g, '$1')
          .replace(/\*([^\*]+)\*/g, '$1');
        
        if (cleanText.length > 0) {
          regularText.push(cleanText);
        }
      }
    }
    
    // 重要度順にテキストを構築
    const prioritizedText = [
      ...headings.slice(0, 5), // 最初の5つの見出し
      ...regularText.slice(0, 10), // 最初の10行の本文
      ...codeBlocks.slice(0, 3).map(code => `[コード: ${code.slice(0, 50)}...]`)
    ];
    
    const fullText = prioritizedText.join('\n');
    
    // 長さ制限
    return this.limitTextLength(fullText);
  }
  
  // テキスト長を制限
  static limitTextLength(text) {
    const maxLength = CONFIG.TEXT_PROCESSING.MAX_LENGTH;
    
    if (text.length <= maxLength) {
      return text;
    }
    
    const startLength = CONFIG.TEXT_PROCESSING.SUMMARY_LENGTH.START;
    const endLength = CONFIG.TEXT_PROCESSING.SUMMARY_LENGTH.END;
    
    const startText = text.slice(0, startLength);
    const endText = text.slice(-endLength);
    
    return `${startText}\n\n[...中略...]\n\n${endText}`;
  }
  
  // テキストの品質をチェック
  static validateTextQuality(text) {
    if (!text || text.trim().length === 0) {
      return {
        isValid: false,
        reason: 'テキストが空です'
      };
    }
    
    if (text.length < 50) {
      return {
        isValid: false,
        reason: 'テキストが短すぎます（最低50文字必要）'
      };
    }
    
    // 日本語が含まれているかチェック
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    if (!hasJapanese) {
      return {
        isValid: false,
        reason: '日本語のテキストが検出されませんでした'
      };
    }
    
    return {
      isValid: true,
      reason: 'テキストは有効です'
    };
  }
  
  // キーワードを抽出（デバッグ用）
  static extractKeywords(text) {
    const words = text
      .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAFa-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 頻出単語をカウント
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // 頻度順にソート
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
}