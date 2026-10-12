'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import styles from './FormControls.module.css';

interface Option {
  value: string;
  label: string;
}

interface Props {
  id: string;
  name: string;
  label: string;
  options: Option[];
  placeholder: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

/** A form control with a branded list, native FormData values and full keyboard access. */
export default function TDKSelect({
  id,
  name,
  label,
  options,
  placeholder,
  required,
  invalid,
  describedBy,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef({ value: '', time: 0 });
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 320 });
  const selected = options.find((option) => option.value === value);
  const listId = `${id}-options`;

  const choose = (index: number) => {
    setValue(options[index].value);
    setOpen(false);
    buttonRef.current?.focus({ preventScroll: true });
  };

  const expand = () => {
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    );
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false);
      const timer = window.setTimeout(() => setPresent(false), 200);
      return () => window.clearTimeout(timer);
    }
    setPresent(true);
    let frame = 0;
    const place = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const height = Math.min(360, 52 + options.length * 46);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const flip = below < Math.min(height, 210) && above > below;
      const maxHeight = Math.max(100, Math.min(height, flip ? above : below));
      setPosition({
        top: flip ? rect.top - maxHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(place);
    };
    place();
    frame = requestAnimationFrame(() => setVisible(true));
    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    if (buttonRef.current) observer.observe(buttonRef.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (open && present)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, present, id]);

  useEffect(() => {
    const form = buttonRef.current?.form;
    const reset = () => {
      setValue('');
      setOpen(false);
    };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key;
    if (key === 'Tab') {
      setOpen(false);
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (open) choose(active);
      else expand();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault();
      if (!open) {
        expand();
        if (key === 'Home') setActive(0);
        if (key === 'End') setActive(options.length - 1);
      } else
        setActive((index) =>
          key === 'Home'
            ? 0
            : key === 'End'
              ? options.length - 1
              : (index + (key === 'ArrowDown' ? 1 : -1) + options.length) % options.length,
        );
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const search = searchRef.current;
      search.value = (now - search.time < 700 ? search.value : '') + key.toLowerCase();
      search.time = now;
      const match = options.findIndex((option) =>
        option.label.toLowerCase().startsWith(search.value),
      );
      if (match >= 0) {
        setOpen(true);
        setActive(match);
      }
    }
  };

  return (
    <div ref={rootRef} className={styles.shell}>
      <button
        ref={buttonRef}
        id={id}
        name={name}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={present ? listId : undefined}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        aria-required={required}
        aria-invalid={!!invalid}
        aria-describedby={describedBy}
        data-empty={!selected}
        className={`${styles.control} ${styles.trigger}`}
        onClick={() => (open ? setOpen(false) : expand())}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!menuRef.current?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <span className={styles.value}>{selected?.label ?? placeholder}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 14 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="m1 2 6 6 6-6" />
        </svg>
      </button>
      <input type="hidden" name={name} value={value} />
      {present &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            data-visible={visible}
            aria-hidden={!open}
            style={position}
          >
            <p className={styles.menuBrand} aria-hidden="true">
              TDK DESIGN &amp; BUILD
            </p>
            <div id={listId} role="listbox" aria-label={label} className={styles.list}>
              {options.map((option, index) => (
                <button
                  key={option.value}
                  id={`${id}-option-${index}`}
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={value === option.value}
                  data-active={index === active}
                  className={styles.option}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(index)}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    >
                      <path d="m2 7 3.5 3.5L12 4" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
