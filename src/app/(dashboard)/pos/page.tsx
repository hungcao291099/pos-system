"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    ArrowRightLeft,
    ShoppingCart,
    Warehouse,
    User,
    Calculator,
    CheckCircle,
    UtensilsCrossed,
    ShoppingBag,
    Users,
    ArrowLeft,
    Send,
    Split,
    Merge,
    ArrowRight,
    ArrowUpRight,
    Layers,
    X,
    LayoutGrid,
    MoreVertical,
    Check,
    Gift,
    Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CustomerPickerDialog } from "@/components/dialogs/CustomerPickerDialog";

interface ProductForSale {
    id: number;
    code: string;
    barcode?: string;
    name: string;
    unitId: number;
    unitName: string;
    categoryName: string;
    sellPrice: number;
    currentStock: number;
    isPreparation: boolean;
}

interface CartItem extends ProductForSale {
    quantity: number;
    discountAmount: number;
    promotionId?: number;
}

interface PromotionResult {
    policyId: number;
    name: string;
    description: string;
    giftItems: {
        productId: number;
        quantity: number;
        discountPercentage: number;
        productName: string;
    }[];
}

interface WarehouseItem {
    id: number;
    name: string;
    code: string;
}

interface SelectedCustomer {
    id: number;
    code: string;
    name: string;
    phone?: string;
}

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
    activeOrder?: TableOrderForDisplay;
}

interface TableOrderForDisplay {
    id: number;
    orderNumber: string;
    tableId: number;
    status: string;
    totalAmount: number;
    items: {
        id: number;
        productId: number;
        quantity: number;
        unitPrice: number;
        amount: number;
        status: string;
        product?: { name: string };
    }[];
}

type SaleMode = "takeaway" | "dinein";

