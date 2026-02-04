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

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "product-category", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(ProductCategory);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const all = searchParams.get("all") === "true";
        const tree = searchParams.get("tree") === "true";

        const queryBuilder = repo
            .createQueryBuilder("category")
            .where("category.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(category.code LIKE :search OR category.name LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (all || tree) {
            const items = await queryBuilder
                .orderBy("category.sort_order", "ASC")
                .addOrderBy("category.name", "ASC")
                .getMany();

            if (tree) {
                // Build tree structure
                interface CategoryNode {
                    id: number;
                    code: string;
                    name: string;
                    description: string;
                    parentId: number | null;
                    sortOrder: number;
                    isActive: boolean;
                    children: CategoryNode[];
                }
                const buildTree = (items: ProductCategory[], parentId: number | null = null): CategoryNode[] => {
                    return items
                        .filter(item => item.parentId === parentId)
                        .map(item => ({
                            id: item.id,
                            code: item.code,
                            name: item.name,
                            description: item.description,
                            parentId: item.parentId,
                            sortOrder: item.sortOrder,
                            isActive: item.isActive,
                            children: buildTree(items, item.id)
                        }));
                };
                return successResponse(buildTree(items, null));
            }

            return successResponse(items);
        }

        const [items, total] = await queryBuilder
            .orderBy("category.created_at", "DESC")
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();

        return successResponse({
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });
    } catch (error) {
        console.error("Get product categories error:", error);
        return errorResponse("An error occurred while fetching product categories");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "product-category", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { code, name, description, parentId, sortOrder = 0, isActive = true } = body;

        if (!code || !name) {
            return badRequestResponse("Code and name are required");
        }

        const db = await initializeDatabase();
        const repo = db.getRepository(ProductCategory);

        // Check if code already exists
        const existing = await repo.findOne({
            where: { code, deleted: false },
        });
        if (existing) {
            return badRequestResponse("Category code already exists");
        }

        const category = repo.create({
            code,
            name,
            description,
            parentId: parentId || null,
            sortOrder,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await repo.save(category);

        return successResponse(category, "Category created successfully");
    } catch (error) {
        console.error("Create product category error:", error);
        return errorResponse("An error occurred while creating product category");
    }
}
