import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { useEffect, useState, useCallback } from 'react';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Link as LinkIcon,
  List, ListOrdered, Quote, Code, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, Code2,
  Heading2, Heading3, Minus
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors text-sm ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-slate-600 hover:text-white'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-600 mx-0.5" />;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(content);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article content here…' }),
    ],
    content,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      setSourceHtml(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none min-h-[400px] px-4 py-3 text-slate-100',
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content, false);
      setSourceHtml(content);
    }
  }, [content, editor]);

  const applySourceHtml = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(sourceHtml, false);
    onChange(sourceHtml);
    setShowSource(false);
  }, [editor, sourceHtml, onChange]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().setLink({ href: url }).run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const wordCount = editor
    ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length
    : 0;

  if (!editor) return null;

  return (
    <div className="rich-editor-wrap border border-slate-600 rounded-lg overflow-hidden bg-slate-700">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-slate-750 border-b border-slate-600 bg-slate-800">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (⌘U)">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkInput(v => !v);
            }
          }}
          active={editor.isActive('link')}
          title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (⌘Z)">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (⌘⇧Z)">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">{wordCount.toLocaleString()} words</span>
          <button
            type="button"
            onClick={() => {
              if (!showSource) {
                setSourceHtml(editor.getHTML());
              }
              setShowSource(v => !v);
            }}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              showSource
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {'</>'}
          </button>
        </div>
      </div>

      {/* Link Input Bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-600">
          <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setLink(); if (e.key === 'Escape') setShowLinkInput(false); }}
            placeholder="https://example.com"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
            autoFocus
          />
          <button onClick={setLink} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Apply</button>
          <button onClick={() => setShowLinkInput(false)} className="text-xs px-2 py-1 border border-slate-600 text-slate-400 rounded hover:bg-slate-700 transition-colors">Cancel</button>
        </div>
      )}

      {/* Editor / Source */}
      {showSource ? (
        <div className="flex flex-col">
          <textarea
            value={sourceHtml}
            onChange={e => setSourceHtml(e.target.value)}
            rows={20}
            className="w-full bg-slate-900 text-slate-200 font-mono text-xs px-4 py-3 resize-y focus:outline-none border-b border-slate-600"
            spellCheck={false}
          />
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800">
            <button onClick={applySourceHtml} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Apply HTML</button>
            <button onClick={() => setShowSource(false)} className="text-xs px-3 py-1.5 border border-slate-600 text-slate-400 rounded hover:bg-slate-700 transition-colors">Cancel</button>
            <span className="text-xs text-slate-500 ml-auto">Editing raw HTML — click Apply to render</span>
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} className="rich-editor-content" />
      )}
    </div>
  );
}
