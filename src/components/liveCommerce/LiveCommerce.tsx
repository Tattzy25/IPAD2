/**
 * commerce/LiveCommerce.tsx — the whole commerce surface, as ONE importable layer.
 *
 * Mount it anywhere inside the host (your App stage, next to the orb/dock):
 *     <LiveCommerce sessionActive={isConnected} onIntent={i => runToolCall(i)} />
 *
 * It owns RENDERING ONLY:
 *   · renders nothing until a tool result arrives (stage 'idle' = invisible)
 *   · renders nothing when the session ends (sessionActive=false → full reset)
 *   · data in:  window.LiveCommerce.ingest(anyResult)  or ref.ingest(...)
 *   · intents out: onIntent(...) — ONLY commerce actions by default; pure UI
 *     navigation (taps, opens, closes) stays silent so the voice agent is
 *     never interrupted. Opt in with emitNavigationIntents.
 *   · voice-readable mirror: window.LiveCommerceState + ref.snapshot()
 *
 * Fixed progression (the only fixed thing):
 *   discovery → detail → options → cartConfirm → cart → checkout → complete
 *
 * Mobile-first: shelf is a 1-row snap carousel on small screens (swipe, never
 * auto-advances — pages only change by human hand), a 4-up grid from md up,
 * and the container hugs however many products actually came back (1, 2, 3…).
 * Everything can be minimized to a pill or cleared with an X at any time.
 */
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';

import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X,
  ShoppingBag, CheckCircle2, Loader2,
} from 'lucide-react';
import type {
  Raw, Stage, View, Product, CartState, CheckoutState, OrderState,
  CommerceIntent, CommerceSnapshot, LiveCommerceHandle, RoutedResult,
} from './types';
import { routeResult } from './route';
import { normalizeProduct, setPriceUnit } from './resolve';

export const PER_PAGE = 4;
const OPT_PREVIEW = 8;      // option chips shown before "Show all N"
const VARIANT_PREVIEW = 6;

export interface LiveCommerceProps {
  /** Intents flow out to the host here (map them to Gemini/tool calls). */
  onIntent?: (intent: CommerceIntent) => void;
  /** Tie the layer to the call: false (hung up) → everything clears. */
  sessionActive?: boolean;
  /** Also emit pure-UI navigation intents (select_product, close, …).
   *  Default false — tapping around must not interrupt the voice agent. */
  emitNavigationIntents?: boolean;
  /** 'auto' (default): integer amounts are minor units (100 → $1.00).
   *  Force 'minor' | 'major' if your platform always sends one kind. */
  priceUnit?: 'auto' | 'minor' | 'major';
  className?: string;
}

/* ── tiny local helpers (no host deps, keeps this mountable anywhere) ───── */
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const initials = (s: string) => s.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || '•';

const NO_SB = 'lc-no-sb';   // hidden scrollbars (injected once below)

function Thumb({ p, className }: { p: Product; className?: string }) {
  const src = p.media[0];
  if (src) return <img src={src} alt="" className={cx('w-full h-full object-cover', className)} />;
  const h = hash(p.title) % 360;
  return (
    <div
      className={cx('w-full h-full grid place-items-center font-extrabold text-zinc-500', className)}
      style={{ background: `linear-gradient(135deg, hsl(${h} 28% 90%), hsl(${(h + 42) % 360} 26% 78%))`, fontSize: 'clamp(14px,3vw,26px)' }}
      aria-hidden
    >{initials(p.title)}</div>
  );
}
function Stars({ rating, reviews }: { rating: number | null; reviews: number | null }) {
  if (rating == null) return null;
  return (
    <div className="flex items-center gap-1 text-[10px] leading-none">
      <span className="relative text-zinc-300 tracking-[1px]">
        ★★★★★
        <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-400" style={{ width: `${(rating / 5) * 100}%` }}>★★★★★</span>
      </span>
      {reviews != null && <span className="text-zinc-500 text-[9px]">({reviews})</span>}
    </div>
  );
}
const Badge = ({ text, tone }: { text: string; tone?: 'sale' | 'new' | 'stock' }) => (
  <span className={cx(
    'absolute top-1.5 left-1.5 z-10 rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold tracking-[0.08em] text-white',
    tone === 'sale' ? 'bg-pink-600' : tone === 'new' ? 'bg-emerald-600' : 'bg-zinc-800/90',
  )}>{text}</span>
);
const badgeTone = (p: Product): 'sale' | 'new' | 'stock' | undefined =>
  p.badge ? (/sale|deal|off/i.test(p.badge) ? 'sale' : /new/i.test(p.badge) ? 'new' : undefined) : undefined;

