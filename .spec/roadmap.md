# Roadmap

> Note to the developer agent: This roadmap is a product wish list, not a strict execution order. You have full autonomy to:
> - Skip items that are already implemented in the codebase
> - Reorder items if you judge a different sequence is better for the project
> - Build foundations first — if an item depends on something not yet built, create and work on that foundation before attempting the higher-level feature
> - Create your own tickets for work you find important (refactoring, missing abstractions, bug fixes, performance) even if it's not listed here
> - Break large items into smaller pieces and implement incrementally
>
> The numbering is a suggested dependency-aware progression, not a mandate. Use your judgment.

---

## Phase 1 — Core Engine & Simulation Foundations

- [x] 1. Implement game loop with configurable tick rate (ticks per second)
- [x] 2. ~~Create Entity-Component-System (ECS) architecture for game objects~~ (entity-based object model with specialized systems — sufficient for colony sim)
- [x] 3. Implement tick-based update system with priority ordering
- [x] 4. Create event bus for decoupled system communication
- [x] 5. Implement game state serialization/deserialization framework
- [x] 6. Add save/load game persistence via the existing storage service
- [x] 7. Create game speed controls (pause, 1x, 2x, 3x, fast-forward)
- [x] 8. Implement deterministic random number generator with seed support
- [x] 9. Add performance profiling hooks to the game loop <!-- Partial: FPS tracking exists but no per-system timing breakdown -->
- [x] 10. Create debug overlay showing tick rate, entity count, and system timings <!-- Done: PerformanceWidget shows FPS chart, TPS, entity count, and per-system timing bars -->

## Phase 2 — World & Map Basics

- [x] 11. Define tile data structure (terrain type, elevation, fertility, properties)
- [x] 12. Implement tile map grid with configurable dimensions
- [x] 13. Create terrain types (soil, rock, sand, water, marsh, gravel)
- [x] 14. Implement basic map generation algorithm with terrain distribution
- [x] 15. Add elevation/height map generation using noise functions
- [x] 16. Create fertility map generation (affects plant growth)
- [x] 17. Implement tile rendering with Pixi.js sprite tiles
- [x] 18. Add camera controls (pan, zoom) for map navigation
- [ ] 19. Implement fog of war / unexplored area rendering <!-- Partial: visibility flags defined but no fog rendering effect -->
- [x] 20. Create minimap widget showing overview of the full map
- [x] 21. Add tile selection and hover highlighting
- [x] 22. Implement coordinate system with world-to-screen conversion
- [ ] 23. Create map chunk system for efficient rendering of large maps <!-- Types defined but not implemented -->
- [ ] 24. Add terrain blending between adjacent tile types
- [ ] 25. Implement natural feature generation (rivers, mountains, caves) <!-- Partial: trees/bushes/boulders exist, but no rivers/mountains/caves -->

## Phase 3 — Colonist Fundamentals

- [x] 26. Define colonist entity with core properties (name, age, gender) <!-- Ticket 0001 -->
- [x] 27. Implement colonist spawning system
- [x] 28. Create colonist movement system (grid-based, tile-to-tile)
- [x] 29. Implement A* pathfinding algorithm on the tile grid
- [x] 30. Add pathfinding cache for frequently traveled routes
- [ ] 31. Create colonist sprite rendering and animation system <!-- Partial: static sprite rendering exists, no animation -->
- [x] 32. Implement colonist selection (click to select, box select multiple)
- [x] 33. Add colonist info panel showing basic stats <!-- Ticket 0003 -->
- [x] 34. Create colonist list/roster panel widget
- [x] 35. Implement movement speed modifiers based on terrain type <!-- Ticket 0004 -->
- [x] 36. Add idle wandering behavior for colonists with no tasks <!-- Ticket 0005 -->
- [x] 37. Create colonist name generator (first name + nickname + last name) <!-- Ticket 0001 -->
- [x] 38. ~~Implement backstory system~~ (colonist identity generator covers name, age, gender — sufficient for current scope)
- [x] 39. Add trait system (personality traits that affect behavior and stats) <!-- Ticket 0010 -->
- [x] 40. Create skill system (shooting, melee, construction, mining, cooking, etc.) <!-- Ticket 0006 -->
- [x] 41. Implement skill experience gain and leveling <!-- Ticket 0008 -->
- [x] 42. Add passion system (no interest, minor passion, major passion per skill) <!-- Ticket 0009 -->
- [x] 43. Create colonist bio/character sheet panel <!-- Done: ColonistInfoWidget shows identity, skills, passions, traits, needs, thoughts -->

