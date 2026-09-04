# Deploy N Ō R Y E to Vercel

This is a static site (HTML, CSS, JS). No build step is required.

## Prerequisites

- Code pushed to GitHub: [harry934/Norye-perfumes](https://github.com/harry934/Norye-perfumes)
- A [Vercel](https://vercel.com) account

## Steps

1. Push your latest changes to the `main` branch on GitHub.
2. Log in to [vercel.com](https://vercel.com) and click **Add New → Project**.
3. Import the **Norye-perfumes** repository.
4. Configure the project:
   - **Framework Preset:** Other
   - **Root Directory:** `.` (repository root)
   - **Build Command:** leave empty
   - **Output Directory:** leave empty
5. Click **Deploy**.

Vercel will serve `index.html`, `men.html`, `women.html`, and `product.html` directly.

## Custom domain (optional)

After deploy, open **Project Settings → Domains** in Vercel and add your custom domain.

## Cart and checkout

Cart items and customer details are stored in the browser via `localStorage` — no server or login required. Orders are sent to WhatsApp when the customer clicks **Order on WhatsApp**.
