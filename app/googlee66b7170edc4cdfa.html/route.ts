export function GET() {
  return new Response(
    "google-site-verification: googlee66b7170edc4cdfa.html\n",
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}
