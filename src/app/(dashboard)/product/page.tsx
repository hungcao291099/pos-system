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

    const fetchProducts = async () => {
        try {
            const response = await fetch(`/api/products?search=${search}`);
            const data = await response.json();
            if (data.success) {
                setProducts(data.data.items);
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
        fetchProducts();
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

    const updateWarehousePrice = (warehouseId: number, sellPrice: number) => {
        const existing = formData.warehousePrices.find(wp => wp.warehouseId === warehouseId);
        if (existing) {
            setFormData({
                ...formData,
                warehousePrices: formData.warehousePrices.map(wp =>
                    wp.warehouseId === warehouseId ? { ...wp, sellPrice } : wp
                ),
            });
        } else {
            setFormData({
                ...formData,
                warehousePrices: [...formData.warehousePrices, { warehouseId, sellPrice }],
            });
        }
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
                            <Input
                                type="number"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Giá bán mặc định</Label>
                            <Input
                                type="number"
                                value={formData.defaultSellPrice}
                                onChange={(e) => setFormData({ ...formData, defaultSellPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối thiểu</Label>
                            <Input
                                type="number"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối đa</Label>
                            <Input
                                type="number"
                                value={formData.maxStock}
                                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
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
                                <Label>Giá bán theo kho</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {warehouses.map(warehouse => {
                                        const price = formData.warehousePrices.find(wp => wp.warehouseId === warehouse.id);
                                        return (
                                            <div key={warehouse.id} className="flex items-center gap-2">
                                                <span className="min-w-[100px] text-sm">{warehouse.name}:</span>
                                                <Input
                                                    type="number"
                                                    value={price?.sellPrice || ""}
                                                    placeholder="Giá bán"
                                                    onChange={(e) => updateWarehousePrice(warehouse.id, parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
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
                            <Input
                                type="number"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Giá bán mặc định</Label>
                            <Input
                                type="number"
                                value={formData.defaultSellPrice}
                                onChange={(e) => setFormData({ ...formData, defaultSellPrice: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối thiểu</Label>
                            <Input
                                type="number"
                                value={formData.minStock}
                                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tồn tối đa</Label>
                            <Input
                                type="number"
                                value={formData.maxStock}
                                onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
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
                                <Label>Giá bán theo kho</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {warehouses.map(warehouse => {
                                        const price = formData.warehousePrices.find(wp => wp.warehouseId === warehouse.id);
                                        return (
                                            <div key={warehouse.id} className="flex items-center gap-2">
                                                <span className="min-w-[100px] text-sm">{warehouse.name}:</span>
                                                <Input
                                                    type="number"
                                                    value={price?.sellPrice || ""}
                                                    placeholder="Giá bán"
                                                    onChange={(e) => updateWarehousePrice(warehouse.id, parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
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
