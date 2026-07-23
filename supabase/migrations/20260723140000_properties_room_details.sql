-- Detalhes adicionais do imóvel: cômodos, metragem e localização no mapa.
-- Tudo opcional (nem todo anúncio informa) e só usado nas telas de
-- criar/editar/detalhes — a listagem principal continua com as mesmas colunas.
alter table public.properties
  add column bedrooms smallint,
  add column bathrooms smallint,
  add column suites smallint,
  add column parking_spots smallint,
  add column area_m2 numeric(6, 2),
  add column maps_url text;

alter table public.properties
  add constraint properties_bedrooms_check check (bedrooms is null or bedrooms >= 0),
  add constraint properties_bathrooms_check check (bathrooms is null or bathrooms >= 0),
  add constraint properties_suites_check check (suites is null or suites >= 0),
  add constraint properties_parking_spots_check check (parking_spots is null or parking_spots >= 0),
  add constraint properties_area_m2_check check (area_m2 is null or area_m2 >= 0);

comment on column public.properties.bedrooms is 'Quantidade de quartos.';
comment on column public.properties.bathrooms is 'Quantidade de banheiros.';
comment on column public.properties.suites is 'Quantidade de suítes (subconjunto dos quartos, não somado a eles).';
comment on column public.properties.parking_spots is 'Quantidade de vagas de garagem.';
comment on column public.properties.area_m2 is 'Metragem do imóvel em m².';
comment on column public.properties.maps_url is 'Link do Google Maps colado pelo usuário — ou o <iframe> inteiro de "Compartilhar > Incorporar um mapa" — usado pra renderizar a localização na tela de detalhes.';
