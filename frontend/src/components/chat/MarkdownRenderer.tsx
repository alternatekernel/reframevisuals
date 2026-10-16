import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, ArrowRight } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onNavigate?: () => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onNavigate }) => {
  const navigate = useNavigate();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      navigate(href);
      onNavigate?.();
    } else {
      onNavigate?.();
    }
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Minimalist Tables
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto rounded-lg border border-black/5">
            <table className="min-w-full text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[#f9f9f9] border-b border-black/5">{children}</thead>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-black/5 last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-[#171717] font-semibold uppercase tracking-wider text-[10px]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-inherit">
            {children}
          </td>
        ),

        // Clean Links
        a: ({ href, children }) => {
          const isInternal = href?.startsWith('/');
          return (
            <a
              href={href}
              onClick={(e) => href && handleLinkClick(e, href)}
              className="text-blue-600 hover:underline underline-offset-2 font-medium"
            >
              {children}
              {isInternal && <ArrowRight size={10} className="inline ml-1 opacity-50" />}
            </a>
          );
        },

        // Clean Typography
        strong: ({ children }) => (
          <strong className="font-bold text-inherit">{children}</strong>
        ),
        p: ({ children }) => (
          <p className="my-1.5 text-inherit leading-relaxed">{children}</p>
        ),

        // Minimalist Lists
        ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-inherit">{children}</li>,

        // Clean Headers
        h1: ({ children }) => <h1 className="text-sm font-bold mt-3 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-bold mt-2 mb-1 uppercase tracking-tight">{children}</h2>,
        
        // Code
        code: ({ children }) => <code className="bg-black/5 px-1 rounded text-[11px] font-mono">{children}</code>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
