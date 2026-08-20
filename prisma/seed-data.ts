import type { PrismaClient } from "../src/generated/prisma/client";
import { academy } from "../src/data/academy";

export const KIT_CIS_5P_SLUG = "kit-cis-5p";
export const KIT_CIS_5P_TITLE = "Kit CIS 5P — Mantenimiento Preventivo de Aire Acondicionado Split";

export async function seedAcademyProducts(prisma: PrismaClient) {
  return prisma.product.upsert({
    where: { slug: KIT_CIS_5P_SLUG },
    create: { slug: KIT_CIS_5P_SLUG, title: KIT_CIS_5P_TITLE, description: academy.featuredProduct.description, type: "KIT", status: "PUBLISHED", accessType: "ONE_TIME", price: null, currency: "ARS" },
    update: { title: KIT_CIS_5P_TITLE, description: academy.featuredProduct.description, type: "KIT", status: "PUBLISHED", accessType: "ONE_TIME" },
  });
}
