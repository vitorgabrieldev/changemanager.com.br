"use client";

import { App } from "antd";
import Image from "next/image";
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
import { compressImage } from "@/lib/image/compress-image";

export type EntityImage = { path: string; url: string };

export type EntityImageManagerHandle = {
  /** Envia os arquivos ainda locais (estagiados no modo "criar") pro dono
   * recém-salvo. Sem staged files, é um no-op — seguro chamar sempre. */
  commitPendingUploads: (ownerId: string) => Promise<void>;
};

type Item = { key: string; url: string; file?: File };

export const EntityImageManager = forwardRef<
  EntityImageManagerHandle,
  {
    ownerId: string | null;
    initialImages: EntityImage[];
    fancyboxGroup: string;
    uploadAction: (
      ownerId: string,
      formData: FormData,
    ) => Promise<{ path: string; url: string }>;
    removeAction: (ownerId: string, path: string) => Promise<void>;
  }
>(function EntityImageManager(
  { ownerId, initialImages, fancyboxGroup, uploadAction, removeAction },
  ref,
) {
  const [items, setItems] = useState<Item[]>(() =>
    initialImages.map((img) => ({ key: img.path, url: img.url })),
  );
  const [syncedImages, setSyncedImages] = useState(initialImages);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
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
      async commitPendingUploads(newOwnerId: string) {
        const pending = itemsRef.current.filter((i) => i.file);
        for (const item of pending) {
          const formData = new FormData();
          formData.set("file", item.file!);
          await uploadAction(newOwnerId, formData);
        }
      },
    }),
    [uploadAction],
  );

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length < files.length) {
      message.error("Só imagens são aceitas — o restante foi ignorado.");
    }
    if (images.length === 0) return;

    // Fotos de celular chegam com vários MB — comprime antes de estagiar ou
    // subir, tanto o preview quanto o upload usam o arquivo já reduzido.
    const compressed = await Promise.all(images.map(compressImage));

    if (!ownerId) {
      // Ainda não existe (modo criar): fica só local até o "Salvar" publicar junto.
      setItems((prev) => [
        ...prev,
        ...compressed.map((file) => ({
          key: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          file,
        })),
      ]);
      return;
    }

    setUploadProgress({ current: 0, total: compressed.length });
    try {
      for (const [index, file] of compressed.entries()) {
        const formData = new FormData();
        formData.set("file", file);
        // Sequencial de propósito: a action lê e regrava `images` inteiro,
        // então uploads em paralelo pisariam um no outro.
        const result = await uploadAction(ownerId, formData);
        setItems((prev) => [...prev, { key: result.path, url: result.url }]);
        setUploadProgress({ current: index + 1, total: compressed.length });
      }
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Não foi possível enviar as imagens.",
      );
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleRemove(item: Item) {
    if (item.file) {
      URL.revokeObjectURL(item.url);
      setItems((prev) => prev.filter((i) => i.key !== item.key));
      return;
    }
    if (!ownerId) return;

    const previous = items;
    setRemovingKey(item.key);
    setItems((prev) => prev.filter((i) => i.key !== item.key));
    try {
      await removeAction(ownerId, item.key);
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
          className="group relative aspect-square overflow-hidden rounded-sm border border-border bg-surface-muted"
        >
          <Image
            src={item.url}
            alt=""
            fill
            unoptimized={Boolean(item.file)}
            sizes="(max-width: 768px) 33vw, 140px"
            className="object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <a
              href={item.url}
              data-fancybox={fancyboxGroup}
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

      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border text-foreground-muted transition-colors hover:border-accent hover:text-accent">
        {uploadProgress ? (
          <>
            <Loader variant="spin" size={22} />
            <span className="text-xs">
              {uploadProgress.current}/{uploadProgress.total}
            </span>
          </>
        ) : (
          <>
            <PiUploadSimple size={18} />
            <span className="text-xs">Adicionar</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={uploadProgress !== null}
        />
      </label>
    </div>
  );
});
