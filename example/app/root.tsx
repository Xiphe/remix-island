import type { MetaFunction } from '@remix-run/node';
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
