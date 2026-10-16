import 'src/styles/global.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from 'src/auth/context';
import { AuthGate } from 'src/components/layout/AuthGate';

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthGate>
        <Component {...pageProps} />
      </AuthGate>
    </AuthProvider>
  );
}

export default App;
