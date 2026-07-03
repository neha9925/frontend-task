"use client";

import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface AISummaryProps {
  taskId: string;
  apiBase: string;
}

export default function AISummary({ taskId, apiBase }: AISummaryProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${apiBase}/api/tasks/${taskId}/summary`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const chunk = JSON.parse(event.data);
        setSummary((prev) => prev + chunk);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    es.addEventListener("done", () => {
      setStreaming(false);
      setLoading(false);
      es.close();
    });

    es.onerror = () => {
      setError("Unable to load AI summary.");
      setStreaming(false);
      setLoading(false);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [taskId, apiBase]);

  const sanitizedSummary = DOMPurify.sanitize(summary, {
    ALLOWED_TAGS: ["p", "h1", "h2", "h3", "ul", "ol", "li", "strong", "em", "code", "pre", "span", "img", "br"],
    ALLOWED_ATTR: ["src", "alt", "class", "href"],
  });

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 p-6 shadow-sm overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {streaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${streaming ? "bg-emerald-500" : "bg-blue-500"}`}></span>
          </span>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm md:text-base">
            {streaming ? "Streaming AI Summary..." : "AI Summary"}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          {streaming ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Loader2 className="animate-spin" size={14} />
              Receiving...
            </span>
          ) : error ? (
            <span className="flex items-center gap-1 text-rose-500">
              <AlertCircle size={14} />
              Failed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <CheckCircle2 size={14} />
              Complete
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading && summary === "" ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={24} />
            <p className="text-xs">Initializing...</p>
          </div>
        ) : error && summary === "" ? (
          <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm border border-rose-100 dark:border-rose-950/50">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base text-slate-600 dark:text-slate-300 space-y-4">
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              components={{
                h2: ({ node, ...props }) => {
                  void node;
                  return <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-4 mb-2 first:mt-0" {...props} />;
                },
                p: ({ node, ...props }) => {
                  void node;
                  return <p className="my-2 leading-relaxed" {...props} />;
                },
                ul: ({ node, ...props }) => {
                  void node;
                  return <ul className="list-disc pl-5 my-2 space-y-1" {...props} />;
                },
                ol: ({ node, ...props }) => {
                  void node;
                  return <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />;
                },
                li: ({ node, ...props }) => {
                  void node;
                  return <li className="pl-1" {...props} />;
                },
                strong: ({ node, ...props }) => {
                  void node;
                  return <strong className="font-semibold text-slate-800 dark:text-slate-100" {...props} />;
                },
                code: ({ node, className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { node?: unknown }) => {
                  void node;
                  const match = /language-(\w+)/.exec(className || "");
                  const content = String(children || "");
                  const isInline = !match && !content.includes("\n");
                  return isInline ? (
                    <code className="bg-slate-100 dark:bg-slate-900 text-rose-500 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3 border border-slate-900">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  );
                },
                img: ({ node, alt, ...props }) => {
                  void node;
                  return (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img alt={alt || "AI generated summary image"} className="max-w-full h-auto rounded-lg border border-slate-200 dark:border-slate-900 my-4 shadow-sm" {...props} />
                  );
                },
              }}
            >
              {sanitizedSummary}
            </ReactMarkdown>

            {streaming && (
              <span className="inline-block h-4 w-1.5 bg-slate-400 dark:bg-slate-600 animate-pulse ml-0.5 align-middle"></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
