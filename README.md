# Pinball Hall of Fame (Next.js)

1. **Install deps**

   ```bash
   npm install
   ```

2. Add Firebase config

   ```
   cp .env.local.example .env.local
   # then edit .env.local with your own keys
   ```

3. Run locally
   `npm run dev`

4. Build & Export (static files for GitHub Pages)

   ```
   npm run build && npm run export
   # output goes to /out – push that folder to gh‑pages or set Pages to /root/out
   ```
