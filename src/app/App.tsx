import { useState, useEffect, useRef, createContext, useContext } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { Toaster, toast } from "sonner";
import {
  Menu, X, ShoppingBag, Heart, Star, ArrowRight,
  Phone, Mail, MapPin, ChevronDown, Package, Truck, CreditCard,
  Shield, CheckCircle, Plus, Minus, Trash2, Clock, Instagram,
  Send, Zap, RefreshCw, Check, ChevronLeft,
} from "lucide-react";

import logoImg from "@/imports/Vallabh_Jewels_Transparent.png";
import pearlImg from "@/imports/ChatGPT_Image_Jun_10__2026__02_58_08_PM.png";
import heartImg from "@/imports/ChatGPT_Image_Jun_10__2026__03_25_26_PM.png";
import butterflyImg from "@/imports/ChatGPT_Image_Jun_8__2026__06_13_30_PM.png";
import ringImg from "@/imports/ChatGPT_Image_Jun_10__2026__03_55_57_PM.png";

// ── Types ──────────────────────────────────────────────────────────────────
type Page = "home" | "product" | "checkout" | "confirmation" | "track";
type Product = {
  id: number; name: string; subtitle: string; description: string;
  price: number; originalPrice: number; category: string; image: string;
  badge: string; badgeColor: string; stock: number; rating: number; reviews: number; care: string;
};
type CartItem = { product: Product; qty: number };
type DeliveryForm = { name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string };
type OrderData = { id: string; items: CartItem[]; delivery: DeliveryForm; payment: "prepaid" | "cod"; total: number; placed: Date };
type AppCtx = {
  page: Page; setPage: (p: Page) => void;
  cart: CartItem[]; addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: number) => void; updateQty: (id: number, q: number) => void;
  cartTotal: number; cartCount: number; clearCart: () => void;
  cartOpen: boolean; setCartOpen: (v: boolean) => void;
  selectedProduct: Product | null; setSelectedProduct: (p: Product | null) => void;
  order: OrderData | null; setOrder: (o: OrderData) => void;
  wishlist: number[]; toggleWishlist: (id: number) => void;
};

// ── Data ───────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, name: "Pearl Seashell Necklace", subtitle: "Rose gold oceanic pendant", description: "A delicate rose gold chain holding a shimmering seashell pendant with a lustrous freshwater pearl nestled inside. Crafted with premium rose gold plating and precision-set CZ accents. Perfect for the romantic soul who loves ocean-inspired elegance.", price: 349, originalPrice: 499, category: "Necklace", image: pearlImg, badge: "Bestseller", badgeColor: "#CFA18D", stock: 3, rating: 4.9, reviews: 128, care: "Avoid water and perfume. Wipe with a soft dry cloth after use. Store in the included gift box when not wearing." },
  { id: 2, name: "Petite Heart Necklace", subtitle: "Minimalist rose gold charm", description: "A beautifully simple rose gold heart pendant on a dainty delicate chain. Timeless, minimal, and deeply meaningful — the perfect everyday piece or a heartfelt gift for someone you cherish.", price: 299, originalPrice: 399, category: "Necklace", image: heartImg, badge: "New Arrival", badgeColor: "#059669", stock: 8, rating: 4.8, reviews: 94, care: "Keep away from water, sweat, and perfume. Polish gently with a soft cloth. Store separately to avoid scratches." },
  { id: 3, name: "Butterfly Bloom Necklace", subtitle: "Gold butterfly, crystal wings", description: "A graceful gold butterfly with sparkling crystal wings, paired with a tiny floral accent. This piece celebrates freedom and feminine beauty in every movement. Rose gold plated with anti-tarnish coating.", price: 309, originalPrice: 449, category: "Necklace", image: butterflyImg, badge: "Trending", badgeColor: "#7C3AED", stock: 5, rating: 4.9, reviews: 112, care: "Avoid contact with water, chemicals, and perfumes. Wipe clean with a dry cloth. Store in gift box provided." },
  { id: 4, name: "Infinity Spark Ring", subtitle: "Sterling silver with CZ stones", description: "An elegant infinity-shaped band set with brilliant cubic zirconia stones that catch the light beautifully. Symbolising endless love and infinite possibilities — a meaningful everyday ring that complements every look.", price: 160, originalPrice: 250, category: "Ring", image: ringImg, badge: "Staff Pick", badgeColor: "#0891B2", stock: 12, rating: 4.7, reviews: 76, care: "Remove before washing hands, swimming, or exercising. Clean with a soft cloth. Avoid harsh chemicals." },
];

const TESTIMONIALS = [
  { id: 1, name: "Priya Sharma", city: "Mumbai", rating: 5, text: "Absolutely stunning! The Pearl Seashell Necklace arrived beautifully packaged and exceeded all my expectations. The quality feels genuinely luxurious for the price.", order: "Pearl Seashell Necklace", verified: true },
  { id: 2, name: "Anjali Mehta", city: "Delhi", rating: 5, text: "I ordered the Butterfly Bloom Necklace for my anniversary — it was perfect. Fast delivery, beautiful packaging, and it looked even better in person!", order: "Butterfly Bloom Necklace", verified: true },
  { id: 3, name: "Sneha Patel", city: "Ahmedabad", rating: 5, text: "My go-to for jewellery gifting. The Heart Necklace was delicate and premium. My sister absolutely loved it. Will definitely order again!", order: "Petite Heart Necklace", verified: true },
  { id: 4, name: "Riya Desai", city: "Surat", rating: 5, text: "The Infinity Ring fits beautifully and catches so much light. I receive compliments every time I wear it. Shri Vallabh Jewels never disappoints!", order: "Infinity Spark Ring", verified: true },
];

const FAQS = [
  { q: "How long does delivery take?", a: "Orders are typically delivered within 5–7 business days across India. Express delivery (2–3 days) is available at checkout for select pin codes." },
  { q: "Why is COD ₹49 more expensive?", a: "Cash on Delivery orders incur a ₹49 handling fee to cover packaging and secure verification costs. Choose any prepaid method (UPI, Cards, Net Banking) to get FREE delivery!" },
  { q: "What is the return policy?", a: "We offer a 7-day easy return policy. Contact us within 7 days of delivery with photos, and we will arrange a free replacement or full refund — no questions asked." },
  { q: "Why is OTP required for COD?", a: "OTP verification helps us ensure genuine orders, protect our customers, and deliver faster. It also helps us eliminate fake or incomplete addresses that cause delivery failures." },
  { q: "Are the pieces nickel-free and skin-safe?", a: "Yes! All our jewellery is nickel-free, lead-free, and cadmium-free. Made with premium anti-tarnish coating. Safe for sensitive skin and daily wear." },
  { q: "Do you offer gift wrapping?", a: "Every single order ships in our signature champagne gift box at absolutely no extra cost. Personalised handwritten message cards are available on request." },
  { q: "How do I track my order?", a: "Once your order ships, you'll receive a tracking link via SMS and WhatsApp. You can also enter your Order ID on our Track Order page anytime." },
  { q: "Can I cancel or modify my order?", a: "Orders can be cancelled or modified within 12 hours of placing. Contact us via WhatsApp at +91 7801949426 as soon as possible after placing." },
];

const RECENT_ORDERS = [
  { name: "Priya S.", city: "Mumbai", product: "Pearl Seashell Necklace" },
  { name: "Anjali M.", city: "Delhi", product: "Butterfly Bloom Necklace" },
  { name: "Sneha P.", city: "Ahmedabad", product: "Petite Heart Necklace" },
  { name: "Kavya R.", city: "Bangalore", product: "Infinity Spark Ring" },
  { name: "Divya K.", city: "Pune", product: "Pearl Seashell Necklace" },
  { name: "Pooja S.", city: "Chennai", product: "Butterfly Bloom Necklace" },
];