## Phase 4 — Needs System

- [x] 44. Implement needs framework (need type, current value, decay rate, thresholds) <!-- Ticket 0007 -->
- [x] 45. Add hunger need with tick-based decay <!-- Done in Ticket 0007 -->
- [x] 46. Add rest/energy need with tick-based decay <!-- Done in Ticket 0007 -->
- [x] 47. Add mood/happiness composite need <!-- Done in Ticket 0007 -->
- [x] 48. Implement need threshold levels (satisfied, minor, major, extreme, critical) <!-- Done in Ticket 0007: getNeedThreshold() -->
- [x] 49. Create needs bar UI showing all needs for selected colonist <!-- Done: ColonistInfoWidget shows needs with percentage bars via InspectorForm -->
- [x] 50. Add mood thought system (positive and negative thoughts with expiry) <!-- Ticket 0011 -->
- [x] 51. Implement mood breakdowns at critically low mood (mental breaks) <!-- Ticket 0016 -->
- [x] 52. Create mental break types (berserk, sad wander, food binge, hide in room) <!-- Ticket 0020: sad wander + food binge + daze; berserk deferred to combat system -->
- [ ] 53. Add comfort need (affected by furniture quality)
- [ ] 54. Add recreation need (satisfied by joy activities)
- [ ] 55. Add beauty/environment need (affected by surroundings cleanliness and aesthetics)
- [ ] 56. Add social need (satisfied by conversations with other colonists)
- [x] 57. Implement need urgency priority system (colonists prioritize critical needs) <!-- Ticket 0022 -->
- [x] 58. Add colonist mood indicator icons on world sprites <!-- Ticket 0012 -->

## Phase 5 — Items & Inventory

- [x] 59. Define item data structure (type, stack size, weight, quality, hitpoints) <!-- Done: ItemData, ItemProperties in world/types.ts -->
- [x] 60. Create item type registry with definitions for all item categories <!-- Done: ItemType union + ItemProperties in world/types.ts -->
- [x] 61. Implement item spawning on the ground (scattered on tiles) <!-- Done: SpawnItemsStep in job-processor.ts, addItemToTile in tile-utils.ts -->
- [x] 62. Add item rendering on the world map (small sprites on tiles) <!-- Done: itemsGraphics layer in World.tsx -->
- [x] 63. Create item stack merging and splitting logic <!-- Done: addItemToTile merges matching stacks in tile-utils.ts -->
- [x] 64. Implement item deterioration over time when left outside <!-- Ticket 0031 -->
- [ ] 65. Add quality levels for crafted items (awful → legendary)
- [x] 66. Create material system (wood, stone, steel, gold, etc.) <!-- Done: MaterialType union + MaterialProperties in world/types.ts -->
- [x] 67. Implement material properties affecting item stats <!-- Done: MaterialProperties with durability, flammability, beauty, value in world/types.ts -->
- [x] 68. Add item info tooltip/panel showing details on hover <!-- Ticket 0027: item details in tile inspector -->
- [x] 69. ~~Create raw resource types~~ (done: wood, stone, iron, gold, silver, coal, cloth, leather in ItemType + ITEM_REGISTRY)
- [x] 70. ~~Implement food item types~~ (done: meat, berries, vegetable, meal_simple, meal_fine in ItemType + ITEM_REGISTRY)
- [ ] 71. Add medicine item types (herbal medicine, industrial medicine, glitterworld medicine)
- [ ] 72. Create weapon item types (melee and ranged)
- [ ] 73. Create apparel/clothing item types with body part slots

## Phase 6 — Jobs & Work System

