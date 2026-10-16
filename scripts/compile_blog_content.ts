import { BLOG_POSTS } from '../frontend/src/data/insightsData';
import fs from 'fs';
import path from 'path';

const cleanedPosts = BLOG_POSTS.map(post => ({
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  content: post.content,
  date: post.date,
  readTime: post.readTime,
  category: post.category
}));

// Resolve target relative to script folder or process cwd to be completely safe
const targetPath = path.join(process.cwd(), 'backend/src/data/compiledBlogPosts.json');

// Ensure parent directories exist
const dir = path.dirname(targetPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(targetPath, JSON.stringify(cleanedPosts, null, 2), 'utf8');
console.log(`✅ Compiled ${cleanedPosts.length} blog posts to ${targetPath}`);
