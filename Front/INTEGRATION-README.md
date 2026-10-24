# AUDEX frontend API integration

1. Copy the contents of `src/` into the existing frontend project's `src/` folder.
2. Create a `.env` file beside `package.json` with:
   `VITE_API_URL=http://127.0.0.1:8000/api/v1`
3. Start Laravel on `http://127.0.0.1:8000`.
4. Start Vite normally (`npm run dev`) and sign in with a seeded local account:
   `admin@audex.com` / `password`
5. The app now reads recommendations, workflows, users, tasks and task status from the Laravel API.
   Task evidence URLs are saved as backend evidence records and linked to their task.

If your backend uses another host or port, change `VITE_API_URL` and restart Vite.
