export async function onRequest(context) {
  const { request, next, env } = context;

  // 設定したい ID と パスワード（必要に応じて変更してください）
  const USERNAME = env.BASIC_USER || "admin";
  const PASSWORD = env.BASIC_PASSWORD || "password1234";

  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Access to staging site"',
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

  if (user === USERNAME && pass === PASSWORD) {
    return next();
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Access to staging site"',
    },
  });
}
