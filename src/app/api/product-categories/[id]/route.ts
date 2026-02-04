import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { ProductCategory } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "product-category", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(ProductCategory);

        const category = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!category) {
            return badRequestResponse("Category not found");
        }

        return successResponse(category);
    } catch (error) {
        console.error("Get product category error:", error);
        return errorResponse("An error occurred while fetching product category");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "product-category", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const body = await request.json();
        const { name, description, parentId, sortOrder, isActive } = body;

        const db = await initializeDatabase();
        const repo = db.getRepository(ProductCategory);

        const category = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!category) {
            return badRequestResponse("Category not found");
        }

        if (name !== undefined) category.name = name;
        if (description !== undefined) category.description = description;
        if (parentId !== undefined) category.parentId = parentId;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;
        if (isActive !== undefined) category.isActive = isActive;
        category.modifiedBy = authUser?.username || "system";

        await repo.save(category);

        return successResponse(category, "Category updated successfully");
    } catch (error) {
        console.error("Update product category error:", error);
        return errorResponse("An error occurred while updating product category");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "product-category", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(ProductCategory);

        const category = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!category) {
            return badRequestResponse("Category not found");
        }

        // Check if category has children
        const children = await repo.find({
            where: { parentId: parseInt(id), deleted: false },
        });
        if (children.length > 0) {
            return badRequestResponse("Cannot delete category with children");
        }

        category.deleted = true;
        category.deletedAt = new Date();
        category.deletedBy = authUser?.username || "system";

        await repo.save(category);

        return successResponse(null, "Category deleted successfully");
    } catch (error) {
        console.error("Delete product category error:", error);
        return errorResponse("An error occurred while deleting product category");
    }
}
