"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Warehouse,
    Calendar,
    Lock,
    RefreshCw,
    Package,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface StockBalance {
    id: number;
    productId: number;
    warehouseId: number;
    openingQty: number;
    inQty: number;
    outQty: number;
    soldQty: number;
    closingQty: number;
    product?: {
        code: string;
        name: string;
        unit?: { name: string };
    };
}

interface StockPeriod {
    id: number;
    periodCode: string;
    warehouseId: number;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    closedAt?: string;
    warehouse?: { name: string };
}

interface WarehouseItem {
    id: number;
    name: string;
    code: string;
}

export default function InventoryPage() {
    const { user } = useAuth();
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
    const [periods, setPeriods] = useState<StockPeriod[]>([]);
    const [balances, setBalances] = useState<StockBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
    const [selectedPeriodCode, setSelectedPeriodCode] = useState<string>("");

    const fetchWarehouses = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch("/api/warehouses");
            const data = await res.json();
            if (data.success) {
                const items = data.data.items || [];
                setWarehouses(items);
                if (items.length > 0 && !selectedWarehouseId) {
                    setSelectedWarehouseId(items[0].id.toString());
                }
            }
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }
    }, [user, selectedWarehouseId]);

    const fetchPeriods = useCallback(async () => {
        if (!user || !selectedWarehouseId) return;
        try {
            const res = await fetch(`/api/stock-periods?warehouseId=${selectedWarehouseId}`);
            const data = await res.json();
            if (data.success) {
                setPeriods(data.data || []);
                if (data.data.length > 0 && !selectedPeriodCode) {
                    setSelectedPeriodCode(data.data[0].periodCode);
                }
            }
        } catch (error) {
            console.error("Error fetching periods:", error);
        }
    }, [user, selectedWarehouseId, selectedPeriodCode]);

    const fetchBalances = useCallback(async () => {
        if (!user || !selectedWarehouseId) return;
        setLoading(true);
        try {
            let url = `/api/stock-balances?warehouseId=${selectedWarehouseId}`;
            if (selectedPeriodCode) {
                url += `&periodCode=${selectedPeriodCode}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setBalances(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching balances:", error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedWarehouseId, selectedPeriodCode]);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    useEffect(() => {
        fetchBalances();
    }, [fetchBalances]);

    const handleClosePeriod = async () => {
        if (!selectedWarehouseId || !selectedPeriodCode) return;
        if (!confirm("Bạn có chắc muốn chốt kỳ này? Sau khi chốt sẽ không thể thay đổi.")) return;

        try {
            const res = await fetch("/api/stock-periods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    warehouseId: parseInt(selectedWarehouseId),
                    periodCode: selectedPeriodCode,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Chốt kỳ thành công");
                fetchPeriods();
            } else {
                toast.error(data.message || "Lỗi chốt kỳ");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        }
    };

    const handleRecalculate = async () => {
        if (!selectedWarehouseId || !selectedPeriodCode) return;
        try {
            const res = await fetch("/api/stock-balances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "recalculate",
                    warehouseId: parseInt(selectedWarehouseId),
                    periodCode: selectedPeriodCode,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Tính lại tồn kho thành công");
                fetchBalances();
            } else {
                toast.error(data.message || "Lỗi tính lại");
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        }
    };

    const currentPeriod = periods.find((p) => p.periodCode === selectedPeriodCode);
    const isClosed = currentPeriod?.isClosed ?? false;

    const filteredBalances = balances.filter(
        (b) =>
            b.product?.code.toLowerCase().includes(search.toLowerCase()) ||
            b.product?.name.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate summary stats
    const totalItems = filteredBalances.length;
    const totalClosingQty = filteredBalances.reduce((sum, b) => sum + Number(b.closingQty), 0);
    const lowStockItems = filteredBalances.filter((b) => Number(b.closingQty) < 10).length;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Tồn kho</h1>
                    <p className="text-muted-foreground">Theo dõi tồn kho theo kỳ</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sản phẩm</p>
                                <p className="text-2xl font-bold">{totalItems}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tổng tồn</p>
                                <p className="text-2xl font-bold">
                                    {totalClosingQty.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <TrendingDown className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Sắp hết</p>
                                <p className="text-2xl font-bold">{lowStockItems}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <ShoppingCart className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Đã bán</p>
                                <p className="text-2xl font-bold">
                                    {filteredBalances
                                        .reduce((sum, b) => sum + Number(b.soldQty), 0)
                                        .toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Warehouse className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={selectedWarehouseId}
                                    onValueChange={(v) => {
                                        setSelectedWarehouseId(v);
                                        setSelectedPeriodCode("");
                                    }}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Chọn kho" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((wh) => (
                                            <SelectItem key={wh.id} value={wh.id.toString()}>
                                                {wh.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <Select
                                    value={selectedPeriodCode}
                                    onValueChange={setSelectedPeriodCode}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Chọn kỳ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {periods.map((p) => (
                                            <SelectItem key={p.id} value={p.periodCode}>
                                                {p.periodCode}
                                                {p.isClosed && " (Đã chốt)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {currentPeriod && (
                                <Badge variant={isClosed ? "secondary" : "default"}>
                                    {isClosed ? "Đã chốt" : "Đang mở"}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm sản phẩm..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 w-60"
                                />
                            </div>
                            {!isClosed && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRecalculate}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Tính lại
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClosePeriod}
                                        className="text-orange-500"
                                    >
                                        <Lock className="mr-2 h-4 w-4" />
                                        Chốt kỳ
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b">
                                    <tr>
                                        <th className="text-left p-3">Mã SP</th>
                                        <th className="text-left p-3">Tên sản phẩm</th>
                                        <th className="text-left p-3">ĐVT</th>
                                        <th className="text-right p-3">Đầu kỳ</th>
                                        <th className="text-right p-3">Nhập</th>
                                        <th className="text-right p-3">Xuất</th>
                                        <th className="text-right p-3">Bán</th>
                                        <th className="text-right p-3">Cuối kỳ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBalances.map((b) => (
                                        <tr key={b.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3 font-mono text-xs">
                                                {b.product?.code}
                                            </td>
                                            <td className="p-3">{b.product?.name}</td>
                                            <td className="p-3">{b.product?.unit?.name}</td>
                                            <td className="p-3 text-right">
                                                {Number(b.openingQty).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-green-600">
                                                +{Number(b.inQty).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-orange-600">
                                                -{Number(b.outQty).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-blue-600">
                                                -{Number(b.soldQty).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right font-medium">
                                                <span
                                                    className={
                                                        Number(b.closingQty) < 10
                                                            ? "text-red-600"
                                                            : ""
                                                    }
                                                >
                                                    {Number(b.closingQty).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredBalances.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                Chưa có dữ liệu tồn kho
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
