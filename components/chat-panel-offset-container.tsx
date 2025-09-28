"use client";

import type { ReactNode } from "react";

import {
  CHAT_PANEL_PADDING_CLASS,
  useChatPanel,
} from "@/contexts/chat-panel-context";
import { cn } from "@/lib/utils";

interface ChatPanelOffsetContainerProps {
  children: ReactNode;
}

export function ChatPanelOffsetContainer({
  children,
}: ChatPanelOffsetContainerProps): JSX.Element {
  const { isOpen } = useChatPanel();

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-[padding] duration-300 ease-in-out",
        isOpen ? CHAT_PANEL_PADDING_CLASS : undefined,
      )}
    >
      {children}
    </div>
  );
}
