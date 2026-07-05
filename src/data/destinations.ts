export type Vibe =
  | "relaxation"
  | "adventure"
  | "culture"
  | "nightlife"
  | "nature"
  | "foodie"
  | "romance";

export type BudgetTier = "shoestring" | "moderate" | "splurge";

export type Season = "winter" | "spring" | "summer" | "fall";

export interface Destination {
  city: string;
  country: string;
  region: "North America" | "Europe" | "Asia" | "South America" | "Africa" | "Oceania";
  airport: string;
  vibes: Vibe[];
  budgetTier: BudgetTier;
  bestSeasons: Season[];
  tagline: string;
  description: string;
  highlights: string[];
  gradient: string;
  emoji: string;
  costPerDayUSD: number;
  flightHoursFromHub: Partial<Record<string, number>>;
}

export const destinations: Destination[] = [
  {
    city: "Lisbon",
    country: "Portugal",
    region: "Europe",
    airport: "LIS",
    vibes: ["culture", "foodie", "nightlife", "romance"],
    budgetTier: "moderate",
    bestSeasons: ["spring", "fall"],
    tagline: "Pastel tiles, custard tarts, and rooftop sunsets.",
    description:
      "A hilly, sun-bleached capital where vintage trams rattle past azulejo-tiled facades. Days are for pastel de nata and miradouro views; nights are for fado bars and riverside clubs.",
    highlights: ["Alfama district by tram 28", "Time Out Market food hall", "Sintra day trip", "LX Factory nightlife"],
    gradient: "from-orange-400 via-rose-400 to-fuchsia-500",
    emoji: "🍮",
    costPerDayUSD: 110,
    flightHoursFromHub: { JFK: 7, LHR: 2.5, SFO: 12 },
  },
  {
    city: "Bali",
    country: "Indonesia",
    region: "Asia",
    airport: "DPS",
    vibes: ["relaxation", "nature", "romance"],
    budgetTier: "shoestring",
    bestSeasons: ["summer", "fall"],
    tagline: "Rice terraces, temple mist, and infinity pools.",
    description:
      "An island of terraced rice paddies, cliffside temples, and beach clubs. Wake up to yoga over jungle canopy, spend afternoons chasing waterfalls, and end with a sunset at Uluwatu.",
    highlights: ["Ubud rice terraces", "Uluwatu cliff temple", "Nusa Penida boat trip", "Canggu beach clubs"],
    gradient: "from-emerald-400 via-teal-400 to-cyan-500",
    emoji: "🌴",
    costPerDayUSD: 55,
    flightHoursFromHub: { JFK: 22, LHR: 16, SFO: 18 },
  },
  {
    city: "Reykjavik",
    country: "Iceland",
    region: "Europe",
    airport: "KEF",
    vibes: ["adventure", "nature"],
    budgetTier: "splurge",
    bestSeasons: ["winter", "summer"],
    tagline: "Glaciers, geysers, and the northern lights.",
    description:
      "A base camp for raw, elemental landscapes — black sand beaches, ice caves, and geothermal lagoons. Chase the aurora in winter or endless daylight on the Ring Road in summer.",
    highlights: ["Blue Lagoon soak", "Golden Circle route", "South coast waterfalls", "Northern lights hunting"],
    gradient: "from-cyan-300 via-sky-400 to-indigo-500",
    emoji: "🧊",
    costPerDayUSD: 190,
    flightHoursFromHub: { JFK: 5.5, LHR: 3, SFO: 9 },
  },
  {
    city: "Mexico City",
    country: "Mexico",
    region: "North America",
    airport: "MEX",
    vibes: ["foodie", "culture", "nightlife"],
    budgetTier: "moderate",
    bestSeasons: ["winter", "spring", "fall"],
    tagline: "Taco stands, murals, and mezcal till dawn.",
    description:
      "A sprawling, endlessly creative capital layered with Aztec ruins, world-class museums, and taquerias on every corner. Roma and Condesa buzz with mezcalerias and design studios.",
    highlights: ["Frida Kahlo's Casa Azul", "Teotihuacan pyramids", "Mercado street food crawl", "Roma Norte nightlife"],
    gradient: "from-amber-400 via-orange-500 to-red-500",
    emoji: "🌮",
    costPerDayUSD: 70,
    flightHoursFromHub: { JFK: 5, LHR: 11, SFO: 4.5 },
  },
  {
    city: "Queenstown",
    country: "New Zealand",
    region: "Oceania",
    airport: "ZQN",
    vibes: ["adventure", "nature"],
    budgetTier: "splurge",
    bestSeasons: ["summer", "winter"],
    tagline: "The adrenaline capital, ringed by alpine peaks.",
    description:
      "A lakeside town surrounded by the Southern Alps, built for bungee jumps, jet boats, and ski slopes. Between adventures, sip pinot noir with views over Lake Wakatipu.",
    highlights: ["Original bungee at Kawarau Bridge", "Milford Sound day trip", "Ski at The Remarkables", "Skyline luge run"],
    gradient: "from-lime-400 via-emerald-500 to-teal-600",
    emoji: "🏔️",
    costPerDayUSD: 160,
    flightHoursFromHub: { JFK: 20, LHR: 26, SFO: 14 },
  },
  {
    city: "Marrakech",
    country: "Morocco",
    region: "Africa",
    airport: "RAK",
    vibes: ["culture", "foodie", "adventure"],
    budgetTier: "shoestring",
    bestSeasons: ["spring", "fall", "winter"],
    tagline: "Souks, spice markets, and desert nights.",
    description:
      "A maze of a medina filled with lantern-lit souks, tagine steam, and riad courtyards. Ride camels into the Agafay desert or get lost bartering for rugs and leather.",
    highlights: ["Jemaa el-Fnaa night market", "Majorelle Garden", "Agafay desert camp", "Atlas Mountains day trip"],
    gradient: "from-rose-400 via-red-500 to-orange-600",
    emoji: "🕌",
    costPerDayUSD: 60,
    flightHoursFromHub: { JFK: 8, LHR: 3.5, SFO: 13 },
  },
  {
    city: "Tokyo",
    country: "Japan",
    region: "Asia",
    airport: "HND",
    vibes: ["culture", "foodie", "nightlife"],
    budgetTier: "splurge",
    bestSeasons: ["spring", "fall"],
    tagline: "Neon streets, Michelin ramen, ancient shrines.",
    description:
      "A city where centuries-old shrines sit blocks from neon megaplexes. Slurp ramen in a basement stall, then karaoke till 3am, then wander a temple garden the next morning in total silence.",
    highlights: ["Shibuya Crossing & karaoke", "Tsukiji outer market", "Senso-ji temple", "teamLab digital art museum"],
    gradient: "from-pink-400 via-fuchsia-500 to-purple-600",
    emoji: "🏯",
    costPerDayUSD: 150,
    flightHoursFromHub: { JFK: 14, LHR: 12, SFO: 10.5 },
  },
  {
    city: "Cartagena",
    country: "Colombia",
    region: "South America",
    airport: "CTG",
    vibes: ["romance", "nightlife", "relaxation"],
    budgetTier: "shoestring",
    bestSeasons: ["winter", "spring"],
    tagline: "Colorful colonial streets meet Caribbean shores.",
    description:
      "Walled-city balconies dripping in bougainvillea open onto salsa clubs and rooftop bars. By day, hop a boat to the Rosario Islands for reef snorkeling and white sand.",
    highlights: ["Old Town walking tour", "Rosario Islands boat day", "Rooftop salsa bars", "Getsemani street art"],
    gradient: "from-yellow-400 via-orange-400 to-pink-500",
    emoji: "🌺",
    costPerDayUSD: 65,
    flightHoursFromHub: { JFK: 4, LHR: 11, SFO: 8 },
  },
  {
    city: "Swiss Alps (Interlaken)",
    country: "Switzerland",
    region: "Europe",
    airport: "BRN",
    vibes: ["adventure", "nature", "romance"],
    budgetTier: "splurge",
    bestSeasons: ["summer", "winter"],
    tagline: "Turquoise lakes cradled by snow-capped peaks.",
    description:
      "Wedged between two glacial lakes, this alpine town is a launchpad for paragliding, via ferrata, and cogwheel trains to Jungfraujoch. Evenings mean fondue and lake-view balconies.",
    highlights: ["Jungfraujoch train", "Paragliding over the valley", "Lake Brienz kayaking", "Fondue in a mountain hut"],
    gradient: "from-sky-300 via-blue-400 to-indigo-600",
    emoji: "⛰️",
    costPerDayUSD: 210,
    flightHoursFromHub: { JFK: 8, LHR: 1.5, SFO: 11 },
  },
  {
    city: "Bangkok",
    country: "Thailand",
    region: "Asia",
    airport: "BKK",
    vibes: ["foodie", "nightlife", "culture"],
    budgetTier: "shoestring",
    bestSeasons: ["winter", "fall"],
    tagline: "Street food carts, gilded temples, rooftop bars.",
    description:
      "A round-the-clock city of golden wats, floating markets, and legendary street food. Tuk-tuk between temples by day, then chase rooftop skybars and Khao San Road by night.",
    highlights: ["Grand Palace & Wat Arun", "Chatuchak weekend market", "Rooftop bar at Lebua", "Floating market boat tour"],
    gradient: "from-amber-300 via-yellow-400 to-orange-500",
    emoji: "🍜",
    costPerDayUSD: 45,
    flightHoursFromHub: { JFK: 17, LHR: 11.5, SFO: 16 },
  },
  {
    city: "Santorini",
    country: "Greece",
    region: "Europe",
    airport: "JTR",
    vibes: ["romance", "relaxation", "foodie"],
    budgetTier: "splurge",
    bestSeasons: ["summer", "spring"],
    tagline: "Whitewashed cliffs above a volcanic caldera.",
    description:
      "Blue-domed churches perch on cliffs above the Aegean, made for slow dinners at sunset and lazy days on volcanic-sand beaches. Every terrace seems built for a postcard.",
    highlights: ["Oia sunset watch", "Caldera catamaran cruise", "Wine tasting at a cliffside winery", "Red Beach swim"],
    gradient: "from-blue-400 via-sky-400 to-white",
    emoji: "🇬🇷",
    costPerDayUSD: 180,
    flightHoursFromHub: { JFK: 11, LHR: 4, SFO: 15 },
  },
  {
    city: "Cape Town",
    country: "South Africa",
    region: "Africa",
    airport: "CPT",
    vibes: ["nature", "adventure", "foodie"],
    budgetTier: "moderate",
    bestSeasons: ["summer", "fall"],
    tagline: "Table Mountain, wine country, and penguin beaches.",
    description:
      "A city pinned between mountain and sea, with vineyards a short drive away and penguins down the coast. Hike Table Mountain at dawn, taste Stellenbosch wine by noon.",
    highlights: ["Table Mountain cable car", "Cape Peninsula road trip", "Stellenbosch wine tasting", "Boulders Beach penguins"],
    gradient: "from-teal-400 via-cyan-500 to-blue-600",
    emoji: "🐧",
    costPerDayUSD: 90,
    flightHoursFromHub: { JFK: 15, LHR: 11, SFO: 20 },
  },
  {
    city: "Nashville",
    country: "United States",
    region: "North America",
    airport: "BNA",
    vibes: ["nightlife", "foodie", "culture"],
    budgetTier: "moderate",
    bestSeasons: ["spring", "fall"],
    tagline: "Honky-tonks, hot chicken, and live music every night.",
    description:
      "Broadway's neon honky-tonks blast live country from noon to 3am. Between sets, work through hot chicken joints and East Nashville's coffee-and-vinyl scene.",
    highlights: ["Broadway honky-tonk crawl", "Country Music Hall of Fame", "Hot chicken at Prince's", "Live show at the Ryman"],
    gradient: "from-red-400 via-rose-500 to-orange-500",
    emoji: "🎸",
    costPerDayUSD: 95,
    flightHoursFromHub: { JFK: 2.5, LHR: 9, SFO: 4.5 },
  },
  {
    city: "Banff",
    country: "Canada",
    region: "North America",
    airport: "YYC",
    vibes: ["nature", "adventure", "relaxation"],
    budgetTier: "moderate",
    bestSeasons: ["summer", "winter"],
    tagline: "Turquoise lakes ringed by the Canadian Rockies.",
    description:
      "Glacier-fed lakes glow an impossible turquoise beneath jagged peaks. Canoe Lake Louise at dawn, hike to a teahouse, and soak in hot springs after a day on the slopes.",
    highlights: ["Lake Louise canoe paddle", "Moraine Lake sunrise", "Banff Gondola", "Hot springs soak"],
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    emoji: "🏞️",
    costPerDayUSD: 130,
    flightHoursFromHub: { JFK: 5, LHR: 9, SFO: 3 },
  },
  {
    city: "Lisbon Alternative: Porto",
    country: "Portugal",
    region: "Europe",
    airport: "OPO",
    vibes: ["foodie", "culture", "relaxation"],
    budgetTier: "shoestring",
    bestSeasons: ["spring", "fall"],
    tagline: "Port wine cellars along the Douro River.",
    description:
      "A quieter, more compact cousin to Lisbon, stacked in colorful tiers above the Douro. Cross the Dom Luís bridge for cellar tours, then wander riverside streets for grilled sardines.",
    highlights: ["Douro river cruise", "Port wine cellar tour", "Ribeira riverfront", "Livraria Lello bookstore"],
    gradient: "from-purple-400 via-fuchsia-500 to-rose-500",
    emoji: "🍷",
    costPerDayUSD: 80,
    flightHoursFromHub: { JFK: 7, LHR: 2.5, SFO: 12.5 },
  },
];
