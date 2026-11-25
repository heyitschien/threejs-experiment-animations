# Living Window / 001 — Development brief v0.2
**Status:** concept CAD and first-order calculations; no physical tests, certification, patent clearance or manufacturing authorization. November 24, 2026.

## 1. Nature and design intent
Leaf stomata inspire adjustable vents; termite mounds inspire pressure-driven exchange; sun-following plants inspire shading; lotus surfaces inspire easy-clean finishes. Use a robust frame with independently replaceable components. Prioritize mechanical operation, material longevity and simplicity. First use case: a sheltered, non-egress daylight opening in a mild warm climate (Los Angeles as a representative case). The model is a test fixture, not a code-compliant window design. Baseline: ordinary operable low-E double-glazed window with conventional shading, operated according to the same weather conditions.

## 2. Existing technology and prior art
- Aereco EMM/EHA2: commercially available humidity-responsive inlets, up to 35 m³/h at 10 Pa for specified models. https://www.aereco.com/products/air-inlets/eha2/
- Titon Trimvent: existing manual ventilation and canopy options; use supplier-rated performance rather than treating a geometric slot as effective area. https://products.titon.com/product/trimvent-90-hi-lift/
- DOE: exterior shade and low-E glazing reduce undesirable solar gain. https://www.energy.gov/cmei/femp/purchasing-energy-efficient-residential-windows-doors-and-skylights
- Prior art includes integrated ventilation modules (EP3348771B1) and ventilating frame members (EP1070181B1); this is a limited prior-art scan, not an FTO or novelty opinion. https://patents.google.com/patent/EP3348771B1 ; https://patents.google.com/patent/EP1070181B1
- California 2025 Energy Code: check required mechanical ventilation and local building requirements; no assumption that passive openings substitute for them. https://www.energy.ca.gov/programs-and-topics/programs/building-energy-efficiency-standards/2025-building-energy-efficiency
- EPA smoke guidance: close outdoor openings during smoke and use appropriate indoor filtration/cooling while preserving emergency exits. https://www.epa.gov/wildfire-smoke-course/strategies-reduce-exposure-indoors
- NFRC certification uses thermal simulation and testing; air leakage requires physical testing. https://nfrc.org/residential/

## 3. Preliminary engineering architecture
| Parameter | Concept value |
|---|---|
| Main frame | 1200 × 1500 × 100 mm |
| Jambs/head/sill | 60 mm nominal |
| Upper/lower vent bands | 120 mm each; center separation 1260 mm |
| Cross rails | 40 mm each |
| Glazing envelope | 1080 × 1060 × 24 mm (6/12/6 schematic; supplier to size actual glass) |
| Vent face slot | 800 × 20 mm, 16,000 mm² geometric opening each face |
| Shade | 13 slats, 1030 × 60 × 4 mm envelopes, 80 mm pitch; illustrated at 25° |
| Materials | thermally broken aluminum concept, removable timber trim, EPDM seals, corrosion-resistant hardware |

The two vent paths are independent; airflow can reverse with wind or temperature. No guaranteed upper exhaust. Use a removable insect screen first, not a restrictive particulate filter in the passive channel. A filter/fan cassette is a separate future option only if tests justify it. Weather canopy, offset baffles, drain pan and outward weeps are required; drainage, seals, fastening, thermal break, glazing retention, damper travel and slat linkages are not fully engineered in the geometry. Do not install this model in a building or use it to order glazing.

## 4. Digital prototype and preliminary analysis
Files: STEP (mm, Z-up), GLB (m, Y-up), geometry.json (mm, Z-up), build_model.py and concept_board.png. All 59 components are named solid/mesh envelopes. GLB was reloaded and component count and width/height verified. STEP exported successfully, but has not undergone detailed fit, tolerance or structural review. No CFD, FEA or certified energy simulation performed.

