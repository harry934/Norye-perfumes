# N Ō R Y E — Perfume Storefront

A static e-commerce website for **N Ō R Y E**, an olfactory design line selling inspired 30ML Eau de Parfum for men and women (Ksh 1,299/=). Customers browse the catalog, add items to a cart, and complete orders via WhatsApp.

**Live repo:** [github.com/harry934/Norye-perfumes](https://github.com/harry934/Norye-perfumes)

---

## What this site does

- **Homepage** — hero, featured perfumes, best sellers, shop-by-category, about section
- **Collection pages** — `men.html` and `women.html` with full product grids
- **Product detail** — `product.html?code=n23` with description, notes, related items
- **Live search** — find perfumes by name, number, or inspiration
- **Smart cart** — add/remove items, adjust quantities, persisted in the browser
- **WhatsApp checkout** — customer details + order summary sent to your WhatsApp

---

## Features

| Feature | Details |
|---|---|
| Product catalog | 11 perfumes defined in `js/products.js` |
| Cart storage | Browser `localStorage` key `norye-cart` |
| Checkout storage | Browser `localStorage` key `norye-checkout` |
| Order channel | WhatsApp to `+254 721 754234` |
| Hosting | Static files on [Vercel](https://vercel.com) (see [DEPLOY.md](DEPLOY.md)) |

---

## How checkout works

There is **no payment gateway** and **no server-side order database**. Checkout is a guided WhatsApp handoff.

### Step-by-step flow

1. **Add to cart** — Customer clicks *Add to Cart* on any product. Items are saved as `[{ code, qty }]` in `localStorage` under `norye-cart`.

2. **Open cart** — Customer opens the cart panel and reviews items and quantities.

3. **Enter details** — Customer fills in:
   - Full name
   - Phone (WhatsApp)
   - Delivery location
   - Notes (optional)

   These are saved to `localStorage` under `norye-checkout` as the customer types.

4. **Order on WhatsApp** — Customer clicks *Order on WhatsApp*. The site:
   - Validates name, phone, and location
   - Builds a formatted message (items, quantities, prices, total, customer details)
   - Copies the message to clipboard as backup
   - Opens `https://wa.me/254721754234?text=...` with the message pre-filled

5. **Customer sends message** — The order is only placed when the customer sends the WhatsApp message. You receive it on your business WhatsApp and confirm payment/delivery manually.

### Example WhatsApp message

```
*N Ō R Y E Order*

Items:
- N°23 · Creed Aventus x1 — Ksh 1,299

Total: Ksh 1,299

Name: Jane Doe
Phone: 0712345678
Delivery: Westlands, Nairobi
```

### Key files

| File | Role |
|---|---|
| `js/products.js` | Product catalog, prices, WhatsApp phone |
| `js/norye.js` | Cart logic, `buildWhatsAppOrderUrl()`, checkout form |
| `index.html` (cart panel) | Checkout form UI |

---

## Tech stack

- HTML5, CSS3, Bootstrap 5
- Vanilla JavaScript (no framework)
- [Swiper](https://swiperjs.com/) — product carousels
- [AOS](https://michalsnik.github.io/aos/) — scroll animations
- Vercel — static hosting with free HTTPS

---

## Local development

No build step required. Open `index.html` in a browser, or run a simple static server:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Then visit `http://localhost:8080`.

---

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for step-by-step Vercel deployment and custom domain setup.

---

## Security — is it safe to go live?

**Yes.** This is a low-risk static storefront suitable for a custom domain.

### What is secure

| Aspect | Why it's safe |
|---|---|
| **HTTPS** | Vercel provides free SSL on all domains automatically |
| **No payment data** | No credit cards or M-Pesa API — nothing sensitive to breach |
| **No backend** | Static HTML/CSS/JS only — no database, SQL, or server to hack |
| **No secrets** | Only the public business WhatsApp number is in the code |

### What customers should know

- Cart and checkout details stay **in the browser** until they click *Order on WhatsApp*
- The order is **not complete** until they send the WhatsApp message
- Cart does **not sync** across devices (phone vs laptop)

### Before you launch

1. Enable **2FA** on GitHub and Vercel accounts
2. Point your domain through **Vercel DNS** (Settings → Domains)
3. Do not commit API keys or passwords — none are needed for this site
4. Confirm orders and payment manually in WhatsApp chat

### What this site is NOT

- Not an automated payment system (M-Pesa/card gateway)
- Not storing orders in a database
- Not a substitute for WhatsApp-based order confirmation

---

## Project structure

```
kaira-1.0.0/
├── index.html          # Homepage
├── men.html            # Men's collection
├── women.html          # Women's collection
├── product.html        # Product detail page
├── js/
│   ├── products.js     # Catalog + WhatsApp phone
│   └── norye.js        # Cart, search, checkout
├── style.css           # Brand styles
├── images/             # Product photos
├── vercel.json         # Deploy config
└── DEPLOY.md           # Deploy instructions
```

---

## License

Based on the [Kaira](https://templatesjungle.com/) HTML template by ThemeWagon. Customized for N Ō R Y E.
