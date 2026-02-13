"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MoreHorizontal,
    Loader2,
    Package,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";

interface Product {
    id: number;
    code: string;
    barcode: string;
    name: string;
    description: string;
    unitId: number;
    categoryId: number | null;
    purchasePrice: number;
    defaultSellPrice: number;
    minStock: number;
    maxStock: number;
    image: string;
    isActive: boolean;
    unit?: { id: number; name: string };
    category?: { id: number; name: string };
    warehousePrices?: { warehouseId: number; sellPrice: number; warehouse?: { id: number; name: string } }[];
}

interface Unit {
    id: number;
    name: string;
    code: string;
}

interface Category {
    id: number;
    name: string;
    code: string;
}

interface Warehouse {
    id: number;
    name: string;
    code: string;
}

export default function ProductPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

    const [formData, setFormData] = useState({
        code: "",
        barcode: "",
        name: "",
        description: "",
        unitId: 0,
        categoryId: null as number | null,
        purchasePrice: 0,
        defaultSellPrice: 0,
        minStock: 0,
        maxStock: 0,
        image: "",
        isActive: true,
        warehousePrices: [] as { warehouseId: number; sellPrice: number }[],
    });

    const fetchProducts = async (page = pagination.page) => {
        try {
            const response = await fetch(`/api/products?search=${search}&page=${page}&pageSize=${pagination.pageSize}`);
            const data = await response.json();
            if (data.success) {
                setProducts(data.data.items);
                setPagination(prev => ({ ...prev, total: data.data.total, totalPages: data.data.totalPages, page }));
            }
        } catch (error) {
            toast.error("Không thể tải danh sách sản phẩm");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [unitsRes, categoriesRes, warehousesRes] = await Promise.all([
                fetch("/api/units?all=true"),
                fetch("/api/product-categories?all=true"),
                fetch("/api/warehouses?all=true"),
            ]);
            const unitsData = await unitsRes.json();
            const categoriesData = await categoriesRes.json();
            const warehousesData = await warehousesRes.json();

            if (unitsData.success) setUnits(unitsData.data);
            if (categoriesData.success) setCategories(categoriesData.data);
            if (warehousesData.success) setWarehouses(warehousesData.data);
        } catch (error) {
            console.error("Error fetching master data:", error);
        }
    };

    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchProducts(1);
        fetchMasterData();
    }, [search]);

    const resetForm = () => {
        setFormData({
            code: "",
            barcode: "",
            name: "",
            description: "",
            unitId: 0,
            categoryId: null,
            purchasePrice: 0,
            defaultSellPrice: 0,
            minStock: 0,
            maxStock: 0,
            image: "",
            isActive: true,
            warehousePrices: [],
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(value);
    };

    const handleCreate = async () => {
        if (!formData.code || !formData.name || !formData.unitId) {
            toast.error("Vui lòng nhập mã, tên và đơn vị tính");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo sản phẩm thành công");
                setShowCreateDialog(false);
                resetForm();
                fetchProducts();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo sản phẩm");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedProduct) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/products/${selectedProduct.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật sản phẩm thành công");
                setShowEditDialog(false);
                fetchProducts();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật sản phẩm");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProduct) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/products/${selectedProduct.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa sản phẩm thành công");
                setShowDeleteDialog(false);
                fetchProducts();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa sản phẩm");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            code: product.code,
            barcode: product.barcode || "",
            name: product.name,
            description: product.description || "",
            unitId: product.unitId,
            categoryId: product.categoryId,
            purchasePrice: product.purchasePrice,
            defaultSellPrice: product.defaultSellPrice,
            minStock: product.minStock,
            maxStock: product.maxStock || 0,
            image: product.image || "",
            isActive: product.isActive,
            warehousePrices: product.warehousePrices?.map(wp => ({
                warehouseId: wp.warehouseId,
                sellPrice: wp.sellPrice,
            })) || [],
        });
        setShowEditDialog(true);
    };

    const addWarehousePriceRow = () => {
        // Pick the first warehouse not yet added
        const usedIds = formData.warehousePrices.map(wp => wp.warehouseId);
        const available = warehouses.filter(w => !usedIds.includes(w.id));
        if (available.length === 0) {
            toast.error("Đã thêm hết tất cả các kho");
            return;
        }
        setFormData({
            ...formData,
            warehousePrices: [...formData.warehousePrices, { warehouseId: available[0].id, sellPrice: 0 }],
        });
    };

    const removeWarehousePriceRow = (index: number) => {
        setFormData({
            ...formData,
            warehousePrices: formData.warehousePrices.filter((_, i) => i !== index),
        });
    };

    const updateWarehousePrice = (index: number, field: "warehouseId" | "sellPrice", value: number) => {
        setFormData({
            ...formData,
            warehousePrices: formData.warehousePrices.map((wp, i) =>
                i === index ? { ...wp, [field]: value } : wp
            ),
        });
    };

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-7 h-7" />
                        Quản lý sản phẩm
                    </h1>
                    <p className="text-slate-500">Quản lý danh mục sản phẩm</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm sản phẩm
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm sản phẩm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã</TableHead>
                                <TableHead>Tên</TableHead>
                                <TableHead>Đơn vị</TableHead>
                                <TableHead>Lớp hàng</TableHead>
                                <TableHead className="text-right">Giá nhập</TableHead>
                                <TableHead className="text-right">Giá bán</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                                        Không có sản phẩm nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.code}</TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>{product.unit?.name || "-"}</TableCell>
                                        <TableCell>{product.category?.name || "-"}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(product.purchasePrice)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(product.defaultSellPrice)}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.isActive ? "default" : "secondary"}>
                                                {product.isActive ? "Hoạt động" : "Ngừng"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-slate-500">
                                Hiển thị {products.length} / {pagination.total} bản ghi
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => fetchProducts(pagination.page - 1)}>Trước</Button>
                                <div className="text-sm font-medium px-4">Trang {pagination.page} / {pagination.totalPages}</div>
                                <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => fetchProducts(pagination.page + 1)}>Sau</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Thêm sản phẩm mới</DialogTitle>
                        <DialogDescription>Nhập thông tin sản phẩm</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã sản phẩm *</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Barcode</Label>
                            <Input
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Tên sản phẩm *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Đơn vị tính *</Label>
                            <Select
                                value={formData.unitId?.toString() || "0"}
                                onValueChange={(value) => setFormData({ ...formData, unitId: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn đơn vị tính" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map(unit => (
                                        <SelectItem key={unit.id} value={unit.id.toString()}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Lớp hàng</Label>
                            <Select
                                value={formData.categoryId?.toString() || "none"}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? null : parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp hàng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không có</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Giá nhập</Label>
                            <NumberInput
                                value={formData.purchasePrice}
                                onChange={(v) => setFormData({ ...formData, purchasePrice: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Giá bán mặc định</Label>
                            <NumberInput
                                value={formData.defaultSellPrice}
                                onChange={(v) => setFormData({ ...formData, defaultSellPrice: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối thiểu</Label>
                            <NumberInput
                                value={formData.minStock}
                                onChange={(v) => setFormData({ ...formData, minStock: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối đa</Label>
                            <NumberInput
                                value={formData.maxStock}
                                onChange={(v) => setFormData({ ...formData, maxStock: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                        {warehouses.length > 0 && (
                            <div className="col-span-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Giá bán theo kho</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addWarehousePriceRow}
                                        disabled={formData.warehousePrices.length >= warehouses.length}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Thêm kho
                                    </Button>
                                </div>
                                {formData.warehousePrices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Chưa có giá theo kho. Sẽ sử dụng giá bán mặc định.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.warehousePrices.map((wp, index) => {
                                            const usedIds = formData.warehousePrices.filter((_, i) => i !== index).map(w => w.warehouseId);
                                            const availableWarehouses = warehouses.filter(w => !usedIds.includes(w.id));
                                            return (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Select
                                                        value={wp.warehouseId.toString()}
                                                        onValueChange={(v) => updateWarehousePrice(index, "warehouseId", parseInt(v))}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableWarehouses.map(w => (
                                                                <SelectItem key={w.id} value={w.id.toString()}>
                                                                    {w.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <NumberInput
                                                        value={wp.sellPrice || 0}
                                                        placeholder="Giá bán"
                                                        onChange={(v) => updateWarehousePrice(index, "sellPrice", v)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeWarehousePriceRow(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleCreate} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tạo mới
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
                        <DialogDescription>Cập nhật thông tin sản phẩm</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã sản phẩm</Label>
                            <Input value={formData.code} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Barcode</Label>
                            <Input
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Tên sản phẩm *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Đơn vị tính *</Label>
                            <Select
                                value={formData.unitId?.toString() || "0"}
                                onValueChange={(value) => setFormData({ ...formData, unitId: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn đơn vị tính" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map(unit => (
                                        <SelectItem key={unit.id} value={unit.id.toString()}>
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Lớp hàng</Label>
                            <Select
                                value={formData.categoryId?.toString() || "none"}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value === "none" ? null : parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp hàng" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không có</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Giá nhập</Label>
                            <NumberInput
                                value={formData.purchasePrice}
                                onChange={(v) => setFormData({ ...formData, purchasePrice: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Giá bán mặc định</Label>
                            <NumberInput
                                value={formData.defaultSellPrice}
                                onChange={(v) => setFormData({ ...formData, defaultSellPrice: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối thiểu</Label>
                            <NumberInput
                                value={formData.minStock}
                                onChange={(v) => setFormData({ ...formData, minStock: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối đa</Label>
                            <NumberInput
                                value={formData.maxStock}
                                onChange={(v) => setFormData({ ...formData, maxStock: v })}
                                placeholder="0"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                        {warehouses.length > 0 && (
                            <div className="col-span-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Giá bán theo kho</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addWarehousePriceRow}
                                        disabled={formData.warehousePrices.length >= warehouses.length}
                                    >
                                        <Plus className="w-3 h-3 mr-1" />
                                        Thêm kho
                                    </Button>
                                </div>
                                {formData.warehousePrices.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">Chưa có giá theo kho. Sẽ sử dụng giá bán mặc định.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {formData.warehousePrices.map((wp, index) => {
                                            const usedIds = formData.warehousePrices.filter((_, i) => i !== index).map(w => w.warehouseId);
                                            const availableWarehouses = warehouses.filter(w => !usedIds.includes(w.id));
                                            return (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Select
                                                        value={wp.warehouseId.toString()}
                                                        onValueChange={(v) => updateWarehousePrice(index, "warehouseId", parseInt(v))}
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableWarehouses.map(w => (
                                                                <SelectItem key={w.id} value={w.id.toString()}>
                                                                    {w.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <NumberInput
                                                        value={wp.sellPrice || 0}
                                                        placeholder="Giá bán"
                                                        onChange={(v) => updateWarehousePrice(index, "sellPrice", v)}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeWarehousePriceRow(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="col-span-2 flex items-center gap-2">
                            <Checkbox
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                            />
                            <Label>Đang hoạt động</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleUpdate} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa sản phẩm {selectedProduct?.name}? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
