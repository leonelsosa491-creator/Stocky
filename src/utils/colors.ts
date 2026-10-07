import { ProductItem } from '../types';

export interface ColorFamilyOption {
  name: string;
  hex: string;
  textColor?: string;
  hasBorder?: boolean;
}

// 11 exact main color families requested by the boutique owner
export const MAIN_COLOR_FAMILIES: ColorFamilyOption[] = [
  { name: 'Blanco', hex: '#ffffff', hasBorder: true, textColor: '#18181b' },
  { name: 'Negro', hex: '#18181b', textColor: '#ffffff' },
  { name: 'Rojo', hex: '#ef4444', textColor: '#ffffff' },
  { name: 'Naranja', hex: '#f97316', textColor: '#ffffff' },
  { name: 'Amarillo', hex: '#eab308', textColor: '#18181b' },
  { name: 'Azul', hex: '#1e40af', textColor: '#ffffff' },
  { name: 'Celeste', hex: '#38bdf8', textColor: '#18181b' },
  { name: 'Violeta', hex: '#8b5cf6', textColor: '#ffffff' },
  { name: 'Rosado', hex: '#ec4899', textColor: '#ffffff' },
  { name: 'Marrón', hex: '#78350f', textColor: '#ffffff' }, // Estrictamente marrón oscuro/tierra, no beige
  { name: 'Gris', hex: '#6b7280', textColor: '#ffffff' },
];

export const DEFAULT_COLOR_FAMILY = 'Negro';

export function getColorHexByFamily(familyName: string): string {
  const found = MAIN_COLOR_FAMILIES.find(
    (c) => c.name.toLowerCase() === familyName.toLowerCase().trim()
  );
  return found ? found.hex : '#18181b';
}

/**
 * Intelligent filter matcher:
 * Checks if a product matches a target color family.
 * Specifically prevents false positives (e.g. Marrón will NEVER match Beige or Camel).
 */
