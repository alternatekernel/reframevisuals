import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Download, User } from 'lucide-react';
import { cx, layout, typography } from '../utils/theme';
import { WORKFLOW_INTEGRATIONS, WORKFLOW_NODES, WORKFLOW_STEP_DESCRIPTIONS, type WorkflowNode } from './workflow/workflowData';

// ─── Actor (user icon box) ─────────────────────────────────────────────────

interface ActorProps {
  label: string;
  delay: number;
  color?: string;
  isMobile?: boolean;
}

const Actor = ({ label, delay, color = '#C2410C', isMobile = false }: ActorProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center gap-2"
  >
    <div
      className={cx(
        "rounded-sm flex items-center justify-center",
        isMobile ? "w-[54px] h-[54px]" : "w-[68px] h-[68px]"
      )}
      style={{
        border: `1.5px solid ${color}`,
        backgroundColor: `${color}12`,
      }}
    >
      <User size={isMobile ? 22 : 28} style={{ color }} strokeWidth={1.4} />
    </div>
    <span
      className={cx("font-mono font-bold text-center leading-tight mt-1", isMobile ? "text-[10px] max-w-[76px]" : "text-[12px] whitespace-nowrap")}
      style={{ color }}
    >
      {label}
    </span>
  </motion.div>
);

// ─── Node Card ──────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: WorkflowNode;
  delay: number;
  isMobile?: boolean;
}

const NodeCard = ({ node, delay, isMobile = false }: NodeCardProps) => {
  const [Icon] = node.icons;

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-16 h-16 flex items-center justify-center"
        style={{
          backgroundColor: node.bg,
          border: `1.5px dashed ${node.color}`,
        }}
      >
        {/* corner tick marks */}
        <div className="absolute -top-[5px] -left-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />
        <div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />
        <div className="absolute -bottom-[5px] -left-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />
        <div className="absolute -bottom-[5px] -right-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />

        <Icon size={24} style={{ color: node.iconColor }} strokeWidth={1.3} />

        {/* Labels on the right */}
        <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 flex flex-col items-start gap-0.5 text-left max-w-[110px] sm:max-w-none">
          <span
            className="text-[13px] font-bold tracking-tight leading-tight"
            style={{ color: node.color }}
          >
            {node.label}
          </span>
          <span
            className="text-[11px] font-semibold text-black/60 tracking-wide leading-tight max-w-[110px] sm:max-w-none"
          >
            {node.sublabel}
          </span>
        </div>
      </motion.div>
    );
  }

  // Desktop vertical layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-3"
    >
      {/* label above */}
      <span
        className="text-[15px] font-bold tracking-tight leading-none"
        style={{ color: node.color }}
      >
        {node.label}
      </span>

      {/* card */}
      <div
        className="relative w-[110px] h-[110px] flex items-center justify-center"
        style={{
          backgroundColor: node.bg,
          border: `1.5px dashed ${node.color}`,
        }}
      >
        {/* corner tick marks */}
        <div className="absolute -top-[5px] -left-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />
        <div className="absolute -top-[5px] -right-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />
        <div className="absolute -bottom-[5px] -left-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />
        <div className="absolute -bottom-[5px] -right-[5px] w-[10px] h-[10px]" style={{ border: `2px solid ${node.color}` }} />

        <Icon size={40} style={{ color: node.iconColor }} strokeWidth={1.3} />
      </div>

      {/* sublabel below */}
      <span
        className="text-[13px] font-semibold text-black/60 tracking-wide"
      >
        {node.sublabel}
      </span>
    </motion.div>
  );
};

// ─── Animated dashed SVG connector ─────────────────────────────────────────

interface ConnectorProps {
  /** positions in SVG viewBox coordinates */
  x1: number; y1: number;
  x2: number; y2: number;
  color?: string;
  delay?: number;
}

const DashedConnector = ({
  x1, y1, x2, y2,
  color = '#aaa',
  delay = 0,
}: ConnectorProps) => {
  const midX = (x1 + x2) / 2;
  const d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  return (
    <motion.path
      key={`dash-${x1}-${y1}-${x2}-${y2}`}
      d={d}
      stroke={color}
      strokeWidth={1.5}
      fill="none"
      strokeLinecap="round"
      className="workflow-flowing-path"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    />
  );
};

