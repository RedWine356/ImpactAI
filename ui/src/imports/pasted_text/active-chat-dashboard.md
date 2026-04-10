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
