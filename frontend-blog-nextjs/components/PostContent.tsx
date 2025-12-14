'use client';

import { useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import Prism from 'prismjs';

// Import Prism theme
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

interface PostContentProps {
    html: string;
}

export default function PostContent({ html }: PostContentProps) {
    useEffect(() => {
        // Highlight all code blocks after render
        const container = document.getElementById('post-content');
        if (container) {
            const codeBlocks = container.querySelectorAll('pre code');
            codeBlocks.forEach((block) => {
                // If no language class, try to detect or default to plaintext
                if (!block.className.includes('language-')) {
                    block.classList.add('language-javascript');
                }
                Prism.highlightElement(block as Element);
            });
        }
    }, [html]);

    return (
        <div
            id="post-content"
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(html, {
                    ADD_TAGS: ['video', 'source'],
                    ADD_ATTR: ['controls', 'src', 'type', 'width', 'height', 'poster']
                })
            }}
        />
    );
}
