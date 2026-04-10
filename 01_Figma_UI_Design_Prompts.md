# NagorMind — Figma Make Prompts (Interactive + Backend-Connected)

> **Purpose**: Generate a fully interactive Figma prototype with proper page connections  
> **Each prompt = 1 Figma page/frame**  
> **Run prompts in the order listed** — later pages reference earlier components

---

## Page Map — Which Prompt Renders Which Page

```
PROMPT → PAGE NAME IN FIGMA        → WHAT IT IS                    → BACKEND CONNECTION
─────────────────────────────────────────────────────────────────────────────────────────
  1    → "Main Dashboard"           → Full app (desktop, empty)     → WebSocket: ws://localhost:3000/ws
  2    → "Dashboard - Active Chat"  → Full app with live chat       → WS: query, reasoning, tool_call, response
  3    → "Dashboard - Map Flags"    → Full app with accountability  → WS: accountability_flags, map_render
  4    → "Flag Popup - Detail"      → Popup overlay on map          → REST: GET /api/data/projects
  5    → "Accountability Panel"     → Side panel overlay            → WS: accountability_flags
  6    → "Mobile - Chat"            → Mobile view (chat tab)        → Same WebSocket as desktop
  7    → "Mobile - Map"             → Mobile view (map tab)         → Same WebSocket as desktop
```

### Figma Prototype Flow

```
┌─────────────────┐     user types query      ┌──────────────────────┐
│  1. Main        │ ──────────────────────────→│  2. Active Chat      │
│  Dashboard      │                            │  (reasoning + map)   │
│  (Empty/Welcome)│                            │                      │
└─────────────────┘                            └──────┬───────────────┘
                                                      │
                        agent calls Tool 13           │
                        (accountability check)        ▼
                                               ┌──────────────────────┐
                                               │  3. Dashboard with   │
                                               │  Map Flags           │
                                               └──────┬──────┬────────┘
                                                      │      │
                              click flag pin          │      │ click "🚩 Flags" button
                                                      ▼      ▼
                                          ┌───────────────┐ ┌────────────────┐
                                          │ 4. Flag Popup │ │ 5. Account.    │
                                          │ (overlay)     │ │ Panel (slide)  │
                                          └───────────────┘ └────────────────┘
```

---

## Design Tokens (Same for All Prompts)

```
COLORS:
  --bg-primary:       #0a0f1e
  --bg-secondary:     #111827
  --bg-glass:         rgba(17, 24, 39, 0.85) + backdrop-blur: 16px
  --accent-primary:   #00d4ff
  --accent-secondary: #6366f1
  --text-primary:     #f1f5f9
  --text-secondary:   #94a3b8
  --text-muted:       #64748b
  --success:          #4ade80
  --warning:          #facc15
  --danger-medium:    #fb923c
  --danger-high:      #ef4444
  --border:           rgba(255, 255, 255, 0.06)

TYPOGRAPHY:
  Font: 'Inter' for UI, 'JetBrains Mono' for code/tool badges
  
EFFECTS:
  Cards: backdrop-filter blur(16px), shadow 0 4px 24px rgba(0,0,0,0.4)
  Transitions: all 0.2s ease-out
```

---

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

---

## PROMPT 2 — Dashboard with Active Chat + Map Results

**Figma Page Name**: `Dashboard - Active Chat`  
**This is**: The app after user asks a question. Shows reasoning chain + map markers.  
**Backend Messages Shown**:
- `{ type: "reasoning" }` → italic thinking text
- `{ type: "tool_call" }` → 🛠️ badges
- `{ type: "tool_result" }` → → result text
- `{ type: "response" }` → final AI answer
- `{ type: "map_render" }` → markers/circles appear on map  
**Prev Page**: Prompt 1 (user submitted query)  
**Next Page**: If Tool 13 called → Prompt 3. Click any map marker → popup.

