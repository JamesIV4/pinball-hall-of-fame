import { Html, Head, Main, NextScript } from "next/document";

const repo = "pinball-hall-of-fame";
const isProd = process.env.NODE_ENV === "production";
const assetPrefix = isProd ? `/${repo}` : "";

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head>
        {/* Full‑screen iOS PWA tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <title>Pinball Hall of Fame</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-..."
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </Head>
      <body className="min-h-full">
        <style jsx global>{`
          @font-face {
            font-family: 'DotMatrix';
            src: url('${assetPrefix}/fonts/pinside-dotmatrix-webfont.woff2') format('woff2'),
                 url('${assetPrefix}/fonts/pinside-dotmatrix-webfont.woff') format('woff'), 
                 url('${assetPrefix}/fonts/pinside-dotmatrix-webfont.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
          }
        `}</style>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