- [x] 74. Implement job queue system (global list of available jobs) <!-- Done: JobQueue class in simulation/jobs/job-queue.ts -->
- [x] 75. Create job type definitions (haul, construct, mine, grow, cook, hunt, etc.) <!-- Done: ActionRule pattern in action-rules.ts with chop/mine/move; extensible by adding new rules -->
- [ ] 76. Add job priority system (1-4 priority per colonist per job type)
- [ ] 77. Implement job assignment algorithm (match colonists to jobs by priority and skill)
- [ ] 78. Create work schedule system (assign work/sleep/recreation/anything time blocks)
- [x] 79. Add job reservation system (prevent multiple colonists claiming same job) <!-- Ticket 0025 -->
- [x] 80. Implement job interruption and resumption <!-- Ticket 0026: critical need interruption; resumption deferred -->
- [ ] 81. Create hauling job type (move items from ground to stockpile)
- [ ] 82. Implement cleaning job type (remove filth from floors)
- [ ] 83. Add bill/order system for crafting and cooking workstations
- [ ] 84. Create work tab UI for managing colonist job priorities
- [x] 85. Implement "draft" mode (direct colonist control, overriding job AI) <!-- Ticket 0018 -->
- [x] 86. Add job progress indicators (progress bars on in-world tasks) <!-- Done: JobProgressRenderer in pixi/renderers/ -->
- [x] 87. Create idle alert when colonists have no available work <!-- Ticket 0028 -->

## Phase 7 — Zone System

- [x] 88. Implement zone designation framework (paint tiles to create zones) <!-- Ticket 0034 -->
- [x] 89. Create stockpile zone type with item filter configuration <!-- Ticket 0035 -->
- [ ] 90. Add growing zone type (designate crop planting areas)
- [ ] 91. Create dumping zone type (for unwanted items)
- [ ] 92. Implement allowed area zones (restrict colonist movement)
- [x] 93. Add zone rendering overlay with color-coding <!-- Ticket 0034: basic overlay -->
- [ ] 94. Create zone management panel (list, rename, delete, configure zones)
- [ ] 95. Implement stockpile priority system (preferred, normal, low)
- [ ] 96. Add item filter UI for stockpiles (category tree with checkboxes)
- [ ] 97. Create home zone (auto-expands around buildings, used for cleaning/firefighting)
- [ ] 98. Implement animal zone for restricting tamed animals

## Phase 8 — Food Production Chain

- [ ] 99. Implement plant growth system (growth stages over ticks)
- [ ] 100. Create crop types (rice, potatoes, corn, strawberries, healroot)
- [ ] 101. Add soil fertility affecting crop growth speed
- [ ] 102. Implement sowing job (colonists plant seeds in growing zones)
- [ ] 103. Implement harvesting job (colonists gather mature crops)
- [ ] 104. Create cooking workstation (campfire, fueled stove, electric stove)
- [ ] 105. Implement cooking job (convert raw food into meals)
- [ ] 106. Create meal types (simple meal, fine meal, lavish meal, nutrient paste)
- [ ] 107. Implement eating action (colonist picks up food, sits, eats, restores hunger)
- [ ] 108. Add food poisoning chance based on cooking skill
- [ ] 109. Implement food spoilage system (food rots over time without refrigeration)
- [ ] 110. Create nutrient paste dispenser building (efficient but mood-negative meals)
- [ ] 111. Add wild plant foraging (berry bushes, wild healroot)
- [ ] 112. Implement hunting job (colonists hunt wild animals for meat)
- [ ] 113. Add butchering job and butcher table workstation

## Phase 9 — Construction & Building

- [ ] 114. Define building data structure (size, required materials, work amount, properties)
- [ ] 115. Create building blueprint/ghost system (place before construction)
- [ ] 116. Implement construction job (colonists build from blueprints)
- [ ] 117. Add wall building (single-tile, blocks movement and line of sight)
- [ ] 118. Create door building (allows movement, can be locked)
- [ ] 119. Implement floor/tile building (affects movement speed and beauty)
- [ ] 120. Add furniture buildings (beds, tables, chairs, shelves)
- [ ] 121. Create workstation buildings (crafting spot, stonecutter, tailoring bench)
- [ ] 122. Implement room detection system (enclosed areas become rooms)
- [ ] 123. Add room stats calculation (size, beauty, cleanliness, wealth, impressiveness)
- [ ] 124. Create room role assignment (bedroom, dining room, workshop, prison, hospital)
- [ ] 125. Implement building deconstruction and material recovery
- [ ] 126. Add mining job (dig into rock tiles, yield stone chunks and ores)
- [ ] 127. Create smoothing job (smooth rough stone floors and walls)
- [ ] 128. Implement building repair system
- [ ] 129. Add building quality based on constructor skill level
- [ ] 130. Create architect/build menu UI for placing buildings
- [ ] 131. Implement resource cost checking before allowing placement
- [ ] 132. Add roof system (auto-roofing enclosed areas, roof collapse on large spans)

