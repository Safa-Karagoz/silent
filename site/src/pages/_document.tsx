import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased text-text">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
