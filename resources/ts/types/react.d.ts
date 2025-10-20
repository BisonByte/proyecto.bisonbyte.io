declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react' {
  export type ReactNode = JSX.Element | string | number | boolean | null | undefined | Iterable<ReactNode>;
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => JSX.Element;
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T;
  export function useRef<T>(initial?: T): { current: T };
  export function useLayoutEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export const StrictMode: FC<{ children?: ReactNode }>;
}

declare module 'react-dom/client' {
  import type { ReactNode } from 'react';
  export function createRoot(container: Element | DocumentFragment): {
    render(children: ReactNode): void;
  };
}
