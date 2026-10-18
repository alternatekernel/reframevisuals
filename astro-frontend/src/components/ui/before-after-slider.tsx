import * as React from "react"
import { cx } from "../../utils/theme"

export interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  initialSliderPos?: number
  className?: string
  aspectRatio?: string
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "Edited / Retouched",
  initialSliderPos = 50,
  className,
  aspectRatio = "aspect-[4/3]",
}) => {
  const [sliderPos, setSliderPos] = React.useState(initialSliderPos)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMove = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percent = Math.min(100, Math.max(0, (x / rect.width) * 100))
      setSliderPos(percent)
    },
    [],
  )

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX)
  }

  const handleMouseDown = () => setIsDragging(true)

  React.useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX)
    }

    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("mousemove", handleGlobalMouseMove)
    }

    return () => {
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleGlobalMouseMove)
    }
  }, [isDragging, handleMove])

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchMove={handleTouchMove}
      className={cx(
        "group relative w-full select-none overflow-hidden rounded-2xl border border-black/[0.18] bg-black/[0.05] shadow-md cursor-ew-resize",
        aspectRatio,
        className,
      )}
    >
      {/* After image (Full background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      {/* Before image (Clipped to slider position) */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="pointer-events-none absolute inset-0 h-full max-w-none object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%" }}
          loading="lazy"
        />
      </div>

      {/* Split Divider line */}
      <div
        className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Center Drag Handle */}
        <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[var(--brand,#E97451)] text-white shadow-xl transition-transform group-hover:scale-110">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" className="hidden" />
          </svg>
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Floating Badges */}
      <div className="pointer-events-none absolute bottom-3.5 left-3.5 rounded-full bg-black/60 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
        {beforeLabel}
      </div>
      <div className="pointer-events-none absolute bottom-3.5 right-3.5 rounded-full bg-black/60 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
        {afterLabel}
      </div>
    </div>
  )
}
