import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen bg-white flex items-center justify-center px-6">
    <Helmet>
      <title>Page Not Found | Reframe Visuals</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="text-center space-y-5 max-w-md">
      <p className="text-[13px] font-black uppercase tracking-[0.18em] text-black/30">404</p>
      <h1 className="text-[36px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
        Page not found.
      </h1>
      <p className="text-[16px] text-black/55 leading-relaxed">
        This page doesn&apos;t exist or may have moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-text-primary)] px-6 py-3 text-[15px] font-bold text-white hover:bg-black transition-colors"
      >
        Back to home <ArrowRight size={14} />
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
