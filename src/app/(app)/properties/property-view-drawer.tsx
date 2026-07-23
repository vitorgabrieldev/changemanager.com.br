"use client";

import { Avatar, Button, Drawer, Rate, Tag, Typography } from "antd";
import {
  PiLinkSimple,
  PiMapPin,
  PiPencilSimple,
  PiStarFill,
  PiX,
} from "react-icons/pi";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  propertyStatusColor,
  propertyStatusLabel,
} from "@/lib/constants/properties";
import type { HouseholdMember } from "@/lib/data/household";
import { toEmbeddableMapsUrl } from "@/lib/maps";
import type { Database } from "@/lib/types/database";
import { PropertyImageCarousel } from "./property-image-carousel";
import type { PropertyImage } from "./property-image-manager";

const { Title, Text } = Typography;

type Property = Database["public"]["Tables"]["properties"]["Row"];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMoney(value: number | null) {
  return value === null ? "—" : currency.format(value);
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface p-3">
      <Text className="mb-2 block text-xs font-medium tracking-wide text-foreground-muted uppercase">
        {label}
      </Text>
      {children}
    </div>
  );
}

export function PropertyViewDrawer({
  open,
  property,
  images,
  ratingsByProperty,
  members,
  onClose,
  onEdit,
}: {
  open: boolean;
  property: Property | null;
  images: PropertyImage[];
  ratingsByProperty: Map<string, Map<string, number>>;
  members: HouseholdMember[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const ratings = property ? ratingsByProperty.get(property.id) : undefined;
  const scores = Array.from(ratings?.values() ?? []);
  const avg = scores.length
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : null;
  const mapEmbedUrl = toEmbeddableMapsUrl(property?.maps_url);
  const hasRoomDetails =
    property &&
    [
      property.bedrooms,
      property.bathrooms,
      property.suites,
      property.parking_spots,
      property.area_m2,
    ].some((v) => v !== null);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      size="30%"
      closeIcon={<PiX size={18} />}
      title="Detalhes"
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Fechar</Button>
          <Button
            type="primary"
            icon={<PiPencilSimple size={14} />}
            onClick={onEdit}
          >
            Editar
          </Button>
        </div>
      }
    >
      {property && (
        <div className="flex flex-col gap-4">
          <PropertyImageCarousel images={images} groupId={property.id} />

          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <Title level={5} className="!mb-0 !text-foreground-strong">
                {property.title}
              </Title>
              {avg !== null && (
                <div className="flex shrink-0 items-center gap-1 rounded-sm bg-warning-soft px-2 py-1 text-warning">
                  <PiStarFill size={13} />
                  <Text strong className="!text-warning text-xs">
                    {avg.toFixed(1)}
                  </Text>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tag color={propertyStatusColor(property.status)}>
                {propertyStatusLabel(property.status)}
              </Tag>
              {property.listing_url && (
                <a
                  href={property.listing_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                >
                  <PiLinkSimple size={13} />
                  Ver anúncio
                </a>
              )}
            </div>

            {property.address && (
              <div className="flex items-center gap-1.5 text-foreground-muted">
                <PiMapPin size={14} className="shrink-0" />
                <Text className="text-xs text-foreground-muted">
                  {property.address}
                </Text>
              </div>
            )}
          </div>

          {hasRoomDetails && (
            <Section label="Características">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Text className="block text-xs text-foreground-muted">
                    Quartos
                  </Text>
                  <Text className="text-foreground-strong">
                    {property.bedrooms ?? "—"}
                  </Text>
                </div>
                <div>
                  <Text className="block text-xs text-foreground-muted">
                    Suítes
                  </Text>
                  <Text className="text-foreground-strong">
                    {property.suites ?? "—"}
                  </Text>
                </div>
                <div>
                  <Text className="block text-xs text-foreground-muted">
                    Banheiros
                  </Text>
                  <Text className="text-foreground-strong">
                    {property.bathrooms ?? "—"}
                  </Text>
                </div>
                <div>
                  <Text className="block text-xs text-foreground-muted">
                    Vagas
                  </Text>
                  <Text className="text-foreground-strong">
                    {property.parking_spots ?? "—"}
                  </Text>
                </div>
                <div>
                  <Text className="block text-xs text-foreground-muted">
                    Metragem
                  </Text>
                  <Text className="text-foreground-strong">
                    {property.area_m2 !== null ? `${property.area_m2} m²` : "—"}
                  </Text>
                </div>
              </div>
            </Section>
          )}

          {mapEmbedUrl && (
            <Section label="Localização">
              <div className="overflow-hidden rounded-sm border border-border">
                <iframe
                  src={mapEmbedUrl}
                  className="h-56 w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </Section>
          )}

          <Section label="Custos">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Text className="block text-xs text-foreground-muted">
                  Aluguel
                </Text>
                <Text className="text-foreground-strong">
                  {formatMoney(property.rent_price)}
                </Text>
              </div>
              <div>
                <Text className="block text-xs text-foreground-muted">
                  Condomínio
                </Text>
                <Text className="text-foreground-strong">
                  {formatMoney(property.condo_fee)}
                </Text>
              </div>
              <div>
                <Text className="block text-xs text-foreground-muted">
                  IPTU
                </Text>
                <Text className="text-foreground-strong">
                  {formatMoney(property.iptu)}
                </Text>
              </div>
              <div>
                <Text className="block text-xs text-foreground-muted">
                  Total/mês
                </Text>
                <Text strong className="text-foreground-strong">
                  {formatMoney(property.total_monthly_cost)}
                </Text>
              </div>
            </div>
          </Section>

          <Section label="Notas">
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Avatar size="small" style={{ backgroundColor: m.color }}>
                    {m.display_name[0]?.toUpperCase()}
                  </Avatar>
                  <Text className="w-24 shrink-0 truncate text-foreground-strong">
                    {m.display_name}
                  </Text>
                  <Rate
                    disabled
                    count={5}
                    value={ratings?.get(m.id) ?? 0}
                    style={{ fontSize: 13 }}
                  />
                </div>
              ))}
            </div>
          </Section>

          {property.notes && (
            <Section label="Observações">
              <RichTextEditor value={property.notes} editable={false} />
            </Section>
          )}
        </div>
      )}
    </Drawer>
  );
}