```
Design the active chat state of the NagorMind dashboard. Same split-screen 
layout as Prompt 1 but now with an active conversation and map markers.
Desktop 1440x900. Dark mode.

═══════════════════════════════════════════════════════════════════
LEFT PANEL (40% width, #111827):

  TOP BAR: Same as Prompt 1 (logo + settings icon)

  SUGGESTED CHIPS ROW: Same 4 chips as Prompt 1, slightly dimmed now

  CHAT THREAD (scrollable, flex-grow, padding 16px, gap 12px):

    MESSAGE 1 — USER (right-aligned):
      - Cyan gradient bubble (from #00d4ff to #0891b2), rounded-lg (top-right 
        corner: 4px, others: 16px), padding 10px 14px
      - Text: "Find hospitals near Mirpur 10" — white 14px
      - Timestamp below: "12:34 PM" — 11px #64748b, right-aligned
      
    MESSAGE 2 — AI REASONING (left-aligned, glass card):
      - Background: rgba(17,24,39,0.6), border 1px solid rgba(255,255,255,0.06),
        rounded-lg, padding 14px
      - Maximum width: 85% of panel
      
      Content (sequential, each item 6px gap):
      
      Line 1: "🔍 Let me find hospitals near Mirpur 10..." 
        → italic, 13px, color #00d4ff at 70% opacity
        → This shows when backend sends { type: "reasoning", text: "..." }
      
      Line 2: TOOL BADGE — "🛠️ geocode("Mirpur 10")"
        → Inline pill: height 24px, padding 4px 10px, rounded-full
        → Background: rgba(99,102,241,0.2), border 1px solid rgba(99,102,241,0.4)
        → Font: JetBrains Mono 11px, color #a5b4fc
        → Left icon: 🛠️
        → Right side: small green ✅ checkmark (completed state)
        → This shows when backend sends { type: "tool_call", tool: "geocode" }
      
      Line 3: RESULT — "→ Mirpur 10: 23.8069°N, 90.3687°E"
        → 12px Inter, color #4ade80 (green), padding-left 28px (indented)
        → This shows when backend sends { type: "tool_result" }
      
      Line 4: TOOL BADGE — "🛠️ query_osm_amenities(hospital, clinic)"
        → Same pill style as Line 2, with ✅ check
        
      Line 5: RESULT — "→ Found: 5 hospitals, 9 clinics within 2km"
        → Green text, indented
      
      Line 6: TOOL BADGE — "🛠️ render_on_map(14 markers)"
        → Same pill, ✅ check
      
      Line 7: RESULT — "→ Rendered 14 healthcare facilities on map"
        → Green text, indented
        → When this renders, markers appear on the RIGHT panel map
      
      DIVIDER: thin line, rgba(255,255,255,0.06), margin 8px 0
      
      Line 8: FINAL RESPONSE (from { type: "response" }):
        "I found **14 healthcare facilities** within 2km of Mirpur 10:
        
         • **5 hospitals** including Mirpur General Hospital
         • **9 clinics** including 3 government community clinics
         
         The nearest hospital is **Mirpur General** (450m from center).
         
         Coverage is **moderate** — the WHO recommends 1 primary care 
         facility per 10,000 population. With an estimated 90,000 people 
         in this area, the 14 facilities meet the standard, but 
         distribution is uneven (see gap zones on map)."
        → 14px Inter, color #f1f5f9, bold text highlighted
        → Links/numbers in cyan #00d4ff
    
    MESSAGE 3 — USER:
      "What about air quality here?"
    
    MESSAGE 4 — AI (currently loading):
      - Glass card with pulsing indicator:
        Three cyan dots (●●●) with wave animation
        "🔍 Checking air quality sensors near Mirpur 10..."
        → italic cyan at 70% opacity
        ⏳ "🛠️ get_air_quality()" — tool badge with spinning cyan border
           (instead of ✅, shows ⏳ hourglass)
        → This is the LOADING STATE while backend is processing

  INPUT BAR (sticky bottom): Same as Prompt 1
    → INTERACTIVE: type + click send → sends new { type: "query" } to backend
    → New messages append to chat thread above

═══════════════════════════════════════════════════════════════════
RIGHT PANEL (60% width) — MAP WITH RESULTS:

  Same dark basemap, but now zoomed to Mirpur 10 area (zoom 14)
  
  MARKERS ON MAP:
    - 5 large cyan circle markers (12px radius) for hospitals
      → Each has white "H" label inside
      → INTERACTIVE: click any marker → shows Leaflet popup with:
        Name, type, distance, OSM tags
        → Backend: data comes from { type: "tool_result" } of query_osm
    
    - 9 smaller cyan circle markers (8px radius) for clinics
      → Each has white "+" label
      → INTERACTIVE: click → popup with clinic details
    
    - 1 large dashed cyan circle (2km radius) centered on Mirpur 10
      → Semi-transparent fill: rgba(0,212,255,0.08)
      → Dashed border: 2px dashed #00d4ff at 40% opacity
      → Label at bottom of circle: "2km search radius"
    
    - PULSING CENTER DOT: red dot at the search center (23.8069, 90.3687)
      → 6px radius, pulsing animation (opacity 1→0.5→1)
      → Label: "Mirpur 10"

  LEGEND (bottom-right, glass card 180x80px):
    - "Healthcare Facilities"
    - 🏥 Hospital (5) — cyan large dot
    - ➕ Clinic (9) — cyan small dot
    - ⭕ Search radius — dashed circle

  MAP CONTROLS: Same as Prompt 1

═══════════════════════════════════════════════════════════════════
```

