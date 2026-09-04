// ===== Script: Pengingat Absen Harian (dijalankan oleh GitHub Actions) =====
// Ini VERSI PENGGANTI dari Cloud Function Firebase (functions/index.js) —
// isinya sama persis (cek siapa belum absen hari ini, kirim notifikasi),
// bedanya cuma yang "menekan tombol jalanin"-nya: bukan Firebase Scheduler
// (yang butuh paket Blaze/kartu), tapi jadwal cron gratis dari GitHub
// Actions (lihat .github/workflows/pengingat-absen.yml).
//
// Kredensial Firebase-nya diambil dari GitHub Actions secret bernama
// FIREBASE_SERVICE_ACCOUNT (isinya file JSON service account dari
// Firebase Console) — JANGAN PERNAH taruh isi JSON itu langsung di file
// ini atau di-commit ke repo, karena itu "kunci penuh" ke project
// Firebase kamu.

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

// Format tanggal "YYYY-MM-DD" di timezone Asia/Makassar (WITA) — HARUS
// konsisten dengan cara javascript.js menyimpan field absenTerakhir.
function tanggalHariIniWITA() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Makassar',
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return formatter.format(new Date());
}

async function main() {
    const hariIni = tanggalHariIniWITA();
    const snapshot = await db.collection('progresGame').get();

    let jumlahTerkirim = 0;
    const daftarTugas = [];

    snapshot.forEach((doc) => {
        const data = doc.data();
        const token = data.fcmToken;
        const sudahAbsenHariIni = data.absenTerakhir === hariIni;
        if (!token || sudahAbsenHariIni) return; // skip: belum daftar notif, atau sudah absen

        const pesan = {
            token,
            notification: {
                title: '🎲 Jangan Lupa Absen Hari Ini!',
                body: 'Yuk absen sekarang biar streak-mu di Sobat Sehat tetap jalan dan dapat Poin Sehat.'
            },
            data: { url: '/' },
            webpush: { fcmOptions: { link: '/' } }
        };

        const tugasKirim = messaging.send(pesan)
            .then(() => { jumlahTerkirim++; })
            .catch((err) => {
                // Token tidak valid lagi (device uninstall/cache dibersihkan/dsb)
                // -> hapus dari Firestore supaya tidak dicoba kirim lagi.
                const kodeTokenMati = [
                    'messaging/registration-token-not-registered',
                    'messaging/invalid-registration-token'
                ];
                if (kodeTokenMati.includes(err.code)) {
                    return doc.ref.set({ fcmToken: admin.firestore.FieldValue.delete() }, { merge: true });
                }
                console.warn(`Gagal kirim notifikasi ke ${doc.id}:`, err.message);
            });
        daftarTugas.push(tugasKirim);
    });

    await Promise.all(daftarTugas);
    console.log(`Pengingat absen harian selesai. ${jumlahTerkirim} notifikasi terkirim untuk tanggal ${hariIni}.`);
}

main().catch((err) => {
    console.error('Gagal menjalankan pengingat absen:', err);
    process.exit(1); // exit code != 0 -> run di tab Actions kelihatan MERAH/gagal
});
