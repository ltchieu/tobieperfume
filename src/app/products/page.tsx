"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PerfumeDTO } from "@/model/perfume";
import { PERFUME_DATA } from "@/data/perfumes";
import Magnetic from "@/components/Magnetic";

export default function ProductsPage() {
  const [selectedPerfume, setSelectedPerfume] = useState<PerfumeDTO | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Close detail view on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPerfume(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle consultation click (copy message and open Instagram)
  const handleConsultClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, perfume: PerfumeDTO) => {
    e.preventDefault();
    const message = `tôi quan tâm tới sản phẩm nước hoa ${perfume.brand} ${perfume.product_name} ở shop bạn và cần tư vấn`;

    // Copy sample message to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message)
        .then(() => {
          setToastMessage(`Đã sao chép yêu cầu tư vấn cho ${perfume.product_name}!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        })
        .catch((err) => {
          console.error("Failed to copy sample message: ", err);
        });
    } else {
      // Fallback copy method
      const textArea = document.createElement("textarea");
      textArea.value = message;
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setToastMessage(`Đã sao chép yêu cầu tư vấn cho ${perfume.product_name}!`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } catch (err) {
        console.error("Fallback copy failed: ", err);
      }
      document.body.removeChild(textArea);
    }

    // Open Instagram link after a tiny delay
    setTimeout(() => {
      const directUrl = `${perfume.instagram_url || "https://ig.me/m/ltc.hiu"}?text=${encodeURIComponent(message)}`;
      window.open(directUrl, "_blank", "noopener,noreferrer");
    }, 400);
  }, []);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
    },
  } as const;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 15,
      transition: { duration: 0.4, ease: "easeIn" },
    },
  } as const;

  return (
    <div className="relative min-h-screen bg-[#07080a] text-zinc-100 flex flex-col justify-start">
      {/* Background radial effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-950/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative w-full h-20 px-6 md:px-12 flex justify-between items-center z-10 border-b border-zinc-950/80">
        <Link href="/" className="font-serif text-lg md:text-xl font-bold tracking-[0.3em] text-zinc-100 hover:text-amber-500 transition-colors">
          TOBI PERFUME
        </Link>
        
        <div className="flex items-center gap-6">
          <Link href="/" className="font-sans text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-amber-500 transition-colors">
            Trang Chủ
          </Link>
          <span className="font-sans text-xs uppercase tracking-[0.15em] text-zinc-500 font-medium">
            VN / EN
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-16 md:py-24 flex-grow">
        {/* Page title */}
        <div className="flex flex-col items-center text-center mb-20 max-w-xl mx-auto">
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-amber-500/80">
            L’Élégance du Néant
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.15em] text-zinc-100 mt-2 mb-4 leading-none">
            FRAGRANCE GALLERY
          </h1>
          <p className="font-serif italic text-base text-zinc-400 max-w-[32ch]">
            Khám phá bộ sưu tập mùi hương sang trọng, độc bản được tuyển tuyển chọn từ các nhà hương lừng danh châu Âu.
          </p>
          <div className="w-12 h-[1px] bg-amber-500/30 mt-6" />
        </div>

        {/* Perfume List Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16"
        >
          {PERFUME_DATA.map((perfume) => (
            <motion.div
              key={perfume.id}
              variants={cardVariants}
              className="group relative bg-zinc-950/30 border border-zinc-900/60 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-800 hover:shadow-[0_15px_40px_rgba(0,0,0,0.55)] hover:shadow-amber-500/[0.01] transition-all duration-500"
            >
              <div>
                {/* Aspect Ratio Box for Image */}
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-zinc-950/60 border border-zinc-900/50 relative mb-6">
                  <img
                    src={perfume.image_url}
                    alt={perfume.product_name}
                    className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                </div>

                <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                  {perfume.brand}
                </span>
                
                <h3 className="font-serif text-lg font-light tracking-wide text-zinc-100 mt-1 mb-2 group-hover:text-amber-500/90 transition-colors duration-300">
                  {perfume.product_name}
                </h3>
                
                <span className="font-sans text-xs font-semibold text-zinc-300">
                  {perfume.price}
                </span>

                <p className="font-sans text-xs text-zinc-400 leading-relaxed mt-3 line-clamp-2">
                  {perfume.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-950 flex justify-between items-center gap-4">
                <span className="font-sans text-[10px] tracking-wider text-zinc-500 uppercase italic truncate pr-2">
                  {perfume.scent_profile.split(" (")[0]}
                </span>
                
                <button
                  onClick={() => setSelectedPerfume(perfume)}
                  className="font-sans text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-500 hover:text-amber-400 flex items-center gap-1.5 transition-colors focus:outline-none cursor-pointer whitespace-nowrap shrink-0"
                >
                  Chi tiết
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-zinc-950/80 bg-[#07080a] relative z-10">
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          © 2026 TOBI PERFUME. ALL RIGHTS RESERVED.
        </p>
      </footer>

      {/* Full Screen Perfume Detail Modal Overlay */}
      <AnimatePresence>
        {selectedPerfume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#050608]/96 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
            onClick={() => setSelectedPerfume(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column - Image */}
              <div className="w-full md:w-5/12 aspect-square md:aspect-auto md:h-auto min-h-[300px] md:min-h-[500px] relative overflow-hidden rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl bg-zinc-950 border-r border-zinc-900/50">
                <img
                  src={selectedPerfume.image_url}
                  alt={selectedPerfume.product_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent opacity-70" />
              </div>

              {/* Right Column - Perfume Info & Notes */}
              <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between relative">
                {/* Close Detail Button */}
                <button
                  onClick={() => setSelectedPerfume(null)}
                  aria-label="Đóng chi tiết"
                  className="absolute top-6 right-6 w-8 h-8 rounded-full border border-zinc-900 hover:border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>

                <div>
                  <span className="font-sans text-[11px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                    {selectedPerfume.brand}
                  </span>
                  
                  <h3 className="font-serif text-2xl md:text-3xl font-light tracking-wide text-zinc-100 mt-1">
                    {selectedPerfume.product_name}
                  </h3>
                  
                  <div className="flex gap-4 items-center mt-2">
                    <span className="font-sans text-base font-semibold text-zinc-300">
                      {selectedPerfume.price}
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <span className="font-sans text-[11px] font-semibold tracking-wider text-zinc-400 uppercase bg-zinc-900/50 px-2.5 py-1 rounded-md">
                      {selectedPerfume.scent_profile}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-zinc-400 leading-relaxed mt-5">
                    {selectedPerfume.description}
                  </p>

                  {/* Scent Pyramid Breakdown */}
                  <div className="mt-8">
                    <span className="font-sans text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase block mb-4">
                      Cấu Trúc Các Nốt Hương (Scent Notes)
                    </span>

                    <div className="space-y-4 pt-1">
                      {/* Top Notes */}
                      <div className="flex items-start gap-4 border-l border-zinc-900 pl-4 py-0.5 hover:border-amber-500/40 transition-colors">
                        <div className="w-24 shrink-0 flex flex-col">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                            Hương đầu
                          </span>
                          <span className="font-sans text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                            Top Notes
                          </span>
                        </div>
                        <p className="font-sans text-xs text-zinc-300 leading-normal">
                          {selectedPerfume.scent_notes.top.join(", ")}
                        </p>
                      </div>

                      {/* Heart Notes */}
                      <div className="flex items-start gap-4 border-l border-zinc-900 pl-4 py-0.5 hover:border-amber-500/40 transition-colors">
                        <div className="w-24 shrink-0 flex flex-col">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-amber-500/85">
                            Hương giữa
                          </span>
                          <span className="font-sans text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                            Heart Notes
                          </span>
                        </div>
                        <p className="font-sans text-xs text-zinc-300 leading-normal">
                          {selectedPerfume.scent_notes.heart.join(", ")}
                        </p>
                      </div>

                      {/* Base Notes */}
                      <div className="flex items-start gap-4 border-l border-zinc-900 pl-4 py-0.5 hover:border-amber-500/40 transition-colors">
                        <div className="w-24 shrink-0 flex flex-col">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-red-500/80">
                            Hương cuối
                          </span>
                          <span className="font-sans text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                            Base Notes
                          </span>
                        </div>
                        <p className="font-sans text-xs text-zinc-300 leading-normal">
                          {selectedPerfume.scent_notes.base.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-zinc-900/50 flex flex-col sm:flex-row gap-4 justify-end">
                  <button
                    onClick={() => setSelectedPerfume(null)}
                    className="h-11 rounded-full border border-zinc-900 hover:border-zinc-800 bg-transparent px-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                  >
                    Quay lại
                  </button>

                  <button
                    onClick={(e) => handleConsultClick(e, selectedPerfume)}
                    className="h-11 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold uppercase tracking-[0.2em] text-[10px] px-8 transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.2)] focus:outline-none active:scale-98 cursor-pointer"
                  >
                    <span>Tư vấn & Sở hữu</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-55 flex items-center gap-3.5 bg-zinc-950 border border-zinc-900 backdrop-blur-md px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] max-w-sm w-[90%]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-amber-500">
                Đã sao chép tin nhắn!
              </span>
              <p className="font-sans text-[10px] text-zinc-400 leading-normal mt-0.5">
                Hãy dán (Ctrl+V) vào ô chat Instagram vừa mở để gửi yêu cầu tư vấn.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
