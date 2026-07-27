"use client";

import { Carousel } from "antd";
import Image from "next/image";
import { useRef } from "react";
import { useFancybox } from "@/components/ui/use-fancybox";
import type { PropertyImage } from "./property-image-manager";

export function PropertyImageCarousel({
  images,
  groupId,
}: {
  images: PropertyImage[];
  groupId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFancybox(containerRef, images);

  if (images.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-sm border border-border"
    >
      <Carousel arrows dots={images.length > 1} infinite={images.length > 1}>
        {images.map((img) => (
          <a
            key={img.path}
            href={img.url}
            data-fancybox={`property-view-${groupId}`}
            className="relative block aspect-video w-full"
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          </a>
        ))}
      </Carousel>
    </div>
  );
}
