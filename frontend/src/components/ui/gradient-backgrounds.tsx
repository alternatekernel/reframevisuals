interface GradientBackgroundProps {
  className?: string;
  intensity?: number;
  width?: string;
  height?: string;
}

export const GradientBackground = ({ 
  className = "min-h-screen w-full",
  intensity = 0.3,
  width = "60%",
  height = "60%"
}: GradientBackgroundProps) => {
  return (
    <div className={className}>
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse ${width} ${height} at 50% 100%, rgba(var(--brand-rgb), ${intensity}) 0%, rgba(var(--brand-rgb), ${intensity * 0.5}) 50%, transparent 100%)`,
        }}
      />
    </div>
  );
};

export default GradientBackground;