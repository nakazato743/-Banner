const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');  // express-sessionをインポート

const app = express();
const port = 3000;

// セッション設定
app.use(session({
    secret: 'your-secret-key',  // セッションの署名
    resave: false,              // セッションが変更されていなくても保存するか
    saveUninitialized: true     // 初期化されていないセッションでも保存するか
}));

// ミドルウェア設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));  // 'public' フォルダを静的ファイル用に設定

// ユーザーデータ（jsonファイル）
const usersFilePath = path.join(__dirname, 'users.json');

// ログインページ表示
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));  // public フォルダ内の login.html を送信
});

app.get('/home', (req, res) => {
    if (req.session.username) {
        // セッションがある場合、ユーザー名をテンプレートに渡す
        res.sendFile(path.join(__dirname, 'public', 'home.html'));
    } else {
        // セッションがない場合、ログインページにリダイレクト
        res.redirect('/login');
    }
});


// ログイン処理
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // ユーザーデータをJSONファイルから読み込む
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('サーバーエラー');
        }

        const users = JSON.parse(data);

        // ユーザー名とパスワードの確認
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            req.session.username = username;  // ログインしたユーザー名をセッションに保存
            return res.redirect('/home');  // ホーム画面に遷移
        } else {
            return res.status(401).send('無効なユーザー名またはパスワード');
        }
    });
});

// ユーザー登録ページ表示
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));  // public フォルダ内の register.html を送信
});

// ユーザー登録処理
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // ユーザーデータをJSONファイルから読み込む
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('サーバーエラー');
        }

        const users = JSON.parse(data);

        // 既存のユーザー名がないかチェック
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(400).send('そのユーザー名はすでに使われています');
        }

        // 新しいユーザーを追加
        users.push({
            username,
            password,
            tags: {}  // 新規ユーザーのタグ別計測時間は空のオブジェクトとして追加
        });

        // JSONファイルに保存
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).send('サーバーエラー');
            }
            res.redirect('/'); // ログインページにリダイレクト
        });
    });
});

// タイマーの計測時間をユーザーのデータに保存するエンドポイント
app.post('/save-time', (req, res) => {
    const { tag, timeSpent } = req.body;
    const username = req.session.username;  // セッションからユーザー名を取得

    if (!username) {
        return res.status(401).json({ message: 'ログインが必要です', success: false });  // JSON形式でエラーメッセージを返す
    }

    // ユーザーデータをJSONファイルから読み込む
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'サーバーエラー', success: false });  // JSON形式でエラーメッセージを返す
        }

        const users = JSON.parse(data);

        // ユーザーを探す
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(400).json({ message: 'ユーザーが見つかりません', success: false });  // JSON形式でエラーメッセージを返す
        }

        // タグ別計測時間を更新
        if (!user.tags[tag]) {
            user.tags[tag] = 0;
        }
        user.tags[tag] += timeSpent;  // 計測時間を追加

        // ユーザーの情報を更新
        fs.writeFile(usersFilePath, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: '計測データの保存に失敗しました', success: false });  // JSON形式でエラーメッセージを返す
            }
            res.status(200).json({ message: '計測データが保存されました', success: true });  // JSON形式で成功メッセージを返す
        });
    });
});


// timer.html のルーティング
app.get('/timer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'timer.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
