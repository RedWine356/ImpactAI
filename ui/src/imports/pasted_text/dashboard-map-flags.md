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
