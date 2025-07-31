# Pinball Hall of Fame (Next.js)

1. **Install deps**

   ```bash
   npm install
   ```

2. Add Firebase config

   ```bash
   cp .env.local.example .env.local
   ```

   then edit .env.local with your own keys,

3. Run locally
   `npm run dev`

4. Build & Export (static files for GitHub Pages)

   ```bash
   npm run build
   # output goes to /out – push that folder to gh‑pages or set Pages to /root/out
   ```
