export async function onRequest(context) {
  const { request, next, env } = context;

  // Cloudflareの管理画面（Variables and secrets）から取得
  const USERNAME = env.BASIC_USER;
  const PASSWORD = env.BASIC_PASSWORD;

  // 環境変数が未設定の場合は安全のためアクセスを遮断
  if (!USERNAME || !PASSWORD) {
    return new Response("Configuration Error: Credentials are not set in Cloudflare.", {
      status: 500,
    });
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Access to site"',
      },
    });
  }

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return new Response("Bad Request", { status: 400 });
  }

  // Base64デコード
  const decoded = atob(encoded);
  const [user, pass] = decoded.split(":");

  // 一致していればサイトを表示
  if (user === USERNAME && pass === PASSWORD) {
    return next();
  }

  // 不一致なら再度ログイン画面を表示
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Access to site"',
    },
  });
}
