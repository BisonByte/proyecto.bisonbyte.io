import type { ReactNode } from 'react';

interface DesignerLayoutProps {
  header?: ReactNode;
  canvas: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  footer?: ReactNode;
}

export const DesignerLayout = ({
  header,
  canvas,
  leftPanel,
  rightPanel,
  footer,
}: DesignerLayoutProps): JSX.Element => {
  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100">
      {header && <header className="border-b border-slate-800 bg-slate-900/80 p-4 backdrop-blur">{header}</header>}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {leftPanel && <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-slate-900 bg-slate-950/60 lg:block">{leftPanel}</aside>}
        <main className="flex-1 overflow-hidden">{canvas}</main>
        {rightPanel && <aside className="w-96 shrink-0 overflow-y-auto border-l border-slate-900 bg-slate-950/60">{rightPanel}</aside>}
      </div>
      {footer && <footer className="border-t border-slate-800 bg-slate-900/80 p-3 text-xs text-slate-400">{footer}</footer>}
    </div>
  );
};

export default DesignerLayout;
