# NagorMind — Figma Make Prompts (Full UI Generation)

> **Purpose**: Copy-paste these prompts into Figma's "Make Design" / AI features to generate each screen and component of NagorMind.  
> **Design Language**: Dark mode, glassmorphism, data-dense urban planning dashboard.  
> **Brand Colors**: Deep navy `#0a0f1e`, Electric cyan `#00d4ff`, Alert amber `#facc15`, Danger red `#ef4444`, Success green `#4ade80`

---

## Design Tokens (Reference for All Prompts)

```
COLORS:
  --bg-primary:       #0a0f1e    (deep navy, main background)
  --bg-secondary:     #111827    (card/panel background)
  --bg-glass:         rgba(17, 24, 39, 0.85) with backdrop-blur: 16px
  --accent-primary:   #00d4ff    (electric cyan — buttons, links, active states)
  --accent-secondary: #6366f1    (indigo — secondary actions)
  --text-primary:     #f1f5f9    (off-white)
  --text-secondary:   #94a3b8    (muted gray)
  --text-muted:       #64748b    (very muted)
  --success:          #4ade80    (green — low gap)
  --warning:          #facc15    (yellow — moderate gap)
  --danger-medium:    #fb923c    (orange — high gap)
  --danger-high:      #ef4444    (red — very high gap)
  --border:           rgba(255, 255, 255, 0.06)
  --glow-cyan:        0 0 20px rgba(0, 212, 255, 0.15)

TYPOGRAPHY:
  --font-primary:     'Inter', sans-serif
  --font-mono:        'JetBrains Mono', monospace
  --heading-xl:       28px / 700 weight / -0.02em tracking
  --heading-lg:       22px / 600 weight / -0.01em tracking
  --body:             14px / 400 weight / 0em tracking
  --caption:          12px / 400 weight / 0.01em tracking
  --tool-badge:       11px / 500 weight / monospace

SPACING:
  --gap-xs:  4px
  --gap-sm:  8px
  --gap-md:  16px
  --gap-lg:  24px
  --gap-xl:  32px

RADII:
  --radius-sm:  6px
  --radius-md:  12px
  --radius-lg:  16px
  --radius-full: 9999px

EFFECTS:
  --shadow-card:    0 4px 24px rgba(0, 0, 0, 0.4)
  --shadow-popup:   0 8px 32px rgba(0, 0, 0, 0.6)
  --transition:     all 0.2s ease-out
```

---

## 1. MASTER LAYOUT — Main Dashboard

### Figma Make Prompt:

```
Design a full-screen dark mode urban planning AI dashboard called "NagorMind". 
The layout is a horizontal split screen:

LEFT PANEL (40% width):
- Top bar: App logo "NagorMind" with a brain/city icon in electric cyan (#00d4ff), 
  subtitle "AI Urban Advisor for Dhaka" in muted gray (#94a3b8)
- Below logo: a row of 3-4 suggested query chips with rounded pill shape, 
  semi-transparent background, subtle cyan border. Example chips: 
  "🚩 Accountability Check — Mirpur", "🏥 Healthcare gaps", "🌊 Flood risk", 
  "📊 Compare areas"
- Main area: Chat message thread (scrollable). Mix of user messages (right-aligned, 
  cyan bubble) and AI responses (left-aligned, dark glass card with subtle border)
- AI responses contain inline "tool call badges" — small pill-shaped tags showing 
  🛠️ geocode(), 🛠️ query_osm(), etc. in monospace font with indigo background
- Bottom: Input bar with dark glass background, rounded, with a send button 
  (cyan arrow icon) and a microphone icon

RIGHT PANEL (60% width):
- A full-height dark-themed map (like Mapbox dark style or CartoDB dark matter)
- Map shows Dhaka with subtle road outlines
- Overlay markers: colored circle pins (green, yellow, orange, red) scattered 
  across the map
- Coverage radius circles shown as semi-transparent cyan rings
- Red/gap zones shown as semi-transparent red polygons
- Bottom-right corner: small legend card showing gap score colors

Background: #0a0f1e. All panels use glassmorphism with backdrop-blur. 
Subtle grid pattern on background. No device frames. Desktop viewport 1440x900.
Font: Inter for UI, JetBrains Mono for code/tool badges.
```

