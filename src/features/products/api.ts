/**
 * Inventory (products) API.
 *
 *   GET    /businesses/:id/inventory/products
 *   GET    /businesses/:id/inventory/alerts/low-stock
 *   POST   /businesses/:id/inventory/products
 *   PATCH  /businesses/:id/inventory/products/:productId/stock
 */

import { z } from 'zod';
import { api } from '@/lib/api';
import {
  productSchema,
  type Product,
  type AddProductDto,
  type UpdateStockDto,
} from './schemas';

export async function listProducts(businessId: string): Promise<Product[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/inventory/products`,
  );
  return z.array(productSchema).parse(data);
}

export async function getLowStockAlerts(
  businessId: string,
): Promise<Product[]> {
  const data = await api.get<unknown>(
    `/businesses/${businessId}/inventory/alerts/low-stock`,
  );
  return z.array(productSchema).parse(data);
}

export async function addProduct(
  businessId: string,
  dto: AddProductDto,
): Promise<Product> {
  const data = await api.post<unknown>(
    `/businesses/${businessId}/inventory/products`,
    dto,
  );
  return productSchema.parse(data);
}

export async function updateStock(
  businessId: string,
  productId: string,
  dto: UpdateStockDto,
): Promise<Product> {
  const data = await api.patch<unknown>(
    `/businesses/${businessId}/inventory/products/${productId}/stock`,
    dto,
  );
  return productSchema.parse(data);
}
