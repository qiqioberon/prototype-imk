# FocusTunes Prototype

Prototype aplikasi fokus berbasis musik untuk tugas IMK, dimigrasikan dari Vite React ke Next.js App Router.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Build Production

```bash
npm run build
npm run start
```

## Route Prototype

- `/` dan `/splash`
- `/login`
- `/onboarding`
- `/home`
- `/music`
- `/preset`
- `/session`
- `/player`
- `/queue`
- `/review`
- `/stats`

State prototype disimpan di client selama navigasi. Jika halaman di-refresh atau dibuka langsung dari URL, state kembali ke default screen tersebut.
