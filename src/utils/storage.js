import { Encryption } from './encryption.js';

// Chrome Storage API操作ユーティリティ
export class Storage {
  // APIキーを安全に保存
  static async saveApiKey(apiKey) {
    try {
      const password = await Encryption.getExtensionPassword();
      const encryptedKey = await Encryption.encrypt(apiKey, password);
      
      await chrome.storage.local.set({
        encryptedApiKey: encryptedKey,
        apiKeySet: true
      });
    } catch (error) {
      console.error('API key save failed:', error);
      throw new Error('APIキーの保存に失敗しました');
    }
  }
  
  // APIキーを安全に取得
  static async getApiKey() {
    try {
      const result = await chrome.storage.local.get(['encryptedApiKey']);
      
      if (!result.encryptedApiKey) {
        return null;
      }
      
      const password = await Encryption.getExtensionPassword();
      return await Encryption.decrypt(result.encryptedApiKey, password);
    } catch (error) {
      console.error('API key retrieval failed:', error);
      throw new Error('APIキーの取得に失敗しました');
    }
  }
  
  // お気に入り絵文字を保存
  static async saveFavoriteEmoji(emoji, reason) {
    try {
      const result = await chrome.storage.local.get(['favorites']);
      const favorites = result.favorites || [];
      
      // 重複チェック
      const exists = favorites.find(fav => fav.emoji === emoji);
      if (exists) {
        return;
      }
      
      favorites.unshift({
        emoji,
        reason,
        timestamp: Date.now()
      });
      
      // 最大数を制限
      const maxFavorites = 30;
      if (favorites.length > maxFavorites) {
        favorites.splice(maxFavorites);
      }
      
      await chrome.storage.local.set({ favorites });
    } catch (error) {
      console.error('Favorite save failed:', error);
      throw new Error('お気に入りの保存に失敗しました');
    }
  }
  
  // お気に入り絵文字を取得
  static async getFavorites() {
    try {
      const result = await chrome.storage.local.get(['favorites']);
      return result.favorites || [];
    } catch (error) {
      console.error('Favorites retrieval failed:', error);
      return [];
    }
  }
  
  // お気に入りから削除
  static async removeFavorite(emoji) {
    try {
      const result = await chrome.storage.local.get(['favorites']);
      const favorites = result.favorites || [];
      
      const filtered = favorites.filter(fav => fav.emoji !== emoji);
      await chrome.storage.local.set({ favorites: filtered });
    } catch (error) {
      console.error('Favorite removal failed:', error);
      throw new Error('お気に入りの削除に失敗しました');
    }
  }
  
  // 履歴を保存
  static async saveHistory(suggestions, textHash) {
    try {
      const result = await chrome.storage.local.get(['history']);
      const history = result.history || [];
      
      history.unshift({
        suggestions,
        textHash,
        timestamp: Date.now()
      });
      
      // 最大数を制限
      const maxHistory = 20;
      if (history.length > maxHistory) {
        history.splice(maxHistory);
      }
      
      await chrome.storage.local.set({ history });
    } catch (error) {
      console.error('History save failed:', error);
    }
  }
  
  // 履歴を取得
  static async getHistory() {
    try {
      const result = await chrome.storage.local.get(['history']);
      return result.history || [];
    } catch (error) {
      console.error('History retrieval failed:', error);
      return [];
    }
  }
  
  // 設定を保存
  static async saveSetting(key, value) {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await chrome.storage.local.set({ settings });
    } catch (error) {
      console.error('Setting save failed:', error);
      throw new Error('設定の保存に失敗しました');
    }
  }
  
  // 設定を取得
  static async getSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      return result.settings || {
        apiType: 'gemini',
        apiModel: 'gemini-1.5-flash',
        enableCache: true,
        enableHistory: true,
        animationEnabled: true
      };
    } catch (error) {
      console.error('Settings retrieval failed:', error);
      return {};
    }
  }
  
  // ストレージをクリア
  static async clearStorage() {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Storage clear failed:', error);
      throw new Error('ストレージのクリアに失敗しました');
    }
  }
}