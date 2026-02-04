import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Product, ProductWarehousePrice, PriceHistory } from "@/lib/db/entities";
import {
    getAuthUser,
    requirePermission,
    successResponse,
    badRequestResponse,
    errorResponse,
} from "@/lib/api-utils";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "product", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Product);

        const product = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
            relations: ["unit", "category", "warehousePrices", "warehousePrices.warehouse"],
        });

        if (!product) {
            return badRequestResponse("Product not found");
        }

        return successResponse(product);
    } catch (error) {
        console.error("Get product error:", error);
        return errorResponse("An error occurred while fetching product");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "product", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const body = await request.json();
        const {
            barcode,
            name,
            description,
            unitId,
            categoryId,
            purchasePrice,
            defaultSellPrice,
            minStock,
            maxStock,
            image,
            isActive,
            warehousePrices
        } = body;

        const db = await initializeDatabase();
        const productRepo = db.getRepository(Product);
        const priceRepo = db.getRepository(ProductWarehousePrice);
        const historyRepo = db.getRepository(PriceHistory);

        const product = await productRepo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!product) {
            return badRequestResponse("Product not found");
        }

        // Track price changes for history
        const priceChanges: { oldPrice: number; newPrice: number; priceType: string; warehouseId?: number }[] = [];

        if (purchasePrice !== undefined && purchasePrice !== product.purchasePrice) {
            priceChanges.push({
                oldPrice: product.purchasePrice,
                newPrice: purchasePrice,
                priceType: "purchase"
            });
            product.purchasePrice = purchasePrice;
        }

        if (defaultSellPrice !== undefined && defaultSellPrice !== product.defaultSellPrice) {
            priceChanges.push({
                oldPrice: product.defaultSellPrice,
                newPrice: defaultSellPrice,
                priceType: "sell"
            });
            product.defaultSellPrice = defaultSellPrice;
        }

        if (barcode !== undefined) product.barcode = barcode;
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (unitId !== undefined) product.unitId = unitId;
        if (categoryId !== undefined) product.categoryId = categoryId;
        if (minStock !== undefined) product.minStock = minStock;
        if (maxStock !== undefined) product.maxStock = maxStock;
        if (image !== undefined) product.image = image;
        if (isActive !== undefined) product.isActive = isActive;
        product.modifiedBy = authUser?.username || "system";

        await productRepo.save(product);

        // Save price history
        for (const change of priceChanges) {
            const history = historyRepo.create({
                productId: product.id,
                warehouseId: change.warehouseId,
                oldPrice: change.oldPrice,
                newPrice: change.newPrice,
                priceType: change.priceType,
                effectiveDate: new Date(),
                createdBy: authUser?.username || "system",
                modifiedBy: authUser?.username || "system",
            });
            await historyRepo.save(history);
        }

        // Update warehouse prices if provided
        if (warehousePrices !== undefined) {
            // Get current prices
            const currentPrices = await priceRepo.find({
                where: { productId: product.id, deleted: false }
            });

            for (const wp of warehousePrices as { warehouseId: number; sellPrice: number }[]) {
                const existing = currentPrices.find(p => p.warehouseId === wp.warehouseId);
                if (existing) {
                    if (existing.sellPrice !== wp.sellPrice) {
                        // Record price change
                        const history = historyRepo.create({
                            productId: product.id,
                            warehouseId: wp.warehouseId,
                            oldPrice: existing.sellPrice,
                            newPrice: wp.sellPrice,
                            priceType: "sell",
                            effectiveDate: new Date(),
                            createdBy: authUser?.username || "system",
                            modifiedBy: authUser?.username || "system",
                        });
                        await historyRepo.save(history);

                        existing.sellPrice = wp.sellPrice;
                        existing.modifiedBy = authUser?.username || "system";
                        await priceRepo.save(existing);
                    }
                } else {
                    const newPrice = priceRepo.create({
                        productId: product.id,
                        warehouseId: wp.warehouseId,
                        sellPrice: wp.sellPrice,
                        createdBy: authUser?.username || "system",
                        modifiedBy: authUser?.username || "system",
                    });
                    await priceRepo.save(newPrice);
                }
            }
        }

        return successResponse(product, "Product updated successfully");
    } catch (error) {
        console.error("Update product error:", error);
        return errorResponse("An error occurred while updating product");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "product", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Product);

        const product = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!product) {
            return badRequestResponse("Product not found");
        }

        product.deleted = true;
        product.deletedAt = new Date();
        product.deletedBy = authUser?.username || "system";

        await repo.save(product);

        return successResponse(null, "Product deleted successfully");
    } catch (error) {
        console.error("Delete product error:", error);
        return errorResponse("An error occurred while deleting product");
    }
}
