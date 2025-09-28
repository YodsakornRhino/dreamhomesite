"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface ChatParticipant {
  name: string;
  avatarUrl?: string;
}

interface ChatPanelContextValue {
  isOpen: boolean;
  participant: ChatParticipant | null;
  open: () => void;
  openWith: (participant: ChatParticipant) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
  setParticipant: (participant: ChatParticipant | null) => void;
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
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const openWith = useCallback((nextParticipant: ChatParticipant) => {
    setParticipant(nextParticipant);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    setParticipant(null);
  }, []);
  const setOpen = useCallback((next: boolean) => setIsOpen(next), []);
  const handleSetParticipant = useCallback(
    (nextParticipant: ChatParticipant | null) => {
      setParticipant(nextParticipant);
    },
    [],
  );

  const value = useMemo<ChatPanelContextValue>(
    () => ({
      isOpen,
      open,
      openWith,
      close,
      setOpen,
      participant,
      setParticipant: handleSetParticipant,
    }),
    [close, handleSetParticipant, isOpen, open, openWith, participant, setOpen],
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

export const CHAT_WIDGET_OFFSET_CLASS =
  "lg:right-[calc(var(--chat-panel-width,28rem)+var(--chat-panel-gutter,1.5rem))]";
