declare module 'react-resizable-panels' {
  import * as React from 'react';

  export interface PanelGroupProps {
    direction: 'horizontal' | 'vertical';
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    autoSaveId?: string;
  }
  export const PanelGroup: React.FC<PanelGroupProps>;

  export interface PanelProps {
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    collapsible?: boolean;
    collapsedSize?: number;
    onCollapse?: (collapsed: boolean) => void;
    onResize?: (size: number) => void;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
    order?: number;
  }
  export const Panel: React.FC<PanelProps>;

  export interface PanelResizeHandleProps {
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    id?: string;
  }
  export const PanelResizeHandle: React.FC<PanelResizeHandleProps>;
}