---

## PROMPT 3 — Dashboard with Accountability Flags on Map

**Figma Page Name**: `Dashboard - Map Flags`  
**This is**: The app after an accountability check. Map shows colored flag pins.  
**Backend Messages Shown**:
- `{ type: "accountability_flags", flags: [...] }` → flag pins appear on map
- `{ type: "response" }` → includes gap analysis + disclaimer  
**Prev Page**: Prompt 2 (agent decided to call Tool 13)  
**Next Page**: Click flag pin → Prompt 4 (popup). Click "🚩 Flags" button → Prompt 5 (panel).

```
Design the accountability check state of the NagorMind dashboard. Same 
split-screen but map now shows colored infrastructure delivery flag pins 
and chat shows the gap analysis result. Desktop 1440x900. Dark mode.

═══════════════════════════════════════════════════════════════════
LEFT PANEL (40%, #111827):

  TOP BAR + CHIPS: Same as before

  CHAT THREAD (showing accountability query):

    MESSAGE 1 — USER:
      "Check public infrastructure delivery for drainage projects in Mirpur"

    MESSAGE 2 — AI (completed, glass card):
      
      Line 1: "🔍 Let me cross-reference public spending with ground truth..."
        → italic cyan
      
      Line 2: 🛠️ geocode("Mirpur") → ✅ 
      Line 3: → "Mirpur: 23.807°N, 90.368°E" (green)
      
      Line 4: 🛠️ check_infrastructure_delivery() 
        → This badge has AMBER border instead of indigo (special tool)
        → Background: rgba(250,204,21,0.15), border: 1px solid rgba(250,204,21,0.4)
        → ✅ completed
      Line 5: → "Found 2 DNCC projects · BDT 6.2 Crore · 2021-2023" (white)
      Line 6: → "OSM evidence: 8 drain segments" (white)
      Line 7: → "Expected: ~22 segments from budget" (white)
      Line 8: → "Delivery gap: 64% — 🚩 Very High" (RED #ef4444, bold)
        → This line triggers the flag pins on the map
      
      Line 9: 🛠️ render_on_map(3 flags) → ✅
      
      DIVIDER
      
      Line 10: FINAL RESPONSE:
        "Drainage infrastructure in Mirpur shows a **significant delivery gap**.
         
         Public records show **2 DNCC drainage projects** worth **BDT 6.2 Crore** 
         approved for this area (2021-2023). Based on CPTU standard unit costs, 
         that budget should yield approximately **22 drain segments**.
         
         OSM currently maps only **8 drain segments** within 2km."
      
      GAP SCORE CARD (embedded in message):
        → Amber/red bordered card (border-left: 4px solid #ef4444)
        → Background: rgba(239,68,68,0.08)
        → Content: 
          "Infrastructure Delivery Gap"  (12px muted)
          "🚩 VERY HIGH — 64%"  (bold 18px #ef4444)
          Progress bar: 300px wide, 8px tall, filled 64% with red gradient
          "Expected: 22  |  Found: 8  |  Gap: 14 segments" (12px muted)
      
      SOURCES SECTION:
        → "📄 Sources:" label
        → "[IMED Project #DNCC-2021-0089]" — clickable cyan link
          → INTERACTIVE: opens source_url in new tab
          → Backend: URL comes from tool_result.source_urls[]
        → "[DNCC-2022-0134]" — clickable cyan link
      
      DISCLAIMER BANNER (MANDATORY, non-dismissable):
        → Background: rgba(250,204,21,0.1), border 1px solid rgba(250,204,21,0.3)
        → Rounded-md, padding 10px 12px
        → "⚠️ This is a statistical anomaly flag based on public data only. 
           It does not constitute evidence of wrongdoing. Gaps may reflect 
           OSM incompleteness, project delays, or scope changes."
        → 12px Inter, color #facc15 at 80% opacity
        → This ALWAYS appears on every accountability response

  INPUT BAR: Same

═══════════════════════════════════════════════════════════════════
RIGHT PANEL (60%) — MAP WITH FLAG PINS:

  Map zoomed to Mirpur area (zoom 13)
  
  ACCOUNTABILITY FLAG PINS (from { type: "accountability_flags" }):
  
    Pin 1 — 🚩 RED FLAG (23.807, 90.368):
      → Custom marker: red circle (16px) with 🚩 emoji or flag icon
      → Red glow: box-shadow 0 0 12px rgba(239,68,68,0.4)
      → Label floating above: "Drainage Phase 2 · 67%" in 11px white on
        dark pill background
      → INTERACTIVE: click → OPEN Prompt 4 (Flag Popup) as overlay
      → Backend data: from accountability_flags[0]
    
    Pin 2 — 🚩 RED FLAG (23.812, 90.372):
      → Same style as Pin 1
      → Label: "Pallabi Road · 72%"
      → INTERACTIVE: click → Prompt 4 popup with Pin 2 data
    
    Pin 3 — 🔴 ORANGE PIN (23.801, 90.365):
      → Orange circle (14px) with ⚠️ icon
      → Orange glow: box-shadow 0 0 10px rgba(251,146,60,0.3)
      → Label: "Health Clinic · 45%"
      → INTERACTIVE: click → Prompt 4 popup
    
    Pin 4 — ✅ GREEN PIN (23.815, 90.375):
      → Green circle (12px) with ✅ icon, subtle green glow
      → Label: "School Extension · 12%"
      → INTERACTIVE: click → Prompt 4 popup (shows low gap = good)
    
    Pin 5 — ✅ GREEN PIN (23.809, 90.360):
      → Same green style
      → Label: "WASA Pipeline · 8%"

  EXISTING LAYERS:
    - 8 drain segments shown as cyan polylines on the map
    - Dashed 2km radius circle

  LEGEND (bottom-right, glass card 200x130px):
    "Infrastructure Delivery Gap"
    🚩 Very High (>60%) — red dot
    🔴 High (40-60%) — orange dot  
    ⚠️ Moderate (20-40%) — yellow dot
    ✅ Low (<20%) — green dot

  ACCOUNTABILITY BUTTON (bottom-left, floating):
    → Glass card button: "🚩 3 Flags Found" 
    → Background: rgba(239,68,68,0.15), border 1px solid rgba(239,68,68,0.4)
    → 13px Inter bold, white text, 🚩 emoji
    → Pulsing subtle red glow animation
    → INTERACTIVE: click → OPEN Prompt 5 (Accountability Panel) as slide-in
    → Badge: red circle with "3" count (top-right of button)

═══════════════════════════════════════════════════════════════════
```