---

## 2. CHAT PANEL — Detailed View

### Figma Make Prompt:

```
Design a detailed AI chat panel for an urban planning tool. Dark mode. 
Width: 560px. Height: full screen (900px).

TOP SECTION:
- Logo row: Cyan brain-city icon + "NagorMind" in bold 20px Inter + 
  "v2" badge in small indigo pill
- Divider line (subtle, rgba white 6% opacity)

SUGGESTED QUERIES ROW:
- Horizontal scrollable row of pill-shaped chips:
  "🚩 Accountability Check — Mirpur" (amber border)
  "🏥 Healthcare gaps" (cyan border)  
  "🌊 Flood risk" (blue border)
  "📊 Compare areas" (indigo border)
- Each chip: 12px Inter, rounded-full, semi-transparent bg, 1px colored border

CHAT THREAD (scrollable):
Show 3 messages:

Message 1 (User - right aligned):
  Cyan bubble with white text: "Analyze flood infrastructure in Mirpur 10"

Message 2 (AI - left aligned, glass card):
  Show the agent reasoning chain:
  - "🔍 Let me check drainage infrastructure..." in italic muted text
  - Tool call badge: "🛠️ query_osm_infrastructure()" — small indigo pill, mono font
  - Arrow "→ Found: 8 drain segments mapped" in success green
  - Tool call badge: "🛠️ check_infrastructure_delivery()" — small indigo pill
  - Arrow "→ Gap: 64% — 🚩 Very High" in danger red
  - Divider
  - Main response text in white, with a highlighted gap score block:
    amber/red bordered card showing "Infrastructure Delivery Gap: 🚩 VERY HIGH (64%)"
  - Disclaimer banner at bottom: amber background, small text:
    "⚠️ Statistical anomaly flag only. Not evidence of wrongdoing."

Message 3 (User):
  "Show me more details about the DNCC projects"

INPUT BAR (bottom, sticky):
  Dark glass rounded bar, placeholder "Ask about any area in Dhaka...", 
  cyan send arrow button, mic icon. Height ~50px.

Colors: bg #111827, text #f1f5f9, muted #94a3b8. Font: Inter 14px body, 
JetBrains Mono 11px for tool badges.
```

---

## 3. MAP PANEL — With Accountability Flags

### Figma Make Prompt:

```
Design a dark-themed interactive map panel for an urban planning AI tool. 
Width: 880px. Height: 900px. Shows Dhaka, Bangladesh.

MAP STYLE:
- Dark basemap (CartoDB dark matter style) — very dark navy/black roads 
  with subtle gray outlines
- Dhaka metro area visible with major roads and water bodies (Buriganga river)

MAP OVERLAYS:
1. Coverage circles: 2-3 semi-transparent cyan (#00d4ff at 15% opacity) 
   circles showing service coverage radii (different sizes: 500m, 1km, 2km)

2. Gap zones: 1-2 semi-transparent red (#ef4444 at 20% opacity) polygon 
   areas showing underserved zones

3. Accountability flag pins (5-6 scattered across north Dhaka):
   - 2x Red flag pins 🚩 with glow effect (Very High gap)
   - 1x Orange circle pin 🔴 (High gap)
   - 2x Yellow warning pins ⚠️ (Moderate gap)
   - 1x Green check pin ✅ (Low gap)

4. Amenity markers: Small cyan dots for hospitals, small green dots for schools

5. Thana boundary: Dashed white line showing one thana boundary outline

LEGEND (bottom-right, glass card, 200x120px):
  Title: "Infrastructure Delivery Gap"
  🚩 Very High (>60%) — red
  🔴 High (40-60%) — orange
  ⚠️ Moderate (20-40%) — yellow
  ✅ Low (<20%) — green

MAP CONTROLS (top-right):
  Zoom +/- buttons, layer toggle button, all in dark glass style

No device frames. Background behind map: #0a0f1e
```