export default function POSPage() {
    const { user } = useAuth();
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
    const [products, setProducts] = useState<ProductForSale[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "credit">("cash");
    const [cashReceived, setCashReceived] = useState<string>("");
    const [transferCode, setTransferCode] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
    const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Dine-in mode state
    const [saleMode, setSaleMode] = useState<SaleMode>("takeaway");
    const [tables, setTables] = useState<DiningTable[]>([]);
    const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null);
    const [tableOrders, setTableOrders] = useState<TableOrderForDisplay[]>([]);
    const [tablesLoading, setTablesLoading] = useState(false);
    const [selectedPosArea, setSelectedPosArea] = useState<string>("Trong nhà");
    const [activeDiscountPolicies, setActiveDiscountPolicies] = useState<any[]>([]);
    const [activePromotionPolicies, setActivePromotionPolicies] = useState<any[]>([]);
    const [appliedPromotions, setAppliedPromotions] = useState<PromotionResult[]>([]);
    const [pendingTableOrderId, setPendingTableOrderId] = useState<number | null>(null);

    // Merge/Split/Move states
    const [mergeMode, setMergeMode] = useState(false);
    const [sourceTableForMerge, setSourceTableForMerge] = useState<DiningTable | null>(null);
    const [splitDialogOpen, setSplitDialogOpen] = useState(false);
    const [orderToSplit, setOrderToSplit] = useState<TableOrderForDisplay | null>(null);
    const [splitItems, setSplitItems] = useState<{ itemId: number; quantity: number }[]>([]);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [tableToMoveTo, setTableToMoveTo] = useState<DiningTable | null>(null);
    const [tableActionMenuOpen, setTableActionMenuOpen] = useState(false);
    const [activeMenuTable, setActiveMenuTable] = useState<DiningTable | null>(null);

    const fetchWarehouses = useCallback(async () => {
        if (!user) return;
        try {
            const res = await fetch("/api/warehouses?type=SALES");
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

    const fetchProducts = useCallback(async () => {
        if (!user || !selectedWarehouseId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/sales/products?warehouseId=${selectedWarehouseId}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedWarehouseId]);

    const fetchTables = useCallback(async () => {
        setTablesLoading(true);
        try {
            const [tablesRes, ordersRes] = await Promise.all([
                fetch("/api/tables"),
                fetch("/api/table-orders") // Assuming this gets all active orders if no tableId
            ]);

            const tablesData = await tablesRes.json();
            const ordersData = await ordersRes.json();

            if (tablesData.success && ordersData.success) {
                const activeOrders = ordersData.data || [];
                const tablesWithStatus = tablesData.data.map((t: DiningTable) => {
                    const order = activeOrders.find((o: TableOrderForDisplay) => o.tableId === t.id);
                    return {
                        ...t,
                        activeOrder: order
                    };
                });
                setTables(tablesWithStatus);
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        } finally {
            setTablesLoading(true); // Should be false, wait
            setTablesLoading(false);
        }
    }, []);

    const fetchTableOrders = useCallback(async (tableId: number) => {
        try {
            const res = await fetch(`/api/table-orders?tableId=${tableId}`);
            const data = await res.json();
            if (data.success) {
                setTableOrders(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching table orders:", error);
        }
    }, []);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (saleMode === "dinein") {
            fetchTables();
        }
    }, [saleMode, fetchTables]);

    const fetchPromotions = useCallback(async () => {
        try {
            const res = await fetch("/api/promotions/active");
            const data = await res.json();
            if (data.success) {
                setActiveDiscountPolicies(data.data.discounts || []);
                setActivePromotionPolicies(data.data.promotions || []);
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
        }
    }, []);

    useEffect(() => {
        fetchPromotions();
    }, [fetchPromotions]);

    const filteredProducts = products.filter(
        (p) =>
            p.code.toLowerCase().includes(search.toLowerCase()) ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search))
    );

    const addToCart = (product: ProductForSale) => {
        if (product.currentStock <= 0 && !product.isPreparation) return;

        const existingIndex = cart.findIndex((c) => c.id === product.id);
        if (existingIndex >= 0) {
            const item = cart[existingIndex];
            if (!product.isPreparation && item.quantity >= product.currentStock) {
                toast.error("Số lượng vượt quá tồn kho");
                return;
            }
            setCart(
                cart.map((c, i) =>
                    i === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
                )
            );
        } else {
            const discountPercent = getProductDiscount(product.id, products.find(p => p.id === product.id)?.unitId); // Note: Should use categoryId, need to check where it is
            // Actually ProductForSale has unitId, but getProductDiscount wants categoryId. 
            // Let's check ProductForSale interface
            setCart([...cart, { ...product, quantity: 1, discountAmount: 0 }]);
        }
    };

    const updateCartQuantity = (index: number, delta: number) => {
        const item = cart[index];
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            setCart(cart.filter((_, i) => i !== index));
        } else if (item.isPreparation || newQty <= item.currentStock) {
            setCart(cart.map((c, i) => (i === index ? { ...c, quantity: newQty } : c)));
        } else {
            toast.error("Số lượng vượt quá tồn kho");
        }
    };

    const setCartQuantity = (index: number, qty: number) => {
        const item = cart[index];
        if (qty <= 0) {
            setCart(cart.filter((_, i) => i !== index));
        } else if (item.isPreparation || qty <= item.currentStock) {
            setCart(cart.map((c, i) => (i === index ? { ...c, quantity: qty } : c)));
        } else {
            toast.error("Số lượng vượt quá tồn kho");
        }
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomer(null);
        setCashReceived("");
        setTransferCode("");
        setPaymentMethod("cash");
        setAppliedPromotions([]);
        setPendingTableOrderId(null);
    };

    const calculatePromotions = useCallback(() => {
        if (activePromotionPolicies.length === 0) return;

        const results: PromotionResult[] = [];

        for (const promotion of activePromotionPolicies) {
            let timesMet = Infinity;

            for (const buyItem of promotion.buyItems) {
                const cartItem = cart.find(i => i.id === buyItem.productId);
                if (!cartItem || cartItem.quantity < Number(buyItem.quantity)) {
                    timesMet = 0;
                    break;
                }

                const possibleTimes = Math.floor(cartItem.quantity / Number(buyItem.quantity));
                timesMet = Math.min(timesMet, possibleTimes);
            }

            if (timesMet > 0 && timesMet !== Infinity) {
                results.push({
                    policyId: promotion.id,
                    name: promotion.name,
                    description: `Mua ${promotion.buyItems.map((i: any) => `${i.quantity} ${i.product?.name || 'món'}`).join(', ')}`,
                    giftItems: promotion.getItems.map((gi: any) => ({
                        productId: gi.productId,
                        quantity: Number(gi.quantity) * timesMet,
                        discountPercentage: Number(gi.discountPercentage),
                        productName: gi.product?.name || 'Sản phẩm'
                    }))
                });
            }
        }
        setAppliedPromotions(results);
    }, [cart, activePromotionPolicies]);

    useEffect(() => {
        calculatePromotions();
    }, [cart, calculatePromotions]);

    const getProductDiscount = (productId: number, categoryId?: number) => {
        let bestPolicy = null;
        for (const policy of activeDiscountPolicies) {
            if (policy.applyToAll || (categoryId && policy.categoryId === categoryId)) {
                if (!bestPolicy || Number(policy.discountPercentage) > Number(bestPolicy.discountPercentage)) {
                    bestPolicy = policy;
                }
            }
        }
        return bestPolicy ? Number(bestPolicy.discountPercentage) : 0;
    };

    const totalAmount = cart.reduce((sum, c) => sum + c.quantity * c.sellPrice, 0);
    const changeAmount = paymentMethod === "cash" && cashReceived
        ? parseFloat(cashReceived) - totalAmount
        : 0;

    const openCheckout = () => {
        if (cart.length === 0) {
            toast.error("Giỏ hàng trống");
            return;
        }
        setCashReceived(totalAmount.toString());
        setCheckoutDialogOpen(true);
    };

    // Takeaway & Table checkout
    const handleCheckout = async () => {
        if (paymentMethod === "credit" && !selectedCustomer) {
            toast.error("Vui lòng chọn khách hàng");
            return;
        }
        if (paymentMethod === "cash" && parseFloat(cashReceived) < totalAmount) {
            toast.error("Tiền khách đưa không đủ");
            return;
        }
        if (paymentMethod === "transfer" && !transferCode) {
            toast.error("Vui lòng nhập mã giao dịch");
            return;
        }

        setProcessing(true);
        try {
            const body: any = {
                warehouseId: parseInt(selectedWarehouseId),
                customerId: selectedCustomer?.id,
                paymentMethod,
                cashReceived: paymentMethod === "cash" ? parseFloat(cashReceived) : undefined,
                transferCode: paymentMethod === "transfer" ? transferCode : undefined,
            };

            if (pendingTableOrderId) {
                // Table payment: calls different endpoint
                const res = await fetch(`/api/table-orders/${pendingTableOrderId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "complete",
                        ...body
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    toast.success("Thanh toán bàn thành công!");
                    setCheckoutDialogOpen(false);
                    setSelectedTable(null);
                    clearCart();
                    fetchTables();
                    fetchProducts();
                } else {
                    toast.error(data.message || data.error || "Lỗi thanh toán");
                }
            } else {
                // Regular takeaway sale
                body.items = cart.map((c) => ({
                    productId: c.id,
                    quantity: c.quantity,
                    unitPrice: c.sellPrice,
                }));

                const res = await fetch("/api/sales", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (data.success) {
                    toast.success("Thanh toán thành công!");
                    setCheckoutDialogOpen(false);
                    clearCart();
                    fetchProducts();
                } else {
                    toast.error(data.message || "Lỗi thanh toán");
                }
            }
        } catch (error) {
            toast.error("Lỗi hệ thống");
        } finally {
            setProcessing(false);
        }
    };

    // Dine-in: send order to table
    const handleSendToTable = async () => {
        if (!selectedTable || cart.length === 0) return;

        setProcessing(true);
        try {
            const body = {
                tableId: selectedTable.id,
                items: cart.map((c) => ({
                    productId: c.id,
                    quantity: c.quantity,
                    unitPrice: c.sellPrice,
                })),
            };

            // Check if there's an active order for this table, add items to it
            const activeOrder = tableOrders.find(
                (o) => o.status === "pending" || o.status === "preparing"
            );

            let res;
            if (activeOrder) {
                res = await fetch(`/api/table-orders/${activeOrder.id}/items`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: body.items }),
                });
            } else {
                res = await fetch("/api/table-orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            const data = await res.json();
            if (data.success) {
                toast.success(
                    activeOrder
                        ? "Đã thêm món vào đơn"
                        : "Đã gửi đơn tới bếp"
                );
                clearCart();
                fetchTables();
                fetchTableOrders(selectedTable.id);
            } else {
                toast.error(data.error || "Lỗi gửi đơn");
            }
        } catch {
            toast.error("Lỗi hệ thống");
        } finally {
            setProcessing(false);
        }
    };

    // Dine-in: prepare checkout (open dialog)
    const handleTableCheckout = async (order: TableOrderForDisplay) => {
        // Map order items to cart
        const cartItems = order.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                id: item.productId,
                code: product?.code || "",
                name: product?.name || item.product?.name || "Sản phẩm",
                unitId: product?.unitId || 0,
                unitName: product?.unitName || "",
                categoryName: product?.categoryName || "",
                sellPrice: Number(item.unitPrice),
                currentStock: product?.currentStock || 0,
                isPreparation: product?.isPreparation || false,
                quantity: Number(item.quantity)
            };
        });

        setCart(cartItems.map(i => ({ ...i, discountAmount: 0 })));
        setPendingTableOrderId(order.id);
        setCashReceived(order.totalAmount.toString());
        setCheckoutDialogOpen(true);
    };

    const handleSelectCustomer = (customer: SelectedCustomer) => {
        setSelectedCustomer(customer);
    };

    const statusColors: Record<string, string> = {
        empty: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
        occupied: "bg-orange-50 border-orange-200 hover:border-orange-400",
    };

    const statusLabels: Record<string, string> = {
        empty: "Trống",
        occupied: "Đang có khách",
    };

    const handleMergeTables = async (targetTable: DiningTable) => {
        if (!sourceTableForMerge || !targetTable) return;

        // Find orders for both tables
        const sourceOrder = tablesWithOrders.find(t => t.id === sourceTableForMerge.id)?.activeOrder;
        const targetOrder = tablesWithOrders.find(t => t.id === targetTable.id)?.activeOrder;

        if (!sourceOrder || !targetOrder) {
            toast.error("Không tìm thấy đơn hàng để gộp");
            return;
        }

        setProcessing(true);
        try {
            const res = await fetch("/api/table-orders/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "merge",
                    sourceOrderId: sourceOrder.id,
                    targetOrderId: targetOrder.id
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Gộp bàn thành công");
                setMergeMode(false);
                setSourceTableForMerge(null);
                fetchTables();
            } else {
                toast.error(data.message || "Lỗi gộp bàn");
            }
        } catch {
            toast.error("Lỗi hệ thống");
        } finally {
            setProcessing(false);
        }
    };

    const handleMoveTable = async (targetTable: DiningTable) => {
        if (!selectedTable || !targetTable) return;

        const activeOrder = tableOrders.find(o => o.status === "pending" || o.status === "preparing");
        if (!activeOrder) return;

        setProcessing(true);
        try {
            const res = await fetch("/api/table-orders/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "move",
                    orderId: activeOrder.id,
                    targetTableId: targetTable.id
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Chuyển bàn thành công");
                setMoveDialogOpen(false);
                setSelectedTable(null);
                fetchTables();
            } else {
                toast.error(data.message || "Lỗi chuyển bàn");
            }
        } catch {
            toast.error("Lỗi hệ thống");
        } finally {
            setProcessing(false);
        }
    };

    const handleSplitOrder = async (targetTable: DiningTable) => {
        if (!orderToSplit || !targetTable || splitItems.length === 0) return;

        setProcessing(true);
        try {
            const res = await fetch("/api/table-orders/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "split",
                    sourceOrderId: orderToSplit.id,
                    targetTableId: targetTable.id,
                    items: splitItems
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Tách đơn thành công");
                setSplitDialogOpen(false);
                setSelectedTable(null);
                fetchTables();
            } else {
                toast.error(data.message || "Lỗi tách đơn");
            }
        } catch {
            toast.error("Lỗi hệ thống");
        } finally {
            setProcessing(false);
        }
    };

    // Enhance tables with current active order info
    const tablesWithOrders = tables; // Already enhanced in fetchTables

    // ====== RENDER ======

    // Product grid (shared between modes)
    const renderProductGrid = () => (
        <div className="flex-1 overflow-auto">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredProducts.map((product) => {
                        const isDisabled = product.currentStock <= 0 && !product.isPreparation;
                        return (
                            <Card
                                key={product.id}
                                className={`transition-colors ${isDisabled
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer hover:border-primary"
                                    }`}
                                onClick={() => !isDisabled && addToCart(product)}
                            >
                                <CardContent className="p-3">
                                    <p className="font-mono text-xs text-muted-foreground">
                                        {product.code}
                                    </p>
                                    <p className="font-medium text-sm line-clamp-2 h-10">
                                        {product.name}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        {product.isPreparation ? (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                Pha chế
                                            </span>
                                        ) : isDisabled ? (
                                            <span className="text-xs text-red-500 font-medium">
                                                Hết hàng
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                Tồn: {product.currentStock}
                                            </span>
                                        )}
                                        <div className="flex flex-col items-end">
                                            {getProductDiscount(product.id) > 0 && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold mb-0.5">
                                                    -{getProductDiscount(product.id)}%
                                                </span>
                                            )}
                                            <span className="font-bold text-primary">
                                                {product.sellPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            Không tìm thấy sản phẩm
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // Table selection view (dine-in mode, no table selected)
    const posAreas = (() => {
        const areaSet = new Set(tables.map((t) => t.area));
        areaSet.add("Trong nhà");
        areaSet.add("Ngoài trời");
        return Array.from(areaSet);
    })();
    const posFilteredTables = tables.filter((t) => t.area === selectedPosArea);

    const renderTableSelection = () => (
        <div className="flex-1 overflow-auto flex flex-col p-4 bg-slate-50/50">
            {/* Action Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-3 rounded-2xl border shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                    {posAreas.map((area) => (
                        <button
                            key={area}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${selectedPosArea === area
                                ? "bg-white text-primary shadow-sm scale-105"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                                }`}
                            onClick={() => setSelectedPosArea(area)}
                        >
                            {area}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedPosArea === area ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-500"}`}>
                                {tables.filter((t) => t.area === area).length}
                            </span>
                        </button>
                    ))}
                </div>

                {mergeMode ? (
                    <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-xl flex items-center gap-3 border border-orange-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="relative">
                            <Merge className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold leading-tight">CHẾ ĐỘ GỘP BÀN</span>
                            <span className="text-[10px] opacity-80 leading-tight">Chọn bàn đích để gộp từ {sourceTableForMerge?.name}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100" onClick={() => setMergeMode(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mr-4">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-white border-2 border-slate-200"></span>
                                <span>Trống</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></span>
                                <span>Có khách</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {tablesLoading ? (
                <div className="flex items-center justify-center flex-1">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-4 border-primary/10 animate-ping"></div>
                        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-primary animate-spin"></div>
                    </div>
                </div>
            ) : posFilteredTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
                    <div className="bg-white p-8 rounded-full shadow-sm mb-6 border border-slate-100">
                        <LayoutGrid className="h-12 w-12 opacity-20" />
                    </div>
                    <p className="text-xl font-bold text-slate-600">Không gian trống</p>
                    <p className="text-sm opacity-60">Khu vực này chưa có bàn nào được bố trí</p>
                </div>
            ) : (
                <div className={`relative border-2 border-dashed rounded-[2rem] flex-1 backdrop-blur-sm shadow-inner overflow-hidden transition-colors duration-500 ${selectedPosArea === "Ngoài trời"
                    ? "bg-emerald-50/30 border-emerald-200/50"
                    : "bg-slate-100/30 border-slate-200/50"
                    }`} style={{ minHeight: "550px" }}>

                    {/* Atmospheric background */}
                    <div className="absolute top-10 right-10 text-[120px] font-black opacity-[0.03] select-none pointer-events-none uppercase tracking-tighter">
                        {selectedPosArea}
                    </div>

                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)",
                            backgroundSize: "32px 32px",
                        }}
                    />

                    {posFilteredTables.map((table) => {
                        const isSelected = selectedTable?.id === table.id;
                        const isSource = sourceTableForMerge?.id === table.id;
                        const isOccupied = table.status === 'occupied';

                        return (
                            <div
                                key={table.id}
                                className={`absolute group rounded-2xl border-2 transition-all duration-300 ease-out flex flex-col items-center justify-center p-3 text-center
                                    ${isOccupied
                                        ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg shadow-orange-100/50'
                                        : 'bg-white border-white shadow-sm hover:border-primary/30 hover:shadow-md'
                                    }
                                    ${isSelected ? 'ring-4 ring-primary/20 border-primary shadow-2xl z-20 scale-105' : ''}
                                    ${isSource ? 'ring-4 ring-orange-400 border-orange-500 opacity-80 animate-pulse' : ''}
                                    ${mergeMode && isOccupied && !isSource ? 'hover:ring-4 hover:ring-orange-300' : ''}
                                `}
                                style={{
                                    left: table.posX,
                                    top: table.posY,
                                    width: table.width || 120,
                                    height: table.height || 120,
                                }}
                                onClick={() => {
                                    if (mergeMode) {
                                        if (table.id !== sourceTableForMerge?.id && isOccupied) {
                                            handleMergeTables(table);
                                        } else if (!isOccupied) {
                                            toast.info("Vui lòng chọn bàn đang có khách để gộp");
                                        }
                                    } else {
                                        setActiveMenuTable(table);
                                        setTableActionMenuOpen(true);
                                    }
                                }}
                            >
                                {/* Table Label */}
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                                    <span className={`px-3 py-1 rounded-lg text-[11px] font-black shadow-md border whitespace-nowrap tracking-wide uppercase
                                        ${isOccupied ? 'bg-orange-600 text-white border-orange-700' : 'bg-slate-600 text-white border-slate-700'}
                                    `}>
                                        {table.name}
                                    </span>
                                </div>

                                {/* Main Icon/Info */}
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <div className="p-2.5 rounded-full bg-white/50 border border-white">
                                        {isOccupied ? (
                                            <div className="relative">
                                                <UtensilsCrossed className="h-7 w-7 text-orange-600" />
                                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 shadow-sm shadow-orange-900/20"></span>
                                                </span>
                                            </div>
                                        ) : (
                                            <Users className="h-7 w-7 text-slate-300" />
                                        )}
                                    </div>

                                    {isOccupied && table.activeOrder && (
                                        <div className="bg-orange-500/10 px-2 py-0.5 rounded-full">
                                            <span className="text-[10px] font-bold text-orange-700">
                                                {Number(table.activeOrder.totalAmount).toLocaleString()}đ
                                            </span>
                                        </div>
                                    )}

                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1 opacity-80">
                                        {table.capacity} GHẾ
                                    </span>
                                </div>

                                {/* Quick Actions Overlay (Modern Tooltip-like) */}
                                {isSelected && isOccupied && !mergeMode && (
                                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 text-white p-1 rounded-xl shadow-2xl animate-in fade-in zoom-in slide-in-from-top-2 z-30">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" title="Gộp bàn" onClick={(e) => { e.stopPropagation(); setSourceTableForMerge(table); setMergeMode(true); }}>
                                            <Merge className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-4 bg-white/20 mx-0.5"></div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" title="Chuyển bàn" onClick={(e) => { e.stopPropagation(); setMoveDialogOpen(true); }}>
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-4 bg-white/20 mx-0.5"></div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" title="Tách bàn" onClick={(e) => { e.stopPropagation(); setOrderToSplit(table.activeOrder!); setSplitItems(table.activeOrder!.items.map(i => ({ itemId: i.id, quantity: 0 }))); setSplitDialogOpen(true); }}>
                                            <Split className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Cart panel for dine-in with existing orders
    const renderDineInCart = () => (
        <div className="w-96 bg-muted/30 border-l flex flex-col">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5" />
                        {selectedTable?.name}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedTable(null);
                            clearCart();
                        }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Chọn bàn khác
                    </Button>
                </div>
            </div>

            {/* Existing orders for this table */}
            {tableOrders.length > 0 && (
                <div className="p-4 border-b bg-gradient-to-br from-indigo-50/50 to-blue-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                            ĐƠN ĐANG PHỤC VỤ
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                        </p>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                            #{tableOrders[0].orderNumber}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {tableOrders.map((order) => (
                            <div key={order.id} className="bg-white/70 backdrop-blur-sm rounded-xl border border-indigo-100 shadow-sm p-3 relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 -rotate-45 translate-x-8 -translate-y-8 rounded-full"></div>

                                <div className="space-y-2 relative">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center text-xs">
                                            <div className="flex-1">
                                                <span className="font-bold text-slate-700 line-clamp-1">{item.product?.name}</span>
                                                <span className="text-[10px] text-slate-400">x{Number(item.quantity)}</span>
                                            </div>
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                                                    ${item.status === "done"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : item.status === "preparing"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                            >
                                                {item.status === "done" ? "Xong" : item.status === "preparing" ? "Pha chế" : "Chờ"}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-indigo-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-medium">TỔNG CỘNG</span>
                                        <span className="text-sm font-black text-indigo-700">
                                            {Number(order.totalAmount).toLocaleString()}đ
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-slate-900 hover:bg-slate-800 text-white border-0 h-9 px-4 rounded-lg font-bold text-xs"
                                        onClick={() => handleTableCheckout(order)}
                                        disabled={processing}
                                    >
                                        <Calculator className="h-3.5 w-3.5 mr-2" />
                                        THANH TOÁN
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New items to add */}
            <div className="p-3 border-b">
                <p className="text-xs font-semibold text-muted-foreground">
                    Thêm món mới ({cart.length})
                </p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
                {cart.map((item, index) => (
                    <Card key={item.id} className="p-3">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {item.sellPrice.toLocaleString()} × {item.quantity}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={() => updateCartQuantity(index, -1)}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <NumberInput
                                    value={item.quantity}
                                    onChange={(v) => setCartQuantity(index, v)}
                                    className="h-7 w-16 text-center text-sm"
                                    maxDecimals={0}
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={() => updateCartQuantity(index, 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500"
                                onClick={() => removeFromCart(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-right font-bold mt-1">
                            {(item.quantity * item.sellPrice).toLocaleString()}
                        </p>
                    </Card>
                ))}
                {cart.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Chọn món từ danh sách
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t space-y-3 bg-background">
                <div className="flex items-center justify-between text-lg">
                    <span>Thêm mới:</span>
                    <span className="font-bold text-2xl text-primary">
                        {totalAmount.toLocaleString()}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                    </Button>
                    <Button
                        onClick={handleSendToTable}
                        disabled={cart.length === 0 || processing}
                        className="bg-orange-500 hover:bg-orange-600"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        {processing ? "Đang gửi..." : "Gửi bếp"}
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Left Panel */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    {/* Mode Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${saleMode === "takeaway"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => {
                                setSaleMode("takeaway");
                                setSelectedTable(null);
                                clearCart();
                            }}
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Mang đi
                        </button>
                        <button
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${saleMode === "dinein"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            onClick={() => {
                                setSaleMode("dinein");
                                clearCart();
                            }}
                        >
                            <UtensilsCrossed className="h-4 w-4" />
                            Tại bàn
                        </button>
                    </div>

                    {/* Warehouse selector (always shown) */}
                    <div className="flex items-center gap-2">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={selectedWarehouseId}
                            onValueChange={(v) => {
                                setSelectedWarehouseId(v);
                                setCart([]);
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

                    {/* Search (shown when selecting products) */}
                    {(saleMode === "takeaway" || selectedTable) && (
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Tìm theo mã, tên hoặc barcode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                {saleMode === "takeaway" ? (
                    renderProductGrid()
                ) : selectedTable ? (
                    renderProductGrid()
                ) : (
                    renderTableSelection()
                )}
            </div>

            {/* Right Panel - Cart */}
            {saleMode === "takeaway" ? (
                // Original takeaway cart
                <div className="w-96 bg-muted/30 border-l flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Giỏ hàng ({cart.length})
                        </h2>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-2">
                        {cart.map((item, index) => (
                            <Card key={item.id} className="p-3">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.sellPrice.toLocaleString()} × {item.quantity}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            onClick={() => updateCartQuantity(index, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <NumberInput
                                            value={item.quantity}
                                            onChange={(v) =>
                                                setCartQuantity(index, v)
                                            }
                                            className="h-7 w-16 text-center text-sm"
                                            maxDecimals={0}
                                        />
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-7 w-7"
                                            onClick={() => updateCartQuantity(index, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-500"
                                        onClick={() => removeFromCart(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-right font-bold mt-1">
                                    {(item.quantity * item.sellPrice).toLocaleString()}
                                </p>
                            </Card>
                        ))}
                        {appliedPromotions.length > 0 && (
                            <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-slate-200">
                                <p className="text-xs font-bold text-purple-600 flex items-center gap-1 uppercase tracking-wider">
                                    <Gift className="w-3 h-3" /> Khuyến mãi áp dụng
                                </p>
                                {appliedPromotions.map((promo, idx) => (
                                    <Card key={idx} className="bg-purple-50/50 border-purple-100 p-2 shadow-none">
                                        <p className="text-xs font-bold text-purple-700">{promo.name}</p>
                                        <div className="space-y-1 mt-1">
                                            {promo.giftItems.map((gift, gIdx) => (
                                                <p key={gIdx} className="text-[11px] text-purple-600 flex items-center gap-1">
                                                    • Tặng {gift.quantity} {gift.productName} ({gift.discountPercentage}%)
                                                </p>
                                            ))}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                        {cart.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                Giỏ hàng trống
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t space-y-3 bg-background">
                        <div className="flex items-center justify-between text-lg">
                            <span>Tổng cộng:</span>
                            <span className="font-bold text-2xl text-primary">
                                {totalAmount.toLocaleString()}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                            </Button>
                            <Button onClick={openCheckout} disabled={cart.length === 0}>
                                <Calculator className="mr-2 h-4 w-4" />
                                Thanh toán
                            </Button>
                        </div>
                    </div>
                </div>
            ) : selectedTable ? (
                renderDineInCart()
            ) : (
                // No table selected - show empty state
                <div className="w-96 bg-muted/30 border-l flex flex-col items-center justify-center text-muted-foreground">
                    <UtensilsCrossed className="h-12 w-12 mb-3 opacity-30" />
                    <p className="font-medium">Chọn bàn để đặt món</p>
                </div>
            )}

            {/* Main Checkout Dialog */}
            {/* Table Action Menu Dialog */}
            <Dialog open={tableActionMenuOpen} onOpenChange={setTableActionMenuOpen}>
                <DialogContent className="max-w-md rounded-[2rem] overflow-hidden p-0 gap-0 border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -rotate-45 translate-x-16 -translate-y-16 rounded-full"></div>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3 relative">
                            <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <LayoutGrid className="h-6 w-6 text-white" />
                            </div>
                            BÀN {activeMenuTable?.name}
                        </DialogTitle>
                        <p className="text-slate-400 mt-2 font-medium relative italic">
                            {activeMenuTable?.status === 'occupied' ? 'Đang phục vụ khách' : 'Bàn trống'}
                        </p>
                    </DialogHeader>

                    <div className="p-6 grid grid-cols-2 gap-4 bg-slate-50">
                        {/* Always available */}
                        <Button
                            variant="outline"
                            className="h-32 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-white bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                            onClick={() => {
                                setSelectedTable(activeMenuTable);
                                clearCart();
                                setTableActionMenuOpen(false);
                            }}
                        >
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <UtensilsCrossed className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-slate-700">CHỌN MÓN</span>
                        </Button>

                        {/* Available only if occupied */}
                        {activeMenuTable?.status === 'occupied' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="h-32 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-white bg-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
                                    onClick={() => {
                                        const order = activeMenuTable.activeOrder;
                                        if (order) handleTableCheckout(order);
                                        setTableActionMenuOpen(false);
                                    }}
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                        <Calculator className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-slate-700">THANH TOÁN</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-32 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-white bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                                    onClick={() => {
                                        setSelectedTable(activeMenuTable);
                                        setMoveDialogOpen(true);
                                        setTableActionMenuOpen(false);
                                    }}
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <ArrowRightLeft className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-slate-700">CHUYỂN BÀN</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-32 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-white bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all group"
                                    onClick={() => {
                                        setSourceTableForMerge(activeMenuTable);
                                        setMergeMode(true);
                                        setTableActionMenuOpen(false);
                                    }}
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                        <Merge className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-slate-700">GỘP BÀN</span>
                                </Button>

                                <Button
                                    variant="outline"
                                    className="h-32 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border-white bg-white shadow-sm hover:shadow-md hover:border-purple-200 transition-all group"
                                    onClick={() => {
                                        setOrderToSplit(activeMenuTable.activeOrder!);
                                        setSplitItems(activeMenuTable.activeOrder!.items.map(i => ({ itemId: i.id, quantity: 0 })));
                                        setSplitDialogOpen(true);
                                        setTableActionMenuOpen(false);
                                    }}
                                >
                                    <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                        <Split className="h-6 w-6" />
                                    </div>
                                    <span className="font-bold text-slate-700">TÁCH BÀN</span>
                                </Button>
                            </>
                        )}
                    </div>
                    <DialogFooter className="p-4 bg-white border-t">
                        <Button variant="ghost" className="w-full font-bold text-slate-400" onClick={() => setTableActionMenuOpen(false)}>
                            ĐÓNG
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Xác nhận thanh toán
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Tổng tiền:</span>
                            <span className="text-primary">{totalAmount.toLocaleString()} đ</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Phương thức thanh toán</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={paymentMethod === "cash" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("cash")}
                                    className="flex flex-col h-16 gap-1"
                                >
                                    <Banknote className="h-5 w-5" />
                                    <span className="text-xs">Tiền mặt</span>
                                </Button>
                                <Button
                                    variant={paymentMethod === "transfer" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("transfer")}
                                    className="flex flex-col h-16 gap-1"
                                >
                                    <ArrowRightLeft className="h-5 w-5" />
                                    <span className="text-xs">Chuyển khoản</span>
                                </Button>
                                <Button
                                    variant={paymentMethod === "credit" ? "default" : "outline"}
                                    onClick={() => setPaymentMethod("credit")}
                                    className="flex flex-col h-16 gap-1"
                                >
                                    <User className="h-5 w-5" />
                                    <span className="text-xs">Ghi nợ</span>
                                </Button>
                            </div>
                        </div>

                        {paymentMethod === "cash" && (
                            <div className="space-y-2">
                                <Label>Tiền khách đưa</Label>
                                <NumberInput
                                    value={cashReceived === "" ? "" : Number(cashReceived)}
                                    onChange={(v) => setCashReceived(v.toString())}
                                    className="text-lg font-bold"
                                />
                                <div className="flex justify-between pt-2 text-sm">
                                    <span>Tiền thừa:</span>
                                    <span className={`font-bold ${changeAmount < 0 ? "text-red-500" : "text-emerald-500"}`}>
                                        {changeAmount.toLocaleString()} đ
                                    </span>
                                </div>
                            </div>
                        )}

                        {paymentMethod === "transfer" && (
                            <div className="space-y-2">
                                <Label>Mã giao dịch</Label>
                                <Input
                                    value={transferCode}
                                    onChange={(e) => setTransferCode(e.target.value)}
                                    placeholder="Nhập mã xác nhận..."
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Khách hàng (Tùy chọn)</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={selectedCustomer?.name || ""}
                                    placeholder="Chọn khách hàng..."
                                    readOnly
                                    onClick={() => setCustomerPickerOpen(true)}
                                    className="cursor-pointer"
                                />
                                {selectedCustomer && (
                                    <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleCheckout} disabled={processing}>
                            {processing ? "Đang xử lý..." : "Hoàn tất thanh toán"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CustomerPickerDialog
                open={customerPickerOpen}
                onOpenChange={setCustomerPickerOpen}
                onSelect={handleSelectCustomer}
            />

            {/* Split Order Dialog */}
            <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Split className="h-5 w-5" />
                            Tách đơn từ {selectedTable?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Chọn món cần tách</Label>
                            <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                                {orderToSplit?.items.map((item) => {
                                    const splitItem = splitItems.find(si => si.itemId === item.id);
                                    const currentQty = splitItem?.quantity || 0;

                                    return (
                                        <div key={item.id} className="flex flex-col p-3 rounded-xl border bg-slate-50 gap-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold leading-tight">{item.product?.name || "Sản phẩm"}</p>
                                                    <p className="text-[11px] text-slate-500">Còn lại: {Number(item.quantity) - currentQty}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full border bg-white"
                                                        disabled={currentQty <= 0}
                                                        onClick={() => {
                                                            setSplitItems(prev => prev.map(si => si.itemId === item.id ? { ...si, quantity: si.quantity - 1 } : si));
                                                        }}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-6 text-center text-sm font-black">{currentQty}</span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full border bg-white"
                                                        disabled={currentQty >= Number(item.quantity)}
                                                        onClick={() => {
                                                            setSplitItems(prev => prev.map(si => si.itemId === item.id ? { ...si, quantity: si.quantity + 1 } : si));
                                                        }}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-4 flex flex-col">
                            <Label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Chọn bàn đích</Label>
                            <div className="flex-1 overflow-auto bg-slate-100/50 rounded-2xl border p-4">
                                <div className="grid grid-cols-3 gap-2">
                                    {tables.filter(t => t.id !== selectedTable?.id).map(t => (
                                        <button
                                            key={t.id}
                                            className={`p-2 rounded-xl border text-[10px] font-bold transition-all
                                                ${tableToMoveTo?.id === t.id
                                                    ? 'bg-primary text-white border-primary shadow-lg scale-105'
                                                    : 'bg-white hover:border-primary/50 text-slate-600'
                                                }
                                                ${t.status === 'occupied' ? 'ring-1 ring-orange-200' : ''}
                                            `}
                                            onClick={() => setTableToMoveTo(t)}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                {t.status === 'occupied' && <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>}
                                                {t.name}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl mt-2 animate-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs opacity-70">Tổng tách:</span>
                                    <span className="text-lg font-black text-primary">
                                        {splitItems.reduce((sum, si) => {
                                            const item = orderToSplit?.items.find(i => i.id === si.itemId);
                                            return sum + (si.quantity * Number(item?.unitPrice || 0));
                                        }, 0).toLocaleString()}đ
                                    </span>
                                </div>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-white border-0 py-6 text-sm font-black"
                                    disabled={!tableToMoveTo || splitItems.every(si => si.quantity === 0) || processing}
                                    onClick={() => handleSplitOrder(tableToMoveTo!)}
                                >
                                    {processing ? "ĐANG XỬ LÝ..." : `TÁCH SANG BÀN ${tableToMoveTo?.name || '...'}`}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Move Table Dialog */}
            <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5" />
                            Chuyển bàn {selectedTable?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label>Chọn bàn đích (chỉ bàn trống)</Label>
                        <div className="grid grid-cols-4 gap-2 max-h-[300px] overflow-auto p-1">
                            {tables.filter(t => t.status === 'empty').map(t => (
                                <button
                                    key={t.id}
                                    className={`p-3 rounded-xl border font-bold text-xs transition-all ${tableToMoveTo?.id === t.id ? 'bg-primary text-white border-primary shadow-md' : 'bg-white hover:border-slate-300'}`}
                                    onClick={() => setTableToMoveTo(t)}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Hủy</Button>
                        <Button disabled={!tableToMoveTo || processing} onClick={() => handleMoveTable(tableToMoveTo!)}>
                            {processing ? "Đang xử lý..." : `Chuyển sang ${tableToMoveTo?.name || '...'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
