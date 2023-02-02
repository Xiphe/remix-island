import type { EntryContext } from '@remix-run/server-runtime';
import type { ComponentType } from 'react';
import { createElement, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const RENDER_ON_SERVER = Symbol();
type HeadComponent = ComponentType<{ [RENDER_ON_SERVER]?: boolean }>;

let globalMounted = false;
export function createHead(Comp: ComponentType): HeadComponent {
  return function Head({ [RENDER_ON_SERVER]: renderOnServer }) {
    const [mounted, setMounted] = useState(globalMounted);
    useEffect(() => {
      globalMounted = true;
      setMounted(true);
    }, []);

    if (!mounted && renderOnServer) {
      return createElement(Comp);
    }

    if (mounted) {
      return createPortal(createElement(Comp), document.head);
    }

    return null;
  };
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
        default: () => createElement(Head, { [RENDER_ON_SERVER]: true }),
      },
    },
  };
}

const DEFAULT_ID = 'remix-head';

export function markForRemoval(content: string, id: string = DEFAULT_ID) {
  return `<!--${id}-start-->${content}<!--${id}-end-->`;
}

export function removeMarked(parent: HTMLElement, id: string = DEFAULT_ID) {
  let foundOldHeader = false;
  const nodesToRemove: ChildNode[] = [];
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
