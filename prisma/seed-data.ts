import type { PrismaClient } from "../src/generated/prisma/client";
import { academy } from "../src/data/academy";
import { KIT_CIS_5P_RESOURCE_DEFINITIONS } from "../src/data/resources";

export const KIT_CIS_5P_SLUG = "kit-cis-5p";
export const KIT_CIS_5P_TITLE = "Kit CIS 5P — Mantenimiento Preventivo de Aire Acondicionado Split";

export async function seedAcademyProducts(prisma: PrismaClient) {
  const product = await prisma.product.upsert({
    where: { slug: KIT_CIS_5P_SLUG },
    create: { slug: KIT_CIS_5P_SLUG, title: KIT_CIS_5P_TITLE, description: academy.featuredProduct.description, type: "KIT", status: "PUBLISHED", accessType: "ONE_TIME", price: null, currency: "ARS" },
    update: { title: KIT_CIS_5P_TITLE, description: academy.featuredProduct.description, type: "KIT", status: "PUBLISHED", accessType: "ONE_TIME" },
  });

  for (const resource of KIT_CIS_5P_RESOURCE_DEFINITIONS) {
    await prisma.resource.upsert({
      where: { productId_title: { productId: product.id, title: resource.title } },
      create: {
        productId: product.id,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        status: "COMING_SOON",
        position: resource.position,
      },
      update: {
        description: resource.description,
        type: resource.type,
        position: resource.position,
      },
    });
  }

  return product;
}
