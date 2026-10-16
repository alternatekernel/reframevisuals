"use client";
import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import { cn } from "../../lib/utils";

/**
 * SingularGlowMarcher
 * A single, high-intensity light particle that marches around a component edge.
 * It is impossible to produce two particles with this logic.
 */
export function SingularGlowMarcher({
  borderRadius = "9999px",
  children,
  containerClassName,
  borderClassName,
  duration = 2000,
  ...otherProps
}: {
  borderRadius?: string;
  children: React.ReactNode;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  [key: string]: any;
}) {
  return (
    <div
      className={cn(
        "relative p-[3.5px] overflow-hidden group/marcher",
        containerClassName
      )}
      style={{
        borderRadius: borderRadius,
      }}
      {...otherProps}
    >
      {/* High-Visibility Spark Track */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <MovingBorder duration={duration} rx="24px" ry="24px">
          <div
            className={cn(
              "h-20 w-20 opacity-100 bg-[radial-gradient(#fff_15%,#00f2ff_40%,var(--brand)_60%,transparent_80%)]",
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      {/* Internal Content (Original Design) */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

export const MovingBorder = ({
  children,
  duration = 2500,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  [key: string]: any;
}) => {
  const pathRef = useRef<any>(null);
  const progress = useMotionValue<number>(0);

  // Strictly enforced single animation loop
  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).x
  );
  const y = useTransform(
    progress,
    (val) => pathRef.current?.getPointAtLength(val).y
  );

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full pointer-events-none"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect
          fill="none"
          stroke="none"
          width="100%"
          height="100%"
          rx={rx}
          ry={ry}
          ref={pathRef}
        />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};
