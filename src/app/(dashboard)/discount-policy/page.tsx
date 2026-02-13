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
    Tag,
    X,
    Calendar as CalendarIcon,
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
import { NumberInput } from "@/components/ui/number-input";
import { format } from "date-fns";

interface DiscountPolicy {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    categoryId: number | null;
    discountPercentage: number;
    isActive: boolean;
    applyToAll: boolean;
    category?: { id: number; name: string };
}

interface Category {
    id: number;
    name: string;
}

export default function DiscountPolicyPage() {
    const [policies, setPolicies] = useState<DiscountPolicy[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<DiscountPolicy | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd'T'HH:mm"),
        categoryId: null as number | null,
        discountPercentage: 0,
        applyToAll: false,
        isActive: true,
    });

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/discount-policies");
            const data = await response.json();
            if (data.success) {
                setPolicies(data.data);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách chính sách giảm giá");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/product-categories?all=true");
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        fetchPolicies();
        fetchCategories();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), "yyyy-MM-dd'T'HH:mm"),
            categoryId: null,
            discountPercentage: 0,
            applyToAll: false,
            isActive: true,
        });
    };

    const handleCreate = async () => {
        if (!formData.name || formData.discountPercentage <= 0) {
            toast.error("Vui lòng nhập tên và % giảm giá");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/discount-policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo chính sách thành công");
                setShowCreateDialog(false);
                fetchPolicies();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo chính sách");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPolicy) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/discount-policies/${selectedPolicy.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa chính sách thành công");
                setShowDeleteDialog(false);
                fetchPolicies();
            }
        } catch (error) {
            toast.error("Không thể xóa chính sách");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 text-slate-900">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Tag className="w-7 h-7" />
                        Chính sách giảm giá
                    </h1>
                    <p className="text-slate-500">Quản lý giảm giá theo lớp hàng và thời gian</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm chính sách
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm chính sách..."
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
                                <TableHead>Tên chính sách</TableHead>
                                <TableHead>Đối tượng</TableHead>
                                <TableHead>Thời gian</TableHead>
                                <TableHead className="text-right">% Giảm</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPolicies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        Không có chính sách nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPolicies.map((policy) => (
                                    <TableRow key={policy.id}>
                                        <TableCell className="font-medium">{policy.name}</TableCell>
                                        <TableCell>
                                            {policy.applyToAll ? (
                                                <Badge variant="outline" className="bg-slate-100">Tất cả</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-blue-50">{policy.category?.name || "Lớp hàng"}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(policy.startDate), "dd/MM/yyyy HH:mm")} - {format(new Date(policy.endDate), "dd/MM/yyyy HH:mm")}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-red-500">{policy.discountPercentage}%</TableCell>
                                        <TableCell>
                                            <Badge variant={policy.isActive ? "default" : "secondary"}>
                                                {policy.isActive ? "Hoạt động" : "Ngừng"}
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
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedPolicy(policy);
                                                        setFormData({
                                                            name: policy.name,
                                                            startDate: format(new Date(policy.startDate), "yyyy-MM-dd'T'HH:mm"),
                                                            endDate: format(new Date(policy.endDate), "yyyy-MM-dd'T'HH:mm"),
                                                            categoryId: policy.categoryId,
                                                            discountPercentage: Number(policy.discountPercentage),
                                                            applyToAll: policy.applyToAll,
                                                            isActive: policy.isActive,
                                                        });
                                                        setShowEditDialog(true);
                                                    }}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedPolicy(policy);
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

            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-md text-slate-800">
                    <DialogHeader>
                        <DialogTitle>Thêm chính sách giảm giá</DialogTitle>
                        <DialogDescription>Cấu hình giảm giá mới</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tên chính sách *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Giảm giá hè 2024"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Từ ngày *</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Đến ngày *</Label>
                                <Input
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                id="applyToAll"
                                checked={formData.applyToAll}
                                onCheckedChange={(v) => setFormData({ ...formData, applyToAll: !!v, categoryId: v ? null : formData.categoryId })}
                            />
                            <Label htmlFor="applyToAll">Áp dụng cho tất cả sản phẩm</Label>
                        </div>
                        {!formData.applyToAll && (
                            <div className="space-y-2">
                                <Label>Lớp hàng</Label>
                                <Select
                                    value={formData.categoryId?.toString() || ""}
                                    onValueChange={(v) => setFormData({ ...formData, categoryId: v ? parseInt(v) : null })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn lớp hàng" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>% Giảm giá *</Label>
                            <NumberInput
                                value={formData.discountPercentage}
                                onChange={(v) => setFormData({ ...formData, discountPercentage: v })}
                                max={100}
                                min={0}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Hủy</Button>
                        <Button onClick={handleCreate} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="text-slate-800">
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa chính sách "{selectedPolicy?.name}"? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
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
