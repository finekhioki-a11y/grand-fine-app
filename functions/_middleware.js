export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Cloudflareの環境変数から取得（なければデフォルト値）
  const USERNAME = env.BASIC_USER || "gftoyonaka";
  const PASSWORD = env.BASIC_PASSWORD || "0516";
  const COOKIE_NAME = "site_auth_session";
  const AUTH_KEY = "grand_fine_authorized_token";

  // Cookieを取得
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [k, ...v] = c.split("=");
      return [k, v.join("=")];
    })
  );

  // ログアウト処理（もしURL末尾に ?logout とつけたらログアウト）
  if (url.searchParams.get("logout") !== null) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      },
    });
  }

  // ログイン済み判定（Cookieを持っている場合）
  if (cookies[COOKIE_NAME] === AUTH_KEY) {
    return next();
  }

  let errorMessage = "";

  // ログインフォームから送信されたときの処理
  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const user = formData.get("username");
      const pass = formData.get("password");

      if (user === USERNAME && pass === PASSWORD) {
        // ログイン成功！Cookieを発行して30日間保持
        return new Response(null, {
          status: 302,
          headers: {
            Location: url.pathname,
            "Set-Cookie": `${COOKIE_NAME}=${AUTH_KEY}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
          },
        });
      } else {
        errorMessage = "IDまたはパスワードが正しくありません";
      }
    } catch (e) {
      errorMessage = "エラーが発生しました。もう一度お試しください。";
    }
  }

  // オシャレなログイン画面（HTML / CSS）
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ログイン | Grand Fine App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #ffffff;
      width: 100%;
      max-width: 380px;
      padding: 36px 28px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      text-align: center;
    }
    .icon-badge {
      width: 54px;
      height: 54px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
    p.desc { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .error {
      background: #fef2f2;
      color: #dc2626;
      font-size: 13px;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 18px;
      border: 1px solid #fee2e2;
    }
    .field { margin-bottom: 16px; text-align: left; }
    label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
    }
    input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    button {
      width: 100%;
      padding: 13px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      transition: all 0.2s;
    }
    button:hover { background: #1d4ed8; }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
    </div>
    <h1>Grand Fine App</h1>
    <p class="desc">認証情報を入力してください</p>

    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}

    <form method="POST">
      <div class="field">
        <label for="username">ID（ユーザー名）</label>
        <input type="text" id="username" name="username" required autocomplete="username" placeholder="IDを入力">
      </div>
      <div class="field">
        <label for="password">パスワード</label>
        <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="パスワードを入力">
      </div>
      <button type="submit">ログイン</button>
    </form>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
