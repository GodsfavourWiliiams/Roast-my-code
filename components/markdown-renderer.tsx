"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css' // You can change this to any highlight.js theme
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre: ({ children }) => (
            <pre className="rounded-lg bg-muted/50 p-4 overflow-x-auto border border-border/50 font-mono text-xs leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ children, className }) => {
            const isInline = !className
            return isInline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-[0.8em]">
                {children}
              </code>
            ) : (
              <code className={className}>{children}</code>
            )
          },
          h1: ({ children }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-6">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-4">{children}</h3>,
          p: ({ children }) => <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
