export type TipoCategoria = 'ingreso' | 'gasto';

/** Categoría tal como la devuelve la API */
export interface Categoria {
    id: string;
    nombre: string;
    tipo: TipoCategoria;
    color: string;
    icono: string;
    activa: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Payload para crear una categoría */
export interface CategoriaCreateInput {
    nombre: string;
    tipo: TipoCategoria;
    color?: string;
    icono?: string;
}

/** Payload para actualizar una categoría */
export type CategoriaUpdateInput = Partial<CategoriaCreateInput>;

/** Respuesta del GET /api/categorias — agrupadas por tipo */
export interface CategoriasAgrupadas {
    ingreso: Categoria[];
    gasto: Categoria[];
}

/** Paleta de colores para el selector (misma que Cuentas) */
export const COLORES_PREDEFINIDOS: string[] = [
    '#6B7280', // gray
    '#EF4444', // red
    '#F97316', // orange
    '#EAB308', // yellow
    '#22C55E', // green
    '#14B8A6', // teal
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#0EA5E9', // sky
    '#84CC16', // lime
    '#F43F5E', // rose
];

/** Iconos disponibles (nombres de Lucide React) para categorías */
export const ICONOS_CATEGORIAS = [
    'ShoppingCart',
    'ShoppingBag',
    'Utensils',
    'Coffee',
    'Car',
    'Fuel',
    'Home',
    'Zap',
    'Heart',
    'Stethoscope',
    'Dumbbell',
    'Plane',
    'Book',
    'GraduationCap',
    'Monitor',
    'Music',
    'Gift',
    'Wrench',
    'Briefcase',
    'DollarSign',
    'TrendingUp',
    'PawPrint',
    'Baby',
    'Scissors',
    'Circle',
] as const;

export type IconoCategoria = (typeof ICONOS_CATEGORIAS)[number];