// ─── Animated dashed vertical SVG connector ───────────────────────────────

interface VerticalConnectorProps {
  x1: number; y1: number;
  x2: number; y2: number;
  color?: string;
  delay?: number;
}

const VerticalDashedConnector = ({
  x1, y1, x2, y2,
  color = '#aaa',
  delay = 0,
}: VerticalConnectorProps) => {
  const midY = (y1 + y2) / 2;
  const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  return (
    <motion.path
      key={`vstack-${x1}-${y1}-${x2}-${y2}`}
      d={d}
      stroke={color}
      strokeWidth={1.5}
      fill="none"
      strokeLinecap="round"
      className="workflow-flowing-path"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    />
  );
};

interface VerticalDiagramProps {
  animate: boolean;
  width: number;
}

const VerticalDiagram = ({ animate, width }: VerticalDiagramProps) => {
  const H = 820;

  // X centers aligned with columns (1/6, 1/2, 5/6)
  const xLeft = (1 / 6) * width;
  const xMid = 0.5 * width;
  const xRight = (5 / 6) * width;

  const xOutL = (1 / 6) * width;
  const xOutMid = 0.5 * width;
  const xOutR = (5 / 6) * width;

  // Y coordinates of bottom centers of input labels (lines start below text)
  const yIn = 100;

  // Node 0: top = 170px, bottom = 234px
  const yN0_top = 170;
  const yN0_bot = 234;

  // Node 1: top = 310px, bottom = 374px
  const yN1_top = 310;
  const yN1_bot = 374;

  // Node 2: top = 450px, bottom = 514px
  const yN2_top = 450;
  const yN2_bot = 514;

  // Node 3: top = 590px, bottom = 654px
  const yN3_top = 590;
  const yN3_bot = 654;

  // Outputs: top = 720px
  const yOut_top = 720;

  const d = (i: number) => 0.5 + i * 0.14;

  if (width === 0) return null;

  return (
    <svg
      width={width}
      height={H}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      overflow="visible"
    >
      {animate && (
        <>
          {/* inputs → node0 */}
          <VerticalDashedConnector x1={xLeft} y1={yIn} x2={xMid} y2={yN0_top} color="#3B82F6" delay={d(0)} />
          <VerticalDashedConnector x1={xMid} y1={yIn} x2={xMid} y2={yN0_top} color="#C2410C" delay={d(0)} />
          <VerticalDashedConnector x1={xRight} y1={yIn} x2={xMid} y2={yN0_top} color="#8B5CF6" delay={d(0)} />

          {/* node0 → node1 */}
          <VerticalDashedConnector x1={xMid} y1={yN0_bot} x2={xMid} y2={yN1_top} color="#3B82F6" delay={d(1)} />

          {/* node1 → node2 */}
          <VerticalDashedConnector x1={xMid} y1={yN1_bot} x2={xMid} y2={yN2_top} color="#C2410C" delay={d(2)} />

          {/* node2 → node3 */}
          <VerticalDashedConnector x1={xMid} y1={yN2_bot} x2={xMid} y2={yN3_top} color="#8B5CF6" delay={d(3)} />

          {/* node3 → outputs */}
          <VerticalDashedConnector x1={xMid} y1={yN3_bot} x2={xOutL} y2={yOut_top} color="#DB2777" delay={d(4)} />
          <VerticalDashedConnector x1={xMid} y1={yN3_bot} x2={xOutMid} y2={yOut_top} color="#4F46E5" delay={d(4)} />
          <VerticalDashedConnector x1={xMid} y1={yN3_bot} x2={xOutR} y2={yOut_top} color="#0D9488" delay={d(4)} />
        </>
      )}
    </svg>
  );
};

interface DiagramProps {
  animate: boolean;
  width: number;
}

