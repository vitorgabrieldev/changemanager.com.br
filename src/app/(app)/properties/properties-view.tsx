"use client";

import {
  PiDotsThreeVertical,
  PiLink,
  PiPencilSimple,
  PiPlus,
  PiStarFill,
  PiTrash,
} from "react-icons/pi";
import {
  App,
  Button,
  Dropdown,
  Empty,
  Rate,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState, useTransition } from "react";
import {
  PROPERTY_STATUSES,
  propertyStatusColor,
  propertyStatusLabel,
} from "@/lib/constants/properties";
import type { HouseholdMember } from "@/lib/data/household";
import type { Database, PropertyStatus } from "@/lib/types/database";
import {
  createProperty,
  deleteProperty,
  updateProperty,
  upsertPropertyRating,
} from "./actions";
import {
  PropertyFormModal,
  type PropertyFormValues,
} from "./property-form-modal";
import type { PropertyImage } from "./property-image-manager";
import { PropertyViewDrawer } from "./property-view-drawer";

const { Title, Text } = Typography;

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyRating = Database["public"]["Tables"]["property_ratings"]["Row"];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatMoney(value: number | null) {
  return value === null ? "—" : currency.format(value);
}

function averageRating(
  property: Property,
  ratingsByProperty: Map<string, Map<string, number>>,
) {
  const scores = Array.from(ratingsByProperty.get(property.id)?.values() ?? []);
  if (scores.length === 0) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function PropertiesView({
  initialProperties,
  initialRatings,
  members,
  currentMemberId,
  imageUrls,
}: {
  initialProperties: Property[];
  initialRatings: PropertyRating[];
  members: HouseholdMember[];
  currentMemberId: string;
  imageUrls: Record<string, string>;
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [syncedProperties, setSyncedProperties] = useState(initialProperties);
  const [ratings, setRatings] = useState(initialRatings);
  const [, startTransition] = useTransition();
  const [modalState, setModalState] = useState<
    | { mode: "create" }
    | { mode: "edit"; property: Property }
    | { mode: "view"; property: Property }
    | null
  >(null);
  const { message, modal } = App.useApp();

  // Re-sincroniza o estado otimista quando o server component reenvia novos
  // props (após revalidatePath). Ajustar durante o render (em vez de useEffect)
  // evita o cascading render apontado pelo react-hooks/set-state-in-effect.
  if (initialProperties !== syncedProperties) {
    setSyncedProperties(initialProperties);
    setProperties(initialProperties);
  }

  function imagesFor(property: Property): PropertyImage[] {
    return (property.images ?? [])
      .map((path) => ({ path, url: imageUrls[path] }))
      .filter((img): img is PropertyImage => Boolean(img.url));
  }

  const formImages = useMemo(
    () => (modalState?.mode === "edit" ? imagesFor(modalState.property) : []),
    [modalState],
  );

  const ratingsByProperty = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const rating of ratings) {
      if (!map.has(rating.property_id)) map.set(rating.property_id, new Map());
      map.get(rating.property_id)!.set(rating.household_member_id, rating.score);
    }
    return map;
  }, [ratings]);

  function handleDelete(property: Property) {
    const previous = properties;
    setProperties((prev) => prev.filter((p) => p.id !== property.id));
    startTransition(async () => {
      try {
        await deleteProperty(property.id);
      } catch {
        setProperties(previous);
        message.error("Não foi possível excluir o imóvel.");
      }
    });
  }

  function handleRate(propertyId: string, score: number) {
    const previous = ratings;
    setRatings((prev) => {
      const withoutMine = prev.filter(
        (r) =>
          !(r.property_id === propertyId && r.household_member_id === currentMemberId),
      );
      return [
        ...withoutMine,
        {
          id: `optimistic-${propertyId}`,
          property_id: propertyId,
          household_member_id: currentMemberId,
          score,
          comment: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    });
    startTransition(async () => {
      try {
        await upsertPropertyRating(propertyId, score);
      } catch {
        setRatings(previous);
        message.error("Não foi possível salvar sua nota.");
      }
    });
  }

  const columns: ColumnsType<Property> = [
    {
      title: "Imóvel",
      dataIndex: "title",
      fixed: "left",
      width: 220,
      render: (_, property) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Text strong className="text-foreground-strong">
              {property.title}
            </Text>
            {property.listing_url && (
              <span onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Ver anúncio">
                  <a href={property.listing_url} target="_blank" rel="noreferrer">
                    <PiLink className="text-foreground-muted" />
                  </a>
                </Tooltip>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 110,
      filters: PROPERTY_STATUSES.map((s) => ({ text: s.label, value: s.value })),
      onFilter: (value, property) => property.status === value,
      render: (status) => (
        <Tag color={propertyStatusColor(status)}>{propertyStatusLabel(status)}</Tag>
      ),
    },
    {
      title: "Aluguel",
      dataIndex: "rent_price",
      width: 110,
      sorter: (a, b) => (a.rent_price ?? 0) - (b.rent_price ?? 0),
      render: formatMoney,
    },
    {
      title: "Condomínio",
      dataIndex: "condo_fee",
      width: 110,
      render: formatMoney,
    },
    {
      title: "IPTU",
      dataIndex: "iptu",
      width: 100,
      render: formatMoney,
    },
    {
      title: "Total/mês",
      dataIndex: "total_monthly_cost",
      width: 120,
      defaultSortOrder: "ascend",
      sorter: (a, b) => (a.total_monthly_cost ?? 0) - (b.total_monthly_cost ?? 0),
      render: (value) => <Text strong>{formatMoney(value)}</Text>,
    },
    {
      title: "Sua nota",
      key: "my_rating",
      width: 130,
      render: (_, property) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Rate
            count={5}
            value={ratingsByProperty.get(property.id)?.get(currentMemberId) ?? 0}
            onChange={(score) => handleRate(property.id, score)}
            style={{ fontSize: 14 }}
          />
        </span>
      ),
    },
    {
      title: "Média",
      key: "average_rating",
      width: 140,
      sorter: (a, b) => averageRating(a, ratingsByProperty) - averageRating(b, ratingsByProperty),
      render: (_, property) => {
        const propertyRatings = ratingsByProperty.get(property.id);
        const scores = members
          .map((m) => propertyRatings?.get(m.id))
          .filter((s): s is number => typeof s === "number");

        if (scores.length === 0) {
          return <Text className="text-foreground-muted">—</Text>;
        }

        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const tooltip = members
          .map((m) => `${m.display_name}: ${propertyRatings?.get(m.id) ?? "sem nota"}`)
          .join(" · ");

        return (
          <Tooltip title={tooltip}>
            <div className="flex items-center gap-1">
              <PiStarFill className="text-warning" size={13} />
              <Text strong className="text-foreground-strong">
                {avg.toFixed(1)}
              </Text>
              <Text className="text-xs text-foreground-muted">
                ({scores.length})
              </Text>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 64,
      render: (_, property) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <PiPencilSimple />,
                  label: "Editar",
                  onClick: () => setModalState({ mode: "edit", property }),
                },
                {
                  key: "delete",
                  danger: true,
                  icon: <PiTrash />,
                  label: "Excluir",
                  onClick: () => {
                    modal.confirm({
                      title: "Excluir imóvel?",
                      content: `"${property.title}" vai ser removido e não dá pra desfazer.`,
                      okText: "Excluir",
                      okButtonProps: { danger: true },
                      cancelText: "Cancelar",
                      onOk: () => handleDelete(property),
                    });
                  },
                },
              ],
            }}
          >
            <Button
              type="text"
              icon={<PiDotsThreeVertical size={20} />}
              className="!h-9 !w-9"
            />
          </Dropdown>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-sm border border-border bg-surface p-5 shadow-sm">
        <div>
          <Title level={4} className="!mb-1 !text-foreground-strong">
            Imóveis
          </Title>
          <Text className="text-foreground-muted">
            {properties.length} imóve{properties.length === 1 ? "l" : "is"} cadastrado
            {properties.length === 1 ? "" : "s"}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PiPlus size={16} />}
          onClick={() => setModalState({ mode: "create" })}
        >
          Novo imóvel
        </Button>
      </div>

      <div className="rounded-sm border border-border bg-surface p-2 shadow-sm">
        {properties.length === 0 ? (
          <Empty
            className="py-10"
            description="Nenhum imóvel ainda. Adicione o primeiro candidato."
          />
        ) : (
          <Table
            rowKey="id"
            dataSource={properties}
            columns={columns}
            pagination={false}
            scroll={{ x: 1000 }}
            size="middle"
            onRow={(property) => ({
              onClick: () => setModalState({ mode: "view", property }),
              className: "cursor-pointer",
            })}
          />
        )}
      </div>

      <PropertyFormModal
        open={modalState?.mode === "create" || modalState?.mode === "edit"}
        title={modalState?.mode === "edit" ? "Editar" : "Criar"}
        initialValues={toInitialValues(modalState)}
        propertyId={modalState?.mode === "edit" ? modalState.property.id : null}
        images={formImages}
        onClose={() => setModalState(null)}
        onSubmit={async (input) => {
          if (modalState?.mode === "edit") {
            await updateProperty(modalState.property.id, input);
            return modalState.property.id;
          }
          return createProperty(input);
        }}
      />

      <PropertyViewDrawer
        open={modalState?.mode === "view"}
        property={modalState?.mode === "view" ? modalState.property : null}
        images={modalState?.mode === "view" ? imagesFor(modalState.property) : []}
        ratingsByProperty={ratingsByProperty}
        members={members}
        onClose={() => setModalState(null)}
        onEdit={() => {
          if (modalState?.mode === "view") {
            setModalState({ mode: "edit", property: modalState.property });
          }
        }}
      />
    </div>
  );
}

function toInitialValues(
  modalState:
    | { mode: "create" }
    | { mode: "edit"; property: Property }
    | { mode: "view"; property: Property }
    | null,
): Partial<PropertyFormValues> | undefined {
  if (modalState?.mode !== "edit") return undefined;
  const { property } = modalState;
  return {
    title: property.title,
    address: property.address ?? undefined,
    listingUrl: property.listing_url ?? undefined,
    rentPrice: property.rent_price ?? undefined,
    condoFee: property.condo_fee ?? undefined,
    iptu: property.iptu ?? undefined,
    status: property.status as PropertyStatus,
    notes: property.notes ?? undefined,
  };
}
