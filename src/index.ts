import type { EntryContext } from '@remix-run/server-runtime';
import type { ComponentType } from 'react';
import { createElement, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { RemixServer } from '@remix-run/react';
import { renderToString } from 'react-dom/server';

type HeadComponent = ComponentType<{
  __remix_island_render_server?: boolean;
}> & {
  __remix_island_id?: string;
};

let globalMounted = false;
export interface CreateHeadOpts {
  id?: string;
  cleanup?: boolean;
}
export function createHead(
  Comp: ComponentType,
  { id = 'remix-island', cleanup = true }: CreateHeadOpts = {},
): HeadComponent {
  const Head: HeadComponent = (props) => {
    const [mounted, setMounted] = useState(globalMounted);
    useEffect(() => {
      if (cleanup) {
        removeOldHead(Head);
      }
      globalMounted = true;
      setMounted(true);
    }, []);

    if (!mounted && props.__remix_island_render_server) {
      return createElement(Comp);
    }

    if (mounted) {
      return createPortal(createElement(Comp), document.head);
    }

    return null;
  };

  Head.displayName = 'RemixIslandHead';
  Head.__remix_island_id = id;

  return Head;
}

export interface RenderHeadToStringOpts {
  request: Request;
  remixContext: EntryContext;
  Head: HeadComponent;
}

export function renderHeadToString({
  request,
  remixContext,
  Head,
}: RenderHeadToStringOpts) {
  const head = renderToString(
    createElement(RemixServer, {
      context: switchRootComponent(remixContext, Head),
      url: request.url,
    }),
  );
  const id = Head.__remix_island_id;
  return `<!--${id}-start-->${head}<!--${id}-end-->`;
}

export function switchRootComponent(
  remixContext: EntryContext,
  Head: HeadComponent,
): EntryContext {
  return {
    ...remixContext,
    routeModules: {
      ...remixContext.routeModules,
      root: {
        ...remixContext.routeModules.root,
        default: () =>
          createElement(Head, { __remix_island_render_server: true }),
      },
    },
  };
}

export function removeOldHead(
  Head: HeadComponent,
  parent: HTMLElement = document.head,
) {
  let foundOldHeader = false;
  const nodesToRemove: ChildNode[] = [];
  const id = Head.__remix_island_id;
  for (const node of parent.childNodes) {
    if (!foundOldHeader && node.nodeName !== '#comment') {
      continue;
    }
    if (
      foundOldHeader &&
      node.nodeName === '#comment' &&
      node.nodeValue === `${id}-end`
    ) {
      nodesToRemove.push(node);
      break;
    }
    if (
      foundOldHeader ||
      (node.nodeName === '#comment' && node.nodeValue === `${id}-start`)
    ) {
      foundOldHeader = true;
      nodesToRemove.push(node);
    }
  }
  for (const node of nodesToRemove) {
    node.remove();
  }
}
