import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import OrderFlowUI, { OrderFlowUIHandle } from '../order/OrderFlowUI';
import OrderSidebar from '../order/OrderSidebar';
import { OrderFlowData, OrderFlowStep } from '../order/types';
import { useDashboard } from '../../context/DashboardContext';
import { SERVICES } from '../../data/services';
import { dashboardPageDescriptionClass, dashboardPageTitleClass, dashboardSurfaceClass } from './dashboard-primitives';

const serviceLookup = new Map(SERVICES.flatMap(service => [
  [service.id.toLowerCase(), service.id],
  [service.name.toLowerCase(), service.id],
]));

const normalizeTemplateServices = (services: string[] = []) =>
  services.map(service => serviceLookup.get(service.toLowerCase()) || service);

const parseTemplateSizing = (sizing?: string) => {
  const match = sizing?.match(/(\d+)\s*x\s*(\d+)/i);
  return {
    resizeWidth: match?.[1] || '',
    resizeHeight: match?.[2] || '',
  };
};

const INITIAL_ORDER_DATA: OrderFlowData = {
  projectName: '',
  instructions: '',
  selectedServices: [],
  outputFormat: 'jpg',
  turnaround: '24',
  files: [],
  supportFiles: [],
  sourceLinks: [],
  background: 'white',
  cropRatio: 'original',
  resizeWidth: '',
  resizeHeight: '',
  colorProfile: 'sRGB',
  resolutionDPI: '72',
  layering: 'Flat',
  namingPattern: '',
  marginPercent: '0',
  deliveryVector: 'Dashboard',
  email: '',
  maintainAspectRatio: true,
};

const DRAFT_KEY = 'reframe_order_draft';

interface OrderFlowViewProps {
  pageTitle?: string;
  pageDescription?: string;
  initialOrderData?: Partial<OrderFlowData>;
  draftKey?: string;
  isPublicPage?: boolean;
}

