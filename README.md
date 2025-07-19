# 🎨 Zenn Emoji Picker

Zenn記事の内容を分析して最適な絵文字を自動提案するChrome拡張機能です。

## ✨ 機能

- **AI分析による絵文字提案**: 記事の内容を分析し、メイン絵文字1つ+サブ絵文字2つを提案
- **お気に入り機能**: よく使う絵文字を保存・管理
- **履歴機能**: 過去の提案を確認・再利用
- **プレビュー機能**: 記事タイトルでの見た目を確認
- **キャッシュ機能**: 同じ内容での重複API呼び出しを防止
- **セキュア**: APIキーは暗号化して安全に保存

## 🚀 インストール

### 1. 開発版として使用（開発者向け）

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/zenn-emoji-picker.git
cd zenn-emoji-picker

# Chrome拡張機能として読み込み
# 1. Chrome で chrome://extensions/ を開く
# 2. 右上の「デベロッパーモード」を有効にする
# 3. 「パッケージ化されていない拡張機能を読み込む」をクリック
# 4. このフォルダを選択
```

### 2. 今後のリリース版

Chrome Web Storeでの公開を予定しています。

## ⚙️ 設定

### 1. APIキーの設定

1. 拡張機能アイコンをクリック
2. 「⚙️ 設定」ボタンをクリック
3. 以下のいずれかのAPIキーを設定：
   - **Claude API** (推奨): Anthropic社のAPIキー
   - **OpenAI API**: OpenAI社のAPIキー

### 2. プロキシサーバーの設定

APIキーを安全に管理するため、プロキシサーバーのURLも設定してください。

## 📖 使い方

### 基本的な使い方

1. Zennの記事編集ページを開く
2. 拡張機能アイコンをクリック
3. 「✨ 分析開始」ボタンをクリック
4. 提案された絵文字をクリックしてコピー

### 高度な機能

- **お気に入り**: ⭐ボタンで絵文字をお気に入りに追加
- **履歴**: 過去の提案を「履歴」タブで確認
- **プレビュー**: 「👀 プレビュー」で記事タイトルでの見た目を確認
- **再提案**: 「🔄 もう一度提案」で新しい候補を取得

## 🏗️ 技術仕様

### アーキテクチャ

```
Chrome拡張機能
├── Content Script    # Zenn編集ページでのテキスト抽出
├── Background Service # API呼び出し、キャッシュ、データ管理
├── Popup UI          # メインインターフェース
└── Options Page      # 設定画面
```

### セキュリティ

- **APIキー暗号化**: Web Crypto APIを使用して暗号化
- **CSP設定**: Content Security Policyによる厳格な制御
- **レート制限**: 1分間に最大5回のAPI呼び出し制限
- **データ保護**: 機密情報のローカル保存なし

### 技術スタック

- **Manifest V3**: 最新のChrome拡張機能仕様
- **ES6 Modules**: モジュラーなコード構成
- **Web Crypto API**: セキュアな暗号化
- **Chrome Storage API**: 設定とキャッシュの管理

## 🛠️ 開発

### プロジェクト構造

```
zenn-emoji-picker/
├── manifest.json              # 拡張機能の設定
├── src/
│   ├── content/              # Content Script
│   ├── background/           # Background Service Worker
│   ├── popup/               # ポップアップUI
│   ├── options/             # 設定画面
│   ├── utils/               # ユーティリティ
│   └── constants/           # 定数定義
├── styles/                  # 共通スタイル
├── icons/                   # アイコン
└── README.md
```

### 設定ファイル

主要な設定は `src/constants/config.js` で管理されています：

- API設定（タイムアウト、リトライ回数）
- テキスト処理設定（最大長、要約設定）
- キャッシュ設定（有効期限、最大エントリ数）
- UI設定（アニメーション、履歴数）

### デバッグ

1. Chrome拡張機能ページ（chrome://extensions/）で「詳細」をクリック
2. 「拡張機能エラー」または「Service Worker」のリンクからコンソールを確認
3. Content Scriptのデバッグは通常のDevToolsで可能

## 🤝 貢献

バグ報告や機能提案は [Issues](https://github.com/your-repo/zenn-emoji-picker/issues) でお知らせください。

### 開発に参加する場合

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 🙏 謝辞

- [Zenn](https://zenn.dev/) - 素晴らしい技術記事プラットフォーム
- [Anthropic](https://www.anthropic.com/) - Claude API
- [OpenAI](https://openai.com/) - OpenAI API

---

**注意**: この拡張機能を使用するには、Anthropic社またはOpenAI社のAPIキーが必要です。APIの利用料金については各社の料金体系をご確認ください。