---

## PROMPT 4 — Flag Popup (Map Overlay)

**Figma Page Name**: `Flag Popup - Detail`  
**This is**: A popup card that appears when clicking a flag pin on the map.  
**Backend Data Source**: Individual flag object from `{ type: "accountability_flags" }.flags[i]`  
**Prev Page**: Prompt 3 (clicked a flag pin)  
**Interactions**: "View Source" → opens govt URL. "Ask AI" → sends follow-up query (→ Prompt 2)

```
Design this as an OVERLAY on top of Prompt 3's map. Show the map dimmed slightly 
in the background with this popup card floating above a red flag pin.
Width of popup: 340px. Dark mode.

BACKGROUND: The Prompt 3 map, slightly dimmed (overlay rgba(0,0,0,0.3))

POPUP CARD (centered on pin, floating above it):
  - Background: #1e293b
  - Border: 1px solid rgba(255,255,255,0.1)
  - Border-radius: 12px
  - Box-shadow: 0 8px 32px rgba(0,0,0,0.6)
  - Small triangle pointer at bottom-center pointing to the pin below
  - Padding: 16px

  CLOSE BUTTON (top-right): "✕" in muted gray, 20px
    → INTERACTIVE: click → close popup, return to Prompt 3

  ROW 1: Header
    🚩 emoji (20px) + "Mirpur Drainage Phase 2" — bold 16px white
    → Data from: flags[i].project_name

  ROW 2: Info Grid (2 columns, gap 16px, margin-top 12px):
    Col 1:
      Label: "Budget" — 11px #64748b
      Value: "BDT 4.5 Crore" — 14px white bold
      Sub: "(2022)" — 11px #94a3b8
      → Data from: flags[i].budget_bdt (formatted to Crore)
    
    Col 2:
      Label: "Agency" — 11px #64748b  
      Value: "DNCC" — 14px white bold
      → Data from: flags[i].agency

  ROW 3: Evidence Grid (2 columns, margin-top 12px):
    Col 1:
      Label: "Expected" — 11px #64748b
      Value: "~18 drain segments" — 14px white
      → Data from: flags[i].expected_count
    
    Col 2:
      Label: "OSM Found" — 11px #64748b
      Value: "6 segments" — 14px #ef4444 bold (RED because gap is high)
      → Data from: flags[i].osm_count

  ROW 4: Gap Score Bar (margin-top 14px):
    Label: "Delivery Gap Score" — 11px #64748b
    Progress bar: full width, height 10px, rounded-full
      Background: #1e293b
      Fill: 67% width, gradient from #fb923c to #ef4444 (left to right)
    Below bar:
      Left: "0%" in 10px muted
      Right: "67% — Very High 🚩" in 14px bold #ef4444
    → Data from: flags[i].gap_percent, flags[i].gap_label

  ROW 5: Action Buttons (margin-top 14px, flex row, gap 8px):
    Button 1: "View Source ↗" 
      → Outline style: border 1px solid #00d4ff, transparent bg, 
        color #00d4ff, rounded-md, padding 8px 16px, 13px Inter
      → INTERACTIVE: click → opens flags[i].source_url in new browser tab
      → Hover: bg rgba(0,212,255,0.1)
    
    Button 2: "Ask AI About It"
      → Filled style: bg #00d4ff, color white, rounded-md, 
        padding 8px 16px, 13px Inter bold
      → INTERACTIVE: click → close popup + navigate to Prompt 2 
        + send query: "Tell me more about the {project_name} project 
        in {thana}. What could explain the delivery gap?"
      → Hover: bg #00bfe6, scale(1.02)
      → Backend: sends { type: "query", text: "..." } via WebSocket

  ROW 6: Disclaimer (margin-top 12px):
    Background: rgba(250,204,21,0.08)
    Border: 1px solid rgba(250,204,21,0.2)
    Rounded-md, padding 8px 10px
    "⚠️ Statistical flag only. Not evidence of wrongdoing."
    → 11px Inter, color rgba(250,204,21,0.7)
    → This is ALWAYS visible. NEVER hide or make dismissable.
    → Data from: flags[i].disclaimer
```

