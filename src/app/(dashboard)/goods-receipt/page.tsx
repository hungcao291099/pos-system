"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    FileText,
    Check,
    X,
    Eye,
    Warehouse,
    Truck,
    Calendar,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductPickerDialog } from "@/components/dialogs/ProductPickerDialog";

interface GoodsReceipt {
    id: number;
    receiptNumber: string;
    invoiceNumber?: string;
    receiptDate: string;
    invoiceDate?: string;
    warehouseId: number;
    supplierId?: number;
    notes?: string;
    totalAmount: number;
    grandTotal: number;
    status: "draft" | "confirmed" | "cancelled";
    warehouse?: { name: string };
    supplier?: { name: string };
    details?: any[];
}

interface WarehouseItem {
    id: number;
    name: string;
    code: string;
}

interface Supplier {
    id: number;
    name: string;
    code: string;
}

interface SelectedProduct {
    id: number;
    code: string;
    name: string;
    unitId: number;
    unitName: string;
    purchasePrice: number;
    sellPrice: number;
    quantity: number;
    discountPercent: number;
    taxPercent: number;
}

export default function GoodsReceiptPage() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

    const [formData, setFormData] = useState({
        receiptDate: new Date().toISOString().split("T")[0],
        invoiceNumber: "",
        invoiceDate: "",
        warehouseId: "",
        supplierId: "",
        notes: "",
    });
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

    const fetchReceipts = useCallback(async (page = pagination.page) => {
        if (!user) return;
        setLoading(true);
        try {
            let url = `/api/goods-receipts?page=${page}&pageSize=${pagination.pageSize}`;
            if (statusFilter !== "all") {
                url += `&status=${statusFilter}`;
            }
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setReceipts(data.data.items || []);
                setPagination(prev => ({ ...prev, total: data.data.total || 0, totalPages: data.data.totalPages || 0, page }));
            }
        } catch (error) {
            console.error("Error fetching receipts:", error);
        } finally {
            setLoading(false);
        }
    }, [user, statusFilter, search]);

    const fetchMasterData = useCallback(async () => {
        if (!user) return;
        try {
            const [whRes, supRes] = await Promise.all([
                fetch("/api/warehouses"),
                fetch("/api/suppliers"),
            ]);
            const [whData, supData] = await Promise.all([whRes.json(), supRes.json()]);
            if (whData.success) setWarehouses(whData.data.items || []);
            if (supData.success) setSuppliers(supData.data.items || []);
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    }, [user]);

    useEffect(() => {
        fetchReceipts();
        fetchMasterData();
    }, [fetchReceipts, fetchMasterData]);

    const handleCreate = () => {
        setFormData({
            receiptDate: new Date().toISOString().split("T")[0],
            invoiceNumber: "",
            invoiceDate: "",
            warehouseId: "",
            supplierId: "",
            notes: "",
        });
        setSelectedProducts([]);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.warehouseId) {
            toast.error("Vui lòng chọn kho nhập");
            return;
        }
        if (selectedProducts.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm");
            return;
        }

        setSaving(true);
        try {
            const body = {
                receiptDate: formData.receiptDate,
                invoiceNumber: formData.invoiceNumber || undefined,
                invoiceDate: formData.invoiceDate || undefined,
                warehouseId: parseInt(formData.warehouseId),
                supplierId: formData.supplierId ? parseInt(formData.supplierId) : undefined,
                notes: formData.notes || undefined,
                details: selectedProducts.map((p) => ({
                    productId: p.id,
                    unitId: p.unitId,
                    quantity: p.quantity,
                    unitPrice: p.purchasePrice,
                    discountPercent: p.discountPercent || 0,
                    taxPercent: p.taxPercent || 0,
                })),
            };

            const res = await fetch("/api/goods-receipts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Tạo phiếu nhập thành công");
                setDialogOpen(false);
                fetchReceipts();
            } else {
                toast.error(data.message || "Lỗi tạo phiếu nhập");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async (id: number) => {
        try {
            const res = await fetch(`/api/goods-receipts/${id}/confirm`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success("Xác nhận phiếu nhập thành công");
                fetchReceipts();
            } else {
                toast.error(data.message || "Lỗi xác nhận");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        }
    };

    const handleCancel = async (id: number) => {
        if (!confirm("Bạn có chắc muốn hủy phiếu nhập này?")) return;
        try {
            const res = await fetch(`/api/goods-receipts/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Hủy phiếu nhập thành công");
                fetchReceipts();
            } else {
                toast.error(data.message || "Lỗi hủy phiếu");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        }
    };

    const viewDetail = async (id: number) => {
        try {
            const res = await fetch(`/api/goods-receipts/${id}`);
            const data = await res.json();
            if (data.success) {
                setSelectedReceipt(data.data);
                setDetailDialogOpen(true);
            }
        } catch (error) {
            toast.error("Lỗi tải chi tiết");
        }
    };

    const handleProductSelect = (products: any[]) => {
        setSelectedProducts(
            products.map((p) => ({
                ...p,
                discountPercent: p.discountPercent ?? 0,
                taxPercent: p.taxPercent ?? 10,
            }))
        );
    };

    const updateProductField = (index: number, field: string, value: any) => {
        setSelectedProducts((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    };

    const removeProduct = (index: number) => {
        setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return selectedProducts.reduce((sum, p) => {
            const amount = p.quantity * p.purchasePrice;
            const discount = (amount * (p.discountPercent || 0)) / 100;
            const afterDiscount = amount - discount;
            const tax = (afterDiscount * (p.taxPercent || 0)) / 100;
            return sum + afterDiscount + tax;
        }, 0);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "draft":
                return <Badge variant="secondary">Nháp</Badge>;
            case "confirmed":
                return <Badge className="bg-green-500">Đã xác nhận</Badge>;
            case "cancelled":
                return <Badge variant="destructive">Đã hủy</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Nhập hàng</h1>
                    <p className="text-muted-foreground">Quản lý phiếu nhập hàng</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tạo phiếu nhập
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo số phiếu..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="draft">Nháp</SelectItem>
                                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left p-3">Số phiếu</th>
                                        <th className="text-left p-3">Ngày nhập</th>
                                        <th className="text-left p-3">Số HĐ NCC</th>
                                        <th className="text-left p-3">Kho nhập</th>
                                        <th className="text-left p-3">Nhà cung cấp</th>
                                        <th className="text-right p-3">Tổng tiền</th>
                                        <th className="text-center p-3">Trạng thái</th>
                                        <th className="text-center p-3">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {receipts.map((receipt) => (
                                            <motion.tr
                                                key={receipt.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b hover:bg-muted/50"
                                            >
                                                <td className="p-3 font-mono text-xs">
                                                    {receipt.receiptNumber}
                                                </td>
                                                <td className="p-3">
                                                    {new Date(receipt.receiptDate).toLocaleDateString("vi-VN")}
                                                </td>
                                                <td className="p-3">{receipt.invoiceNumber || "-"}</td>
                                                <td className="p-3">{receipt.warehouse?.name || "-"}</td>
                                                <td className="p-3">{receipt.supplier?.name || "-"}</td>
                                                <td className="p-3 text-right">
                                                    {Number(receipt.grandTotal).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {getStatusBadge(receipt.status)}
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => viewDetail(receipt.id)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {receipt.status === "draft" && (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="text-green-500"
                                                                    onClick={() => handleConfirm(receipt.id)}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="text-red-500"
                                                                    onClick={() => handleCancel(receipt.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {receipts.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                Chưa có phiếu nhập nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-slate-500">
                                Hiển thị {receipts.length} / {pagination.total} bản ghi
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => fetchReceipts(pagination.page - 1)}>Trước</Button>
                                <div className="text-sm font-medium px-4">Trang {pagination.page} / {pagination.totalPages}</div>
                                <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => fetchReceipts(pagination.page + 1)}>Sau</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Tạo phiếu nhập hàng
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Ngày nhập *
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.receiptDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, receiptDate: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Số hóa đơn NCC</Label>
                                <Input
                                    value={formData.invoiceNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, invoiceNumber: e.target.value })
                                    }
                                    placeholder="Số hóa đơn nhà cung cấp"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ngày hóa đơn</Label>
                                <Input
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, invoiceDate: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Warehouse className="h-4 w-4" />
                                    Kho nhập *
                                </Label>
                                <Select
                                    value={formData.warehouseId}
                                    onValueChange={(v) => setFormData({ ...formData, warehouseId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn kho" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((wh) => (
                                            <SelectItem key={wh.id} value={wh.id.toString()}>
                                                {wh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1">
                                    <Truck className="h-4 w-4" />
                                    Nhà cung cấp
                                </Label>
                                <Select
                                    value={formData.supplierId}
                                    onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn NCC" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((sup) => (
                                            <SelectItem key={sup.id} value={sup.id.toString()}>
                                                {sup.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ghi chú</Label>
                            <Textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Ghi chú phiếu nhập..."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    Chi tiết hàng hóa
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setProductPickerOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Chọn hàng hóa
                                </Button>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-2">Mã</th>
                                            <th className="text-left p-2">Tên hàng hóa</th>
                                            <th className="text-left p-2">ĐVT</th>
                                            <th className="text-right p-2">SL</th>
                                            <th className="text-right p-2">Đơn giá</th>
                                            <th className="text-right p-2">CK %</th>
                                            <th className="text-right p-2">Thuế %</th>
                                            <th className="text-right p-2">Thành tiền</th>
                                            <th className="p-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProducts.map((p, index) => {
                                            const amount = p.quantity * p.purchasePrice;
                                            const discount = (amount * (p.discountPercent || 0)) / 100;
                                            const afterDiscount = amount - discount;
                                            const tax = (afterDiscount * (p.taxPercent || 0)) / 100;
                                            const total = afterDiscount + tax;
                                            return (
                                                <tr key={p.id} className="border-b">
                                                    <td className="p-2 font-mono text-xs">{p.code}</td>
                                                    <td className="p-2">{p.name}</td>
                                                    <td className="p-2">{p.unitName}</td>
                                                    <td className="p-2">
                                                        <NumberInput
                                                            value={p.quantity}
                                                            onChange={(v) =>
                                                                updateProductField(
                                                                    index,
                                                                    "quantity",
                                                                    v
                                                                )
                                                            }
                                                            className="w-20 h-8"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <NumberInput
                                                            value={p.purchasePrice}
                                                            onChange={(v) =>
                                                                updateProductField(
                                                                    index,
                                                                    "purchasePrice",
                                                                    v
                                                                )
                                                            }
                                                            className="w-24 h-8"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <NumberInput
                                                            value={p.discountPercent}
                                                            onChange={(v) =>
                                                                updateProductField(
                                                                    index,
                                                                    "discountPercent",
                                                                    v
                                                                )
                                                            }
                                                            className="w-16 h-8"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <NumberInput
                                                            value={p.taxPercent}
                                                            onChange={(v) =>
                                                                updateProductField(
                                                                    index,
                                                                    "taxPercent",
                                                                    v
                                                                )
                                                            }
                                                            className="w-16 h-8"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-right font-medium">
                                                        {total.toLocaleString()}
                                                    </td>
                                                    <td className="p-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-500"
                                                            onClick={() => removeProduct(index)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {selectedProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="p-4 text-center text-muted-foreground">
                                                    Chưa chọn hàng hóa
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {selectedProducts.length > 0 && (
                                        <tfoot className="bg-muted font-medium">
                                            <tr>
                                                <td colSpan={7} className="p-2 text-right">
                                                    Tổng cộng:
                                                </td>
                                                <td className="p-2 text-right text-lg">
                                                    {calculateTotal().toLocaleString()}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu phiếu nhập"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Chi tiết phiếu nhập: {selectedReceipt?.receiptNumber}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedReceipt && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Ngày nhập:</span>{" "}
                                    {new Date(selectedReceipt.receiptDate).toLocaleDateString("vi-VN")}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Kho nhập:</span>{" "}
                                    {selectedReceipt.warehouse?.name}
                                </div>
                                <div>
                                    <span className="text-muted-foreground">NCC:</span>{" "}
                                    {selectedReceipt.supplier?.name || "-"}
                                </div>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-2">Mã</th>
                                            <th className="text-left p-2">Tên</th>
                                            <th className="text-right p-2">SL</th>
                                            <th className="text-right p-2">Đơn giá</th>
                                            <th className="text-right p-2">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReceipt.details?.map((d: any) => (
                                            <tr key={d.id} className="border-b">
                                                <td className="p-2">{d.product?.code}</td>
                                                <td className="p-2">{d.product?.name}</td>
                                                <td className="p-2 text-right">{d.quantity}</td>
                                                <td className="p-2 text-right">
                                                    {Number(d.unitPrice).toLocaleString()}
                                                </td>
                                                <td className="p-2 text-right">
                                                    {Number(d.totalAmount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted font-medium">
                                        <tr>
                                            <td colSpan={4} className="p-2 text-right">
                                                Tổng cộng:
                                            </td>
                                            <td className="p-2 text-right text-lg">
                                                {Number(selectedReceipt.grandTotal).toLocaleString()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ProductPickerDialog
                open={productPickerOpen}
                onOpenChange={setProductPickerOpen}
                onSelect={handleProductSelect}
                mode="purchase"
                initialSelected={selectedProducts}
            />
        </div>
    );
}