export function matchesColorFamily(
  product: ProductItem,
  targetFamily: string | null | undefined
): boolean {
  if (!targetFamily || targetFamily === 'Todos' || targetFamily === 'all') {
    return true;
  }

  const target = targetFamily.toLowerCase().trim();
  const prodFamily = (product.colorFamily || '').toLowerCase().trim();
  const prodSpecific = (product.specificColor || '').toLowerCase().trim();
  const prodName = (product.colorName || '').toLowerCase().trim();
  const combined = `${prodFamily} ${prodSpecific} ${prodName}`.toLowerCase();

  // 1. Direct match on colorFamily property
  if (prodFamily && prodFamily === target) {
    return true;
  }

  // 2. Strict family-specific intelligence to avoid category overlap
  switch (target) {
    case 'marrón':
    case 'marron':
      // Strictly brown tones: Marrón, Chocolate, Café, Habano, Tabaco.
      // MUST NOT match Beige, Camel, Arena, Crudo, Hueso.
      if (
        combined.includes('beige') ||
        combined.includes('camel') ||
        combined.includes('arena') ||
        combined.includes('crudo') ||
        combined.includes('hueso')
      ) {
        return false;
      }
      return (
        prodFamily === 'marrón' ||
        prodFamily === 'marron' ||
        combined.includes('marrón') ||
        combined.includes('marron') ||
        combined.includes('chocolate') ||
        combined.includes('café') ||
        combined.includes('cafe') ||
        combined.includes('habano') ||
        combined.includes('tabaco')
      );

    case 'rojo':
      // Matches Red, Cherry, Bordó, Borgoña, Vino, Carmesí, Rubí
      return (
        prodFamily === 'rojo' ||
        combined.includes('rojo') ||
        combined.includes('bordó') ||
        combined.includes('bordo') ||
        combined.includes('cherry') ||
        combined.includes('cereza') ||
        combined.includes('borgoña') ||
        combined.includes('vino') ||
        combined.includes('carmesí') ||
        combined.includes('carmesi') ||
        combined.includes('rubí') ||
        combined.includes('rubi')
      );

    case 'azul':
      // Matches Blue, Navy, Azul Marino, Azul Noche, Cobalto.
      // Must NOT match Celeste
      if (combined.includes('celeste') || combined.includes('cielo')) {
        return false;
      }
      return (
        prodFamily === 'azul' ||
        combined.includes('azul') ||
        combined.includes('marino') ||
        combined.includes('navy') ||
        combined.includes('cobalto') ||
        combined.includes('zafiro') ||
        combined.includes('índigo') ||
        combined.includes('indigo')
      );

    case 'celeste':
      // Matches Celeste, Cielo, Aqua, Turquesa, Baby Blue
      return (
        prodFamily === 'celeste' ||
        combined.includes('celeste') ||
        combined.includes('cielo') ||
        combined.includes('aqua') ||
        combined.includes('turquesa') ||
        combined.includes('baby blue')
      );

    case 'naranja':
      // Matches Naranja, Terracota, Teja, Salmón, Durazno, Óxido
      return (
        prodFamily === 'naranja' ||
        combined.includes('naranja') ||
        combined.includes('terracota') ||
        combined.includes('teja') ||
        combined.includes('salmón') ||
        combined.includes('salmon') ||
        combined.includes('durazno') ||
        combined.includes('óxido') ||
        combined.includes('oxido')
      );

    case 'amarillo':
      // Matches Amarillo, Mostaza, Oro, Maíz, Vainilla
      return (
        prodFamily === 'amarillo' ||
        combined.includes('amarillo') ||
        combined.includes('mostaza') ||
        combined.includes('oro') ||
        combined.includes('maíz') ||
        combined.includes('maiz') ||
        combined.includes('vainilla')
      );

    case 'violeta':
      // Matches Violeta, Lila, Morado, Púrpura, Lavanda, Uva
      return (
        prodFamily === 'violeta' ||
        combined.includes('violeta') ||
        combined.includes('lila') ||
        combined.includes('morado') ||
        combined.includes('púrpura') ||
        combined.includes('purpura') ||
        combined.includes('lavanda') ||
        combined.includes('uva')
      );

    case 'rosado':
      // Matches Rosado, Rosa, Fucsia, Chicle, Palo Rosa, Blush
      return (
        prodFamily === 'rosado' ||
        combined.includes('rosado') ||
        combined.includes('rosa') ||
        combined.includes('fucsia') ||
        combined.includes('chicle') ||
        combined.includes('palo rosa') ||
        combined.includes('blush')
      );

    case 'gris':
      // Matches Gris, Melange, Plomo, Grafito, Antracita
      return (
        prodFamily === 'gris' ||
        combined.includes('gris') ||
        combined.includes('melange') ||
        combined.includes('plomo') ||
        combined.includes('grafito') ||
        combined.includes('antracita')
      );

    case 'negro':
      // Matches Negro, Black, Azabache, Carbón
      return (
        prodFamily === 'negro' ||
        combined.includes('negro') ||
        combined.includes('black') ||
        combined.includes('azabache') ||
        combined.includes('carbón') ||
        combined.includes('carbon')
      );

    case 'blanco':
      // Matches Blanco, White, Nieve, Tiza, Off-White
      return (
        prodFamily === 'blanco' ||
        combined.includes('blanco') ||
        combined.includes('white') ||
        combined.includes('nieve') ||
        combined.includes('tiza')
      );

    default:
      return (
        prodFamily === target ||
        prodName === target ||
        combined.includes(target)
      );
  }
}

/**
 * Returns formatted labels for UI presentation:
 * - primary: specificColor if available, or colorName, or colorFamily
 * - family: the main family name
 * - fullLabel: "Bordó (Rojo)" or "Rojo"
 */
export function getProductColorDisplay(product: ProductItem): {
  primary: string;
  family: string;
  hasSpecific: boolean;
  tooltipText: string;
} {
  const family = product.colorFamily || product.colorName || 'Sin familia';
  const specific = (product.specificColor || '').trim();
  const hasSpecific = Boolean(specific && specific.toLowerCase() !== family.toLowerCase());
  const primary = hasSpecific ? specific : product.colorName || family;
  
  const tooltipText = hasSpecific
    ? `Color comercial: ${specific} · Familia: ${family}`
    : `Color: ${family}`;

  return {
    primary,
    family,
    hasSpecific,
    tooltipText,
  };
}
