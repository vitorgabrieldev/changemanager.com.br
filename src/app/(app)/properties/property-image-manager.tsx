"use client";

import { App } from "antd";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { PiEye, PiTrash, PiUploadSimple } from "react-icons/pi";
import { Loader } from "@/components/ui/loader";
import { useFancybox } from "@/components/ui/use-fancybox";
import { removePropertyImage, uploadPropertyImage } from "./actions";

export type PropertyImage = { path: string; url: string };

export type PropertyImageManagerHandle = {
  /** Envia os arquivos ainda locais (estagiados no modo "criar") para o
   * imóvel recém-salvo. Sem staged files, é um no-op — seguro chamar sempre. */
  commitPendingUploads: (propertyId: string) => Promise<void>;
};

type Item = { key: string; url: string; file?: File };

export const PropertyImageManager = forwardRef<
  PropertyImageManagerHandle,
  { propertyId: string | null; initialImages: PropertyImage[] }
>(function PropertyImageManager({ propertyId, initialImages }, ref) {
  const [items, setItems] = useState<Item[]>(() =>
    initialImages.map((img) => ({ key: img.path, url: img.url })),
  );
  const [syncedImages, setSyncedImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const { message } = App.useApp();

  if (initialImages !== syncedImages) {
    setSyncedImages(initialImages);
    setItems(initialImages.map((img) => ({ key: img.path, url: img.url })));
  }

  useFancybox(containerRef, items);

  useImperativeHandle(
    ref,
    () => ({
      async commitPendingUploads(newPropertyId: string) {
        const pending = itemsRef.current.filter((i) => i.file);
        for (const item of pending) {
          const formData = new FormData();
          formData.set("file", item.file!);
          await uploadPropertyImage(newPropertyId, formData);
        }
      },
    }),
    [],
  );

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Envie apenas imagens.");
      return;
    }

    if (!propertyId) {
      // Imóvel ainda não existe: fica só local até o "Salvar" publicar junto.
      setItems((prev) => [
        ...prev,
        { key: crypto.randomUUID(), url: URL.createObjectURL(file), file },
      ]);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadPropertyImage(propertyId, formData);
      setItems((prev) => [...prev, { key: result.path, url: result.url }]);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(item: Item) {
    if (item.file) {
      URL.revokeObjectURL(item.url);
      setItems((prev) => prev.filter((i) => i.key !== item.key));
      return;
    }
    if (!propertyId) return;

    const previous = items;
    setRemovingKey(item.key);
    setItems((prev) => prev.filter((i) => i.key !== item.key));
    try {
      await removePropertyImage(propertyId, item.key);
    } catch {
      setItems(previous);
      message.error("Não foi possível remover a imagem.");
    } finally {
      setRemovingKey(null);
    }
  }

  return (
    <div ref={containerRef} className="grid w-full grid-cols-5 gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <a
              href={item.url}
              data-fancybox={`property-manage-${propertyId ?? "new"}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground-strong transition-colors hover:bg-white"
              title="Visualizar"
            >
              <PiEye size={16} />
            </a>
            <button
              type="button"
              onClick={() => handleRemove(item)}
              disabled={removingKey === item.key}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-danger transition-colors hover:bg-white disabled:opacity-50"
              title="Remover"
            >
              <PiTrash size={16} />
            </button>
          </div>
        </div>
      ))}

      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-foreground-muted transition-colors hover:border-accent hover:text-accent">
        {uploading ? (
          <Loader variant="spin" size={22} />
        ) : (
          <>
            <PiUploadSimple size={18} />
            <span className="text-xs">Adicionar</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
});