---

## 4. FLAG POPUP — Infrastructure Delivery Popup

### Figma Make Prompt:

```
Design a map popup card for an urban infrastructure accountability tool. 
Dark mode. Width: 340px. Floating card with shadow and subtle glow.

POPUP DESIGN:
- Background: #1e293b with 1px border rgba(255,255,255,0.1)
- Border-radius: 12px
- Box shadow: 0 8px 32px rgba(0,0,0,0.6)
- Small triangle pointer at bottom center (pointing to map pin)

CONTENT:
Row 1: Red flag emoji 🚩 + "Mirpur Drainage Phase 2" in bold 16px white

Row 2 (info grid, 2 columns):
  Left column label (muted gray 12px): "Budget"
  Left column value (white 14px): "BDT 4.5 Crore (2022)"
  Right column label: "Agency"
  Right column value: "DNCC"

Row 3 (info grid):
  Left: "Expected" → "~18 drain segments"
  Right: "OSM Found" → "6 segments" (in red)

Row 4: Delivery gap bar
  - Full-width progress bar, background dark gray
  - Filled 67% with gradient from orange to red
  - Text overlay: "67% — Very High" in bold white
  - Small 🚩 icon at end

Row 5: Two action buttons side by side
  - "View Source ↗" — outline cyan button
  - "Ask AI About It" — filled cyan button
  Both: rounded-md, 13px Inter font

Row 6: Disclaimer
  - Amber/yellow tinted background (rgba), rounded
  - "⚠️ Statistical flag only. Not evidence of wrongdoing." 
  - 11px muted text

Font: Inter. No device frame.
```

---

## 5. ACCOUNTABILITY PANEL — Slide-in Side Panel

### Figma Make Prompt:

```
Design a slide-in side panel for accountability flags in a dark mode urban 
planning dashboard. Width: 380px. Height: full screen (900px). Appears on 
the right side overlaying the map.

HEADER:
- "🚩 Accountability Flags" title in bold 18px white
- Subtitle: "Mirpur Area — 2020-2024" in 13px muted gray
- Close X button (top right)
- Divider

SUMMARY CARD (glass card, full width):
  - "5 projects analyzed" in cyan
  - "3 flagged" in red
  - "BDT 12.4 Crore total budget" in white
  - Small donut chart or bar showing: 1 Very High, 1 High, 1 Moderate, 2 Low

FILTER CHIPS ROW:
  "All", "🚩 Very High", "🔴 High", "⚠️ Moderate" — small toggleable pills

FLAGGED PROJECTS LIST (scrollable):

Card 1 (red left border):
  🚩 "Mirpur Drainage Phase 2"
  Budget: BDT 4.5 Cr | Gap: 67%
  Red progress bar filled 67%
  "DNCC • 2022" in muted text

Card 2 (red left border):
  🚩 "Pallabi Road Widening"  
  Budget: BDT 3.2 Cr | Gap: 72%
  Red progress bar filled 72%
  "DSCC • 2021" in muted text

Card 3 (orange left border):
  🔴 "Mirpur-10 Health Clinic"
  Budget: BDT 2.1 Cr | Gap: 45%
  Orange progress bar filled 45%
  "DGHS • 2022" in muted text

Card 4 (green left border):
  ✅ "Kazipara Primary School Extension"
  Budget: BDT 1.8 Cr | Gap: 12%
  Green progress bar filled 12%
  "DPE • 2023" in muted text

Card 5 (green left border):
  ✅ "Mirpur WASA Pipeline"
  Budget: BDT 0.8 Cr | Gap: 8%
  Green progress bar filled 8%
  "DWASA • 2023" in muted text

BOTTOM BAR (sticky):
  "Export Report" button (filled cyan, full width)
  "⚠️ All analysis based on public data only" in 11px muted text

Background: #111827 with backdrop-blur. Cards: #1e293b with subtle borders.
Font: Inter. No device frame.
```

