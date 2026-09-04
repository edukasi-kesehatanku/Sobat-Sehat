// ===== Service Worker Firebase Cloud Messaging (Sobat Sehat) =====
// File ini WAJIB berada di root website (satu folder sama dengan
// index.html), dan namanya HARUS persis "firebase-messaging-sw.js" —
// itu aturan dari Firebase supaya SDK bisa otomatis menemukannya saat
// mendaftarkan service worker dari javascript.js.
//
// Fungsinya: menangkap notifikasi push yang dikirim server (Cloud
// Function) TEPAT SAAT tab/website ini sedang TIDAK dibuka (browser
// masih jalan di background, atau bahkan tab sudah ditutup). Kalau
// tab-nya lagi kebuka aktif, notifikasi malah ditangani lewat
// messaging.onMessage() di javascript.js, bukan lewat file ini.
//
// Service worker punya "dunia" sendiri terpisah dari halaman web biasa
// (tidak bisa akses DOM, localStorage, atau variabel di javascript.js),
// makanya firebaseConfig di bawah ini SENGAJA ditulis ulang manual
// (disalin dari firebase-config.js) — bukan diimpor.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDkX6jVQ6v1J24sWTgzMmsXlCc7hu4GM64",
    authDomain: "sobat-sehat-tracking.firebaseapp.com",
    projectId: "sobat-sehat-tracking",
    storageBucket: "sobat-sehat-tracking.firebasestorage.app",
    messagingSenderId: "535772461464",
    appId: "1:535772461464:web:3af3c412e38479dad1d3ed"
});

const messaging = firebase.messaging();

// Dipanggil otomatis oleh browser saat ada push masuk dan tab/website
// SEDANG TERTUTUP atau tidak fokus. payload.notification berisi
// title/body yang dikirim dari Cloud Function (lihat functions/index.js).
messaging.onBackgroundMessage((payload) => {
    const judul = (payload.notification && payload.notification.title) || 'Sobat Sehat';
    const opsi = {
        body: (payload.notification && payload.notification.body) || 'Jangan lupa absen hari ini ya!',
        icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E%F0%9F%8E%B2%3C/text%3E%3C/svg%3E',
        badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ctext y=\'.9em\' font-size=\'90\'%3E%F0%9F%8E%B2%3C/text%3E%3C/svg%3E',
        // Data tambahan supaya saat notifikasi DIKLIK, kita tahu mau
        // arahkan user ke mana (lihat listener 'notificationclick' di bawah).
        data: { url: (payload.data && payload.data.url) || '/' }
    };
    self.registration.showNotification(judul, opsi);
});

// Saat notifikasi (yang muncul lewat showNotification di atas) DIKLIK
// oleh user: fokuskan tab website yang sudah kebuka kalau ada, atau buka
// tab baru ke halaman utama kalau belum ada tab yang terbuka sama sekali.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});
