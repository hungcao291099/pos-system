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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "customer", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Customer);

        const customer = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!customer) {
            return badRequestResponse("Customer not found");
        }

        return successResponse(customer);
    } catch (error) {
        console.error("Get customer error:", error);
        return errorResponse("An error occurred while fetching customer");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "customer", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const body = await request.json();
        const { name, address, phone, email, taxCode, customerType, notes, isActive } = body;

        const db = await initializeDatabase();
        const repo = db.getRepository(Customer);

        const customer = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!customer) {
            return badRequestResponse("Customer not found");
        }

        if (name !== undefined) customer.name = name;
        if (address !== undefined) customer.address = address;
        if (phone !== undefined) customer.phone = phone;
        if (email !== undefined) customer.email = email;
        if (taxCode !== undefined) customer.taxCode = taxCode;
        if (customerType !== undefined) customer.customerType = customerType;
        if (notes !== undefined) customer.notes = notes;
        if (isActive !== undefined) customer.isActive = isActive;
        customer.modifiedBy = authUser?.username || "system";

        await repo.save(customer);

        return successResponse(customer, "Customer updated successfully");
    } catch (error) {
        console.error("Update customer error:", error);
        return errorResponse("An error occurred while updating customer");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "customer", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Customer);

        const customer = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!customer) {
            return badRequestResponse("Customer not found");
        }

        customer.deleted = true;
        customer.deletedAt = new Date();
        customer.deletedBy = authUser?.username || "system";

        await repo.save(customer);

        return successResponse(null, "Customer deleted successfully");
    } catch (error) {
        console.error("Delete customer error:", error);
        return errorResponse("An error occurred while deleting customer");
    }
}
