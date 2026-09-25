export interface SpecRow {
  label: string;
  value: string;
}

type ProductSpecifications = {
  conductorMaterial: string;
  crossSectionMm2: number;
  coreCount: number;
  voltageRating: string;
  currentRatingAmps?: number;
  temperatureMinC?: number;
  temperatureMaxC?: number;
  insulationMaterial?: string;
  sheathMaterial?: string;
  uvResistant?: boolean;
  colours?: string[];
  lengthsM?: number[];
  standards?: string[];
  stockNote?: string;
  minimumOrderQuantity?: string;
};

function formatNumber(value: number): string {
  const [integerPart, fractionPart] = String(value).split('.');
  const sign = integerPart.startsWith('-') ? '-' : '';
  const unsignedInteger = sign ? integerPart.slice(1) : integerPart;
  const groupedInteger = unsignedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${sign}${groupedInteger}${fractionPart ? `.${fractionPart}` : ''}`;
}

function humanise(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function addRow(
  rows: SpecRow[],
  label: string,
  value: string | undefined,
): void {
  if (value !== undefined && value.trim().length > 0) {
    rows.push({ label, value });
  }
}

function formatTemperature(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export interface CardSpecs {
  crossSection: string;
  coreCount: string;
  conductorMaterial: string;
}

/**
 * The handful of always-present specifications a listing card shows.
 *
 * Separate from `formatSpecs` on purpose: a card needs three specific values,
 * and picking them out of the row list would mean matching on label text —
 * coupling the caller to display strings, so renaming a label would break the
 * listing at build time rather than at type-check. These fields are required by
 * the schema, so they need no lookup and no absent-field handling.
 */
export function formatCardSpecs(product: ProductSpecifications): CardSpecs {
  return {
    crossSection: `${formatNumber(product.crossSectionMm2)} mm²`,
    coreCount: `${formatNumber(product.coreCount)} ${product.coreCount === 1 ? 'core' : 'cores'}`,
    conductorMaterial: humanise(product.conductorMaterial),
  };
}

export function formatSpecs(product: ProductSpecifications): SpecRow[] {
  const rows: SpecRow[] = [];

  addRow(rows, 'Conductor material', humanise(product.conductorMaterial));
  addRow(rows, 'Cross-section', `${formatNumber(product.crossSectionMm2)} mm²`);
  addRow(
    rows,
    'Core count',
    `${formatNumber(product.coreCount)} ${product.coreCount === 1 ? 'core' : 'cores'}`,
  );
  addRow(rows, 'Voltage rating', product.voltageRating);

  if (product.currentRatingAmps !== undefined) {
    addRow(
      rows,
      'Current rating',
      `${formatNumber(product.currentRatingAmps)} A`,
    );
  }

  if (
    product.temperatureMinC !== undefined &&
    product.temperatureMaxC !== undefined
  ) {
    addRow(
      rows,
      'Temperature range',
      `${formatTemperature(product.temperatureMinC)} °C to ${formatTemperature(product.temperatureMaxC)} °C`,
    );
  }

  addRow(rows, 'Insulation material', product.insulationMaterial);
  addRow(rows, 'Sheath material', product.sheathMaterial);

  if (product.uvResistant !== undefined) {
    addRow(rows, 'UV resistant', product.uvResistant ? 'Yes' : 'No');
  }

  const colours = product.colours
    ?.filter((colour) => colour.trim().length > 0)
    .map(humanise)
    .join(', ');
  addRow(rows, 'Colours', colours);

  const lengths = product.lengthsM
    ?.map((length) => `${formatNumber(length)} m`)
    .join(', ');
  addRow(rows, 'Available lengths', lengths);

  const standards = product.standards
    ?.filter((standard) => standard.trim().length > 0)
    .join(', ');
  addRow(rows, 'Standards', standards);
  addRow(rows, 'Stock note', product.stockNote);
  addRow(rows, 'Minimum order quantity', product.minimumOrderQuantity);

  return rows;
}
