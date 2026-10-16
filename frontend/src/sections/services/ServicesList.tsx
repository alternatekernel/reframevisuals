import React from 'react';
import { cx, layout } from '../../utils/theme';
import ServiceDetail from '../../components/ServiceDetail';
import { useServicesContext } from '../../context/ServicesContext';

interface ServicesListProps {
  services?: any[];
}

const ServicesList: React.FC<ServicesListProps> = ({ services: propServices }) => {
  const { services: contextServices, isLoading } = useServicesContext();
  const services = propServices || contextServices;
  const [activeServiceId, setActiveServiceId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!services || services.length === 0 || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const ratios: Record<string, number> = {};
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.serviceId;
          if (!id) continue;
          ratios[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        let nextId: string | null = null;
        let bestRatio = 0;
        for (const service of services) {
          const id = String(service.id);
          const ratio = ratios[id] || 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            nextId = id;
          }
        }
        setActiveServiceId(nextId);
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: '-15% 0px -15% 0px',
      }
    );

    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-service-id]'));
    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [services]);

  if (isLoading) {
    return (
      <section className="bg-white border-t border-black/5">
        <div className={cx(layout.compactShell, "py-32 px-6")}>
          <div className="flex items-center justify-center py-20">
            <p className="text-[#666666]">Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!services || services.length === 0) {
    return (
      <section className="bg-white border-t border-black/5">
        <div className={cx(layout.compactShell, "py-32 px-6")}>
          <div className="flex items-center justify-center py-20">
            <p className="text-[#666666]">No services available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-t border-black/5">
      <div className={cx(layout.compactShell, "py-16 px-6")}>
        {/* SERVICE LIST */}
        <div className="flex flex-col gap-16">
          {services.map((service: any) => (
            <div key={service.id} data-service-id={service.id}>
              <ServiceDetail service={service} showOrderNow={activeServiceId === String(service.id)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesList;
