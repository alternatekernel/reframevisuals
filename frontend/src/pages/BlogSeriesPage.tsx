import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const BlogSeriesPage: React.FC = () => {
  const { seriesSlug } = useParams<{ seriesSlug: string }>();
  if (!seriesSlug) return <Navigate to="/blog" replace />;
  return <Navigate to={`/blog?series=${encodeURIComponent(seriesSlug)}`} replace />;
};

export default BlogSeriesPage;
