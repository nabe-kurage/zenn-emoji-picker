// APIキー暗号化ユーティリティ
export class Encryption {
  // Web Crypto APIを使用した暗号化
  static async encrypt(text, password) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      // パスワードからキーを生成
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      // ソルトを生成
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // キーを導出
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      );
      
      // IVを生成
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // 暗号化
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
      );
      
      // 結果を結合してBase64エンコード
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('暗号化に失敗しました');
    }
  }
  
  // 復号化
  static async decrypt(encryptedData, password) {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Base64デコード
      const data = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );
      
      // ソルト、IV、暗号化データを分離
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      
      // パスワードからキーを生成
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      // キーを導出
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );
      
      // 復号化
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );
      
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('復号化に失敗しました');
    }
  }
  
  // 拡張機能固有のパスワードを生成
  static async getExtensionPassword() {
    // Chrome拡張機能のIDを使用してパスワードを生成
    const extensionId = chrome.runtime.id;
    const encoder = new TextEncoder();
    const data = encoder.encode(extensionId + 'zenn-emoji-picker-salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}