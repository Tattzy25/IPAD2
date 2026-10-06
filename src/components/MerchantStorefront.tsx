import React from 'react';
import { ShoppingBag, ShieldCheck, ArrowRight, CheckCircle2, Headphones, Sparkles, HelpCircle } from 'lucide-react';
import { FlowchartNodeId, CartData, CartItem } from '../types/flowchart';
import { PRODUCTS, ProductItem } from './ProductCards';

interface MerchantStorefrontProps {
  currentNode: FlowchartNodeId;
  cart: CartData;
  onOpenWidget: () => void;
  onEngage: (mode: 'chat' | 'voice' | 'video') => void;
  onSelectProduct: (product: ProductItem) => void;
  onAskHelp: (needsHelp: boolean) => void;
  isWidgetOpen: boolean;
}

export const MerchantStorefront: React.FC<MerchantStorefrontProps> = ({
  currentNode,
  cart,
  onOpenWidget,
  onEngage,
  onSelectProduct,
  onAskHelp,
  isWidgetOpen,
}) => {
  const isCheckoutStage = ['Y', 'Z', 'AA', 'AC'].includes(currentNode);
  const isComplete = currentNode === 'AC';

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-y-auto select-none relative font-sans">
      {/* Merchant Header */}
      <header className="w-full h-14 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between px-5 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-sm">
            N
          </div>
          <div>
            <span className="text-sm font-extrabold tracking-tight text-white">NEURA STORE</span>
            <span className="text-[10px] text-neutral-400 block -mt-0.5">Spatial Commerce & Audio Labs</span>
          </div>
        </div>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
          <span className="text-white hover:text-white cursor-pointer">Store</span>
          <span className="hover:text-white cursor-pointer">Audio</span>
          <span className="hover:text-white cursor-pointer">VisionOS</span>
          <span className="hover:text-white cursor-pointer">Accessories</span>
          <span className="hover:text-white cursor-pointer">Support</span>
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenWidget}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ask AI Agent</span>
          </button>

          <div className="relative flex items-center">
            <button
              type="button"
              onClick={onOpenWidget}
              className="p-2 rounded-full bg-neutral-800 text-neutral-200 hover:text-white transition cursor-pointer relative"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.items.reduce((acc, curr) => acc + curr.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      {isCheckoutStage ? (
        /* Node Y, Z, AA, AC: Merchant Checkout Page */
        <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10 flex flex-col justify-between">
          <div className="flex flex-col gap-6">
            {/* Top Breadcrumb & Indicator */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-neutral-200">
                  {isComplete ? 'Order Confirmation' : 'Merchant Secure Checkout'}
                </span>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded border border-neutral-700">
                  store.anigok.com/checkouts
                </span>
              </div>

              {/* Status node pill */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Widget Minimized • Session Active</span>
              </div>
            </div>

            {isComplete ? (
              /* Order Completed screen (Node AC) */
              <div className="p-8 rounded-3xl bg-neutral-900 border border-emerald-500/30 flex flex-col items-center text-center gap-4 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Order Confirmed: #AN-88942</h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-md">
                    Thank you! Your order has been securely processed. A confirmation has been sent to your email.
                  </p>
                </div>

                <div className="w-full max-w-md bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-left text-xs flex flex-col gap-2">
                  <div className="flex justify-between text-neutral-400">
                    <span>Payment Method:</span>
                    <span className="font-semibold text-white">Apple Pay (••• 4242)</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Estimated Delivery:</span>
                    <span className="font-semibold text-emerald-400">Tomorrow by 10:30 AM</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Total Paid:</span>
                    <span className="font-bold text-white">${cart.total > 0 ? cart.total.toFixed(2) : '430.83'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => onAskHelp(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask Agent for Delivery Tracking
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form (Node Y, Z, AA) */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left: Express Checkout & Customer Details */}
                <div className="md:col-span-7 flex flex-col gap-5">
                  <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-3">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Express Checkout
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onAskHelp(false)}
                        className="py-2.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition cursor-pointer shadow"
                      >
                        <span>Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onAskHelp(false)}
                        className="py-2.5 rounded-xl bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-300 transition cursor-pointer shadow"
                      >
                        <span>PayPal</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-3 text-xs">
                    <span className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                      Shipping Information
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        readOnly
                        value="Alex"
                        className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300"
                        placeholder="First name"
                      />
                      <input
                        type="text"
                        readOnly
                        value="Mercer"
                        className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300"
                        placeholder="Last name"
                      />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value="742 Evergreen Terrace, Suite 400"
                      className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300"
                      placeholder="Address"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        readOnly
                        value="San Francisco"
                        className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300"
                      />
                      <input
                        type="text"
                        readOnly
                        value="CA"
                        className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300"
                      />
                      <input
                        type="text"
                        readOnly
                        value="94107"
                        className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300"
                      />
                    </div>
                  </div>

                  {/* Node AA Action Trigger: Customer needs help? */}
                  <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-neutral-200">Have questions about your order?</div>
                        <div className="text-[11px] text-neutral-400">
                          Your live shopping assistant is still active in the background.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onAskHelp(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition cursor-pointer flex-shrink-0 shadow"
                    >
                      Ask Agent
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAskHelp(false)}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-sm tracking-wide transition active:scale-98 shadow-xl cursor-pointer"
                  >
                    Complete Order (${cart.total > 0 ? cart.total.toFixed(2) : '430.83'})
                  </button>
                </div>

                {/* Right: Order Summary */}
                <div className="md:col-span-5 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col gap-4 text-xs h-fit">
                  <span className="font-bold text-neutral-300 uppercase tracking-wider text-[11px]">
                    Order Summary ({cart.items.length || 1} items)
                  </span>

                  <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                    {(cart.items.length > 0 ? cart.items : [PRODUCTS[0]]).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <img
                          src={'image' in item ? item.image : (item as any).media?.[0]}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-800 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{item.title}</div>
                          <div className="text-[11px] text-neutral-400">
                            Qty: {'qty' in item ? item.qty : 1}
                          </div>
                        </div>
                        <span className="font-bold text-white">{'price' in item ? item.price : '$398.00'}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-neutral-800 pt-3 flex flex-col gap-1.5 text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium text-neutral-200">
                        ${cart.subtotal > 0 ? cart.subtotal.toFixed(2) : '398.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Tax (8.25%)</span>
                      <span className="font-medium text-neutral-200">
                        ${cart.tax > 0 ? cart.tax.toFixed(2) : '32.83'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Express Shipping</span>
                      <span className="font-semibold text-emerald-400">FREE</span>
                    </div>
                    <div className="border-t border-neutral-800 pt-2 mt-1 flex justify-between text-sm font-extrabold text-white">
                      <span>Total Due</span>
                      <span>${cart.total > 0 ? cart.total.toFixed(2) : '430.83'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Normal Storefront Browse View */
        <div className="flex-1 flex flex-col gap-8 pb-24">
          {/* Hero Banner */}
          <div className="relative w-full overflow-hidden bg-gradient-to-b from-neutral-900 to-neutral-950 py-12 px-6 text-center border-b border-neutral-800/80">
            <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                Next-Gen Conversational Shopping
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Discover the 2027 Spatial Audio & Tech Collection
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-lg">
                Engage the live assistant widget below via Chat, Voice call, or FaceTime video for instant catalog
                recommendations and checkout assistance.
              </p>

              {/* Engagement Trigger Shortcuts matching Node C */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => onEngage('voice')}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-neutral-200 transition shadow cursor-pointer flex items-center gap-2"
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                  Voice Call Starts
                </button>
                <button
                  type="button"
                  onClick={() => onEngage('chat')}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition border border-neutral-700 cursor-pointer flex items-center gap-2"
                >
                  <span>Chat Opens</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEngage('video')}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition border border-neutral-700 cursor-pointer flex items-center gap-2"
                >
                  <span>Video or FaceTime</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid Showcase */}
          <div className="max-w-6xl mx-auto px-6 w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Trending Innovations</h2>
                <p className="text-xs text-neutral-400">Click any product to trigger agent catalog inspection</p>
              </div>
              <span className="text-xs text-neutral-400 font-semibold">{PRODUCTS.length} Featured Products</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {PRODUCTS.map((product) => (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="rounded-2xl bg-neutral-900 border border-neutral-800 p-2.5 flex flex-col gap-2 hover:border-neutral-600 transition group cursor-pointer shadow-sm hover:-translate-y-1 duration-150"
                >
                  <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-800 relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="flex flex-col flex-1 justify-between">
                    <h3 className="text-xs font-bold text-neutral-200 line-clamp-1 group-hover:text-white">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-black text-white">{product.price}</span>
                      <span className="text-[10px] text-amber-400 font-bold">★ {product.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantStorefront;
