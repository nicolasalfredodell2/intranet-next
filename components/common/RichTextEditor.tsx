"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Extension, Node, mergeAttributes, ResizableNodeView } from "@tiptap/core";
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

const ResizableImage = Image.extend({
  addNodeView() {
    if (!this.options.resize || !this.options.resize.enabled || typeof document === "undefined") {
      return null;
    }
    const { directions, minWidth, minHeight, alwaysPreserveAspectRatio } = this.options.resize;
    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("img");
      el.draggable = false;
      const mergedAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
      Object.entries(mergedAttributes).forEach(([key, value]) => {
        if (value != null && key !== "width" && key !== "height") {
          el.setAttribute(key, String(value));
        }
      });
      if (mergedAttributes.src != null) el.src = mergedAttributes.src;

      const nodeView = new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor.chain().setNodeSelection(pos).updateAttributes(this.name, { width, height }).run();
        },
        onUpdate: (updatedNode) => updatedNode.type === node.type,
        options: {
          directions,
          min: { width: minWidth, height: minHeight },
          preserveAspectRatio: alwaysPreserveAspectRatio === true,
          className: {
            handle: "rich-text-editor-image-handle",
            resizing: "rich-text-editor-image-resizing",
          },
        },
      });

      const dom = nodeView.dom;
      dom.style.visibility = "hidden";
      dom.style.pointerEvents = "none";
      el.onload = () => {
        dom.style.visibility = "";
        dom.style.pointerEvents = "";
      };
      return nodeView;
    };
  },
});

interface VideoOptions {
  HTMLAttributes: Record<string, unknown>;
  resize: { enabled: boolean; minWidth?: number; minHeight?: number } | false;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

const Video = Node.create<VideoOptions>({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addOptions() {
    return { HTMLAttributes: {}, resize: false };
  },
  addAttributes() {
    return {
      src: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { controls: "true" })];
  },
  addCommands() {
    return {
      setVideo: (options) => ({ commands }) => commands.insertContent({ type: this.name, attrs: options }),
    };
  },
  addNodeView() {
    if (!this.options.resize || !this.options.resize.enabled || typeof document === "undefined") {
      return null;
    }
    const { minWidth, minHeight } = this.options.resize;
    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("video");
      el.controls = true;
      el.draggable = false;
      const mergedAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
      Object.entries(mergedAttributes).forEach(([key, value]) => {
        if (value != null && key !== "width" && key !== "height") {
          el.setAttribute(key, String(value));
        }
      });
      if (mergedAttributes.src != null) el.src = mergedAttributes.src;

      return new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor.chain().setNodeSelection(pos).updateAttributes(this.name, { width, height }).run();
        },
        onUpdate: (updatedNode) => updatedNode.type === node.type,
        options: {
          min: { width: minWidth, height: minHeight },
          className: {
            handle: "rich-text-editor-image-handle",
            resizing: "rich-text-editor-image-resizing",
          },
        },
      });
    };
  },
});

interface VideoEmbedOptions {
  HTMLAttributes: Record<string, unknown>;
  resize: { enabled: boolean; minWidth?: number; minHeight?: number } | false;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (options: { src: string; width?: number; height?: number }) => ReturnType;
    };
  }
}

const EMBED_ALLOW = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

function getVideoEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

