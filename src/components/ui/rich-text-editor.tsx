"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
  PiListBullets,
  PiListNumbers,
  PiTextB,
  PiTextItalic,
  PiTextStrikethrough,
} from "react-icons/pi";

const EXTENSIONS = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: false,
  }),
  Placeholder.configure({ placeholder: "Adicione detalhes..." }),
];

export function RichTextEditor({
  value,
  onChange,
  editable = true,
  className,
}: {
  value?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  className?: string;
}) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value ?? "",
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "rte-content min-h-24 px-3 py-2 text-sm outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const next = value ?? "";
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg ${editable ? "border border-border bg-surface focus-within:border-accent" : ""} ${className ?? ""}`}
    >
      {editable && (
        <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <PiTextB size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <PiTextItalic size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <PiTextStrikethrough size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <PiListBullets size={15} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <PiListNumbers size={15} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-accent-soft text-accent"
          : "text-foreground-muted hover:bg-surface-muted hover:text-foreground-strong"
      }`}
    >
      {children}
    </button>
  );
}
