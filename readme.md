# remix-island

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

#### Order of elements in head might change

The remix-managed `<Head />` which includes all the stuff from `MetaFunction` and `LinksFunction` will move to the end of `<head />` once the client is hydrated. If you combine this with other libraries that inject elements into the head (like `styled-components`) this might lead to unexpected behaviour.

For me it works quite well to move everything global out of `root.tsx` and put it before `${head}` in `entry.server.ts`
