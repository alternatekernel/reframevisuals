import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { SERVICES } from '../data/services';
import { Button } from '../components/ui/button';

const ReframeVisualsServicesPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Reframe Visuals Services | Product Image Editing for E-commerce</title>
        <meta
          name="description"
          content="Reframe Visuals services include background removal, retouching, color correction, ghost mannequin, clipping path, and high-volume post-production."
        />
        <link rel="canonical" href="https://reframevisuals.com/reframe-visuals-services" />
      </Helmet>

      <section className="max-w-5xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <p className="text-xs font-black tracking-[0.2em] uppercase text-black/40 mb-3">Service overview</p>
        <h1 className="font-heading text-4xl lg:text-5xl font-semibold tracking-tight text-black mb-6">Reframe Visuals Services</h1>
        <p className="text-lg text-black/70 leading-relaxed mb-10 max-w-3xl">
          We provide end-to-end product image post-production for e-commerce teams with fast turnaround,
          consistent output, and quality-control-first delivery. Explore our complete range of capabilities below.
        </p>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 text-black/80">
          {SERVICES.map((service) => (
            <li key={service.id} className="rounded-2xl border border-black/10 px-5 py-4 hover:border-black/20 hover:shadow-sm transition-all flex flex-col">
              <span className="font-bold text-[15px] mb-1">{service.name}</span>
              <span className="text-[13px] text-black/60 line-clamp-2">{service.description || "Professional image editing and processing."}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-4">
          <Button asChild variant="default">
            <Link to="/services">View Full Services</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/pricing">Pricing Plans</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/book-meeting">Book a Meeting</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ReframeVisualsServicesPage;
