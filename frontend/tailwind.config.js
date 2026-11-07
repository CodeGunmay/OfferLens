/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep navy — navigation and primary branding
        navy: {
          DEFAULT: "#102A43",
          deep: "#0A1F33",
          soft: "#17395A",
          muted: "#1E4A70",
          ink: "#0B2033",
        },
        // Ocean blue — primary actions and links
        ocean: {
          DEFAULT: "#1677B8",
          dark: "#115E93",
          light: "#4E9CD1",
          tint: "#E9F2FA",
        },
        // Turquoise — successful matches and optimization (kept as `teal` for
        // backwards compatibility with existing component classes)
        teal: {
          DEFAULT: "#16B8A6",
          dark: "#0E9C8C",
          tint: "#E6F7F5",
          light: "#5AD3C6",
        },
        // Warm gold — savings and value highlights
        gold: {
          DEFAULT: "#E8B65C",
          dark: "#B98526",
          tint: "#FDF5E6",
          ink: "#7A5510",
        },
        // Soft red — warnings and mismatches
        coral: {
          DEFAULT: "#E56B6F",
          dark: "#C24A4E",
          tint: "#FDEDEE",
        },
        canvas: "#F6F9FC",
        line: "#E3EAF2",
        ink: "#102A43",
        muted: "#5B7186",
        subtle: "#8FA3B5",
        success: "#0F9D76",
        warning: "#B45309",
        danger: "#C24A4E",
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 42, 67, 0.04), 0 1px 3px rgba(16, 42, 67, 0.05)",
        raised: "0 10px 28px rgba(16, 42, 67, 0.09), 0 2px 6px rgba(16, 42, 67, 0.05)",
        pop: "0 18px 44px rgba(16, 42, 67, 0.18)",
        hero: "0 18px 40px -18px rgba(16, 42, 67, 0.45)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.08)",
      },
      borderRadius: { xl: "14px", "2xl": "20px" },
      fontSize: {
        "2xs": ["11px", { lineHeight: "14px", letterSpacing: "0.04em" }],
      },
      backgroundImage: {
        "navy-fade": "linear-gradient(160deg, #102A43 0%, #16395A 55%, #12506B 100%)",
        "teal-fade": "linear-gradient(135deg, #16B8A6 0%, #0E9C8C 100%)",
        "ocean-fade": "linear-gradient(135deg, #1677B8 0%, #115E93 100%)",
        "gold-fade": "linear-gradient(135deg, #F0C97C 0%, #E8B65C 100%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        "slide-in": { from: { opacity: "0", transform: "translateX(12px)" }, to: { opacity: "1", transform: "none" } },
        rise: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "fade-in": "fade-in 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-in": "slide-in 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        rise: "rise 240ms cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
