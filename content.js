// Zennページでのテキスト抽出

// Zenn編集ページかチェック
function isZennEditPage() {
  return window.location.href.includes('zenn.dev') && 
         window.location.href.includes('/edit');
}

// エディターからテキストを抽出
function extractText() {
  if (!isZennEditPage()) {
    throw new Error('Zennの編集ページではありません');
  }
  
  const editor = findEditor();
  if (!editor) {
    throw new Error('エディターが見つかりませんでした');
  }
  
  let content = '';
  
  // CodeMirrorエディター
  if (editor.CodeMirror) {
    content = editor.CodeMirror.getValue();
  }
  // 通常のtextarea
  else if (editor.value !== undefined) {
    content = editor.value;
  }
  // contenteditable要素
  else {
    content = editor.textContent || editor.innerText || '';
  }
  
  if (!content || content.trim().length < 10) {
    throw new Error('記事の内容が不足しています（最低10文字必要）');
  }
  
  return processText(content);
}

// エディターを検索
function findEditor() {
  const selectors = [
    '.CodeMirror',
    'textarea',
    '[contenteditable="true"]',
    '[role="textbox"]'
  ];
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      // CodeMirrorの場合
      if (element.CodeMirror) {
        return element;
      }
      // textareaで内容がある場合
      if (element.tagName === 'TEXTAREA' && element.value && element.value.length > 10) {
        return element;
      }
      // contenteditable要素で内容がある場合
      if (element.contentEditable === 'true' && element.textContent && element.textContent.length > 10) {
        return element;
      }
    }
  }
  
  return null;
}

// テキスト処理（文字数制限）
function processText(text) {
  const MAX_LENGTH = 2000;
  const START_LENGTH = 800;
  const END_LENGTH = 400;
  
  // 改行や不要な空白を整理
  text = text.trim().replace(/\n{3,}/g, '\n\n');
  
  // 文字数制限チェック
  if (text.length <= MAX_LENGTH) {
    return text;
  }
  
  // 長い場合は前半後半を抽出
  const startText = text.substring(0, START_LENGTH);
  const endText = text.substring(text.length - END_LENGTH);
  
  return `${startText}\n\n[...中略...]\n\n${endText}`;
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractText') {
    try {
      const text = extractText();
      sendResponse({ success: true, text: text });
    } catch (error) {
      console.error('テキスト抽出エラー:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});

console.log('Zenn Emoji Picker: Content script loaded');