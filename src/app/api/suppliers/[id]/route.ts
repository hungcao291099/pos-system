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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(request);
        const permissionCheck = requirePermission(user, "supplier", "read");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Supplier);

        const supplier = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!supplier) {
            return badRequestResponse("Supplier not found");
        }

        return successResponse(supplier);
    } catch (error) {
        console.error("Get supplier error:", error);
        return errorResponse("An error occurred while fetching supplier");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "supplier", "update");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const body = await request.json();
        const { name, address, phone, email, contactPerson, taxCode, notes, isActive } = body;

        const db = await initializeDatabase();
        const repo = db.getRepository(Supplier);

        const supplier = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!supplier) {
            return badRequestResponse("Supplier not found");
        }

        if (name !== undefined) supplier.name = name;
        if (address !== undefined) supplier.address = address;
        if (phone !== undefined) supplier.phone = phone;
        if (email !== undefined) supplier.email = email;
        if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
        if (taxCode !== undefined) supplier.taxCode = taxCode;
        if (notes !== undefined) supplier.notes = notes;
        if (isActive !== undefined) supplier.isActive = isActive;
        supplier.modifiedBy = authUser?.username || "system";

        await repo.save(supplier);

        return successResponse(supplier, "Supplier updated successfully");
    } catch (error) {
        console.error("Update supplier error:", error);
        return errorResponse("An error occurred while updating supplier");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authUser = await getAuthUser(request);
        const permissionCheck = requirePermission(authUser, "supplier", "delete");
        if (permissionCheck) return permissionCheck;

        const { id } = await params;
        const db = await initializeDatabase();
        const repo = db.getRepository(Supplier);

        const supplier = await repo.findOne({
            where: { id: parseInt(id), deleted: false },
        });

        if (!supplier) {
            return badRequestResponse("Supplier not found");
        }

        supplier.deleted = true;
        supplier.deletedAt = new Date();
        supplier.deletedBy = authUser?.username || "system";

        await repo.save(supplier);

        return successResponse(null, "Supplier deleted successfully");
    } catch (error) {
        console.error("Delete supplier error:", error);
        return errorResponse("An error occurred while deleting supplier");
    }
}
