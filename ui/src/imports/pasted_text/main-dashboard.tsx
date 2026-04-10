## PROMPT 1 — Main Dashboard (Empty / Welcome State)

**Figma Page Name**: `Main Dashboard`  
**This is**: The landing page when the app first loads. No messages yet.  
**Backend**: Connects via `WebSocket ws://localhost:3000/ws` on page load.  
**Next Page**: User types in input → navigate to **Prompt 2 (Active Chat)**

```
Design a full-screen dark mode AI urban planning dashboard called "NagorMind".
Desktop viewport: 1440x900. No device frames.

LAYOUT — Horizontal split screen:

═══════════════════════════════════════════════════════════════════
LEFT PANEL (40% width, background #111827):

  TOP BAR (height 64px, border-bottom rgba(255,255,255,0.06)):
    - Left: Cyan brain-city icon (24px) + "NagorMind" bold 18px white
      + "v2" small pill badge (indigo #6366f1 background, 10px font)
    - Right: Settings gear icon (muted gray), 20px

  SUGGESTED QUERY CHIPS (horizontal row, padding 16px, gap 8px):
    4 clickable pill-shaped chips, each rounded-full, height 32px, 
    padding 6px 14px, 12px Inter font:
    
    Chip 1: "🚩 Accountability — Mirpur" 
      → border: 1px solid #facc15, bg rgba(250,204,21,0.08)
      → INTERACTIVE: On click → navigate to Prompt 3 (sends pre-canned 
        query "Run infrastructure delivery gap analysis for Mirpur")
    
    Chip 2: "🏥 Healthcare gaps" 
      → border: 1px solid #00d4ff, bg rgba(0,212,255,0.08)
      → INTERACTIVE: On click → navigate to Prompt 2 (sends query 
        "Find hospitals and clinics near my area")
    
    Chip 3: "🌊 Flood risk" 
      → border: 1px solid #3b82f6, bg rgba(59,130,246,0.08)
      → INTERACTIVE: On click → navigate to Prompt 2 (sends query 
        "Assess flood risk in Mohammadpur")
    
    Chip 4: "📊 Compare areas"
      → border: 1px solid #6366f1, bg rgba(99,102,241,0.08)
      → INTERACTIVE: On click → navigate to Prompt 2 (sends query 
        "Compare healthcare between Mirpur and Dhanmondi")
    
    ALL CHIPS: hover state → background opacity increases to 0.15, 
    cursor pointer, scale(1.02)

  CENTER CONTENT (vertically centered in remaining space):
    - Large brain-city icon (64px) in cyan #00d4ff with subtle glow
      (box-shadow: 0 0 40px rgba(0,212,255,0.2))
    - "Welcome to NagorMind" — bold 24px white, margin-top 16px
    - "AI-powered urban planning advisor for Dhaka" — 14px #94a3b8
    - Spacer 24px

    4 CLICKABLE ACTION CARDS (2x2 grid, gap 12px):
      Each card: 230x100px, background rgba(17,24,39,0.6), 
      border 1px solid rgba(255,255,255,0.06), rounded-lg (12px)
      
      Card 1: 🏥 icon (24px) + "Healthcare Access" bold 14px + 
        "Find hospitals, clinics & coverage gaps" 12px muted
        → INTERACTIVE: click → navigate to Prompt 2, sends 
          "Show healthcare facilities near Mirpur 10"
        → Hover: border-color #00d4ff, glow, scale(1.02)
        → Backend: sends { type: "query", text: "..." } via WebSocket
      
      Card 2: 🌊 icon + "Flood Risk Analysis" + 
        "Assess drainage & vulnerability" 
        → INTERACTIVE: click → Prompt 2, query "Assess flood risk in Mohammadpur"
      
      Card 3: 📊 icon + "Compare Areas" + 
        "Side-by-side area analysis"
        → INTERACTIVE: click → Prompt 2, query "Compare Mirpur and Dhanmondi"
      
      Card 4: 🚩 icon (with amber glow) + "Infrastructure Accountability" + 
        "Cross-reference spending vs. reality"
        → INTERACTIVE: click → Prompt 3, query "Check delivery gaps in Mirpur"
        → This card has amber border (#facc15) instead of default

  BOTTOM TEXT:
    "Powered by Gemini 2.5 Flash · 13 specialized urban analysis tools" 
    12px #64748b, centered

  INPUT BAR (sticky bottom, height 60px, padding 12px):
    - Background: rgba(17,24,39,0.9), backdrop-blur, border-top rgba(255,255,255,0.06)
    - Input field: full width minus button, rounded-full (24px radius), 
      height 44px, background #1e293b, border 1px solid rgba(255,255,255,0.1),
      padding-left 16px, placeholder "Ask about any area in Dhaka..." 
      in #64748b, font 14px Inter
    - Send button: 44px circle, background #00d4ff, white arrow-up icon
      → INTERACTIVE: click → navigate to Prompt 2 with typed text
      → Hover: background #00bfe6, scale(1.05)
      → Backend: sends { type: "query", text: inputValue } via WebSocket

═══════════════════════════════════════════════════════════════════
RIGHT PANEL (60% width):

  FULL-HEIGHT MAP:
    - Dark basemap (CartoDB dark matter) — very dark navy with subtle gray roads
    - Centered on Dhaka (23.8103°N, 90.4125°E), zoom level 12
    - Buriganga river visible as dark blue
    - No markers yet (empty state)
    - Subtle "Explore Dhaka's infrastructure" watermark text centered on map,
      16px #64748b at 30% opacity
    
  MAP CONTROLS (top-right, vertical stack):
    - Zoom + button: 32x32 glass card, "+" white, rounded-md
    - Zoom - button: same style, "−" 
    - Layer toggle button: same style, layers icon
    All have hover: background rgba(255,255,255,0.1)

═══════════════════════════════════════════════════════════════════

Background: #0a0f1e with very subtle radial gradient (cyan at 3% opacity) 
centered behind the welcome content. Font: Inter.
```