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
      <section className="relative border-b border-black/8 bg-gradient-to-b from-black/[0.02] to-transparent pt-12 pb-14 sm:pt-16 sm:pb-20">
        <div className="max-w-[1520px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3.5 py-1 text-[12px] font-semibold shadow-sm mb-5">
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
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-black/45">Mother Components</div>
                <div className="font-heading text-[22px] font-bold text-[var(--color-text-primary,#0A0A0B)]">24+ Core</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-black/45">Accessibility</div>
                <div className="font-heading text-[22px] font-bold text-emerald-600">WCAG 2.1 AA</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-sm text-left">
                <div className="text-[11px] font-bold uppercase tracking-wider text-black/45">Framework</div>
                <div className="font-heading text-[22px] font-bold text-[var(--brand,#0A0A0B)]">Tailwind + Radix</div>
              </div>
            </div>
          </div>

          {/* ─── LIVE GLOBAL TOKEN CUSTOMIZER TOOLBAR ─── */}
          <div className="mt-10 rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.05)] text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-black/6 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand,#0A0A0B)]/10 text-[var(--brand,#0A0A0B)]">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-[16px] font-semibold text-[var(--color-text-primary,#0A0A0B)]">
                    Live Mother Token Controller
                  </h3>
                  <p className="text-[13px] text-black/55">
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
                  <span className="ml-2 font-mono text-[13px] text-black/60 font-semibold">
                    {currentBrand.hex}
                  </span>
                </div>
              </div>

              {/* Radius Scale */}
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-black/50">
                  Border Radius Profile
                </label>
                <div className="inline-flex rounded-xl bg-black/[0.05] p-1 border border-black/5">
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
                <div className="rounded-xl bg-black/[0.03] border border-black/8 px-3.5 py-2 font-mono text-[12px] text-black/70 flex items-center justify-between">
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
          <aside className="sticky top-20 hidden lg:block rounded-2xl border border-black/10 bg-white p-4 shadow-sm text-left">
            {/* Search Filter */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-black/[0.02] pl-9 pr-3 py-2 text-[13px] text-black outline-none placeholder:text-black/40 focus:border-black/30 focus:bg-white"
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

            <div className="mt-6 border-t border-black/8 pt-4">
              <div className="rounded-xl bg-[var(--brand,#0A0A0B)]/8 border border-[var(--brand,#0A0A0B)]/20 p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
                  Developer Quickstart
                </div>
                <code className="mt-1 block font-mono text-[11px] text-black/75 break-all">
                  import &#123; Button &#125; from '@/components/ui';
                </code>
              </div>
            </div>
          </aside>

          {/* ─── Component Sections ─── */}
          <main className="space-y-16 text-left">
            {/* The Essential 10 Architecture Banner */}
            <div className="rounded-2xl border border-black/10 bg-gradient-to-r from-black/[0.03] to-transparent p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand,#0A0A0B)]">
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
                  <div key={item.name} className="rounded-xl border border-black/8 bg-white p-2.5 shadow-xs">
                    <div className="font-bold text-black flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] text-[var(--brand,#0A0A0B)]">{item.file}</div>
                    <div className="text-[11px] text-black/50 truncate mt-0.5">{item.desc}</div>
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
                    className="overflow-hidden rounded-2xl border border-black/10 bg-white p-3 shadow-sm text-left transition-all hover:shadow-md"
                  >
                    <div
                      className="h-16 w-full rounded-xl border border-black/5"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="mt-3">
                      <div className="text-[13px] font-bold text-black">{swatch.name}</div>
                      <div className="mt-0.5 flex items-center justify-between font-mono text-[11px] text-black/50">
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
                      <div className="mt-1 text-[11px] text-black/50 truncate">{swatch.role}</div>
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
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-black/10 text-black/50 font-mono text-[11px] uppercase tracking-wider">
                          <th className="pb-2">Role</th>
                          <th className="pb-2">Size / Weight</th>
                          <th className="pb-2">Line Height</th>
                          <th className="pb-2">Primary Usage</th>
                          <th className="pb-2">Live Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/6">
                        <tr>
                          <td className="py-2.5 font-bold">Display</td>
                          <td className="font-mono text-black/60">48px (3rem) / 700</td>
                          <td className="font-mono text-black/60">1.05</td>
                          <td className="text-black/60">Page title & hero statement</td>
                          <td className="font-heading text-[24px] font-bold">Catalog Editing</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">H1</td>
                          <td className="font-mono text-black/60">32px (2rem) / 700</td>
                          <td className="font-mono text-black/60">1.15</td>
                          <td className="text-black/60">Major section headings</td>
                          <td className="font-heading text-[20px] font-bold">Guaranteed 12h Turnaround</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">H2</td>
                          <td className="font-mono text-black/60">24px (1.5rem) / 600</td>
                          <td className="font-mono text-black/60">1.2</td>
                          <td className="text-black/60">Subsection headers & card titles</td>
                          <td className="font-heading text-[18px] font-semibold">Ghost Mannequin</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">H3</td>
                          <td className="font-mono text-black/60">20px (1.25rem) / 600</td>
                          <td className="font-mono text-black/60">1.25</td>
                          <td className="text-black/60">Minor headings & modal titles</td>
                          <td className="font-heading text-[16px] font-semibold">Clipping Tolerances</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Body</td>
                          <td className="font-mono text-black/60">16px (1rem) / 400</td>
                          <td className="font-mono text-black/60">1.6</td>
                          <td className="text-black/60">Default reading paragraphs</td>
                          <td className="text-[15px]">Hand-traced pen tool paths at 300% zoom.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Small</td>
                          <td className="font-mono text-black/60">14px (0.875rem) / 400</td>
                          <td className="font-mono text-black/60">1.5</td>
                          <td className="text-black/60">Secondary text & helper hints</td>
                          <td className="text-[14px] text-black/70">Replies within 30 minutes.</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold">Tiny</td>
                          <td className="font-mono text-black/60">12px (0.75rem) / 500</td>
                          <td className="font-mono text-black/60">1.4</td>
                          <td className="text-black/60">Form labels, captions & badges</td>
                          <td className="text-[12px] font-medium text-black/60">SLA 12H GUARANTEE</td>
                        </tr>
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
                      <div key={space.size} className="rounded-xl border border-black/8 bg-black/[0.015] p-3 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[13px] font-bold text-[var(--brand,#0A0A0B)]">{space.size}</span>
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

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Button Variants</CardTitle>
                      <CardDescription>All 8 variants available via the &lt;Button variant="..."&gt; prop.</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBtnLoading((prev) => !prev)}
                    >
                      {btnLoading ? "Stop Spinner" : "Test Loading State"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Variants Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="default" loading={btnLoading}>
                      Default (Onyx)
                    </Button>
                    <Button variant="brand" loading={btnLoading}>
                      Brand Accent
                    </Button>
                    <Button variant="brandWhite" loading={btnLoading}>
                      Brand White
                    </Button>
                    <Button variant="white" loading={btnLoading}>
                      White Pill
                    </Button>
                    <Button variant="secondary" loading={btnLoading}>
                      Secondary
                    </Button>
                    <Button variant="outline" loading={btnLoading}>
                      Outline
                    </Button>
                    <Button variant="ghost" loading={btnLoading}>
                      Ghost
                    </Button>
                    <Button variant="destructive" loading={btnLoading}>
                      Destructive
                    </Button>
                    <Button variant="link">
                      Link Button
                    </Button>
                  </div>

                  {/* Sizes Row */}
                  <div className="border-t border-black/8 pt-5">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">Sizes Scale</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="xs" variant="brand">XS Size</Button>
                      <Button size="sm" variant="brand">Small (sm)</Button>
                      <Button size="default" variant="brand">Default (md)</Button>
                      <Button size="lg" variant="brand">Large (lg)</Button>
                      <Button size="icon" variant="brand" aria-label="Quick Action">
                        <Zap className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Icon and Composite Row */}
                  <div className="border-t border-black/8 pt-5">
                    <div className="text-[12px] font-bold uppercase tracking-wider text-black/50 mb-3">Icons & Composites</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button leftIcon={<Send className="h-4 w-4" />}>
                        Send Order
                      </Button>
                      <Button variant="brand" rightIcon={<ArrowRight className="h-4 w-4" />}>
                        Get 3 Free Edits
                      </Button>
                      <ButtonWithIcon label="Start Free Trial" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button Anatomy & Usage Rules (Blog Standard Match) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Card>
                  <CardHeader>
                    <CardTitle>Button Anatomy & Visual States</CardTitle>
                    <CardDescription>Every button variant consistently supports these 5 interactive states.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-black/[0.02] p-2.5 text-[13px]">
                      <span className="font-semibold text-black/70">1. Default State</span>
                      <Button size="sm" variant="default">Default State</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/[0.02] p-2.5 text-[13px]">
                      <span className="font-semibold text-black/70">2. Hover State</span>
                      <Button size="sm" variant="brand" className="shadow-lg">Hovered</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/[0.02] p-2.5 text-[13px]">
                      <span className="font-semibold text-black/70">3. Active / Pressed</span>
                      <Button size="sm" variant="default" className="scale-95">Pressed</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/[0.02] p-2.5 text-[13px]">
                      <span className="font-semibold text-black/70">4. Loading State</span>
                      <Button size="sm" variant="brand" loading>Processing</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-black/[0.02] p-2.5 text-[13px]">
                      <span className="font-semibold text-black/70">5. Disabled State</span>
                      <Button size="sm" variant="default" disabled>Unavailable</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Button Usage Rules & Hierarchy</CardTitle>
                    <CardDescription>Strict rules prevent visual clutter and guide user actions.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-[13px]">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-3">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                        <Check className="h-4 w-4" /> Primary Button (Filled)
                      </div>
                      <p className="text-emerald-900/80 leading-relaxed">
                        <strong>Rule: Exactly one per screen</strong> for the primary conversion goal (e.g., "Start Free Trial" or "Submit Order").
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 p-3">
                      <div className="font-bold text-blue-800 flex items-center gap-1.5 mb-1">
                        <Check className="h-4 w-4" /> Secondary Button (Outlined)
                      </div>
                      <p className="text-blue-900/80 leading-relaxed">
                        Supporting actions alongside the primary (e.g., "View Pricing" or "Download Sample Specs").
                      </p>
                    </div>

                    <div className="rounded-xl border border-zinc-300 bg-zinc-50 p-3">
                      <div className="font-bold text-zinc-800 flex items-center gap-1.5 mb-1">
                        <Check className="h-4 w-4" /> Text / Ghost / Link Button
                      </div>
                      <p className="text-zinc-700 leading-relaxed">
                        Tertiary low-emphasis actions, modal dismiss/cancel, and inline contextual links.
                      </p>
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
                  <div className="border-t border-black/8 pt-5">
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
                  <div className="border-t border-black/8 pt-5">
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
                    <p className="text-[13px] text-black/60">Ideal for dashboard widgets, articles, and data sections.</p>
                  </CardContent>
                </Card>

                <Card variant="interactive">
                  <CardHeader>
                    <Badge variant="brand" className="w-fit mb-2">Hover Lift</Badge>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>Hover over this card to observe tactile lift and shadow bloom.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[13px] text-black/60">Used for service offerings, case studies, and clickable items.</p>
                  </CardContent>
                  <CardFooter>
                    <span className="text-[13px] font-semibold text-[var(--brand,#0A0A0B)] flex items-center gap-1">
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
                    <p className="text-[13px] text-white/60">Used for conversion cards, CTA strips, and code blocks.</p>
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
                  <div className="rounded-xl border border-black/8 bg-black/[0.02] p-4 text-[13.5px]">
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
                    <div className="rounded-xl border border-black/8 p-3.5 text-[13px] space-y-2">
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
                  <div className="border-t border-black/8 pt-5">
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

                  <div className="border-t border-black/8 pt-5 space-y-3">
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
                        <TableCell className="font-mono text-[13px]">{row.time}</TableCell>
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

                    <div className="border-l border-black/8 pl-8">
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
          </main>
        </div>
      </div>
    </div>
  )
}
