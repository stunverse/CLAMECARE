"use client";

import { useRef, useState, useEffect, useTransition } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendCoachMessage } from "@/lib/ai/coach-actions";
import { COACH_QUICK_PROMPTS } from "@/lib/ai/coach";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/ai/provider";

export function AIChatCoach({
  claimId,
  initialMessages,
}: {
  claimId: string;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    const history = messages;
    setMessages((m) => [...m, { role: "user", content }]);
    setInput("");
    startTransition(async () => {
      const res = await sendCoachMessage({ claimId, content, history });
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            res.reply ??
            res.error ??
            "Sorry, I couldn't respond just now. Please try again.",
        },
      ]);
    });
  }

  return (
    <div className="flex h-[34rem] flex-col rounded-xl border border-border bg-card">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-accent text-brand">
              <Sparkles className="size-6" />
            </span>
            <p className="font-medium">Ask your AI Claim Coach</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              I know the details of this claim. Ask what to do next, why it was
              denied, or how to respond.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 border-t border-border px-4 pt-3">
        {COACH_QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            disabled={pending}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this claim…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" variant="brand" size="icon" disabled={pending}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
