import needsRaw from '../../../../../data/catalog/needs.json';
import determinantsRaw from '../../../../../data/catalog/determinants.json';
import clustersRaw from '../../../../../data/catalog/clusters.json';

export interface CatalogItem {
  id: string;
  label: string;
  short: string;
  description: string;
}

export const needs: CatalogItem[] = needsRaw;
export const determinants: CatalogItem[] = determinantsRaw;
export const clusters: CatalogItem[] = clustersRaw;