---

## PROMPT 5 — Accountability Panel (Slide-in Overlay)

**Figma Page Name**: `Accountability Panel`  
**This is**: A side panel that slides in from the right over the map.  
**Backend Data Source**: Full `{ type: "accountability_flags" }` message (all flags)  
**Prev Page**: Prompt 3 (clicked the "🚩 Flags" button)  
**Interactions**: Click project card → highlight pin on map. "Export" → generates text report.

```
Design this as a SLIDE-IN OVERLAY on the right side of Prompt 3. The panel 
overlays the map (map is visible but dimmed behind it on the left).
Panel width: 380px. Full height: 900px. Dark mode.

PANEL (right-aligned, full height):
  Background: rgba(17,24,39,0.95), backdrop-filter blur(20px)
  Border-left: 1px solid rgba(255,255,255,0.08)
  Box-shadow: -8px 0 32px rgba(0,0,0,0.5)

  ─── HEADER (padding 20px, border-bottom) ───

  Row 1:
    Left: "🚩 Accountability Flags" — bold 18px white
    Right: CLOSE BUTTON "✕" — 22px #94a3b8
      → INTERACTIVE: click → slide panel out (→ return to Prompt 3)
      → Hover: color white
  
  Row 2: "Mirpur Area · 2020-2024" — 13px #94a3b8
    → Data from: area name + date range of projects

  ─── SUMMARY CARD (margin 16px, glass card) ───
  
  Background: rgba(30,41,59,0.8), border 1px solid rgba(255,255,255,0.06),
  rounded-lg, padding 16px
  
  3-column stat row:
    Stat 1: "5" large 24px bold #00d4ff + "analyzed" 11px muted below
    Stat 2: "3" large 24px bold #ef4444 + "flagged" 11px muted below  
    Stat 3: "₿12.4Cr" large 20px bold white + "total budget" 11px muted below
  
  Mini bar chart below (4 small horizontal bars):
    Very High (1): red bar, 25% width
    High (1): orange bar, 25% width
    Moderate (1): yellow bar, 25% width  
    Low (2): green bar, 50% width
    → Labels: severity name + count, 10px muted

  ─── FILTER CHIPS (padding 16px, flex-row, gap 6px) ───
  
  5 toggleable pill chips (height 28px, rounded-full, 11px Inter):
    "All (5)" — ACTIVE: bg #00d4ff, white text
      → INTERACTIVE: click → show all project cards
    "🚩 Very High (1)" — INACTIVE: bg transparent, border #ef4444, red text
      → INTERACTIVE: click → filter list to Very High only
    "🔴 High (1)" — border #fb923c, orange text
    "⚠️ Moderate (1)" — border #facc15, yellow text
    "✅ Low (2)" — border #4ade80, green text
  
  Active chip: filled background. Inactive: outline only.
  Only one chip can be active at a time.

  ─── PROJECT LIST (scrollable, padding 0 16px 16px, gap 10px) ───
  
  CARD 1 (border-left: 3px solid #ef4444):
    Background: #1e293b, rounded-md, padding 12px
    Row 1: 🚩 "Pallabi Road Widening" — bold 14px white
    Row 2: "Budget: BDT 3.2 Cr  ·  Gap: 72%" — 12px #94a3b8
    Row 3: Progress bar (full width, 6px tall, filled 72% red gradient)
    Row 4: "DSCC · 2021" — 11px #64748b
    → INTERACTIVE: click → highlight/zoom this pin on map + open Prompt 4 popup
    → Hover: border-color brightens, subtle glow
    → Backend data: accountability_flags.flags[0]
  
  CARD 2 (border-left: 3px solid #ef4444):
    🚩 "Mirpur Drainage Phase 2"
    "Budget: BDT 4.5 Cr  ·  Gap: 67%"
    Progress bar 67% red
    "DNCC · 2022"
    → Same interactions

  CARD 3 (border-left: 3px solid #fb923c):
    🔴 "Mirpur-10 Health Clinic"
    "Budget: BDT 2.1 Cr  ·  Gap: 45%"
    Progress bar 45% orange
    "DGHS · 2022"

  CARD 4 (border-left: 3px solid #4ade80):
    ✅ "Kazipara Primary School Extension"
    "Budget: BDT 1.8 Cr  ·  Gap: 12%"
    Progress bar 12% green
    "DPE · 2023"

  CARD 5 (border-left: 3px solid #4ade80):
    ✅ "Mirpur WASA Pipeline"
    "Budget: BDT 0.8 Cr  ·  Gap: 8%"
    Progress bar 8% green
    "DWASA · 2023"

  Cards are SORTED by gap_percent descending (worst first).

  ─── BOTTOM BAR (sticky bottom, padding 16px) ───
  
  "Export Report" button:
    Full width, height 44px, bg #00d4ff, color white, bold 14px,
    rounded-md, centered text
    → INTERACTIVE: click → generates a text summary of all flags 
      and copies to clipboard (or downloads as .txt)
    → Shows toast: "✅ Report copied to clipboard"
    → Hover: bg #00bfe6
    → Backend: client-side only (formats flags[] into text)
  
  Disclaimer: "⚠️ All analysis based on public data only" — 11px #64748b, centered
```

