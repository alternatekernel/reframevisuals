import { Link, useLocation } from 'react-router-dom';

const ContinueBrowsing = () => {
  const { pathname } = useLocation();


  const links = [
    { label: 'Services', to: '/services' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'About', to: '/about' },
    { label: 'Portfolio', to: '/portfolio' },
    { label: 'Blog', to: '/blog' },
  ];

  const isActiveLink = (to: string) => {
    if (to === '/blog') return pathname === '/blog' || pathname.startsWith('/blog/');
    return pathname === to || pathname.startsWith(`${to}/`);
  };

  const visibleLinks = links.filter((link) => !isActiveLink(link.to)).slice(0, 4);

  return (
    <section className="max-w-[1200px] mx-auto px-6 lg:px-10 pb-16">
      <h2 className="text-[20px] font-semibold text-black mb-4">Explore Next</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visibleLinks.map((link, index) => (
          <Link
            key={link.to}
            to={link.to}
            className="block rounded-lg px-4 py-3 text-sm font-medium text-black/85 transition-all duration-300 border border-black/10 hover:border-black/20 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ContinueBrowsing;
