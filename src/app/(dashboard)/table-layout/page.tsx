"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Plus,
    Save,
    Trash2,
    GripVertical,
    Users,
    Edit2,
    TreePine,
    Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface DiningTable {
    id: number;
    name: string;
    area: string;
    posX: number;
    posY: number;
    width: number;
    height: number;
    capacity: number;
    status: "empty" | "occupied";
    isActive: boolean;
}

export default function TableLayoutPage() {
    const [tables, setTables] = useState<DiningTable[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
    const [formData, setFormData] = useState({ name: "", capacity: 4, area: "Trong nhà" });
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedArea, setSelectedArea] = useState<string>("Trong nhà");
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        tableId: number;
        startX: number;
        startY: number;
        offsetX: number;
        offsetY: number;
    } | null>(null);

    const areas = useMemo(() => {
        const areaSet = new Set(tables.map((t) => t.area));
        areaSet.add("Trong nhà");
        areaSet.add("Ngoài trời");
        return Array.from(areaSet);
    }, [tables]);

    const filteredTables = useMemo(
        () => tables.filter((t) => t.area === selectedArea),
        [tables, selectedArea]
    );

    const fetchTables = useCallback(async () => {
        try {
            const res = await fetch("/api/tables");
            const data = await res.json();
            if (data.success) {
                setTables(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    const handleCreateTable = async () => {
        if (!formData.name.trim()) {
            toast.error("Vui lòng nhập tên bàn");
            return;
        }

        try {
            const res = await fetch("/api/tables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    area: formData.area,
                    capacity: formData.capacity,
                    posX: 50 + Math.random() * 200,
                    posY: 50 + Math.random() * 200,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Tạo bàn thành công");
                setDialogOpen(false);
                setFormData({ name: "", capacity: 4, area: selectedArea });
                fetchTables();
            } else {
                toast.error(data.error || "Lỗi tạo bàn");
            }
        } catch {
            toast.error("Lỗi hệ thống");
        }
    };

    const handleUpdateTable = async () => {
        if (!editingTable) return;
        try {
            const res = await fetch(`/api/tables/${editingTable.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    area: formData.area,
                    capacity: formData.capacity,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Cập nhật bàn thành công");
                setEditingTable(null);
                setDialogOpen(false);
                setFormData({ name: "", capacity: 4, area: selectedArea });
                fetchTables();
            }
        } catch {
            toast.error("Lỗi hệ thống");
        }
    };

    const handleDeleteTable = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa bàn này?")) return;
        try {
            const res = await fetch(`/api/tables/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete" }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Xóa bàn thành công");
                fetchTables();
            }
        } catch {
            toast.error("Lỗi hệ thống");
        }
    };

    const handleSaveLayout = async () => {
        setSaving(true);
        try {
            const positions = tables.map((t) => ({
                id: t.id,
                posX: t.posX,
                posY: t.posY,
                width: t.width,
                height: t.height,
            }));
            const res = await fetch("/api/tables/layout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ positions }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Lưu layout thành công");
                setHasChanges(false);
            }
        } catch {
            toast.error("Lỗi hệ thống");
        } finally {
            setSaving(false);
        }
    };

    const handleMouseDown = (e: React.MouseEvent, tableId: number) => {
        e.preventDefault();
        const table = tables.find((t) => t.id === tableId);
        if (!table || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        dragRef.current = {
            tableId,
            startX: table.posX,
            startY: table.posY,
            offsetX: e.clientX - canvasRect.left - table.posX,
            offsetY: e.clientY - canvasRect.top - table.posY,
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!dragRef.current || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const newX = Math.max(
                0,
                Math.min(
                    moveEvent.clientX - rect.left - dragRef.current.offsetX,
                    rect.width - (table.width || 100)
                )
            );
            const newY = Math.max(
                0,
                Math.min(
                    moveEvent.clientY - rect.top - dragRef.current.offsetY,
                    rect.height - (table.height || 100)
                )
            );

            setTables((prev) =>
                prev.map((t) =>
                    t.id === tableId ? { ...t, posX: newX, posY: newY } : t
                )
            );
            setHasChanges(true);
        };

        const handleMouseUp = () => {
            dragRef.current = null;
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const openEditDialog = (table: DiningTable) => {
        setEditingTable(table);
        setFormData({ name: table.name, capacity: table.capacity, area: table.area });
        setDialogOpen(true);
    };

    const openCreateDialog = () => {
        setEditingTable(null);
        setFormData({ name: "", capacity: 4, area: selectedArea });
        setDialogOpen(true);
    };

    const statusColors: Record<string, string> = {
        empty: "bg-emerald-50 border-emerald-300 text-emerald-700",
        occupied: "bg-orange-50 border-orange-300 text-orange-700",
    };

    const statusLabels: Record<string, string> = {
        empty: "Trống",
        occupied: "Có khách",
    };

    const areaIcons: Record<string, React.ReactNode> = {
        "Trong nhà": <Home className="h-4 w-4" />,
        "Ngoài trời": <TreePine className="h-4 w-4" />,
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
                <div>
                    <h1 className="text-2xl font-bold">Bố trí bàn</h1>
                    <p className="text-sm text-muted-foreground">
                        Kéo thả để sắp xếp vị trí bàn theo thực tế
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm bàn
                    </Button>
                    <Button
                        onClick={handleSaveLayout}
                        disabled={!hasChanges || saving}
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Đang lưu..." : "Lưu layout"}
                    </Button>
                </div>
            </div>

            {/* Area Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-1 border-b bg-muted/30">
                {areas.map((area) => {
                    const count = tables.filter((t) => t.area === area).length;
                    return (
                        <button
                            key={area}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border border-b-0 ${selectedArea === area
                                    ? "bg-background text-foreground border-border"
                                    : "bg-transparent text-muted-foreground hover:text-foreground border-transparent hover:border-border/50"
                                }`}
                            onClick={() => setSelectedArea(area)}
                        >
                            {areaIcons[area] || null}
                            {area}
                            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div
                        ref={canvasRef}
                        className={`relative border-2 border-dashed rounded-xl ${selectedArea === "Ngoài trời"
                                ? "bg-green-50 border-green-300"
                                : "bg-slate-100 border-slate-300"
                            }`}
                        style={{ minHeight: "500px", minWidth: "800px" }}
                    >
                        {/* Grid pattern */}
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage:
                                    "radial-gradient(circle, #64748b 1px, transparent 1px)",
                                backgroundSize: "20px 20px",
                            }}
                        />

                        {filteredTables.map((table) => (
                            <div
                                key={table.id}
                                className={`absolute rounded-xl border-2 shadow-md cursor-grab active:cursor-grabbing transition-shadow hover:shadow-lg select-none ${statusColors[table.status]}`}
                                style={{
                                    left: table.posX,
                                    top: table.posY,
                                    width: table.width || 100,
                                    height: table.height || 100,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, table.id)}
                            >
                                <div className="flex flex-col items-center justify-center h-full p-2">
                                    <GripVertical className="h-3 w-3 opacity-30 absolute top-1 right-1" />
                                    <span className="font-bold text-sm truncate max-w-full">
                                        {table.name}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs mt-1 opacity-70">
                                        <Users className="h-3 w-3" />
                                        <span>{table.capacity}</span>
                                    </div>
                                    <span className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full bg-white/60">
                                        {statusLabels[table.status]}
                                    </span>
                                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                                        <button
                                            className="p-0.5 hover:bg-white/50 rounded"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditDialog(table);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                            className="p-0.5 hover:bg-red-100 rounded text-red-500"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTable(table.id);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredTables.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <p className="text-lg font-medium">
                                        Chưa có bàn nào trong khu vực &quot;{selectedArea}&quot;
                                    </p>
                                    <p className="text-sm">
                                        Nhấn &quot;Thêm bàn&quot; để bắt đầu bố trí
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingTable ? "Sửa bàn" : "Thêm bàn mới"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tên bàn</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                placeholder="VD: Bàn 1, Bàn VIP..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Khu vực</Label>
                            <Select
                                value={formData.area}
                                onValueChange={(v) => setFormData({ ...formData, area: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map((a) => (
                                        <SelectItem key={a} value={a}>
                                            {a}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Sức chứa</Label>
                            <Input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        capacity: parseInt(e.target.value) || 1,
                                    })
                                }
                                min={1}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={
                                editingTable ? handleUpdateTable : handleCreateTable
                            }
                        >
                            {editingTable ? "Cập nhật" : "Tạo bàn"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
