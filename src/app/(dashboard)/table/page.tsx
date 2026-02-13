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
    Layout,
    Grid,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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

interface DiningTable {
    id: number;
    name: string;
    area: string;
    capacity: number;
    posX: number;
    posY: number;
    width: number;
    height: number;
    status: "empty" | "occupied";
    isActive: boolean;
}

export default function TableManagementPage() {
    const [tables, setTables] = useState<DiningTable[]>([]);
    const [areas, setAreas] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const [formData, setFormData] = useState({
        name: "",
        area: "Trong nhà",
        capacity: 4,
        isActive: true,
    });

    const fetchData = async () => {
        try {
            const [tablesRes, areasRes] = await Promise.all([
                fetch("/api/tables"),
                fetch("/api/areas")
            ]);
            const tablesData = await tablesRes.json();
            const areasData = await areasRes.json();

            if (tablesData.success) setTables(tablesData.data);
            if (areasData.success) setAreas(areasData.data);
        } catch (error) {
            toast.error("Không thể tải dữ liệu");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setFormData({
            name: "",
            area: areas.length > 0 ? areas[0] : "Trong nhà",
            capacity: 4,
            isActive: true,
        });
    };

    const handleCreate = async () => {
        if (!formData.name) {
            toast.error("Vui lòng nhập tên bàn");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo bàn thành công");
                setShowCreateDialog(false);
                resetForm();
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo bàn");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedTable) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/tables/${selectedTable.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật bàn thành công");
                setShowEditDialog(false);
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật bàn");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTable) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/tables/${selectedTable.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete" }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa bàn thành công");
                setShowDeleteDialog(false);
                fetchData();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa bàn");
        } finally {
            setIsSaving(false);
        }
    };

    const openEditDialog = (table: DiningTable) => {
        setSelectedTable(table);
        setFormData({
            name: table.name,
            area: table.area,
            capacity: table.capacity,
            isActive: table.isActive,
        });
        setShowEditDialog(true);
    };

    const filteredTables = tables.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.area.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTables.length / pageSize);
    const paginatedTables = filteredTables.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => { setPage(1); }, [search]);

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Grid className="w-7 h-7" />
                        Quản lý bàn
                    </h1>
                    <p className="text-slate-500">Quản lý danh sách bàn và khu vực</p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm bàn
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm bàn hoặc khu vực..."
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
                                <TableHead>Tên bàn</TableHead>
                                <TableHead>Khu vực</TableHead>
                                <TableHead>Sức chứa</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Hoạt động</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedTables.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        Không có bàn nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTables.map((table) => (
                                    <TableRow key={table.id}>
                                        <TableCell className="font-medium">{table.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50">
                                                {table.area}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                                {table.capacity} khách
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={table.status === "empty" ? "secondary" : "default"} className={table.status === "empty" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}>
                                                {table.status === "empty" ? "Trống" : "Đang dùng"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={table.isActive ? "default" : "secondary"}>
                                                {table.isActive ? "Hoạt động" : "Ngừng"}
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
                                                    <DropdownMenuItem onClick={() => openEditDialog(table)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedTable(table);
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

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-slate-500">
                                Hiển thị {paginatedTables.length} / {filteredTables.length} bàn
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Trước
                                </Button>
                                <div className="text-sm font-medium px-4">Trang {page} / {totalPages}</div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
                if (!open) {
                    setShowCreateDialog(false);
                    setShowEditDialog(false);
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{showCreateDialog ? "Thêm bàn mới" : "Chỉnh sửa bàn"}</DialogTitle>
                        <DialogDescription>Nhập thông tin chi tiết của bàn</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên bàn *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="VD: Bàn 01"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Khu vực</Label>
                            <Select
                                value={formData.area}
                                onValueChange={(value) => setFormData({ ...formData, area: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn khu vực" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.length > 0 ? (
                                        areas.map(area => (
                                            <SelectItem key={area} value={area}>{area}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="Trong nhà">Trong nhà</SelectItem>
                                    )}
                                    <SelectItem value="new">+ Thêm khu vực mới...</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.area === "new" && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <Label>Tên khu vực mới *</Label>
                                <Input
                                    autoFocus
                                    placeholder="VD: Sân thượng"
                                    onChange={(e) => {
                                        // We'll handle this on save or just directly update area
                                        // For simplicity in this UI, we just use the value
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value) setFormData({ ...formData, area: e.target.value });
                                    }}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Sức chứa (số khách)</Label>
                            <NumberInput
                                value={formData.capacity}
                                onChange={(v) => setFormData({ ...formData, capacity: v })}
                                min={1}
                                maxDecimals={0}
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Checkbox
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">Kích hoạt bàn này</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowCreateDialog(false);
                            setShowEditDialog(false);
                        }}>
                            Hủy
                        </Button>
                        <Button onClick={showCreateDialog ? handleCreate : handleUpdate} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {showCreateDialog ? "Tạo mới" : "Cập nhật"}
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
                            Bạn có chắc chắn muốn xóa bàn <span className="font-semibold text-slate-800">{selectedTable?.name}</span>? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Xác nhận xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
