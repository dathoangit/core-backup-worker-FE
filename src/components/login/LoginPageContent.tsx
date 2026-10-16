import Head from 'next/head';
import Image from 'next/image';
import {
  APP_BRAND_SHORT_NAME,
  APP_BRAND_THEME,
  APP_LOGO_SRC,
  APP_ORG_NAME,
} from 'src/constants/branding';
import { LoginForm } from './LoginForm';

export function LoginPageContent() {
  return (
    <>
      <Head>
        <title>Đăng nhập</title>
        <meta
          name="description"
          content="Đăng nhập để truy cập hệ thống base application."
        />
      </Head>

      <div
        className={`flex min-h-screen flex-col ${APP_BRAND_THEME.header.bg} lg:flex-row`}>
        <aside
          className={`hidden flex-1 flex-col justify-between px-8 py-10 text-white lg:flex xl:px-12`}>
          <div>
            <Image
              src={APP_LOGO_SRC}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl bg-white/95 object-contain p-1"
            />
            <p className="mt-6 text-2xl font-bold">{APP_BRAND_SHORT_NAME}</p>
            <p className="mt-2 max-w-md text-sm text-red-100">{APP_ORG_NAME}</p>
          </div>
          <p className="text-xs text-red-100/80">
            Base starter shell — mở rộng module nghiệp vụ tại đây.
          </p>
        </aside>

        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:bg-slate-50 lg:py-12">
          <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <Image
                src={APP_LOGO_SRC}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-contain lg:hidden"
              />
              <h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
                Đăng nhập
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Nhập thông tin để truy cập hệ thống.
              </p>
            </div>

            <LoginForm />
          </section>
        </main>
      </div>
    </>
  );
}
