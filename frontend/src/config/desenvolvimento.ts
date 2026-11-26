import { lerModoCatalogo } from '../catalogo/filtros';

export const demonstrarFluxos = import.meta.env.DEV && import.meta.env.MODE === 'demonstracao';
export const modoCatalogo = lerModoCatalogo(import.meta.env.DEV, import.meta.env.VITE_CATALOGO_DEMO);