// ── Context ────────────────────────────────────────────────────────────────
const Ctx = createContext<AppCtx>(null!);
const useApp = () => useContext(Ctx);

// ── Hooks ──────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold });
    io.observe(el); return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useCountdown() {
  const end = useRef(Date.now() + (5 * 3600 + 47 * 60 + 23) * 1000);
  const [t, setT] = useState({ h: 5, m: 47, s: 23 });
  useEffect(() => {
    const iv = setInterval(() => {
      const d = Math.max(0, end.current - Date.now());
      setT({ h: Math.floor(d / 3.6e6), m: Math.floor((d % 3.6e6) / 6e4), s: Math.floor((d % 6e4) / 1e3) });
    }, 1000);
    return () => clearInterval(iv);
  }, []);
  return t;
}

// ── Utility Components ─────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={className}>
      <motion.div initial={{ opacity: 0, y: 32 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}>
        {children}
      </motion.div>
    </div>
  );
}

function STitle({ eyebrow, title, subtitle, center = true }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`mb-12 ${center ? "text-center" : ""}`}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.3em] mb-3 font-bold" style={{ color: "#CFA18D" }}>{eyebrow}</p>}
        <h2 className="text-4xl md:text-5xl leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{title}</h2>
        {subtitle && <p className="text-[15px] leading-relaxed max-w-lg" style={{ color: "#8C7B6B", ...(center ? { margin: "0 auto" } : {}) }}>{subtitle}</p>}
        <div className={`mt-4 h-px w-14 ${center ? "mx-auto" : ""}`} style={{ background: "linear-gradient(90deg, transparent, #CFA18D, #E8DCC8)" }} />
      </motion.div>
    </div>
  );
}

function StockIndicator({ stock }: { stock: number }) {
  if (stock <= 3) return <p className="text-[11px] font-bold animate-pulse" style={{ color: "#DC2626" }}>🔴 Only {stock} left — Order now!</p>;
  if (stock <= 7) return <p className="text-[11px] font-semibold" style={{ color: "#D97706" }}>⚠️ Low stock — {stock} remaining</p>;
  return <p className="text-[11px]" style={{ color: "#059669" }}>✅ In Stock</p>;
}

function OTPInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const handle = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const next = [...value]; next[i] = v.slice(-1); onChange(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const keydown = (i: number, e: React.KeyboardEvent) => { if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus(); };
  const paste = (e: React.ClipboardEvent) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (d.length === 6) { onChange(d.split("")); e.preventDefault(); }
  };
  return (
    <div className="flex gap-2.5 justify-center">
      {value.map((digit, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" maxLength={1} value={digit}
          onChange={e => handle(i, e.target.value)} onKeyDown={e => keydown(i, e)} onPaste={i === 0 ? paste : undefined}
          className="w-11 h-12 text-center text-lg font-bold rounded-xl outline-none transition-all"
          style={{ border: digit ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.5)", background: "#FCFBF8", color: "#3D2B1F" }} />
      ))}
    </div>
  );
}

