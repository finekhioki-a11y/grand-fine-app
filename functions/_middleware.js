export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // ★重要: ChromeのPWA判定・アイコン読み込みはパスワード不要で通過させる★
  const pathname = url.pathname;
  if (
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico")
  ) {
    return next();
  }

  const USERNAME = env.BASIC_USER || "gftoyonaka";
  const PASSWORD = env.BASIC_PASSWORD || "0516";
  const COOKIE_NAME = "site_auth_session";
  const AUTH_KEY = "grand_fine_authorized_token";

  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [k, ...v] = c.split("=");
      return [k, v.join("=")];
    })
  );

  if (url.searchParams.get("logout") !== null) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      },
    });
  }

  // ログイン済みなら通過
  if (cookies[COOKIE_NAME] === AUTH_KEY) {
    return next();
  }

  let errorMessage = "";

  if (request.method === "POST") {
    try {
      const formData = await request.formData();
      const user = formData.get("username");
      const pass = formData.get("password");

      if (user === USERNAME && pass === PASSWORD) {
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
      errorMessage = "エラーが発生しました。";
    }
  }

  // ログイン画面
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ログイン | Grand Fine App</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
    body { background: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #ffffff; width: 100%; max-width: 380px; padding: 36px 28px; border-radius: 20px; text-align: center; }
    h1 { font-size: 20px; color: #0f172a; margin-bottom: 8px; }
    .error { color: #dc2626; font-size: 13px; margin-bottom: 15px; }
    .field { margin-bottom: 16px; text-align: left; }
    label { display: block; font-size: 12px; margin-bottom: 6px; color: #475569; }
    input { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; }
    button { width: 100%; padding: 13px; background: #2563eb; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: bold; cursor: pointer; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>グランドファイン豊中</h1>
    <p style="font-size:13px; color:#64748b; margin-bottom:20px;">ログインしてください</p>
    ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}
    <form method="POST">
      <div class="field">
        <label>ID</label>
        <input type="text" name="username" required placeholder="IDを入力">
      </div>
      <div class="field">
        <label>パスワード</label>
        <input type="password" name="password" required placeholder="パスワードを入力">
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
