import { CONFIG } from '../constants/config.js';
import { TextProcessor } from '../utils/textProcessor.js';

// Zenn編集ページでのコンテンツスクリプト
class ZennContentExtractor {
  constructor() {
    this.isZennEditPage = this.checkIfZennEditPage();
    this.initializeIfNeeded();
  }
  
  // Zennの編集ページかどうかチェック
  checkIfZennEditPage() {
    return window.location.href.includes('zenn.dev') && 
           window.location.href.includes('/edit');
  }
  
  // 必要な場合のみ初期化
  initializeIfNeeded() {
    if (!this.isZennEditPage) {
      return;
    }
    
    // バックグラウンドスクリプトからのメッセージを監視
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // 非同期レスポンスを示す
    });
    
    console.log('Zenn Emoji Picker: Content script initialized');
  }
  
  // メッセージハンドラ
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'extractText':
          const text = await this.extractArticleText();
          sendResponse({ success: true, text });
          break;
          
        case 'getPageInfo':
          const pageInfo = this.getPageInfo();
          sendResponse({ success: true, pageInfo });
          break;
          
        case 'checkPageType':
          sendResponse({ 
            success: true, 
            isZennEditPage: this.isZennEditPage 
          });
          break;
          
        default:
          sendResponse({ success: false, error: '不明なアクション' });
      }
    } catch (error) {
      console.error('Content script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  // 記事のテキストを抽出
  async extractArticleText() {
    // 複数の方法でエディターを特定
    const editor = this.findEditor();
    
    if (!editor) {
      throw new Error('エディターが見つかりませんでした');
    }
    
    let content = '';
    
    // CodeMirrorエディターの場合
    if (editor.CodeMirror) {
      content = editor.CodeMirror.getValue();
    }
    // 通常のtextareaの場合
    else if (editor.value !== undefined) {
      content = editor.value;
    }
    // その他のエディターの場合
    else {
      content = editor.textContent || editor.innerText || '';
    }
    
    if (!content) {
      throw new Error('記事の内容が取得できませんでした');
    }
    
    // テキストを最適化
    const optimizedText = TextProcessor.extractOptimizedText(content);
    
    // テキストの品質をチェック
    const validation = TextProcessor.validateTextQuality(optimizedText);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }
    
    return optimizedText;
  }
  
  // エディターを見つける
  findEditor() {
    // 優先順位付きでエディターを検索
    const selectors = [
      '.editor-wrapper .CodeMirror',
      '.CodeMirror',
      'textarea[data-testid="editor"]',
      'textarea.editor',
      '.editor textarea',
      '[data-editor] textarea',
      '.markdown-editor textarea'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }
    
    // より詳細な検索
    const allTextareas = document.querySelectorAll('textarea');
    for (const textarea of allTextareas) {
      if (textarea.value && textarea.value.length > 50) {
        return textarea;
      }
    }
    
    // CodeMirrorの検索
    const codeMirrorElements = document.querySelectorAll('[class*="CodeMirror"]');
    for (const element of codeMirrorElements) {
      if (element.CodeMirror) {
        return element;
      }
    }
    
    return null;
  }
  
  // ページ情報を取得
  getPageInfo() {
    const titleElement = document.querySelector('input[placeholder*="タイトル"], input[placeholder*="title"]');
    const title = titleElement ? titleElement.value : '';
    
    const urlParts = window.location.pathname.split('/');
    const articleId = urlParts.find(part => part.match(/^[a-f0-9]{12}$/));
    
    return {
      title,
      articleId,
      url: window.location.href,
      isPublished: !window.location.href.includes('/edit')
    };
  }
  
  // エディターの変更を監視（将来の機能拡張用）
  observeEditorChanges(callback) {
    const editor = this.findEditor();
    if (!editor) return;
    
    // CodeMirrorの場合
    if (editor.CodeMirror) {
      editor.CodeMirror.on('change', callback);
      return;
    }
    
    // 通常の入力要素の場合
    editor.addEventListener('input', callback);
    editor.addEventListener('paste', callback);
  }
  
  // プレビュー用の絵文字を一時的に表示（将来の機能拡張用）
  previewEmoji(emoji) {
    const titleElement = document.querySelector('input[placeholder*="タイトル"], input[placeholder*="title"]');
    if (!titleElement) return;
    
    // 既存のプレビューを削除
    const existingPreview = document.querySelector('.emoji-preview');
    if (existingPreview) {
      existingPreview.remove();
    }
    
    // プレビュー要素を作成
    const preview = document.createElement('div');
    preview.className = 'emoji-preview';
    preview.style.cssText = `
      position: absolute;
      top: -30px;
      left: 0;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 18px;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    preview.textContent = emoji;
    
    // 相対位置を設定
    titleElement.style.position = 'relative';
    titleElement.parentElement.appendChild(preview);
    
    // 3秒後に削除
    setTimeout(() => {
      preview.remove();
    }, 3000);
  }
}

// ページ読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ZennContentExtractor();
  });
} else {
  new ZennContentExtractor();
}