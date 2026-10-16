import { Html, Head, Main, NextScript } from 'next/document';
import { APP_FAVICON_SRC } from 'src/constants/branding';

export default function Document() {
  return (
    <Html lang="vi" style={{ fontSize: '16px' }}>
      <Head>
        <link rel="icon" href={APP_FAVICON_SRC} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
