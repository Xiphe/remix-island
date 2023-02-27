import type { MetaFunction } from '@remix-run/cloudflare';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { createHead } from 'remix-island';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1',
});

export const Head = createHead(() => (
  <>
    <Meta />
    <Links />
  </>
));

export default function App() {
  return (
    <>
      <Head />
      <Outlet />
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
    </>
  );
}

export function CatchBoundary() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>This is a catch boundary!</h1>
      <p>
        <a href="/">Go back home</a>
      </p>
    </div>
  );
}