Buoyancy screening: assume still air, indoor 298 K, 1.26 m separation, air density 1.2 kg/m³, g=9.81 m/s². ΔP≈ρgHΔT/T. Assume an illustrative effective CdA of 0.006 m² per complete vent (not measured). Two equal paths in series have combined CdA=0.006/√2 m². Q=CdA_combined√(2ΔP/ρ). Estimated absolute flow:
| Temperature difference | Stack pressure | Flow |
|---|---|---|
| 0 K | 0 Pa | 0 m³/h |
| 2 K | 0.10 Pa | 6.2 m³/h |
| 5 K | 0.25 Pa | 9.8 m³/h |
| 10 K | 0.50 Pa | 13.9 m³/h |
Direction depends on temperature sign; wind, screens, leakage and baffle losses change results. At 5 K a 30 m³ room would receive about 0.33 ACH under these assumptions, not a ventilation-compliance claim. At 10 Pa across ONE vent the assumed CdA yields 88 m³/h, substantially higher than the cited commercial 35 m³/h benchmark; actual resistance could be much larger. Measure before optimizing. The shaded glazing envelope is 1.145 m²; at 500 W/m² incident irradiance and hypothetical whole-glazing SHGC 0.30, unshaded solar gain is about 172 W. If a shade cuts incident solar radiation 50%, about 86 W is avoided in that snapshot, not an annual energy-saving prediction.

Controls (future): manual detents open/closed; optional local rules using indoor/outdoor temperature, humidity, outdoor particulate data, rain/wind and user override. In smoke or suspect sensor data close automatic supplemental vents and notify; preserve required ventilation via separately designed systems. Avoid assuming closed vents are smoke-tight. High wind retract/secure shade; no autonomous movement until pinch and wind hazards resolved. No AI in v0.2; compare deterministic rules with manual baseline before considering prediction.

## 5. Physical prototype and validation (not run)
Build one 300 mm-wide vent segment first, maintaining the section depth and slot height, with removable screen, baffles and manual damper. Use plywood/acrylic for bench mockup only, never as installed exterior construction. Calibrate differential manometer and low-flow measurement rig. Use clean air only. Measure pressure-flow in both directions at 0.25, 0.5, 1, 2, 5, 10 Pa; repeat 3 times. Compare bare opening, screen, baffles and damper. Report uncertainty and leakage with damper closed. Then test full assembly in a controlled lab for water, air leakage, structural loads, condensation, thermal performance and noise using applicable standards (confirm editions and lab methods). Test shade cycling, accessibility, removal, wind safety and manual override. Compare with baseline under matched conditions.

Provisional gates: >=10 m³/h for paired full-size vents at 0.5 Pa total pressure in intended mode; closed leakage no worse than matched baseline in standard test; no water reaching interior in agreed lab protocol; shade reduces measured solar heat gain vs unshaded reference by >=30% under defined sun angle; screen removal <=2 min without disturbing glazing; 1,000 manual cycles without jam as an early screening test only. Stop if airflow is inadequate, water enters, shade is unsafe or added complexity is not justified. No building installation until code/egress, safety glazing, water, structural and ventilation review by qualified professionals.

## 6. Manufacturing and economics (planning allowances, not quotes)
Start with stock profiles/vent components and standard IGU, mechanical controls, screw-fastened accessible covers. Recycled-content aluminum where documented, replaceable seals, supplier-backed finish, no permanent bonding of service modules. 30-year main-frame service-life ambition, not rating. Require materials declarations, repair parts and lifecycle comparison with baseline. Avoid specialty coatings until durability and environmental tradeoffs are verified.

Estimated bench vent materials $45–95 (sheet/board $15–30, screen $5–10, baffles/damper $10–25, seals/fasteners $15–30). Excludes instruments, tools and labor. Full-size pilot allowance $650–1,300 in parts (frame/trim $180–350, glazing $150–300, vents $100–200, shading $150–300, seals/hardware $70–150); excludes shipping, machining, labor, installation, certification and sensors. Prices are design allowances, not live supplier quotes. Production price and savings remain unknown. Do not buy full-size parts until vent tests pass. If integration costs too much, prioritize a retrofit vent/shade module using conventional windows rather than a proprietary whole-window system.

## 7. Roadmap status and next decision
Phase 01 concept design: preliminary board delivered. Phase 02 reconnaissance: initial public scan complete; patents, codes and supplier fit require specialist review. Phase 03 engineering: envelope and interfaces only. Phase 04 digital prototype: files generated and basic geometry validated; no simulation validation. Phase 05 physical: bench plan only. Phase 06 manufacturing: preliminary budget and architecture only. Next action: build a 300 mm vent coupon and establish measured CdA before any more automation or industrial design refinement. Keep the source files private unless explicit publication is requested.