---

## PROMPT 6 — Mobile View (Chat Tab)

**Figma Page Name**: `Mobile - Chat`  
**This is**: Mobile responsive version with chat active  
**Same WebSocket** as desktop  
**Interactions**: Tab bar switches between Chat (Prompt 6) and Map (Prompt 7)

```
Design a mobile version of NagorMind. Width: 390px. Height: 844px. 
Dark mode. No device frame. Shows the Chat tab active.

TOP BAR (height 48px, bg #111827, border-bottom):
  Left: Small cyan icon (16px) + "NagorMind" 14px bold white
  Right: Hamburger menu icon (muted gray)

TAB BAR (height 40px, bg #0a0f1e, padding 4px):
  Two tab pills side by side (50% width each), rounded-full:
  Tab 1: "💬 Chat" — ACTIVE: bg #00d4ff, white text, bold 13px
    → Current view
  Tab 2: "🗺️ Map" — INACTIVE: transparent bg, #94a3b8 text, 13px
    → INTERACTIVE: click → navigate to Prompt 7 (Mobile Map view)

CHAT VIEW (full remaining height minus input bar):
  Same chat content as Prompt 2 but:
  - Messages use full width (no 85% max)
  - Tool badges wrap to next line on narrow width
  - Gap score card is full width
  - Disclaimer banner is full width

SUGGESTED CHIPS: Horizontal scrollable row (single line, overflow scroll)
  Same 4 chips but smaller (10px font, height 28px)

INPUT BAR (sticky bottom, safe area padding 34px bottom):
  Same input field + send button but full width
  → Same WebSocket connection as desktop

FLOATING ACTION BUTTON (bottom-right, above input bar):
  48x48 circle, bg rgba(239,68,68,0.2), border 1px solid #ef4444
  "🚩" emoji centered
  → INTERACTIVE: click → open FULL-SCREEN accountability panel overlay
    (same content as Prompt 5 but full width 390px, swipe-down to close)
  → Only visible when accountability flags exist
  → Badge: red dot with flag count

Background: #0a0f1e.
```