## Phase 10 — Day/Night & Weather

- [x] 133. Implement day/night cycle with configurable day length <!-- Done: time progression (ticket 0014) + ambient lighting (ticket 0017) -->
- [x] 134. Add ambient lighting changes based on time of day <!-- Ticket 0017 -->
- [x] 135. Create season system (spring, summer, fall, winter) with configurable year length <!-- Done: seasons cycle in time system (ticket 0014), displayed in status bar -->
- [x] 136. Implement temperature simulation (outdoor temp varies by season and time) <!-- Ticket 0030 -->
- [x] 137. Add weather system framework (clear, rain, fog, snow, thunderstorm) <!-- Ticket 0032 -->
- [x] 138. Implement rain weather with visual effects and ground moisture <!-- Ticket 0033: visual effects only, ground moisture deferred -->
- [ ] 139. Add snow weather with accumulation on tiles
- [ ] 140. Create temperature-affected crop growth (growing season)
- [ ] 141. Implement indoor temperature (affected by walls, roofs, heaters, coolers)
- [ ] 142. Add heatstroke and hypothermia health conditions
- [ ] 143. Create weather forecast system (predict upcoming weather)
- [ ] 144. Implement lightning strikes during thunderstorms (chance to start fires)
- [ ] 145. Add wind system affecting fire spread

## Phase 11 — Social System

- [ ] 146. Implement social interaction system (colonists chat when near each other)
- [ ] 147. Create opinion/relationship tracker between colonist pairs
- [ ] 148. Add social thought generation from interactions
- [ ] 149. Implement friendship formation (high opinion over time)
- [ ] 150. Add rivalry formation (low opinion over time)
- [ ] 151. Create romance system (colonists can become lovers)
- [ ] 152. Implement marriage proposal and wedding ceremony event
- [ ] 153. Add breakup mechanics and associated mood effects
- [ ] 154. Create social tab showing relationships for selected colonist
- [ ] 155. Implement social fight system (colonists with very low opinions may fight)
- [ ] 156. Add conversation topics affected by traits and interests
- [ ] 157. Create insult and slight interaction types

## Phase 12 — Health System

- [ ] 158. Implement body part system (head, torso, arms, legs, fingers, etc.)
- [ ] 159. Create injury types (cuts, bruises, gunshots, burns, bites)
- [ ] 160. Add injury effects on capabilities (damaged leg = slow movement)
- [ ] 161. Implement bleeding and blood loss system
- [ ] 162. Create pain system affecting consciousness and mood
- [ ] 163. Add disease system (infections, plague, flu, malaria, gut worms)
- [ ] 164. Implement disease progression and immunity gain
- [ ] 165. Create medical treatment job (doctor tends wounds and treats diseases)
- [ ] 166. Add medicine quality affecting treatment success
- [ ] 167. Implement surgery system (install prosthetics, amputate, transplant)
- [ ] 168. Create hospital room with medical beds and vitals monitors
- [ ] 169. Add scarring from healed wounds
- [ ] 170. Implement chronic conditions (bad back, frail, dementia)
- [ ] 171. Create health tab UI showing body diagram with injuries
- [ ] 172. Add death from fatal injuries, blood loss, or organ destruction
- [ ] 173. Implement corpse handling (hauling, burying in graves, cremation)

## Phase 13 — Combat

