// =============================================================================
//  Demo — CodeBlock with syntax highlighting (no external dep)
// =============================================================================

import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#0d1117',
        border: '1px solid #21262d',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: '#161b22',
          borderBottom: '1px solid #21262d',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#8b949e',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {language}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            background: 'transparent',
            border: '1px solid #30363d',
            borderRadius: 4,
            color: copied ? '#3fb950' : '#8b949e',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="3" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="#0d1117"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <pre
        style={{
          margin: 0,
          padding: '16px 18px',
          overflow: 'auto',
          fontSize: 12.5,
          lineHeight: 1.75,
          fontFamily: "'DM Mono', 'Fira Code', monospace",
          color: '#e6edf3',
          tabSize: 2,
        }}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
