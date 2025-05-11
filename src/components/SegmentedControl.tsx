"use client";

import React, { useRef, useEffect } from "react";
import styles from "./SegmentedControl.module.css";

export type Option = {
  value: string;
  label: string;
};

type SegmentedControlProps = {
  options: Option[];
  value: string;
  onChange: (newValue: string) => void;
};

export default function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  // buttonRefs의 타입을 명확하게 HTMLButtonElement 배열로 지정
  const buttonRefs = useRef<HTMLButtonElement[]>([]);

  // 컴포넌트가 마운트될 때 buttonRefs의 길이를 options 길이에 맞게 초기화
  useEffect(() => {
    buttonRefs.current = Array(options.length).fill(null);
  }, [options.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const next = (idx + dir + options.length) % options.length;
      onChange(options[next].value);
      buttonRefs.current[next]?.focus();
    }
  };

  return (
    <div role="radiogroup" className={styles.container}>
      {options.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={`${styles.button} ${selected ? styles.selected : ""}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            ref={(el) => {
              // el이 null이 아닌 경우에만 buttonRefs에 할당
              if (el) {
                buttonRefs.current[idx] = el;
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
