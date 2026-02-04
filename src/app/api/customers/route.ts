import { NextRequest } from "next/server";
import { initializeDatabase } from "@/lib/db/data-source";
import { Customer } from "@/lib/db/entities";
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
        const permissionCheck = requirePermission(user, "customer", "read");
        if (permissionCheck) return permissionCheck;

        const db = await initializeDatabase();
        const repo = db.getRepository(Customer);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "10");
        const search = searchParams.get("search") || "";
        const all = searchParams.get("all") === "true";

        const queryBuilder = repo
            .createQueryBuilder("customer")
            .where("customer.deleted = :deleted", { deleted: false });

        if (search) {
            queryBuilder.andWhere(
                "(customer.code LIKE :search OR customer.name LIKE :search OR customer.phone LIKE :search)",
                { search: `%${search}%` }
            );
        }

        if (all) {
            const items = await queryBuilder
                .orderBy("customer.name", "ASC")
                .getMany();
            return successResponse(items);
        }

        const [items, total] = await queryBuilder
            .orderBy("customer.created_at", "DESC")
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
        console.error("Get customers error:", error);
        return errorResponse("An error occurred while fetching customers");
    }
}

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "customer", "create");
        if (permissionCheck) return permissionCheck;

        const body = await request.json();
        const { code, name, address, phone, email, taxCode, customerType, notes, isActive = true } = body;

        if (!code || !name) {
            return badRequestResponse("Code and name are required");
        }

        const db = await initializeDatabase();
        const repo = db.getRepository(Customer);

        // Check if code already exists
        const existing = await repo.findOne({
            where: { code, deleted: false },
        });
        if (existing) {
            return badRequestResponse("Customer code already exists");
        }

        const customer = repo.create({
            code,
            name,
            address,
            phone,
            email,
            taxCode,
            customerType,
            notes,
            isActive,
            createdBy: authUser?.username || "system",
            modifiedBy: authUser?.username || "system",
        });

        await repo.save(customer);

        return successResponse(customer, "Customer created successfully");
    } catch (error) {
        console.error("Create customer error:", error);
        return errorResponse("An error occurred while creating customer");
    }
}
