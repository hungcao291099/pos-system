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
    Ruler,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

interface Unit {
    id: number;
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

export default function UnitPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        code: "",
        name: "",
        description: "",
        isActive: true,
    });

    const fetchUnits = async () => {
        try {
            const response = await fetch(`/api/units?search=${search}`);
            const data = await response.json();
            if (data.success) {
                setUnits(data.data.items);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách đơn vị tính");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, [search]);

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            description: "",
            isActive: true,
        });
    };

    const handleCreate = async () => {
        if (!formData.code || !formData.name) {
            toast.error("Vui lòng nhập mã và tên đơn vị tính");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/units", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo đơn vị tính thành công");
                setShowCreateDialog(false);
                resetForm();
                fetchUnits();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo đơn vị tính");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedUnit) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/units/${selectedUnit.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật đơn vị tính thành công");
                setShowEditDialog(false);
                fetchUnits();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật đơn vị tính");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUnit) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/units/${selectedUnit.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa đơn vị tính thành công");
                setShowDeleteDialog(false);
                fetchUnits();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa đơn vị tính");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (unit: Unit) => {
        setSelectedUnit(unit);
        setFormData({
            code: unit.code,
            name: unit.name,
            description: unit.description || "",
            isActive: unit.isActive,
        });
        setShowEditDialog(true);
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
                        <Ruler className="w-7 h-7" />
                        Quản lý đơn vị tính
                    </h1>
                    <p className="text-slate-500">Quản lý danh mục đơn vị tính</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm đơn vị tính
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm đơn vị tính..."
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
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : units.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                                        Không có đơn vị tính nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                units.map((unit) => (
                                    <TableRow key={unit.id}>
                                        <TableCell className="font-medium">{unit.code}</TableCell>
                                        <TableCell>{unit.name}</TableCell>
                                        <TableCell>{unit.description || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={unit.isActive ? "default" : "secondary"}>
                                                {unit.isActive ? "Hoạt động" : "Ngừng"}
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
                                                    <DropdownMenuItem onClick={() => openEditDialog(unit)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUnit(unit);
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Thêm đơn vị tính mới</DialogTitle>
                        <DialogDescription>Nhập thông tin đơn vị tính</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mã đơn vị tính *</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tên đơn vị tính *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                        <DialogTitle>Chỉnh sửa đơn vị tính</DialogTitle>
                        <DialogDescription>Cập nhật thông tin đơn vị tính</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mã đơn vị tính</Label>
                            <Input value={formData.code} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Tên đơn vị tính *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                            Bạn có chắc chắn muốn xóa đơn vị tính {selectedUnit?.name}? Hành động này không thể hoàn tác.
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
