/**
 * DEMO vendor catalog — fictional wedding businesses used only to populate
 * the marketplace/vendor directory for demos and development.
 *
 * These are NOT real businesses. Names, prices, and descriptions are
 * plausible-for-Uzbekistan placeholders, not scraped from any real vendor.
 * Photos are generic royalty-free placeholder images (picsum.photos, which
 * serves freely-licensed stock photography) rather than any real business's
 * copyrighted photos — no real vendor's identity, pricing, or images are
 * used without their consent.
 *
 * Replace/remove these once real vendors onboard through the vendor
 * application flow and are approved by an admin.
 */
import type {
  InsertVendor,
  InsertVendorTier,
  InsertMarketplaceProduct,
} from "@workspace/db";

function placeholderPhotos(seedPrefix: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/${seedPrefix}-${i}/900/600`,
  );
}

export type DemoVendor = Omit<InsertVendor, "id" | "createdAt" | "ownerUserId"> & {
  /** Used only to key photo seeds and to link tiers/products below. */
  slug: string;
  tiers: Array<Omit<InsertVendorTier, "id" | "vendorId" | "createdAt">>;
};

export const DEMO_VENDORS: DemoVendor[] = [
  // ---- Venue ----
  {
    slug: "chorsu-palace",
    businessName: "Chorsu Palace",
    category: "venue",
    city: "Tashkent",
    address: "Chilonzor tumani, Tashkent",
    description:
      "Classic banquet hall in central Tashkent with a 500-guest capacity, indoor and outdoor ceremony space, and in-house parking.",
    phone: "+998 90 123 45 67",
    photos: placeholderPhotos("chorsu-palace", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Standard Hall", pricePerUnit: 90_000_000, unitType: "per_event", description: "Full-day hall rental, up to 300 guests, basic lighting and sound included.", photos: placeholderPhotos("chorsu-standard", 1) },
      { tierName: "Premium Hall", pricePerUnit: 150_000_000, unitType: "per_event", description: "Up to 400 guests, upgraded chandeliers, stage, and dedicated bridal room.", photos: placeholderPhotos("chorsu-premium", 1) },
      { tierName: "VIP Hall", pricePerUnit: 240_000_000, unitType: "per_event", description: "Up to 500 guests, full venue exclusivity, valet parking, and LED stage wall.", photos: placeholderPhotos("chorsu-vip", 1) },
    ],
  },
  {
    slug: "bogi-shamol",
    businessName: "Bog'i Shamol Wedding Hall",
    category: "venue",
    city: "Tashkent",
    address: "Yunusobod tumani, Tashkent",
    description: "Garden-style wedding venue with an open-air terrace and a modern indoor hall for up to 350 guests.",
    phone: "+998 90 234 56 78",
    photos: placeholderPhotos("bogi-shamol", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Terrace Package", pricePerUnit: 70_000_000, unitType: "per_event", description: "Outdoor terrace ceremony + reception, up to 200 guests.", photos: placeholderPhotos("bogi-terrace", 1) },
      { tierName: "Indoor Hall Package", pricePerUnit: 130_000_000, unitType: "per_event", description: "Climate-controlled hall, up to 350 guests, full AV setup.", photos: placeholderPhotos("bogi-indoor", 1) },
    ],
  },
  {
    slug: "registon-garden-events",
    businessName: "Registon Garden Events",
    category: "venue",
    city: "Samarkand",
    address: "Near Registan Square, Samarkand",
    description: "Historic-district event garden with views toward the old city, popular for destination-style weddings.",
    phone: "+998 91 345 67 89",
    photos: placeholderPhotos("registon-garden", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Garden Ceremony", pricePerUnit: 60_000_000, unitType: "per_event", description: "Outdoor ceremony space for up to 150 guests.", photos: placeholderPhotos("registon-ceremony", 1) },
      { tierName: "Full Estate", pricePerUnit: 160_000_000, unitType: "per_event", description: "Full grounds booking, up to 450 guests, includes lighting rig.", photos: placeholderPhotos("registon-full", 1) },
    ],
  },
  {
    slug: "buxoro-saroy-hall",
    businessName: "Buxoro Saroy Hall",
    category: "venue",
    city: "Bukhara",
    address: "Central Bukhara",
    description: "Traditional-style banquet hall with carved wood interiors, seating up to 250 guests.",
    phone: "+998 93 456 78 90",
    photos: placeholderPhotos("buxoro-saroy", 3),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Classic Hall", pricePerUnit: 45_000_000, unitType: "per_event", description: "Up to 200 guests, traditional interior, basic sound system.", photos: placeholderPhotos("buxoro-classic", 1) },
      { tierName: "Grand Hall", pricePerUnit: 85_000_000, unitType: "per_event", description: "Up to 250 guests, upgraded decor and stage lighting.", photos: placeholderPhotos("buxoro-grand", 1) },
    ],
  },

  // ---- Catering ----
  {
    slug: "zarafshon-catering",
    businessName: "Zarafshon Catering",
    category: "catering",
    city: "Tashkent",
    description: "Full-service wedding catering specializing in plov, shashlik, and a wide dasturxon spread.",
    phone: "+998 90 555 11 22",
    photos: placeholderPhotos("zarafshon-catering", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Budget Dasturxon", pricePerUnit: 110_000, unitType: "per_guest", description: "Plov, salads, bread, tea and soft drinks per guest.", photos: [] },
      { tierName: "Standard Dasturxon", pricePerUnit: 180_000, unitType: "per_guest", description: "Adds grilled meats, extra salads, and a dessert table.", photos: [] },
      { tierName: "Premium Dasturxon", pricePerUnit: 290_000, unitType: "per_guest", description: "Full spread with multiple meat courses, fruit displays, and a live cooking station.", photos: [] },
    ],
  },
  {
    slug: "osiyo-dasturxon-catering",
    businessName: "Osiyo Dasturxon Catering",
    category: "catering",
    city: "Samarkand",
    description: "Regional catering house known for Samarkand-style plov and traditional non bread service.",
    phone: "+998 91 555 22 33",
    photos: placeholderPhotos("osiyo-catering", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Standard Package", pricePerUnit: 150_000, unitType: "per_guest", description: "Plov, salads, non bread, and tea service.", photos: [] },
      { tierName: "Deluxe Package", pricePerUnit: 240_000, unitType: "per_guest", description: "Adds kebabs, extended dessert bar, and fruit table.", photos: [] },
    ],
  },
  {
    slug: "milliy-taomlar-catering",
    businessName: "Milliy Taomlar Catering",
    category: "catering",
    city: "Tashkent",
    description: "Family-run catering business offering customizable national-dish menus for weddings of any size.",
    phone: "+998 90 555 33 44",
    photos: placeholderPhotos("milliy-taomlar", 2),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Budget Menu", pricePerUnit: 95_000, unitType: "per_guest", description: "Simple plov and salad menu for smaller budgets.", photos: [] },
      { tierName: "Full Menu", pricePerUnit: 200_000, unitType: "per_guest", description: "Multi-course national dish menu with dessert table.", photos: [] },
    ],
  },
  {
    slug: "sharq-ziyofat-catering",
    businessName: "Sharq Ziyofat Catering",
    category: "catering",
    city: "Bukhara",
    description: "Bukhara-based catering team specializing in large-guest-count events (400+).",
    phone: "+998 93 555 44 55",
    photos: placeholderPhotos("sharq-ziyofat", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Large Event Standard", pricePerUnit: 130_000, unitType: "per_guest", description: "Designed for 300-600 guest events, plov + salads + drinks.", photos: [] },
      { tierName: "Large Event Premium", pricePerUnit: 210_000, unitType: "per_guest", description: "Adds grilled meat stations and expanded dessert offerings.", photos: [] },
    ],
  },

  // ---- Decor ----
  {
    slug: "gulshan-decor-studio",
    businessName: "Gulshan Decor Studio",
    category: "decor",
    city: "Tashkent",
    description: "Floral and stage decor studio offering full hall transformations, arches, and centerpieces.",
    phone: "+998 90 666 11 22",
    photos: placeholderPhotos("gulshan-decor", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Basic Decor", pricePerUnit: 18_000_000, unitType: "per_event", description: "Table centerpieces and a simple backdrop arch.", photos: [] },
      { tierName: "Premium Decor", pricePerUnit: 38_000_000, unitType: "per_event", description: "Full hall florals, LED backdrop, and aisle decor.", photos: [] },
      { tierName: "Luxury Decor", pricePerUnit: 65_000_000, unitType: "per_event", description: "Custom installations, imported flowers, and ceiling drapery.", photos: [] },
    ],
  },
  {
    slug: "nafis-bezak-decor",
    businessName: "Nafis Bezak Decor",
    category: "decor",
    city: "Tashkent",
    description: "Modern minimalist decor studio focused on neutral palettes and elegant lighting design.",
    phone: "+998 90 666 22 33",
    photos: placeholderPhotos("nafis-bezak", 3),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Essentials", pricePerUnit: 14_000_000, unitType: "per_event", description: "Table settings and entrance decor.", photos: [] },
      { tierName: "Signature", pricePerUnit: 32_000_000, unitType: "per_event", description: "Full color-matched hall design with lighting.", photos: [] },
    ],
  },
  {
    slug: "royal-flora-decor",
    businessName: "Royal Flora Decor",
    category: "decor",
    city: "Samarkand",
    description: "Flower-focused decor house known for large floral walls and imported rose arrangements.",
    phone: "+998 91 666 33 44",
    photos: placeholderPhotos("royal-flora", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Floral Basics", pricePerUnit: 20_000_000, unitType: "per_event", description: "Centerpieces and a floral arch.", photos: [] },
      { tierName: "Floral Grand", pricePerUnit: 48_000_000, unitType: "per_event", description: "Full floral wall, aisle runners, and imported flowers.", photos: [] },
    ],
  },
  {
    slug: "sadokat-decor-design",
    businessName: "Sadokat Decor & Design",
    category: "decor",
    city: "Bukhara",
    description: "Boutique decor studio blending traditional Uzbek motifs with contemporary styling.",
    phone: "+998 93 666 44 55",
    photos: placeholderPhotos("sadokat-decor", 3),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Traditional Package", pricePerUnit: 16_000_000, unitType: "per_event", description: "Suzani-inspired table linens and centerpieces.", photos: [] },
      { tierName: "Fusion Package", pricePerUnit: 34_000_000, unitType: "per_event", description: "Traditional motifs combined with modern lighting and backdrops.", photos: [] },
    ],
  },

  // ---- Music ----
  {
    slug: "sadoqat-show-band",
    businessName: "Sadoqat Show Band",
    category: "music",
    city: "Tashkent",
    description: "Live wedding band covering Uzbek, Russian, and international hits, with an MC included.",
    phone: "+998 90 777 11 22",
    photos: placeholderPhotos("sadoqat-band", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "DJ + MC", pricePerUnit: 9_000_000, unitType: "per_event", description: "DJ set with sound system and MC hosting.", photos: [] },
      { tierName: "Live Band", pricePerUnit: 22_000_000, unitType: "per_event", description: "5-piece live band plus DJ transitions between sets.", photos: [] },
      { tierName: "Full Show", pricePerUnit: 38_000_000, unitType: "per_event", description: "Live band, dancers, MC, and light show.", photos: [] },
    ],
  },
  {
    slug: "tashkent-wedding-djs",
    businessName: "Tashkent Wedding DJs",
    category: "music",
    city: "Tashkent",
    description: "DJ collective specializing in modern wedding playlists and MC-led programs.",
    phone: "+998 90 777 22 33",
    photos: placeholderPhotos("tashkent-djs", 2),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Standard DJ", pricePerUnit: 6_000_000, unitType: "per_event", description: "DJ with sound system for up to 6 hours.", photos: [] },
      { tierName: "Premium DJ + Lighting", pricePerUnit: 14_000_000, unitType: "per_event", description: "DJ, MC, and full dance-floor lighting rig.", photos: [] },
    ],
  },
  {
    slug: "milliy-sozlar-ensemble",
    businessName: "Milliy Sozlar Ensemble",
    category: "music",
    city: "Samarkand",
    description: "Traditional instrumental ensemble (doira, nay, tanbur) for ceremony and reception music.",
    phone: "+998 91 777 33 44",
    photos: placeholderPhotos("milliy-sozlar", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Ceremony Set", pricePerUnit: 7_000_000, unitType: "per_event", description: "Traditional music for the ceremony portion only.", photos: [] },
      { tierName: "Full Event", pricePerUnit: 18_000_000, unitType: "per_event", description: "Traditional ensemble for ceremony and reception.", photos: [] },
    ],
  },

  // ---- Photography ----
  {
    slug: "lens-and-light-studio",
    businessName: "Lens & Light Studio",
    category: "photography",
    city: "Tashkent",
    description: "Full-day wedding photography and videography with same-week photo delivery.",
    phone: "+998 90 888 11 22",
    photos: placeholderPhotos("lens-light", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Photo Only", pricePerUnit: 6_500_000, unitType: "per_event", description: "One photographer, full-day coverage, digital gallery.", photos: [] },
      { tierName: "Photo + Video", pricePerUnit: 13_000_000, unitType: "per_event", description: "Photographer and videographer, edited highlight reel included.", photos: [] },
      { tierName: "Cinematic + Drone", pricePerUnit: 21_000_000, unitType: "per_event", description: "Full team with drone footage and a cinematic same-day edit.", photos: [] },
    ],
  },
  {
    slug: "sevimli-lahzalar-photography",
    businessName: "Sevimli Lahzalar Photography",
    category: "photography",
    city: "Tashkent",
    description: "Candid, documentary-style wedding photography team.",
    phone: "+998 90 888 22 33",
    photos: placeholderPhotos("sevimli-lahzalar", 3),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Half-Day", pricePerUnit: 4_000_000, unitType: "per_event", description: "4 hours of coverage, digital gallery only.", photos: [] },
      { tierName: "Full-Day", pricePerUnit: 8_500_000, unitType: "per_event", description: "8+ hours of coverage with a printed album.", photos: [] },
    ],
  },
  {
    slug: "osiyo-foto-studio",
    businessName: "Osiyo Foto Studio",
    category: "photography",
    city: "Samarkand",
    description: "Studio and on-location photography for weddings, engagements, and family portraits.",
    phone: "+998 91 888 33 44",
    photos: placeholderPhotos("osiyo-foto", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Standard Coverage", pricePerUnit: 5_500_000, unitType: "per_event", description: "Full-day photography with edited digital delivery.", photos: [] },
      { tierName: "Premium Coverage", pricePerUnit: 11_000_000, unitType: "per_event", description: "Two photographers, album, and engagement session included.", photos: [] },
    ],
  },
  {
    slug: "chehra-wedding-films",
    businessName: "Chehra Wedding Films",
    category: "photography",
    city: "Bukhara",
    description: "Videography-focused team producing cinematic wedding films with drone coverage.",
    phone: "+998 93 888 44 55",
    photos: placeholderPhotos("chehra-films", 3),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Highlight Film", pricePerUnit: 7_000_000, unitType: "per_event", description: "3-5 minute edited highlight film.", photos: [] },
      { tierName: "Full Film + Drone", pricePerUnit: 15_000_000, unitType: "per_event", description: "Full-length film, drone shots, and same-day teaser clip.", photos: [] },
    ],
  },

  // ---- Clothing ----
  {
    slug: "kelin-salom-bridal",
    businessName: "Kelin Salom Bridal",
    category: "clothing",
    city: "Tashkent",
    description: "Bridal boutique offering wedding dress rentals and fittings, including traditional and Western styles.",
    phone: "+998 90 999 11 22",
    photos: placeholderPhotos("kelin-salom", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Rental — Standard Gown", pricePerUnit: 2_800_000, unitType: "flat", description: "Choice from the standard collection, includes fitting and steaming.", photos: [] },
      { tierName: "Rental — Designer Gown", pricePerUnit: 6_500_000, unitType: "flat", description: "Designer collection gown with veil and accessories.", photos: [] },
    ],
  },
  {
    slug: "atlas-style-bridal-groom",
    businessName: "Atlas Style Bridal & Groom Wear",
    category: "clothing",
    city: "Tashkent",
    description: "Bridal and groom formalwear rental with matching couple packages.",
    phone: "+998 90 999 22 33",
    photos: placeholderPhotos("atlas-style", 3),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Groom Suit Rental", pricePerUnit: 1_500_000, unitType: "flat", description: "Tailored suit rental with shoes and accessories.", photos: [] },
      { tierName: "Couple Package", pricePerUnit: 7_000_000, unitType: "flat", description: "Bridal gown + groom suit bundle with fittings.", photos: [] },
    ],
  },
  {
    slug: "zebo-kelinlik-salon",
    businessName: "Zebo Kelinlik Salon",
    category: "clothing",
    city: "Samarkand",
    description: "Traditional and modern kelinlik (bridal dress) salon with alteration services.",
    phone: "+998 91 999 33 44",
    photos: placeholderPhotos("zebo-kelinlik", 3),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Traditional Kelinlik Rental", pricePerUnit: 2_200_000, unitType: "flat", description: "Traditional-style dress with headpiece.", photos: [] },
      { tierName: "Premium Kelinlik Rental", pricePerUnit: 5_000_000, unitType: "flat", description: "Premium fabric dress with full accessory set.", photos: [] },
    ],
  },

  // ---- Rental items ----
  {
    slug: "bazm-rental-co",
    businessName: "Bazm Rental Co.",
    category: "rental_items",
    city: "Tashkent",
    description: "Tables, chairs, tents, and linens rental for weddings and large events.",
    phone: "+998 90 111 55 66",
    photos: placeholderPhotos("bazm-rental", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Tables & Chairs (per 10 guests)", pricePerUnit: 350_000, unitType: "per_guest", description: "Round tables, chiavari chairs, and linens, priced per 10-guest set.", photos: [] },
      { tierName: "Full Outdoor Tent Package", pricePerUnit: 12_000_000, unitType: "flat", description: "Tent, flooring, lighting, and furniture for up to 200 guests.", photos: [] },
    ],
  },
  {
    slug: "prazdnik-rental",
    businessName: "Prazdnik Rental",
    category: "rental_items",
    city: "Tashkent",
    description: "Event equipment rental: sound systems, staging, and dance floors.",
    phone: "+998 90 111 66 77",
    photos: placeholderPhotos("prazdnik-rental", 2),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Sound System Rental", pricePerUnit: 2_500_000, unitType: "flat", description: "PA system and microphones for the full event.", photos: [] },
      { tierName: "Stage + Dance Floor", pricePerUnit: 6_000_000, unitType: "flat", description: "Portable stage and LED dance floor setup.", photos: [] },
    ],
  },
  {
    slug: "tantana-event-rentals",
    businessName: "Tantana Event Rentals",
    category: "rental_items",
    city: "Bukhara",
    description: "Full-service rental company for tableware, linens, and decor structures.",
    phone: "+998 93 111 77 88",
    photos: placeholderPhotos("tantana-rentals", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Tableware Package", pricePerUnit: 180_000, unitType: "per_guest", description: "Plates, glassware, and cutlery per guest.", photos: [] },
      { tierName: "Full Furniture Set", pricePerUnit: 9_000_000, unitType: "flat", description: "Tables, chairs, and linens for up to 250 guests.", photos: [] },
    ],
  },

  // ---- Wedding products ----
  {
    slug: "bazm-gifts-favors",
    businessName: "Bazm Gifts & Favors",
    category: "wedding_products",
    city: "Tashkent",
    description: "Wedding favors, guest gift boxes, and personalized keepsakes.",
    phone: "+998 90 222 88 99",
    photos: placeholderPhotos("bazm-gifts", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Standard Gift Box (per guest)", pricePerUnit: 25_000, unitType: "per_guest", description: "Sweets and a thank-you card per guest.", photos: [] },
      { tierName: "Premium Gift Box (per guest)", pricePerUnit: 55_000, unitType: "per_guest", description: "Personalized box with sweets, small keepsake, and ribbon packaging.", photos: [] },
    ],
  },
  {
    slug: "sovga-box-wedding-gifts",
    businessName: "Sovg'a Box Wedding Gifts",
    category: "wedding_products",
    city: "Tashkent",
    description: "Custom gift boxes and wedding invitation printing.",
    phone: "+998 90 222 99 00",
    photos: placeholderPhotos("sovga-box", 2),
    isVerified: false,
    isActive: true,
    tiers: [
      { tierName: "Invitation Set (per 50)", pricePerUnit: 1_200_000, unitType: "flat", description: "50 printed invitations with envelopes.", photos: [] },
      { tierName: "Gift Box + Invitation Bundle", pricePerUnit: 2_800_000, unitType: "flat", description: "50 invitations plus 50 small guest gift boxes.", photos: [] },
    ],
  },
  {
    slug: "nikoh-accessories-shop",
    businessName: "Nikoh Accessories Shop",
    category: "wedding_products",
    city: "Samarkand",
    description: "Rings, ceremony accessories, and traditional nikoh ceremony items.",
    phone: "+998 91 222 00 11",
    photos: placeholderPhotos("nikoh-accessories", 2),
    isVerified: true,
    isActive: true,
    tiers: [
      { tierName: "Ceremony Accessory Set", pricePerUnit: 900_000, unitType: "flat", description: "Ceremony tray, cloth, and traditional accessories.", photos: [] },
      { tierName: "Deluxe Ceremony Set", pricePerUnit: 2_200_000, unitType: "flat", description: "Premium fabrics and decorative ceremony accessories.", photos: [] },
    ],
  },
];

/**
 * Standalone marketplace products (bought individually with stock, as
 * opposed to vendor service tiers above). Linked to a vendor by slug.
 */
export const DEMO_MARKETPLACE_PRODUCTS: Array<
  Omit<InsertMarketplaceProduct, "id" | "sellerVendorId" | "createdAt"> & {
    vendorSlug: string;
  }
> = [
  // --- rental_items ---
  { vendorSlug: "bazm-rental-co", name: "Chiavari Chair (single)", category: "rental_items", pricePerUnit: 25_000, unit: "per_item", stockQuantity: 400, photos: placeholderPhotos("prod-chiavari-chair", 1), description: "Gold chiavari chair rental, cushion included.", isActive: true },
  { vendorSlug: "bazm-rental-co", name: "Round Banquet Table", category: "rental_items", pricePerUnit: 80_000, unit: "per_item", stockQuantity: 60, photos: placeholderPhotos("prod-banquet-table", 1), description: "Seats 10, linen not included.", isActive: true },
  { vendorSlug: "prazdnik-rental", name: "LED Dance Floor Tile (1m²)", category: "rental_items", pricePerUnit: 150_000, unit: "per_item", stockQuantity: 100, photos: placeholderPhotos("prod-dancefloor-tile", 1), description: "Interlocking LED tile, colors programmable.", isActive: true },
  { vendorSlug: "prazdnik-rental", name: "PA Speaker System (pair)", category: "rental_items", pricePerUnit: 900_000, unit: "per_item", stockQuantity: 15, photos: placeholderPhotos("prod-pa-speakers", 1), description: "Powered speaker pair with stands, good for up to 300 guests.", isActive: true },
  { vendorSlug: "tantana-event-rentals", name: "Table Linen (round, white)", category: "rental_items", pricePerUnit: 35_000, unit: "per_item", stockQuantity: 200, photos: placeholderPhotos("prod-linen-white", 1), description: "Floor-length white linen for round tables.", isActive: true },
  { vendorSlug: "tantana-event-rentals", name: "Chair Sash (satin)", category: "rental_items", pricePerUnit: 8_000, unit: "per_item", stockQuantity: 500, photos: placeholderPhotos("prod-chair-sash", 1), description: "Satin sash, tied bow-style, wide color range.", isActive: true },
  { vendorSlug: "bazm-rental-co", name: "Cocktail Table (bar height)", category: "rental_items", pricePerUnit: 60_000, unit: "per_item", stockQuantity: 40, photos: placeholderPhotos("prod-cocktail-table", 1), description: "Bar-height cocktail table for reception mingling areas.", isActive: true },
  { vendorSlug: "kelin-salom-bridal", name: "Bridal Veil (rental)", category: "rental_items", pricePerUnit: 350_000, unit: "per_item", stockQuantity: 25, photos: placeholderPhotos("prod-bridal-veil", 1), description: "Cathedral-length bridal veil rental.", isActive: true },

  // --- decor ---
  { vendorSlug: "gulshan-decor-studio", name: "Floral Centerpiece (single table)", category: "decor", pricePerUnit: 280_000, unit: "per_item", stockQuantity: 80, photos: placeholderPhotos("prod-centerpiece", 1), description: "Fresh floral centerpiece for one table.", isActive: true },
  { vendorSlug: "royal-flora-decor", name: "Floral Wall Backdrop (3m x 2m)", category: "decor", pricePerUnit: 4_500_000, unit: "per_item", stockQuantity: 8, photos: placeholderPhotos("prod-floral-wall", 1), description: "Ready-made floral wall panel for photo backdrops.", isActive: true },
  { vendorSlug: "nafis-bezak-decor", name: "Balloon Garland (3m)", category: "decor", pricePerUnit: 450_000, unit: "per_item", stockQuantity: 20, photos: placeholderPhotos("prod-balloon-garland", 1), description: "Organic-style balloon garland, custom color palette.", isActive: true },
  { vendorSlug: "sadokat-decor-design", name: "LED Fairy Light Curtain (2m x 3m)", category: "decor", pricePerUnit: 320_000, unit: "per_item", stockQuantity: 30, photos: placeholderPhotos("prod-fairy-lights", 1), description: "Warm-white LED curtain backdrop, indoor/outdoor safe.", isActive: true },
  { vendorSlug: "gulshan-decor-studio", name: "Aisle Runner (white, 15m)", category: "decor", pricePerUnit: 260_000, unit: "per_item", stockQuantity: 12, photos: placeholderPhotos("prod-aisle-runner", 1), description: "Woven fabric aisle runner for ceremony walkways.", isActive: true },
  { vendorSlug: "royal-flora-decor", name: "Bridal Table Arch (floral)", category: "decor", pricePerUnit: 3_200_000, unit: "per_item", stockQuantity: 6, photos: placeholderPhotos("prod-floral-arch", 1), description: "Statement floral arch for the bridal table or ceremony.", isActive: true },

  // --- disposable_tableware ---
  { vendorSlug: "sharq-ziyofat-catering", name: "Disposable Plate Set (50 guests)", category: "disposable_tableware", pricePerUnit: 180_000, unit: "per_set", stockQuantity: 60, photos: placeholderPhotos("prod-plate-set", 1), description: "Sturdy disposable plates, cups and cutlery for 50 guests.", isActive: true },
  { vendorSlug: "osiyo-dasturxon-catering", name: "Table Napkins (pack of 200)", category: "disposable_tableware", pricePerUnit: 45_000, unit: "per_set", stockQuantity: 150, photos: placeholderPhotos("prod-napkins", 1), description: "Two-ply paper napkins, plain white.", isActive: true },
  { vendorSlug: "zarafshon-catering", name: "Plastic Cutlery Set (100 guests)", category: "disposable_tableware", pricePerUnit: 95_000, unit: "per_set", stockQuantity: 90, photos: placeholderPhotos("prod-cutlery-set", 1), description: "Heavy-duty plastic forks, knives and spoons for 100 guests.", isActive: true },
  { vendorSlug: "milliy-taomlar-catering", name: "Disposable Cup Set (200 pcs)", category: "disposable_tableware", pricePerUnit: 60_000, unit: "per_set", stockQuantity: 120, photos: placeholderPhotos("prod-cup-set", 1), description: "200-piece disposable cup set for tea and soft drinks.", isActive: true },
  { vendorSlug: "sharq-ziyofat-catering", name: "Tablecloth Roll (disposable, 25m)", category: "disposable_tableware", pricePerUnit: 130_000, unit: "per_item", stockQuantity: 30, photos: placeholderPhotos("prod-tablecloth-roll", 1), description: "Wipeable disposable tablecloth roll, cuts to size.", isActive: true },

  // --- gifts_sarpo ---
  { vendorSlug: "bazm-gifts-favors", name: "Guest Sweet Box (set of 10)", category: "gifts_sarpo", pricePerUnit: 220_000, unit: "per_set", stockQuantity: 150, photos: placeholderPhotos("prod-sweet-box", 1), description: "10-piece set of individually wrapped guest sweet boxes.", isActive: true },
  { vendorSlug: "sovga-box-wedding-gifts", name: "Printed Invitation (single)", category: "gifts_sarpo", pricePerUnit: 22_000, unit: "per_item", stockQuantity: 1000, photos: placeholderPhotos("prod-invitation", 1), description: "Single printed invitation card with envelope.", isActive: true },
  { vendorSlug: "nikoh-accessories-shop", name: "Nikoh Ceremony Tray", category: "gifts_sarpo", pricePerUnit: 350_000, unit: "per_item", stockQuantity: 40, photos: placeholderPhotos("prod-nikoh-tray", 1), description: "Decorative tray used for the nikoh ceremony.", isActive: true },
  { vendorSlug: "sovga-box-wedding-gifts", name: "Sarpo Gift Set (bride's family)", category: "gifts_sarpo", pricePerUnit: 1_800_000, unit: "per_set", stockQuantity: 20, photos: placeholderPhotos("prod-sarpo-set", 1), description: "Traditional sarpo gift set of fabrics and accessories.", isActive: true },
  { vendorSlug: "bazm-gifts-favors", name: "Guest Favor Bag (set of 20)", category: "gifts_sarpo", pricePerUnit: 260_000, unit: "per_set", stockQuantity: 80, photos: placeholderPhotos("prod-favor-bag", 1), description: "Organza favor bags with small keepsake inside, set of 20.", isActive: true },
  { vendorSlug: "nikoh-accessories-shop", name: "Ring Pillow", category: "gifts_sarpo", pricePerUnit: 85_000, unit: "per_item", stockQuantity: 60, photos: placeholderPhotos("prod-ring-pillow", 1), description: "Embroidered ring bearer pillow.", isActive: true },

  // --- food_products ---
  { vendorSlug: "osiyo-dasturxon-catering", name: "Plov Catering Tray (serves 20)", category: "food_products", pricePerUnit: 1_400_000, unit: "per_set", stockQuantity: 25, photos: placeholderPhotos("prod-plov-tray", 1), description: "Traditional plov prepared and delivered in a serving tray for 20 guests.", isActive: true },
  { vendorSlug: "milliy-taomlar-catering", name: "Assorted Sweets Platter (serves 30)", category: "food_products", pricePerUnit: 950_000, unit: "per_set", stockQuantity: 15, photos: placeholderPhotos("prod-sweets-platter", 1), description: "Traditional sweets and pastries platter for 30 guests.", isActive: true },
  { vendorSlug: "zarafshon-catering", name: "Shashlik Skewers (set of 50)", category: "food_products", pricePerUnit: 1_100_000, unit: "per_set", stockQuantity: 20, photos: placeholderPhotos("prod-shashlik", 1), description: "Grilled meat skewers, set of 50, delivered fresh.", isActive: true },
  { vendorSlug: "sharq-ziyofat-catering", name: "Fresh Fruit Table Setup (serves 50)", category: "food_products", pricePerUnit: 780_000, unit: "per_set", stockQuantity: 18, photos: placeholderPhotos("prod-fruit-table", 1), description: "Seasonal fruit arrangement for the guest table, serves 50.", isActive: true },
  { vendorSlug: "osiyo-dasturxon-catering", name: "Tea & Drinks Service (serves 50)", category: "food_products", pricePerUnit: 420_000, unit: "per_set", stockQuantity: 30, photos: placeholderPhotos("prod-tea-drinks", 1), description: "Tea, soft drinks and glassware service for 50 guests.", isActive: true },
];
