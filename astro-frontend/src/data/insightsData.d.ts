export interface BlogPost {
    id: number;
    slug: string;
    category: 'techniques' | 'services' | 'industry';
    title: string;
    excerpt: string;
    content: string;
    image: string;
    readTime: string;
    date: string;
    featured: boolean;
}
export declare const BLOG_POSTS: BlogPost[];
//# sourceMappingURL=insightsData.d.ts.map