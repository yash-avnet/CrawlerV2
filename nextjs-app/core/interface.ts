export interface ProductInfo {
    crawlId?: string;
    mpn: string;
    url: string;
    title?: string;
    brand?: string;
    medianPrice?: string;
    error?: string;
    distributors?: DistributorInfo[];
}

export interface DistributorInfo {
    name: string;
    sku: string;
    stock: number;
    min: number;
    pkg: string;
    currency: string;
    prices: Record<string, number>;
    updated: string;
}