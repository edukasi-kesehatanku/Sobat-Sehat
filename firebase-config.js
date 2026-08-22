// ===== Konfigurasi Firebase (Sobat Sehat Tracking) =====
// File ini HARUS dimuat sebelum javascript.js di index.html.
// Isinya cuma inisialisasi koneksi ke project Firebase — logic pencatatan
// pengunjung (login, durasi, jumlah kunjungan) ada di javascript.js.

const firebaseConfig = {
    apiKey: "AIzaSyDkX6jVQ6v1J24sWTgzMmsXlCc7hu4GM64",
    authDomain: "sobat-sehat-tracking.firebaseapp.com",
    projectId: "sobat-sehat-tracking",
    storageBucket: "sobat-sehat-tracking.firebasestorage.app",
    messagingSenderId: "535772461464",
    appId: "1:535772461464:web:3af3c412e38479dad1d3ed",
    measurementId: "G-GLLT23DL7M"
};

firebase.initializeApp(firebaseConfig);

// "db" dipakai di javascript.js buat baca/tulis data ke Firestore
const db = firebase.firestore();

// ===== Offline persistence =====
// Menyimpan data Firestore secara lokal di browser (IndexedDB), supaya:
// 1) Progres game tetap bisa dibaca/dimainkan walau internet lagi lemot/putus
// 2) Data yang belum sempat terkirim otomatis di-sync begitu koneksi balik,
//    tanpa perlu logic tambahan manual di javascript.js
// 3) Mengurangi jumlah pembacaan (read) berulang ke Firestore, karena data
//    yang sudah pernah diambil bisa dibaca dari cache lokal dulu.
// Dibungkus .catch supaya kalau gagal aktif (misal dibuka di banyak tab
// sekaligus, atau browser lama yang belum dukung), web tetap jalan normal
// seperti sebelumnya — cuma tanpa manfaat offline-nya.
db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
        if (err.code === 'failed-precondition') {
            // Persistence cuma bisa aktif di satu tab; dengan
            // synchronizeTabs:true seharusnya jarang kejadian, tapi tetap
            // dijaga supaya tidak melempar error yang menghentikan skrip.
            console.warn('Firestore offline persistence tidak aktif: dibuka di banyak tab.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore offline persistence tidak didukung browser ini.');
        } else {
            console.warn('Gagal mengaktifkan Firestore offline persistence:', err);
        }
    });