// ── ProductCard ────────────────────────────────────────────────────────────
function ProductCard({ product, delay = 0 }: { product: Product; delay?: number }) {
  const { addToCart, setSelectedProduct, setPage, wishlist, toggleWishlist } = useApp();
  const { ref: revealRef, visible } = useReveal();
  const cardRef = useRef<HTMLDivElement>(null);
  const wished = wishlist.includes(product.id);

  const tilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `perspective(1200px) rotateX(${((e.clientY - r.top) / r.height - 0.5) * -8}deg) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 8}deg) translateZ(10px)`;
    el.style.boxShadow = "0 24px 60px rgba(207,161,141,0.28), 0 4px 16px rgba(61,43,31,0.08)";
  };
  const reset = () => {
    const el = cardRef.current; if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0) rotateY(0) translateZ(0)";
    el.style.boxShadow = "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)";
  };

  return (
    <div ref={revealRef} className="group h-full">
      <motion.div initial={{ opacity: 0, y: 48 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }} className="h-full">
        <div ref={cardRef} onMouseMove={tilt} onMouseLeave={reset} className="relative bg-card rounded-2xl overflow-hidden h-full flex flex-col"
          style={{ boxShadow: "0 4px 20px rgba(207,161,141,0.1), 0 1px 4px rgba(61,43,31,0.04)", border: "1px solid rgba(203,184,169,0.22)", transition: "box-shadow 0.3s ease, transform 0.14s ease" }}>
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: product.badgeColor, color: "#fff", backdropFilter: "blur(8px)" }}>
            {product.badge}
          </div>
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡"); }}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: "rgba(252,251,248,0.92)", border: "1px solid rgba(203,184,169,0.2)" }}>
            <Heart size={13} className={wished ? "fill-rose-400 text-rose-400" : "text-[#8C7B6B]"} />
          </button>
          <button onClick={() => { setSelectedProduct(product); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="relative overflow-hidden cursor-pointer" style={{ paddingTop: "100%", background: "#EFE7DD" }}>
            <div className="absolute inset-0">
              <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]" />
            </div>
          </button>
          <div className="p-5 flex flex-col flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-1" style={{ color: "#CFA18D" }}>{product.category}</p>
            <button onClick={() => { setSelectedProduct(product); setPage("product"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-left text-[15px] leading-snug mb-1.5 hover:underline" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F", fontWeight: 500 }}>
              {product.name}
            </button>
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={10} className={i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />)}</div>
              <span className="text-[10px]" style={{ color: "#8C7B6B" }}>({product.reviews})</span>
            </div>
            <div className="mb-3"><StockIndicator stock={product.stock} /></div>
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold" style={{ color: "#CFA18D" }}>₹{product.price}</span>
                <span className="text-xs line-through" style={{ color: "#CBB8A9" }}>₹{product.originalPrice}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(207,161,141,0.12)", color: "#CFA18D" }}>
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </div>
            </div>
            <button onClick={() => { addToCart(product); toast.success("Added to bag ✦", { description: product.name }); }}
              className="mt-3 w-full py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 2px 10px rgba(207,161,141,0.4)" }}>
              Add to Bag
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Loading Screen ─────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ background: "#F8F6F2" }}
      exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
      <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full opacity-25" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", transform: "scale(2)", filter: "blur(20px)" }} />
          <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="w-36 h-auto object-contain relative" />
        </div>
        <motion.div initial={{ width: 0 }} animate={{ width: "160px" }} transition={{ duration: 1.6, delay: 0.3 }} className="h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, #CFA18D, #E8DCC8)" }} />
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-[11px] uppercase tracking-[0.35em]" style={{ color: "#8C7B6B" }}>
          Timeless Elegance
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ── Cart Drawer ────────────────────────────────────────────────────────────
function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, cartTotal, setPage } = useApp();
  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]" style={{ background: "rgba(61,43,31,0.35)", backdropFilter: "blur(4px)" }}
            onClick={() => setCartOpen(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm flex flex-col"
            style={{ background: "#FCFBF8", boxShadow: "-8px 0 48px rgba(61,43,31,0.14)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(203,184,169,0.3)" }}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={17} style={{ color: "#CFA18D" }} />
                <span className="font-bold text-[15px]" style={{ color: "#3D2B1F" }}>My Bag</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "#CFA18D", color: "#fff" }}>
                  {cart.reduce((s, i) => s + i.qty, 0)}
                </span>
              </div>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" style={{ color: "#5A4035" }}>
                <X size={16} />
              </button>
            </div>

            <div className="mx-4 mt-3 px-3 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold"
              style={{ background: "linear-gradient(135deg, rgba(207,161,141,0.15), rgba(232,220,200,0.2))", color: "#CFA18D", border: "1px solid rgba(207,161,141,0.2)" }}>
              <Zap size={12} /> Save ₹49 — choose Prepaid at checkout for FREE delivery!
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(207,161,141,0.1)" }}>
                    <ShoppingBag size={28} style={{ color: "rgba(203,184,169,0.6)" }} />
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: "#5A4035" }}>Your bag is empty</p>
                    <p className="text-xs" style={{ color: "#8C7B6B" }}>Add some beautiful pieces!</p>
                  </div>
                  <button onClick={() => setCartOpen(false)} className="px-6 py-2.5 rounded-full text-sm font-bold"
                    style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                    Shop Now
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 p-3 rounded-xl" style={{ background: "#F8F6F2", border: "1px solid rgba(203,184,169,0.2)" }}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#EFE7DD" }}>
                      <ImageWithFallback src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-snug truncate" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>{item.product.name}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: "#CFA18D" }}>₹{item.product.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1px solid rgba(203,184,169,0.4)" }}>
                          <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Minus size={10} /></button>
                          <span className="w-7 text-center text-xs font-bold" style={{ color: "#3D2B1F" }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Plus size={10} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors" style={{ color: "#DC2626" }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(203,184,169,0.3)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#8C7B6B" }}>Subtotal</span>
                  <span className="text-base font-bold" style={{ color: "#3D2B1F" }}>₹{cartTotal}</span>
                </div>
                <div className="text-[11px] py-1.5 px-3 rounded-lg text-center" style={{ background: "rgba(207,161,141,0.08)", color: "#8C7B6B" }}>
                  Prepaid: <strong style={{ color: "#059669" }}>FREE delivery</strong> · COD: +₹49
                </div>
                <button onClick={() => { setCartOpen(false); setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 20px rgba(207,161,141,0.45)" }}>
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const { cartCount, setCartOpen, setPage, wishlist } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  const scroll = (id: string) => { setPage("home"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120); setMobileOpen(false); };
  const links = [
    { label: "Home", action: () => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); } },
    { label: "Shop", action: () => scroll("featured") },
    { label: "New Arrivals", action: () => scroll("new-arrivals") },
    { label: "Best Sellers", action: () => scroll("bestsellers") },
    { label: "Track Order", action: () => { setPage("track"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileOpen(false); } },
    { label: "Contact Us", action: () => scroll("contact") },
  ];
  return (
    <>
      <motion.header initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.85 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{ background: scrolled ? "rgba(248,246,242,0.96)" : "rgba(248,246,242,0.6)", backdropFilter: "blur(24px)", borderBottom: scrolled ? "1px solid rgba(203,184,169,0.3)" : "1px solid transparent", boxShadow: scrolled ? "0 4px 32px rgba(207,161,141,0.1)" : "none" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex-shrink-0">
            <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-9 w-auto object-contain" />
          </button>
          <nav className="hidden lg:flex items-center gap-5">
            {links.map(({ label, action }) => (
              <button key={label} onClick={action} className="text-[13px] font-medium relative group whitespace-nowrap" style={{ color: "#3D2B1F" }}>
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] transition-all duration-300 group-hover:w-full rounded-full" style={{ background: "#CFA18D" }} />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
              <Heart size={16} />
              {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white" style={{ background: "#CFA18D" }}>{wishlist.length}</span>}
            </button>
            <button onClick={() => setCartOpen(true)} className="relative flex w-9 h-9 items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
              <ShoppingBag size={16} />
              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white" style={{ background: "#CFA18D" }}>{cartCount}</span>}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-secondary" style={{ color: "#5A4035" }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
            className="fixed top-16 left-0 right-0 z-40 lg:hidden px-5 py-5"
            style={{ background: "rgba(248,246,242,0.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(203,184,169,0.3)" }}>
            <div className="flex flex-col gap-4">
              {links.map(({ label, action }) => (
                <button key={label} onClick={action} className="text-left text-base font-semibold" style={{ color: "#3D2B1F" }}>{label}</button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Floating WhatsApp ──────────────────────────────────────────────────────
function FloatingWhatsApp() {
  return (
    <a href="https://wa.me/917801949426?text=Hi!%20I'm%20interested%20in%20your%20jewellery." target="_blank" rel="noopener noreferrer"
      className="fixed bottom-24 md:bottom-8 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.5)" }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

// ── Sticky Mobile CTA ──────────────────────────────────────────────────────
function StickyMobileCTA({ page }: { page: Page }) {
  const { setCartOpen, setPage, cart } = useApp();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show || page !== "home") return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex gap-3 p-3"
      style={{ background: "rgba(248,246,242,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(203,184,169,0.3)" }}>
      <button onClick={() => setCartOpen(true)} className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
        style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>
        <ShoppingBag size={14} /> Bag {cart.length > 0 ? `(${cart.reduce((s, i) => s + i.qty, 0)})` : ""}
      </button>
      <button onClick={() => { setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.5)" }}>
        Buy Now
      </button>
    </div>
  );
}

// ── Hero Section ───────────────────────────────────────────────────────────
function HeroSection() {
  const countdown = useCountdown();
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 80]);
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{ background: "linear-gradient(135deg, #F8F6F2 0%, #EFE7DD 50%, #E8DCC8 100%)" }}>
      <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #CFA18D, transparent)", filter: "blur(80px)", transform: "translate(30%)" }} />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #E8DCC8, transparent)", filter: "blur(60px)", transform: "translate(-20%)" }} />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20">
        <div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-[11px] uppercase tracking-[0.3em] mb-4 font-bold" style={{ color: "#CFA18D" }}>
            ✦ New Collection · 2026
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl lg:text-[68px] leading-[1.08] mb-6" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
            <em>Jewels</em> That<br />Tell Your<br /><span className="font-semibold not-italic">Story</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="text-[15px] md:text-[17px] max-w-md leading-relaxed mb-6" style={{ color: "#6B5A4E" }}>
            Beautifully crafted jewellery designed to make you shine with confidence — for everyday wear and every precious occasion.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72 }}
            className="flex items-center gap-3 mb-8 p-3 rounded-2xl w-fit" style={{ background: "rgba(207,161,141,0.1)", border: "1px solid rgba(207,161,141,0.25)" }}>
            <Clock size={14} style={{ color: "#CFA18D" }} />
            <span className="text-xs font-bold" style={{ color: "#6B5A4E" }}>Sale ends in:</span>
            {[{ v: countdown.h, l: "HRS" }, { v: countdown.m, l: "MIN" }, { v: countdown.s, l: "SEC" }].map(({ v, l }, i) => (
              <div key={l} className="flex items-center gap-1">
                {i > 0 && <span className="font-bold text-sm" style={{ color: "#CFA18D" }}>:</span>}
                <div className="text-center">
                  <div className="text-base font-bold w-8 text-center tabular-nums" style={{ color: "#3D2B1F" }}>{String(v).padStart(2, "0")}</div>
                  <div className="text-[8px] uppercase tracking-widest" style={{ color: "#8C7B6B" }}>{l}</div>
                </div>
              </div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.82 }} className="flex flex-wrap gap-4">
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-300 hover:scale-105"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 6px 24px rgba(207,161,141,0.5)" }}>
              Shop Now
            </button>
            <button onClick={() => document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:bg-secondary flex items-center gap-2"
              style={{ border: "1.5px solid rgba(207,161,141,0.7)", color: "#CFA18D" }}>
              View Collection <ArrowRight size={14} />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-wrap gap-5 mt-8">
            {[{ e: "🚚", t: "Free Prepaid Delivery" }, { e: "💳", t: "COD Available" }, { e: "↩️", t: "Easy 7-Day Returns" }, { e: "🛡️", t: "Quality Guaranteed" }].map(x => (
              <div key={x.t} className="flex items-center gap-1.5 text-[11px]" style={{ color: "#8C7B6B" }}>
                {x.e} {x.t}
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: 48, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: imgY }} className="relative flex justify-center items-center">
          <div className="absolute w-[320px] h-[320px] lg:w-[400px] lg:h-[400px] rounded-full border border-dashed opacity-20 animate-[spin_22s_linear_infinite]" style={{ borderColor: "#CFA18D" }} />
          <div className="relative w-[270px] h-[270px] sm:w-[310px] sm:h-[310px] lg:w-[370px] lg:h-[370px] rounded-[2rem] overflow-hidden animate-[float_7s_ease-in-out_infinite]"
            style={{ boxShadow: "0 40px 100px rgba(207,161,141,0.4), 0 8px 32px rgba(61,43,31,0.1)", border: "2px solid rgba(207,161,141,0.35)" }}>
            <ImageWithFallback src={pearlImg} alt="Pearl Seashell Necklace — featured piece" className="w-full h-full object-cover" />
          </div>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="absolute -bottom-4 -left-4 lg:-left-10 px-4 py-3 rounded-2xl animate-[float_7s_ease-in-out_infinite_1.5s]"
            style={{ background: "rgba(252,251,248,0.94)", backdropFilter: "blur(16px)", border: "1px solid rgba(203,184,169,0.35)", boxShadow: "0 10px 32px rgba(207,161,141,0.22)" }}>
            <p className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "#CFA18D" }}>Bestseller · 128 reviews</p>
            <p className="text-[13px] font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Pearl Seashell Necklace</p>
            <div className="flex items-center justify-between mt-1 gap-3">
              <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>₹349 <span className="line-through text-[10px] font-normal" style={{ color: "#CBB8A9" }}>₹499</span></p>
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={9} className="fill-amber-400 text-amber-400" />)}</div>
            </div>
          </motion.div>
          <div className="absolute top-4 right-4 text-xl pointer-events-none animate-[sparkle_3s_ease-in-out_infinite]" style={{ color: "#CFA18D" }}>✦</div>
          <div className="absolute top-1/3 -right-4 text-sm pointer-events-none animate-[sparkle_3s_ease-in-out_infinite_1s]" style={{ color: "#CBB8A9" }}>◆</div>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "#8C7B6B" }}>Scroll</p>
        <div className="w-px h-8 overflow-hidden" style={{ background: "rgba(207,161,141,0.2)" }}>
          <div className="w-full animate-[scrollPulse_2s_ease-in-out_infinite]" style={{ height: "40%", background: "#CFA18D" }} />
        </div>
      </motion.div>
    </section>
  );
}

