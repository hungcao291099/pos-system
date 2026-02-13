"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Shield,
    Menu,
    MoreHorizontal,
    Loader2,
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
import { Textarea } from "@/components/ui/textarea";

interface Role {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

interface Permission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
}

interface MenuItem {
    id: number;
    name: string;
    path: string;
}

export default function RolePage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
    const [showMenusDialog, setShowMenusDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
    const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        isActive: true,
    });

    const fetchRoles = async (page = pagination.page) => {
        try {
            const response = await fetch(`/api/roles?search=${search}&page=${page}&pageSize=${pagination.pageSize}`);
            const data = await response.json();
            if (data.success) {
                setRoles(data.data.items);
                setPagination(prev => ({ ...prev, total: data.data.total, totalPages: data.data.totalPages, page }));
            }
        } catch (error) {
            toast.error("Không thể tải danh sách vai trò");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const response = await fetch("/api/permissions?all=true");
            const data = await response.json();
            if (data.success) {
                setPermissions(data.data);
            }
        } catch (error) {
            console.error("Error fetching permissions:", error);
        }
    };

    const fetchMenus = async () => {
        try {
            const response = await fetch("/api/menus");
            const data = await response.json();
            if (data.success) {
                setMenus(data.data);
            }
        } catch (error) {
            console.error("Error fetching menus:", error);
        }
    };

    const fetchRolePermissions = async (roleId: number) => {
        try {
            const response = await fetch(`/api/roles/${roleId}/permissions`);
            const data = await response.json();
            if (data.success) {
                setSelectedPermissionIds(data.data.map((p: any) => p.permissionId));
            }
        } catch (error) {
            console.error("Error fetching role permissions:", error);
        }
    };

    const fetchRoleMenus = async (roleId: number) => {
        try {
            const response = await fetch(`/api/roles/${roleId}/menus`);
            const data = await response.json();
            if (data.success) {
                setSelectedMenuIds(data.data.map((m: any) => m.menuId));
            }
        } catch (error) {
            console.error("Error fetching role menus:", error);
        }
    };

    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchRoles(1);
        fetchPermissions();
        fetchMenus();
    }, [search]);

    const handleCreate = async () => {
        if (!formData.name) {
            toast.error("Vui lòng nhập tên vai trò");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Tạo vai trò thành công");
                setShowCreateDialog(false);
                setFormData({ name: "", description: "", isActive: true });
                fetchRoles();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể tạo vai trò");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật vai trò thành công");
                setShowEditDialog(false);
                fetchRoles();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật vai trò");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole.id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa vai trò thành công");
                setShowDeleteDialog(false);
                fetchRoles();
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể xóa vai trò");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePermissions = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ permissionIds: selectedPermissionIds }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật quyền hạn thành công");
                setShowPermissionsDialog(false);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật quyền hạn");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateMenus = async () => {
        if (!selectedRole) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/roles/${selectedRole.id}/menus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuIds: selectedMenuIds }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success("Cập nhật menu thành công");
                setShowMenusDialog(false);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Không thể cập nhật menu");
        } finally {
            setIsSaving(false);
        }
    };

    const openPermissionsDialog = async (role: Role) => {
        setSelectedRole(role);
        await fetchRolePermissions(role.id);
        setShowPermissionsDialog(true);
    };

    const openMenusDialog = async (role: Role) => {
        setSelectedRole(role);
        await fetchRoleMenus(role.id);
        setShowMenusDialog(true);
    };

    // Group permissions by resource
    const groupedPermissions = permissions.reduce((acc: { [key: string]: Permission[] }, p) => {
        if (!acc[p.resource]) acc[p.resource] = [];
        acc[p.resource].push(p);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý vai trò</h1>
                    <p className="text-slate-500">Quản lý vai trò và phân quyền trong hệ thống</p>
                </div>
                <Button
                    onClick={() => {
                        setFormData({ name: "", description: "", isActive: true });
                        setShowCreateDialog(true);
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm vai trò
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm kiếm vai trò..."
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
                                <TableHead>Tên vai trò</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                                        Không có vai trò nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={role.isActive ? "default" : "secondary"}>
                                                {role.isActive ? "Hoạt động" : "Vô hiệu"}
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
                                                            setSelectedRole(role);
                                                            setFormData({
                                                                name: role.name,
                                                                description: role.description || "",
                                                                isActive: role.isActive,
                                                            });
                                                            setShowEditDialog(true);
                                                        }}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Chỉnh sửa
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openPermissionsDialog(role)}>
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Phân quyền
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openMenusDialog(role)}>
                                                        <Menu className="w-4 h-4 mr-2" />
                                                        Phân menu
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedRole(role);
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
                                Hiển thị {roles.length} / {pagination.total} bản ghi
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => fetchRoles(pagination.page - 1)}>Trước</Button>
                                <div className="text-sm font-medium px-4">Trang {pagination.page} / {pagination.totalPages}</div>
                                <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => fetchRoles(pagination.page + 1)}>Sau</Button>
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
                        <DialogTitle>{showEditDialog ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên vai trò *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                            />
                            <Label>Kích hoạt</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}>
                            Hủy
                        </Button>
                        <Button onClick={showEditDialog ? handleUpdate : handleCreate} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {showEditDialog ? "Cập nhật" : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Phân quyền cho {selectedRole?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {Object.entries(groupedPermissions).map(([resource, perms]) => (
                            <div key={resource} className="space-y-2">
                                <h4 className="font-medium text-slate-700 capitalize">{resource}</h4>
                                <div className="grid grid-cols-2 gap-2 pl-4">
                                    {perms.map((perm) => (
                                        <div key={perm.id} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={selectedPermissionIds.includes(perm.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedPermissionIds([...selectedPermissionIds, perm.id]);
                                                    } else {
                                                        setSelectedPermissionIds(selectedPermissionIds.filter((id) => id !== perm.id));
                                                    }
                                                }}
                                            />
                                            <Label className="text-sm">{perm.action}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>Hủy</Button>
                        <Button onClick={handleUpdatePermissions} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu thay đổi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Menus Dialog */}
            <Dialog open={showMenusDialog} onOpenChange={setShowMenusDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Phân menu cho {selectedRole?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {menus.map((menu) => (
                            <div key={menu.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedMenuIds.includes(menu.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedMenuIds([...selectedMenuIds, menu.id]);
                                        } else {
                                            setSelectedMenuIds(selectedMenuIds.filter((id) => id !== menu.id));
                                        }
                                    }}
                                />
                                <Label>{menu.name} ({menu.path})</Label>
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMenusDialog(false)}>Hủy</Button>
                        <Button onClick={handleUpdateMenus} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu thay đổi
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
                            Bạn có chắc chắn muốn xóa vai trò {selectedRole?.name}?
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