---

## PROMPT 7 — Mobile View (Map Tab)

**Figma Page Name**: `Mobile - Map`  
**This is**: Mobile responsive version with map active  
**Interactions**: Tab switches to Chat (Prompt 6). Flag pins clickable (Prompt 4 adapted).

```
Design the mobile MAP tab of NagorMind. Width: 390px. Height: 844px. 
Dark mode. No device frame.

TOP BAR: Same as Prompt 6

TAB BAR:
  Tab 1: "💬 Chat" — INACTIVE now
    → INTERACTIVE: click → navigate to Prompt 6
  Tab 2: "🗺️ Map" — ACTIVE: bg #00d4ff, white text

MAP VIEW (full remaining height):
  Same dark basemap centered on Mirpur area
  Shows all markers and flag pins from Prompt 3
  Touch-friendly: pins have 44px minimum tap target
  
  Flag pins:
    → INTERACTIVE: tap → popup appears at bottom of screen (bottom sheet)
       instead of floating above pin (mobile-friendly)
    → Bottom sheet: same content as Prompt 4 popup but full width,
       slides up from bottom, rounded-top corners, drag handle at top

LEGEND: Collapsed by default into a small expandable pill (bottom-left):
  "🗺️ Legend ▾" — small glass pill
  → INTERACTIVE: tap → expands to show full legend card

FLOATING 🚩 BUTTON: Same as Prompt 6 (bottom-right)
  → Opens full-screen accountability panel

No input bar on map tab (switch to chat tab to ask questions).
```

