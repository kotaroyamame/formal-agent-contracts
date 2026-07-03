# Facebook 公開告知（下書き 2案）

投稿先: 個人FB（技術者・非技術者が混在）
主役: **Anthropic 公式の anthropics/claude-plugins-community に掲載された**という事実
リンク: https://iid.systems/formal-agent-contracts/ （OGPプレビュー用）／ 開発者向けは GitHub も可
方針: 最初の2行で「公式ディレクトリに載った」を伝える。専門用語は訳す。宣伝しすぎない。

---

## 案A：一般向け（温かい・短い）

自作の Claude Code プラグインが、Anthropic（Claude を作っている会社）の公式コミュニティディレクトリ「anthropics/claude-plugins-community」に掲載されました。Claude Code を使っている人なら、誰でも一覧から見つけて入れられる状態です。

どんな道具かというと。AI にコードを書かせていると、複数のAIを並行で走らせたときに、お互いの「約束事」が少しずつズレていくんですよね。それを、AI の書いたルールを"機械がチェックできる形"にして、ズレを自動で捕まえる、というものです。書くのは AI に任せて、人間は日本語で要件を言うだけで済むようにしました。

形式手法という硬派な技術を使っていて、正直かなりニッチなのですが、公式ディレクトリに置いてもらえたのは素直に嬉しいです。少しずつ育てていきます。

🔗 https://iid.systems/formal-agent-contracts/

---

## 案B：開発者寄り（具体・FB尺）

【掲載されました】自作プラグイン formal-agent-contracts が、Anthropic 公式のコミュニティディレクトリ「anthropics/claude-plugins-community」に載りました。Claude Code の /plugin メニューの Discover から、または `@claude-community` で誰でも入れられます。

何をするものか。Kiro や Spec Kit で「まず仕様を書く」文化は定着しましたが、spec.md は散文なので、実装が仕様を満たしているかは結局 LLM の自己申告と人間レビュー頼みです。並列エージェントだと、この隙間で型やインターフェースが静かにズレていく。

そこで、エージェント間の契約だけ VDM-SL（形式仕様）で書いて、VDMJ / Z3 で機械検証できるようにしました。契約から TypeScript/Python のスキャフォールドや Jest/Vitest の契約テストも生成されます。仕様を書くのは Claude、人間は日本語で要件を言うだけ。

・15スキル / MIT / 日本語ドキュメント
・直近の v2.2 で「モジュール単位のモデルルーティング（トークン削減）」、v2.1 で「仕様→DBスキーマ（DDL）導出」を追加

効果の定量評価はまだ探索的で、VDM-SL というニッチな選択でもあるので過度な期待はせずに。ですが「AI が書いた仕様を機械が検証する」という組み合わせは本命だと思っています。フィードバックもらえたら嬉しいです。

🔗 GitHub: https://github.com/kotaroyamame/formal-agent-contracts
🔗 解説: https://iid.systems/formal-agent-contracts/

---

## FB運用メモ

- 主役は「anthropics/claude-plugins-community に掲載」＝Anthropic 公認で誰でも入れられる、という信頼のシグナル。冒頭2行（「See more」より上）に置いてある
- リンクは1つ目に貼ると OGP カードが展開される。案Bは2リンクなので、カード化したい方を意識
- ハッシュタグを付けるなら控えめに: #ClaudeCode #AI駆動開発 #形式手法
- 注意：カタログのピンが古い版のままなら、@claude-community から入る人は最新版（v2.2）の新機能（DBスキーマ導出・モデルルーティング）をまだ使えない。案Bの「直近の v2.2 で〜追加」を強調しすぎず、必要ならコメント欄で「最新版はリポジトリ直接追加（@formal-agent-contracts）で」と補足する
