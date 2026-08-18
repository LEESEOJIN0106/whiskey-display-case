const FIREBASE_AUTH_HOST = "whiskey-display-case.firebaseapp.com";

const CLOSE_WINDOW_SCRIPT = `<script>
(function () {
  function leave() {
    try {
      if (window.opener && !window.opener.closed) {
        window.close();
        return;
      }
    } catch (e) {}
    window.location.replace("/");
  }
  window.addEventListener("load", function () {
    setTimeout(leave, 1200);
  });
})();
</script>`;

async function proxyHandler(request: Request) {
  const incoming = new URL(request.url);
  const dest = new URL(`https://${FIREBASE_AUTH_HOST}/__/auth/handler`);
  dest.search = incoming.search;

  const init: RequestInit = {
    method: request.method,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
    const contentType = request.headers.get("content-type");
    if (contentType) {
      init.headers = { "Content-Type": contentType };
    }
  }

  const res = await fetch(dest, init);
  const html = await res.text();
  const nextHtml = html.includes("</body>")
    ? html.replace("</body>", `${CLOSE_WINDOW_SCRIPT}</body>`)
    : `${html}${CLOSE_WINDOW_SCRIPT}`;

  return new Response(nextHtml, {
    status: res.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "unsafe-none",
    },
  });
}

export async function GET(request: Request) {
  return proxyHandler(request);
}

export async function POST(request: Request) {
  return proxyHandler(request);
}
