"use client";

import type { ReactNode } from "react";

interface ChatPanelOffsetContainerProps {
  children: ReactNode;
}

export function ChatPanelOffsetContainer({
  children,
}: ChatPanelOffsetContainerProps): JSX.Element {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background transition-[max-width] duration-300 ease-in-out">
      {children}
    </div>
  );
}
