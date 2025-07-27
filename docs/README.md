# 📚 ドキュメント

Zenn Emoji Picker のドキュメント一覧です。

## 📋 ドキュメント構成

### [技術仕様.md](./技術仕様.md)
- アーキテクチャ全体図
- 技術スタック詳細
- セキュリティ仕様
- パフォーマンス仕様
- 拡張性について

### [コード詳細.md](./コード詳細.md)
- 各ファイルの役割と詳細
- 主要関数の説明
- エラーハンドリング戦略
- パフォーマンス最適化

### [API仕様.md](./API仕様.md)
- Gemini API 仕様
- Claude API 仕様
- OpenAI API 仕様
- プロンプト設計
- エラーハンドリング

## 🎯 対象読者

### 開発者向け
- **技術仕様.md**: システム全体の理解
- **コード詳細.md**: 実装詳細の理解
- **API仕様.md**: API統合の理解

### 運用者向け
- **技術仕様.md**: セキュリティ・パフォーマンス
- **API仕様.md**: API料金・制限の理解

### 新規参加者向け
1. まず **技術仕様.md** でシステム全体を把握
2. **コード詳細.md** で実装を理解
3. **API仕様.md** で外部サービス連携を理解

## 📖 クイックリファレンス

### 主要技術
- **フレームワーク**: Chrome Extension Manifest V3
- **言語**: JavaScript (ES2022)
- **API**: Gemini, Claude, OpenAI
- **ストレージ**: Chrome Storage API

### 主要ファイル
```
├── manifest.json       # 拡張機能設定
├── background.js       # API呼び出し・データ処理
├── content.js          # テキスト抽出
├── popup.html/js       # メインUI
├── options.html/js     # 設定画面
└── docs/              # ドキュメント
```

### 主要機能
- **テキスト抽出**: Zenn編集ページからの記事内容取得
- **AI分析**: 3つのAI APIによる絵文字提案
- **UI制御**: ポップアップでの絵文字表示・コピー
- **設定管理**: APIキー・タイプの保存・テスト

## 🔧 開発支援

### デバッグ方法
```javascript
// Background Script
console.log('Background:', message);

// Content Script  
console.log('Content:', extractedText);

// Popup Script
console.log('Popup:', suggestions);
```

### 動作確認
1. Chrome の `chrome://extensions/` でデベロッパーモードを有効化
2. 拡張機能を読み込み
3. Zenn記事編集ページで動作確認
4. デベロッパーツールでログ確認

### よくある問題
- **接続エラー**: Content Script の読み込み確認
- **API エラー**: APIキー・ネットワーク確認  
- **JSON エラー**: AIレスポンス形式確認

## 📝 更新履歴

### v1.0.0 (2025)
- 初期リリース
- Gemini/Claude/OpenAI API対応
- シンプルなUI実装
- 基本的なエラーハンドリング
