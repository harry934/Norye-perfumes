const NORYE_ORDER_URL = "https://wa.me/message/VVDJKHWHBAGGI1";

const NORYE_PRODUCTS = [
  {
    code: "n12",
    number: "N°12",
    name: "N Ō R Y E N°12",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "Baccarat Rouge 540",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2012.jpeg",
    featured: true,
    bestSeller: true,
    description: "A luminous amber floral that wraps you in warm sophistication. Radiant, memorable and unmistakably luxurious.",
    notes: "Saffron, jasmine, amberwood, cedar"
  },
  {
    code: "n13",
    number: "N°13",
    name: "N Ō R Y E N°13",
    category: "men",
    categoryLabel: "Men",
    inspiredBy: "Tom Ford Black Orchid",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2013.jpeg",
    featured: true,
    bestSeller: false,
    description: "Dark, opulent and seductive. A bold blend of rich florals and deep accords for evenings that demand presence.",
    notes: "Black truffle, orchid, patchouli, incense"
  },
  {
    code: "n22",
    number: "N°22",
    name: "N Ō R Y E N°22",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "Giorgio Armani My Way",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2022.jpeg",
    featured: false,
    bestSeller: false,
    description: "A luminous floral trail of orange blossom and tuberose. Confident, feminine and effortlessly elegant.",
    notes: "Orange blossom, tuberose, vanilla, cedar"
  },
  {
    code: "n23",
    number: "N°23",
    name: "N Ō R Y E N°23",
    category: "men",
    categoryLabel: "Men",
    inspiredBy: "Creed Aventus",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2023.jpeg",
    featured: true,
    bestSeller: true,
    description: "N23 inspired by Creed Aventus brings together a crisp freshness, smoky masculine depth and a warm woody richness. It is effortlessly powerful. This is for the man who walks in well dressed, says less but somehow gets noticed.",
    notes: "Bergamot, birch, musk, oakmoss"
  },
  {
    code: "n32",
    number: "N°32",
    name: "N Ō R Y E N°32",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "Lancôme Trésor Midnight Rose",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2032.jpeg",
    featured: false,
    bestSeller: true,
    description: "A romantic dark rose wrapped in raspberry and vanilla. Feminine, mysterious and beautifully addictive.",
    notes: "Rose, raspberry, vanilla, musk"
  },
  {
    code: "n33",
    number: "N°33",
    name: "N Ō R Y E N°33",
    category: "men",
    categoryLabel: "Men",
    inspiredBy: "Emporio Armani Stronger With You",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2033.jpeg",
    featured: false,
    bestSeller: true,
    description: "Warm, sweet and irresistibly close. A modern masculine scent built for connection and confidence.",
    notes: "Pink pepper, chestnut, vanilla, amber"
  },
  {
    code: "n42",
    number: "N°42",
    name: "N Ō R Y E N°42",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "YSL Libre",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2042.jpeg",
    featured: false,
    bestSeller: false,
    description: "A bold floral lavender with a couture edge. Free spirited, radiant and unapologetically feminine.",
    notes: "Lavender, orange blossom, vanilla, amber"
  },
  {
    code: "n53",
    number: "N°53",
    name: "N Ō R Y E N°53",
    category: "men",
    categoryLabel: "Men",
    inspiredBy: "Gucci Guilty",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2053.jpeg",
    featured: false,
    bestSeller: true,
    description: "Fresh citrus meets aromatic lavender and warm cedar. Provocative, polished and made for the night.",
    notes: "Lemon, lavender, orange blossom, cedar"
  },
  {
    code: "n62",
    number: "N°62",
    name: "N Ō R Y E N°62",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "Prada Paradoxe",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2062.jpeg",
    featured: false,
    bestSeller: false,
    description: "A radiant floral amber that balances softness with strength. Modern, luminous and deeply feminine.",
    notes: "Pear, neroli, jasmine, bourbon vanilla"
  },
  {
    code: "n72",
    number: "N°72",
    name: "N Ō R Y E N°72",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "Lancôme La Vie Est Belle",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2072.jpeg",
    featured: false,
    bestSeller: false,
    description: "A gourmand iris with sparkling sweetness. Joyful, elegant and full of life.",
    notes: "Iris, patchouli, praline, vanilla"
  },
  {
    code: "n82",
    number: "N°82",
    name: "N Ō R Y E N°82",
    category: "men",
    categoryLabel: "Men",
    inspiredBy: "Lattafa Khamrah",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2082.jpeg",
    featured: false,
    bestSeller: true,
    description: "Rich, spicy and warmly sweet. An oriental gourmand with serious depth and lasting presence.",
    notes: "Cinnamon, dates, praline, vanilla, amber"
  },
  {
    code: "n92",
    number: "N°92",
    name: "N Ō R Y E N°92",
    category: "women",
    categoryLabel: "Women",
    inspiredBy: "Lancôme La Nuit Trésor",
    price: "Ksh 1,299/=",
    size: "30ML Eau de Parfum",
    image: "images/N%2092.jpeg",
    featured: false,
    bestSeller: false,
    description: "A dark, velvety rose laced with vanilla and patchouli. Romantic, intense and unforgettable.",
    notes: "Rose, vanilla orchid, patchouli, praline"
  }
];

function getProductByCode(code) {
  if (!code) return null;
  return NORYE_PRODUCTS.find(function (p) {
    return p.code === code.toLowerCase();
  }) || null;
}

function getProductsByCategory(category) {
  return NORYE_PRODUCTS.filter(function (p) {
    return p.category === category;
  });
}

function getFeaturedProducts() {
  return NORYE_PRODUCTS.filter(function (p) {
    return p.featured;
  });
}

function getBestSellers() {
  return NORYE_PRODUCTS.filter(function (p) {
    return p.bestSeller;
  });
}

function getRelatedProducts(product, limit) {
  limit = limit || 4;
  return NORYE_PRODUCTS.filter(function (p) {
    return p.category === product.category && p.code !== product.code;
  }).slice(0, limit);
}
