import 'src/styles/global.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from 'src/auth/context';
import { AuthGate } from 'src/components/layout/AuthGate';
import { ToastProvider } from 'src/components/ui/ToastProvider';
import { I18nProvider } from 'src/i18n/I18nProvider';

function App({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <AuthGate>
            <Component {...pageProps} />
          </AuthGate>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