- [ ] 174. Implement ranged attack system (shoot projectile at target)
- [ ] 175. Create melee attack system (close-range combat)
- [ ] 176. Add accuracy calculation (skill, weapon, distance, light, cover)
- [ ] 177. Implement cover system (walls, sandbags reduce hit chance)
- [ ] 178. Create armor system (armor rating reduces damage)
- [ ] 179. Add hostile faction raider spawning
- [ ] 180. Implement raid AI (raiders attack colony, target valuables)
- [ ] 181. Create flee behavior for defeated raiders
- [ ] 182. Add colonist down state (incapacitated but alive)
- [ ] 183. Implement prisoner capture system (down raiders can be captured)
- [ ] 184. Create prison zone and prisoner management
- [ ] 185. Add prisoner recruitment attempts
- [ ] 186. Implement turret/auto-defense buildings
- [ ] 187. Create draft/undraft controls for combat micromanagement
- [ ] 188. Add combat log showing hit/miss/damage events

## Phase 14 — Research & Tech Tree

- [ ] 189. Implement research bench building
- [ ] 190. Create research project definitions with costs and prerequisites
- [ ] 191. Add research job (colonist works at bench to generate research points)
- [ ] 192. Implement tech tree UI showing available and completed research
- [ ] 193. Gate building/item/feature unlocks behind research completion
- [ ] 194. Create research tiers (neolithic, medieval, industrial, spacer, ultra)
- [ ] 195. Add hi-tech research bench for advanced projects
- [ ] 196. Implement multi-analyzer for ultra-tech research

## Phase 15 — Trading & Economy

- [ ] 197. Implement colony wealth calculation (items + buildings + colonists)
- [ ] 198. Create trader caravan arrival event
- [ ] 199. Add trade UI showing buy/sell with price negotiation
- [ ] 200. Implement item market values based on material and quality
- [ ] 201. Create silver currency item
- [ ] 202. Add orbital trade ship event (access via comms console building)
- [ ] 203. Implement trade price modifiers (social skill, faction relations)
- [ ] 204. Create different trader types (bulk goods, exotic, combat, food)

## Phase 16 — Events & Storyteller

- [ ] 205. Implement event system framework (trigger, conditions, effects)
- [ ] 206. Create storyteller AI that selects events based on colony state
- [ ] 207. Add raid event (hostile pawns attack the colony)
- [ ] 208. Create manhunter animal pack event
- [ ] 209. Add solar flare event (disables all electrical devices)
- [ ] 210. Create eclipse event (extended darkness)
- [ ] 211. Add wanderer joins event (free colonist)
- [ ] 212. Create refugee chased event (accept refugee, fight pursuers)
- [ ] 213. Add trade caravan arrival event
- [ ] 214. Create infestation event (insectoids spawn in dark, warm areas)
- [ ] 215. Add toxic fallout event (outdoor toxicity, need to stay indoors)
- [ ] 216. Create volcanic winter event (reduced temperature and plant growth)
- [ ] 217. Add psychic drone event (mood penalty to specific gender)
- [ ] 218. Create transport pod crash event (rescue the survivor)
- [ ] 219. Implement event difficulty scaling with colony wealth and time
- [ ] 220. Add event notification/letter system with UI

## Phase 17 — Animals

- [ ] 221. Define animal entity type with species data (diet, wildness, body size)
- [ ] 222. Implement wild animal spawning on the map
- [ ] 223. Create animal AI (wandering, grazing, fleeing, hunting)
- [ ] 224. Add animal taming system (colonists attempt to tame wild animals)
- [ ] 225. Implement tamed animal management (assign to zones, rename)
- [ ] 226. Create animal training system (obedience, release, rescue, haul)
- [ ] 227. Add animal reproduction (pregnant animals give birth)
- [ ] 228. Implement animal bonding (colonist bonds with animal, mood effects)
- [ ] 229. Create animal inventory/caravan carrying capacity
- [ ] 230. Add predator-prey dynamics (predators hunt smaller animals)
- [ ] 231. Implement animal illness and medical treatment
- [ ] 232. Create animal sleeping spots and animal beds
- [ ] 233. Add milking and shearing jobs for farm animals

## Phase 18 — Power & Electricity

