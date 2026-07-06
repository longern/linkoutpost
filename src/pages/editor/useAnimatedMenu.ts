import { useEffect, useState } from "react";

export type AnimatedMenuState = {
  mounted: boolean;
  visible: boolean;
};

export function useAnimatedMenu(open: boolean, durationMs = 160): AnimatedMenuState {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setVisible(true);
      return;
    }

    setVisible(false);
    const timeout = window.setTimeout(() => setMounted(false), durationMs);
    return () => window.clearTimeout(timeout);
  }, [durationMs, open]);

  return { mounted, visible };
}
