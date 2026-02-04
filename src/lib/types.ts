export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface UserDto {
    id: number;
    username: string;
    email: string;
    fullName: string;
    isActive: boolean;
    avatar?: string;
    roles: RoleDto[];
    createdAt: Date;
    modifiedAt: Date;
}

export interface RoleDto {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

export interface MenuDto {
    id: number;
    name: string;
    path: string;
    icon: string;
    parentId: number | null;
    sortOrder: number;
    isActive: boolean;
    children?: MenuDto[];
}

export interface PermissionDto {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
}

export interface LoginRequest {
    username: string;
    password: string;
    rememberMe?: boolean;
}

export interface LoginResponse {
    user: UserDto;
    accessToken: string;
}

export interface CreateUserRequest {
    username: string;
    password: string;
    email?: string;
    fullName?: string;
    isActive?: boolean;
    roleIds?: number[];
}

export interface UpdateUserRequest {
    email?: string;
    fullName?: string;
    isActive?: boolean;
    avatar?: string;
    password?: string;
}

export interface CreateRoleRequest {
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface CreateMenuRequest {
    name: string;
    path: string;
    icon?: string;
    parentId?: number;
    sortOrder?: number;
    isActive?: boolean;
}

export interface CreatePermissionRequest {
    name: string;
    description?: string;
    resource: string;
    action: string;
}

// Master Data DTOs
export interface SupplierDto {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    taxCode?: string;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    modifiedAt: Date;
}

export interface CustomerDto {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxCode?: string;
    customerType?: string;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    modifiedAt: Date;
}

export interface UnitDto {
    id: number;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    modifiedAt: Date;
}

export interface ProductCategoryDto {
    id: number;
    code: string;
    name: string;
    description?: string;
    parentId?: number;
    sortOrder: number;
    isActive: boolean;
    children?: ProductCategoryDto[];
    createdAt: Date;
    modifiedAt: Date;
}

export interface WarehouseDto {
    id: number;
    code: string;
    name: string;
    address?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    modifiedAt: Date;
}

export interface ProductDto {
    id: number;
    code: string;
    barcode?: string;
    name: string;
    description?: string;
    unitId: number;
    categoryId?: number;
    purchasePrice: number;
    defaultSellPrice: number;
    minStock: number;
    maxStock?: number;
    image?: string;
    isActive: boolean;
    unit?: UnitDto;
    category?: ProductCategoryDto;
    warehousePrices?: ProductWarehousePriceDto[];
    createdAt: Date;
    modifiedAt: Date;
}

export interface ProductWarehousePriceDto {
    id: number;
    productId: number;
    warehouseId: number;
    sellPrice: number;
    isActive: boolean;
    warehouse?: WarehouseDto;
}

export interface PriceHistoryDto {
    id: number;
    productId: number;
    warehouseId?: number;
    oldPrice: number;
    newPrice: number;
    priceType: string;
    effectiveDate: Date;
    reason?: string;
    createdAt: Date;
}

// Master Data Request Types
export interface CreateSupplierRequest {
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
    taxCode?: string;
    notes?: string;
    isActive?: boolean;
}

export interface CreateCustomerRequest {
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    taxCode?: string;
    customerType?: string;
    notes?: string;
    isActive?: boolean;
}

export interface CreateUnitRequest {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface CreateProductCategoryRequest {
    code: string;
    name: string;
    description?: string;
    parentId?: number;
    sortOrder?: number;
    isActive?: boolean;
}

export interface CreateWarehouseRequest {
    code: string;
    name: string;
    address?: string;
    description?: string;
    isActive?: boolean;
}

export interface CreateProductRequest {
    code: string;
    barcode?: string;
    name: string;
    description?: string;
    unitId: number;
    categoryId?: number;
    purchasePrice?: number;
    defaultSellPrice?: number;
    minStock?: number;
    maxStock?: number;
    image?: string;
    isActive?: boolean;
    warehousePrices?: { warehouseId: number; sellPrice: number }[];
}

export interface UpdateProductRequest {
    barcode?: string;
    name?: string;
    description?: string;
    unitId?: number;
    categoryId?: number;
    purchasePrice?: number;
    defaultSellPrice?: number;
    minStock?: number;
    maxStock?: number;
    image?: string;
    isActive?: boolean;
    warehousePrices?: { warehouseId: number; sellPrice: number }[];
}
