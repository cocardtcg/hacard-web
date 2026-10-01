import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption { value: string; label: string; group?: string }
export default function ThemedSelect({ label, value, options, onChange }: {
  label: string; value: string; options: SelectOption[]; onChange: (value: string) => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ text: '', time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [upward, setUpward] = useState(false);
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  const index = Math.min(active, options.length - 1);

  function show() {
    const rect = trigger.current?.getBoundingClientRect();
    setUpward(Boolean(rect && window.innerHeight - rect.bottom < 280 && rect.top > 280));
    setActive(selected); setOpen(true); search.current = { text: '', time: 0 };
  }
  function choose(i: number) {
    const option = options[i];
    if (!option) return;
    onChange(option.value); setOpen(false); trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const item = document.getElementById(`${id}-${index}`);
    const menu = list.current;
    if (item && menu) {
      if (item.offsetTop < menu.scrollTop) menu.scrollTop = item.offsetTop;
      else if (item.offsetTop + item.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = item.offsetTop + item.offsetHeight - menu.clientHeight;
    }
  }, [open, index, id]);
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Tab') { setOpen(false); return; }
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      if (event.key === 'Enter' || event.key === ' ') { choose(index); return; }
      setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : Math.max(0, Math.min(options.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : '') + event.key.toLocaleLowerCase();
      search.current = { text, time: now };
      const found = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(text));
      if (!open) show();
      if (found >= 0) setActive(found);
    }
  }
  return <div className={`themed-select${open ? ' is-open' : ''}${upward ? ' opens-up' : ''}`} ref={root}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button ref={trigger} type="button" className="select-trigger" role="combobox" aria-label={label}
      aria-expanded={open} aria-controls={`${id}-list`} aria-haspopup="listbox" aria-activedescendant={open ? `${id}-${index}` : undefined}
      onClick={() => open ? setOpen(false) : show()} onKeyDown={keyDown}>
      <span>{options[selected]?.label || '선택'}</span><ChevronDown size={17} aria-hidden="true" />
    </button>
    {open && <div className="select-menu" id={`${id}-list`} ref={list} role="listbox" aria-label={label}>
      {options.map((option, i) => <div key={option.value}>
        {option.group && option.group !== options[i - 1]?.group && <div className="select-group" role="presentation">{option.group}</div>}
        <div id={`${id}-${i}`} className={`select-option${i === index ? ' is-active' : ''}${option.value === value ? ' is-selected' : ''}`}
          role="option" aria-selected={option.value === value} aria-label={option.group ? `${option.group} · ${option.label}` : option.label}
          onPointerDown={event => event.preventDefault()}
          onClick={() => choose(i)}>
          <span>{option.label}</span>{option.value === value && <Check size={16} aria-hidden="true" />}
        </div>
      </div>)}
    </div>}
  </div>;
}
