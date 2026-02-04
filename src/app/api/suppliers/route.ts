import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Supplier } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "supplier", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(Supplier);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const all = searchParams.get("all") === "true";

        const queryBuilder = repo
            .createQueryBuilder("supplier")
            .where("supplier.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(supplier.code LIKE :search OR supplier.name LIKE :search OR supplier.phone LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (all) {
            const items = await queryBuilder
                .orderBy("supplier.name", "ASC")
                .getMany();
            return successResponse(items);
        }

        const [items, total] = await queryBuilder
            .orderBy("supplier.created_at", "DESC")
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
        console.error("Get suppliers error:", error);
        return errorResponse("An error occurred while fetching suppliers");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "supplier", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { code, name, address, phone, email, contactPerson, taxCode, notes, isActive = true } = body;

        if (!code || !name) {
            return badRequestResponse("Code and name are required");
        }

        const db = await initializeDatabase();
        const repo = db.getRepository(Supplier);

        // Check if code already exists
        const existing = await repo.findOne({
            where: { code, deleted: false },
        });
        if (existing) {
            return badRequestResponse("Supplier code already exists");
        }

        const supplier = repo.create({
            code,
            name,
            address,
            phone,
            email,
            contactPerson,
            taxCode,
            notes,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await repo.save(supplier);

        return successResponse(supplier, "Supplier created successfully");
    } catch (error) {
        console.error("Create supplier error:", error);
        return errorResponse("An error occurred while creating supplier");
    }
}
