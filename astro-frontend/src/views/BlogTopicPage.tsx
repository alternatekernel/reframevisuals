import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const BlogTopicPage: React.FC = () => {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  if (!topicSlug) return <Navigate to="/blog" replace />;
  return <Navigate to={`/blog?topic=${encodeURIComponent(topicSlug)}`} replace />;
};

export default BlogTopicPage;
