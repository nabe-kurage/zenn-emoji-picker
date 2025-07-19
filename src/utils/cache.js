import { CONFIG } from '../constants/config.js';

// キャッシュ管理ユーティリティ
export class Cache {
  static CACHE_PREFIX = 'emoji_cache_';
  
  // キャッシュにデータを保存
  static async set(key, data) {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + CONFIG.CACHE.EXPIRY_TIME
      };
      
      await chrome.storage.local.set({
        [cacheKey]: cacheData
      });
      
      // キャッシュサイズを管理
      await this.cleanupOldEntries();
    } catch (error) {
      console.error('Cache set failed:', error);
    }
  }
  
  // キャッシュからデータを取得
  static async get(key) {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      const result = await chrome.storage.local.get([cacheKey]);
      const cacheData = result[cacheKey];
      
      if (!cacheData) {
        return null;
      }
      
      // 期限切れチェック
      if (Date.now() > cacheData.expiry) {
        await this.remove(key);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Cache get failed:', error);
      return null;
    }
  }
  
  // キャッシュからデータを削除
  static async remove(key) {
    try {
      const cacheKey = this.CACHE_PREFIX + key;
      await chrome.storage.local.remove([cacheKey]);
    } catch (error) {
      console.error('Cache remove failed:', error);
    }
  }
  
  // 古いキャッシュエントリを清掃
  static async cleanupOldEntries() {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheEntries = [];
      
      // キャッシュエントリを収集
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith(this.CACHE_PREFIX) && value.timestamp) {
          cacheEntries.push({
            key,
            timestamp: value.timestamp,
            expiry: value.expiry
          });
        }
      }
      
      const now = Date.now();
      const keysToRemove = [];
      
      // 期限切れエントリを特定
      cacheEntries.forEach(entry => {
        if (now > entry.expiry) {
          keysToRemove.push(entry.key);
        }
      });
      
      // 最大エントリ数を超えている場合、古いものから削除
      const validEntries = cacheEntries.filter(entry => now <= entry.expiry);
      if (validEntries.length > CONFIG.CACHE.MAX_ENTRIES) {
        validEntries.sort((a, b) => a.timestamp - b.timestamp);
        const excessEntries = validEntries.slice(0, validEntries.length - CONFIG.CACHE.MAX_ENTRIES);
        keysToRemove.push(...excessEntries.map(entry => entry.key));
      }
      
      // 削除実行
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`Cleaned up ${keysToRemove.length} cache entries`);
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }
  
  // 全キャッシュをクリア
  static async clear() {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(allData).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );
      
      if (cacheKeys.length > 0) {
        await chrome.storage.local.remove(cacheKeys);
        console.log(`Cleared ${cacheKeys.length} cache entries`);
      }
    } catch (error) {
      console.error('Cache clear failed:', error);
    }
  }
  
  // キャッシュ統計を取得
  static async getStats() {
    try {
      const allData = await chrome.storage.local.get(null);
      const cacheEntries = [];
      
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith(this.CACHE_PREFIX) && value.timestamp) {
          cacheEntries.push({
            key,
            timestamp: value.timestamp,
            expiry: value.expiry,
            size: JSON.stringify(value).length
          });
        }
      }
      
      const now = Date.now();
      const validEntries = cacheEntries.filter(entry => now <= entry.expiry);
      const expiredEntries = cacheEntries.filter(entry => now > entry.expiry);
      const totalSize = cacheEntries.reduce((sum, entry) => sum + entry.size, 0);
      
      return {
        totalEntries: cacheEntries.length,
        validEntries: validEntries.length,
        expiredEntries: expiredEntries.length,
        totalSizeBytes: totalSize,
        oldestEntry: cacheEntries.length > 0 ? 
          Math.min(...cacheEntries.map(e => e.timestamp)) : null,
        newestEntry: cacheEntries.length > 0 ? 
          Math.max(...cacheEntries.map(e => e.timestamp)) : null
      };
    } catch (error) {
      console.error('Cache stats failed:', error);
      return null;
    }
  }
}