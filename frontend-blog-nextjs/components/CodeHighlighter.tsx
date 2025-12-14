'use client';

import { useEffect } from 'react';
import Prism from 'prismjs';

// Import Prism themes and language support
import 'prismjs/themes/prism-tomorrow.css';

// Import language support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-docker';

interface CodeHighlighterProps {
    /** Selector for the container with code blocks */
    containerSelector?: string;
}

export default function CodeHighlighter({ containerSelector = '#post-content' }: CodeHighlighterProps) {
    useEffect(() => {
        // Highlight all code blocks when content changes
        const highlightCode = () => {
            const container = document.querySelector(containerSelector);
            if (container) {
                // Find all pre > code blocks
                const codeBlocks = container.querySelectorAll('pre code');
                codeBlocks.forEach((block) => {
                    // Add language class if not present
                    if (!block.className.includes('language-')) {
                        block.classList.add('language-javascript'); // default
                    }
                    Prism.highlightElement(block as Element);
                });
            }
        };

        // Run after DOM is ready
        const timeoutId = setTimeout(highlightCode, 100);

        return () => clearTimeout(timeoutId);
    }, [containerSelector]);

    return null;
}