const VideoEmbed = Node.create<VideoEmbedOptions>({
  name: "videoEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addOptions() {
    return { HTMLAttributes: {}, resize: false };
  },
  addAttributes() {
    return {
      src: { default: null },
      width: { default: 560 },
      height: { default: 315 },
    };
  },
  parseHTML() {
    return [{ tag: "iframe[data-video-embed]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["iframe", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      "data-video-embed": "",
      frameborder: "0",
      allow: EMBED_ALLOW,
      allowfullscreen: "true",
    })];
  },
  addCommands() {
    return {
      setVideoEmbed: (options) => ({ commands }) => commands.insertContent({ type: this.name, attrs: options }),
    };
  },
  addNodeView() {
    if (!this.options.resize || !this.options.resize.enabled || typeof document === "undefined") {
      return null;
    }
    const { minWidth, minHeight } = this.options.resize;
    return ({ node, getPos, HTMLAttributes, editor }) => {
      const el = document.createElement("iframe");
      el.setAttribute("frameborder", "0");
      el.setAttribute("allow", EMBED_ALLOW);
      el.setAttribute("allowfullscreen", "true");
      const mergedAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
      Object.entries(mergedAttributes).forEach(([key, value]) => {
        if (value != null && key !== "width" && key !== "height") {
          el.setAttribute(key, String(value));
        }
      });
      if (mergedAttributes.src != null) el.src = mergedAttributes.src;

      return new ResizableNodeView({
        element: el,
        editor,
        node,
        getPos,
        onResize: (width, height) => {
          el.style.width = `${width}px`;
          el.style.height = `${height}px`;
        },
        onCommit: (width, height) => {
          const pos = getPos();
          if (pos === undefined) return;
          editor.chain().setNodeSelection(pos).updateAttributes(this.name, { width, height }).run();
        },
        onUpdate: (updatedNode) => updatedNode.type === node.type,
        options: {
          min: { width: minWidth, height: minHeight },
          className: {
            handle: "rich-text-editor-image-handle",
            resizing: "rich-text-editor-image-resizing",
          },
        },
      });
    };
  },
});

