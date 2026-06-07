"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Magnetic from "@/components/Magnetic";

// Dynamically import Three.js Canvas to prevent SSR issues
const ThreeCanvas = dynamic(() => import("@/components/ThreeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-zinc-950 z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-red-900/10 border-t-red-600 animate-spin" />
        <span className="font-sans text-xs uppercase tracking-[0.25em] text-red-500/50">
          Initializing Fragrance Portal...
        </span>
      </div>
    </div>
  ),
});

export default function IntroSection() {
  const [isHoveredCTA, setIsHoveredCTA] = useState(false);
  const [introPhase, setIntroPhase] = useState<"assembling" | "spraying" | "frozen" | "explored">("assembling");
  const [showShockwave, setShowShockwave] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Navigation click handler for smooth scroll
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    if (link === "Tinh Hoa") {
      const el = document.getElementById("section-tinhhoa");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (link === "Đặc Quyền") {
      const el = document.getElementById("section-dacquyen");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Block scrolling during assembling and spraying phases
  useEffect(() => {
    if (introPhase === "assembling" || introPhase === "spraying") {
      document.body.style.overflow = "hidden";
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [introPhase]);

  const handleAssembleComplete = useCallback(() => {
    setIntroPhase("spraying");
  }, []);

  const handleFreeze = useCallback(() => {
    setIntroPhase("frozen");
    setShowShockwave(true);
    setTimeout(() => {
      setShowShockwave(false);
    }, 1000);
  }, []);

  const handleConsultClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const message = "tôi quan tâm tới các sản phẩm nước hoa ở shop bạn và cần tư vấn";
    
    // Copy sample message to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message)
        .then(() => {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
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
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      } catch (err) {
        console.error("Fallback copy failed: ", err);
      }
      document.body.removeChild(textArea);
    }

    // Open Instagram direct link with prefilled message parameter
    const directUrl = `https://ig.me/m/ltc.hiu?text=${encodeURIComponent(message)}`;
    window.open(directUrl, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0b0c10] text-zinc-100 overflow-x-hidden selection:bg-red-900/30 selection:text-red-200">
      {/* 1. Immersive 3D Scene Layer */}
      <ThreeCanvas
        isHoveredCTA={isHoveredCTA}
        introPhase={introPhase}
        setIntroPhase={setIntroPhase}
        onAssembleComplete={handleAssembleComplete}
        onFreeze={handleFreeze}
      />

      {/* 2. Crimson Sharingan Space Warp Ripple Overlay */}
      <AnimatePresence>
        {showShockwave && (
          <div className="fixed inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ scale: 0.1, opacity: 0.9, filter: "blur(1px)" }}
              animate={{ scale: 8, opacity: 0, filter: "blur(12px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="w-40 h-40 rounded-full border-4 border-red-600/40 bg-radial from-red-600/30 via-red-950/5 to-transparent"
            />
            {/* Fullscreen blur wave flash */}
            <motion.div
              initial={{ backdropFilter: "blur(6px)" }}
              animate={{ backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            />
          </div>
        )}
      </AnimatePresence>

      {/* 3. Page Content & Scrollytelling Sections (Faded in once ready) */}
      <div
        id="scrollytelling-container"
        className={`relative z-20 w-full transition-opacity duration-1000 ${
          introPhase === "assembling" || introPhase === "spraying"
            ? "opacity-0 pointer-events-none"
            : "opacity-100"
        }`}
      >
        {/* Navigation Bar */}
        <header className="fixed top-0 left-0 w-full h-20 px-6 md:px-12 flex justify-between items-center z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <span className="font-serif text-lg md:text-xl font-bold tracking-[0.3em] text-zinc-100 select-none">
              TOBI PERFUME
            </span>
          </div>
          <nav className="hidden md:flex gap-10 pointer-events-auto">
            {["Khám Phá", "Tinh Hoa", "Đặc Quyền"].map((link) => {
              if (link === "Khám Phá") {
                return (
                  <Link
                    key={link}
                    href="/products"
                    className="font-sans text-xs uppercase tracking-[0.2em] text-zinc-300 hover:text-amber-500 transition-colors"
                  >
                    {link}
                  </Link>
                );
              }
              return (
                <a
                  key={link}
                  href="#"
                  onClick={(e) => handleNavClick(e, link)}
                  className="font-sans text-xs uppercase tracking-[0.2em] text-zinc-300 hover:text-amber-500 transition-colors"
                >
                  {link}
                </a>
              );
            })}
          </nav>
          <div className="pointer-events-auto flex items-center gap-6">
            <Link
              href="/products"
              className="md:hidden font-sans text-xs uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 font-semibold transition-colors pointer-events-auto cursor-pointer"
            >
              Khám Phá
            </Link>
            <span className="font-sans text-xs uppercase tracking-[0.15em] text-zinc-300 font-medium">
              VN / EN
            </span>
          </div>
        </header>

        {/* Section 0: Hero Section */}
        <section className="h-screen flex flex-col justify-between items-center py-24 px-6 relative pointer-events-none">
          {/* Spacer */}
          <div />

          {/* Hero Content */}
          <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-xs uppercase tracking-[0.3em] text-amber-500/70"
            >
              L’Élégance du Néant
            </motion.span>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-5xl md:text-7xl font-light tracking-[0.15em] text-zinc-100 leading-none"
            >
              TOBI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif italic text-lg md:text-xl text-zinc-300 max-w-[24ch] mt-2"
            >
              Nơi những làn hương xa xỉ hội tụ trong một vòng xoáy vô cực. Bản giao hưởng khứu giác chạm tới hư vô.
            </motion.p>
          </div>

          {/* Explore Prompt (Only visible in frozen hero phase) */}
          <div className="flex flex-col items-center gap-2">
            <AnimatePresence>
              {introPhase === "frozen" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col items-center gap-2"
                >
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Section 1: Decode Fragrance Section */}
        <section id="section-tinhhoa" className="h-screen flex items-center justify-end px-6 md:px-24 relative pointer-events-none">
          <div className="w-full md:w-1/2 max-w-lg flex flex-col gap-6 pointer-events-auto">
            <div className="flex flex-col gap-2">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-red-500/70">
                Elite Fragrance House
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-zinc-100">
                Thế Giới Hương Xa Xỉ
              </h2>
              <div className="w-16 h-[1px] bg-red-600/30 mt-1" />
            </div>

            <p className="font-sans text-sm text-zinc-300 leading-relaxed">
              Tobi Perfume tự hào là điểm đến uy tín hàng đầu, mang đến những kiệt tác mùi hương nhập khẩu chính ngạch 100% từ các nhà hương lừng danh tại Pháp và Ý. Mỗi làn hương là một lời cam kết về chất lượng và độ tinh khiết tối thượng.
            </p>

            {/* Fragrance Notes Stack */}
            <div className="flex flex-col gap-4">
              {[
                {
                  title: "Tuyệt Phẩm Designer & Niche (Elite Collection)",
                  desc: "Khám phá bộ sưu tập phong phú quy tụ hơn 300+ dòng nước hoa xa xỉ từ các boutique danh tiếng châu Âu, đáp ứng mọi gu thưởng thức khắt khe nhất.",
                },
                {
                  title: "Trải Nghiệm Khứu Giác Độc Bản (Signature Scent)",
                  desc: "Đội ngũ chuyên gia mùi hương giàu kinh nghiệm đồng hành giúp bạn tìm ra mật mã khứu giác độc bản khẳng định cá tính riêng biệt.",
                },
                {
                  title: "Dịch Vụ Hậu Mãi Đẳng Cấp (Ultimate Service)",
                  desc: "An tâm tuyệt đối với cam kết nước hoa chính hãng 100%, chính sách bảo hành mùi hương trọn đời đến giọt cuối cùng và đóng gói quà thủ công.",
                },
              ].map((note, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-1.5 p-4 bg-zinc-950/60 backdrop-blur-md border border-zinc-800/40 rounded-xl hover:border-red-900/30 transition-all duration-300"
                >
                  <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-semibold text-amber-400">
                    {note.title}
                  </span>
                  <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                    {note.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: CTA & Consulting Section */}
        <section id="section-dacquyen" className="h-screen flex items-center justify-start px-6 md:px-24 relative pointer-events-none">
          <div className="w-full md:w-1/2 max-w-lg flex flex-col gap-6 pointer-events-auto">
            <div className="flex flex-col gap-2">
              <span className="font-sans text-xs uppercase tracking-[0.25em] text-red-500/70">
                The Sanctuary
              </span>
              <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-zinc-100">
                Đặc Quyền Sở Hữu
              </h2>
              <div className="w-16 h-[1px] bg-red-600/30 mt-1" />
            </div>

            <p className="font-sans text-sm text-zinc-300 leading-relaxed">
              Mỗi tác phẩm Tobi Perfume mang cấu trúc vòng xoáy pha lê huyền bí phản chiếu linh hồn các thương hiệu xa xỉ bậc nhất thế giới. Chúng tôi kiến tạo niềm tin thông qua những chuẩn mực phục vụ khắt khe nhất.
            </p>

            {/* Brand Credibility Points */}
            <div className="grid grid-cols-1 gap-3.5 my-2">
              {[
                {
                  label: "BẢO CHỨNG CHÍNH HÃNG 100%",
                  text: "Nhập khẩu chính ngạch trực tiếp. Hoàn tiền 200% nếu phát hiện sai lệch và bảo hành mùi hương trọn đời đến giọt cuối cùng."
                },
                {
                  label: "DỊCH VỤ THƯỢNG LƯU",
                  text: "Tư vấn khứu giác cá nhân hóa bởi chuyên gia mùi hương giàu kinh nghiệm. Thiết kế hộp quà đóng gói thủ công nghệ thuật."
                },
                {
                  label: "SỰ TIN CẬY TUYỆT ĐỐI",
                  text: "Điểm hẹn uy tín của hơn 20,000 tín đồ hương thơm cao cấp và giới mộ điệu trên toàn lãnh thổ Việt Nam."
                }
              ].map((pt, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-amber-500">{pt.label}</span>
                    <p className="font-sans text-[11px] text-zinc-400 leading-relaxed mt-0.5">{pt.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              {/* Instagram Consulting Button */}
              <Magnetic strength={0.25}>
                <a
                  href="https://ig.me/m/ltc.hiu"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleConsultClick}
                  onMouseEnter={() => setIsHoveredCTA(true)}
                  onMouseLeave={() => setIsHoveredCTA(false)}
                  className="flex h-14 items-center justify-center gap-2 rounded-full border border-red-500/40 bg-transparent px-8 text-xs font-semibold uppercase tracking-[0.2em] text-red-500 transition-all hover:bg-red-500/5 hover:border-red-400 w-full sm:w-auto text-center cursor-pointer"
                >
                  Tư vấn ngay
                </a>
              </Magnetic>              
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-zinc-900/50 bg-[#0b0c10] relative z-20 pointer-events-none">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-zinc-500 pointer-events-auto">
            © 2026 TOBI PERFUME. ALL RIGHTS RESERVED.
          </p>
        </footer>
      </div>

      {/* Modern Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 bg-zinc-950/95 border border-zinc-800/80 backdrop-blur-md px-5 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.65)] max-w-sm w-[90%] pointer-events-auto"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-amber-500">
                Đã sao chép tin nhắn mẫu!
              </span>
              <p className="font-sans text-[11px] text-zinc-300 leading-normal mt-0.5">
                Hãy dán (Ctrl+V) vào ô chat Instagram của shop để gửi yêu cầu tư vấn.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
