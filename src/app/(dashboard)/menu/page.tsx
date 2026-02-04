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
    Menu as MenuIcon,
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
import { IconPickerButton } from "@/components/ui/icon-picker";

interface MenuItem {
    id: number;
    name: string;
    path: string;
    icon: string;
    parentId: number | null;
    sortOrder: number;
    isActive: boolean;
}

// Icon options moved to IconPicker component

export default function MenuPage() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        path: "",
        icon: "Home",
        parentId: null as number | null,
        sortOrder: 0,
        isActive: true,
    });

    const fetchMenus = async () => {
        try {
            const response = await fetch("/api/menus");
            const data = await response.json();
            if (data.success) {
                setMenus(data.data);
            }
        } catch (error) {
            toast.error("Không thể tải danh sách menu");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    const handleSave = async () => {
        if (!formData.name || !formData.path) {
            toast.error("Vui lòng nhập tên và đường dẫn menu");
            return;
        }

        setIsSaving(true);
        try {
            const url = isEditing ? `/api/menus/${selectedMenu?.id}` : "/api/menus";
            const method = isEditing ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(isEditing ? "Cập nhật menu thành công" : "Tạo menu thành công");
                setShowDialog(false);
                fetchMenus();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể lưu menu");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMenu) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/menus/${selectedMenu.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa menu thành công");
                setShowDeleteDialog(false);
                fetchMenus();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa menu");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredMenus = menus.filter(
        (m) =>
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            m.path.toLowerCase().includes(search.toLowerCase())
    );

    const parentMenuOptions = menus.filter((m) => !m.parentId);

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Menu</h1>
                    <p className="text-slate-500">Quản lý cấu trúc menu hệ thống</p>
                </div>
                <Button
                    onClick={() => {
                        setIsEditing(false);
                        setSelectedMenu(null);
                        setFormData({ name: "", path: "", icon: "Home", parentId: null, sortOrder: 0, isActive: true });
                        setShowDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm menu
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm menu..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tên menu</TableHead>
                                <TableHead>Đường dẫn</TableHead>
                                <TableHead>Icon</TableHead>
                                <TableHead>Thứ tự</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredMenus.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                        Không có menu nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMenus.map((menu) => (
                                    <TableRow key={menu.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <MenuIcon className="w-4 h-4 text-slate-400" />
                                                {menu.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{menu.path}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{menu.icon}</Badge>
                                        </TableCell>
                                        <TableCell>{menu.sortOrder}</TableCell>
                                        <TableCell>
                                            <Badge variant={menu.isActive ? "default" : "secondary"}>
                                                {menu.isActive ? "Hoạt động" : "Vô hiệu"}
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
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setIsEditing(true);
                                                            setSelectedMenu(menu);
                                                            setFormData({
                                                                name: menu.name,
                                                                path: menu.path,
                                                                icon: menu.icon,
                                                                parentId: menu.parentId,
                                                                sortOrder: menu.sortOrder,
                                                                isActive: menu.isActive,
                                                            });
                                                            setShowDialog(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedMenu(menu);
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

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Chỉnh sửa menu" : "Thêm menu mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tên menu *</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Đường dẫn *</Label>
                                <Input
                                    value={formData.path}
                                    onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                    placeholder="/example"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <IconPickerButton
                                    value={formData.icon}
                                    onChange={(icon) => setFormData({ ...formData, icon })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Menu cha</Label>
                                <Select
                                    value={formData.parentId?.toString() || "none"}
                                    onValueChange={(value) => setFormData({ ...formData, parentId: value === "none" ? null : parseInt(value) })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Không có" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Không có</SelectItem>
                                        {parentMenuOptions.map((menu) => (
                                            <SelectItem key={menu.id} value={menu.id.toString()}>{menu.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Thứ tự sắp xếp</Label>
                                <Input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                                <Checkbox
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                                />
                                <Label>Kích hoạt</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Hủy</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? "Cập nhật" : "Tạo mới"}
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
                            Bạn có chắc chắn muốn xóa menu {selectedMenu?.name}?
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
