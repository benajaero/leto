'use client';

import { useEffect, useRef, useState } from 'react';
import { useEngineStore } from '@/lib/stores/engineStore';
import { scenarios } from '@/lib/data/scenarios';

/**
 * The scenario picker, with the behaviour a menu is supposed to have.
 *
 * Previously a plain button next to an absolutely-positioned div: no
 * aria-expanded, no role, no keyboard navigation, no Escape, and no
 * click-outside — so it announced nothing to assistive tech and could only be
 * dismissed by picking something.
 */
export function ScenarioMenu() {
  const scenario = useEngineStore((s) => s.scenario);
  const setScenario = useEngineStore((s) => s.setScenario);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => {
          const next =
            e.key === 'ArrowDown'
              ? (i + 1) % scenarios.length
              : (i - 1 + scenarios.length) % scenarios.length;
          itemRefs.current[next]?.focus();
          return next;
        });
      }
      if (e.key === 'Home') {
        e.preventDefault();
        itemRefs.current[0]?.focus();
        setActiveIndex(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        const last = scenarios.length - 1;
        itemRefs.current[last]?.focus();
        setActiveIndex(last);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openMenu = () => {
    const current = Math.max(
      0,
      scenarios.findIndex((s) => s.id === scenario.id)
    );
    setActiveIndex(current);
    setOpen(true);
    window.requestAnimationFrame(() => itemRefs.current[current]?.focus());
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Scenario: ${scenario.name}. Change scenario`}
        className="flex min-h-touch items-center gap-2 rounded border border-aerospace-700 bg-aerospace-800 px-3 text-readout font-semibold text-aerospace-200 transition hover:border-aerospace-600"
      >
        {scenario.name}
        <svg
          className="h-3 w-3 text-aerospace-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Scenarios"
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded border border-aerospace-700 bg-aerospace-800 py-1 shadow-xl"
        >
          {scenarios.map((s, i) => {
            const current = s.id === scenario.id;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                tabIndex={i === activeIndex ? 0 : -1}
                onClick={() => {
                  setScenario(s);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`flex min-h-touch w-full items-center px-3 text-left text-readout transition hover:bg-aerospace-700 ${
                  current ? 'text-signal-400' : 'text-aerospace-300'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
