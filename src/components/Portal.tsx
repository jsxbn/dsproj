// src/components/Portal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.getElementById("modal-root");
    if (root) setMountNode(root);
  }, []);

  if (!mountNode) return null;
  return createPortal(children, mountNode);
}