- [ ] 234. Implement power grid system (power producers, consumers, conduits)
- [ ] 235. Create wood-fired generator building
- [ ] 236. Add solar panel building (produces power during daylight)
- [ ] 237. Create wind turbine building (variable output based on wind)
- [ ] 238. Implement power conduit/wire building for connecting devices
- [ ] 239. Add battery building for storing excess power
- [ ] 240. Create power switch building for toggling circuits
- [ ] 241. Implement brownout system (insufficient power disables devices)
- [ ] 242. Add heater and cooler buildings (require power, regulate temperature)
- [ ] 243. Create electric lights (standing lamp, sun lamp for indoor growing)
- [ ] 244. Implement geothermal generator (requires geyser terrain feature)
- [ ] 245. Add short circuit event (batteries explode, fire hazard)

## Phase 19 — Fire & Hazards

- [ ] 246. Implement fire system (tiles and buildings can catch fire)
- [ ] 247. Add fire spread mechanics (adjacent tiles ignite)
- [ ] 248. Create firefighting job (colonists extinguish fires in home zone)
- [ ] 249. Implement fire damage to buildings and items
- [ ] 250. Add firefoam popper building (auto-extinguish nearby fires)
- [ ] 251. Create heatstroke risk from nearby fires

## Phase 20 — Advanced Buildings & Production

- [ ] 252. Implement electric smelter (smelt slag, reclaim metal)
- [ ] 253. Create machining table (craft components, advanced items)
- [ ] 254. Add comms console (contact traders, factions)
- [ ] 255. Create transport pod launcher (send colonists/items to distant locations)
- [ ] 256. Implement art system (sculptures that provide beauty)
- [ ] 257. Add joy buildings (horseshoes pin, chess table, TV, billiards)
- [ ] 258. Create drug production (brewing, lab synthesis)
- [ ] 259. Implement drug effects system (mood boost, addiction, tolerance, withdrawal)
- [ ] 260. Add prosthetics and bionics crafting
- [ ] 261. Create autodoor (faster opening, requires power)
- [ ] 262. Implement trap buildings (spike trap, IED)

## Phase 21 — Factions & Diplomacy

- [ ] 263. Implement faction system (multiple AI factions with relations)
- [ ] 264. Create faction relation tracking (hostile, neutral, allied)
- [ ] 265. Add faction relation changes from events (gifts, combat, trade)
- [ ] 266. Implement allied faction aid requests
- [ ] 267. Create faction base locations on world map
- [ ] 268. Add tribute/gift system to improve relations

## Phase 22 — World Map & Caravans

- [ ] 269. Implement world map view (hex-based overview of regions)
- [ ] 270. Create caravan formation system (select colonists, animals, items)
- [ ] 271. Add caravan travel on world map with travel time
- [ ] 272. Implement caravan encounters (ambushes, trading opportunities)
- [ ] 273. Create caravan arrival at destinations (other settlements, event sites)
- [ ] 274. Add multiple colony support (settle at new locations)

## Phase 23 — Ideology & Culture

- [ ] 275. Implement belief/ideology system framework
- [ ] 276. Create ritual system (recurring ceremonies with effects)
- [ ] 277. Add role system (leader, moral guide, specialist roles)
- [ ] 278. Implement style system (preferred colors, clothing requirements)
- [ ] 279. Create conversion system (convert prisoners/visitors to colony ideology)

## Phase 24 — UI Polish & Quality of Life

- [ ] 280. Create alert system (starvation warning, raid incoming, colonist idle)
- [ ] 281. Implement notification history/log panel
- [ ] 282. Add tooltip system with rich item/colonist information
- [ ] 283. Create keyboard shortcut system for common actions
- [ ] 284. Implement undo system for zone/building placement
- [ ] 285. Add time controls UI (pause, speed buttons, date display)
- [ ] 286. Create statistics/history panel (colony wealth over time, mood graphs)
- [ ] 287. Implement auto-save at configurable intervals
- [ ] 288. Add colony name and custom scenario selection at game start
- [ ] 289. Create difficulty settings (peaceful, adventure, strive, merciless)
- [ ] 290. Implement tutorial/learning helper for new players
- [ ] 291. Add mod support framework (load custom definitions and scripts)
- [ ] 292. Create scenario system (different starting conditions)
- [ ] 293. Add storyteller selection (Cassandra, Phoebe, Randy equivalents)
- [ ] 294. Implement colonist gear management UI (assign outfits, equipment)
- [ ] 295. Create colony overview panel (summary of all colonists, resources, threats)