---

## 6. GAP METER COMPONENT

### Figma Make Prompt:

```
Design a delivery gap score meter component. Dark mode. Width: 300px. Height: 80px.

The component shows:
- Label "Infrastructure Delivery Gap" in 12px muted gray, left-aligned
- A horizontal progress bar (full width, height 10px, rounded-full):
  - Background: #1e293b (dark)
  - Fill: gradient based on percentage
    - 0-20%: green (#4ade80)
    - 20-40%: yellow (#facc15)  
    - 40-60%: orange (#fb923c)
    - 60-100%: red (#ef4444)
  - The bar is filled to 67%
- Below bar, right-aligned: "67%" in bold 20px red + "Very High 🚩" in 14px red
- Below that: "Expected: 18 | Found: 6" in 12px muted gray

Show 4 variants stacked vertically:
  1. Low gap (12%) — green fill
  2. Moderate gap (35%) — yellow fill
  3. High gap (52%) — orange fill
  4. Very High gap (67%) — red fill

Background: transparent. Font: Inter.
```

---

## 7. TOOL CALL BADGE COMPONENTS

### Figma Make Prompt:

```
Design a component library of "tool call badges" for an AI agent chat interface. 
Dark mode.

Each badge is a small inline pill showing an AI tool being called:
- Height: 24px
- Padding: 4px 10px
- Border-radius: full (pill shape)
- Background: #312e81 (deep indigo at 60% opacity)
- Border: 1px solid #4338ca (indigo, subtle)
- Font: JetBrains Mono, 11px, color #a5b4fc (light indigo)
- Icon: 🛠️ prefix

Show these 13 badge variants in a grid:
  🛠️ geocode("Mirpur")
  🛠️ query_osm_amenities()
  🛠️ query_osm_infrastructure()
  🛠️ get_boundary("Dhanmondi")
  🛠️ get_air_quality()
  🛠️ get_weather()
  🛠️ compute_service_coverage()
  🛠️ estimate_flood_risk()
  🛠️ compare_locations()
  🛠️ estimate_intervention_cost()
  🛠️ search_urban_standards()
  🛠️ render_on_map()
  🛠️ check_infrastructure_delivery()  ← this one has amber border instead of indigo

Also show a "result badge" variant:
  → "Found: 8 drain segments" — green text, no background, 12px Inter
  → "Gap: 64% — Very High 🚩" — red text, no background, 12px Inter bold

Background: #0a0f1e. Arrange in neat rows.
```

---

## 8. MOBILE RESPONSIVE VIEW

### Figma Make Prompt:

```
Design a mobile-responsive version of the NagorMind urban planning AI dashboard. 
Dark mode. Width: 390px (iPhone 14). Height: 844px. No device frame.

LAYOUT: Stacked vertical (map on top, chat below) with a toggle tab bar.

TOP BAR:
- "NagorMind" logo (small, 16px) left, hamburger menu right
- Height: 48px, background: #111827

TAB BAR (below top bar):
- Two tabs: "💬 Chat" and "🗺️ Map", pill-style toggle
- Active tab: cyan background, white text
- Inactive: transparent, muted text

MAP VIEW (when Map tab active):
- Full width, ~50% height
- Same dark basemap with Dhaka
- Flag pins visible
- Floating action button (bottom-right): "🚩" to open accountability panel
- Legend collapsed into a small expandable pill

CHAT VIEW (when Chat tab active):
- Same chat thread as desktop but single column
- Tool call badges wrap nicely on narrow width
- Input bar at bottom with safe area padding

ACCOUNTABILITY PANEL (full-screen overlay when opened):
- Same content as desktop slide-in but full width
- Swipe down to close gesture indicator (grabber bar at top)

Colors and fonts same as desktop. Show the Chat tab active state.
```

