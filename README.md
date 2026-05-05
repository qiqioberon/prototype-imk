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

State prototype disimpan di client dan dipulihkan saat halaman di-refresh. Route tetap mengikuti URL yang sedang dibuka.

## Improve yang Sudah Ditambahkan

- Persistensi state prototype ke `localStorage`, sehingga preferensi, smart queue, blocked tracks, dan ringkasan sesi tetap tersimpan setelah refresh.
- Rekomendasi playlist yang adaptif terhadap aktivitas, konteks, preferensi lirik, durasi fokus, dan kesiapan offline.
- Live focus session dengan countdown, pause/resume, skip tracking, dan review/statistik yang ikut berubah berdasarkan sesi terakhir.
- Smart queue dengan indikator health, auto-fix, dan toast feedback untuk setiap aksi penting.