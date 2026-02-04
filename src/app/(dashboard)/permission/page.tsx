"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface Permission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
}

const resourceOptions = ["user", "role", "menu", "permission", "product", "order", "customer", "report"];
const actionOptions = ["create", "read", "update", "delete"];

export default function PermissionPage() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: "", description: "", resource: "user", action: "read",
    });

    const fetchPermissions = async () => {
        try {
            const response = await fetch("/api/permissions?all=true");
            const data = await response.json();
            if (data.success) setPermissions(data.data);
        } catch (error) {
            toast.error("Không thể tải danh sách quyền hạn");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPermissions(); }, []);

    const updateName = (resource: string, action: string) => {
        setFormData((prev) => ({ ...prev, resource, action, name: `${resource}:${action}` }));
    };

    const handleSave = async () => {
        if (!formData.resource || !formData.action) {
            toast.error("Vui lòng chọn resource và action"); return;
        }
        setIsSaving(true);
        try {
            const url = isEditing ? `/api/permissions/${selectedPermission?.id}` : "/api/permissions";
            const method = isEditing ? "PUT" : "POST";
            const payload = { ...formData, name: `${formData.resource}:${formData.action}` };
            const response = await fetch(url, {
                method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(isEditing ? "Cập nhật quyền hạn thành công" : "Tạo quyền hạn thành công");
                setShowDialog(false); fetchPermissions();
            } else toast.error(data.error);
        } catch (error) {
            toast.error("Không thể lưu quyền hạn");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPermission) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/permissions/${selectedPermission.id}`, { method: "DELETE" });
            const data = await response.json();
            if (data.success) {
                toast.success("Xóa quyền hạn thành công"); setShowDeleteDialog(false); fetchPermissions();
            } else toast.error(data.error);
        } catch (error) {
            toast.error("Không thể xóa quyền hạn");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPermissions = permissions.filter(
        (p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.resource.toLowerCase().includes(search.toLowerCase())
    );

    // Group by resource
    const groupedPermissions = filteredPermissions.reduce((acc: { [key: string]: Permission[] }, p) => {
        if (!acc[p.resource]) acc[p.resource] = [];
        acc[p.resource].push(p);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Quyền hạn</h1>
                    <p className="text-slate-500">Quản lý các quyền hạn trong hệ thống</p>
                </div>
                <Button onClick={() => {
                    setIsEditing(false); setSelectedPermission(null);
                    setFormData({ name: "", description: "", resource: "user", action: "read" });
                    setShowDialog(true);
                }} className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" /> Thêm quyền
                </Button>
            </motion.div>

            <Card className="border-0 shadow-md">
                <CardHeader className="pb-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-20 w-full" />))}
                        </div>
                    ) : Object.keys(groupedPermissions).length === 0 ? (
                        <div className="text-center text-slate-500 py-8">Không có quyền hạn nào</div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                <div key={resource}>
                                    <h3 className="font-semibold text-slate-700 capitalize mb-3 flex items-center gap-2">
                                        <Badge variant="outline">{resource}</Badge>
                                        <span className="text-sm text-slate-400">({perms.length} quyền)</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {perms.map((perm) => (
                                            <motion.div key={perm.id} whileHover={{ scale: 1.02 }}
                                                className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <Badge className="mb-2">{perm.action}</Badge>
                                                        <p className="text-xs text-slate-500">{perm.description || "Không có mô tả"}</p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                <MoreHorizontal className="w-3 h-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                setIsEditing(true); setSelectedPermission(perm);
                                                                setFormData({ name: perm.name, description: perm.description || "", resource: perm.resource, action: perm.action });
                                                                setShowDialog(true);
                                                            }}>
                                                                <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => { setSelectedPermission(perm); setShowDeleteDialog(true); }} className="text-red-600">
                                                                <Trash2 className="w-4 h-4 mr-2" /> Xóa
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Chỉnh sửa quyền hạn" : "Thêm quyền hạn mới"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Resource *</Label>
                                <Select value={formData.resource} onValueChange={(value) => updateName(value, formData.action)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {resourceOptions.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Action *</Label>
                                <Select value={formData.action} onValueChange={(value) => updateName(formData.resource, value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {actionOptions.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tên quyền</Label>
                            <Input value={`${formData.resource}:${formData.action}`} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>Bạn có chắc chắn muốn xóa quyền hạn {selectedPermission?.name}?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
