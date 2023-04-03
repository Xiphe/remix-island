# remix-island

🚨 this package is a workaround to allow usage of remix with `react@(18.0 - 18.2)` which comes with a lot of hydration problems. I'll probably not maintain this for long after react@18.3 hopefully fixes this.

ref https://github.com/remix-run/remix/issues/5463, https://github.com/remix-run/remix/issues/5144, https://github.com/remix-run/remix/issues/4822, https://github.com/remix-run/remix/discussions/5244, https://github.com/facebook/react/issues/24430

---

utils to render remix into a dom-node (like `<div id="root"></div>`) instead of the whole `document`

This approach was pioneered by [@kiliman](https://github.com/kiliman) in [kiliman/remix-hydration-fix](https://github.com/kiliman/remix-hydration-fix) 🙏👍🎉

## install

```bash
npm i remix-island
```

## configure

#### 1. Stop rendering the whole html document from within remix

```diff
--- a/app/root.tsx
+++ b/app/root.tsx
@@ -7,6 +7,7 @@ import {
   Scripts,
   ScrollRestoration,
 } from '@remix-run/react';
+import { createHead } from 'remix-island';

 export const meta: MetaFunction = () => ({
   charset: 'utf-8',
@@ -14,19 +15,21 @@ export const meta: MetaFunction = () => ({
   viewport: 'width=device-width,initial-scale=1',
 });

+export const Head = createHead(() => (
+  <>
+    <Meta />
+    <Links />
+  </>
+));
+
 export default function App() {
   return (
-    <html lang="en">
-      <head>
-        <Meta />
-        <Links />
-      </head>
-      <body>
-        <Outlet />
-        <ScrollRestoration />
-        <Scripts />
-        <LiveReload />
-      </body>
-    </html>
+    <>
+      <Head />
+      <Outlet />
+      <ScrollRestoration />
+      <Scripts />
+      <LiveReload />
+    </>
   );
 }
```

#### 2. Manually render the `<Head />` and create the document

```diff
--- a/app/entry.server.tsx
+++ b/app/entry.server.tsx
@@ -4,6 +4,8 @@ import { Response } from '@remix-run/node';
 import { RemixServer } from '@remix-run/react';
 import isbot from 'isbot';
 import { renderToPipeableStream } from 'react-dom/server';
+import { renderHeadToString } from 'remix-island';
+import { Head } from './root';

 const ABORT_DELAY = 5000;

@@ -41,6 +43,7 @@ function handleBotRequest(
       <RemixServer context={remixContext} url={request.url} />,
       {
         onAllReady() {
+          const head = renderHeadToString({ request, remixContext, Head });
           const body = new PassThrough();

           responseHeaders.set('Content-Type', 'text/html');
@@ -51,8 +54,11 @@ function handleBotRequest(
               status: didError ? 500 : responseStatusCode,
             }),
           );

+          body.write(
+            `<!DOCTYPE html><html><head>${head}</head><body><div id="root">`,
+          );
           pipe(body);
+          body.write(`</div></body></html>`);
         },
         onShellError(error: unknown) {
           reject(error);
@@ -82,6 +88,7 @@ function handleBrowserRequest(
       <RemixServer context={remixContext} url={request.url} />,
       {
         onShellReady() {
+          const head = renderHeadToString({ request, remixContext, Head });
           const body = new PassThrough();

           responseHeaders.set('Content-Type', 'text/html');
@@ -93,7 +100,11 @@ function handleBrowserRequest(
             }),
           );

+          body.write(
+            `<!DOCTYPE html><html><head>${head}</head><body><div id="root">`,
+          );
           pipe(body);
+          body.write(`</div></body></html>`);
         },
         onShellError(err: unknown) {
           reject(err);
```

#### 3. hydrate `<div id="root">`

```diff
--- a/app/entry.client.tsx
+++ b/app/entry.client.tsx
@@ -5,7 +5,7 @@ import { hydrateRoot } from 'react-dom/client';
 function hydrate() {
   startTransition(() => {
     hydrateRoot(
-      document,
+      document.getElementById('root')!,
       <StrictMode>
         <RemixBrowser />
       </StrictMode>,
```

#### 4. Value 💰

## pitfalls/notes

#### TL;DR:

Everything that does not need to be managed by remix should be placed before `${head}` in `entry.server.tsx`.

#### Order of elements in head might change

The remix-managed `<Head />` which includes all the stuff from `MetaFunction` and `LinksFunction` will move to the end of `<head />` once the client is hydrated. If you combine this with other libraries that inject elements into the head (like `styled-components`) this might lead to unexpected behaviour.
Move all global styles out of remix into the static `<head />` to minimize impact of this.

#### Scripts might run twice

Due to how this "hack" is working, if you have other bootstrap scripts (for example [raygun](https://github.com/Xiphe/remix-island/issues/4)). These might run twice. Move them out of remix into the static `<head />` to prevent this.

#### Flash of unstyled content

Some users of this notice a flash of unstyled content when remix manages some of the CSS. We found that [most of the time this only happens in development](https://github.com/Xiphe/remix-island/issues/2) with browser cache disabled. When you observe something like this in production with cache enabled try moving all global styles out of remix into the static `<head />`.

#### Usage with Stitches

@louisremi found out that for stitches it's required to [render the `<Head />` after the rest of the document (#11)](https://github.com/Xiphe/remix-island/issues/11)

