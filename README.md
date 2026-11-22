# TakeHelp? – Frontend (static site)
Plain HTML/CSS/JS in `public/`. It talks to the backend API at the address in `public/config.js`.
- Run locally: `npm start` → http://localhost:5173 (backend must be running on the API_URL address)
- Deploy: upload the `public` folder to any static host (publish directory = `public`), after setting `API_URL` in `public/config.js` to your backend's HTTPS address.
- Phone testing on same Wi-Fi: set `API_URL` to `http://YOUR-PC-IP:3000`, and set the backend's `FRONTEND_ORIGIN` to `http://YOUR-PC-IP:5173`.
