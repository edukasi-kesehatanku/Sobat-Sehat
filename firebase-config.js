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
