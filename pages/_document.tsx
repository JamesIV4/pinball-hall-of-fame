import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head>
        {/* Full‑screen iOS PWA tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="imgs/pinball-icon-192.png" />
        <link rel="icon" sizes="192x192" href="imgs/pinball-icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="imgs/pinball-icon-512.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-..."
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>
      <body className="min-h-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
