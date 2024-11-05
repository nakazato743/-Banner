const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// JSONファイルのパス
const usersFilePath = path.join(__dirname, 'users.json');

// ミドルウェア設定
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ユーザー登録エンドポイント
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // ユーザー情報を読み込む
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'ファイルの読み込みに失敗しました。' });
        }

        const users = JSON.parse(data);
        // ユーザー名の重複チェック
        if (users.some(user => user.username === username)) {
            return res.status(400).json({ message: 'そのユーザー名はすでに存在します。' });
        }

        // 新しいユーザーを追加
        users.push({ username, password });
        fs.writeFile(usersFilePath, JSON.stringify(users), (err) => {
            if (err) {
                return res.status(500).json({ message: 'ファイルの書き込みに失敗しました。' });
            }
            res.status(201).json({ message: '登録が完了しました。' });
        });
    });
});

// ログインエンドポイント
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // ユーザー情報を読み込む
    fs.readFile(usersFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'ファイルの読み込みに失敗しました。' });
        }

        const users = JSON.parse(data);
        const user = users.find(user => user.username === username && user.password === password);

        if (user) {
            // ログイン成功時にJSONレスポンスを返す
            return res.status(201).json({ message: 'ログイン成功' });
        } else {
            return res.status(401).json({ message: 'ユーザー名またはパスワードが間違っています。' });
        }
    });
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
