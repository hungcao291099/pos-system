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
    GripVertical,
} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

interface SortableRowProps {
    menu: MenuItem;
    onEdit: (menu: MenuItem) => void;
    onDelete: (menu: MenuItem) => void;
}

function SortableRow({ menu, onEdit, onDelete }: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: menu.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-slate-50" : ""}>
            <TableCell className="w-10">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 rounded"
                >
                    <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
            </TableCell>
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
                        <DropdownMenuItem onClick={() => onEdit(menu)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(menu)}
                            className="text-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}

export default function MenuPage() {
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [menuPage, setMenuPage] = useState(1);
    const menuPageSize = 20;

    const [formData, setFormData] = useState({
        name: "",
        path: "",
        icon: "Home",
        parentId: null as number | null,
        sortOrder: 0,
        isActive: true,
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const menuTotalPages = Math.ceil(filteredMenus.length / menuPageSize);
    const paginatedMenus = filteredMenus.slice((menuPage - 1) * menuPageSize, menuPage * menuPageSize);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = menus.findIndex((m) => m.id === active.id);
            const newIndex = menus.findIndex((m) => m.id === over.id);

            const newMenus = arrayMove(menus, oldIndex, newIndex);

            // Re-calculate sort orders based on the new array order
            const updatedMenus = newMenus.map((menu, index) => ({
                ...menu,
                sortOrder: index + 1
            }));

            setMenus(updatedMenus);

            try {
                const response = await fetch("/api/menus/reorder", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: updatedMenus.map(m => ({ id: m.id, sortOrder: m.sortOrder }))
                    }),
                });
                const data = await response.json();
                if (!data.success) {
                    toast.error("Không thể lưu thứ tự menu");
                    fetchMenus(); // Revert
                } else {
                    toast.success("Đã cập nhật thứ tự menu");
                }
            } catch (error) {
                toast.error("Lỗi khi cập nhật thứ tự");
                fetchMenus(); // Revert
            }
        }
    };

    useEffect(() => { setMenuPage(1); }, [search]);

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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10"></TableHead>
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
                                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
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
                                        <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                                            Không có menu nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <SortableContext
                                        items={paginatedMenus.map(m => m.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {paginatedMenus.map((menu) => (
                                            <SortableRow
                                                key={menu.id}
                                                menu={menu}
                                                onEdit={(m) => {
                                                    setIsEditing(true);
                                                    setSelectedMenu(m);
                                                    setFormData({
                                                        name: m.name,
                                                        path: m.path,
                                                        icon: m.icon,
                                                        parentId: m.parentId,
                                                        sortOrder: m.sortOrder,
                                                        isActive: m.isActive,
                                                    });
                                                    setShowDialog(true);
                                                }}
                                                onDelete={(m) => {
                                                    setSelectedMenu(m);
                                                    setShowDeleteDialog(true);
                                                }}
                                            />
                                        ))}
                                    </SortableContext>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>

                    {menuTotalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-slate-500">
                                Hiển thị {paginatedMenus.length} / {filteredMenus.length} bản ghi
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={menuPage === 1} onClick={() => setMenuPage(p => p - 1)}>Trước</Button>
                                <div className="text-sm font-medium px-4">Trang {menuPage} / {menuTotalPages}</div>
                                <Button variant="outline" size="sm" disabled={menuPage === menuTotalPages} onClick={() => setMenuPage(p => p + 1)}>Sau</Button>
                            </div>
                        </div>
                    )}
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
                                <NumberInput
                                    value={formData.sortOrder}
                                    onChange={(v) => setFormData({ ...formData, sortOrder: v })}
                                    maxDecimals={0}
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