const Diagram = ({ animate, width }: DiagramProps) => {
  const H = 300;
  const midY = H / 2; // 150

  const yTop = 34;
  const yMid = 150;
  const yBot = 266;

  // Left actor (width 68px, center is 0px) -> right edge is 34px
  const xActorL_edge = 34;

  // Right actor (width 68px, center is at 'width') -> left edge is width - 34px
  const xActorR_edge = width - 34;

  // Node 0 (Upload): center is 20% of width, width is 110px -> left edge is 20% - 55, right edge is 20% + 55
  const xN0_left = 0.20 * width - 55;
  const xN0_right = 0.20 * width + 55;

  // Node 1 (Review): center is 38% of width, width is 110px -> left edge is 38% - 55, right edge is 38% + 55
  const xN1_left = 0.38 * width - 55;
  const xN1_right = 0.38 * width + 55;

  // Node 2 (Editing): center is 62% of width, width is 110px -> left edge is 62% - 55, right edge is 62% + 55
  const xN2_left = 0.62 * width - 55;
  const xN2_right = 0.62 * width + 55;

  // Node 3 (QA Gate): center is 80% of width, width is 110px -> left edge is 80% - 55, right edge is 80% + 55
  const xN3_left = 0.80 * width - 55;
  const xN3_right = 0.80 * width + 55;

  const d = (i: number) => 0.5 + i * 0.14;

  if (width === 0) return null;

  return (
    <svg
      width={width}
      height={H}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      overflow="visible"
    >
      {animate && (
        <>
          {/* actor-L top (Dropbox/Drive) → node0 left edge */}
          <DashedConnector x1={xActorL_edge} y1={yTop} x2={xN0_left} y2={midY} color="#3B82F6" delay={d(0)} />
          {/* actor-L mid (Amazon/Google Drive) → node0 left edge */}
          <DashedConnector x1={xActorL_edge} y1={yMid} x2={xN0_left} y2={midY} color="#C2410C" delay={d(0)} />
          {/* actor-L bot (API/Zapier) → node0 left edge */}
          <DashedConnector x1={xActorL_edge} y1={yBot} x2={xN0_left} y2={midY} color="#8B5CF6" delay={d(0)} />

          {/* node0 → node1 */}
          <DashedConnector x1={xN0_right} y1={midY} x2={xN1_left} y2={midY} color="#3B82F6" delay={d(1)} />
          {/* node1 → node2 */}
          <DashedConnector x1={xN1_right} y1={midY} x2={xN2_left} y2={midY} color="#C2410C" delay={d(2)} />
          {/* node2 → node3 */}
          <DashedConnector x1={xN2_right} y1={midY} x2={xN3_left} y2={midY} color="#8B5CF6" delay={d(3)} />

          {/* node3 right edge → actor-R top (Dashboard) */}
          <DashedConnector x1={xN3_right} y1={midY} x2={xActorR_edge} y2={yTop} color="#DB2777" delay={d(4)} />
          {/* node3 right edge → actor-R mid (Email) */}
          <DashedConnector x1={xN3_right} y1={midY} x2={xActorR_edge} y2={yMid} color="#4F46E5" delay={d(4)} />
          {/* node3 right edge → actor-R bot (Webhook/Zapier) */}
          <DashedConnector x1={xN3_right} y1={midY} x2={xActorR_edge} y2={yBot} color="#0D9488" delay={d(4)} />
        </>
      )}
    </svg>
  );
};

interface WorkflowProps {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
  nodes?: WorkflowNode[];
  stepDescriptions?: string[];
  integrations?: string[];
  inputActors?: string[];
  outputActors?: string[];
  deliveryLabel?: string;
}

const BRAND_COLORS: Record<string, string> = {
  'Amazon': '#D97706',       // Amber/Orange
  'Google Drive': '#16A34A',  // Green
  'Dropbox': '#2563EB',       // Blue
  'WeTransfer': '#0284C7',    // Sky blue
  'App Sync': '#7C3AED',      // Purple
  'Direct Connect': '#0D9488' // Teal
};