// ── Trust Bar ──────────────────────────────────────────────────────────────
function TrustBar() {
  const { ref, visible } = useReveal();
  const items = [
    { Icon: Shield, label: "Secure Checkout", sub: "100% safe & encrypted" },
    { Icon: Truck, label: "Free Prepaid Delivery", sub: "Save ₹49 with prepaid" },
    { Icon: RefreshCw, label: "7-Day Easy Returns", sub: "Hassle-free returns" },
    { Icon: Package, label: "Quality Guaranteed", sub: "Each piece inspected" },
  ];
  return (
    <div ref={ref} style={{ background: "rgba(232,220,200,0.4)", borderTop: "1px solid rgba(203,184,169,0.2)", borderBottom: "1px solid rgba(203,184,169,0.2)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4">
          {items.map(({ Icon, label, sub }, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5 px-4" style={{ borderRight: i < 3 ? "1px solid rgba(203,184,169,0.2)" : "none" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(207,161,141,0.12)" }}>
                <Icon size={14} style={{ color: "#CFA18D" }} />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight" style={{ color: "#3D2B1F" }}>{label}</p>
                <p className="text-[10px]" style={{ color: "#8C7B6B" }}>{sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

// ── Prepaid Banner ─────────────────────────────────────────────────────────
function PrepaidBanner() {
  return (
    <div className="py-2.5 px-4 text-center text-xs font-bold"
      style={{ background: "linear-gradient(90deg, rgba(207,161,141,0.15), rgba(232,220,200,0.3), rgba(207,161,141,0.15))", borderBottom: "1px solid rgba(207,161,141,0.2)", color: "#92400E" }}>
      🎉 <strong>Save ₹49 on Delivery!</strong> Choose Prepaid (UPI / Card / Net Banking) at checkout — <span style={{ color: "#CFA18D", textDecoration: "underline" }}>FREE SHIPPING</span> on all prepaid orders.
    </div>
  );
}

// ── Testimonial Card ───────────────────────────────────────────────────────
function TestiCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-6 h-full flex flex-col"
        style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
        <div className="flex mb-3">{[...Array(t.rating)].map((_, i) => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}</div>
        <p className="text-[13px] leading-relaxed mb-4 flex-1" style={{ color: "#6B5A4E", fontStyle: "italic" }}>"{t.text}"</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #CFA18D, #E8DCC8)", color: "#FCFBF8" }}>
            {t.name.split(" ").map(w => w[0]).join("")}
          </div>
          <div>
            <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: "#3D2B1F" }}>
              {t.name} {t.verified && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>✓ Verified</span>}
            </p>
            <p className="text-[10px]" style={{ color: "#8C7B6B" }}>{t.city} · Ordered: {t.order}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── FAQ Item ───────────────────────────────────────────────────────────────
function FAQItem({ faq }: { faq: typeof FAQS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(203,184,169,0.25)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-[14px] font-semibold" style={{ color: "#3D2B1F" }}>{faq.q}</span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{ background: open ? "#CFA18D" : "rgba(207,161,141,0.12)", color: open ? "#FCFBF8" : "#CFA18D" }}>
          <ChevronDown size={14} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="pb-4 text-[13px] leading-relaxed" style={{ color: "#6B5A4E" }}>{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Brand Story ────────────────────────────────────────────────────────────
function BrandStory() {
  const { ref, visible } = useReveal();
  return (
    <section className="py-24 lg:py-32 overflow-hidden" style={{ background: "#EFE7DD" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div ref={ref}>
            <motion.div initial={{ opacity: 0, x: -48 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
              <p className="text-[11px] uppercase tracking-[0.28em] mb-4 font-bold" style={{ color: "#CFA18D" }}>Our Promise</p>
              <h2 className="text-4xl md:text-5xl mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>
                Timeless Elegance,<br /><em>Everyday Luxury</em>
              </h2>
              <p className="text-[15px] leading-relaxed mb-5" style={{ color: "#6B5A4E" }}>
                At Shri Vallabh Jewels, we craft beautiful jewellery that blends elegance, quality, and affordability — designed for the modern Indian woman who shines every day.
              </p>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#6B5A4E" }}>
                Every piece is thoughtfully designed with premium anti-tarnish coating, hypoallergenic materials, and attention to detail that makes you feel special.
              </p>
              {[{ icon: "✦", t: "Premium anti-tarnish coating" }, { icon: "✦", t: "Nickel-free & skin-safe" }, { icon: "✦", t: "Signature champagne gift box" }, { icon: "✦", t: "Trusted by 10,000+ customers" }].map(x => (
                <div key={x.t} className="flex items-center gap-2.5 mb-2 text-[13px]" style={{ color: "#6B5A4E" }}>
                  <span style={{ color: "#CFA18D" }}>{x.icon}</span>{x.t}
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 48 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.85, delay: 0.2 }} className="relative">
            <div className="grid grid-cols-2 gap-4">
              {[heartImg, butterflyImg, ringImg, pearlImg].map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden aspect-square ${i % 2 !== 0 ? "mt-6" : ""}`}
                  style={{ boxShadow: "0 8px 32px rgba(207,161,141,0.18)" }}>
                  <ImageWithFallback src={img} alt="Shri Vallabh Jewels" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── Combo Section ──────────────────────────────────────────────────────────
function ComboSection() {
  const { addToCart } = useApp();
  const combos = [
    { name: "The Romance Set", desc: "The perfect pair for soft, romantic elegance. Pearl Seashell + Petite Heart Necklace.", price: 599, original: 748, imgs: [pearlImg, heartImg], saving: 149 },
    { name: "The Golden Dream Set", desc: "Bold yet delicate — for those who wear their dreams. Butterfly Bloom + Infinity Spark Ring.", price: 439, original: 569, imgs: [butterflyImg, ringImg], saving: 130 },
  ];
  return (
    <section className="py-24 lg:py-28" style={{ background: "linear-gradient(135deg, #EFE7DD, #F8F6F2, #E8DCC8)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="Bundle & Save" title="Combo Collections" subtitle="Two pieces, one perfect story — curated gift sets at special prices." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((c, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <div className="rounded-3xl overflow-hidden group cursor-pointer" style={{ background: "#FCFBF8", boxShadow: "0 8px 40px rgba(207,161,141,0.15)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <div className="grid grid-cols-2">
                  {c.imgs.map((img, j) => (
                    <div key={j} className="overflow-hidden relative" style={{ paddingTop: "80%" }}>
                      <div className="absolute inset-0">
                        <ImageWithFallback src={img} alt={c.name} className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(207,161,141,0.15)", color: "#CFA18D" }}>Combo Set</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>Save ₹{c.saving}</span>
                  </div>
                  <h3 className="text-xl mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{c.name}</h3>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "#6B5A4E" }}>{c.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold" style={{ color: "#CFA18D" }}>₹{c.price}</span>
                      <span className="text-sm line-through" style={{ color: "#CBB8A9" }}>₹{c.original}</span>
                    </div>
                    <button onClick={() => toast.success("Combo set added to bag! ✦")}
                      className="px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 2px 10px rgba(207,161,141,0.4)" }}>
                      Add Combo
                    </button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Instagram Gallery ──────────────────────────────────────────────────────
function InstagramGallery() {
  const imgs = [pearlImg, heartImg, butterflyImg, ringImg, pearlImg, heartImg];
  return (
    <section className="py-20" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <STitle eyebrow="@shrivallabh_jewels" title="Follow Our World" subtitle="Daily drops, styling inspiration & new arrivals on Instagram." />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {imgs.map((img, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="rounded-xl overflow-hidden aspect-square group cursor-pointer relative"
                style={{ boxShadow: "0 4px 16px rgba(207,161,141,0.12)" }}>
                <ImageWithFallback src={img} alt="Instagram" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "rgba(207,161,141,0.5)", backdropFilter: "blur(2px)" }}>
                  <Instagram size={20} className="text-white" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="https://www.instagram.com/shrivallabh_jewels" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-105"
            style={{ border: "1.5px solid rgba(207,161,141,0.6)", color: "#CFA18D" }}>
            <Instagram size={15} /> Follow @shrivallabh_jewels
          </a>
        </div>
      </div>
    </section>
  );
}

// ── Product Detail Page ────────────────────────────────────────────────────
function ProductDetailPage() {
  const { selectedProduct, addToCart, setPage, setCartOpen } = useApp();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [wished, setWished] = useState(false);
  const allImgs = [pearlImg, heartImg, butterflyImg, ringImg];
  if (!selectedProduct) return null;
  const p = selectedProduct;
  return (
    <div className="min-h-screen pt-16" style={{ background: "#F8F6F2" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-sm mb-8 transition-colors hover:text-primary" style={{ color: "#8C7B6B" }}>
          <ChevronLeft size={16} /> Back to Shop
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <div>
            <div className="rounded-2xl overflow-hidden aspect-square mb-4" style={{ background: "#EFE7DD", boxShadow: "0 12px 40px rgba(207,161,141,0.2)" }}>
              <ImageWithFallback src={allImgs[activeImg]} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3">
              {allImgs.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200"
                  style={{ border: activeImg === i ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.3)", opacity: activeImg === i ? 1 : 0.7 }}>
                  <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
          {/* Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: p.badgeColor, color: "#fff" }}>{p.badge}</span>
              <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>✓ Quality Checked</span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: "#CFA18D" }}>{p.category}</p>
            <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>{p.name}</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />)}</div>
              <span className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{p.rating}</span>
              <span className="text-sm" style={{ color: "#8C7B6B" }}>({p.reviews} reviews)</span>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold" style={{ color: "#CFA18D" }}>₹{p.price}</span>
              <span className="text-lg line-through" style={{ color: "#CBB8A9" }}>₹{p.originalPrice}</span>
              <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(207,161,141,0.12)", color: "#CFA18D" }}>
                {Math.round((1 - p.price / p.originalPrice) * 100)}% OFF
              </span>
            </div>
            <div className="mb-5"><StockIndicator stock={p.stock} /></div>
            <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(207,161,141,0.08)", border: "1px solid rgba(207,161,141,0.2)" }}>
              <div className="flex items-center gap-2 mb-2 text-sm font-bold" style={{ color: "#059669" }}>
                <Zap size={14} /> Save ₹49 — Choose Prepaid for FREE Delivery
              </div>
              <p className="text-xs" style={{ color: "#6B5A4E" }}>Prepaid: FREE delivery · COD: ₹49 extra · All India delivery in 5–7 days</p>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(203,184,169,0.5)" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Minus size={14} /></button>
                <span className="w-10 text-center font-bold" style={{ color: "#3D2B1F" }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary" style={{ color: "#5A4035" }}><Plus size={14} /></button>
              </div>
              <button onClick={() => { toggleWishlist: setWished(!wished); toast(wished ? "Removed from wishlist" : "Saved to wishlist ♡"); }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ border: "1.5px solid rgba(203,184,169,0.4)", color: wished ? "#F43F5E" : "#8C7B6B" }}>
                <Heart size={16} className={wished ? "fill-rose-400" : ""} />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button onClick={() => { addToCart(p, qty); setCartOpen(true); }}
                className="flex-1 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>
                Add to Bag
              </button>
              <button onClick={() => { addToCart(p, qty); setPage("checkout"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex-1 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 20px rgba(207,161,141,0.5)" }}>
                Buy Now
              </button>
            </div>
            <div className="border-t pt-5 space-y-4" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#CFA18D" }}>Description</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#6B5A4E" }}>{p.description}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: "#CFA18D" }}>Care Instructions</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "#6B5A4E" }}>{p.care}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <STitle eyebrow="More to Love" title="You May Also Like" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {PRODUCTS.filter(pr => pr.id !== p.id).map((pr, i) => <ProductCard key={pr.id} product={pr} delay={i * 0.1} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Checkout Page ──────────────────────────────────────────────────────────
function CheckoutPage() {
  const { cart, cartTotal, setPage, setOrder, clearCart } = useApp();
  const [step, setStep] = useState<"delivery" | "payment" | "otp">("delivery");
  const [form, setForm] = useState<DeliveryForm>({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [payment, setPayment] = useState<"prepaid" | "cod">("prepaid");
  const [prepaidType, setPrepaidType] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [resend, setResend] = useState(0);
  const [paying, setPaying] = useState(false);
  const delivery = 49;
  const total = cartTotal + (payment === "cod" ? delivery : 0);

  const sendOTP = () => {
    setOtpSent(true); setResend(30);
    toast.success("OTP sent!", { description: `Sent to +91 ******${form.phone.slice(-4)}` });
    const iv = setInterval(() => setResend(r => { if (r <= 1) { clearInterval(iv); return 0; } return r - 1; }), 1000);
  };

  const placeOrder = () => {
    if (payment === "cod" && otp.join("").length < 6) { toast.error("Please enter the 6-digit OTP"); return; }
    if (payment === "prepaid") { setPaying(true); setTimeout(confirm, 2000); }
    else confirm();
  };

  const confirm = () => {
    setPaying(false);
    const ord: OrderData = { id: "SVJ-" + Math.floor(100000 + Math.random() * 900000), items: [...cart], delivery: { ...form }, payment, total, placed: new Date() };
    setOrder(ord); clearCart(); setPage("confirmation"); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (cart.length === 0 && step !== "otp") {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center" style={{ background: "#F8F6F2" }}>
        <div className="text-center">
          <p className="text-lg font-semibold mb-4" style={{ color: "#5A4035" }}>Your bag is empty</p>
          <button onClick={() => setPage("home")} className="px-6 py-3 rounded-full font-bold" style={{ background: "#CFA18D", color: "#FCFBF8" }}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: "#F8F6F2" }}>
      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => step === "delivery" ? setPage("home") : setStep(step === "otp" ? "payment" : "delivery")}
            className="flex items-center gap-1.5 text-sm" style={{ color: "#8C7B6B" }}>
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex-1 flex items-center gap-2">
            {[{ id: "delivery", label: "Delivery" }, { id: "payment", label: "Payment" }, ...(payment === "cod" ? [{ id: "otp", label: "Verify" }] : [])].map((s, i, arr) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: step === s.id || (arr.findIndex(x => x.id === step) > i) ? "#CFA18D" : "rgba(203,184,169,0.3)", color: step === s.id || (arr.findIndex(x => x.id === step) > i) ? "#fff" : "#8C7B6B" }}>
                    {arr.findIndex(x => x.id === step) > i ? <Check size={12} /> : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block" style={{ color: step === s.id ? "#3D2B1F" : "#8C7B6B" }}>{s.label}</span>
                </div>
                {i < arr.length - 1 && <div className="flex-1 h-px w-6" style={{ background: "rgba(203,184,169,0.4)" }} />}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#059669" }}>
            <Shield size={13} /> Secure Checkout
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "delivery" && (
              <div className="rounded-2xl p-6" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Delivery Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {([["name", "Full Name", "Priya Sharma"], ["phone", "Mobile Number", "10-digit number"], ["email", "Email Address", "optional"], ["address", "Full Address", "House, Street, Locality"], ["city", "City", "Mumbai"], ["state", "State", "Maharashtra"], ["pincode", "PIN Code", "400001"]] as [keyof DeliveryForm, string, string][]).map(([field, label, ph]) => (
                    <div key={field} className={field === "address" ? "sm:col-span-2" : ""}>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: "#8C7B6B" }}>{label}</label>
                      {field === "address" ? (
                        <textarea value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} rows={2} placeholder={ph}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none transition-all focus:ring-2 ring-[#CFA18D]"
                          style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#F8F6F2", color: "#3D2B1F" }} />
                      ) : (
                        <input type={field === "phone" ? "tel" : field === "email" ? "email" : "text"} value={form[field]} placeholder={ph}
                          onChange={e => setForm({ ...form, [field]: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 ring-[#CFA18D]"
                          style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#F8F6F2", color: "#3D2B1F" }} />
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => { if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) { toast.error("Please fill all required fields"); return; } if (form.phone.length < 10) { toast.error("Enter a valid 10-digit mobile number"); return; } setStep("payment"); }}
                  className="mt-6 w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                  Continue to Payment →
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-2xl p-6" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Payment Method</h2>
                <div className="space-y-3 mb-5">
                  <button onClick={() => setPayment("prepaid")} className="w-full p-4 rounded-xl flex items-center gap-3 text-left transition-all"
                    style={{ border: payment === "prepaid" ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.3)", background: payment === "prepaid" ? "rgba(207,161,141,0.06)" : "#fff" }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: "#CFA18D" }}>
                      {payment === "prepaid" && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#CFA18D" }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#3D2B1F" }}>Prepaid (UPI / Card / Net Banking)</p>
                      <p className="text-xs font-bold" style={{ color: "#059669" }}>🎉 FREE Delivery — Save ₹49!</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs line-through" style={{ color: "#CBB8A9" }}>₹49</p>
                      <p className="text-xs font-bold" style={{ color: "#059669" }}>FREE</p>
                    </div>
                  </button>
                  <button onClick={() => setPayment("cod")} className="w-full p-4 rounded-xl flex items-center gap-3 text-left transition-all"
                    style={{ border: payment === "cod" ? "2px solid #CFA18D" : "2px solid rgba(203,184,169,0.3)", background: payment === "cod" ? "rgba(207,161,141,0.06)" : "#fff" }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: "#CFA18D" }}>
                      {payment === "cod" && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#CFA18D" }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: "#3D2B1F" }}>Cash on Delivery</p>
                      <p className="text-xs" style={{ color: "#8C7B6B" }}>Pay when your order arrives · OTP verification required</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: "#DC2626" }}>+₹49</p>
                    </div>
                  </button>
                </div>

                {payment === "prepaid" && (
                  <div className="space-y-3 mb-5">
                    {[["upi", "UPI / Google Pay / PhonePe / Paytm"], ["card", "Debit / Credit Card"], ["netbanking", "Net Banking"]].map(([v, l]) => (
                      <button key={v} onClick={() => setPrepaidType(v as "upi" | "card" | "netbanking")}
                        className="w-full p-3.5 rounded-xl flex items-center gap-3 text-left transition-all"
                        style={{ border: prepaidType === v ? "1.5px solid #CFA18D" : "1.5px solid rgba(203,184,169,0.3)", background: prepaidType === v ? "rgba(207,161,141,0.05)" : "#fff" }}>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: "#CFA18D" }}>
                          {prepaidType === v && <div className="w-2 h-2 rounded-full" style={{ background: "#CFA18D" }} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#3D2B1F" }}>{l}</span>
                      </button>
                    ))}
                    {prepaidType === "upi" && (
                      <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="Enter UPI ID (e.g. name@upi)"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 ring-[#CFA18D]"
                        style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#F8F6F2", color: "#3D2B1F" }} />
                    )}
                  </div>
                )}

                {payment === "cod" && (
                  <div className="p-3.5 rounded-xl mb-4 text-xs" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)", color: "#B91C1C" }}>
                    📱 An OTP will be sent to <strong>+91 ******{form.phone.slice(-4)}</strong> for phone verification. This helps reduce fake orders and ensures faster delivery.
                  </div>
                )}

                <button onClick={() => { if (payment === "cod") { sendOTP(); setStep("otp"); } else placeOrder(); }}
                  disabled={paying}
                  className="w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-70"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                  {paying ? "Processing Payment…" : payment === "cod" ? "Send OTP & Verify →" : `Pay ₹${total} Now →`}
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="rounded-2xl p-6 text-center" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(207,161,141,0.12)" }}>
                  <Phone size={22} style={{ color: "#CFA18D" }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Verify Your Number</h2>
                <p className="text-sm mb-6" style={{ color: "#6B5A4E" }}>
                  OTP sent to <strong style={{ color: "#3D2B1F" }}>+91 ******{form.phone.slice(-4)}</strong>
                </p>
                <OTPInput value={otp} onChange={setOtp} />
                <div className="mt-4 mb-6">
                  {resend > 0 ? (
                    <p className="text-xs" style={{ color: "#8C7B6B" }}>Resend OTP in <strong style={{ color: "#CFA18D" }}>{resend}s</strong></p>
                  ) : (
                    <button onClick={sendOTP} className="text-xs font-bold" style={{ color: "#CFA18D" }}>Resend OTP</button>
                  )}
                </div>
                <button onClick={placeOrder}
                  className="w-full py-3.5 rounded-full font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
                  Verify & Place Order →
                </button>
                <p className="text-[10px] mt-3" style={{ color: "#8C7B6B" }}>OTP verification prevents fake orders & ensures fast delivery</p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="rounded-2xl p-5 sticky top-20" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
              <h3 className="font-bold text-base mb-4" style={{ color: "#3D2B1F" }}>Order Summary</h3>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "#EFE7DD" }}>
                      <ImageWithFallback src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold leading-snug truncate" style={{ color: "#3D2B1F", fontFamily: "'Playfair Display', serif" }}>{item.product.name}</p>
                      <p className="text-[10px]" style={{ color: "#8C7B6B" }}>Qty: {item.qty}</p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>₹{item.product.price * item.qty}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
                <div className="flex justify-between text-xs"><span style={{ color: "#8C7B6B" }}>Subtotal</span><span style={{ color: "#3D2B1F" }}>₹{cartTotal}</span></div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#8C7B6B" }}>Delivery</span>
                  <span className="font-bold" style={{ color: payment === "prepaid" ? "#059669" : "#DC2626" }}>
                    {payment === "prepaid" ? "FREE" : `₹${delivery}`}
                  </span>
                </div>
                {payment === "prepaid" && <div className="text-[10px] text-center py-1 rounded" style={{ background: "rgba(5,150,105,0.08)", color: "#059669" }}>🎉 You saved ₹49 with prepaid!</div>}
                <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: "rgba(203,184,169,0.3)", color: "#3D2B1F" }}>
                  <span>Total</span><span style={{ color: "#CFA18D" }}>₹{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Order Confirmation ─────────────────────────────────────────────────────
function OrderConfirmation() {
  const { order, setPage } = useApp();
  if (!order) return null;
  const delivery = new Date(order.placed);
  delivery.setDate(delivery.getDate() + 7);
  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-5" style={{ background: "#F8F6F2" }}>
      <div className="max-w-md w-full text-center py-16">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #CFA18D, #E8DCC8)", boxShadow: "0 8px 32px rgba(207,161,141,0.4)" }}>
          <Check size={36} className="text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold mb-2" style={{ color: "#CFA18D" }}>Order Placed Successfully!</p>
          <h1 className="text-3xl mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>Thank You, {order.delivery.name.split(" ")[0]}! 🎉</h1>
          <p className="text-sm mb-6" style={{ color: "#6B5A4E" }}>Your order has been confirmed and will be delivered soon.</p>
          <div className="rounded-2xl p-5 mb-6 text-left" style={{ background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.3)", boxShadow: "0 4px 20px rgba(207,161,141,0.1)" }}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Order ID</p><p className="font-bold" style={{ color: "#3D2B1F" }}>{order.id}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Payment</p><p className="font-bold capitalize" style={{ color: "#3D2B1F" }}>{order.payment === "cod" ? "Cash on Delivery" : "Prepaid"}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Total Paid</p><p className="font-bold" style={{ color: "#CFA18D" }}>₹{order.total}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#8C7B6B" }}>Est. Delivery</p><p className="font-bold" style={{ color: "#3D2B1F" }}>{delivery.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>
            </div>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(203,184,169,0.3)" }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8C7B6B" }}>Delivering to</p>
              <p className="text-sm" style={{ color: "#3D2B1F" }}>{order.delivery.address}, {order.delivery.city}, {order.delivery.state} — {order.delivery.pincode}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => setPage("track")} className="w-full py-3 rounded-full font-bold text-sm"
              style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>
              Track My Order
            </button>
            <button onClick={() => setPage("home")} className="w-full py-3 rounded-full font-bold text-sm"
              style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
              Continue Shopping
            </button>
            <a href="https://wa.me/917801949426" className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: "#25D366" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Need help? Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Track Order Page ───────────────────────────────────────────────────────
function TrackOrderPage() {
  const { setPage, order } = useApp();
  const [orderId, setOrderId] = useState(order?.id ?? "");
  const [tracked, setTracked] = useState(false);
  const steps = [
    { label: "Order Placed", desc: "Your order has been confirmed", done: true },
    { label: "Order Confirmed", desc: "Seller has confirmed your order", done: true },
    { label: "Shipped", desc: "Your order is on its way", done: true },
    { label: "Out for Delivery", desc: "Your order is with the delivery partner", done: false },
    { label: "Delivered", desc: "Enjoy your jewellery!", done: false },
  ];
  return (
    <div className="min-h-screen pt-24 px-5" style={{ background: "#F8F6F2" }}>
      <div className="max-w-xl mx-auto">
        <button onClick={() => setPage("home")} className="flex items-center gap-2 text-sm mb-8" style={{ color: "#8C7B6B" }}>
          <ChevronLeft size={16} /> Back to Home
        </button>
        <STitle eyebrow="Track Your Order" title="Where's My Order?" subtitle="Enter your order ID to see real-time updates." />
        <div className="rounded-2xl p-6 mb-6" style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
          <div className="flex gap-3">
            <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="Enter Order ID (e.g. SVJ-123456)"
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 ring-[#CFA18D]"
              style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#F8F6F2", color: "#3D2B1F" }} />
            <button onClick={() => { if (orderId) setTracked(true); else toast.error("Please enter an order ID"); }}
              className="px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: "#CFA18D", color: "#FCFBF8" }}>
              Track
            </button>
          </div>
        </div>
        {tracked && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-6"
            style={{ background: "#FCFBF8", boxShadow: "0 4px 24px rgba(207,161,141,0.1)", border: "1px solid rgba(203,184,169,0.2)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-bold" style={{ color: "#CFA18D" }}>Order {orderId}</p>
                <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>Estimated: 2–4 more days</p>
              </div>
              <span className="text-[10px] px-3 py-1 rounded-full font-bold" style={{ background: "rgba(207,161,141,0.15)", color: "#CFA18D" }}>In Transit</span>
            </div>
            <div className="space-y-0">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: s.done ? "#CFA18D" : "rgba(203,184,169,0.25)", border: i === steps.findLastIndex(x => x.done) ? "2px dashed #CFA18D" : "none" }}>
                      {s.done ? <Check size={13} className="text-white" /> : <div className="w-2 h-2 rounded-full" style={{ background: "rgba(203,184,169,0.5)" }} />}
                    </div>
                    {i < steps.length - 1 && <div className="w-0.5 h-8 mt-1" style={{ background: s.done ? "rgba(207,161,141,0.4)" : "rgba(203,184,169,0.2)" }} />}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-bold" style={{ color: s.done ? "#3D2B1F" : "#CBB8A9" }}>{s.label}</p>
                    <p className="text-xs" style={{ color: s.done ? "#6B5A4E" : "#CBB8A9" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const { setPage } = useApp();
  const scroll = (id: string) => { setPage("home"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120); };
  return (
    <footer style={{ background: "#3D2B1F" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4 p-3 rounded-xl inline-block" style={{ background: "rgba(255,255,255,0.07)" }}>
              <ImageWithFallback src={logoImg} alt="Shri Vallabh Jewels" className="h-10 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} />
            </div>
            <p className="text-[13px] leading-relaxed mb-5" style={{ color: "rgba(239,231,221,0.65)" }}>
              Beautifully crafted jewellery designed to make you shine with confidence — for everyday wear and every precious occasion.
            </p>
            <div className="space-y-2">
              {[{ Icon: Phone, t: "+91 7801949426" }, { Icon: Mail, t: "shrivallabhjewels@gmail.com" }, { Icon: Instagram, t: "@shrivallabh_jewels" }].map(({ Icon, t }) => (
                <div key={t} className="flex items-center gap-2.5 text-[13px]" style={{ color: "rgba(239,231,221,0.65)" }}>
                  <Icon size={13} style={{ color: "#CFA18D" }} /> {t}
                </div>
              ))}
            </div>
          </div>
          {[
            { title: "Shop", links: [["featured", "All Jewellery"], ["featured", "Necklaces"], ["featured", "Rings"], ["featured", "Combo Sets"], ["new-arrivals", "New Arrivals"]] },
            { title: "Quick Links", links: [["bestsellers", "Best Sellers"], ["contact", "About Us"], ["contact", "Contact Us"]] },
            { title: "Policies", links: [["contact", "Shipping Policy"], ["contact", "Return Policy"], ["contact", "Privacy Policy"], ["contact", "Terms of Service"]] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-[11px] uppercase tracking-[0.25em] font-bold mb-5" style={{ color: "#CFA18D" }}>{title}</h4>
              <ul className="space-y-2.5">
                {links.map(([id, label]) => (
                  <li key={label}><button onClick={() => scroll(id)} className="text-[13px] hover:text-[#CFA18D] transition-colors text-left" style={{ color: "rgba(239,231,221,0.6)" }}>{label}</button></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-5 mb-10" style={{ background: "rgba(207,161,141,0.1)", border: "1px solid rgba(207,161,141,0.2)" }}>
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="flex-1">
              <p className="text-base font-semibold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#EFE7DD" }}>Join the Inner Circle</p>
              <p className="text-xs" style={{ color: "rgba(239,231,221,0.6)" }}>Early access, exclusive drops & styling tips straight to your inbox.</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input type="email" placeholder="your@email.com" className="flex-1 md:w-56 px-4 py-2.5 rounded-full text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(207,161,141,0.3)", color: "#EFE7DD" }} />
              <button onClick={() => toast.success("Welcome! ✦")} className="px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:scale-105"
                style={{ background: "#CFA18D", color: "#FCFBF8" }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: "rgba(203,184,169,0.15)" }}>
          <p className="text-[11px]" style={{ color: "rgba(239,231,221,0.35)" }}>© 2026 Shri Vallabh Jewels. All rights reserved.</p>
          <p className="text-[11px]" style={{ color: "rgba(239,231,221,0.35)" }}>Crafted with ✦ in Surat, Gujarat · Ph: 7801949426</p>
        </div>
      </div>
    </footer>
  );
}

// ── Home Page ──────────────────────────────────────────────────────────────
function HomePage() {
  return (
    <>
      <PrepaidBanner />
      <HeroSection />
      <TrustBar />
      <section id="featured" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Handpicked for You" title="Featured Collections" subtitle="Our most-loved pieces, curated for timeless elegance." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {PRODUCTS.slice(0, 3).map((p, i) => <ProductCard key={p.id} product={p} delay={i * 0.12} />)}
          </div>
          <div className="text-center"><Reveal><button onClick={() => {}} className="px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105" style={{ border: "1.5px solid #CFA18D", color: "#CFA18D" }}>View All Products</button></Reveal></div>
        </div>
      </section>
      <BrandStory />
      <section id="bestsellers" className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Most Loved" title="Best Sellers" subtitle="The pieces our customers keep coming back for." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...PRODUCTS].reverse().map((p, i) => <ProductCard key={p.id + 10} product={p} delay={i * 0.1} />)}
          </div>
        </div>
      </section>
      <section id="new-arrivals" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Fresh In" title="New Arrivals" subtitle="Just landed — discover what's new in our latest drop." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {PRODUCTS.map((p, i) => <ProductCard key={p.id + 20} product={{ ...p, badge: "New In" }} delay={i * 0.1} />)}
          </div>
        </div>
      </section>
      <ComboSection />
      <section className="py-24 lg:py-32" style={{ background: "#EFE7DD" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Customer Love" title="What Our Customers Say" subtitle="4.9★ average across 400+ genuine reviews." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((t, i) => <TestiCard key={t.id} t={t} delay={i * 0.1} />)}
          </div>
        </div>
      </section>
      <InstagramGallery />
      <section className="py-24 lg:py-28" style={{ background: "#EFE7DD" }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-8">
          <STitle eyebrow="Questions Answered" title="FAQs" subtitle="Everything you need to know before shopping with us." />
          <div>{FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}</div>
        </div>
      </section>
      <section id="contact" className="py-24 lg:py-32" style={{ background: "#F8F6F2" }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.28em] mb-4 font-bold" style={{ color: "#CFA18D" }}>Get in Touch</p>
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#3D2B1F" }}>We'd Love to<br /><em>Hear From You</em></h2>
              <p className="text-[15px] leading-relaxed mb-10" style={{ color: "#6B5A4E" }}>Questions, custom orders, or just want to say hello — we're always here.</p>
              {[{ Icon: Phone, label: "WhatsApp", val: "+91 7801949426" }, { Icon: Mail, label: "Email", val: "shrivallabhjewels@gmail.com" }, { Icon: Instagram, label: "Instagram", val: "@shrivallabh_jewels" }, { Icon: MapPin, label: "Location", val: "Surat, Gujarat, India" }].map(({ Icon, label, val }) => (
                <div key={label} className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(207,161,141,0.12)" }}>
                    <Icon size={15} style={{ color: "#CFA18D" }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: "#8C7B6B" }}>{label}</p>
                    <p className="text-sm font-semibold" style={{ color: "#3D2B1F" }}>{val}</p>
                  </div>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.15}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  return (
    <form onSubmit={e => { e.preventDefault(); toast.success("Message sent! We'll reply within 24 hours."); setF({ name: "", email: "", message: "" }); }} className="flex flex-col gap-4">
      {[["name", "Your Name", "text", "Priya Sharma"], ["email", "Email Address", "email", "priya@email.com"]].map(([k, l, t, p]) => (
        <div key={k}>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: "#8C7B6B" }}>{l}</label>
          <input type={t} required value={f[k as "name" | "email"]} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={p}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 ring-[#CFA18D]"
            style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#FCFBF8", color: "#3D2B1F" }} />
        </div>
      ))}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: "#8C7B6B" }}>Message</label>
        <textarea required rows={4} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Tell us how we can help..."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none focus:ring-2 ring-[#CFA18D]"
          style={{ border: "1px solid rgba(203,184,169,0.4)", background: "#FCFBF8", color: "#3D2B1F" }} />
      </div>
      <button type="submit" className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "#CFA18D", color: "#FCFBF8", boxShadow: "0 4px 16px rgba(207,161,141,0.4)" }}>
        Send Message <Send size={14} />
      </button>
    </form>
  );
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPageState] = useState<Page>("home");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);

  const setPage = (p: Page) => { setPageState(p); };
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product, qty = 1) => setCart(prev => {
    const ex = prev.find(i => i.product.id === p.id);
    return ex ? prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + qty } : i) : [...prev, { product: p, qty }];
  });
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.product.id !== id));
  const updateQty = (id: number, qty: number) => qty <= 0 ? removeFromCart(id) : setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i));
  const clearCart = () => setCart([]);
  const toggleWishlist = (id: number) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Recent order notifications
  useEffect(() => {
    if (loading) return;
    let idx = 0;
    const show = () => {
      const o = RECENT_ORDERS[idx % RECENT_ORDERS.length]; idx++;
      toast(`🛍️ ${o.name} from ${o.city} just ordered`, { description: o.product, duration: 4000 });
    };
    const t1 = setTimeout(show, 8000);
    const t2 = setInterval(show, 55000);
    return () => { clearTimeout(t1); clearInterval(t2); };
  }, [loading]);

  const ctx: AppCtx = { page, setPage, cart, addToCart, removeFromCart, updateQty, cartTotal, cartCount, clearCart, cartOpen, setCartOpen, selectedProduct, setSelectedProduct, order, setOrder, wishlist, toggleWishlist };

  return (
    <Ctx.Provider value={ctx}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
        @keyframes sparkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes scrollPulse { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(250%); opacity: 0; } }
        * { font-family: 'DM Sans', sans-serif; }
        input::placeholder, textarea::placeholder { color: rgba(139,123,107,0.6); }
      `}</style>

      <AnimatePresence>
        {loading && <LoadingScreen key="loader" onDone={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <>
          <Toaster position="bottom-left" toastOptions={{ style: { background: "#FCFBF8", border: "1px solid rgba(203,184,169,0.35)", color: "#3D2B1F", borderRadius: "1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "13px" } }} />
          <Navbar />
          <CartDrawer />
          <FloatingWhatsApp />
          <StickyMobileCTA page={page} />

          {page === "home" && <HomePage />}
          {page === "product" && <ProductDetailPage />}
          {page === "checkout" && <CheckoutPage />}
          {page === "confirmation" && <OrderConfirmation />}
          {page === "track" && <TrackOrderPage />}
        </>
      )}
    </Ctx.Provider>
  );
}