const INDENT_STEP_PX = 24;
const INDENT_MAX = 8;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textIndent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const Indent = Extension.create({
  name: "textIndent",
  addOptions() {
    return { types: ["paragraph", "heading"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent * INDENT_STEP_PX}px` };
            },
            parseHTML: (element) => {
              const margin = parseInt(element.style.marginLeft || "0", 10);
              return margin ? Math.round(margin / INDENT_STEP_PX) : 0;
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      indent: () => ({ editor, commands, tr, state, dispatch }) => {
        if (editor.isActive("listItem")) return commands.sinkListItem("listItem");
        if (editor.isActive("taskItem")) return commands.sinkListItem("taskItem");
        const { types } = this.options;
        const { from, to } = state.selection;
        let applied = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (types.includes(node.type.name)) {
            const current = node.attrs.indent ?? 0;
            if (current < INDENT_MAX) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current + 1 });
              applied = true;
            }
          }
        });
        if (applied && dispatch) dispatch(tr);
        return applied;
      },
      outdent: () => ({ editor, commands, tr, state, dispatch }) => {
        if (editor.isActive("listItem")) return commands.liftListItem("listItem");
        if (editor.isActive("taskItem")) return commands.liftListItem("taskItem");
        const { types } = this.options;
        const { from, to } = state.selection;
        let applied = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (types.includes(node.type.name)) {
            const current = node.attrs.indent ?? 0;
            if (current > 0) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current - 1 });
              applied = true;
            }
          }
        });
        if (applied && dispatch) dispatch(tr);
        return applied;
      },
    };
  },
});

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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageWidth, setImageWidth] = useState("");
  const [imageHeight, setImageHeight] = useState("");
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [videoWidth, setVideoWidth] = useState("");
  const [videoHeight, setVideoHeight] = useState("");
  const videoFileInputRef = useRef<HTMLInputElement>(null);

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

  function openImageDialog() {
    setImageUrl("");
    setImagePreview("");
    setImageWidth("");
    setImageHeight("");
    setShowImageDialog(true);
  }

  function handleImageUrlChange(value: string) {
    setImageUrl(value);
    if (value.trim()) {
      setImagePreview("");
      if (imageFileInputRef.current) imageFileInputRef.current.value = "";
    } else if (!imagePreview) {
      setImageWidth("");
      setImageHeight("");
    }
  }

  function handleImageFileChange(file: File | null) {
    if (!file) {
      setImagePreview("");
      if (!imageUrl.trim()) { setImageWidth(""); setImageHeight(""); }
      return;
    }
    setImageUrl("");
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function confirmInsertImage() {
    const src = imagePreview || imageUrl.trim();
    if (!src) return;
    const width = imageWidth ? Number(imageWidth) : undefined;
    const height = imageHeight ? Number(imageHeight) : undefined;
    editor.chain().focus().setImage({ src, width, height }).run();
    setShowImageDialog(false);
  }

  function openVideoDialog() {
    setVideoUrl("");
    setVideoPreview("");
    setVideoWidth("");
    setVideoHeight("");
    setShowVideoDialog(true);
  }

  function handleVideoUrlChange(value: string) {
    setVideoUrl(value);
    if (value.trim()) {
      setVideoPreview("");
      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
    } else if (!videoPreview) {
      setVideoWidth("");
      setVideoHeight("");
    }
  }

  function handleVideoFileChange(file: File | null) {
    if (!file) {
      setVideoPreview("");
      if (!videoUrl.trim()) { setVideoWidth(""); setVideoHeight(""); }
      return;
    }
    setVideoUrl("");
    const reader = new FileReader();
    reader.onload = () => setVideoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const videoEmbedUrl = !videoPreview ? getVideoEmbedUrl(videoUrl.trim()) : null;

  function confirmInsertVideo() {
    const src = videoPreview || videoUrl.trim();
    if (!src) return;
    const width = videoWidth ? Number(videoWidth) : undefined;
    const height = videoHeight ? Number(videoHeight) : undefined;

    if (videoEmbedUrl) {
      editor.chain().focus().setVideoEmbed({ src: videoEmbedUrl, width: width ?? 560, height: height ?? 315 }).run();
    } else {
      editor.chain().focus().setVideo({ src, width, height }).run();
    }
    setShowVideoDialog(false);
  }

  return (
    <>
    <div className="rich-text-editor-toolbar">
      <ToolbarButton title="Deshacer" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <i className="pi pi-undo" />
      </ToolbarButton>
      <ToolbarButton title="Rehacer" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <i className="pi pi-undo" style={{ transform: "scaleX(-1)" }} />
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Negrita" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton title="Cursiva" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton title="Subrayado" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span style={{ textDecoration: "underline" }}>U</span>
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
      <ToolbarButton title="Disminuir sangría" onClick={() => editor.chain().focus().outdent().run()}>
        <i className="pi pi-angle-double-left" />
      </ToolbarButton>
      <ToolbarButton title="Aumentar sangría" onClick={() => editor.chain().focus().indent().run()}>
        <i className="pi pi-angle-double-right" />
      </ToolbarButton>
      <span className="rich-text-editor-toolbar-divider" />

      <ToolbarButton title="Enlace" active={state.link} onClick={setLink}>
        <i className="pi pi-link" />
      </ToolbarButton>
      <ToolbarButton title="Imagen" onClick={openImageDialog}>
        <i className="pi pi-image" />
      </ToolbarButton>
      <ToolbarButton title="Video" onClick={openVideoDialog}>
        <i className="pi pi-video" />
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

    <Dialog
      header="Insertar imagen"
      visible={showImageDialog}
      modal
      draggable={false}
      resizable={false}
      closable={false}
      style={{ width: "min(460px, 92vw)" }}
      onHide={() => setShowImageDialog(false)}
      footer={
        <div className="d-flex align-items-center" style={{ gap: "8px" }}>
          <button
            type="button"
            disabled={!imageUrl.trim() && !imagePreview}
            onClick={confirmInsertImage}
            className="btn btn-primary d-flex align-items-center"
            style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
          >
            <i className="pi pi-check" style={{ fontSize: "0.78rem" }} />
            Insertar
          </button>
          <button
            type="button"
            onClick={() => setShowImageDialog(false)}
            className="btn btn-light text-muted ml-auto"
            style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
          >
            Volver
          </button>
        </div>
      }
    >
      <div className="mb-3">
        <label className="profile-field-label">URL de la imagen</label>
        <input
          className="profile-input"
          type="text"
          placeholder="https://…"
          value={imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="profile-field-label">O subí un archivo desde tu PC</label>
        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/*"
          className="form-control-file"
          onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="row">
        <div className="col-6 mb-3">
          <label className="profile-field-label">Ancho (px)</label>
          <input
            className="profile-input"
            type="number"
            min={1}
            placeholder="Auto"
            value={imageWidth}
            onChange={(e) => setImageWidth(e.target.value)}
          />
        </div>
        <div className="col-6 mb-3">
          <label className="profile-field-label">Alto (px)</label>
          <input
            className="profile-input"
            type="number"
            min={1}
            placeholder="Auto"
            value={imageHeight}
            onChange={(e) => setImageHeight(e.target.value)}
          />
        </div>
      </div>
      {(imagePreview || imageUrl.trim()) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagePreview || imageUrl.trim()}
          alt="Vista previa"
          onLoad={(e) => {
            setImageWidth(String(e.currentTarget.naturalWidth));
            setImageHeight(String(e.currentTarget.naturalHeight));
          }}
          style={{ maxWidth: "100%", maxHeight: 160, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
      )}
      <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "8px", marginBottom: 0 }}>
        También podés arrastrar los bordes de la imagen dentro del editor para redimensionarla.
      </p>
    </Dialog>

    <Dialog
      header="Insertar video"
      visible={showVideoDialog}
      modal
      draggable={false}
      resizable={false}
      closable={false}
      style={{ width: "min(460px, 92vw)" }}
      onHide={() => setShowVideoDialog(false)}
      footer={
        <div className="d-flex align-items-center" style={{ gap: "8px" }}>
          <button
            type="button"
            disabled={!videoUrl.trim() && !videoPreview}
            onClick={confirmInsertVideo}
            className="btn btn-primary d-flex align-items-center"
            style={{ gap: "6px", borderRadius: "8px", fontWeight: 600, fontSize: "0.85rem" }}
          >
            <i className="pi pi-check" style={{ fontSize: "0.78rem" }} />
            Insertar
          </button>
          <button
            type="button"
            onClick={() => setShowVideoDialog(false)}
            className="btn btn-light text-muted ml-auto"
            style={{ borderRadius: "8px", fontWeight: 500, fontSize: "0.85rem" }}
          >
            Volver
          </button>
        </div>
      }
    >
      <div className="mb-3">
        <label className="profile-field-label">URL del video</label>
        <input
          className="profile-input"
          type="text"
          placeholder="https://…"
          value={videoUrl}
          onChange={(e) => handleVideoUrlChange(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label className="profile-field-label">O subí un archivo desde tu PC</label>
        <input
          ref={videoFileInputRef}
          type="file"
          accept="video/*"
          className="form-control-file"
          onChange={(e) => handleVideoFileChange(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="row">
        <div className="col-6 mb-3">
          <label className="profile-field-label">Ancho (px)</label>
          <input
            className="profile-input"
            type="number"
            min={1}
            placeholder="Auto"
            value={videoWidth}
            onChange={(e) => setVideoWidth(e.target.value)}
          />
        </div>
        <div className="col-6 mb-3">
          <label className="profile-field-label">Alto (px)</label>
          <input
            className="profile-input"
            type="number"
            min={1}
            placeholder="Auto"
            value={videoHeight}
            onChange={(e) => setVideoHeight(e.target.value)}
          />
        </div>
      </div>
      {(videoPreview || videoUrl.trim()) && (
        videoEmbedUrl ? (
          <iframe
            src={videoEmbedUrl}
            width="100%"
            height={200}
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
        ) : (
          <video
            src={videoPreview || videoUrl.trim()}
            controls
            onLoadedMetadata={(e) => {
              setVideoWidth(String(e.currentTarget.videoWidth));
              setVideoHeight(String(e.currentTarget.videoHeight));
            }}
            style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
        )
      )}
      <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "8px", marginBottom: 0 }}>
        {videoEmbedUrl
          ? "Se detectó un video de YouTube/Vimeo, se insertará como reproductor embebido."
          : "También podés arrastrar los bordes del video dentro del editor para redimensionarlo."}
      </p>
    </Dialog>
    </>
  );
}

/** Rich text editor built on Tiptap, with a toolbar wired to the editor's formatting commands. */
export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck: "true",
        lang: "es",
      },
    },
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      ResizableImage.configure({
        allowBase64: true,
        resize: { enabled: true, minWidth: 40, minHeight: 40 },
      }),
      Video.configure({
        resize: { enabled: true, minWidth: 80, minHeight: 60 },
      }),
      VideoEmbed.configure({
        resize: { enabled: true, minWidth: 120, minHeight: 90 },
      }),
      Indent,
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