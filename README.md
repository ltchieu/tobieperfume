# TOBI PERFUME — Immersive 3D Fragrance Gallery

An interactive, luxury-themed WebGL showcase and digital catalog for **Tobi Perfume**. The experience merges a custom 3D Sharingan/Kamui olfactory portal with a high-end, glassmorphic database of premium niche fragrances.

---

## 🌌 Key Features

* **3D Kamui Olfactory Portal**: A fully interactive Three.js & React Three Fiber (R3F) WebGL canvas. It features a customizable Sharingan medallion that responds dynamically to mouse coordinates, interactive hover cues, and transitions through assembly/spraying phases.
* **Fragrance Gallery (`/products`)**: A dedicated route featuring 10 premium signature perfumes. Each entry presents:
  * High-quality studio product photography.
  * Scent profile categorizations.
  * Structured fragrance pyramids detailing **Top Notes** (Hương đầu), **Heart Notes** (Hương giữa), and **Base Notes** (Hương cuối).
* **Direct Instagram Consultation**: Integrated CTAs that copy a personalized inquiry message (mentioning the exact brand and perfume name) to the user's clipboard and launch the shop's Instagram DMs.
* **Smooth Momentum Scrolling**: Powered by Lenis, synchronized with GSAP ScrollTrigger timelines and custom physics-based scroll events.
* **High-End Design System**: Built with a dark mode base (`#0b0c10`), crimson/amber glowing borders, glassmorphic panels, Outfit sans-serif body type, and Playfair Display serif headings.

---

## 🛠️ Tech Stack

* **Core Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
* **3D & WebGL**: [Three.js](https://threejs.org/), [@react-three/fiber](https://github.com/pmndrs/react-three-fiber), and [@react-three/drei](https://github.com/pmndrs/drei)
* **Animation**: [Framer Motion](https://www.framer.com/motion/) & [GSAP (GreenSock)](https://gsap.com/)
* **Scroll Engine**: [Lenis Smooth Scroll](https://lenis.darkroom.engineering/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)

---

## 📁 Directory Structure

```text
tobiperfume/
├── public/                 # Static assets (images, logos, icons)
│   └── images/products/    # Generated high-end perfume product shots
├── src/
│   ├── app/                # Next.js App Router (pages & global layouts)
│   │   ├── products/       # /products route (Perfume Gallery Page)
│   │   ├── globals.css     # Global styles & Tailwind theme overrides
│   │   └── layout.tsx      # Root HTML & Smooth Scroll providers
│   ├── components/         # Reusable UI & 3D WebGL components
│   │   ├── KamuiVortex.tsx # 3D sharingan warp animations
│   │   ├── Particles.tsx   # Olfactory particle physics
│   │   ├── ThreeCanvas.tsx # WebGL canvas shell & lighting setup
│   │   └── Magnetic.tsx    # Magnetic physics interaction for buttons
│   ├── page/               # Main layout page sections
│   │   └── IntroSection.tsx# 3D interactive hero and homepage copy
│   ├── model/              # TypeScript types and DTO interfaces
│   │   └── perfume.ts      # PerfumeDTO and ScentNotes structures
│   └── data/               # Static mock data stores
│       └── perfumes.ts     # Curated profiles of the 10 luxury perfumes
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/username/tobiperfume.git
   cd tobiperfume
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Run the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the interactive portal.

### Production Build

To compile a highly optimized production bundle and check TypeScript type validity:
```bash
npm run build
```

---

## 🛡️ License

© 2026 Tobi Perfume. All rights reserved.
