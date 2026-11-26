"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { installPressFeedback } from "@/lib/press";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      toastOptions={{
        classNames: {
          toast: "!bg-overlay !text-fg !border-border !shadow-lg !rounded-lg !font-sans",
          description: "!text-fg-muted",
          error: "[&_[data-icon]]:!text-danger-text",
          success: "[&_[data-icon]]:!text-success-text",
          closeButton: "!bg-overlay !text-fg-muted !border-border",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: false },
        },
      }),
  );

  useEffect(() => installPressFeedback(), []);

  return (
    // next-themes injects a blocking script, so the right theme is applied before first paint.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <ThemedToaster />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