/* ═══════════════════════════════════════════════════════════════════════ */
const LiveCommerce = forwardRef<LiveCommerceHandle, LiveCommerceProps>(function LiveCommerce(
  { onIntent, sessionActive = true, emitNavigationIntents = false, priceUnit = 'auto', className }, ref,
) {
  const [stage, setStage] = useState<Stage>('discovery');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [active, setActive] = useState<Product | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartState | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState | null>(null);
  const [order, setOrder] = useState<OrderState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pendingAdd, setPendingAdd] = useState(false);
  const lastRaw = useRef<Raw>(null);
  const toastT = useRef<any>(null);
  const onIntentRef = useRef(onIntent);
  onIntentRef.current = onIntent;

  const pages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const emit = useCallback((i: CommerceIntent) => onIntentRef.current?.(i), []);
  /** navigation intents stay silent unless the host explicitly opts in */
  const nav = useCallback((i: CommerceIntent) => { if (emitNavigationIntents) onIntentRef.current?.(i); }, [emitNavigationIntents]);
  const say = useCallback((m: string) => {
    setToast(m); clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /* one-time global stylesheet: hidden scrollbars, no ugly variant scrollbar */
  useEffect(() => {
    if (document.getElementById('lc-style')) return;
    const el = document.createElement('style');
    el.id = 'lc-style';
    el.textContent = `.${NO_SB}{scrollbar-width:none;-ms-overflow-style:none}.${NO_SB}::-webkit-scrollbar{display:none;width:0}`;
    document.head.appendChild(el);
  }, []);

  useEffect(() => { setPriceUnit(priceUnit); }, [priceUnit]);

  /* call ended → commerce clears itself */
  useEffect(() => {
    if (!sessionActive) {
      setStage('discovery'); setProducts([]); setPage(0); setMinimized(false); setActive(null);
      setSelections({}); setShowAll({}); setCart(null); setCheckout(null); setOrder(null);
      setPendingAdd(false); lastRaw.current = null;
    }
  }, [sessionActive]);

  const backFrom = useCallback((s: Stage): Stage => {
    if (s === 'options') return 'detail';
    return 'discovery';
  }, []);

  /* ── data in ─────────────────────────────────────────────────────────── */
  const ingest = useCallback((raw: Raw, hint?: { view?: View }): RoutedResult => {
    const routed = routeResult(raw, hint);
    lastRaw.current = raw;
    switch (routed.view) {
      case 'discovery':
        setProducts(routed.products); setPage(0); setMinimized(false); setStage('discovery');
        break;
      case 'detail':
        setActive(routed.product); setSelections({}); setShowAll({});
        if (routed.product) setStage('detail');
        break;
      case 'cartConfirm':
        setCart(routed.cart); setPendingAdd(false); setStage('cartConfirm');
        break;
      case 'cart':
        setCart(routed.cart); setStage('cart');
        break;
      case 'checkout':
        setCheckout(routed.checkout); setPendingAdd(false); setStage('checkout');
        break;
      case 'complete':
        setOrder(routed.order); setPendingAdd(false); setStage('complete');
        break;
      case 'message':
        if (routed.messages[0]) say(routed.messages[0]);
        break;
      case 'unknown':
        break; // retained in lastRaw / snapshot; nothing rendered
    }
    return routed;
  }, [say]);

  /* ── intents out (touch + voice share this path) ─────────────────────── */
  const act = useCallback((intent: CommerceIntent) => {
    switch (intent.type) {
      case 'select_product': {
        const p = normalizeProduct(intent.raw);
        setActive(p); setSelections({}); setShowAll({}); setStage('detail');
        nav(intent);
        return;
      }
      case 'add_to_cart':
        setPendingAdd(true);
        setTimeout(() => setPendingAdd(false), 10000); // safety net if no result ever arrives
        break;
      case 'open_cart':
        if (cart) setStage('cart');
        nav(intent);
        return;
      case 'continue_browsing':
        setStage('discovery');
        nav(intent);
        return;
      case 'close':
        setStage(backFrom(stage));
        nav(intent);
        return;
      default:
        break; // update_qty / remove_line / refresh_cart / checkout / checkout_action: host-side
    }
    emit(intent); // commerce intents only
  }, [cart, stage, backFrom, emit, nav]);

  const reset = useCallback(() => {
    setStage('discovery'); setProducts([]); setPage(0); setMinimized(false); setActive(null);
    setSelections({}); setShowAll({}); setCart(null); setCheckout(null); setOrder(null);
    setPendingAdd(false); lastRaw.current = null;
  }, []);

  const clearResults = useCallback(() => {
    setProducts([]); setPage(0); setMinimized(false);
    setStage('discovery');
  }, []);

  const matchedVariant = useMemo(() => {
    if (!active?.variants.length) return null;
    const keys = Object.keys(selections);
    if (!keys.length) return null;
    return active.variants.find(v => keys.every(k => v.options[k] === selections[k])) ?? null;
  }, [active, selections]);

  const snapshot = useCallback((): CommerceSnapshot => ({
    stage,
    minimized,
    resultCount: products.length,
    page: page + 1,
    pages,
    activeProduct: active ? { id: active.id, title: active.title, seller: active.seller, priceLabel: matchedVariant?.priceLabel ?? active.priceLabel } : null,
    selectedOptions: selections,
    selectedVariant: matchedVariant ? { id: matchedVariant.id, label: matchedVariant.label } : null,
    cart: cart ? {
      lines: cart.lines.length,
      units: cart.lines.reduce((n, l) => n + (l.qty ?? 1), 0),
      totals: cart.totals, messages: cart.messages,
    } : null,
    checkout: checkout ? { mode: checkout.mode, url: checkout.url } : null,
    order: order ? { id: order.id, message: order.message } : null,
    lastRaw: lastRaw.current,
  }), [stage, minimized, products.length, page, pages, active, selections, matchedVariant, cart, checkout, order]);

  useImperativeHandle(ref, () => ({ ingest, act, snapshot, reset }), [ingest, act, snapshot, reset]);

  /* global bridges: any layer (Gemini hook, iPad postMessage, devtools) can drive it */
  useEffect(() => {
    const w = window as any;
    w.LiveCommerce = { ingest, act, snapshot, reset };
    return () => { if (w.LiveCommerce?.ingest === ingest) delete w.LiveCommerce; };
  }, [ingest, act, snapshot, reset]);
  useEffect(() => { (window as any).LiveCommerceState = snapshot(); });

  /* Esc = back/close whatever sheet is open (never traps the buyer) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (stage === 'detail' || stage === 'options' || stage === 'cart' || stage === 'cartConfirm') {
        act({ type: 'close' });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [stage, act]);

  useEffect(() => { clearTimeout(toastT.current); }, []);

  if (!sessionActive) return null; // hung up → the layer is gone, fully

  /* ── render ─────────────────────────────────────────────────────────── */
  const slice = products.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const detailPrice = matchedVariant?.priceLabel ?? active?.priceLabel ?? null;
  const detailMedia = matchedVariant?.media[0] ?? active?.media[0] ?? null;
  const detailAvail = matchedVariant?.availability ?? active?.availability ?? null;

  const openDetail = (p: Product) => {
    setActive(p); setSelections({}); setShowAll({}); setStage('detail');
    nav({ type: 'select_product', raw: p.raw }); // silent by default
  };

  const card = (p: Product) => (
    <button
      key={p.id} type="button" onClick={() => openDetail(p)}
      className="relative flex w-[58vw] max-w-[240px] shrink-0 snap-center flex-col gap-1 rounded-xl bg-zinc-50 p-1.5 text-left text-zinc-900 transition-transform hover:-translate-y-0.5 active:scale-[0.98] md:w-auto md:max-w-none md:shrink"
    >
      {p.badge && <Badge text={p.badge} tone={badgeTone(p)} />}
      <span className="aspect-square w-full overflow-hidden rounded-lg bg-zinc-200"><Thumb p={p} /></span>
      <span className="line-clamp-2 min-h-[2.5em] text-[11px] font-semibold leading-tight">{p.title}</span>
      {p.seller
        ? <span className="truncate text-[9.5px] text-zinc-500">{p.seller}</span>
        : <span className="truncate text-[9.5px] text-zinc-400/70">&nbsp;</span>}
      <Stars rating={p.rating} reviews={p.reviews} />
      <span className="mt-auto flex items-baseline gap-1.5">
        <span className="text-xs font-extrabold">{p.priceLabel ?? '—'}</span>
        {p.compareLabel && <s className="text-[10px] text-zinc-400">{p.compareLabel}</s>}
      </span>
    </button>
  );

  return (
    <div className={cx('pointer-events-none absolute inset-0 z-30 text-zinc-100', className)} data-stage={stage}>

      {/* ── 1 · DISCOVERY — mobile: 1-row snap carousel · md+: 4-up grid ── */}
      <AnimatePresence>
        {stage === 'discovery' && !minimized && (
          <motion.div
            key="shelf" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="pointer-events-auto absolute bottom-20 left-1/2 -translate-x-1/2 w-fit max-w-[min(94%,880px)] rounded-2xl border border-white/15 bg-black/80 p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-white/85">
                <i className="h-[7px] w-[7px] animate-pulse rounded-full bg-red-500" />RESULTS
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[10.5px] tracking-[0.08em] text-white/55">
                  <span className="md:hidden">{products.length} items</span>
                  <span className="hidden md:inline">{products.length} items · page {page + 1}/{pages}</span>
                </span>
                <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize results"
                  className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20">
                  <ChevronDown size={13} />
                </button>
                <button type="button" onClick={clearResults} aria-label="Clear results"
                  className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20">
                  <X size={12} />
                </button>
              </span>
            </div>

            {/* 1 row on phones (swipe), grid of exactly N columns on md+ so the
                container hugs 1/2/3 products — no empty black slots, ever */}
            <div
              className={cx('flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 md:grid md:snap-none md:overflow-visible md:pb-0', NO_SB)}
              style={{ gridTemplateColumns: `repeat(${slice.length}, minmax(0, 1fr))` }}
            >
              {slice.map(card)}
            </div>

            <div className="hidden items-center justify-center gap-3.5 pt-2 md:flex">
              <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30" aria-label="Previous 4 products">
                <ChevronLeft size={13} />
              </button>
              <span className="flex gap-1.5">
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} type="button" onClick={() => setPage(i)} aria-label={`Page ${i + 1}`}
                    className={cx('h-1.5 rounded-full transition-all', i === page ? 'w-4 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/60')} />
                ))}
              </span>
              <button type="button" disabled={page >= pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
                className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30" aria-label="Next 4 products">
                <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'discovery' && minimized && (
          <motion.div key="shelf-pill" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
            className="pointer-events-auto absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/85 py-2 pl-4 pr-2 backdrop-blur-xl">
            <button type="button" onClick={() => setMinimized(false)}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] text-white/85">
              <ChevronUp size={13} />RESULTS · {products.length}
            </button>
            <button type="button" onClick={clearResults} aria-label="Clear results"
              className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20">
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2/3 · PRODUCT DETAIL → OPTION/VARIANT SELECTION ──────────────── */}
      <AnimatePresence>
        {(stage === 'detail' || stage === 'options') && active && (
          <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/60 p-4 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) act({ type: 'close' }); }}>
            <motion.div
              initial={{ scale: 0.92, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="flex max-h-[88%] w-[min(94%,430px)] flex-col overflow-hidden rounded-3xl bg-zinc-50 text-zinc-900 shadow-2xl"
            >
              {/* sticky header: close is always reachable, never scrolled away */}
              <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                <button type="button" onClick={() => act({ type: 'close' })} aria-label={stage === 'options' ? 'Back to product' : 'Close product'}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-200 hover:bg-zinc-300">
                  {stage === 'options' ? <ChevronLeft size={16} /> : <X size={16} />}
                </button>
                <span className="truncate text-[11px] font-semibold text-zinc-500">{active.seller ?? ''}</span>
                {stage === 'options' ? (
                  <button type="button" onClick={() => setStage('detail')}
                    className="shrink-0 rounded-full bg-zinc-200 px-3 py-1.5 text-[10px] font-bold text-zinc-600 hover:bg-zinc-300">Product</button>
                ) : (active.options.length > 0 || active.variants.length > 0) ? (
                  <button type="button" onClick={() => setStage('options')}
                    className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-zinc-800">
                    Options · {active.options.length || active.variants.length}
                  </button>
                ) : <span className="w-8" />}
              </div>

              <div className={cx('flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-3 pt-3', NO_SB)}>
                <div className="relative max-h-[36vh] w-full shrink-0 overflow-hidden rounded-2xl bg-zinc-200 md:max-h-none md:aspect-[4/3]">
                  {active.badge && <Badge text={active.badge} tone={badgeTone(active)} />}
                  {detailMedia
                    ? <img src={detailMedia} alt="" className="h-full w-full object-cover" />
                    : <Thumb p={active} />}
                </div>

                <div>
                  <h2 className="text-base font-extrabold leading-snug">{active.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Stars rating={active.rating} reviews={active.reviews} />
                    {detailAvail && <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[9.5px] font-bold text-zinc-600">{detailAvail}</span>}
                    {active.deliveryLabel && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700">{active.deliveryLabel}</span>}
                  </div>
                </div>

                {active.description && <p className="text-xs leading-relaxed text-zinc-600">{active.description}</p>}

                {stage === 'options' && (
                  <div className="flex flex-col gap-3">
                    {active.options.map(g => {
                      const open = !!showAll[g.id];
                      const vals = open ? g.values : g.values.slice(0, OPT_PREVIEW);
                      return (
                        <div key={g.id}>
                          <div className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-500">
                            {g.label}{selections[g.label] ? `: ${selections[g.label]}` : ''}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {vals.map(v => (
                              <button key={v.label} type="button"
                                disabled={v.available === false}
                                onClick={() => setSelections(s => ({ ...s, [g.label]: v.label }))}
                                className={cx(
                                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                  selections[g.label] === v.label ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100',
                                  v.available === false && 'opacity-40 line-through',
                                )}>
                                {v.label}{v.priceLabel ? ` · ${v.priceLabel}` : ''}
                              </button>
                            ))}
                          </div>
                          {g.values.length > OPT_PREVIEW && (
                            <button type="button" onClick={() => setShowAll(s => ({ ...s, [g.id]: !open }))}
                              className="mt-1.5 text-[10px] font-bold text-zinc-500 underline hover:text-zinc-800">
                              {open ? 'Show fewer' : `Show all ${g.values.length} ${g.label.toLowerCase()}s`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {active.variants.length > 0 && (() => {
                      const open = !!showAll.__variants;
                      const list = open ? active.variants : active.variants.slice(0, VARIANT_PREVIEW);
                      return (
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-zinc-500">Variants</div>
                          {list.map(v => (
                            <button key={v.id} type="button"
                              onClick={() => setSelections(v.options)}
                              className={cx(
                                'flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs',
                                matchedVariant?.id === v.id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100',
                              )}>
                              <span className="font-semibold">{v.label}</span>
                              <span className="flex items-center gap-2">
                                {v.availability && <span className="opacity-70">{v.availability}</span>}
                                <span className="font-extrabold">{v.priceLabel ?? ''}</span>
                              </span>
                            </button>
                          ))}
                          {active.variants.length > VARIANT_PREVIEW && (
                            <button type="button" onClick={() => setShowAll(s => ({ ...s, __variants: !open }))}
                              className="mt-0.5 text-[10px] font-bold text-zinc-500 underline hover:text-zinc-800">
                              {open ? 'Show fewer' : `Show all ${active.variants.length} variants`}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* sticky footer: price + add never scroll away */}
              <div className="flex items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="text-lg font-black">{detailPrice ?? '—'}</span>
                <button type="button" disabled={pendingAdd}
                  onClick={() => act({ type: 'add_to_cart', raw: active.raw, variantRaw: matchedVariant?.raw ?? null, selectedOptions: selections })}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-extrabold text-white hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60">
                  {pendingAdd ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                  {pendingAdd ? 'Adding…' : 'Add to bag'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 7 · ORDER COMPLETION ────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === 'complete' && order && (
          <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className={cx('flex w-[min(92%,400px)] flex-col items-center gap-3 overflow-y-auto rounded-3xl bg-zinc-50 p-6 text-center text-zinc-900 shadow-2xl max-h-[86%]', NO_SB)}>
              <CheckCircle2 size={44} className="text-emerald-500" />
              <h2 className="text-lg font-black">Order complete</h2>
              {order.id && <div className="rounded-full bg-zinc-200 px-3 py-1 font-mono text-[11px] font-bold text-zinc-700">{order.id}</div>}
              {order.message && <p className="text-xs leading-relaxed text-zinc-600">{order.message}</p>}
              {order.details.length > 0 && (
                <div className="w-full flex-col gap-1 rounded-2xl bg-zinc-100 p-3">
                  {order.details.map(d => (
                    <div key={d.label} className="flex justify-between text-[11px] text-zinc-600">
                      <span>{d.label}</span><b className="text-zinc-900">{d.display}</b>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => act({ type: 'continue_browsing' })}
                className="mt-1 w-full rounded-xl bg-zinc-900 py-3 text-sm font-extrabold text-white hover:bg-zinc-800">
                Back to call
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── toast (merchant messages) ───────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default LiveCommerce;