---

## 9. LOADING / REASONING STATE

### Figma Make Prompt:

```
Design a loading/reasoning state for the AI chat in a dark mode dashboard. 
Width: 540px.

Show a chat message from the AI that is currently "thinking":

REASONING BLOCK (glass card, left-aligned):
  - Animated pulsing cyan dot indicator (3 dots) at top
  - "🔍 Analyzing drainage infrastructure in Mirpur 10..." in italic 
    muted cyan text (animated feel)
  - Below: Sequential tool calls appearing one by one:
    ✅ 🛠️ geocode("Mirpur 10") — completed (green check, muted)  
    ✅ 🛠️ query_osm_infrastructure() — completed (green check, muted)
       → Found: 8 drain segments (green text)
    ⏳ 🛠️ check_infrastructure_delivery() — in progress (spinning cyan)
       Skeleton loading bar placeholder (animated shimmer)
    ○ 🛠️ render_on_map() — pending (gray, dimmed)

  - Progress indicator at bottom: "Step 3 of 4" with thin cyan progress bar

Background: #111827 card on #0a0f1e background. 
Font: Inter 14px, JetBrains Mono 11px for tool names.
Show the shimmer/loading animation state frozen mid-frame.
```

---

## 10. EMPTY STATE / ONBOARDING

### Figma Make Prompt:

```
Design an empty/welcome state for the NagorMind AI chat panel. Dark mode. 
Width: 540px. Height: 700px.

CENTER CONTENT:
- Large brain-city icon (64px) in cyan with subtle glow
- "Welcome to NagorMind" in bold 24px white
- "AI-powered urban planning advisor for Dhaka" in 14px muted gray
- Spacer (24px)

SUGGESTED ACTIONS (grid of 4 cards, 2x2):
  Each card: 240x100px, glass background, rounded-lg, hover glow effect

  Card 1: 🏥 icon
    "Healthcare Access"
    "Find hospitals, clinics & coverage gaps" in muted text

  Card 2: 🌊 icon
    "Flood Risk Analysis"  
    "Assess drainage & vulnerability" in muted text

  Card 3: 📊 icon
    "Compare Areas"
    "Side-by-side area analysis" in muted text

  Card 4: 🚩 icon (with amber glow)
    "Infrastructure Accountability"
    "Cross-reference spending vs. reality" in muted text

BOTTOM:
  "Powered by Gemini 2.5 Flash · 13 specialized urban analysis tools" 
  in 12px muted text

Background: #0a0f1e with subtle radial gradient glow (cyan, very faint) 
behind the icon. Font: Inter.
```

---

## Component Summary for Figma File Organization

```
📁 NagorMind UI Kit
├── 📄 Screens/
│   ├── Main Dashboard (Desktop 1440x900)
│   ├── Chat Panel Detail
│   ├── Map Panel with Flags
│   ├── Mobile View (390x844)
│   ├── Empty/Welcome State
│   └── Loading/Reasoning State
├── 📄 Components/
│   ├── Tool Call Badge (13 variants)
│   ├── Result Badge (success/danger variants)
│   ├── Gap Meter (4 severity variants)
│   ├── Flag Popup Card
│   ├── Accountability Panel
│   ├── Suggested Query Chip (4 variants)
│   ├── Chat Bubble — User
│   ├── Chat Bubble — AI Response
│   ├── Disclaimer Banner
│   ├── Legend Card
│   └── Input Bar
├── 📄 Tokens/
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Shadows & Effects
│   └── Border Radii
└── 📄 Icons/
    ├── Brain-City Logo
    ├── Flag Pins (4 severity levels)
    ├── Tool Icons
    └── Navigation Icons
```

---

*Each prompt above is self-contained — paste it directly into Figma Make or any AI design tool to generate that specific screen/component.*