const OrderFlowView: React.FC<OrderFlowViewProps> = ({
  pageTitle,
  pageDescription,
  initialOrderData = {},
  draftKey = DRAFT_KEY,
  isPublicPage = false,
}) => {
  const { setCurrentView, fetchJobs, templates, isTemplateMode } = useDashboard();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const serviceId = searchParams.get('serviceId');
  const [orderFlowStep, setOrderFlowStep] = useState<OrderFlowStep>('requirements');
  const createIdempotencyKey = () => (
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'idemp-' + Math.random().toString(36).substring(2, 15)
  );

  const [orderData, setOrderData] = useState<OrderFlowData>(() => ({
    ...INITIAL_ORDER_DATA,
    ...initialOrderData,
    idempotencyKey: initialOrderData.idempotencyKey || createIdempotencyKey(),
  }));

  const [showSelector, setShowSelector] = useState(!templateId && !isTemplateMode && !serviceId && templates.length > 0);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);

  useEffect(() => {
    if (templateId || serviceId || isTemplateMode) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) {
      setOrderData(prev => ({
        ...prev,
        idempotencyKey: prev.idempotencyKey || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'idemp-' + Math.random().toString(36).substring(2, 15))
      }));
      return;
    }
    try {
      const draft = JSON.parse(savedDraft) as Partial<OrderFlowData>;
      setOrderData(prev => ({
        ...prev,
        ...draft,
        files: [],
        supportFiles: [],
        idempotencyKey: draft.idempotencyKey || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'idemp-' + Math.random().toString(36).substring(2, 15))
      }));
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [templateId, serviceId, isTemplateMode, draftKey]);

  // Apply Template or Service if provided
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const sizing = parseTemplateSizing(template.specs.sizing);
        setOrderData({
          ...INITIAL_ORDER_DATA,
          ...initialOrderData,
          idempotencyKey: initialOrderData.idempotencyKey || createIdempotencyKey(),
          sourceTemplateId: template.id,
          projectName: isTemplateMode ? template.name : `${template.name} - ${new Date().toLocaleDateString()}`,
          selectedServices: normalizeTemplateServices(template.services),
          instructions: template.instructions || '',
          outputFormat: (template.specs.format.toLowerCase() as any) || 'jpg',
          background: template.specs.background || 'white',
          turnaround: template.specs.turnaround || '48',
          cropRatio: template.specs.cropRatio || 'original',
          colorProfile: template.specs.colorProfile || 'sRGB',
          resolutionDPI: template.specs.resolutionDPI || '72',
          layering: template.specs.layering || 'Flat',
          deliveryVector: template.specs.deliveryVector || 'Dashboard',
          resizeWidth: template.specs.resizeWidth || sizing.resizeWidth,
          resizeHeight: template.specs.resizeHeight || sizing.resizeHeight,
          maintainAspectRatio: template.specs.maintainAspectRatio || false,
          customBgColor: template.specs.customBgColor,
        });
        // Skip requirements step if using a template to PLACE AN ORDER
        if (!isTemplateMode) {
          setIsUsingTemplate(true);
          setOrderFlowStep('files');
        }
      }
    } else if (serviceId) {
      // Pre-select service from URL
      setOrderData(prev => ({
        ...prev,
        ...initialOrderData,
        selectedServices: [serviceId],
        idempotencyKey: prev.idempotencyKey || ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'idemp-' + Math.random().toString(36).substring(2, 15))
      }));
      setShowSelector(false);
    }
  }, [templateId, templates, isTemplateMode, serviceId, initialOrderData]);

  const handleSelectTemplate = (id: string | 'scratch') => {
    if (id === 'scratch') {
      setShowSelector(false);
    } else {
      const template = templates.find(t => t.id === id);
      if (template) {
        const sizing = parseTemplateSizing(template.specs.sizing);
        setOrderData({
          ...INITIAL_ORDER_DATA,
          ...initialOrderData,
          idempotencyKey: initialOrderData.idempotencyKey || createIdempotencyKey(),
          sourceTemplateId: template.id,
          projectName: `${template.name} - ${new Date().toLocaleDateString()}`,
          selectedServices: normalizeTemplateServices(template.services),
          instructions: template.instructions || '',
          outputFormat: (template.specs.format.toLowerCase() as any) || 'jpg',
          background: template.specs.background || 'white',
          turnaround: template.specs.turnaround || '48',
          cropRatio: template.specs.cropRatio || 'original',
          colorProfile: template.specs.colorProfile || 'sRGB',
          resolutionDPI: template.specs.resolutionDPI || '72',
          layering: template.specs.layering || 'Flat',
          deliveryVector: template.specs.deliveryVector || 'Dashboard',
          resizeWidth: template.specs.resizeWidth || sizing.resizeWidth,
          resizeHeight: template.specs.resizeHeight || sizing.resizeHeight,
          maintainAspectRatio: template.specs.maintainAspectRatio || false,
          customBgColor: template.specs.customBgColor,
        });
        setIsUsingTemplate(true);
        setOrderFlowStep('files');
        setShowSelector(false);
      }
    }
  };

  const orderFlowUIRef = useRef<OrderFlowUIHandle>(null);

  const [guestId] = useState(() => {
    let id = localStorage.getItem('portal_guest_id');
    if (!id) {
      // Fallback for crypto.randomUUID in non-secure contexts
      id = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : 'guest-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('portal_guest_id', id);
    }
    return id;
  });

  const handleCancel = () => {
    if (isPublicPage) {
      navigate('/');
      return;
    }
    setCurrentView(isTemplateMode ? 'templates' : 'jobs');
  };

  const handleComplete = async () => {
    if (isPublicPage) {
      navigate('/');
      return;
    }
    if (!isTemplateMode) {
      await fetchJobs();
      setCurrentView('jobs');
    } else {
      setCurrentView('templates');
    }
  };

  if (isPublicPage) {
    return (
      <div className={`${dashboardSurfaceClass} flex overflow-hidden`} style={{ height: 'calc(100dvh - 160px)', minHeight: '560px' }}>
        {/* Sidebar */}
        <div className="w-[210px] shrink-0 border-r border-[var(--color-border-light)] flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border-light)]">
            <h1 className="text-[15px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">{pageTitle}</h1>
            {pageDescription && <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{pageDescription}</p>}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <OrderSidebar
              orderFlowStep={orderFlowStep}
              orderData={orderData}
              onStepClick={(step) => orderFlowUIRef.current?.navigateTo(step)}
            />
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-5">
          <OrderFlowUI
            ref={orderFlowUIRef}
            orderFlowStep={orderFlowStep}
            setOrderFlowStep={setOrderFlowStep}
            orderData={orderData}
            setOrderData={setOrderData}
            guestId={guestId}
            isUsingTemplate={isUsingTemplate}
            draftKey={draftKey}
            hideBreadcrumb
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto`}>
      <div className="mb-4 sm:mb-8">
        <h1 className={`${dashboardPageTitleClass} mb-2 text-[24px] font-bold`}>
          {pageTitle || (isTemplateMode ? 'Create New Template' : 'New Project')}
        </h1>
        <p className={dashboardPageDescriptionClass}>
          {pageDescription || (isTemplateMode
            ? 'Configure your professional preset for one-click ordering.'
            : 'Configure your project requirements and upload assets.'
          )}
        </p>
      </div>

      <div className={`${dashboardSurfaceClass} p-4 sm:p-6`}>
        <OrderFlowUI
          orderFlowStep={orderFlowStep}
          setOrderFlowStep={setOrderFlowStep}
          orderData={orderData}
          setOrderData={setOrderData}
          guestId={guestId}
          isUsingTemplate={isUsingTemplate}
          draftKey={draftKey}
          onCancel={handleCancel}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
};

export default OrderFlowView;
