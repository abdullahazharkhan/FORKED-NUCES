import { config, type ToolbarNames } from "md-editor-rt";
import sanitizeHtml from "sanitize-html";

type MarkdownItLike = {
    set(options: { html: boolean }): unknown;
};

export function disableUnsafeMarkdownHtml(markdown: MarkdownItLike): void {
    markdown.set({ html: false });
}

// Raw HTML is disabled at the parser boundary. The same explicit allowlist then
// sanitizes generated/plugin HTML during SSR and in the browser.
config({ markdownItConfig: disableUnsafeMarkdownHtml });

export function sanitizeMarkdownHtml(html: string): string {
    return sanitizeHtml(html, {
        allowedAttributes: {
            a: ["href", "title"],
            code: ["class"],
            img: ["alt", "height", "src", "title", "width"],
            ol: ["start"],
            td: ["colspan", "rowspan"],
            th: ["colspan", "rowspan", "scope"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        allowProtocolRelative: false,
        allowedTags: [
            "a",
            "blockquote",
            "br",
            "code",
            "del",
            "em",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "hr",
            "img",
            "li",
            "ol",
            "p",
            "pre",
            "s",
            "strong",
            "table",
            "tbody",
            "td",
            "th",
            "thead",
            "tr",
            "ul",
        ],
        disallowedTagsMode: "discard",
    });
}

export const untrustedMarkdownPreviewProps = {
    noEcharts: true,
    noHighlight: true,
    noKatex: true,
    noMermaid: true,
    sanitize: sanitizeMarkdownHtml,
} as const;

const markdownToolbarExclusions: ToolbarNames[] = ["fullscreen"];

export const untrustedMarkdownEditorProps = {
    ...untrustedMarkdownPreviewProps,
    // These optional tools otherwise download scripts and styles at runtime,
    // which is intentionally blocked by the application's CSP.
    noPrettier: true,
    noUploadImg: true,
    toolbarsExclude: markdownToolbarExclusions,
};
