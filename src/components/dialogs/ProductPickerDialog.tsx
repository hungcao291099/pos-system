"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Search, Plus, Minus, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
    id: number;
    code: string;
    barcode?: string;
    name: string;
    unitId: number;
    unitName: string;
    purchasePrice: number;
    sellPrice: number;
}

interface SelectedProduct extends Product {
    quantity: number;
}

interface ProductPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (products: SelectedProduct[]) => void;
    warehouseId?: number;
    mode?: "purchase" | "sale";
    initialSelected?: SelectedProduct[];
}

export function ProductPickerDialog({
    open,
    onOpenChange,
    onSelect,
    warehouseId,
    mode = "purchase",
    initialSelected = [],
}: ProductPickerDialogProps) {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [selected, setSelected] = useState<SelectedProduct[]>(initialSelected);
    const [loading, setLoading] = useState(false);

    const fetchProducts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const url = mode === "sale" && warehouseId
                ? `/api/sales/products?warehouseId=${warehouseId}`
                : `/api/products`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                if (mode === "sale") {
                    setProducts(data.data);
                } else {
                    // For purchase mode, map product data
                    const items = data.data.items || data.data;
                    setProducts(
                        items.map((p: any) => ({
                            id: p.id,
                            code: p.code,
                            barcode: p.barcode,
                            name: p.name,
                            unitId: p.unitId,
                            unitName: p.unit?.name || "",
                            purchasePrice: p.purchasePrice || 0,
                            sellPrice: p.defaultSellPrice || 0,
                        }))
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [user, mode, warehouseId]);

    useEffect(() => {
        if (open) {
            fetchProducts();
            setSelected(initialSelected);
        }
    }, [open, fetchProducts, initialSelected]);

    const filteredProducts = products.filter(
        (p) =>
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search))
    );

    const toggleProduct = (product: Product) => {
        const existing = selected.find((s) => s.id === product.id);
        if (existing) {
            setSelected(selected.filter((s) => s.id !== product.id));
        } else {
            setSelected([...selected, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (productId: number, delta: number) => {
        setSelected(
            selected.map((s) => {
                if (s.id === productId) {
                    const newQty = Math.max(1, s.quantity + delta);
                    return { ...s, quantity: newQty };
                }
                return s;
            })
        );
    };

    const setQuantity = (productId: number, qty: number) => {
        setSelected(
            selected.map((s) => {
                if (s.id === productId) {
                    return { ...s, quantity: Math.max(1, qty) };
                }
                return s;
            })
        );
    };

    const handleConfirm = () => {
        onSelect(selected);
        onOpenChange(false);
    };

    const isSelected = (id: number) => selected.some((s) => s.id === id);
    const getSelectedProduct = (id: number) => selected.find((s) => s.id === id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Chọn hàng hóa
                    </DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã, tên hoặc barcode..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="flex-1 overflow-auto min-h-[300px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background border-b">
                                <tr>
                                    <th className="text-left p-2 w-8"></th>
                                    <th className="text-left p-2">Mã</th>
                                    <th className="text-left p-2">Tên hàng hóa</th>
                                    <th className="text-left p-2">ĐVT</th>
                                    <th className="text-right p-2">
                                        {mode === "purchase" ? "Giá nhập" : "Giá bán"}
                                    </th>
                                    <th className="text-center p-2 w-32">Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => {
                                    const selected = isSelected(product.id);
                                    const selectedData = getSelectedProduct(product.id);
                                    return (
                                        <tr
                                            key={product.id}
                                            className={`border-b cursor-pointer hover:bg-muted/50 ${selected ? "bg-primary/10" : ""
                                                }`}
                                            onClick={() => toggleProduct(product)}
                                        >
                                            <td className="p-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => { }}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="p-2 font-mono text-xs">{product.code}</td>
                                            <td className="p-2">{product.name}</td>
                                            <td className="p-2">{product.unitName}</td>
                                            <td className="p-2 text-right">
                                                {(mode === "purchase"
                                                    ? product.purchasePrice
                                                    : product.sellPrice
                                                ).toLocaleString()}
                                            </td>
                                            <td className="p-2" onClick={(e) => e.stopPropagation()}>
                                                {selected && selectedData && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-7 w-7"
                                                            onClick={() => updateQuantity(product.id, -1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <NumberInput
                                                            value={selectedData.quantity}
                                                            onChange={(v) =>
                                                                setQuantity(product.id, v || 1)
                                                            }
                                                            className="h-7 w-16 text-center"
                                                            maxDecimals={0}
                                                        />
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            className="h-7 w-7"
                                                            onClick={() => updateQuantity(product.id, 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                                            Không tìm thấy hàng hóa
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between border-t pt-4">
                    <span className="text-sm text-muted-foreground">
                        Đã chọn: {selected.length} sản phẩm
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleConfirm} disabled={selected.length === 0}>
                            Xác nhận
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
