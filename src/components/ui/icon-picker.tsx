"use client";

import React, { useState, useMemo } from "react";
import {
    Search,
    X,
    Home,
    Users,
    Shield,
    Menu,
    Lock,
    User,
    Settings,
    Package,
    ShoppingCart,
    Bell,
    Calendar,
    Camera,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    Circle,
    Clock,
    Cloud,
    Code,
    Copy,
    CreditCard,
    Database,
    Download,
    Edit,
    Eye,
    File,
    FileText,
    Filter,
    Folder,
    Gift,
    Globe,
    Grid,
    Heart,
    HelpCircle,
    Image,
    Inbox,
    Info,
    Key,
    Layers,
    Layout,
    Link,
    List,
    Loader,
    LogIn,
    LogOut,
    Mail,
    Map,
    MapPin,
    MessageCircle,
    MessageSquare,
    Minus,
    Monitor,
    Moon,
    MoreHorizontal,
    MoreVertical,
    Music,
    Navigation,
    PenTool,
    Phone,
    PieChart,
    Play,
    Plus,
    Power,
    Printer,
    RefreshCw,
    Repeat,
    Save,
    Send,
    Server,
    Share,
    ShoppingBag,
    Sidebar,
    Sliders,
    Smartphone,
    Star,
    Sun,
    Table,
    Tag,
    Target,
    Terminal,
    ThumbsUp,
    Trash,
    Trash2,
    TrendingUp,
    TrendingDown,
    Truck,
    Tv,
    Upload,
    UserCheck,
    UserMinus,
    UserPlus,
    Video,
    Volume2,
    Wifi,
    XCircle,
    Zap,
    AlertCircle,
    AlertTriangle,
    Archive,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Award,
    BarChart,
    BarChart2,
    Battery,
    Book,
    Bookmark,
    Box,
    Briefcase,
    Building,
    Clipboard,
    Cpu,
    DollarSign,
    Droplet,
    ExternalLink,
    Facebook,
    Feather,
    Flag,
    Frown,
    Github,
    Gitlab,
    Hash,
    Headphones,
    Instagram,
    Italic,
    Linkedin,
    LucideIcon,
    Maximize,
    Minimize,
    Move,
    Paperclip,
    Pause,
    Percent,
    Radio,
    RotateCcw,
    RotateCw,
    Rss,
    Scissors,
    Search as SearchIcon,
    Shuffle,
    SkipBack,
    SkipForward,
    Smile,
    Speaker,
    Square,
    StopCircle,
    Thermometer,
    ToggleLeft,
    ToggleRight,
    Twitter,
    Umbrella,
    Underline,
    Unlock,
    VolumeX,
    Watch,
    Wind,
    Youtube,
    ZoomIn,
    ZoomOut,
    Activity,
    Airplay,
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Anchor,
    Aperture,
    AtSign,
    Bold,
    Cast,
    CheckCircle,
    CheckSquare,
    Codepen,
    Coffee,
    Columns,
    Command,
    Compass,
    CornerDownLeft,
    CornerDownRight,
    CornerLeftDown,
    CornerLeftUp,
    CornerRightDown,
    CornerRightUp,
    CornerUpLeft,
    CornerUpRight,
    Crosshair,
    Delete,
    Disc,
    Divide,
    DollarSign as Dollar,
    Edit2,
    Edit3,
    EyeOff,
    FastForward,
    FileMinus,
    FilePlus,
    Folder as FolderIcon,
    FolderMinus,
    FolderPlus,
    Framer,
    Gitlab as GitlabIcon,
    Grid as GridIcon,
    HardDrive,
    Hexagon,
    Home as HomeIcon,
    Layers as LayersIcon,
    LifeBuoy,
    Link2,
    Loader as LoaderIcon,
    Maximize2,
    Meh,
    Menu as MenuIcon,
    Mic,
    MicOff,
    Minimize2,
    MinusCircle,
    MinusSquare,
    MousePointer,
    Octagon,
    Package as PackageIcon,
    Pause as PauseIcon,
    PenTool as PenToolIcon,
    PhoneCall,
    PhoneForwarded,
    PhoneIncoming,
    PhoneMissed,
    PhoneOff,
    PhoneOutgoing,
    PlusCircle,
    PlusSquare,
    Pocket,
    RefreshCcw,
    Rewind,
    Save as SaveIcon,
    Server as ServerIcon,
    Share2,
    Shield as ShieldIcon,
    ShieldOff,
    Sidebar as SidebarIcon,
    Slack,
    Sunrise,
    Sunset,
    Tablet,
    ThumbsDown,
    Trello,
    Triangle,
    Type,
    UserX,
    Users as UsersIcon,
    Voicemail,
    Volume,
    Volume1,
    WifiOff,
    X as XIcon,
    ZapOff,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Icon mapping - explicit list of commonly used icons
const iconMap: Record<string, LucideIcon> = {
    Home,
    Users,
    Shield,
    Menu,
    Lock,
    User,
    Settings,
    Package,
    ShoppingCart,
    Bell,
    Calendar,
    Camera,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    ChevronUp,
    Circle,
    Clock,
    Cloud,
    Code,
    Copy,
    CreditCard,
    Database,
    Download,
    Edit,
    Eye,
    File,
    FileText,
    Filter,
    Folder,
    Gift,
    Globe,
    Grid,
    Heart,
    HelpCircle,
    Image,
    Inbox,
    Info,
    Key,
    Layers,
    Layout,
    Link,
    List,
    Loader,
    LogIn,
    LogOut,
    Mail,
    Map,
    MapPin,
    MessageCircle,
    MessageSquare,
    Minus,
    Monitor,
    Moon,
    MoreHorizontal,
    MoreVertical,
    Music,
    Navigation,
    PenTool,
    Phone,
    PieChart,
    Play,
    Plus,
    Power,
    Printer,
    RefreshCw,
    Repeat,
    Save,
    Send,
    Server,
    Share,
    ShoppingBag,
    Sidebar,
    Sliders,
    Smartphone,
    Star,
    Sun,
    Table,
    Tag,
    Target,
    Terminal,
    ThumbsUp,
    Trash,
    Trash2,
    TrendingUp,
    TrendingDown,
    Truck,
    Tv,
    Upload,
    UserCheck,
    UserMinus,
    UserPlus,
    Video,
    Volume2,
    Wifi,
    XCircle,
    Zap,
    AlertCircle,
    AlertTriangle,
    Archive,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Award,
    BarChart,
    BarChart2,
    Battery,
    Book,
    Bookmark,
    Box,
    Briefcase,
    Building,
    Clipboard,
    Cpu,
    DollarSign,
    Droplet,
    ExternalLink,
    Feather,
    Flag,
    Hash,
    Headphones,
    Activity,
    Airplay,
    Anchor,
    Aperture,
    AtSign,
    Bold,
    Cast,
    CheckCircle,
    CheckSquare,
    Coffee,
    Columns,
    Command,
    Compass,
    Crosshair,
    Delete,
    Disc,
    Divide,
    EyeOff,
    FastForward,
    FileMinus,
    FilePlus,
    FolderMinus,
    FolderPlus,
    HardDrive,
    Hexagon,
    LifeBuoy,
    Link2,
    Maximize,
    Maximize2,
    Meh,
    Mic,
    MicOff,
    Minimize,
    Minimize2,
    MinusCircle,
    MinusSquare,
    MousePointer,
    Move,
    Octagon,
    Paperclip,
    Pause,
    Percent,
    PhoneCall,
    PlusCircle,
    PlusSquare,
    Pocket,
    Radio,
    RefreshCcw,
    Rewind,
    RotateCcw,
    RotateCw,
    Rss,
    Scissors,
    Search: SearchIcon,
    Share2,
    ShieldOff,
    Shuffle,
    SkipBack,
    SkipForward,
    Slack,
    Smile,
    Speaker,
    Square,
    StopCircle,
    Sunrise,
    Sunset,
    Tablet,
    Thermometer,
    ThumbsDown,
    ToggleLeft,
    ToggleRight,
    Triangle,
    Type,
    Umbrella,
    Underline,
    Unlock,
    UserX,
    Voicemail,
    Volume,
    Volume1,
    VolumeX,
    Watch,
    WifiOff,
    Wind,
    X: XIcon,
    ZapOff,
    ZoomIn,
    ZoomOut,
};

const allIconNames = Object.keys(iconMap);

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function IconPicker({ value, onChange, open, onOpenChange }: IconPickerProps) {
    const [search, setSearch] = useState("");

    const filteredIcons = useMemo(() => {
        if (!search) return allIconNames;
        return allIconNames.filter((name) =>
            name.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const handleSelect = (iconName: string) => {
        onChange(iconName);
        onOpenChange(false);
        setSearch("");
    };

    const renderIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName];
        if (!IconComponent) return null;
        return <IconComponent className="w-5 h-5" />;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Chọn Icon</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm icon..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Selected icon */}
                    {value && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-sm text-slate-600">Đã chọn:</span>
                            <div className="flex items-center gap-2 font-medium text-blue-600">
                                {renderIcon(value)}
                                <span>{value}</span>
                            </div>
                        </div>
                    )}

                    {/* Icons grid */}
                    <ScrollArea className="h-[400px]">
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-1">
                            {filteredIcons.map((iconName) => (
                                <Button
                                    key={iconName}
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "h-12 w-12 flex-col gap-0.5 hover:bg-blue-50 hover:border-blue-300 transition-all",
                                        value === iconName && "bg-blue-100 border-blue-500 text-blue-600"
                                    )}
                                    onClick={() => handleSelect(iconName)}
                                    title={iconName}
                                >
                                    {renderIcon(iconName)}
                                </Button>
                            ))}
                        </div>
                        {filteredIcons.length === 0 && (
                            <div className="text-center text-slate-500 py-8">
                                Không tìm thấy icon nào
                            </div>
                        )}
                    </ScrollArea>

                    {/* Count */}
                    <p className="text-center text-sm text-slate-400">
                        {filteredIcons.length} icons
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface IconPickerButtonProps {
    value: string;
    onChange: (icon: string) => void;
}

export function IconPickerButton({ value, onChange }: IconPickerButtonProps) {
    const [open, setOpen] = useState(false);

    const renderIcon = (iconName: string) => {
        const IconComponent = iconMap[iconName];
        if (!IconComponent) return null;
        return <IconComponent className="w-4 h-4" />;
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => setOpen(true)}
            >
                {value ? (
                    <>
                        {renderIcon(value)}
                        <span>{value}</span>
                    </>
                ) : (
                    <span className="text-slate-400">Chọn icon...</span>
                )}
            </Button>
            <IconPicker
                value={value}
                onChange={onChange}
                open={open}
                onOpenChange={setOpen}
            />
        </>
    );
}

// Export icon map for use in other components
export { iconMap };
