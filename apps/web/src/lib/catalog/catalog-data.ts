import needsRaw from '../../../../../data/catalog/needs.json';
import determinantsRaw from '../../../../../data/catalog/determinants.json';
import clustersRaw from '../../../../../data/catalog/clusters.json';

export interface CatalogItem {
  id: string;
  label: string;
  short: string;
  description: string;
}

export const needs: readonly CatalogItem[] = needsRaw;
export const determinants: readonly CatalogItem[] = determinantsRaw;
export const clusters: readonly CatalogItem[] = clustersRaw;