const Workflow = ({
  eyebrow = '4-stage pipeline',
  title = <>From raw <span className="text-black/30">to ready.</span></>,
  description = 'Connect cloud storage, Dropbox, Amazon, or automated app syncs. Edited files come back the same way they went in.',
  nodes = WORKFLOW_NODES,
  stepDescriptions = WORKFLOW_STEP_DESCRIPTIONS,
  integrations = WORKFLOW_INTEGRATIONS,
  inputActors = ['Dropbox', 'Google Drive / S3', 'App Automation'],
  outputActors = ['Customer Dashboard', 'Email', 'Instant Sync Feeds'],
  deliveryLabel = 'Delivered to dashboard within your selected SLA',
}: WorkflowProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(() => typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, 1600) : 1200);
  const [mobileContainerWidth, setMobileContainerWidth] = useState(() => typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, 560) : 360);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  useEffect(() => {
    let desktopObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      desktopObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width);
        }
      });
      desktopObserver.observe(containerRef.current);
    }

    let mobileObserver: ResizeObserver | null = null;
    if (mobileContainerRef.current) {
      setMobileContainerWidth(mobileContainerRef.current.offsetWidth);
      mobileObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          setMobileContainerWidth(entries[0].contentRect.width);
        }
      });
      mobileObserver.observe(mobileContainerRef.current);
    }

    return () => {
      if (desktopObserver) desktopObserver.disconnect();
      if (mobileObserver) mobileObserver.disconnect();
    };
  }, []);

  return (
    <section
      id="workflow"
      ref={sectionRef}
      className={cx('pt-10 pb-10 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-16 bg-[#F7F6F3] sm:bg-white relative z-10 scroll-mt-nav overflow-hidden', layout.sectionGutter)}
    >
      <style>{`
        @keyframes workflow-flow {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -20;
          }
        }
        .workflow-flowing-path {
          stroke-dasharray: 6 4;
          animation: workflow-flow 1s linear infinite;
        }
      `}</style>
      <div className={cx(layout.compactShell, 'relative z-10 space-y-6 lg:space-y-8')}>

        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 25 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className={cx(typography.displayMd, "text-[var(--color-text-primary)]")}
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-[15px] sm:text-[16px] text-black/50 leading-relaxed max-w-xl mx-auto"
          >
            {description}
          </motion.p>
        </div>

        {/* ── Diagram area ── */}
        <div className="w-full">

          {/* Desktop diagram — actors fan in/out, 4 pipeline nodes */}
          <div className="hidden lg:block pt-4">
            
            {/* Swimlane Headers */}
            <div className="relative mb-8 flex items-center h-8">
              <div className="absolute z-10" style={{ left: '0%', transform: 'translateX(-50%)' }}>
                <motion.div initial={{ opacity: 0, y: 5 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1, duration: 0.4 }}>
                  <span className="inline-flex items-center text-[12px] font-bold font-mono uppercase tracking-widest text-black/50 whitespace-nowrap">
                    Your Inputs
                  </span>
                </motion.div>
              </div>
              <div className="absolute z-10" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                <motion.div initial={{ opacity: 0, y: 5 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.4 }}>
                  <span className="inline-flex items-center text-[12px] font-bold font-mono uppercase tracking-widest text-black/50 whitespace-nowrap">
                    Reframe production pipeline
                  </span>
                </motion.div>
              </div>
              <div className="absolute z-10" style={{ right: '0%', transform: 'translateX(50%)' }}>
                <motion.div initial={{ opacity: 0, y: 5 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.4 }}>
                  <span className="inline-flex items-center text-[12px] font-bold font-mono uppercase tracking-widest text-black/50 whitespace-nowrap">
                    Your Outputs
                  </span>
                </motion.div>
              </div>
            </div>

            <div ref={containerRef} className="relative" style={{ height: '300px' }}>

              {/* SVG fan connectors */}
              <Diagram animate={isInView} width={containerWidth} />

              <div className="absolute inset-0 flex items-center">

                {/* Actor Left — Dropbox/Drive (top), Amazon/Google Drive (middle), API/Zapier (bottom) */}
                <div className="absolute inset-y-0" style={{ left: '0%', transform: 'translateX(-50%)', width: '68px' }}>
                  <motion.div style={{ position: 'absolute', top: '0px', left: 0, right: 0 }} initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.3, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                    <Actor label={inputActors[0]} delay={0.3} color="#3B82F6" />
                  </motion.div>
                  <motion.div style={{ position: 'absolute', top: '116px', left: 0, right: 0 }} initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.4, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                    <Actor label={inputActors[1]} delay={0.4} color="#C2410C" />
                  </motion.div>
                  <motion.div style={{ position: 'absolute', top: '232px', left: 0, right: 0 }} initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 0.5, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                    <Actor label={inputActors[2]} delay={0.5} color="#8B5CF6" />
                  </motion.div>
                </div>

                {/* Node 0 – Upload */}
                <div className="absolute" style={{ left: '20%', transform: 'translateX(-50%)' }}>
                  <NodeCard node={nodes[0]} delay={0.5} />
                </div>

                {/* Node 1 – Review */}
                <div className="absolute" style={{ left: '38%', transform: 'translateX(-50%)' }}>
                  <NodeCard node={nodes[1]} delay={0.65} />
                </div>

                {/* Node 2 – Retouch */}
                <div className="absolute" style={{ left: '62%', transform: 'translateX(-50%)' }}>
                  <NodeCard node={nodes[2]} delay={0.8} />
                </div>

                {/* Node 3 – QA Gate */}
                <div className="absolute" style={{ left: '80%', transform: 'translateX(-50%)' }}>
                  <NodeCard node={nodes[3]} delay={0.95} />
                </div>

                {/* Actor Right — Dashboard (top), Email (middle), Webhook/Zapier (bottom) */}
                <div className="absolute inset-y-0" style={{ right: '0%', transform: 'translateX(50%)', width: '68px' }}>
                  <motion.div style={{ position: 'absolute', top: '0px', left: 0, right: 0 }} initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1.1, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                    <Actor label={outputActors[0]} delay={1.1} color="#DB2777" />
                  </motion.div>
                  <motion.div style={{ position: 'absolute', top: '116px', left: 0, right: 0 }} initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1.15, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                    <Actor label={outputActors[1]} delay={1.15} color="#4F46E5" />
                  </motion.div>
                  <motion.div style={{ position: 'absolute', top: '232px', left: 0, right: 0 }} initial={{ opacity: 0, scale: 0.85 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: 1.2, duration: 0.4, ease: [0.16,1,0.3,1] }}>
                    <Actor label={outputActors[2]} delay={1.2} color="#0D9488" />
                  </motion.div>
                </div>

              </div>
            </div>


          </div>

          {/* ── Tablet / Mobile: vertical diagram flow ── */}
          <div className="lg:hidden relative mx-auto w-full max-w-[360px] sm:max-w-[480px] md:max-w-[560px] mt-10" style={{ height: '820px' }} ref={mobileContainerRef}>
            {/* SVG connectors */}
            <VerticalDiagram animate={isInView} width={mobileContainerWidth} />

            {/* Top Label */}
            <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.1 }} className="absolute inset-x-0 -top-6 flex justify-center z-20">
              <span className="inline-flex items-center text-[11px] font-bold font-mono uppercase tracking-widest text-black/55 whitespace-nowrap bg-white px-3 relative z-20">
                Your Inputs
              </span>
            </motion.div>

            {/* Inputs row */}
            <div className="absolute top-[10px] inset-x-0 flex justify-between" style={{ height: '80px' }}>
              <div style={{ width: '33%', display: 'flex', justifyContent: 'center' }}>
                <Actor label={inputActors[0]} delay={0.3} color="#3B82F6" isMobile />
              </div>
              <div style={{ width: '33%', display: 'flex', justifyContent: 'center' }}>
                <Actor label={inputActors[1]} delay={0.4} color="#C2410C" isMobile />
              </div>
              <div style={{ width: '33%', display: 'flex', justifyContent: 'center' }}>
                <Actor label={inputActors[2]} delay={0.5} color="#8B5CF6" isMobile />
              </div>
            </div>

            {/* Node 0: Upload */}
            {/* Middle Label */}
            <div className="absolute z-20" style={{ top: '132px', left: '50%', transform: 'translateX(-50%)' }}>
              <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.4 }} className="flex justify-center z-20">
                <span className="inline-flex items-center text-[11px] font-bold font-mono uppercase tracking-widest text-black/55 whitespace-nowrap bg-white px-3 py-1 relative z-20">
                  Reframe production pipeline
                </span>
              </motion.div>
            </div>

            <div className="absolute" style={{ top: '170px', left: '50%', transform: 'translateX(-50%)' }}>
              <NodeCard node={nodes[0]} delay={0.5} isMobile />
            </div>

            {/* Node 1: Review */}
            <div className="absolute" style={{ top: '310px', left: '50%', transform: 'translateX(-50%)' }}>
              <NodeCard node={nodes[1]} delay={0.65} isMobile />
            </div>

            {/* Node 2: Retouch */}
            <div className="absolute" style={{ top: '450px', left: '50%', transform: 'translateX(-50%)' }}>
              <NodeCard node={nodes[2]} delay={0.8} isMobile />
            </div>

            {/* Node 3: QA Gate */}
            <div className="absolute" style={{ top: '590px', left: '50%', transform: 'translateX(-50%)' }}>
              <NodeCard node={nodes[3]} delay={0.95} isMobile />
            </div>

            {/* Outputs row */}
            {/* Bottom Label */}
            <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 1.0 }} className="absolute inset-x-0 z-20 flex justify-center" style={{ top: '686px' }}>
              <span className="inline-flex items-center text-[11px] font-bold font-mono uppercase tracking-widest text-black/55 whitespace-nowrap bg-white px-3 py-1 relative z-20">
                Your Outputs
              </span>
            </motion.div>

            <div className="absolute inset-x-0 flex justify-between" style={{ top: '720px', height: '80px' }}>
              <div style={{ width: '33%', display: 'flex', justifyContent: 'center' }}>
                <Actor label={outputActors[0]} delay={1.1} color="#DB2777" isMobile />
              </div>
              <div style={{ width: '33%', display: 'flex', justifyContent: 'center' }}>
                <Actor label={outputActors[1]} delay={1.15} color="#4F46E5" isMobile />
              </div>
              <div style={{ width: '33%', display: 'flex', justifyContent: 'center' }}>
                <Actor label={outputActors[2]} delay={1.2} color="#0D9488" isMobile />
              </div>
            </div>
          </div>

        </div>

        {/* Unified Delivery line */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="flex items-center justify-center gap-2 mt-10 lg:mt-16"
        >
          <Download size={15} className="text-[#047857]" strokeWidth={1.8} />
          <span className="text-[12px] lg:text-[13px] font-mono font-bold text-[#047857] tracking-wider uppercase text-center">
            {deliveryLabel}
          </span>
        </motion.div>

        {/* ── Step descriptions (cardless, left-aligned layout) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 pt-12 lg:pt-16 lg:mt-16">
          {nodes.map((node, i) => {
            const [Icon] = node.icons;
            const isLast = i === nodes.length - 1;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 8 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1 + i * 0.08, duration: 0.35 }}
                className={cx(
                  "flex gap-4 items-start",
                  !isLast && "lg:border-r lg:border-black/[0.20] lg:pr-6"
                )}
              >
                <Icon size={20} className="shrink-0 mt-0.5 sm:size-6" style={{ color: node.iconColor }} strokeWidth={1.5} />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] sm:text-[11px] font-mono font-bold tracking-widest text-black/45 uppercase mb-1">
                    {`0${i + 1}`} · {node.label}
                  </span>
                  <p className="text-[14px] sm:text-[14px] text-black/70 leading-relaxed font-medium">
                    {stepDescriptions[i]}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Integration badges — below everything ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-12 sm:gap-y-6 mt-10 sm:mt-16 lg:mt-24 pt-8"
        >
          {integrations.map((label) => {
            const isHovered = hoveredBadge === label;
            const brandColor = BRAND_COLORS[label] || '#666';
            return (
              <span
                key={label}
                onMouseEnter={() => setHoveredBadge(label)}
                onMouseLeave={() => setHoveredBadge(null)}
                className="inline-flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-[11px] font-bold font-mono uppercase tracking-widest transition-all duration-300 cursor-default"
                style={{
                  color: isHovered ? brandColor : 'rgba(0, 0, 0, 0.55)',
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isHovered ? brandColor : 'rgba(0, 0, 0, 0.25)',
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isHovered ? `0 0 8px ${brandColor}` : 'none',
                  }}
                />
                {label}
              </span>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
};

export default Workflow;
