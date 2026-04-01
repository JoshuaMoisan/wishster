"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Base max (px) pour le verso ; adapté au format 63×88 mm une fois imprimé. */
const MAX_BASE_PX = 17;
const MIN_BASE_PX = 5;
const FIT_ITERATIONS = 24;
/** Marge sous la hauteur utile (arrondis, descendants, gap). */
const HEIGHT_EPS_PX = 5;

type PrintVersoFitTextProps = {
  title: string;
  artist: string;
  releaseLine: string | null;
};

/**
 * Typo la plus grande possible : on part du max et on réduit jusqu’à ce que
 * titre + artiste + date tiennent dans le panneau (hauteur utile).
 */
export function PrintVersoFitText({
  title,
  artist,
  releaseLine,
}: PrintVersoFitTextProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [basePx, setBasePx] = useState(MAX_BASE_PX);

  const measure = useCallback(() => {
    const shell = shellRef.current;
    const block = blockRef.current;
    if (!shell || !block) return;

    const cs = getComputedStyle(shell);
    const padY =
      parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) || 0;
    const innerH = shell.clientHeight - padY;
    const available = Math.max(0, innerH - HEIGHT_EPS_PX);
    if (available <= 0) return;

    const fitsAt = (px: number) => {
      block.style.fontSize = `${px}px`;
      void block.offsetHeight;
      void block.getBoundingClientRect();
      return Math.ceil(block.scrollHeight) <= Math.floor(available);
    };

    block.style.fontSize = `${MAX_BASE_PX}px`;
    void block.offsetHeight;

    if (fitsAt(MAX_BASE_PX)) {
      setBasePx(MAX_BASE_PX);
      return;
    }

    let low = MIN_BASE_PX;
    let high = MAX_BASE_PX;
    let best = MIN_BASE_PX;

    for (let i = 0; i < FIT_ITERATIONS; i++) {
      const mid = (low + high) / 2;
      if (fitsAt(mid)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    let px = best;
    while (px > MIN_BASE_PX && !fitsAt(px)) {
      px -= 0.5;
    }
    setBasePx(Math.max(MIN_BASE_PX, px));
  }, [title, artist, releaseLine]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(shell);
    const panel = shell.parentElement;
    if (panel) ro.observe(panel);
    void document.fonts?.ready?.then(() => measure());
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div
      ref={shellRef}
      className="flex min-h-0 min-w-0 w-full flex-1 flex-col justify-center overflow-hidden px-1.5 py-0.5 sm:px-2 sm:py-1"
    >
      <div
        ref={blockRef}
        className="flex w-full min-w-0 flex-col items-center justify-center gap-[0.38em] text-center"
        style={{ fontSize: `${basePx}px` }}
      >
        <p className="w-full min-w-0 hyphens-auto break-words font-semibold leading-[1.12] [font-size:1.2em]">
          {title}
        </p>
        <p className="w-full min-w-0 hyphens-auto break-words leading-[1.12] text-muted-foreground [font-size:1em]">
          {artist}
        </p>
        {releaseLine ? (
          <p className="mt-[0.15em] shrink-0 leading-tight text-muted-foreground [font-size:0.8em]">
            {releaseLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}
