"use client";

import { motion } from "framer-motion";

export interface MaskedRevealTextProps {
  text: string;
  staggerDelay?: number;
  fontSize?: string;
  color?: string;
  fontWeight?: number | string;
  className?: string;
  fontFamily?: string;
  delay?: number;
  initial?: any;
  animate?: any;
}

export function MaskedRevealText({
  text,
  staggerDelay = 0.05,
  fontSize = "14px",
  color = "rgba(0,0,0,0.5)",
  fontWeight = 400,
  className,
  fontFamily,
  delay = 0,
  initial = "hidden",
  animate = "visible",
}: MaskedRevealTextProps) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerDelay, delayChildren: delay },
    },
  };

  const child: any = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: "100%",
    },
  };

  let underlineCount = 0;

  return (
    <motion.div
      key={text}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        overflow: "hidden",
      }}
      variants={container}
      initial={initial}
      animate={animate}
      className={className}
    >
      <span
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.01em",
          fontFamily: fontFamily || "var(--font-body), -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {words.map((word, i) => {
          const isUnderlined = word.includes("<u>") || word.includes("</u>");
          const cleanWord = word.replace(/<\/?u>/g, "");
          const currentUnderlineIndex = isUnderlined ? underlineCount++ : -1;
          
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                position: "relative",
                marginRight: "0.25em",
                paddingBottom: "4px",
                overflow: "hidden",
              }}
            >
              <motion.span
                variants={child}
                style={{ 
                  display: "inline-block",
                }}
              >
                {cleanWord}
              </motion.span>
              
              {isUnderlined && (
                <motion.span
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ 
                    delay: (words.length * staggerDelay) + (currentUnderlineIndex * (1.5 + 0.5)) + 0.5, 
                    duration: 1.5, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 0,
                    right: 0,
                    height: "1px",
                    backgroundColor: color || "rgba(0,0,0,0.5)",
                    opacity: 0.6,
                  }}
                />
              )}
            </span>
          );
        })}
      </span>
    </motion.div>
  );
}
