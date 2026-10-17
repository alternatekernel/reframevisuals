import React, { useState, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import {
  Search,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  MousePointer,
  Tag,
  FormInput,
  SquareCheck,
  LayoutGrid,
  Maximize2,
  Navigation as NavIcon,
  Bell,
  Table as TableIcon,
  Eye,
  ArrowRight,
  ShieldCheck,
  Download,
  Send,
  Zap,
  TrendingUp,
  User,
  ExternalLink,
  Layout,
} from "lucide-react"

// Import Mother Components directly from single source of truth
import {
  Button,
  ButtonWithIcon,
  Badge,
  Input,
  TextArea,
  Select,
  Checkbox,
  Switch,
  Radio,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Drawer,
  Tabs,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Tooltip,
  Avatar,
  AvatarGroup,
  Alert,
  Skeleton,
  ProgressBar,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  BeforeAfterSlider,
  StatWidget,
  Breadcrumbs,
  designTokens,
} from "../components/ui"

// Predefined Brand Color Swatches for the Live Token Controller
const BRAND_PRESETS = [
  { name: "Onyx Black", hex: "#0A0A0B", rgb: "10, 10, 11" },
  { name: "Vibrant Violet", hex: "#7C3AED", rgb: "124, 58, 237" },
  { name: "Electric Blue", hex: "#2563EB", rgb: "37, 99, 235" },
  { name: "Emerald Green", hex: "#16A34A", rgb: "22, 163, 74" },
  { name: "Obsidian Rose", hex: "#E11D48", rgb: "225, 29, 72" },
]

// Section pattern groups — maps site sections to their mother component dependencies
const SECTION_GROUPS = [
  {
    name: "Hero Patterns",
    accentHex: "#EA580C",
    count: 7,
    files: ["Hero.tsx", "ServicesHero.tsx", "ServiceHero.tsx", "AboutHero.tsx", "PricingHero.tsx", "BlogHero.tsx", "PortfolioHero.tsx"],
    pages: "Home, Services, Service Detail, About, Pricing, Blog, Portfolio",
    motherComponents: [
      { label: "Button",         anchor: "buttons" },
      { label: "ButtonWithIcon", anchor: "buttons" },
      { label: "Badge",          anchor: "badges"  },
    ],
  },
  {
    name: "CTA Patterns",
    accentHex: "#0284C7",
    count: 6,
    files: ["TrialAuditCta.tsx", "ServicesCTA.tsx", "ServiceFinalCTA.tsx", "AboutCTA.tsx", "BlogCTA.tsx", "PricingCTA.tsx"],
    pages: "All public pages",
    motherComponents: [
      { label: "Button",         anchor: "buttons" },
      { label: "ButtonWithIcon", anchor: "buttons" },
    ],
  },
  {
    name: "FAQ Patterns",
    accentHex: "#16A34A",
    count: 4,
    files: ["Faq.tsx", "AboutFAQ.tsx", "ServiceFaq.tsx", "PricingFaq.tsx"],
    pages: "Home, Services, About, Pricing",
    motherComponents: [
      { label: "Accordion",        anchor: "platform" },
      { label: "AccordionItem",    anchor: "platform" },
      { label: "AccordionTrigger", anchor: "platform" },
      { label: "Card",             anchor: "cards"    },
    ],
  },
  {
    name: "Social Proof",
    accentHex: "#7C3AED",
    count: 4,
    files: ["Testimonials.tsx", "Stats.tsx", "TargetAudienceProof.tsx", "ClientCategoryStrip.tsx"],
    pages: "Home, About, Services, Pricing",
    motherComponents: [
      { label: "StatWidget", anchor: "data"   },
      { label: "Card",       anchor: "cards"  },
      { label: "Avatar",     anchor: "data"   },
    ],
  },
  {
    name: "Content + Feature Grid",
    accentHex: "#C2410C",
    count: 4,
    files: ["ServiceCapabilities.tsx", "ServiceProcessSteps.tsx", "Workflow.tsx", "AboutExpertise.tsx"],
    pages: "Services, About, How It Works",
    motherComponents: [
      { label: "Card",              anchor: "cards"    },
      { label: "Badge",             anchor: "badges"   },
      { label: "BeforeAfterSlider", anchor: "platform" },
    ],
  },
  {
    name: "Pricing & Conversion",
    accentHex: "#0369A1",
    count: 4,
    files: ["Pricing.tsx", "PricingTable.tsx", "PricingBundles.tsx", "ServicePricingBox.tsx"],
    pages: "Pricing, Service Detail",
    motherComponents: [
      { label: "Card",   anchor: "cards"   },
      { label: "Button", anchor: "buttons" },
      { label: "Badge",  anchor: "badges"  },
    ],
  },
  {
    name: "Content Discovery",
    accentHex: "#15803D",
    count: 3,
    files: ["BlogPreview.tsx", "ServiceRelatedGuides.tsx", "Integrations.tsx"],
    pages: "Home, Blog, Services",
    motherComponents: [
      { label: "Card",   anchor: "cards"   },
      { label: "Badge",  anchor: "badges"  },
      { label: "Button", anchor: "buttons" },
    ],
  },
  {
    name: "Utility Strips",
    accentHex: "#6D28D9",
    count: 5,
    files: ["BeatPixelzBanner.tsx", "Ticker.tsx", "PreFooter.tsx", "CompetitorComparison.tsx", "AIProductShowcase.tsx"],
    pages: "Home, About, Pricing",
    motherComponents: [
      { label: "Badge",      anchor: "badges"  },
      { label: "Button",     anchor: "buttons" },
      { label: "StatWidget", anchor: "data"    },
    ],
  },
]

// Navigation menu items for the design system explorer
const SECTIONS = [
  { id: "tokens", title: "Tokens & Foundations", icon: <Layers className="h-4 w-4" /> },
  { id: "buttons", title: "Actions & Buttons", icon: <MousePointer className="h-4 w-4" /> },
  { id: "badges", title: "Badges & Pills", icon: <Tag className="h-4 w-4" /> },
  { id: "forms", title: "Form Controls", icon: <FormInput className="h-4 w-4" /> },
  { id: "toggles", title: "Toggles & Selection", icon: <SquareCheck className="h-4 w-4" /> },
  { id: "cards", title: "Cards & Surfaces", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "overlays", title: "Modals & Drawers", icon: <Maximize2 className="h-4 w-4" /> },
  { id: "navigation", title: "Navigation & Tabs", icon: <NavIcon className="h-4 w-4" /> },
  { id: "feedback", title: "Feedback & Alerts", icon: <Bell className="h-4 w-4" /> },
  { id: "data", title: "Data Display & Tables", icon: <TableIcon className="h-4 w-4" /> },
  { id: "platform", title: "Platform Specials", icon: <Eye className="h-4 w-4" /> },
  { id: "sections", title: "Site Sections Architecture", icon: <Layout className="h-4 w-4" /> },
]

export default function DesignSystemPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Live Token State
  const [currentBrand, setCurrentBrand] = useState(BRAND_PRESETS[0])
  const [currentRadius, setCurrentRadius] = useState<"standard" | "tight" | "rounded" | "pill">("standard")

  // Interactive Component Demo State
  const [btnLoading, setBtnLoading] = useState(false)
  const [switchActive, setSwitchActive] = useState(true)
  const [checkboxActive, setCheckboxActive] = useState(true)
  const [radioVal, setRadioVal] = useState("ecommerce")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [inputVal, setInputVal] = useState("Reframe Studios Inc.")

  // Apply Live Tokens to document root dynamically
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--brand", currentBrand.hex)
    root.style.setProperty("--brand-rgb", currentBrand.rgb)

    if (currentRadius === "tight") {
      root.style.setProperty("--radius-sm", "3px")
      root.style.setProperty("--radius-md", "6px")
      root.style.setProperty("--radius-lg", "10px")
      root.style.setProperty("--radius-xl", "14px")
    } else if (currentRadius === "rounded") {
      root.style.setProperty("--radius-sm", "8px")
      root.style.setProperty("--radius-md", "14px")
      root.style.setProperty("--radius-lg", "22px")
      root.style.setProperty("--radius-xl", "32px")
    } else if (currentRadius === "pill") {
      root.style.setProperty("--radius-sm", "9999px")
      root.style.setProperty("--radius-md", "9999px")
      root.style.setProperty("--radius-lg", "9999px")
      root.style.setProperty("--radius-xl", "9999px")
    } else {
      // standard
      root.style.setProperty("--radius-sm", "6px")
      root.style.setProperty("--radius-md", "10px")
      root.style.setProperty("--radius-lg", "16px")
      root.style.setProperty("--radius-xl", "24px")
    }
  }, [currentBrand, currentRadius])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const resetTokens = () => {
    setCurrentBrand(BRAND_PRESETS[0])
    setCurrentRadius("standard")
  }

  const filteredSections = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-[var(--surface,#FFFFFF)] text-[var(--color-text-primary,#0A0A0B)] selection:bg-[var(--brand,#0A0A0B)] selection:text-white pb-28">
      <Helmet>
        <title>Design System & Mother Components | Reframe Visuals</title>
        <meta
          name="description"
          content="The living design system and single source of truth for all mother and child components powering the Reframe Visuals platform."
        />
      </Helmet>

      {/* ─── Hero Header & Overview ─── */}
      <section className="relative border-b border-black/[0.14] bg-gradient-to-b from-black/[0.02] to-transparent pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.18] bg-white px-3.5 py-1 text-[12px] font-semibold shadow-sm mb-5">
                <span className="h-2 w-2 rounded-full bg-[var(--brand,#0A0A0B)] animate-pulse" />
                <span>Single Source of Truth</span>
                <span className="text-black/30">·</span>
                <span className="text-black/60">Version 2.0.0</span>
              </div>

              <h1 className="font-heading text-[36px] sm:text-[48px] lg:text-[60px] font-bold tracking-[-0.05em] leading-[1.05] text-[var(--color-text-primary,#0A0A0B)]">
                Platform Design System
              </h1>
              <p className="mt-4 text-[16px] sm:text-[18px] text-black/65 leading-relaxed max-w-2xl">
                The centralized mother component library and token architecture for Reframe Visuals.
                Modifying any mother component here instantly cascades across all platform pages,
                customer dashboards, and admin views.
              </p>
            </div>

            {/* Quick stats badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-black/[0.18] bg-white px-4 py-3 shadow-sm text-left">
                <div className="text-[12px] font-bold uppercase tracking-wider text-black/45">Mother Components</div>
                <div className="font-heading text-[22px] font-bold text-[var(--color-text-primary,#0A0A0B)]">29+ Components</div>
              </div>
              <div className="rounded-2xl border border-black/[0.18] bg-white px-4 py-3 shadow-sm text-left">
                <div className="text-[12px] font-bold uppercase tracking-wider text-black/45">Accessibility</div>
                <div className="font-heading text-[22px] font-bold text-emerald-600">WCAG 2.1 AA</div>
              </div>
              <div className="rounded-2xl border border-black/[0.18] bg-white px-4 py-3 shadow-sm text-left">
                <div className="text-[12px] font-bold uppercase tracking-wider text-black/45">Framework</div>
                <div className="font-heading text-[22px] font-bold text-[var(--brand,#0A0A0B)]">Tailwind + Radix</div>
              </div>
            </div>
          </div>

          {/* ─── LIVE GLOBAL TOKEN CUSTOMIZER TOOLBAR ─── */}
          <div className="mt-10 rounded-2xl border border-black/[0.18] bg-white p-5 sm:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.10)] text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-black/[0.20] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand,#0A0A0B)]/10 text-[var(--brand,#0A0A0B)]">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-[16px] font-semibold text-[var(--color-text-primary,#0A0A0B)]">
                    Live Mother Token Controller
                  </h3>
                  <p className="text-[14px] text-black/55">
                    Adjust variables below to see instantaneous changes cascade across all components.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={resetTokens}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Reset Defaults
              </Button>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Brand Color Presets */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-black/50">
                  Primary Brand Accent
                </label>
                <div className="flex items-center gap-2">
                  {BRAND_PRESETS.map((preset) => {
                    const isSelected = currentBrand.hex === preset.hex
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setCurrentBrand(preset)}
                        title={preset.name}
                        className={`relative h-9 w-9 rounded-full border-2 transition-transform duration-150 ${
                          isSelected ? "scale-110 border-black shadow-md ring-2 ring-black/20" : "border-white hover:scale-105"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      >
                        {isSelected && <Check className="absolute inset-0 m-auto h-4 w-4 text-white stroke-[3]" />}
                      </button>
                    )
                  })}
                  <span className="ml-2 font-mono text-[14px] text-black/60 font-semibold">
                    {currentBrand.hex}
                  </span>
                </div>
              </div>

              {/* Radius Scale */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-black/50">
                  Border Radius Profile
                </label>
                <div className="inline-flex rounded-xl bg-black/[0.05] p-1 border border-black/[0.18]">
                  {(["tight", "standard", "rounded", "pill"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCurrentRadius(r)}
                      className={`px-3 py-1.5 text-[12px] font-semibold capitalize rounded-lg transition-colors ${
                        currentRadius === r ? "bg-white text-black shadow-sm" : "text-black/60 hover:text-black"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active CSS Variable Output */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-black/50">
                  Active Injected Variables
                </label>
                <div className="rounded-xl bg-black/[0.05] border border-black/[0.14] px-3.5 py-2 font-mono text-[12px] text-black/70 flex items-center justify-between">
                  <span>--brand: {currentBrand.hex}</span>
                  <span className="text-emerald-600 font-semibold">● Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Explorer Layout ─── */}
      <div className="max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-12 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          {/* ─── Sticky Sidebar Navigation ─── */}
          <aside className="sticky top-20 hidden lg:block rounded-2xl border border-black/[0.18] bg-white p-4 shadow-sm text-left max-h-[calc(100vh-6rem)] overflow-y-auto">
            {/* Search Filter */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/[0.18] bg-black/[0.04] pl-9 pr-3 py-2 text-[14px] text-black outline-none placeholder:text-black/40 focus:border-black/40 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              {filteredSections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="group flex items-center justify-between rounded-xl px-3 py-2 text-[13.5px] font-medium text-black/65 transition-colors hover:bg-black/[0.04] hover:text-black"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-black/40 group-hover:text-[var(--brand,#0A0A0B)] transition-colors">
                      {sec.icon}
                    </span>
                    <span>{sec.title}</span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-6 border-t border-black/[0.14] pt-4">
              <div className="rounded-xl bg-[var(--brand,#0A0A0B)]/8 border border-[var(--brand,#0A0A0B)]/20 p-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  Developer Quickstart
                </div>
                <code className="mt-1 block font-mono text-[12px] text-black/75 break-all">
                  import &#123; Button &#125; from '@/components/ui';
                </code>
              </div>
            </div>
          </aside>

          {/* ─── Component Sections ─── */}
          <main className="space-y-16 text-left">
            {/* The Essential 10 Architecture Banner */}
            <div className="rounded-2xl border border-black/[0.18] bg-gradient-to-r from-black/[0.03] to-transparent p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                    Single-Page Quick Reference Architecture
                  </div>
                  <h3 className="font-heading text-[18px] sm:text-[20px] font-semibold text-[var(--color-text-primary,#0A0A0B)]">
                    The Essential 10 Mother Components Checklist
                  </h3>
                </div>
                <Badge variant="success" dot dotColor="#16A34A">100% Implemented & Standardized</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-[12.5px]">
                {[
                  { name: "1. Button", file: "button.tsx", desc: "Primary, secondary, text, states" },
                  { name: "2. Input Field", file: "input.tsx", desc: "Labels, errors, icons, clear" },
                  { name: "3. Card", file: "card.tsx", desc: "Default, elevated, hover lift" },
                  { name: "4. Typography", file: "tokens.ts", desc: "7 hierarchy steps, 2 fonts max" },
                  { name: "5. Icon", file: "Lucide/Huge", desc: "Consistent stroke & optical scale" },
                  { name: "6. Link", file: "button.tsx", desc: "Inline and standalone variants" },
                  { name: "7. Check/Radio", file: "checkbox.tsx", desc: "Checkboxes, toggles, radios" },
                  { name: "8. Dropdown", file: "input.tsx", desc: "Standardized select control" },
                  { name: "9. Alert/Toast", file: "alert.tsx", desc: "5 semantic alert banners" },
                  { name: "10. Modal", file: "modal.tsx", desc: "Overlays, dialogs & drawers" },
                ].map((item) => (
                  <div key={item.name} className="rounded-xl border border-black/[0.14] bg-white p-2.5 shadow-xs">
                    <div className="font-bold text-black flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-[var(--brand,#0A0A0B)]">{item.file}</div>
                    <div className="text-[12px] text-black/50 truncate mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 1. FOUNDATIONS & TOKENS */}
            <section id="tokens" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>01. Core Foundations</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Design Tokens & Color Palette
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  System colors, contrast values, and font metrics established across the entire platform.
                </p>
              </div>

              {/* Color Swatches Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "Brand Primary", hex: currentBrand.hex, var: "--brand", role: "Key action, accents, highlights" },
                  { name: "Brand Secondary", hex: "#D1E9FF", var: "--brand-secondary", role: "Active states, selected items, UI highlights" },
                  { name: "Onyx Dark", hex: "#0A0A0B", var: "--onyx", role: "Primary headings, dark buttons, text" },
                  { name: "Surface Crisp", hex: "#FFFFFF", var: "--surface", role: "Base application surface & cards" },
                  { name: "Surface Muted", hex: "#F8F9FD", var: "--color-bg-secondary", role: "Secondary backgrounds, strips" },
                  { name: "Foundation Cat", hex: "#EA580C", var: "--cat-foundation", role: "Background removal, clipping" },
                  { name: "Enhancement Cat", hex: "#0284C7", var: "--cat-enhancement", role: "Shadows, color corrections" },
                  { name: "Retouch Cat", hex: "#16A34A", var: "--cat-retouch", role: "High-end skin, jewelry retouch" },
                  { name: "Advanced Cat", hex: "#7C3AED", var: "--cat-advanced", role: "Ghost mannequin, AI composite" },
                ].map((swatch) => (
                  <div
                    key={swatch.name}
                    className="overflow-hidden rounded-2xl border border-black/[0.18] bg-white p-3 shadow-sm text-left transition-all hover:shadow-md"
                  >
                    <div
                      className="h-16 w-full rounded-xl border border-black/[0.18]"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="mt-3">
                      <div className="text-[14px] font-bold text-black">{swatch.name}</div>
                      <div className="mt-0.5 flex items-center justify-between font-mono text-[12px] text-black/50">
                        <span>{swatch.hex}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(swatch.hex, swatch.name)}
                          className="hover:text-black"
                          title="Copy Hex"
                        >
                          {copiedKey === swatch.name ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="mt-1 text-[12px] text-[#737373] truncate">{swatch.role}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Typography Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Typography Scale Hierarchy (Space Grotesk + Satoshi)</CardTitle>
                  <CardDescription>
                    Strict 7-tier scale with two fonts maximum: Space Grotesk for geometric display headings and Satoshi for high-legibility body prose.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px]" style={{ tableLayout: "fixed" }}>
                      <colgroup>
                        <col style={{ width: "72px" }} />
                        <col style={{ width: "160px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "200px" }} />
                        <col />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-black/[0.18] text-[#737373] font-mono text-[10.5px] uppercase tracking-wider">
                          <th className="pb-2 font-semibold">Role</th>
                          <th className="pb-2 font-semibold">Size / Weight</th>
                          <th className="pb-2 font-semibold">Leading</th>
                          <th className="pb-2 font-semibold">Usage</th>
                          <th className="pb-2 font-semibold">Live Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.12]">
                        {[
                          { role: "Display", spec: "48px / 700", lead: "1.05", usage: "Hero titles", preview: <span className="font-heading text-[18px] font-bold leading-tight">Catalog Editing</span> },
                          { role: "H1",      spec: "32px / 700", lead: "1.15", usage: "Major headings", preview: <span className="font-heading text-[16px] font-bold">12h Turnaround</span> },
                          { role: "H2",      spec: "24px / 600", lead: "1.2",  usage: "Card titles", preview: <span className="font-heading text-[15px] font-semibold">Ghost Mannequin</span> },
                          { role: "H3",      spec: "20px / 600", lead: "1.25", usage: "Modal titles", preview: <span className="font-heading text-[14px] font-semibold">Clipping Path</span> },
                          { role: "Body",    spec: "16px / 400", lead: "1.6",  usage: "Reading copy", preview: <span className="text-[14px] text-[#404040]">Pen tool paths at 300% zoom.</span> },
                          { role: "Small",   spec: "15px / 400", lead: "1.5",  usage: "Helper hints", preview: <span className="text-[14px] text-[#595959]">Replies within 30 min.</span> },
                          { role: "Caption", spec: "13px / 500", lead: "1.4",  usage: "Labels, badges", preview: <span className="text-[13px] font-medium tracking-wide text-[#737373] uppercase">SLA 12H</span> },
                        ].map(({ role, spec, lead, usage, preview }) => (
                          <tr key={role}>
                            <td className="py-2.5 font-bold text-[#0A0A0B]">{role}</td>
                            <td className="font-mono text-[12px] text-[#595959]">{spec}</td>
                            <td className="font-mono text-[12px] text-[#595959]">{lead}</td>
                            <td className="text-[12px] text-[#737373]">{usage}</td>
                            <td className="py-2">{preview}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Spacing Scale Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Spacing Scale (Strict 4px / 8px Grid)</CardTitle>
                  <CardDescription>
                    No arbitrary pixels (no 13px, no 27px). Consistent spacing creates visual rhythm and interface polish.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { size: "4px", name: "Tight Spacing", role: "Icon to text, compact badge padding", barWidth: "w-4" },
                      { size: "8px", name: "Close Spacing", role: "Form label to input, gap in chips", barWidth: "w-8" },
                      { size: "16px", name: "Default Spacing", role: "Between elements inside cards", barWidth: "w-16" },
                      { size: "24px", name: "Comfortable Spacing", role: "Between subsections & cards", barWidth: "w-24" },
                      { size: "32px", name: "Loose Spacing", role: "Between major section blocks", barWidth: "w-32" },
                      { size: "48px", name: "Generous Spacing", role: "Page margins & section padding", barWidth: "w-48" },
                    ].map((space) => (
                      <div key={space.size} className="rounded-xl border border-black/[0.14] bg-black/[0.04] p-3 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[14px] font-bold text-[var(--brand,#0A0A0B)]">{space.size}</span>
                          <span className="text-[12px] font-semibold text-black/70">{space.name}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--brand,#0A0A0B)]/30 overflow-hidden mb-2">
                          <div className={`h-full bg-[var(--brand,#0A0A0B)] ${space.barWidth}`} />
                        </div>
                        <p className="text-[11.5px] text-black/55 leading-tight">{space.role}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 2. ACTIONS & BUTTONS */}
            <section id="buttons" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>02. Actions & Interaction</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Button Mother Component
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Standardized action buttons with variants, sizes, icon anchors, and active loading spinners.
                </p>
              </div>

              {/* Variant grid */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Button Variants</CardTitle>
                      <CardDescription>10 variants via <code className="rounded bg-black/[0.06] px-1.5 py-0.5 font-mono text-[12px]">variant="…"</code> — all share the same size, shape and loading props.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setBtnLoading((prev) => !prev)}>
                      {btnLoading ? "Stop Spinner" : "Test Loading State"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-7">

                  {/* Filled group */}
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-3">Filled — high emphasis</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {([
                        { v: "default",     label: "Default (Onyx)", desc: "Primary action" },
                        { v: "brand",       label: "Brand Token",    desc: "Live ↕ token controller" },
                        { v: "destructive", label: "Destructive",    desc: "Delete / remove" },
                        { v: "success",     label: "Success",        desc: "Confirm / complete" },
                      ] as const).map(({ v, label, desc }) => (
                        <div key={v} className="flex flex-col items-start gap-2">
                          <Button variant={v} loading={btnLoading} className="w-full justify-center">{label}</Button>
                          <span className="text-[11.5px] text-[#737373]">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outlined / surface group */}
                  <div className="border-t border-black/[0.14] pt-6">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-3">Outlined / surface — medium emphasis</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {([
                        { v: "brandWhite", label: "Brand White",  desc: "Inverted CTA on dark bg" },
                        { v: "white",      label: "White",        desc: "Elevated surface pill" },
                        { v: "secondary",  label: "Secondary",    desc: "Supporting action" },
                        { v: "outline",    label: "Outline",      desc: "Tertiary / filter" },
                      ] as const).map(({ v, label, desc }) => (
                        <div key={v} className="flex flex-col items-start gap-2">
                          <Button variant={v} loading={btnLoading} className="w-full justify-center">{label}</Button>
                          <span className="text-[11.5px] text-[#737373]">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ghost / text group */}
                  <div className="border-t border-black/[0.14] pt-6">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-3">Ghost / text — low emphasis</div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex flex-col items-start gap-2">
                        <Button variant="ghost" loading={btnLoading}>Ghost</Button>
                        <span className="text-[11.5px] text-[#737373]">Dismiss / cancel</span>
                      </div>
                      <div className="flex flex-col items-start gap-2">
                        <Button variant="link">Link Button</Button>
                        <span className="text-[11.5px] text-[#737373]">Inline contextual</span>
                      </div>
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="border-t border-black/[0.14] pt-6">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-3">Size Scale — xs · sm · default · lg · icon</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="xs"      variant="default">XS</Button>
                      <Button size="sm"      variant="default">Small (sm)</Button>
                      <Button size="default" variant="default">Default (md)</Button>
                      <Button size="lg"      variant="default">Large (lg)</Button>
                      <Button size="icon"    variant="default" aria-label="Quick Action"><Zap className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {/* Icons & composites */}
                  <div className="border-t border-black/[0.14] pt-6">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373] mb-3">Icons & Composites</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button leftIcon={<Send className="h-4 w-4" />}>Send Order</Button>
                      <Button variant="brand" rightIcon={<ArrowRight className="h-4 w-4" />}>Get 3 Free Edits</Button>
                      <ButtonWithIcon label="Start Free Trial" />
                      <Button variant="success" leftIcon={<Check className="h-4 w-4" />}>Order Confirmed</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* States + Usage rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Interactive States</CardTitle>
                    <CardDescription>Every variant exposes all 6 states; apply them consistently.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {[
                      { label: "1. Default",        btn: <Button size="sm" variant="default">Default</Button> },
                      { label: "2. Hover (simulated)", btn: <Button size="sm" variant="default" className="!bg-[#1a1a1b] !shadow-[0_8px_24px_rgba(0,0,0,0.20)]">Hovered</Button> },
                      { label: "3. Pressed (scale 0.98)", btn: <Button size="sm" variant="default" className="scale-[0.98]">Pressed</Button> },
                      { label: "4. Focus ring",     btn: <Button size="sm" variant="outline" className="ring-2 ring-black/25 ring-offset-2">Focused</Button> },
                      { label: "5. Loading",        btn: <Button size="sm" variant="brand" loading>Processing</Button> },
                      { label: "6. Disabled (0.45 opacity)", btn: <Button size="sm" variant="default" disabled>Unavailable</Button> },
                    ].map(({ label, btn }) => (
                      <div key={label} className="flex items-center justify-between rounded-xl bg-black/[0.04] px-3 py-2 text-[12.5px]">
                        <span className="font-medium text-[#595959]">{label}</span>
                        {btn}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hierarchy Rules</CardTitle>
                    <CardDescription>Strictly one filled CTA per screen; support with outlined and ghost.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-[14px]">
                    <div className="rounded-xl border-l-[3px] border-emerald-500 bg-emerald-50 p-3">
                      <div className="font-semibold text-emerald-800 mb-0.5">Primary — one per screen</div>
                      <p className="text-emerald-900/75 leading-relaxed text-[12.5px]">The single highest-priority action: "Start Free Trial", "Submit Order", "Confirm Payment".</p>
                    </div>
                    <div className="rounded-xl border-l-[3px] border-blue-400 bg-blue-50 p-3">
                      <div className="font-semibold text-blue-800 mb-0.5">Secondary — supporting action</div>
                      <p className="text-blue-900/75 leading-relaxed text-[12.5px]">Alongside the primary: "View Pricing", "Download Specs", "Learn More".</p>
                    </div>
                    <div className="rounded-xl border-l-[3px] border-black/30 bg-black/[0.04] p-3">
                      <div className="font-semibold text-black/75 mb-0.5">Tertiary — ghost / link</div>
                      <p className="text-black/55 leading-relaxed text-[12.5px]">Dismiss, cancel, and inline navigation; zero visual weight to avoid competing with the CTA.</p>
                    </div>
                    <div className="rounded-xl border-l-[3px] border-rose-400 bg-rose-50 p-3">
                      <div className="font-semibold text-rose-800 mb-0.5">Destructive — confirm first</div>
                      <p className="text-rose-900/75 leading-relaxed text-[12.5px]">Always behind a confirmation dialog. Never the default action in a form submission.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 3. BADGES & PILLS */}
            <section id="badges" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>03. Status & Tags</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Badges, Tags & Category Indicators
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Status capsules, category tags, and real-time live pulse dot indicators.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Badge Variants & Category Pills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Pills */}
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">
                      Service Category Signature Pills
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="catFoundation" size="default">Foundation (Clipping)</Badge>
                      <Badge variant="catEnhancement" size="default">Enhancement (Lighting)</Badge>
                      <Badge variant="catRetouch" size="default">Retouch (Skin / Jewelry)</Badge>
                      <Badge variant="catAdvanced" size="default">Advanced (Mannequin / 3D)</Badge>
                    </div>
                  </div>

                  {/* Status Badges with Live Dots */}
                  <div className="border-t border-black/[0.14] pt-5">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">
                      Status & Indicator Dots
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="success" dot pulse dotColor="#16A34A">
                        Production Live (12h SLA)
                      </Badge>
                      <Badge variant="warning" dot dotColor="#D97706">
                        In QA Review
                      </Badge>
                      <Badge variant="destructive" dot dotColor="#DC2626">
                        Needs Revision
                      </Badge>
                      <Badge variant="brand" dot pulse>
                        New Release
                      </Badge>
                      <Badge variant="subtle">
                        Subtle Brand Tag
                      </Badge>
                      <Badge variant="secondary" onDismiss={() => alert("Dismissed tag!")}>
                        Dismissible Filter
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 4. FORM CONTROLS & INPUTS */}
            <section id="forms" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>04. User Input</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Form Controls & Inputs
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Standardized text fields, selects, textareas with helper text and validation states.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Text Inputs, Selects & Textareas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="Company Name"
                      placeholder="e.g. Acme Apparel"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      clearable
                      onClear={() => setInputVal("")}
                      helperText="Official trading name for your invoicing."
                    />

                    <Input
                      label="Email Address (with Icon)"
                      type="email"
                      placeholder="editor@reframevisuals.com"
                      leftIcon={<User className="h-4 w-4" />}
                      helperText="Where turnaround notifications will be sent."
                    />

                    <Input
                      label="Pill Shaped Input (Landing Search / Subscribe)"
                      shape="pill"
                      placeholder="Search 1,200+ product editing guides..."
                      leftIcon={<Search className="h-4 w-4" />}
                    />

                    <Input
                      label="Error State Input"
                      defaultValue="invalid-ftp-credentials"
                      error="Server host cannot be reached. Check port 22."
                    />

                    <Select
                      label="Delivery SLA Tier"
                      options={[
                        { value: "12h", label: "Express 12 Hours (Standard)" },
                        { value: "24h", label: "Economy 24 Hours (-15%)" },
                        { value: "6h", label: "Rush 6 Hours (+30%)" },
                      ]}
                      helperText="Guaranteed turnaround from upload receipt."
                    />

                    <Select
                      label="Target Platform Format"
                      options={[
                        { value: "shopify", label: "Shopify (2048x2048 White BG)" },
                        { value: "amazon", label: "Amazon Compliant (Pure 255 White)" },
                        { value: "transparent", label: "PNG Transparent (Alpha Channel)" },
                      ]}
                    />
                  </div>

                  <div>
                    <TextArea
                      label="Batch Editing Instructions"
                      placeholder="Describe specific clipping tolerance, margin offsets, shadow density..."
                      rows={3}
                      showCount
                      maxLength={300}
                      defaultValue="Leave 8% padding on all sides. Preserve soft cast shadow beneath the leather sneakers."
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 5. TOGGLES & SELECTION */}
            <section id="toggles" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>05. Toggles & Selection</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Switches, Checkboxes & Radio Sets
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Binary and group selection mother components for settings, filters, and order options.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Toggles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Switches */}
                    <div className="space-y-4">
                      <div className="text-[12px] font-bold uppercase tracking-wider text-black/50">
                        Toggle Switches
                      </div>
                      <Switch
                        checked={switchActive}
                        onCheckedChange={setSwitchActive}
                        label="Automated Two-Stage QA Review"
                        description="Every image is reviewed by a Senior Art Director prior to handoff."
                      />
                      <Switch
                        checked={true}
                        disabled
                        label="Permanent NDA & IP Security"
                        description="Strict intellectual property protection enforced on all batches."
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4">
                      <div className="text-[12px] font-bold uppercase tracking-wider text-black/50">
                        Checkboxes
                      </div>
                      <Checkbox
                        checked={checkboxActive}
                        onCheckedChange={setCheckboxActive}
                        label="Include Layered PSD / TIFF Master Files"
                        description="Export pen-tool vector paths with transparent background layers."
                      />
                      <Checkbox
                        indeterminate
                        label="High-Resolution Retouch Batch (Partially Selected)"
                        description="3 of 6 sub-criteria selected."
                      />
                    </div>
                  </div>

                  {/* Radio Group */}
                  <div className="border-t border-black/[0.14] pt-5">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">
                      Radio Group
                    </div>
                    <div className="flex flex-wrap gap-6">
                      <Radio
                        name="plan"
                        value="ecommerce"
                        checked={radioVal === "ecommerce"}
                        onChange={setRadioVal}
                        label="Ecommerce Catalog Plan"
                        description="From $0.39/image with volume tiers"
                      />
                      <Radio
                        name="plan"
                        value="studio"
                        checked={radioVal === "studio"}
                        onChange={setRadioVal}
                        label="Dedicated Retouching Pod"
                        description="Full-time allocated retouching artists"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 6. CARDS & SURFACES */}
            <section id="cards" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>06. Surfaces & Containers</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Card Mother Components
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Elevation styles, interactive hover lift cards, and dark surface variants.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <Card variant="default">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">Default Elevation</Badge>
                    <CardTitle>Standard Surface</CardTitle>
                    <CardDescription>Clean border with low elevation shadow for general content.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[14px] text-black/60">Ideal for dashboard widgets, articles, and data sections.</p>
                  </CardContent>
                </Card>

                <Card variant="interactive">
                  <CardHeader>
                    <Badge variant="brand" className="w-fit mb-2">Hover Lift</Badge>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>Hover over this card to observe tactile lift and shadow bloom.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[14px] text-black/60">Used for service offerings, case studies, and clickable items.</p>
                  </CardContent>
                  <CardFooter>
                    <span className="text-[14px] font-semibold text-[var(--brand,#0A0A0B)] flex items-center gap-1">
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardFooter>
                </Card>

                <Card variant="dark">
                  <CardHeader>
                    <Badge variant="white" className="w-fit mb-2">Dark Inverted</Badge>
                    <CardTitle className="text-white">Onyx Dark Surface</CardTitle>
                    <CardDescription className="text-white/60">Rich obsidian background with subtle white border.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[14px] text-white/60">Used for conversion cards, CTA strips, and code blocks.</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 7. OVERLAYS & MODALS */}
            <section id="overlays" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>07. Overlays & Dialogs</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Modals, Drawers & Tooltips
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Focus-managed dialogs, side sheet drawers, and position-anchored hover tooltips.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Interactive Overlays Testbed</CardTitle>
                  <CardDescription>Click below to test live modal popups and slide-over side drawers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="default" onClick={() => setIsModalOpen(true)}>
                      Open Modal Dialog
                    </Button>
                    <Button variant="outline" onClick={() => setIsDrawerOpen(true)}>
                      Open Side Sheet Drawer
                    </Button>

                    <Tooltip content="Verified by Reframe Quality Assurance" position="top">
                      <Button variant="secondary" leftIcon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}>
                        Hover for Tooltip (Top)
                      </Button>
                    </Tooltip>

                    <Tooltip content="Instant download in ZIP format" position="right">
                      <Button variant="ghost" leftIcon={<Download className="h-4 w-4" />}>
                        Tooltip (Right)
                      </Button>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>

              {/* Live Rendered Modal Mother Component */}
              <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Confirm Batch Export"
                description="Your edits have passed two-stage QA. Choose your preferred delivery format."
              >
                <div className="space-y-4">
                  <div className="rounded-xl border border-black/[0.14] bg-black/[0.04] p-4 text-[13.5px]">
                    <div className="flex justify-between font-semibold">
                      <span>Batch #2026-RF-891</span>
                      <span className="text-emerald-600">QA Approved</span>
                    </div>
                    <div className="mt-1 text-black/55">64 images · Amazon Pure White (255, 255, 255)</div>
                  </div>
                  <ModalFooter>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="brand" onClick={() => setIsModalOpen(false)}>
                      Download All Images (.zip)
                    </Button>
                  </ModalFooter>
                </div>
              </Modal>

              {/* Live Rendered Drawer Mother Component */}
              <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Job Specifications Drawer"
                description="Inspect detailed clipping path anchors and turnaround timestamps."
              >
                <div className="space-y-5 text-left">
                  <Alert variant="tip" title="Pen Tool Guarantee">
                    All paths are traced by hand with bezier curves at 300% zoom.
                  </Alert>

                  <div className="space-y-3">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/45">File Specs</div>
                    <div className="rounded-xl border border-black/[0.14] p-3.5 text-[14px] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-black/55">Resolution:</span>
                        <span className="font-mono font-semibold">300 DPI</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/55">Color Space:</span>
                        <span className="font-mono font-semibold">sRGB IEC61966-2.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-black/55">Clipping Tolerance:</span>
                        <span className="font-mono font-semibold">0.5 px inner feather</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="default" className="w-full" onClick={() => setIsDrawerOpen(false)}>
                    Close Drawer
                  </Button>
                </div>
              </Drawer>
            </section>

            {/* 8. NAVIGATION & TABS */}
            <section id="navigation" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>08. Navigation & Structure</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Tabs, Segmented Controls & Breadcrumbs
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Navigation primitives with smooth animated layout indicators.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tab Styles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-7">
                  {/* Underline Tabs */}
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">
                      Underline Animated Tabs
                    </div>
                    <Tabs
                      variant="underline"
                      activeTab={activeTab}
                      onChange={setActiveTab}
                      items={[
                        { id: "all", label: "All Services" },
                        { id: "ghost", label: "Ghost Mannequin", badge: <Badge size="sm" variant="brand">Popular</Badge> },
                        { id: "clipping", label: "Clipping Path" },
                        { id: "jewelry", label: "Jewelry Retouch" },
                      ]}
                    />
                  </div>

                  {/* Segmented Controls */}
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">
                      Segmented Control (Notion / macOS Style)
                    </div>
                    <Tabs
                      variant="segmented"
                      activeTab={activeTab}
                      onChange={setActiveTab}
                      items={[
                        { id: "all", label: "Grid View" },
                        { id: "ghost", label: "Table List" },
                        { id: "clipping", label: "Kanban Board" },
                      ]}
                    />
                  </div>

                  {/* Breadcrumbs */}
                  <div className="border-t border-black/[0.14] pt-5">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">
                      Breadcrumbs Trail
                    </div>
                    <Breadcrumbs
                      items={[
                        { label: "Design System", href: "/design-system" },
                        { label: "Mother Components", href: "/design-system#buttons" },
                        { label: "Active Inspector" },
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 9. FEEDBACK & ALERTS */}
            <section id="feedback" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>09. Feedback & Progress</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Alert Banners, Skeletons & Progress
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  Notification banners, loading skeletons, and accessible progress indicators.
                </p>
              </div>

              <div className="space-y-4">
                <Alert variant="info" title="Informational Notice">
                  Reframe Visuals production operates 24/7 with shift teams in London and Asia Pacific.
                </Alert>

                <Alert variant="success" title="Order #RF-9481 Delivered">
                  Your 48 high-resolution fashion retouches are ready for download in your customer dashboard.
                </Alert>

                <Alert variant="warning" title="Image Resolution Alert">
                  2 files were submitted below 1500px width. Please verify if Amazon zoom compliance is required.
                </Alert>

                <Alert variant="destructive" title="Payment Authentication Failed" onDismiss={() => {}}>
                  Your credit card was declined by your bank. Update your billing method to prevent SLA delay.
                </Alert>

                <Alert variant="tip" title="Pro Tip: Pen Tool Vector Masks">
                  You can copy Photoshop paths directly from our returned TIFFs with 100% editability.
                </Alert>
              </div>

              {/* Progress and Skeleton Loader */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Bars & Loading Skeletons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <ProgressBar value={76} showLabel />
                  </div>

                  <div className="border-t border-black/[0.14] pt-5 space-y-3">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50">
                      Skeleton Shimmer Loaders
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton variant="circular" width={44} height={44} />
                      <div className="flex-1 space-y-2">
                        <Skeleton variant="text" width="40%" height={14} />
                        <Skeleton variant="text" width="70%" height={12} />
                      </div>
                    </div>
                    <Skeleton variant="rectangular" height={90} className="w-full mt-3" />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 10. DATA DISPLAY & TABLES */}
            <section id="data" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>10. Data Representation</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Tables, Metric Cards & Avatars
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  DataGrid tables, KPI performance widgets, and user avatar collections.
                </p>
              </div>

              {/* Stat Widgets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatWidget
                  label="Starting Image Rate"
                  value="$0.39"
                  change="-18% tier"
                  trend="up"
                  caption="Manual pen tool paths included"
                  icon={<Zap className="h-4 w-4" />}
                />
                <StatWidget
                  label="Average Turnaround"
                  value="11.4 hrs"
                  change="vs 24h SLA"
                  trend="up"
                  caption="Average for batches under 250 images"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatWidget
                  label="Client Retention Rate"
                  value="98.7%"
                  change="+2.4% MoM"
                  trend="up"
                  caption="E-commerce brands & photo studios"
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
              </div>

              {/* Data Table */}
              <div>
                <Table zebra>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Specification</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Turnaround</TableHead>
                      <TableHead>Starting Rate</TableHead>
                      <TableHead>QA Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: "Clipping Path (Multi-layer)", cat: "catFoundation", time: "12 Hours", price: "$0.39", status: "Active" },
                      { name: "Ghost Mannequin Composite", cat: "catAdvanced", time: "12 Hours", price: "$0.89", status: "Active" },
                      { name: "Jewelry Reflection Removal", cat: "catRetouch", time: "16 Hours", price: "$1.49", status: "Active" },
                      { name: "Cast Shadow Matching", cat: "catEnhancement", time: "12 Hours", price: "$0.59", status: "Active" },
                    ].map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>
                          <Badge variant={row.cat as any} size="sm">
                            {row.cat.replace("cat", "")}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-[14px]">{row.time}</TableCell>
                        <TableCell className="font-heading font-bold text-[var(--brand,#0A0A0B)]">{row.price}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-[12px]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {row.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Avatars & Avatar Groups */}
              <Card>
                <CardHeader>
                  <CardTitle>Avatar & Team Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-8">
                    <div>
                      <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">Sizes Scale</div>
                      <div className="flex items-center gap-3">
                        <Avatar name="Sarah Jenkins" size="xs" status="online" />
                        <Avatar name="Alex Vance" size="sm" status="online" />
                        <Avatar name="Elena Rostova" size="md" status="busy" />
                        <Avatar name="Marcus Chen" size="lg" status="away" />
                      </div>
                    </div>

                    <div className="border-l border-black/[0.16] pl-8">
                      <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">Stacked Avatar Group</div>
                      <AvatarGroup max={4}>
                        <Avatar name="David Lee" size="md" />
                        <Avatar name="Jessica Taylor" size="md" />
                        <Avatar name="Michael Zhang" size="md" />
                        <Avatar name="Chloe Bennet" size="md" />
                        <Avatar name="Robert Kim" size="md" />
                        <Avatar name="Anna Silva" size="md" />
                      </AvatarGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 11. PLATFORM SIGNATURE TOOLS */}
            <section id="platform" className="scroll-mt-24 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>11. Reframe Platform Specials</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Interactive Before/After Slider & Pricing Tiers
                </h2>
                <p className="mt-1 text-[15px] text-black/60">
                  The flagship visual tools that differentiate Reframe Visuals in the market.
                </p>
              </div>

              {/* Before / After Slider Demo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <Badge variant="brand" dot pulse>Live Interactive Demo</Badge>
                  <h3 className="font-heading text-[24px] sm:text-[28px] font-bold leading-tight">
                    BeforeAfterSlider Mother Component
                  </h3>
                  <p className="text-[15px] text-black/65 leading-relaxed">
                    Drag the center handle horizontally to inspect the hand-traced pen tool boundary and skin retouching quality in real time.
                  </p>
                  <ul className="space-y-2 text-[13.5px] text-black/75">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Supports touch drag, mouse move, and responsive aspect ratios.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Backdrop blur badge pills for "Original" and "Edited".</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Used across Hero, Services, Comparison, and Portfolio pages.</span>
                    </li>
                  </ul>
                </div>

                <div className="w-full">
                  <BeforeAfterSlider
                    beforeImage="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_1200/reframe/services/retouching-before"
                    afterImage="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_1200/reframe/services/retouching-after"
                    beforeLabel="Raw Original"
                    afterLabel="Reframe Retouched"
                    aspectRatio="aspect-[4/3]"
                  />
                </div>
              </div>

              {/* FAQ Accordion Showcase */}
              <Card>
                <CardHeader>
                  <CardTitle>FAQ & Expandable Accordion</CardTitle>
                  <CardDescription>Smooth height expand/collapse transitions powered by Framer Motion.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion defaultOpen={["faq-1"]}>
                    <AccordionItem id="faq-1">
                      <AccordionTrigger>How does modifying a mother component update child components?</AccordionTrigger>
                      <AccordionContent>
                        Because all sections and platform pages import directly from the mother components in <code>@/components/ui</code>, any design or token update made to a mother component instantly propagates across the entire platform without manual duplication.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem id="faq-2">
                      <AccordionTrigger>Are these components WCAG accessible?</AccordionTrigger>
                      <AccordionContent>
                        Yes. All components comply with WCAG 2.1 AA standards, featuring visible focus rings, full keyboard navigation (Enter, Space, Esc, Arrow keys), semantic ARIA tags, and high-contrast color ratios.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem id="faq-3">
                      <AccordionTrigger>How do I test my own custom images with the slider?</AccordionTrigger>
                      <AccordionContent>
                        Simply pass your image URLs into the <code>&lt;BeforeAfterSlider beforeImage="..." afterImage="..." /&gt;</code> mother component.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>

            {/* 12. SITE SECTIONS ARCHITECTURE */}
            <section id="sections" className="scroll-mt-24 space-y-8">
              <div>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  <span>12. Site Architecture</span>
                </div>
                <h2 className="font-heading text-[28px] sm:text-[34px] font-bold tracking-[-0.04em] text-[var(--color-text-primary,#0A0A0B)]">
                  Site Sections Architecture
                </h2>
                <p className="mt-1 text-[15px] text-black/60 max-w-2xl">
                  Every reusable section and layout component in the platform, mapped to their mother component dependencies.
                  Changes to any mother component above instantly cascade into these sections.
                </p>
              </div>

              {/* ─── Panel A: Always-Present Layout Components ─── */}
              <div className="space-y-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373]">
                  Always-Present Layout Components — mounted on every public page
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Navigation",
                      path: "src/components/Navigation.tsx",
                      role: "Sticky top nav with responsive mobile drawer. Present on every public route via PublicSite shell.",
                      pages: "All public pages",
                      motherComponents: [
                        { label: "Button",  anchor: "buttons" },
                        { label: "Badge",   anchor: "badges"  },
                      ],
                    },
                    {
                      name: "Footer",
                      path: "src/components/Footer.tsx",
                      role: "Site-wide footer with nav links, legal text, and social icons. Rendered by PublicSite shell.",
                      pages: "All public pages",
                      motherComponents: [
                        { label: "Button", anchor: "buttons" },
                      ],
                    },
                    {
                      name: "ReframeCS",
                      path: "src/components/ReframeCS.tsx",
                      role: "Floating AI chat assistant widget — minimised trigger, chat drawer, contact capture card.",
                      pages: "All public pages",
                      motherComponents: [
                        { label: "Button",  anchor: "buttons"  },
                        { label: "Drawer",  anchor: "overlays" },
                        { label: "Input",   anchor: "forms"    },
                      ],
                    },
                  ].map((comp) => (
                    <div key={comp.name} className="rounded-2xl border border-black/[0.18] bg-white p-5 shadow-sm text-left">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05]">
                          <NavIcon className="h-4 w-4 text-black/60" />
                        </div>
                        <Badge variant="secondary">Layout</Badge>
                      </div>
                      <div className="font-heading text-[15px] font-bold text-[var(--color-text-primary,#0A0A0B)]">
                        {comp.name}
                      </div>
                      <code className="block mt-0.5 text-[12px] font-mono text-black/40">{comp.path}</code>
                      <p className="mt-2 text-[14px] text-black/60 leading-snug">{comp.role}</p>
                      <div className="mt-3 border-t border-black/[0.14] pt-3 space-y-1.5">
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-black/40">
                          Mother Components Used
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.motherComponents.map((mc) => (
                            <a key={mc.label} href={`#${mc.anchor}`}>
                              <Badge variant="outline" className="text-[12px] cursor-pointer hover:bg-black/5">
                                {mc.label}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 text-[12px] text-black/40">Used on: {comp.pages}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Panel B: Section Pattern Groups ─── */}
              <div className="space-y-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373]">
                  Section Pattern Groups — {SECTION_GROUPS.reduce((s, g) => s + g.count, 0)} sections across {SECTION_GROUPS.length} groups
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SECTION_GROUPS.map((group) => (
                    <div
                      key={group.name}
                      className="rounded-2xl border border-black/[0.18] bg-white p-5 shadow-sm text-left"
                      style={{ borderLeftWidth: "3px", borderLeftColor: group.accentHex }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-heading text-[14px] font-bold text-[var(--color-text-primary,#0A0A0B)]">
                          {group.name}
                        </span>
                        <Badge variant="secondary">{group.count} sections</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {group.files.map((f) => (
                          <Badge key={f} variant="outline" className="text-[12px] font-mono">
                            {f}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-[11.5px] text-black/55 mb-3">
                        <span className="font-semibold text-black/70">Pages:</span> {group.pages}
                      </div>
                      <div className="border-t border-black/[0.14] pt-2.5 space-y-1.5">
                        <div className="text-[10.5px] font-bold uppercase tracking-wider text-black/40">
                          Connected Mother Components
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.motherComponents.map((mc) => (
                            <a key={mc.label} href={`#${mc.anchor}`}>
                              <Badge variant="outline" className="text-[10.5px] cursor-pointer hover:bg-black/5">
                                {mc.label}
                              </Badge>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── Panel C: Feature Cluster Sub-Components ─── */}
              <div className="space-y-3">
                <div className="text-[12px] font-bold uppercase tracking-wider text-[#737373]">
                  Feature Cluster Sub-Components — sit between sections and atomic primitives
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "BeforeAfterCard",
                      path: "src/components/BeforeAfterCard.tsx",
                      role: "Static before/after image pair card. Used in portfolio grid and service pages.",
                      usedIn: "ServiceCapabilities.tsx, PortfolioHero.tsx",
                      motherLink: { label: "BeforeAfterSlider", anchor: "platform" },
                    },
                    {
                      name: "HoverBeforeAfterCard",
                      path: "src/components/HoverBeforeAfterCard.tsx",
                      role: "CSS hover-triggered before/after reveal. Lightweight alternative to the drag slider.",
                      usedIn: "ClientCategoryStrip.tsx, Hero.tsx",
                      motherLink: { label: "BeforeAfterSlider", anchor: "platform" },
                    },
                    {
                      name: "HeroCards",
                      path: "src/components/hero/HeroCards.tsx",
                      role: "Floating proof-point card cluster displayed beside the main hero headline.",
                      usedIn: "Hero.tsx",
                      motherLink: { label: "Card", anchor: "cards" },
                    },
                    {
                      name: "ScrollReveal",
                      path: "src/components/common/ScrollReveal.tsx",
                      role: "Framer Motion viewport-enter animation wrapper. Used across 20+ sections for entrance animations.",
                      usedIn: "20+ sections",
                      motherLink: null,
                    },
                    {
                      name: "BundleCard",
                      path: "src/components/pricing/BundleCard.tsx",
                      role: "Pricing bundle tier card with feature list and CTA. Consumed exclusively by PricingBundles.tsx.",
                      usedIn: "PricingBundles.tsx",
                      motherLink: { label: "Card", anchor: "cards" },
                    },
                  ].map((sub) => (
                    <div key={sub.name} className="rounded-2xl border border-black/[0.18] bg-white p-4 shadow-sm text-left">
                      <div className="font-heading text-[13.5px] font-bold text-[var(--color-text-primary,#0A0A0B)]">
                        {sub.name}
                      </div>
                      <code className="block mt-0.5 text-[10.5px] font-mono text-black/40">{sub.path}</code>
                      <p className="mt-2 text-[12.5px] text-black/60 leading-snug">{sub.role}</p>
                      <div className="mt-2 text-[12px] text-black/45">
                        <span className="font-semibold">Used in:</span> {sub.usedIn}
                      </div>
                      {sub.motherLink && (
                        <div className="mt-2">
                          <a href={`#${sub.motherLink.anchor}`}>
                            <Badge variant="outline" className="text-[10.5px] cursor-pointer hover:bg-black/5">
                              ↑ {sub.motherLink.label}
                            </Badge>
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
