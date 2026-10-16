import { useRouter } from 'next/router';
import { useState, type FormEvent } from 'react';
import { useAuth } from 'src/auth/context';
import { getDefaultLandingPath } from 'src/auth/role-routing';
import { ApiError, formatApiErrorPayload } from 'src/utils/api';

const INVALID_CREDENTIALS_MESSAGE = 'Sai tên đăng nhập hoặc mật khẩu.';

function resolveLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const apiMessage = formatApiErrorPayload(error.payload) ?? error.message;

    if (error.status === 401 || apiMessage === 'Invalid credentials') {
      return INVALID_CREDENTIALS_MESSAGE;
    }

    return apiMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Đăng nhập thất bại. Vui lòng thử lại.';
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password.trim()) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    setPending(true);
    try {
      const me = await login({
        username: normalizedUsername,
        password,
      });
      await router.replace(getDefaultLandingPath(me.role));
    } catch (err) {
      setError(resolveLoginErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-slate-700">
          Tên đăng nhập hoặc email
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}