---

## Complete Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERACTION FLOW MAP                         │
│                                                                 │
│  ┌──────────┐   type query    ┌──────────────┐                 │
│  │ Prompt 1  │───────────────→│  Prompt 2     │                 │
│  │ Welcome   │   click chip   │  Active Chat  │                 │
│  │ (empty)   │───────────────→│  + Map pins   │                 │
│  └──────────┘                 └──────┬────────┘                 │
│                                      │                          │
│                       Tool 13 called │                          │
│                                      ▼                          │
│                               ┌──────────────┐                 │
│                               │  Prompt 3     │                 │
│                               │  Map + Flags  │←─── click      │
│                               │               │     close      │
│                               └──┬────────┬───┘                │
│                     click pin    │        │   click 🚩 button   │
│                                  ▼        ▼                     │
│                          ┌─────────┐ ┌──────────┐              │
│                          │Prompt 4 │ │ Prompt 5  │              │
│                          │Popup    │ │ Panel     │              │
│                          │(overlay)│ │ (slide-in)│              │
│                          └────┬────┘ └─────┬─────┘              │
│                  "Ask AI"     │  click card │                   │
│                               ▼             ▼                   │
│                         ┌──────────────┐   highlights           │
│                         │  Prompt 2     │   pin on map          │
│                         │  (new query)  │   + opens popup       │
│                         └──────────────┘                        │
│                                                                 │
│  MOBILE:                                                        │
│  ┌──────────┐  tab switch  ┌──────────┐                        │
│  │ Prompt 6  │←───────────→│ Prompt 7  │                        │
│  │ Mobile    │             │ Mobile    │                        │
│  │ Chat Tab  │             │ Map Tab   │                        │
│  └──────────┘              └──────────┘                        │
│                                                                 │
│  BACKEND CONNECTIONS:                                           │
│  All pages share: WebSocket ws://localhost:3000/ws              │
│  Prompt 1:  sends { type: "query" } on submit                  │
│  Prompt 2:  receives reasoning → tool_call → tool_result →     │
│             response → map_render                              │
│  Prompt 3:  receives accountability_flags                      │
│  Prompt 4:  reads from flags[i] data                           │
│  Prompt 5:  reads from full flags[] array                      │
│  Prompt 6-7: same as Prompt 1-3 (mobile layout)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## WebSocket Message ↔ UI Element Mapping

| Backend Message | Shows Up In | UI Element |
|----------------|-------------|------------|
| `{ type: "reasoning", text }` | Prompt 2 chat | Italic cyan thinking text |
| `{ type: "tool_call", tool, args }` | Prompt 2 chat | 🛠️ indigo pill badge |
| `{ type: "tool_result", tool, result }` | Prompt 2 chat | → green result text |
| `{ type: "response", text }` | Prompt 2 chat | White text response block |
| `{ type: "map_render", geojson, style }` | Prompt 2/3 map | Markers, circles, polygons |
| `{ type: "accountability_flags", flags }` | Prompt 3 map | Colored flag pins |
| Same flags data | Prompt 4 popup | Individual flag details |
| Same flags data | Prompt 5 panel | Ranked list of all flags |
| `{ type: "error", message }` | Any prompt chat | Red error banner in chat |

---

*Run prompts 1→7 in order. Each prompt references the previous ones for visual consistency.*
