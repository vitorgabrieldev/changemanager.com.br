"use client";

import { Carousel } from "antd";
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
      className="overflow-hidden rounded-xl border border-border"
    >
      <Carousel arrows dots={images.length > 1} infinite={images.length > 1}>
        {images.map((img) => (
          <a
            key={img.path}
            href={img.url}
            data-fancybox={`property-view-${groupId}`}
            className="block aspect-video w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt=""
              className="h-full w-full object-cover"
            />
          </a>
        ))}
      </Carousel>
    </div>
  );
}
