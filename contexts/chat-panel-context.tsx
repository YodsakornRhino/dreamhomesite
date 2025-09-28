"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface ChatPanelContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
}

const ChatPanelContext = createContext<ChatPanelContextValue | undefined>(
  undefined,
);

export function ChatPanelProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const setOpen = useCallback((next: boolean) => setIsOpen(next), []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const value = useMemo<ChatPanelContextValue>(
    () => ({
      isOpen,
      open,
      close,
      setOpen,
    }),
    [close, isOpen, open, setOpen],
  );

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export function useChatPanel(): ChatPanelContextValue {
  const context = useContext(ChatPanelContext);

  if (!context) {
    throw new Error("useChatPanel must be used within a ChatPanelProvider");
  }

  return context;
}

export const CHAT_PANEL_PADDING_CLASS = "lg:pr-[28rem]";
export const CHAT_WIDGET_OFFSET_CLASS = "lg:right-[calc(28rem+1.5rem)]";
