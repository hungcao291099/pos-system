"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ChefHat,
    Clock,
    CheckCircle2,
    Timer,
    Utensils,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderItem {
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    amount: number;
    status: "pending" | "preparing" | "done";
    notes?: string;
    product?: {
        id: number;
        name: string;
        code: string;
    };
}

interface TableOrder {
    id: number;
    orderNumber: string;
    tableId: number;
    status: "pending" | "preparing" | "completed" | "cancelled";
    totalAmount: number;
    notes?: string;
    items: OrderItem[];
    table?: {
        id: number;
        name: string;
    };
    createdAt: string;
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<TableOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch("/api/table-orders?active=true");
            const data = await res.json();
            if (data.success) {
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();

        // Poll every 3 seconds as fallback for real-time
        pollRef.current = setInterval(fetchOrders, 3000);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [fetchOrders]);

    // Also try Socket.IO
    useEffect(() => {
        let socket: any = null;
        async function connectSocket() {
            try {
                const { io } = await import("socket.io-client");
                socket = io({ path: "/api/socketio", addTrailingSlash: false });
                socket.on("order:new", () => fetchOrders());
                socket.on("order:update", () => fetchOrders());
                socket.on("order:complete", () => fetchOrders());
                socket.on("order:itemUpdate", () => fetchOrders());
            } catch {
                // Socket not available, polling will handle it
            }
        }
        connectSocket();
        return () => {
            if (socket) socket.disconnect();
        };
    }, [fetchOrders]);

    const updateItemStatus = async (
        itemId: number,
        newStatus: "pending" | "preparing" | "done"
    ) => {
        try {
            const res = await fetch(`/api/table-orders/items/${itemId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchOrders();
            } else {
                toast.error(data.error || "Lỗi cập nhật");
            }
        } catch {
            toast.error("Lỗi hệ thống");
        }
    };

    const getTimeSince = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút`;
        return `${Math.floor(minutes / 60)}h${minutes % 60}p`;
    };

    const itemStatusConfig = {
        pending: {
            label: "Chờ",
            color: "bg-amber-50 text-amber-800 border-amber-200",
            icon: Clock,
            nextStatus: "preparing" as const,
            nextLabel: "Bắt đầu pha chế",
            btnColor: "bg-blue-500 hover:bg-blue-600 text-white",
        },
        preparing: {
            label: "Đang pha chế",
            color: "bg-blue-50 text-blue-800 border-blue-200",
            icon: Timer,
            nextStatus: "done" as const,
            nextLabel: "Hoàn thành",
            btnColor: "bg-emerald-500 hover:bg-emerald-600 text-white",
        },
        done: {
            label: "Đã xong",
            color: "bg-emerald-50 text-emerald-800 border-emerald-200",
            icon: CheckCircle2,
            nextStatus: null,
            nextLabel: "",
            btnColor: "",
        },
    };

    const orderCardBorder = (order: TableOrder) => {
        const hasPending = order.items.some((i) => i.status === "pending");
        const hasPreparing = order.items.some((i) => i.status === "preparing");
        if (hasPending) return "border-amber-300 shadow-amber-100";
        if (hasPreparing) return "border-blue-300 shadow-blue-100";
        return "border-emerald-300 shadow-emerald-100";
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                            <ChefHat className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Màn hình pha chế</h1>
                            <p className="text-xs text-gray-500">
                                {orders.length} đơn đang xử lý
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Tự động cập nhật
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchOrders}
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Tải lại
                        </Button>
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Utensils className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">Không có đơn hàng nào</p>
                        <p className="text-sm">Đơn mới sẽ hiện ở đây khi có khách đặt</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className={`rounded-xl border-2 bg-white shadow-md overflow-hidden ${orderCardBorder(order)}`}
                            >
                                {/* Order Header */}
                                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg text-gray-900">
                                                {order.table?.name || `Bàn ${order.tableId}`}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
                                                #{order.orderNumber}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        {getTimeSince(order.createdAt)}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-3 space-y-2">
                                    {order.items.map((item) => {
                                        const config = itemStatusConfig[item.status];
                                        const StatusIcon = config.icon;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex items-center justify-between p-2.5 rounded-lg border ${config.color}`}
                                            >
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <StatusIcon className="h-4 w-4 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm truncate">
                                                                {item.product?.name || `SP ${item.productId}`}
                                                            </span>
                                                            <span className="text-xs font-bold bg-black/10 px-1.5 py-0.5 rounded">
                                                                x{Number(item.quantity)}
                                                            </span>
                                                        </div>
                                                        {item.notes && (
                                                            <p className="text-xs opacity-70 truncate">
                                                                {item.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {config.nextStatus && (
                                                    <button
                                                        className={`ml-2 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${config.btnColor}`}
                                                        onClick={() =>
                                                            updateItemStatus(
                                                                item.id,
                                                                config.nextStatus!
                                                            )
                                                        }
                                                    >
                                                        {config.nextLabel}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Order Footer */}
                                {order.notes && (
                                    <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
                                        <span className="font-medium">Ghi chú:</span>{" "}
                                        {order.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
