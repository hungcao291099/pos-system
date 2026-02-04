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
    Layers,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface ProductCategory {
    id: number;
    code: string;
    name: string;
    description: string;
    parentId: number | null;
    sortOrder: number;
    isActive: boolean;
    children?: ProductCategory[];
}

export default function ProductCategoryPage() {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [flatCategories, setFlatCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        parentId: null as number | null,
        sortOrder: 0,
        isActive: true,
    });

    const fetchCategories = async () => {
        try {
            const [treeRes, flatRes] = await Promise.all([
                fetch(`/api/product-categories?tree=true`),
                fetch(`/api/product-categories?all=true`)
            ]);
            const treeData = await treeRes.json();
            const flatData = await flatRes.json();

            if (treeData.success) {
                setCategories(treeData.data);
            }
            if (flatData.success) {
                setFlatCategories(flatData.data);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách lớp hàng");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            description: "",
            parentId: null,
            sortOrder: 0,
            isActive: true,
        });
    };

    const handleCreate = async () => {
        if (!formData.code || !formData.name) {
            toast.error("Vui lòng nhập mã và tên lớp hàng");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/product-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo lớp hàng thành công");
                setShowCreateDialog(false);
                resetForm();
                fetchCategories();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo lớp hàng");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedCategory) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/product-categories/${selectedCategory.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật lớp hàng thành công");
                setShowEditDialog(false);
                fetchCategories();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật lớp hàng");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/product-categories/${selectedCategory.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa lớp hàng thành công");
                setShowDeleteDialog(false);
                fetchCategories();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa lớp hàng");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (category: ProductCategory) => {
        setSelectedCategory(category);
        setFormData({
            code: category.code,
            name: category.name,
            description: category.description || "",
            parentId: category.parentId,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
        });
        setShowEditDialog(true);
    };

    const renderCategoryRow = (category: ProductCategory, depth = 0): React.ReactNode => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.includes(category.id);

        return (
            <React.Fragment key={category.id}>
                <TableRow>
                    <TableCell className="font-medium">
                        <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(category.id)}
                                    className="mr-2 p-1 hover:bg-slate-100 rounded"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </button>
                            ) : (
                                <span className="w-6 mr-2" />
                            )}
                            {category.code}
                        </div>
                    </TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Hoạt động" : "Ngừng"}
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
                                <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedCategory(category);
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
                {hasChildren && isExpanded && category.children!.map(child => renderCategoryRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    const filteredCategories = search
        ? flatCategories.filter(c =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase())
        )
        : categories;

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-7 h-7" />
                        Quản lý lớp hàng
                    </h1>
                    <p className="text-slate-500">Quản lý danh mục lớp hàng</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm lớp hàng
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm lớp hàng..."
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
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Thứ tự</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        Không có lớp hàng nào
                                    </TableCell>
                                </TableRow>
                            ) : search ? (
                                filteredCategories.map(category => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.code}</TableCell>
                                        <TableCell>{category.name}</TableCell>
                                        <TableCell>{category.description || "-"}</TableCell>
                                        <TableCell>{category.sortOrder}</TableCell>
                                        <TableCell>
                                            <Badge variant={category.isActive ? "default" : "secondary"}>
                                                {category.isActive ? "Hoạt động" : "Ngừng"}
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
                                                    <DropdownMenuItem onClick={() => openEditDialog(category)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedCategory(category);
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
                            ) : (
                                filteredCategories.map(category => renderCategoryRow(category))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm lớp hàng mới</DialogTitle>
                        <DialogDescription>Nhập thông tin lớp hàng</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mã lớp hàng *</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tên lớp hàng *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Lớp hàng cha</Label>
                            <Select
                                value={formData.parentId?.toString() || "none"}
                                onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? null : parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp hàng cha" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không có</SelectItem>
                                    {flatCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Thứ tự sắp xếp</Label>
                            <Input
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa lớp hàng</DialogTitle>
                        <DialogDescription>Cập nhật thông tin lớp hàng</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mã lớp hàng</Label>
                            <Input value={formData.code} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Tên lớp hàng *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Lớp hàng cha</Label>
                            <Select
                                value={formData.parentId?.toString() || "none"}
                                onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? null : parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lớp hàng cha" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Không có</SelectItem>
                                    {flatCategories.filter(cat => cat.id !== selectedCategory?.id).map(cat => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Thứ tự sắp xếp</Label>
                            <Input
                                type="number"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
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
                            Bạn có chắc chắn muốn xóa lớp hàng {selectedCategory?.name}? Hành động này không thể hoàn tác.
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
