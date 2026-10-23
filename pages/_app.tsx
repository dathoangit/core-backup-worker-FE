import 'src/styles/global.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from 'src/auth/context';
import { AuthGate } from 'src/components/layout/AuthGate';
import { ToastProvider } from 'src/components/ui/ToastProvider';

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate>
          <Component {...pageProps} />
        </AuthGate>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
