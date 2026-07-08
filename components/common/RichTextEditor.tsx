"use client";

import { useState } from "react";
import { useEditor, EditorContent, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: { onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rich-text-editor-btn${active ? " rich-text-editor-btn--active" : ""}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [textColor, setTextColor] = useState("#1e293b");
  const [highlightColor, setHighlightColor] = useState("#fef08a");

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      underline: ctx.editor.isActive("underline"),
      strike: ctx.editor.isActive("strike"),
      subscript: ctx.editor.isActive("subscript"),
      superscript: ctx.editor.isActive("superscript"),
      highlight: ctx.editor.isActive("highlight"),
      heading1: ctx.editor.isActive("heading", { level: 1 }),
      heading2: ctx.editor.isActive("heading", { level: 2 }),
      heading3: ctx.editor.isActive("heading", { level: 3 }),
      paragraph: ctx.editor.isActive("paragraph"),
      bulletList: ctx.editor.isActive("bulletList"),
      orderedList: ctx.editor.isActive("orderedList"),
      taskList: ctx.editor.isActive("taskList"),
      blockquote: ctx.editor.isActive("blockquote"),
      codeBlock: ctx.editor.isActive("codeBlock"),
      alignLeft: ctx.editor.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor.isActive({ textAlign: "center" }),
      alignRight: ctx.editor.isActive({ textAlign: "right" }),
      alignJustify: ctx.editor.isActive({ textAlign: "justify" }),
      link: ctx.editor.isActive("link"),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
      inTable: ctx.editor.isActive("table"),
    }),
  });

  function setLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previousUrl ?? "");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function addImage() {
    const url = window.prompt("URL de la imagen");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  return (
    <div className="rich-text-editor-toolbar">
      <ToolbarButton title="Deshacer" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <i className="pi pi-undo" />
      </ToolbarButton>
      <ToolbarButton title="Rehacer" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <i className="pi pi-undo" style={{ transform: "scaleX(-1)" }} />
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Negrita" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <i className="pi pi-bold" />
      </ToolbarButton>
      <ToolbarButton title="Cursiva" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i className="pi pi-italic" />
      </ToolbarButton>
      <ToolbarButton title="Subrayado" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <i className="pi pi-underline" />
      </ToolbarButton>
      <ToolbarButton title="Tachado" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        S
      </ToolbarButton>
      <ToolbarButton title="Subíndice" active={state.subscript} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        X<sub>2</sub>
      </ToolbarButton>
      <ToolbarButton title="Superíndice" active={state.superscript} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        X<sup>2</sup>
      </ToolbarButton>
      <label className="rich-text-editor-color" title="Color de texto">
        <i className="pi pi-palette" />
        <input
          type="color"
          value={textColor}
          onChange={(e) => { setTextColor(e.target.value); editor.chain().focus().setColor(e.target.value).run(); }}
        />
      </label>
      <label className="rich-text-editor-color" title="Resaltar texto">
        <i className="pi pi-pencil" style={{ background: highlightColor, borderRadius: 3 }} />
        <input
          type="color"
          value={highlightColor}
          onChange={(e) => { setHighlightColor(e.target.value); editor.chain().focus().setHighlight({ color: e.target.value }).run(); }}
        />
      </label>
      <ToolbarButton title="Quitar resaltado" active={state.highlight} onClick={() => editor.chain().focus().unsetHighlight().run()}>
        <i className="pi pi-eraser" style={{ fontSize: "0.7rem" }} />
      </ToolbarButton>
      <ToolbarButton title="Limpiar formato" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        <i className="pi pi-refresh" />
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Párrafo" active={state.paragraph} onClick={() => editor.chain().focus().setParagraph().run()}>
        P
      </ToolbarButton>
      <ToolbarButton title="Título 1" active={state.heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolbarButton>
      <ToolbarButton title="Título 2" active={state.heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton title="Título 3" active={state.heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Lista con viñetas" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <i className="pi pi-list" />
      </ToolbarButton>
      <ToolbarButton title="Lista numerada" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <i className="pi pi-sort-numeric-down" />
      </ToolbarButton>
      <ToolbarButton title="Lista de tareas" active={state.taskList} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <i className="pi pi-check-square" />
      </ToolbarButton>
      <ToolbarButton title="Cita" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <i className="pi pi-comment" />
      </ToolbarButton>
      <ToolbarButton title="Bloque de código" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <i className="pi pi-code" />
      </ToolbarButton>
      <ToolbarButton title="Línea horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <i className="pi pi-minus" />
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Alinear izquierda" active={state.alignLeft} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <i className="pi pi-align-left" />
      </ToolbarButton>
      <ToolbarButton title="Centrar" active={state.alignCenter} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <i className="pi pi-align-center" />
      </ToolbarButton>
      <ToolbarButton title="Alinear derecha" active={state.alignRight} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <i className="pi pi-align-right" />
      </ToolbarButton>
      <ToolbarButton title="Justificar" active={state.alignJustify} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
        <i className="pi pi-align-justify" />
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Enlace" active={state.link} onClick={setLink}>
        <i className="pi pi-link" />
      </ToolbarButton>
      <ToolbarButton title="Imagen" onClick={addImage}>
        <i className="pi pi-image" />
      </ToolbarButton>
      <ToolbarButton title="Insertar tabla" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        <i className="pi pi-table" />
      </ToolbarButton>

      {state.inTable && (
        <>
          <span className="rich-text-editor-toolbar-divider" />
          <ToolbarButton title="Agregar fila" onClick={() => editor.chain().focus().addRowAfter().run()}>
            <i className="pi pi-plus" style={{ fontSize: "0.65rem" }} />fila
          </ToolbarButton>
          <ToolbarButton title="Agregar columna" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <i className="pi pi-plus" style={{ fontSize: "0.65rem" }} />col
          </ToolbarButton>
          <ToolbarButton title="Eliminar fila" onClick={() => editor.chain().focus().deleteRow().run()}>
            <i className="pi pi-trash" style={{ fontSize: "0.65rem" }} />fila
          </ToolbarButton>
          <ToolbarButton title="Eliminar columna" onClick={() => editor.chain().focus().deleteColumn().run()}>
            <i className="pi pi-trash" style={{ fontSize: "0.65rem" }} />col
          </ToolbarButton>
          <ToolbarButton title="Eliminar tabla" onClick={() => editor.chain().focus().deleteTable().run()}>
            <i className="pi pi-trash" style={{ fontSize: "0.65rem" }} />tabla
          </ToolbarButton>
        </>
      )}
    </div>
  );
}

/** Rich text editor built on Tiptap, with a toolbar wired to the editor's formatting commands. */
export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false, backgroundColor: false }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Escribí el contenido acá…" }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="rich-text-editor">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} className="rich-text-editor-content" />
      {editor && (
        <div className="rich-text-editor-footer">
          {editor.storage.characterCount.characters()} caracteres · {editor.storage.characterCount.words()} palabras
        </div>
      )}
    </div>
  );
}