import { Button } from "./button";
import { ArrowRight } from "lucide-react";
import { cx } from "../../utils/theme";

interface ButtonWithIconProps {
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand" | "white";
  ariaLabel?: string;
  animated?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const ButtonWithIcon = ({ label, onClick, className, variant = "default", ariaLabel, animated = true, type = "button", disabled = false }: ButtonWithIconProps) => {
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      aria-label={ariaLabel || label}
      className={cx(
        "group relative h-12 rounded-full p-1 ps-6 pe-16 text-sm font-medium flex items-center justify-center overflow-hidden cursor-pointer",
        animated && "transition-[padding] duration-200 hover:ps-16 hover:pe-6",
        className
      )}
    >
      <span className={cx("relative z-10", animated && "transition-opacity duration-200")}>
        {label}
      </span>
      <div className={cx(
        "absolute right-1 w-10 h-10 rounded-full flex items-center justify-center transition-[right,transform] duration-300 rotate-0 group-hover:-rotate-45",
        animated && "group-hover:right-[calc(100%-44px)]",
        ["white", "secondary", "outline"].includes(variant) ? "bg-[var(--color-text-primary)] text-white" : "bg-white text-black"
      )} aria-hidden="true">
        <ArrowRight size={16} />
      </div>
    </Button>
  );
};

export { ButtonWithIcon };
