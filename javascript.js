const landingPage = document.getElementById('landingPage');
const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const btnMulai = document.getElementById('btnMulai');
const formData = document.getElementById('formData');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnTogglePassword = document.getElementById('btnTogglePassword');
const iconMataTerbuka = document.getElementById('iconMataTerbuka');
const iconMataTertutup = document.getElementById('iconMataTertutup');
const daftarAkunEmail = document.getElementById('daftarAkunEmail');
const emailHint = document.getElementById('emailHint');
const loginError = document.getElementById('loginError');
const btnLupaSandi = document.getElementById('btnLupaSandi');
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const googleLoginError = document.getElementById('googleLoginError');
const topbarUser = document.getElementById('topbarUser');
const dashboardWelcome = document.getElementById('dashboardWelcome');
const btnLogout = document.getElementById('btnLogout');
const navItems = document.querySelectorAll('.nav-item');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const btnMenuToggle = document.getElementById('btnMenuToggle');
const bgMusic = document.getElementById('bgMusic');
const btnToggleMusik = document.getElementById('btnToggleMusik');
const iconMusikOn = document.getElementById('iconMusikOn');
const iconMusikOff = document.getElementById('iconMusikOff');
// ===== SFX (efek suara) — pakai Web Audio API, BUKAN elemen <audio> biasa =====
// Sebelumnya tiap SFX pakai elemen <audio> HTML + reset currentTime (atau
// cloneNode buat dadu). Di HP itu suka kerasa delay/kadang telat bunyi,
// karena browser mesti "menyiapkan" ulang jalur pemutaran tiap kali play()
// dipanggil (apalagi cloneNode = elemen baru dari nol tiap tik dadu).
// Web Audio API men-decode tiap file SEKALI ke memori (AudioBuffer) saat
// halaman dibuka, lalu tiap mau bunyi tinggal "trigger" node baru dari
// buffer itu langsung dari memori — nyaris nol delay, dan aman ditumpuk
// rapat (dadu) tanpa saling motong.
let sfxAudioCtx = null;
function ambilSfxAudioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!sfxAudioCtx) sfxAudioCtx = new Ctx();
    // Kebijakan autoplay browser (terutama HP) mengunci AudioContext dalam
    // status 'suspended' sampai ada interaksi pengguna. Tiap mainkanBufferSfx()
    // dipanggil (yang selalu berasal dari klik tombol/aksi pemain), context
    // ini dicoba di-resume lagi — begitu berhasil sekali, dia tetap 'running'
    // untuk pemanggilan berikutnya (termasuk yang dijadwalkan lewat
    // setTimeout, seperti tik dadu).
    if (sfxAudioCtx.state === 'suspended') sfxAudioCtx.resume().catch(() => {});
    return sfxAudioCtx;
}
const sfxBufferCache = {}; // url -> Promise<AudioBuffer|null>, supaya tiap file cuma di-fetch+decode SEKALI
function muatSfxBuffer(url) {
    const ctx = ambilSfxAudioCtx();
    if (!ctx) return Promise.resolve(null);
    if (sfxBufferCache[url]) return sfxBufferCache[url];
    const janji = fetch(url)
        .then(res => res.arrayBuffer())
        .then(data => ctx.decodeAudioData(data))
        .catch(err => { console.warn('Gagal memuat SFX:', url, err); return null; });
    sfxBufferCache[url] = janji;
    return janji;
}
// volume: 0-1 biasa. rate: kecepatan putar sekaligus nada (1 = normal,
// >1 = lebih cepat/nada lebih tinggi, <1 = lebih lambat/nada lebih rendah).
function mainkanBufferSfx(url, { volume = 0.6, rate = 1 } = {}) {
    const ctx = ambilSfxAudioCtx();
    if (!ctx) return;
    muatSfxBuffer(url).then(buffer => {
        if (!buffer) return;
        const sumber = ctx.createBufferSource();
        sumber.buffer = buffer;
        sumber.playbackRate.value = rate;
        const gain = ctx.createGain();
        gain.gain.value = volume;
        sumber.connect(gain).connect(ctx.destination);
        sumber.start(0);
    });
}
// URL SFX dipusatkan di sini biar gampang di-preload & dipakai ulang.
const SFX_LANGKAH_PION_URL = 'sfx-langkah-pion.wav?v=20260829';
const SFX_NOTIF_POIN_URL = 'sfx-notif-poin.wav?v=20260829';
const SFX_PENCAPAIAN_URL = 'sfx-pencapaian.wav?v=20260829';
const SFX_DADU_URL = 'sfx-dadu.wav?v=20260829';
// Chime singkat & lembut yang dibunyikan SEKALI tiap kali login berhasil
// (lihat selesaikanLogin() di bawah) — BUKAN saat halaman baru dibuka,
// karena browser memblokir audio otomatis sebelum ada interaksi user.
// Klik tombol "Masuk" itu sendiri sudah dihitung sebagai interaksi yang
// valid, jadi SFX ini boleh langsung bunyi tepat setelahnya.
const SFX_SELAMAT_DATANG_URL = 'sfx-selamat-datang.wav?v=20260906';
// Preload + decode semua SFX dari awal (bukan nunggu dipakai pertama kali),
// supaya begitu dipanggil beneran, buffer-nya sudah siap di memori dan
// mainkanBufferSfx() nggak nunggu proses fetch/decode sama sekali.
[SFX_LANGKAH_PION_URL, SFX_NOTIF_POIN_URL, SFX_PENCAPAIAN_URL, SFX_DADU_URL, SFX_SELAMAT_DATANG_URL].forEach(muatSfxBuffer);
function mainkanSfxLangkahPion() {
    mainkanBufferSfx(SFX_LANGKAH_PION_URL, { volume: 0.55 });
}
function mainkanSfxNotifPoin() {
    mainkanBufferSfx(SFX_NOTIF_POIN_URL, { volume: 0.6 });
}
function mainkanSfxPencapaian() {
    mainkanBufferSfx(SFX_PENCAPAIAN_URL, { volume: 0.65 });
}
function mainkanSfxSelamatDatang() {
    mainkanBufferSfx(SFX_SELAMAT_DATANG_URL, { volume: 0.5 });
}
// rate & volume buat SFX dadu diatur per-tik langsung dari dalam frameSpin()
// di kocokDadu() (dipicu dari rotasi asli, bukan jadwal waktu tetap),
// bukan nilai tetap di sini — biar nadanya ikut turun dari cepat/tinggi ke
// lambat/rendah sesuai putaran dadunya.
function mainkanSfxDadu(rate = 1, volume = 0.5) {
    mainkanBufferSfx(SFX_DADU_URL, { volume, rate });
}
const KUNCI_AKUN_TERSIMPAN = 'sobatSehatAkunTersimpan';
const MAKS_AKUN_TERSIMPAN = 6;
let emailAktif = null; // email akun yang sedang login — dipakai untuk data per akun seperti Pet
// ===== Sesi login aktif — supaya refresh halaman (F5) tidak minta login ulang =====
// Beda dengan KUNCI_AKUN_TERSIMPAN (daftar akun yang PERNAH login di device ini,
// dipakai buat dropdown email), key ini nyimpen SIAPA yang lagi login SEKARANG.
const KUNCI_SESI_AKTIF = 'sobatSehatSesiAktifEmail';
function simpanSesiAktif(email, nama) {
    try {
        localStorage.setItem(KUNCI_SESI_AKTIF, JSON.stringify({ email, nama }));
    } catch {}
}
function hapusSesiAktif() {
    try {
        localStorage.removeItem(KUNCI_SESI_AKTIF);
    } catch {}
}
function ambilSesiAktif() {
    try {
        const data = JSON.parse(localStorage.getItem(KUNCI_SESI_AKTIF));
        return (data && data.email) ? data : null;
    } catch {
        return null;
    }
}
function ambilAkunTersimpan() {
    try {
        const data = JSON.parse(localStorage.getItem(KUNCI_AKUN_TERSIMPAN));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}
function escapeHtml(teks) {
    return String(teks).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
function turunkanNamaDariEmail(email) {
    const bagianDepan = String(email).split('@')[0] || '';
    const tanpaAngkaBelakang = bagianDepan.replace(/[0-9]+$/, '');
    const kata = tanpaAngkaBelakang
        .split(/[._\-+]+/)
        .filter(Boolean)
        .map(k => k.charAt(0).toUpperCase() + k.slice(1));
    if (kata.length > 0) return kata.join(' ');
    const fallback = bagianDepan.replace(/[^a-zA-Z]+/g, ' ').trim();
    return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : 'Sobat Sehat';
}
function tampilkanPilihanAkun() {
    if (!daftarAkunEmail) return;
    const akunList = ambilAkunTersimpan();
    daftarAkunEmail.innerHTML = akunList
        .map(akun => {
            const nama = turunkanNamaDariEmail(akun.email);
            return `<option value="${escapeHtml(akun.email)}" label="${escapeHtml(nama)}">${escapeHtml(nama)}</option>`;
        })
        .join('');
}
function simpanAkun(akunBaru) {
    let akunList = ambilAkunTersimpan().filter(akun => akun.email !== akunBaru.email);
    akunList.unshift(akunBaru);
    akunList = akunList.slice(0, MAKS_AKUN_TERSIMPAN);
    localStorage.setItem(KUNCI_AKUN_TERSIMPAN, JSON.stringify(akunList));
    tampilkanPilihanAkun();
}
function sembunyikanErrorLogin() {
    if (loginError) loginError.classList.add('hidden');
}
function tampilkanErrorLogin() {
    if (!loginError) return;
    loginError.classList.remove('hidden');
    formData.classList.remove('shake');
    void formData.offsetWidth; // reset supaya animasi bisa diulang
    formData.classList.add('shake');
    passwordInput.value = '';
    passwordInput.focus();
}
function perbaruiHintEmail() {
    if (!emailInput || !emailHint) return;
    sembunyikanErrorLogin();
    const email = emailInput.value.trim().toLowerCase();
    if (!email) {
        emailHint.textContent = 'Sudah pernah login di perangkat ini? Ketuk kolom ini untuk memilih akunmu.';
        passwordInput.value = '';
        return;
    }
    const akunCocok = ambilAkunTersimpan().find(akun => akun.email === email);
    if (akunCocok && akunCocok.viaGoogle) {
        emailHint.textContent = 'Akun ini biasa login pakai Google. Ketuk tombol "Masuk dengan Google" di atas ya.';
        passwordInput.value = '';
    } else if (akunCocok) {
        emailHint.textContent = '';
        passwordInput.value = akunCocok.password;
    } else {
        emailHint.textContent = 'Email baru — sandi yang kamu buat sekarang akan dipakai untuk login berikutnya di perangkat ini.';
        passwordInput.value = '';
    }
}
if (emailInput) {
    emailInput.addEventListener('input', perbaruiHintEmail);
    emailInput.addEventListener('change', perbaruiHintEmail);
}
if (passwordInput) {
    passwordInput.addEventListener('input', sembunyikanErrorLogin);
}
if (btnTogglePassword) {
    btnTogglePassword.addEventListener('click', () => {
        const tampilkan = passwordInput.type === 'password';
        passwordInput.type = tampilkan ? 'text' : 'password';
        iconMataTerbuka.classList.toggle('hidden', !tampilkan);
        iconMataTertutup.classList.toggle('hidden', tampilkan);
        btnTogglePassword.setAttribute('aria-pressed', String(tampilkan));
        btnTogglePassword.setAttribute('aria-label', tampilkan ? 'Sembunyikan sandi' : 'Tampilkan sandi');
    });
}
if (btnLupaSandi) {
    btnLupaSandi.addEventListener('click', () => {
        const email = emailInput.value.trim().toLowerCase();
        const akunList = ambilAkunTersimpan().filter(akun => akun.email !== email);
        localStorage.setItem(KUNCI_AKUN_TERSIMPAN, JSON.stringify(akunList));
        tampilkanPilihanAkun();
        sembunyikanErrorLogin();
        passwordInput.value = '';
        emailHint.textContent = 'Sandi lama untuk email ini sudah dihapus dari perangkat ini. Masukkan sandi baru untuk mendaftar ulang.';
        passwordInput.focus();
    });
}
tampilkanPilihanAkun();
function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
    return el;
}
function scrollKe(id, behavior = 'smooth') {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior, block: 'start' });
}
// ===== Animasi buka/tutup untuk semua panel-event-overlay (modal popup) =====
// Dipakai supaya modal (Garis Mulai, Aturan Main, info pet, dsb) muncul & hilang
// dengan transisi halus alih-alih langsung "plek" ganti display:none.
function bukaPanelOverlay(el) {
    if (!el) return;
    el.classList.remove('is-closing');
    el.classList.remove('hidden');
    // Trik reflow: paksa browser "membaca ulang" state sebelum kelas ditambah,
    // supaya animasi CSS-nya selalu terpicu dari awal walau sebelumnya sempat dibuka.
    void el.offsetWidth;
    el.classList.add('is-open');
}
function tutupPanelOverlay(el) {
    if (!el) return;
    el.classList.remove('is-open');
    el.classList.add('is-closing');
    const selesai = () => {
        // Jaga-jaga race condition: kalau overlay ini sempat dibuka LAGI (lewat
        // bukaPanelOverlay) sebelum timer/animationend penutupan yang lama ini
        // sempat jalan — misalnya di papan permainan, event "Jebakan"/"Bonus"
        // dengan langkah cuma 1 kotak selesai pindah (~220ms) lebih cepat dari
        // jeda penutupan overlay lama (250ms), lalu langsung membuka event
        // tile berikutnya — maka JANGAN ikut menyembunyikan overlay yang baru
        // itu. Kalau tetap dijalankan, overlay baru (mis. panel Kuis/Fakta)
        // jadi langsung hilang (class .hidden pakai !important) padahal belum
        // dijawab/ditutup pemain, sehingga tombol "Kocok Dadu" ikut macet
        // permanen karena menunggu overlay yang sudah tak kelihatan itu.
        if (el.classList.contains('is-open')) return;
        el.classList.add('hidden');
        el.classList.remove('is-closing');
        el.removeEventListener('animationend', selesai);
    };
    el.addEventListener('animationend', selesai);
    // Jaga-jaga kalau animationend tidak terpicu (mis. prefers-reduced-motion)
    setTimeout(selesai, 250);
}
btnMulai.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    loginPage.classList.remove('hidden');
    putarMusikBackground();
});

// ===== Musik latar (background music) =====
// Preferensi aktif/nonaktif disimpan di localStorage supaya kalau user
// mematikan musik, pilihannya diingat walau halaman di-refresh.
// Browser modern memblokir audio dengan suara sebelum ada interaksi user
// (autoplay policy), jadi bgMusic.play() dipanggil di titik-titik yang
// memang dipicu oleh klik user (tombol "Mulai", habis login, dan tombol
// toggle musik itu sendiri) — bukan langsung saat halaman dimuat.
const KUNCI_MUSIK_AKTIF = 'sobatSehatMusikAktif';
let musikAktif = localStorage.getItem(KUNCI_MUSIK_AKTIF) !== 'off'; // default: nyala

// Ikon tombol speaker mengikuti status PUTAR SUNGGUHAN dari elemen audio
// (bgMusic.paused), bukan cuma preferensi tersimpan (musikAktif). Ini
// penting karena browser sering menolak autoplay di awal — kalau ikon
// dipaksa tampil "nyala" padahal audionya masih diam (paused), tombol jadi
// butuh 2x tekan (tekan 1: dikira "lagi bunyi" jadi cuma di-pause padahal
// memang belum bunyi; tekan 2: baru beneran play()). Dengan mengacu ke
// bgMusic.paused, begitu autoplay ditolak ikon otomatis tampil "mati" —
// jadi cukup 1x tekan untuk benar-benar menyalakan suaranya.
function musikSedangBunyi() {
    return !!(musikAktif && bgMusic && !bgMusic.paused);
}

function terapkanTampilanIkonMusik() {
    if (!btnToggleMusik) return;
    const bunyi = musikSedangBunyi();
    btnToggleMusik.setAttribute('aria-pressed', bunyi ? 'true' : 'false');
    btnToggleMusik.setAttribute('aria-label', bunyi ? 'Nonaktifkan musik latar' : 'Aktifkan musik latar');
    iconMusikOn.classList.toggle('hidden', !bunyi);
    iconMusikOff.classList.toggle('hidden', bunyi);
}

function putarMusikBackground() {
    if (!bgMusic || !musikAktif) return;
    bgMusic.volume = 0.35;
    // .play() mengembalikan Promise; kalau ditolak (misal browser masih
    // menganggap belum ada interaksi user yang valid), diamkan saja supaya
    // tidak muncul error di console — tapi tetap perbarui ikon (jadi "mati")
    // supaya tombol speaker mencerminkan kondisi yang sebenarnya, dan cukup
    // 1x tekan berikutnya untuk menyalakan suaranya.
    bgMusic.play().then(terapkanTampilanIkonMusik).catch(terapkanTampilanIkonMusik);
}

function jedaMusikBackground() {
    if (!bgMusic) return;
    bgMusic.pause();
    terapkanTampilanIkonMusik();
}

if (btnToggleMusik) {
    terapkanTampilanIkonMusik();
    btnToggleMusik.addEventListener('click', () => {
        // Cek kondisi audio yang SEBENARNYA saat ini, jangan cuma nilai
        // musikAktif yang tersimpan — supaya 1x tekan selalu berujung ke
        // aksi yang benar-benar terjadi (nyala beneran / mati beneran).
        if (musikSedangBunyi()) {
            musikAktif = false;
            localStorage.setItem(KUNCI_MUSIK_AKTIF, 'off');
            jedaMusikBackground();
        } else {
            musikAktif = true;
            localStorage.setItem(KUNCI_MUSIK_AKTIF, 'on');
            putarMusikBackground();
        }
        terapkanTampilanIkonMusik();
    });
}
// ===== Musik "mati sendiri" — auto-nyalain lagi kalau di-pause PAKSA =====
// Browser (terutama Chrome/Safari di HP) otomatis mem-PAUSE audio yang lagi
// jalan di background begitu tab-nya disembunyikan (pindah app, kunci
// layar, ganti tab) — buat ngirit baterai/kuota, bukan karena kita yang
// nyuruh. Sebelumnya tidak ada logic buat menyalakan lagi otomatis pas tab
// keliatan lagi, jadi musiknya kelihatan "mati sendiri" dan diam terus
// sampai pemain sadar dan pencet tombol speaker manual.
//
// Caranya bedain pause yang DIMINTA user (lewat tombol toggle di atas —
// musikAktif SUDAH di-set false SEBELUM bgMusic.pause() dipanggil) vs pause
// yang DIPAKSA browser (musikAktif masih true, tapi audionya somehow
// berhenti): kalau musikAktif masih true tapi audionya paused, itu tandanya
// bukan kemauan user — coba nyalakan lagi begitu tab kelihatan/fokus lagi.
function cobaLanjutkanMusikJikaTerhenti() {
    if (musikAktif && bgMusic && bgMusic.paused) {
        putarMusikBackground();
    }
}
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') cobaLanjutkanMusikJikaTerhenti();
});
// pageshow juga dipasang buat jaga-jaga kasus balik dari cache
// (tombol back/forward di beberapa browser tidak selalu memicu
// visibilitychange dengan konsisten).
window.addEventListener('pageshow', cobaLanjutkanMusikJikaTerhenti);
window.addEventListener('focus', cobaLanjutkanMusikJikaTerhenti);
if (bgMusic) {
    // Kalau audionya gagal dimuat di tengah jalan (koneksi HP putus-putus,
    // misalnya) browser akan diam-diam berhenti tanpa ada usaha coba lagi.
    // Begitu error kedetect, muat ulang filenya dan coba putar lagi sekali
    // (kalau memang musikAktif masih nyala) — supaya satu glitch koneksi
    // tidak bikin musiknya bisu untuk sisa sesi.
    bgMusic.addEventListener('error', () => {
        if (!musikAktif) return;
        bgMusic.load();
        putarMusikBackground();
    });
}
// ===== "Pembuka kunci" autoplay di sentuhan pertama =====
// Browser memblokir audio berbunyi otomatis sebelum ada interaksi apa pun
// dari pengguna di halaman ini (kebijakan autoplay browser, bukan bug).
// Jadi kalau seseorang masuk otomatis ke dashboard karena sesi/riwayat
// login tersimpan (tanpa sempat klik tombol apa pun), putarMusikBackground()
// di atas kemungkinan besar ditolak diam-diam oleh browser.
// Untuk menyiasatinya: begitu terdeteksi interaksi PERTAMA apa pun di
// halaman (klik, ketuk, scroll, atau tekan tombol), musik langsung dicoba
// diputar saat itu juga — supaya jedanya sekecil mungkin tanpa perlu
// pengguna sengaja menekan tombol speaker.
function bukaKunciMusikSaatSentuhanPertama() {
    if (!musikAktif || (bgMusic && !bgMusic.paused)) {
        lepasPendengarSentuhanPertama();
        return;
    }
    putarMusikBackground();
    lepasPendengarSentuhanPertama();
}
function lepasPendengarSentuhanPertama() {
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
        document.removeEventListener(evt, bukaKunciMusikSaatSentuhanPertama);
    });
}
['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
    document.addEventListener(evt, bukaKunciMusikSaatSentuhanPertama, { passive: true });
});
// Dipanggil setelah login berhasil (baik lewat form email+sandi maupun
// lewat tombol "Masuk dengan Google") — supaya kedua jalur login berujung
// ke proses yang sama persis: buka dashboard, catat pengunjung, tarik
// progres dari Firestore, dst.
// Toast kecil "Login berhasil" — dipakai HANYA saat login baru (bukan saat
// sesi lama dipulihkan otomatis lewat refresh, lihat selesaikanLogin()).
// Dibuat terpisah dari tampilkanToast()/tampilkanToastPoin() di modul game
// (di bawah), karena dua fungsi itu ada di dalam IIFE game yang belum tentu
// sudah terdefinisi/terjangkau dari sini — style-nya (class "papan-toast")
// tetap yang sama, global di style.css, jadi tampilannya konsisten.
function tampilkanNotifLoginBerhasil(nama) {
    const toastLama = document.querySelector('.papan-toast');
    if (toastLama) toastLama.remove();
    const toast = document.createElement('div');
    toast.className = 'papan-toast';
    toast.textContent = `✅ Login berhasil! Selamat datang, ${nama} 👋`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
function selesaikanLogin(email, nama, opts = {}) {
    emailAktif = email;
    topbarUser.textContent = `Halo, ${nama}`;
    dashboardWelcome.textContent = `Selamat datang, ${nama}! Berikut ringkasan halaman kamu.`;
    sembunyikanErrorLogin();
    if (googleLoginError) googleLoginError.classList.add('hidden');
    landingPage.classList.add('hidden');
    loginPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
    putarMusikBackground();
    // Chime "Selamat Datang" HANYA dibunyikan saat ini benar-benar aksi
    // login (klik tombol Masuk / Google) — bukan saat sesi lama otomatis
    // dipulihkan tiap kali halaman di-refresh (lihat pulihkanSesiTersimpan
    // di akhir file, yang memanggil fungsi ini TANPA opts.baruLogin), biar
    // nggak bolak-balik bunyi tiap F5.
    if (opts.baruLogin) {
        mainkanSfxSelamatDatang();
        tampilkanNotifLoginBerhasil(nama);
    }
    pindahkanIndikatorNav(document.querySelector('.nav-item.active'), false);
    catatLoginPengunjung(email, nama);
    // Simpan sesi aktif supaya kalau halaman di-refresh (F5), pemain TIDAK
    // dilempar balik ke halaman login — begitu script jalan lagi, sesi ini
    // dibaca ulang dan langsung masuk ke dashboard secara otomatis.
    simpanSesiAktif(email, nama);
    // Tarik dulu progres game dari cloud (Firestore) sebelum me-refresh
    // tampilan game, supaya progres yang disimpan dari device lain (mis.
    // laptop) ikut muncul di device ini, bukan mulai dari 0 lagi.
    const muatProgres = (typeof window.muatProgresDariFirestore === 'function')
        ? window.muatProgresDariFirestore(email)
        : Promise.resolve();
    muatProgres.then(() => {
        if (typeof window.refreshGameAkun === 'function') window.refreshGameAkun();
    });
}
formData.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const akunCocok = ambilAkunTersimpan().find(akun => akun.email === email);
    if (akunCocok) {
        if (akunCocok.password !== password) {
            tampilkanErrorLogin();
            return;
        }
    } else {
        simpanAkun({ email, password });
    }
    const nama = turunkanNamaDariEmail(email);
    selesaikanLogin(email, nama, { baruLogin: true });
});
// ===== Masuk dengan Google (satu ketukan, tanpa isi ulang email/sandi) =====
// Memakai Firebase Authentication (Google provider). Akun Google yang
// sudah tersimpan/login di browser/HP anak akan ditawarkan otomatis oleh
// jendela pilihan akun Google, jadi mereka tinggal ketuk nama akunnya.
function tampilkanErrorGoogle(err) {
    if (!googleLoginError) return;
    const kode = (err && err.code) ? err.code : 'unknown';
    const teksSpan = googleLoginError.querySelector('span');
    const pesanPerKode = {
        'auth/operation-not-allowed': 'Login Google belum diaktifkan di pengaturan Firebase (Authentication → Sign-in method → Google). Aktifkan dulu, ya.',
        'auth/unauthorized-domain': 'Alamat website ini belum didaftarkan di Firebase (Authentication → Settings → Authorized domains). Tambahkan dulu domainnya.',
        'auth/popup-blocked': 'Jendela pilih akun Google diblokir oleh browser. Sedang mencoba cara lain otomatis...',
        'auth/operation-not-supported-in-this-environment': 'Browser/aplikasi ini tidak mendukung jendela pop-up Google. Sedang mencoba cara lain otomatis...'
    };
    const pesan = pesanPerKode[kode] || `Login dengan Google gagal atau dibatalkan (kode: ${kode}). Coba lagi, atau masuk pakai email & sandi di bawah.`;
    if (teksSpan) teksSpan.textContent = pesan; else googleLoginError.textContent = pesan;
    googleLoginError.classList.remove('hidden');
}
function prosesUserGoogle(user) {
    const email = (user.email || '').trim().toLowerCase();
    if (!email) {
        tampilkanErrorGoogle({ code: 'auth/no-email' });
        return;
    }
    const nama = user.displayName || turunkanNamaDariEmail(email);
    // password diisi null (bukan dipakai) — akun ini login lewat Google,
    // ditandai supaya kolom sandi tidak ikut ditawarkan/diisi otomatis.
    simpanAkun({ email, password: null, viaGoogle: true });
    selesaikanLogin(email, nama, { baruLogin: true });
}
// Kalau tadi sempat dialihkan ke halaman login Google penuh (signInWithRedirect,
// dipakai sebagai cadangan saat jendela pop-up diblokir), tangkap hasilnya di
// sini begitu halaman ini dimuat ulang setelah anak memilih akunnya.
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().getRedirectResult()
        .then((result) => {
            if (result && result.user) prosesUserGoogle(result.user);
        })
        .catch((err) => {
            if (err && err.code) console.error('Login Google (redirect) gagal:', err);
        });
}
if (btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            tampilkanErrorGoogle({ code: 'auth/sdk-belum-siap' });
            return;
        }
        if (googleLoginError) googleLoginError.classList.add('hidden');
        btnGoogleLogin.disabled = true;
        // Coba "buka kunci" audio langsung di sini, selagi masih dianggap
        // gesture pengguna yang sah oleh browser — signInWithPopup di bawah
        // ini asinkron (pakai .then()), dan begitu hasilnya baru muncul
        // beberapa browser (terutama Safari) sudah tidak menganggapnya
        // sebagai gesture pengguna lagi sehingga bgMusic.play() bisa ditolak.
        putarMusikBackground();
        const provider = new firebase.auth.GoogleAuthProvider();
        // "select_account" memaksa Google selalu menampilkan jendela pilih akun
        // (bukan langsung login diam-diam ke akun terakhir) — supaya kalau HP
        // dipakai bergantian oleh beberapa anak, mereka tetap bisa memilih.
        provider.setCustomParameters({ prompt: 'select_account' });
        firebase.auth().signInWithPopup(provider)
            .then((result) => {
                prosesUserGoogle(result.user);
            })
            .catch((err) => {
                // Jendela ditutup pemakai (popup-closed-by-user) itu wajar, tidak
                // perlu dianggap "error" yang menakut-nakuti anak SMP.
                if (err && err.code === 'auth/popup-closed-by-user') return;
                console.error('Login Google (popup) gagal:', err);
                const kodePopupBermasalah = [
                    'auth/popup-blocked',
                    'auth/operation-not-supported-in-this-environment',
                    'auth/cancelled-popup-request'
                ];
                if (err && kodePopupBermasalah.includes(err.code)) {
                    // Popup gagal dibuka (umum di webview HP/aplikasi in-app) —
                    // coba lagi dengan cara alihkan halaman penuh, bukan pop-up.
                    tampilkanErrorGoogle(err);
                    firebase.auth().signInWithRedirect(provider).catch((err2) => {
                        console.error('Login Google (redirect) gagal:', err2);
                        tampilkanErrorGoogle(err2);
                    });
                    return;
                }
                tampilkanErrorGoogle(err);
            })
            .finally(() => {
                btnGoogleLogin.disabled = false;
            });
    });
}
navItems.forEach(item => {
    item.addEventListener('click', () => {
        aktifkanSection(item.dataset.target, { scroll: true });
        if (isMobileWidth()) tutupSidebar(); // di HP, menu ditutup otomatis setelah memilih
    });
});
function isMobileWidth() {
    return window.innerWidth <= 768;
}
function bukaSidebar() {
    if (isMobileWidth()) {
        sidebar.classList.add('sidebar-open');
        sidebarOverlay.classList.add('active');
    } else {
        sidebar.classList.remove('sidebar-collapsed');
    }
}
function tutupSidebar() {
    if (isMobileWidth()) {
        sidebar.classList.remove('sidebar-open');
        sidebarOverlay.classList.remove('active');
    } else {
        sidebar.classList.add('sidebar-collapsed');
    }
}
function sidebarSedangTerbuka() {
    return isMobileWidth()
        ? sidebar.classList.contains('sidebar-open')
        : !sidebar.classList.contains('sidebar-collapsed');
}
function toggleSidebar() {
    if (sidebarSedangTerbuka()) {
        tutupSidebar();
    } else {
        bukaSidebar();
    }
}
if (btnMenuToggle) btnMenuToggle.addEventListener('click', toggleSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', tutupSidebar);
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    const sidebarTerbuka = sidebar.classList.contains('sidebar-open');
    if (!sidebarTerbuka && touchStartX < 24 && deltaX > 60) {
        bukaSidebar();
    }
    if (sidebarTerbuka && deltaX < -60) {
        tutupSidebar();
    }
}, { passive: true });
function jalankanLogout() {
    akhiriSesiPengunjung();
    emailAktif = null;
    hapusSesiAktif();
    dashboardPage.classList.add('hidden');
    landingPage.classList.remove('hidden');
    formData.reset();
    aktifkanSection('dashboard', { scroll: true });
    if (typeof window.refreshGameAkun === 'function') window.refreshGameAkun();
}
const panelKonfirmasiLogoutOverlay = document.getElementById('panelKonfirmasiLogoutOverlay');
const btnKonfirmasiLogout = document.getElementById('btnKonfirmasiLogout');
const btnBatalLogout = document.getElementById('btnBatalLogout');
if (panelKonfirmasiLogoutOverlay && btnKonfirmasiLogout && btnBatalLogout) {
    btnLogout.addEventListener('click', () => {
        // Klik tombol Logout TIDAK langsung keluar — tampilkan konfirmasi dulu,
        // supaya tidak ke-logout tidak sengaja (misal kesenggol pas main game).
        bukaPanelOverlay(panelKonfirmasiLogoutOverlay);
    });
    btnKonfirmasiLogout.addEventListener('click', () => {
        tutupPanelOverlay(panelKonfirmasiLogoutOverlay);
        jalankanLogout();
    });
    btnBatalLogout.addEventListener('click', () => {
        tutupPanelOverlay(panelKonfirmasiLogoutOverlay);
    });
} else {
    // fallback kalau markup overlay belum ada, supaya tombol tetap berfungsi
    btnLogout.addEventListener('click', jalankanLogout);
}
function bukaMenuUtama(targetId) {
    aktifkanSection(targetId, { scroll: true });
}
document.querySelectorAll('.dash-feature-card').forEach(card => {
    card.addEventListener('click', () => bukaMenuUtama(card.dataset.target));
});
on('topbarPet', 'click', () => bukaMenuUtama('game'));
on('btnMulaiBelajarDashboard', 'click', () => bukaMenuUtama('materi'));
on('btnMulaiBelajarRefleksi', 'click', () => bukaMenuUtama('materi'));
const kalkulatorProgress = document.getElementById('kalkulatorProgress');
const progressSteps = document.querySelectorAll('.progress-step');
const kalkulatorStep1 = document.getElementById('kalkulatorStep1');
const kalkulatorStep2 = document.getElementById('kalkulatorStep2');
const kalkulatorStep3 = document.getElementById('kalkulatorStep3');
const kalkulatorStep4 = document.getElementById('kalkulatorStep4');
const btnGenderOptions = document.querySelectorAll('.btn-gender');
const formDataDiri = document.getElementById('formDataDiri');
const errorDataDiri = document.getElementById('errorDataDiri');
const activityCards = document.querySelectorAll('.activity-card');
const errorAktivitas = document.getElementById('errorAktivitas');
const btnHitungKebutuhan = document.getElementById('btnHitungKebutuhan');
const hasilTdee = document.getElementById('hasilTdee');
const gulaWho = document.getElementById('gulaWho');
const gulaWhoSendok = document.getElementById('gulaWhoSendok');
const gulaTarget = document.getElementById('gulaTarget');
const gulaTargetSendok = document.getElementById('gulaTargetSendok');
const gulaBarFill = document.getElementById('gulaBarFill');
const penjelasanGula = document.getElementById('penjelasanGula');
const hasilImt = document.getElementById('hasilImt');
const hasilImtKategori = document.getElementById('hasilImtKategori');
const hasilImtRemajaBox = document.getElementById('hasilImtRemajaBox');
const hasilKarbo = document.getElementById('hasilKarbo');
const karboPorsiNasi = document.getElementById('karboPorsiNasi');
let kalkulatorGender = null;
let selectedFactor = null;
let tdeeTersimpan = null; // dipakai untuk tahap hitung batas gula selanjutnya
let batasGulaWho = null;
let batasGulaTarget = null;
function tampilkanProgress(stepAktif) {
    if (stepAktif === 1) {
        kalkulatorProgress.classList.add('hidden');
        return;
    }
    kalkulatorProgress.classList.remove('hidden');
    progressSteps.forEach(el => {
        const stepEl = parseInt(el.dataset.progress, 10);
        el.classList.toggle('progress-step-active', stepEl === stepAktif);
        el.classList.toggle('progress-step-done', stepEl < stepAktif);
    });
}
function pindahStep(stepAktif) {
    [kalkulatorStep1, kalkulatorStep2, kalkulatorStep3, kalkulatorStep4].forEach(el => el.classList.add('hidden'));
    const stepElements = { 1: kalkulatorStep1, 2: kalkulatorStep2, 3: kalkulatorStep3, 4: kalkulatorStep4 };
    stepElements[stepAktif].classList.remove('hidden');
    tampilkanProgress(stepAktif);
    resetScrollKeAtas();
}
function tampilkanError(elError, pesan) {
    elError.textContent = pesan;
    elError.classList.remove('hidden');
}
btnGenderOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        btnGenderOptions.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        kalkulatorGender = btn.dataset.gender;
        if (kalkulatorGender === 'Laki-laki' || kalkulatorGender === 'Perempuan') {
            pindahStep(2);
        }
    });
});
formDataDiri.addEventListener('submit', function (e) {
    e.preventDefault();
    const beratBadan = parseFloat(document.getElementById('beratBadan').value);
    const tinggiBadan = parseFloat(document.getElementById('tinggiBadan').value);
    const usia = parseFloat(document.getElementById('usia').value);
    if (isNaN(beratBadan) || beratBadan <= 0) {
        tampilkanError(errorDataDiri, 'Yuk, isi berat badanmu terlebih dahulu.');
        return;
    }
    if (isNaN(tinggiBadan) || tinggiBadan <= 0) {
        tampilkanError(errorDataDiri, 'Yuk, isi tinggi badanmu terlebih dahulu.');
        return;
    }
    if (isNaN(usia) || usia <= 0 || usia > 120) {
        tampilkanError(errorDataDiri, 'Yuk, isi usiamu dengan angka yang wajar.');
        return;
    }
    errorDataDiri.classList.add('hidden');
    pindahStep(3);
});
on('btnKembaliGender', 'click', () => {
    errorDataDiri.classList.add('hidden');
    btnGenderOptions.forEach(b => b.classList.remove('selected'));
    kalkulatorGender = null;
    pindahStep(1);
});
activityCards.forEach(card => {
    card.addEventListener('click', () => {
        activityCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedFactor = parseFloat(card.dataset.factor);
        errorAktivitas.classList.add('hidden');
    });
});
btnHitungKebutuhan.addEventListener('click', () => {
    if (selectedFactor === null) {
        tampilkanError(errorAktivitas, 'Yuk pilih dulu tingkat aktivitas fisikmu.');
        return;
    }
    const beratBadan = parseFloat(document.getElementById('beratBadan').value);
    const tinggiBadan = parseFloat(document.getElementById('tinggiBadan').value);
    const usia = parseFloat(document.getElementById('usia').value);
    let bmr;
    if (kalkulatorGender === 'Perempuan') {
        bmr = (10 * beratBadan) + (6.25 * tinggiBadan) - (5 * usia) - 161;
    } else {
        bmr = (10 * beratBadan) + (6.25 * tinggiBadan) - (5 * usia) + 5;
    }
    const tdee = bmr * selectedFactor;
    tdeeTersimpan = Math.round(tdee);
    const energiWho = tdeeTersimpan * 0.10;
    const gramWho = energiWho / 4;
    const energiTarget = tdeeTersimpan * 0.05;
    const gramTarget = energiTarget / 4;
    batasGulaWho = Math.round(gramWho);
    batasGulaTarget = Math.round(gramTarget);
    const sendokWho = gramWho / 4;
    const sendokTarget = gramTarget / 4;
    // IMT (Indeks Massa Tubuh) — rumus WHO: berat badan (kg) / [tinggi badan (m)]^2
    const tinggiMeter = tinggiBadan / 100;
    const imt = beratBadan / (tinggiMeter * tinggiMeter);
    const kategoriImt = tentukanKategoriImt(imt);
    // Kebutuhan karbohidrat — AMDR WHO / AKG Kemenkes RI: 45–65% dari energi harian, 1 gram karbohidrat = 4 kkal
    const karboMin = Math.round((tdeeTersimpan * 0.45) / 4);
    const karboMax = Math.round((tdeeTersimpan * 0.65) / 4);
    hasilTdee.textContent = `${tdeeTersimpan.toLocaleString('id-ID')} kkal/hari`;
    gulaWho.textContent = `${batasGulaWho.toLocaleString('id-ID')} gram/hari`;
    gulaWhoSendok.textContent = `≈ ${formatSendok(sendokWho)} sendok teh`;
    gulaTarget.textContent = `< ${batasGulaTarget.toLocaleString('id-ID')} gram/hari`;
    gulaTargetSendok.textContent = `(≈ ${formatSendok(sendokTarget)} sendok teh)`;
    hasilImt.textContent = imt.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    hasilImtKategori.textContent = kategoriImt.label;
    hasilImtKategori.className = `hasil-card-kategori ${kategoriImt.kelas}`;
    // Standar WHO: remaja = usia 10–19 tahun. Untuk rentang ini, tampilkan
    // kartu referensi IMT/U (bukan kategori IMT dewasa) sebagai konteks tambahan.
    if (hasilImtRemajaBox) {
        hasilImtRemajaBox.classList.toggle('hidden', !(usia >= 10 && usia <= 19));
    }
    hasilKarbo.textContent = `${karboMin.toLocaleString('id-ID')}–${karboMax.toLocaleString('id-ID')} gram/hari`;
    // Konversi ke porsi nasi berdasarkan Daftar Bahan Makanan Penukar (DBMP): 1 porsi nasi (100 g) ≈ 40 gram karbohidrat
    const porsiNasiMin = karboMin / 40;
    const porsiNasiMax = karboMax / 40;
    karboPorsiNasi.textContent = `≈ ${formatSendok(porsiNasiMin)}–${formatSendok(porsiNasiMax)} porsi nasi (100 g) per hari`;
    const skalaMaksimal = 80;
    const persenBar = Math.min(100, Math.max(4, (batasGulaWho / skalaMaksimal) * 100));
    gulaBarFill.style.width = `${persenBar}%`;
    pindahStep(4);
});
function tentukanKategoriImt(imt) {
    if (imt < 18.5) return { label: 'Berat Badan Kurang', kelas: 'kategori-kurus' };
    if (imt < 25) return { label: 'Berat Badan Normal', kelas: 'kategori-normal' };
    if (imt < 30) return { label: 'Berat Badan Berlebih', kelas: 'kategori-berlebih' };
    return { label: 'Obesitas', kelas: 'kategori-obesitas' };
}
function formatSendok(nilai) {
    const bulat = Math.floor(nilai);
    const sisa = nilai - bulat;
    if (sisa >= 0.25 && sisa < 0.75) {
        return `${bulat}½`;
    } else if (sisa >= 0.75) {
        return `${bulat + 1}`;
    }
    return `${bulat}`;
}
on('btnLihatPenjelasan', 'click', () => penjelasanGula.classList.toggle('hidden'));
on('btnTipsSehat', 'click', () => bukaMenuUtama('tips'));
on('btnRemajaMateri', 'click', () => bukaMenuUtama('materiKebiasaanRemaja'));
on('btnLanjutBelajar', 'click', () => bukaMenuUtama('materi'));
on('btnHitungUlang', 'click', () => resetKalkulator());
function resetKalkulator() {
    kalkulatorGender = null;
    selectedFactor = null;
    tdeeTersimpan = null;
    batasGulaWho = null;
    batasGulaTarget = null;
    formDataDiri.reset();
    activityCards.forEach(c => c.classList.remove('selected'));
    btnGenderOptions.forEach(b => b.classList.remove('selected'));
    errorDataDiri.classList.add('hidden');
    errorDataDiri.textContent = '';
    errorAktivitas.classList.add('hidden');
    errorAktivitas.textContent = '';
    hasilTdee.textContent = '0 kkal/hari';
    gulaWho.textContent = '0 gram/hari';
    gulaWhoSendok.textContent = '≈ 0 sendok teh';
    gulaTarget.textContent = '< 0 gram/hari';
    gulaTargetSendok.textContent = '(≈ 0 sendok teh)';
    gulaBarFill.style.width = '0%';
    karboPorsiNasi.textContent = '≈ 0–0 porsi nasi (100 g) per hari';
    penjelasanGula.classList.add('hidden');
    pindahStep(1);
}
document.querySelectorAll('.tips-card').forEach(card => {
    card.addEventListener('click', () => bukaDetailTips(card.dataset.tip));
});
on('btnMulaiSekarang', 'click', () => bukaDetailTips('menu-sehat'));
on('btnKembaliTipsMenuSehat', 'click', () => bukaTipsUtama());
on('btnSelanjutnyaCekLabel', 'click', () => bukaDetailTips('cek-label'));
on('btnKembaliTipsCekLabel', 'click', () => bukaTipsUtama());
on('btnSelanjutnyaBatasiGula', 'click', () => bukaDetailTips('batasi-gula'));
on('btnKembaliTipsBatasiGula', 'click', () => bukaTipsUtama());
on('btnSelanjutnyaCamilanBekalSehat', 'click', () => bukaDetailTips('camilan-bekal-sehat'));
on('btnKembaliTipsCamilanBekalSehat', 'click', () => bukaTipsUtama());
on('btnSelanjutnyaAktifBergerak', 'click', () => bukaDetailTips('aktif-bergerak'));
on('btnKembaliTipsAktifBergerak', 'click', () => bukaTipsUtama());
on('btnSelanjutnyaKurangiScreenTime', 'click', () => bukaDetailTips('kurangi-screen-time'));
on('btnKembaliTipsKurangiScreenTime', 'click', () => bukaTipsUtama());
function bukaDetailTips(idTips) {
    const petaDetail = {
        'menu-sehat': 'tipsMenuSehat',
        'cek-label': 'tipsCekLabel',
        'batasi-gula': 'tipsBatasiGula',
        'camilan-bekal-sehat': 'tipsCamilanBekalSehat',
        'aktif-bergerak': 'tipsAktifBergerak',
        'kurangi-screen-time': 'tipsKurangiScreenTime'
    };
    const targetId = petaDetail[idTips];
    if (!targetId) {
        return;
    }
    aktifkanSection(targetId, { scroll: true });
}
function bukaTipsUtama() {
    aktifkanSection('tips', { scroll: true });
}
function setupKuisPilihan(buttons, feedbackEl, isBenarFn, teksFeedback) {
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                b.classList.remove('selected-benar', 'selected-salah');
                b.disabled = true;
            });
            const benar = isBenarFn(btn);
            btn.classList.add(benar ? 'selected-benar' : 'selected-salah');
            const simbol = benar ? '✓' : '✕';
            const teks = typeof teksFeedback === 'function' ? teksFeedback(benar) : teksFeedback;
            feedbackEl.textContent = `${simbol} ${teks}`;
            feedbackEl.classList.toggle('quiz-feedback-salah', !benar);
            feedbackEl.classList.remove('hidden');
        });
    });
}
function setupTantangan(btnId, feedbackId, teksSetelahKlik) {
    on(btnId, 'click', function () {
        this.textContent = teksSetelahKlik;
        this.disabled = true;
        document.getElementById(feedbackId).classList.remove('hidden');
    });
}
setupKuisPilihan(
    document.querySelectorAll('.quiz-btn'),
    document.getElementById('quizFeedback'),
    btn => btn.dataset.jawaban === 'Tidak',
    benar => benar
        ? 'Benar! Karena satu kemasan terdiri dari 2 sajian, jumlah gula dari seluruh kemasan adalah 24 gram.'
        : 'Bukan 12 gram ya. Karena satu kemasan terdiri dari 2 sajian, jumlah gula dari seluruh kemasan adalah 24 gram.'
);
document.querySelectorAll('.mitos-card').forEach(card => {
    card.addEventListener('click', () => {
        const jawabanEl = card.querySelector('.mitos-jawaban');
        const sudahTerbuka = !jawabanEl.classList.contains('hidden');
        if (sudahTerbuka) {
            jawabanEl.classList.add('hidden');
            return;
        }
        const jawaban = card.dataset.jawaban;
        const penjelasan = card.dataset.penjelasan;
        const simbol = jawaban === 'FAKTA' ? '✅ FAKTA' : '❌ MITOS';
        jawabanEl.textContent = `${simbol} — ${penjelasan}`;
        jawabanEl.classList.remove('hidden');
    });
});
setupTantangan('btnChallenge', 'challengeFeedback', '✅ Saya Akan Mencoba');
on('btnKembaliTips', 'click', () => bukaTipsUtama());
document.querySelectorAll('.pilihan-pair').forEach(pair => {
    const tombolPasangan = pair.querySelectorAll('.pilihan-btn');
    const feedbackEl = pair.querySelector('.pilihan-feedback');
    const pesan = pair.dataset.pesan;
    tombolPasangan.forEach(btn => {
        btn.addEventListener('click', () => {
            feedbackEl.textContent = pesan;
            feedbackEl.classList.remove('hidden');
        });
    });
});
setupKuisPilihan(
    document.querySelectorAll('.quiz-sajian-btn'),
    document.getElementById('sajianFeedback'),
    btn => btn.dataset.jawaban === '2',
    benar => benar
        ? 'Benar! Satu kemasan memiliki 2 sajian. Karena itu, penting untuk melihat jumlah sajian per kemasan, bukan hanya angka per sajian.'
        : 'Bukan itu jawabannya. Satu kemasan memiliki 2 sajian, jadi penting melihat jumlah sajian per kemasan, bukan hanya angka per sajian.'
);
document.querySelectorAll('.materi-card').forEach(card => {
    card.addEventListener('click', () => bukaMateri(card.dataset.materi));
});
function bukaMateri(idMateri) {
    const petaMateri = {
        'kenali-diabetes-melitus-tipe-2': 'materiDiabetesTipe2',
        'mengenal-gula': 'materiMengenalGula',
        'gula-dan-kesehatan': 'materiGulaKesehatan',
        'batas-gula-label': 'materiBatasGulaLabel',
        'aktivitas-fisik-dmt2': 'materiAktivitasFisikDMT2',
        'kebiasaan-makan-remaja': 'materiKebiasaanRemaja'
    };
    const targetId = petaMateri[idMateri];
    if (!targetId) {
        return;
    }
    bukaMenuUtama(targetId);
}
document.querySelectorAll('.related-card').forEach(card => {
    card.addEventListener('click', () => bukaMenuUtama(card.dataset.target));
});
on('btnKembaliMateriRemaja', 'click', () => bukaMenuUtama('materi'));
document.querySelectorAll('.breadcrumb-link[data-breadcrumb-target]').forEach(link => {
    link.addEventListener('click', () => bukaMenuUtama(link.dataset.breadcrumbTarget));
});
document.querySelectorAll('.breadcrumb-link[data-breadcrumb-tips]').forEach(link => {
    link.addEventListener('click', () => bukaTipsUtama());
});
on('btnCtaTipsDariMateri', 'click', () => bukaTipsUtama());
on('btnCtaMateriDariTips', 'click', () => bukaMenuUtama('materiKebiasaanRemaja'));
on('btnKembaliAtasMateriKesehatan', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliBawahMateriKesehatan', 'click', () => bukaMenuUtama('materi'));
on('btnMateriKesehatanNext', 'click', () => bukaMateri('batas-gula-label'));
on('btnMateriKesehatanPrev', 'click', () => bukaMateri('mengenal-gula'));
setupTantangan('btnChallengeMateriKesehatan', 'challengeFeedbackMateriKesehatan', '✅ Sudah dicoba!');
on('btnKembaliAtasMateriGula', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliBawahMateriGula', 'click', () => bukaMenuUtama('materi'));
on('btnMateriGulaNext', 'click', () => bukaMateri('aktivitas-fisik-dmt2'));
on('btnMateriGulaPrev', 'click', () => bukaMateri('gula-dan-kesehatan'));
setupTantangan('btnChallengeMateriGula', 'challengeFeedbackMateriGula', '✅ Sudah dicoba!');
on('btnKembaliAtasMateriAktivitasFisik', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliBawahMateriAktivitasFisik', 'click', () => bukaMenuUtama('materi'));
on('btnMateriAktivitasFisikNext', 'click', () => bukaMateri('kebiasaan-makan-remaja'));
on('btnMateriAktivitasFisikPrev', 'click', () => bukaMateri('batas-gula-label'));
setupTantangan('btnChallengeAktivitasFisik', 'challengeFeedbackAktivitasFisik', '✅ Mantap!');
on('btnKembaliAtasMateriDiabetes', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliBawahMateriDiabetes', 'click', () => bukaMenuUtama('materi'));
on('btnMateriDiabetesNext', 'click', () => bukaMateri('mengenal-gula'));
setupTantangan('btnChallengeMateriDiabetes', 'challengeFeedbackMateriDiabetes', '✅ Sudah dicoba!');
on('btnKembaliAtasMateriMengenal', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliBawahMateriMengenal', 'click', () => bukaMenuUtama('materi'));
on('btnMateriMengenalNext', 'click', () => bukaMateri('gula-dan-kesehatan'));
on('btnMateriMengenalPrev', 'click', () => bukaMateri('kenali-diabetes-melitus-tipe-2'));
setupTantangan('btnChallengeMateriMengenal', 'challengeFeedbackMateriMengenal', '✅ Sudah dicoba!');
on('btnKembaliBawahMateriRemaja', 'click', () => bukaMenuUtama('materi'));
on('btnMateriRemajaPrev', 'click', () => bukaMateri('aktivitas-fisik-dmt2'));
setupTantangan('btnChallengeMateriRemaja', 'challengeFeedbackMateriRemaja', '✅ Sudah dicoba!');
function setupPanelChip(chipsId, placeholderId, contentId, dataMap, datasetKey, fields) {
    const chipsEl = document.getElementById(chipsId);
    if (!chipsEl) return;
    const placeholderEl = document.getElementById(placeholderId);
    const contentEl = document.getElementById(contentId);
    chipsEl.querySelectorAll('.sm-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const data = dataMap[chip.dataset[datasetKey]];
            if (!data) return;
            const sudahAktif = chip.classList.contains('sm-chip-active');
            chipsEl.querySelectorAll('.sm-chip').forEach((c) => c.classList.remove('sm-chip-active'));
            if (sudahAktif) {
                contentEl.classList.add('hidden');
                placeholderEl.classList.remove('hidden');
                return;
            }
            chip.classList.add('sm-chip-active');
            fields.forEach(([elId, dataKey, transform]) => {
                document.getElementById(elId).textContent = transform ? transform(data[dataKey]) : data[dataKey];
            });
            placeholderEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
        });
    });
}
on('btnKembaliDashboardGame', 'click', () => bukaMenuUtama('dashboard'));
on('btnKembaliDashboardMateri', 'click', () => bukaMenuUtama('dashboard'));
on('btnKembaliDashboardKalkulator', 'click', () => bukaMenuUtama('dashboard'));
on('btnKembaliDashboardTips', 'click', () => bukaMenuUtama('dashboard'));
on('btnKembaliDashboardTentang', 'click', () => bukaMenuUtama('dashboard'));
on('btnKembaliDashboardReferensi', 'click', () => bukaMenuUtama('dashboard'));
const revealTargets = document.querySelectorAll([
    '.detail-block',
    '.dash-feature-card',
    '.reason-card',
    '.hasil-card-besar',
    '.sm-category-card',
    '.sm-compare-col',
    '.closing-card'
].join(', '));
if ('IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(el => el.classList.add('reveal'));
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
}
function lompatKeAtasInstan() {
    // Pakai opsi behavior:'instant' supaya lompatan ke atas TIDAK mengikuti
    // CSS `scroll-behavior: smooth` pada <html> (yang bikin transisi geser
    // pelan-pelan dan mudah terputus saat pindah halaman lagi). Dibungkus
    // try/catch untuk browser lama yang belum kenal object argumen ini.
    try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch (e) {
        window.scrollTo(0, 0);
    }
    // Jaga-jaga untuk browser/versi lama (mis. Safari lawas) yang masih
    // membaca posisi scroll dari documentElement/body, bukan window.
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}
function resetScrollKeAtas() {
    lompatKeAtasInstan();
    // Panggil sekali lagi setelah frame render berikutnya — supaya kalau
    // saat lompatan pertama tinggi halaman baru belum selesai dihitung
    // (mis. karena section baru saja ditampilkan), posisi scroll tetap
    // dipaksa ke atas setelah layout-nya benar-benar final.
    requestAnimationFrame(lompatKeAtasInstan);
}
function munculkanSection(target, scroll) {
    target.classList.add('active');
    if (scroll) resetScrollKeAtas();
    void target.offsetWidth; // paksa reflow supaya transisi bisa terpicu ulang
    requestAnimationFrame(() => {
        target.classList.add('section-show');
        aturTinggiStickyHeader();
    });
}
function tampilkanSection(target, scroll) {
    const current = document.querySelector('.content-section.active');
    if (current === target) {
        if (scroll) resetScrollKeAtas();
        return;
    }
    if (!current) {
        munculkanSection(target, scroll);
        return;
    }
    current.classList.remove('section-show');
    window.setTimeout(() => {
        current.classList.remove('active');
        munculkanSection(target, scroll);
    }, 160);
}
function aktifkanSection(targetId, { scroll = false } = {}) {
    const target = document.getElementById(targetId);
    if (!target) return null;
    let navItem = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (!navItem) {
        navItems.forEach(nav => {
            if (targetId.startsWith(nav.dataset.target)) navItem = nav;
        });
    }
    navItems.forEach(nav => nav.classList.remove('active'));
    if (navItem) navItem.classList.add('active');
    pindahkanIndikatorNav(navItem);
    tampilkanSection(target, scroll);
    return target;
}
const navIndicator = document.getElementById('navIndicator');
function pindahkanIndikatorNav(navItem, animasi = true) {
    if (!navIndicator || !navItem) return;
    if (!animasi) navIndicator.style.transition = 'none';
    navIndicator.style.transform = `translateY(${navItem.offsetTop}px)`;
    navIndicator.style.height = `${navItem.offsetHeight}px`;
    if (!animasi) {
        void navIndicator.offsetWidth; // paksa reflow sebelum transisi diaktifkan kembali
        navIndicator.style.transition = '';
    }
}
pindahkanIndikatorNav(document.querySelector('.nav-item.active'), false);
window.addEventListener('resize', () => {
    pindahkanIndikatorNav(document.querySelector('.nav-item.active'), false);
});
const elTopbar = document.querySelector('.topbar');
function aturTinggiStickyHeader() {
    if (!elTopbar) return;
    const tinggiTopbar = elTopbar.offsetHeight;
    document.documentElement.style.setProperty('--top-breadcrumb', `${tinggiTopbar}px`);
    const breadcrumbAktif = document.querySelector('.content-section.active .breadcrumb');
    if (breadcrumbAktif) {
        const tinggiBreadcrumb = breadcrumbAktif.offsetHeight;
        const tinggiSejauhBreadcrumb = tinggiTopbar + tinggiBreadcrumb;
        document.documentElement.style.setProperty('--top-kembali', `${tinggiSejauhBreadcrumb}px`);
        const kembaliAktif = breadcrumbAktif.nextElementSibling;
        const tinggiKembali = kembaliAktif ? kembaliAktif.offsetHeight : 0;
        document.documentElement.style.setProperty('--top-setelah-kembali', `${tinggiSejauhBreadcrumb + tinggiKembali}px`);
    }
}
window.addEventListener('load', aturTinggiStickyHeader);
window.addEventListener('resize', aturTinggiStickyHeader);
aturTinggiStickyHeader();
let sesiPengunjungRef = null;
let waktuMulaiSesi = null;
let intervalHeartbeatSesi = null;
function catatLoginPengunjung(email, nama) {
    if (typeof db === 'undefined') return; // Firebase belum/gagal dimuat (mis. tidak ada internet)
    const refPengunjung = db.collection('pengunjung').doc(email);
    // Disederhanakan dari yang sebelumnya: baca dulu (get) buat cek dokumen
    // sudah ada atau belum -> baru tulis data pengunjung -> baru tulis sesi
    // login, semua berurutan (1 baca + 2 tulis, saling nunggu satu sama lain).
    //
    // Sekarang: langsung coba UPDATE tanpa baca dulu. Kalau dokumennya sudah
    // ada (kasus paling sering terjadi -- pengguna yang sudah pernah login
    // sebelumnya), ini cukup 1 kali tulis, TANPA baca sama sekali. Update()
    // otomatis gagal dengan kode 'not-found' kalau dokumennya belum ada
    // (login pertama kali) -- baru di situ kita SET dokumen barunya sebagai
    // fallback. Jadi buat mayoritas login sehari-hari, operasinya turun dari
    // 1 baca + 1 tulis jadi cuma 1 tulis saja.
    const updatePengunjung = refPengunjung.update({
        nama,
        loginTerakhir: firebase.firestore.FieldValue.serverTimestamp(),
        jumlahLogin: firebase.firestore.FieldValue.increment(1)
    }).catch(err => {
        if (err.code === 'not-found') {
            return refPengunjung.set({
                email,
                nama,
                loginPertama: firebase.firestore.FieldValue.serverTimestamp(),
                loginTerakhir: firebase.firestore.FieldValue.serverTimestamp(),
                jumlahLogin: 1
            }, { merge: true });
        }
        throw err;
    });
    // Menambah dokumen sesi login TIDAK perlu menunggu dokumen "pengunjung"
    // di atas selesai lebih dulu -- subcollection di Firestore tidak
    // mensyaratkan dokumen induknya sudah ada -- jadi dijalankan BARENGAN
    // (paralel) dengan updatePengunjung di atas, bukan berurutan. Ini
    // mempercepat proses login & lebih tahan kalau salah satu request
    // sempat lambat.
    const tambahSesiLogin = refPengunjung.collection('sesiLogin').add({
        waktuMasuk: firebase.firestore.FieldValue.serverTimestamp(),
        durasiDetik: 0
    });
    Promise.all([updatePengunjung, tambahSesiLogin])
        .then(([, docRefSesi]) => {
            sesiPengunjungRef = docRefSesi;
            waktuMulaiSesi = Date.now();
            mulaiHeartbeatSesi();
        })
        .catch(err => console.warn('Gagal mencatat data pengunjung:', err));
}
function mulaiHeartbeatSesi() {
    hentikanHeartbeatSesi();
    // Interval heartbeat diperlonggar dari 20 detik jadi 60 detik supaya
    // penulisan ke Firestore lebih jarang (hemat kuota harian), terutama
    // pas banyak siswa main bersamaan. Ini cuma menurunkan presisi
    // pencatatan durasi sesi (jadi per menit, bukan per 20 detik) —
    // tidak berpengaruh ke tampilan/kecepatan yang dirasakan pengguna.
    intervalHeartbeatSesi = window.setInterval(perbaruiDurasiSesi, 60000);
}
function hentikanHeartbeatSesi() {
    if (intervalHeartbeatSesi) window.clearInterval(intervalHeartbeatSesi);
    intervalHeartbeatSesi = null;
}
function perbaruiDurasiSesi() {
    if (!sesiPengunjungRef || !waktuMulaiSesi) return;
    const durasiDetik = Math.round((Date.now() - waktuMulaiSesi) / 1000);
    sesiPengunjungRef.update({
        durasiDetik,
        waktuKeluar: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});
}
function akhiriSesiPengunjung() {
    perbaruiDurasiSesi();
    hentikanHeartbeatSesi();
    sesiPengunjungRef = null;
    waktuMulaiSesi = null;
}
// Pause heartbeat saat tab tidak sedang dilihat (pindah tab lain / minimize
// / kunci layar HP), lanjut lagi otomatis begitu tab dibuka/dilihat lagi.
// Ini ngirit penulisan ke Firestore, soalnya banyak siswa yang tab web ini
// tetap kebuka di background sambil mereka aktif di tab/app lain — heartbeat
// yang tetap jalan di kondisi itu cuma buang-buang kuota harian tanpa guna.
document.addEventListener('visibilitychange', () => {
    if (!sesiPengunjungRef) return; // belum ada sesi login aktif, tidak perlu diapa-apakan
    if (document.visibilityState === 'hidden') {
        perbaruiDurasiSesi(); // simpan durasi terakhir dulu sebelum heartbeat dihentikan
        hentikanHeartbeatSesi();
    } else if (document.visibilityState === 'visible') {
        mulaiHeartbeatSesi();
    }
});
window.addEventListener('beforeunload', akhiriSesiPengunjung);
window.addEventListener('pagehide', akhiriSesiPengunjung);
(function () {
    const formKritikSaran = document.getElementById('formKritikSaran');
    if (!formKritikSaran) return; // section Tentang belum/tidak ada di dokumen ini
    const ksPesan = document.getElementById('ksPesan');
    const ksError = document.getElementById('ksError');
    const ksSukses = document.getElementById('ksSukses');
    const btnKirimKs = document.getElementById('btnKirimKs');
    // Jeda minimal antar pengiriman kritik/saran dari device yang sama, supaya
    // form ini tidak bisa disalahgunakan buat spam kirim berkali-kali yang
    // menghabiskan kuota tulis Firestore harian secara percuma.
    const KUNCI_KS_TERAKHIR_KIRIM = 'sobatSehatKsTerakhirKirim';
    const JEDA_KIRIM_KS_MS = 30000; // 30 detik
    formKritikSaran.addEventListener('submit', function (e) {
        e.preventDefault();
        ksError.classList.add('hidden');
        ksSukses.classList.add('hidden');
        const pesan = ksPesan.value.trim();
        if (!pesan) {
            ksError.textContent = 'Mohon isi kritik/saran terlebih dahulu.';
            ksError.classList.remove('hidden');
            return;
        }
        const terakhirKirim = Number(localStorage.getItem(KUNCI_KS_TERAKHIR_KIRIM)) || 0;
        const sisaJeda = JEDA_KIRIM_KS_MS - (Date.now() - terakhirKirim);
        if (sisaJeda > 0) {
            ksError.textContent = `Mohon tunggu ${Math.ceil(sisaJeda / 1000)} detik lagi sebelum mengirim kritik/saran berikutnya.`;
            ksError.classList.remove('hidden');
            return;
        }
        if (typeof db === 'undefined') {
            ksError.textContent = 'Gagal terhubung ke server. Periksa koneksi internetmu lalu coba lagi.';
            ksError.classList.remove('hidden');
            return;
        }
        // Nama & email diambil otomatis dari akun yang sedang login (tidak ditampilkan di form)
        const email = emailAktif || 'tidak diketahui';
        const nama = emailAktif ? turunkanNamaDariEmail(emailAktif) : 'Pengunjung';
        btnKirimKs.disabled = true;
        btnKirimKs.textContent = 'MENGIRIM...';
        db.collection('kritikSaran').add({
            nama,
            email,
            pesan,
            waktu: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            localStorage.setItem(KUNCI_KS_TERAKHIR_KIRIM, String(Date.now()));
            ksSukses.classList.remove('hidden');
            ksPesan.value = '';
        }).catch(err => {
            console.warn('Gagal mengirim kritik & saran:', err);
            ksError.textContent = 'Gagal mengirim kritik/saran. Silakan coba lagi.';
            ksError.classList.remove('hidden');
        }).finally(() => {
            btnKirimKs.disabled = false;
            btnKirimKs.textContent = 'KIRIM KRITIK & SARAN';
        });
    });
})();
(function () {
    const papanGrid = document.getElementById('papanGrid');
    if (!papanGrid) return; // halaman Game belum dibuka/tidak ada di dokumen ini
    const elPoin = document.getElementById('gamePoin');
    const elLap = document.getElementById('gameLap');
    const elSkorTertinggi = document.getElementById('gameSkorTertinggi');
    const elStreakKuisItem = document.getElementById('gameStreakKuisItem');
    const elStreakKuisNilai = document.getElementById('gameStreakKuisNilai');
    const elStreakKuisFill = document.getElementById('gameStreakKuisFill');
    const elDadu = document.getElementById('papanDadu');
    const btnKocok = document.getElementById('btnKocokDadu');
    const btnResetGame = document.getElementById('btnResetGame');
    const overlayEvent = document.getElementById('panelEventOverlay');
    const elEventIkon = document.getElementById('eventIkon');
    const elEventJudul = document.getElementById('eventJudul');
    const elEventTeks = document.getElementById('eventTeks');
    const elEventOpsiList = document.getElementById('eventOpsiList');
    const elEventFeedback = document.getElementById('eventFeedback');
    const btnLanjutEvent = document.getElementById('btnLanjutEvent');
    let timerJedaLanjut = null;
    const btnAturanMain = document.getElementById('btnAturanMain');
    const panelAturanOverlay = document.getElementById('panelAturanOverlay');
    const btnTutupAturan = document.getElementById('btnTutupAturan');
    if (btnAturanMain && panelAturanOverlay && btnTutupAturan) {
        btnAturanMain.addEventListener('click', () => bukaPanelOverlay(panelAturanOverlay));
        btnTutupAturan.addEventListener('click', () => tutupPanelOverlay(panelAturanOverlay));
    }
    const btnAbsenHarian = document.getElementById('btnAbsenHarian');
    const elAbsenDesc = document.getElementById('absenDesc');
    const elAbsenStreak = document.getElementById('absenStreak');
    const elAbsenTabung = document.getElementById('absenTabung');
    const elAbsenTabungFill = document.getElementById('absenTabungFill');
    const elAbsenTabungLabel = document.getElementById('absenTabungLabel');
    const btnAbsenInfo = document.getElementById('btnAbsenInfo');
    const panelAbsenInfoOverlay = document.getElementById('panelAbsenInfoOverlay');
    const btnTutupAbsenInfo = document.getElementById('btnTutupAbsenInfo');
    const absenTierList = document.getElementById('absenTierList');
    const btnAktifkanNotifikasi = document.getElementById('btnAktifkanNotifikasi');
    const elNotifAbsenStatus = document.getElementById('notifAbsenStatus');
    // ===== Fakta Sehat Sebelum Absen — muncul tiap kali tombol "Absen Sekarang"
    // ditekan, supaya siswa yang cuma masuk buat jaga api streak tetap kebagian
    // paparan edukasi pencegahan DM sebelum absennya benar-benar tercatat. =====
    const panelAbsenFaktaOverlay = document.getElementById('panelAbsenFaktaOverlay');
    const elAbsenFaktaIkon = document.getElementById('absenFaktaIkon');
    const elAbsenFaktaTeks = document.getElementById('absenFaktaTeks');
    const btnLanjutAbsenFakta = document.getElementById('btnLanjutAbsenFakta');
    let timerJedaAbsenFakta = null;
    // ===== Pet Sobat Sehat — menemani belajar & berevolusi sesuai Poin Sehat kumulatif per akun =====
    const petAvatar = document.getElementById('petAvatar');
    const petNama = document.getElementById('petNama');
    const petDesc = document.getElementById('petDesc');
    const petBadgeLevel = document.getElementById('petBadgeLevel');
    const petProgressFill = document.getElementById('petProgressFill');
    const petProgressText = document.getElementById('petProgressText');
    const topbarPet = document.getElementById('topbarPet');
    const topbarPetEmoji = document.getElementById('topbarPetEmoji');
    const topbarPetNama = document.getElementById('topbarPetNama');
    const btnPetInfo = document.getElementById('btnPetInfo');
    const panelPetInfoOverlay = document.getElementById('panelPetInfoOverlay');
    const btnTutupPetInfo = document.getElementById('btnTutupPetInfo');
    const petEvolusiList = document.getElementById('petEvolusiList');
    const petInfoIkonHeader = document.getElementById('petInfoIkonHeader');
    const btnEditNamaPet = document.getElementById('btnEditNamaPet');
    // Pet TIDAK punya angka poin sendiri lagi — dia langsung memakai nilai
    // Skor Tertinggi (rekor poin biasa tertinggi milik akun ini), supaya kedua
    // angka ini dijamin selalu sama persis, tidak mungkin selisih.
    // Setiap stage punya "pola" (bukan nama tetap) supaya nama pet bisa
    // dikustomisasi per akun — misal "Phoenix" diganti "Kobo" jadi
    // "Telur Kobo", "Kobo Mungil", dst.
    // Field "gambar" (opsional) adalah path gambar ilustrasi custom untuk
    // stage ini. Kalau diisi, gambar ini dipakai menggantikan emoji di semua
    // tempat pet ditampilkan (kartu pet, ikon topbar, daftar evolusi, toast
    // naik level) — lihat perbaruiTampilanPet(), renderPetEvolusiList(), dan
    // tampilkanLevelUpPet(). "emoji" tetap disimpan sebagai teks alt/fallback
    // kalau gambar gagal dimuat.
    const PET_STAGES = [
        { min: 0, emoji: '🥚', gambar: 'pet-evo-1.png', pola: n => `Telur ${n}`, aura: 'rgba(244, 196, 48, 0.45)', desc: 'Telur legendaris yang menyimpan api suci. Yuk kumpulkan Poin Sehat bareng!' },
        { min: 100, emoji: '🐣', gambar: 'pet-evo-2.png', pola: n => `${n} Mungil`, aura: 'rgba(255, 205, 70, 0.5)', desc: 'Menetas dengan percikan api pertama, cikal bakal sang legenda.' },
        { min: 250, emoji: '🐤', gambar: 'pet-evo-3.png', pola: n => `${n} Muda`, aura: 'rgba(255, 170, 60, 0.55)', desc: 'Bulunya mulai berpijar, makin lincah menemanimu belajar.' },
        { min: 500, emoji: '🦜', gambar: 'pet-evo-4.png', pola: n => `${n} Terampil`, aura: 'rgba(255, 140, 66, 0.58)', desc: 'Makin gesit dan paham banyak fakta gula & kesehatan.' },
        { min: 1000, emoji: '🦉', gambar: 'pet-evo-5.png', pola: n => `${n} Bijak`, aura: 'rgba(255, 111, 74, 0.6)', desc: 'Bijak menemani setiap pilihan makanan & minumanmu.' },
        { min: 2000, emoji: '🦅', gambar: 'pet-evo-6.png', pola: n => `${n} Perkasa`, aura: 'rgba(255, 87, 51, 0.62)', desc: 'Sayapnya membara gagah, konsistensimu luar biasa!' },
        { min: 4000, emoji: '🐦\u200d🔥', gambar: 'pet-evo-7.png', pola: n => `${n} Sejati`, aura: 'rgba(255, 61, 0, 0.7)', desc: 'Bertransformasi penuh jadi burung Phoenix legendaris, gagah dan membara sepenuhnya.' },
        { min: 8000, emoji: '🌌', gambar: 'pet-evo-8.png', pola: n => `${n} Semesta`, aura: 'rgba(147, 51, 234, 0.65)', desc: 'Wujud puncak lintas galaksi, level tertinggi, legenda hidup Sobat Sehat!' }
    ];
    function kunciAkunAktif(base) {
        return `${base}_${(typeof emailAktif !== 'undefined' && emailAktif) ? emailAktif : 'tamu'}`;
    }
    // ===== Nama Pet kustom — disimpan per akun, default "Phoenix" =====
    // Nama HANYA boleh ditetapkan sekali per akun: begitu key ini pernah
    // ditulis (lewat simpanNamaPetDasar), dianggap sudah dikunci selamanya.
    const NAMA_PET_DEFAULT = 'Phoenix';
    const KUNCI_NAMA_PET_BASE = 'sobatSehatNamaPet';
    function ambilNamaPetDasar() {
        const tersimpan = localStorage.getItem(kunciAkunAktif(KUNCI_NAMA_PET_BASE));
        return (tersimpan && tersimpan.trim()) ? tersimpan.trim() : NAMA_PET_DEFAULT;
    }
    function sudahMemberiNamaPet() {
        return localStorage.getItem(kunciAkunAktif(KUNCI_NAMA_PET_BASE)) !== null;
    }
    function simpanNamaPetDasar(namaBaru) {
        localStorage.setItem(kunciAkunAktif(KUNCI_NAMA_PET_BASE), namaBaru);
        jadwalkanSinkronProgresGame();
    }
    // ===== Kesempatan Ganti Nama Pet — didapat dari bonus Absen 7 Hari =====
    // Nama pertama tetap GRATIS (lihat sudahMemberiNamaPet di atas). Setelah
    // itu, nama cuma bisa diganti lagi kalau siswa punya "kesempatan" yang
    // didapat tiap kali streak Absen Harian tembus kelipatan 7 hari
    // berturut-turut (lihat blok dapatBonusMingguan di prosesAbsenHarian).
    // Disimpan sebagai ANGKA (bukan boolean) supaya kalau kebetulan dapat
    // beberapa kelipatan 7 hari tanpa sempat dipakai, kesempatannya menumpuk.
    const KUNCI_NAMA_PET_KESEMPATAN_BASE = 'sobatSehatKesempatanGantiNamaPet';
    function ambilKesempatanGantiNama() {
        return Number(localStorage.getItem(kunciAkunAktif(KUNCI_NAMA_PET_KESEMPATAN_BASE))) || 0;
    }
    function tambahKesempatanGantiNama() {
        const baru = ambilKesempatanGantiNama() + 1;
        localStorage.setItem(kunciAkunAktif(KUNCI_NAMA_PET_KESEMPATAN_BASE), String(baru));
        jadwalkanSinkronProgresGame();
        perbaruiTampilanPet(); // biar ikon ✏️ di kartu pet langsung berubah jadi 🎁
    }
    function gunakanKesempatanGantiNama() {
        const sisa = Math.max(0, ambilKesempatanGantiNama() - 1);
        localStorage.setItem(kunciAkunAktif(KUNCI_NAMA_PET_KESEMPATAN_BASE), String(sisa));
        jadwalkanSinkronProgresGame();
    }
    // ===== Panel "Beri Nama Pet" — dipicu dari ikon ✏️ di kartu pet =====
    const panelNamaPetOverlay = document.getElementById('panelNamaPetOverlay');
    const namaPetJudul = document.getElementById('namaPetJudul');
    const namaPetInfoTeks = document.getElementById('namaPetInfoTeks');
    const formNamaPetBaru = document.getElementById('formNamaPetBaru');
    const inputNamaPetModal = document.getElementById('inputNamaPetModal');
    const namaPetPeringatan = document.getElementById('namaPetPeringatan');
    const btnSimpanNamaPet = document.getElementById('btnSimpanNamaPet');
    const btnTutupNamaPet = document.getElementById('btnTutupNamaPet');
    let _modeNamaPetSaatIni = 'baru'; // 'baru' | 'ganti' | 'terkunci'
    function bukaPanelNamaPet() {
        if (!panelNamaPetOverlay) return;
        const sudahAdaNama = sudahMemberiNamaPet();
        const kesempatan = ambilKesempatanGantiNama();
        if (!sudahAdaNama) {
            _modeNamaPetSaatIni = 'baru';
            if (namaPetJudul) namaPetJudul.textContent = 'Beri Nama Pet-mu';
            if (namaPetInfoTeks) namaPetInfoTeks.innerHTML = 'Nama ini bakal dipakai di semua level evolusi pet-mu (misalnya "Telur Kobo", "Kobo Mungil", dst). Nama pertama ini <strong>gratis</strong>, sedangkan nama berikutnya baru bisa diganti lagi lewat bonus Absen 7 Hari berturut-turut.';
            if (formNamaPetBaru) formNamaPetBaru.classList.remove('hidden');
            if (btnSimpanNamaPet) { btnSimpanNamaPet.classList.remove('hidden'); btnSimpanNamaPet.textContent = 'Simpan Nama'; }
            if (inputNamaPetModal) inputNamaPetModal.value = '';
            if (namaPetPeringatan) namaPetPeringatan.classList.add('hidden');
            if (btnTutupNamaPet) btnTutupNamaPet.textContent = 'Batal';
        } else if (kesempatan > 0) {
            _modeNamaPetSaatIni = 'ganti';
            if (namaPetJudul) namaPetJudul.textContent = '🎁 Kesempatan Ganti Nama!';
            if (namaPetInfoTeks) namaPetInfoTeks.innerHTML = `Kamu dapat <strong>${kesempatan} kesempatan ganti nama</strong> dari bonus Absen 7 Hari penuh berturut-turut! Nama pet-mu sekarang <strong>${ambilNamaPetDasar()}</strong>, mau diganti jadi apa?`;
            if (formNamaPetBaru) formNamaPetBaru.classList.remove('hidden');
            if (btnSimpanNamaPet) { btnSimpanNamaPet.classList.remove('hidden'); btnSimpanNamaPet.textContent = 'Ganti Nama'; }
            if (inputNamaPetModal) inputNamaPetModal.value = '';
            if (namaPetPeringatan) namaPetPeringatan.classList.add('hidden');
            if (btnTutupNamaPet) btnTutupNamaPet.textContent = 'Nanti Saja';
        } else {
            _modeNamaPetSaatIni = 'terkunci';
            if (namaPetJudul) namaPetJudul.textContent = 'Nama Pet Sedang Terkunci';
            if (namaPetInfoTeks) namaPetInfoTeks.innerHTML = `Nama pet-mu untuk akun ini sekarang <strong>${ambilNamaPetDasar()}</strong>. Absen penuh 7 hari berturut-turut buat dapat kesempatan ganti nama lagi!`;
            if (formNamaPetBaru) formNamaPetBaru.classList.add('hidden');
            if (btnSimpanNamaPet) btnSimpanNamaPet.classList.add('hidden');
            if (btnTutupNamaPet) btnTutupNamaPet.textContent = 'Mengerti →';
        }
        bukaPanelOverlay(panelNamaPetOverlay);
        if (_modeNamaPetSaatIni !== 'terkunci' && inputNamaPetModal) setTimeout(() => inputNamaPetModal.focus(), 50);
    }
    function simpanNamaPetDariModal() {
        if (!inputNamaPetModal || _modeNamaPetSaatIni === 'terkunci') return;
        const nilai = inputNamaPetModal.value.trim().slice(0, 16);
        if (!nilai) {
            if (namaPetPeringatan) namaPetPeringatan.classList.remove('hidden');
            inputNamaPetModal.focus();
            return;
        }
        if (_modeNamaPetSaatIni === 'ganti') gunakanKesempatanGantiNama();
        simpanNamaPetDasar(nilai);
        if (panelNamaPetOverlay) tutupPanelOverlay(panelNamaPetOverlay);
        perbaruiTampilanPet();
        if (panelPetInfoOverlay && !panelPetInfoOverlay.classList.contains('hidden')) renderPetEvolusiList();
    }
    if (btnEditNamaPet) btnEditNamaPet.addEventListener('click', bukaPanelNamaPet);
    if (btnSimpanNamaPet) btnSimpanNamaPet.addEventListener('click', simpanNamaPetDariModal);
    if (inputNamaPetModal) {
        inputNamaPetModal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); simpanNamaPetDariModal(); }
        });
        inputNamaPetModal.addEventListener('input', () => {
            if (namaPetPeringatan) namaPetPeringatan.classList.add('hidden');
        });
    }
    if (btnTutupNamaPet && panelNamaPetOverlay) {
        btnTutupNamaPet.addEventListener('click', () => tutupPanelOverlay(panelNamaPetOverlay));
    }
    // ===== State sesi papan (Poin Sehat berjalan, posisi token, jumlah putaran) =====
    // Disimpan per akun supaya TIDAK ke-reset ke 0 tiap kali login/refresh —
    // hanya reset kalau pemain sendiri yang menekan tombol "Reset".
    const KUNCI_POIN_SESI_BASE = 'sobatSehatPoinSesi';
    const KUNCI_POSISI_SESI_BASE = 'sobatSehatPosisiSesi';
    const KUNCI_LAP_SESI_BASE = 'sobatSehatLapSesi';
    function simpanStateSesi() {
        localStorage.setItem(kunciAkunAktif(KUNCI_POIN_SESI_BASE), String(poinSehat));
        localStorage.setItem(kunciAkunAktif(KUNCI_POSISI_SESI_BASE), String(posisiPemain));
        localStorage.setItem(kunciAkunAktif(KUNCI_LAP_SESI_BASE), String(jumlahLap));
        jadwalkanSinkronProgresGame();
    }
    function muatStateSesi() {
        posisiPemain = Number(localStorage.getItem(kunciAkunAktif(KUNCI_POSISI_SESI_BASE))) || 0;
        poinSehat = Number(localStorage.getItem(kunciAkunAktif(KUNCI_POIN_SESI_BASE))) || 0;
        jumlahLap = Number(localStorage.getItem(kunciAkunAktif(KUNCI_LAP_SESI_BASE))) || 0;
        perbaruiTampilanSkor();
        perbaruiTampilanStreakKuis();
        pindahkanTokenKeTile(posisiPemain, true);
    }
    function cariInfoStagePet(total) {
        let idx = 0;
        for (let i = 0; i < PET_STAGES.length; i++) {
            if (total >= PET_STAGES[i].min) idx = i;
        }
        return { stage: PET_STAGES[idx], idx, next: PET_STAGES[idx + 1] || null };
    }
    // Bikin markup ikon pet: pakai <img> kalau stage-nya punya gambar custom
    // (field "gambar"), kalau nggak ada baru fallback ke karakter emoji biasa
    // seperti sebelumnya. Dipakai di semua tempat pet ditampilkan biar
    // konsisten (kartu pet, ikon topbar, daftar evolusi, toast naik level).
    //
    // ===== Fallback kalau gambar gagal dimuat (404 / path salah / offline) =====
    // Kalau cuma pasang <img src="..."> polos, pas gagal load browser
    // nampilin ikon "gambar rusak" bawaan + teks alt di-render penuh
    // memenuhi ruang kotak ikon yang kecil — keliatan berantakan/numpuk ke
    // teks nama level di sebelahnya. Makanya di sini disiapkan JUGA span
    // emoji cadangan yang disembunyikan (class "hidden"), lalu
    // pasangFallbackGambarPet() dipanggil setelah elemen ini ditempel ke
    // DOM untuk mendengarkan event "error" pada <img>-nya: begitu gambar
    // gagal dimuat, <img> dihapus dan emoji cadangan itu dimunculkan —
    // hasilnya tampilan tetap rapi walau gambarnya belum ke-upload/salah path.
    function markupIkonPet(stage, namaAlt) {
        if (stage.gambar) {
            return `<img src="${stage.gambar}" alt="${namaAlt}" loading="lazy" data-ikon-pet-gambar><span class="ikon-pet-fallback hidden">${stage.emoji}</span>`;
        }
        return stage.emoji;
    }
    function pasangFallbackGambarPet(container) {
        if (!container) return;
        const img = container.querySelector('img[data-ikon-pet-gambar]');
        if (!img) return;
        img.addEventListener('error', () => {
            const fallback = container.querySelector('.ikon-pet-fallback');
            img.remove();
            if (fallback) fallback.classList.remove('hidden');
        }, { once: true });
    }
    function perbaruiTampilanPet() {
        const total = ambilSkorTertinggi();
        const { stage, idx, next } = cariInfoStagePet(total);
        const namaDasar = ambilNamaPetDasar();
        const namaStageAktif = stage.pola(namaDasar);
        if (petAvatar) { petAvatar.innerHTML = markupIkonPet(stage, namaStageAktif); petAvatar.style.setProperty('--aura-color', stage.aura); pasangFallbackGambarPet(petAvatar); }
        if (petNama) petNama.textContent = namaStageAktif;
        if (petDesc) petDesc.textContent = stage.desc;
        if (petBadgeLevel) petBadgeLevel.textContent = `Level ${idx + 1}`;
        if (petProgressFill) {
            const persen = next ? Math.max(0, Math.min(100, Math.round(((total - stage.min) / (next.min - stage.min)) * 100))) : 100;
            petProgressFill.style.width = `${persen}%`;
        }
        if (petProgressText) {
            petProgressText.textContent = next
                ? `${total} / ${next.min} Poin menuju ${next.pola(namaDasar)}`
                : `${total} Poin, Level maksimal tercapai! 🎉`;
        }
        if (topbarPetEmoji) { topbarPetEmoji.innerHTML = markupIkonPet(stage, namaStageAktif); topbarPetEmoji.style.setProperty('--aura-color', stage.aura); pasangFallbackGambarPet(topbarPetEmoji); }
        if (topbarPetNama) topbarPetNama.textContent = namaStageAktif;
        if (topbarPet) topbarPet.classList.toggle('hidden', !emailAktif);
        if (btnEditNamaPet) {
            const sudahAdaNama = sudahMemberiNamaPet();
            const kesempatan = ambilKesempatanGantiNama();
            if (!sudahAdaNama) {
                btnEditNamaPet.textContent = '✏️';
                btnEditNamaPet.title = 'Beri nama pet-mu';
            } else if (kesempatan > 0) {
                btnEditNamaPet.textContent = '🎁';
                btnEditNamaPet.title = `Kamu punya ${kesempatan} kesempatan ganti nama pet, klik buat pakai!`;
            } else {
                btnEditNamaPet.textContent = '🔒';
                btnEditNamaPet.title = 'Nama terkunci, absen penuh 7 hari berturut-turut buat dapat kesempatan ganti nama';
            }
        }
    }
    // ===== Popup Pencapaian (achievement) generik =====
    // Dipakai buat capaian yang "kelihatan" wujud barunya — pet naik level
    // ATAU streak absen naik tier — beda dari toast poin biasa (yang cuma
    // teks singkat), popup ini nongol lebih besar di tengah layar lengkap
    // sama ikon/gambar capaiannya, biar berasa kayak "achievement unlocked"
    // di game. ikonHtml boleh berisi <img> (pakai markupIkonPet) ATAU span
    // sprite streak-tier-emoji — keduanya sama-sama didukung.
    function tampilkanPencapaian({ ikonHtml, aura, badge, judul, subjudul, adaGambarImg }) {
        const popupLama = document.querySelector('.pencapaian-popup');
        if (popupLama) popupLama.remove();
        const popup = document.createElement('div');
        popup.className = 'pencapaian-popup';
        popup.innerHTML = `
            <span class="pencapaian-badge">${badge}</span>
            <span class="pencapaian-ikon" style="--aura-color:${aura || 'rgba(244, 196, 48, 0.5)'}">${ikonHtml}</span>
            <span class="pencapaian-judul">${judul}</span>
            ${subjudul ? `<span class="pencapaian-sub">${subjudul}</span>` : ''}
        `;
        document.body.appendChild(popup);
        if (adaGambarImg) pasangFallbackGambarPet(popup.querySelector('.pencapaian-ikon'));
        mainkanSfxPencapaian();
        setTimeout(() => popup.remove(), 3600);
    }
    function tampilkanLevelUpPet(stage, idx) {
        const namaStageIni = stage.pola(ambilNamaPetDasar());
        tampilkanPencapaian({
            ikonHtml: markupIkonPet(stage, namaStageIni),
            aura: stage.aura,
            badge: '🎉 Pet Naik Level!',
            judul: `Level ${idx + 1}: ${namaStageIni}`,
            subjudul: stage.desc,
            adaGambarImg: true
        });
    }
    function renderPetEvolusiList() {
        if (!petEvolusiList) return;
        const total = ambilSkorTertinggi();
        const { idx: idxAktif } = cariInfoStagePet(total);
        const namaDasar = ambilNamaPetDasar();
        petEvolusiList.innerHTML = PET_STAGES.map((s, i) => {
            const namaStageIni = s.pola(namaDasar);
            return `
            <li class="pet-evolusi-item${i === idxAktif ? ' pet-evolusi-aktif' : ''}">
                <span class="pet-evolusi-emoji pet-evolusi-emoji--pet" style="--aura-color:${s.aura}">${markupIkonPet(s, namaStageIni)}</span>
                <span class="pet-evolusi-teks">
                    <span class="pet-evolusi-nama">Level ${i + 1}: ${namaStageIni}${i === idxAktif ? ' (sekarang)' : ''}</span>
                    <span class="pet-evolusi-syarat">${s.min === 0 ? 'Mulai dari 0 Poin' : `Mulai dari ${s.min} Poin kumulatif`}</span>
                </span>
            </li>
        `;
        }).join('');
        petEvolusiList.querySelectorAll('.pet-evolusi-emoji--pet').forEach(pasangFallbackGambarPet);
        if (petInfoIkonHeader) {
            const stageTertinggi = PET_STAGES[PET_STAGES.length - 1];
            petInfoIkonHeader.innerHTML = markupIkonPet(stageTertinggi, stageTertinggi.pola(namaDasar));
            petInfoIkonHeader.classList.add('pet-evolusi-emoji--pet');
            pasangFallbackGambarPet(petInfoIkonHeader);
        }
    }
    if (btnPetInfo && panelPetInfoOverlay) {
        btnPetInfo.addEventListener('click', () => {
            renderPetEvolusiList();
            bukaPanelOverlay(panelPetInfoOverlay);
        });
    }
    if (btnTutupPetInfo && panelPetInfoOverlay) {
        btnTutupPetInfo.addEventListener('click', () => tutupPanelOverlay(panelPetInfoOverlay));
    }
    window.refreshGameAkun = () => {
        perbaruiTampilanPet();
        if (typeof window.refreshSkorDanAbsen === 'function') window.refreshSkorDanAbsen();
        perbaruiTampilanNotifikasiAbsen();
    };
    // Skor Tertinggi = rekor poin biasa (poinSehat) tertinggi yang PERNAH dicapai
    // akun ini. Cuma berubah kalau poin biasa saat ini melampaui rekor sebelumnya;
    // kalau poin biasa turun (kena jebakan/salah jawab) atau di-reset, rekor ini
    // TIDAK ikut turun.
    const KUNCI_SKOR_TERTINGGI = 'sobatSehatSkorTertinggiGame';
    const ROTASI_HASIL_DADU = {
        1: { x: 0, y: 0 },
        2: { x: -90, y: 0 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: 90, y: 0 },
        6: { x: 0, y: 180 },
    };
    let dadu3dRotX = -18; // sudut awal miring (samakan dengan CSS .dadu-kubus)
    let dadu3dRotY = 28;
    const PETA_GRID = [
        { kol: 1, baris: 1 }, { kol: 2, baris: 1 }, { kol: 3, baris: 1 }, { kol: 4, baris: 1 }, { kol: 5, baris: 1 }, { kol: 6, baris: 1 },
        { kol: 6, baris: 2 }, { kol: 6, baris: 3 }, { kol: 6, baris: 4 }, { kol: 6, baris: 5 }, { kol: 6, baris: 6 },
        { kol: 5, baris: 6 }, { kol: 4, baris: 6 }, { kol: 3, baris: 6 }, { kol: 2, baris: 6 }, { kol: 1, baris: 6 },
        { kol: 1, baris: 5 }, { kol: 1, baris: 4 }, { kol: 1, baris: 3 }, { kol: 1, baris: 2 }
    ];
    // ===== Bank Soal Kuis — mencakup seluruh materi edukasi & tips sehat =====
    // Diisi bertahap per materi. Tambahkan soal baru di sini nanti, satu per
    // satu, dengan format:
    // { topik: 'Nama Topik', pertanyaan: '...', opsi: ['jawaban benar', 'opsi 2', 'opsi 3'], benar: 0, penjelasan: '...' }
    // Catatan: "benar" adalah INDEX opsi yang benar di array "opsi" (0 = opsi pertama).
    const QUESTION_BANK = [
        // ===== Materi 1: Kenali Diabetes Melitus Tipe 2 (DMT2) =====
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Apa itu Diabetes Melitus Tipe 2 (DMT2)?', opsi: ['Kondisi kadar gula darah tinggi terus-menerus (hiperglikemia)', 'Penyakit menular lewat udara', 'Kekurangan cairan tubuh kronis'], benar: 0, penjelasan: 'DMT2 adalah kondisi ketika kadar gula (glukosa) di dalam darah lebih tinggi dari batas normal dan berlangsung terus-menerus, disebut hiperglikemia.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Dari mana asal glukosa yang beredar di dalam darah?', opsi: ['Dari makanan dan minuman berkarbohidrat/manis', 'Diproduksi otot saat berolahraga', 'Dihasilkan oleh sel darah putih'], benar: 0, penjelasan: 'Glukosa berasal dari makanan dan minuman berkarbohidrat/manis yang kita konsumsi sehari-hari.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Apa fungsi hormon insulin dalam tubuh?', opsi: ['Membantu mengantarkan glukosa dari darah masuk ke sel tubuh', 'Menghancurkan sel-sel yang sudah rusak', 'Mengatur detak jantung'], benar: 0, penjelasan: 'Insulin dihasilkan oleh pankreas dan bertugas mengantarkan glukosa dari darah masuk ke dalam sel, supaya bisa diubah menjadi energi.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Insulin sering diibaratkan seperti kunci yang membuka pintu sel. Nah, sel tubuh sendiri diibaratkan sebagai apa?', opsi: ['Gembok', 'Kunci', 'Jendela'], benar: 0, penjelasan: 'Insulin diibaratkan sebagai kunci, sedangkan sel tubuh diibaratkan sebagai gembok tempat glukosa masuk.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Apa yang dimaksud dengan "resistensi insulin"?', opsi: ['Sel tubuh menjadi kurang peka terhadap insulin, sehingga glukosa sulit masuk ke sel', 'Tubuh berhenti memproduksi insulin sejak lahir', 'Insulin berubah menjadi racun bagi sel tubuh'], benar: 0, penjelasan: 'Pada DMT2, sel-sel tubuh menjadi kurang peka terhadap insulin. Kondisi ini disebut resistensi insulin. Akibatnya, glukosa tetap menumpuk di darah walau insulin sudah "mengetuk pintu".' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Benarkah DMT2 bisa "sembuh total" seperti flu atau demam?', opsi: ['Tidak, DMT2 bersifat kronis dan umumnya perlu dikendalikan terus-menerus', 'Ya, cukup istirahat beberapa hari saja', 'Ya, asal minum obat satu kali'], benar: 0, penjelasan: 'DMT2 termasuk penyakit kronis (berlangsung lama) yang umumnya tidak sembuh total, tapi bisa dikendalikan dan risikonya bisa dicegah atau diperlambat.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Jika dibiarkan, DMT2 berisiko memicu gangguan pada organ apa saja?', opsi: ['Mata, ginjal, jantung, dan saraf', 'Rambut, kuku, dan kulit', 'Tulang rawan telinga'], benar: 0, penjelasan: 'DMT2 yang dibiarkan bisa memicu gangguan pada mata, ginjal, jantung, dan saraf.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Bagaimana tren kasus DMT2 pada remaja belakangan ini?', opsi: ['Terus meningkat di berbagai negara', 'Terus menurun drastis', 'Tidak pernah ditemukan pada remaja'], benar: 0, penjelasan: 'Kasus DMT2 pada usia muda, termasuk remaja, terus meningkat 2–3 kali lipat dibanding sekitar 30 tahun lalu.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Kebiasaan apa yang berhubungan dengan meningkatnya risiko DMT2 di masa depan?', opsi: ['Pola makan tinggi gula/kalori, kurang aktivitas fisik, dan terlalu banyak duduk', 'Terlalu sering minum air putih', 'Terlalu banyak tidur malam hari'], benar: 0, penjelasan: 'Pola makan tinggi gula/kalori, kurang aktivitas fisik, dan perilaku sedentari (terlalu banyak duduk) berhubungan dengan meningkatnya risiko DMT2 di masa depan.' },
        { topik: 'Kenali Diabetes Melitus Tipe 2', pertanyaan: 'Kenapa pencegahan DMT2 sebaiknya dimulai sejak remaja?', opsi: ['Karena masa remaja adalah masa pembentukan kebiasaan yang cenderung terbawa sampai dewasa', 'Karena remaja lebih kebal terhadap segala penyakit', 'Karena DMT2 hanya bisa menyerang usia di atas 60 tahun'], benar: 0, penjelasan: 'Masa remaja adalah masa pembentukan kebiasaan yang cenderung terbawa hingga dewasa, jadi makin awal mengenali dan mencegah, makin besar peluang menunda atau mencegah risiko DMT2.' },
        // ===== Materi 2: Kenali Gejala dan Bahaya Diabetes =====
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Apa saja tiga gejala khas yang sering muncul pada penderita DMT2?', opsi: ['Sering haus, sering buang air kecil, dan sering lapar berlebihan', 'Sering pusing, sering demam, dan sering batuk', 'Sering mimisan, sering pegal, dan sering pilek'], benar: 0, penjelasan: 'Tiga gejala khas DMT2 adalah sering merasa haus, sering buang air kecil (bahkan di malam hari), dan sering merasa lapar/banyak makan tapi badan tetap lemas.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Apa istilah medis untuk gejala "sering buang air kecil"?', opsi: ['Poliuria', 'Polidipsia', 'Polifagia'], benar: 0, penjelasan: 'Poliuria adalah istilah medis untuk gejala sering buang air kecil.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Apa istilah medis untuk gejala "sering merasa haus"?', opsi: ['Polidipsia', 'Poliuria', 'Polifagia'], benar: 0, penjelasan: 'Polidipsia adalah istilah medis untuk gejala sering merasa haus.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Apa istilah medis untuk gejala "sering merasa lapar atau banyak makan"?', opsi: ['Polifagia', 'Poliuria', 'Polidipsia'], benar: 0, penjelasan: 'Polifagia adalah istilah medis untuk gejala sering merasa lapar atau banyak makan.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Kenapa penderita DMT2 bisa mengalami poliuria (sering buang air kecil)?', opsi: ['Ginjal berusaha membuang kelebihan glukosa lewat urine', 'Tubuh kelebihan cairan karena terlalu banyak minum', 'Kandung kemih membesar akibat olahraga'], benar: 0, penjelasan: 'Ginjal berusaha membuang kelebihan glukosa lewat urine, sehingga produksi urine ikut meningkat dan muncul gejala poliuria.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Kenapa penderita DMT2 bisa merasa lapar berlebihan (polifagia) walau glukosa di darah melimpah?', opsi: ['Karena resistensi insulin membuat sel-sel tubuh tetap kekurangan energi', 'Karena lambungnya menyusut', 'Karena tubuh kelebihan produksi insulin'], benar: 0, penjelasan: 'Sel-sel tubuh tetap kekurangan energi walau glukosa di darah melimpah, akibat resistensi insulin, sehingga tubuh merespons dengan rasa lapar berlebih.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Jika gejala 3P muncul berlebihan atau terus-menerus, apa yang sebaiknya dilakukan?', opsi: ['Segera ceritakan ke orang tua/guru atau periksa ke tenaga kesehatan', 'Dibiarkan saja karena pasti hilang sendiri', 'Cukup minum obat warung tanpa periksa lebih lanjut'], benar: 0, penjelasan: 'Kalau gejala 3P muncul berlebihan atau menetap, sebaiknya segera ceritakan ke orang tua, guru, atau periksakan diri ke tenaga kesehatan.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Apa dampak jangka panjang diabetes yang tidak terkontrol terhadap saraf dan pembuluh darah?', opsi: ['Bisa menyebabkan kesemutan, mati rasa, hingga gangguan sirkulasi di tangan dan kaki', 'Membuat tulang menjadi lebih kuat', 'Membuat rambut tumbuh lebih cepat'], benar: 0, penjelasan: 'Kadar gula darah yang terus-menerus tinggi bisa merusak saraf dan pembuluh darah, menyebabkan kesemutan, mati rasa, hingga gangguan sirkulasi di tangan dan kaki.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Apa risiko yang bisa terjadi kalau luka di kaki penderita diabetes sulit sembuh dan infeksinya memburuk?', opsi: ['Risiko amputasi meningkat', 'Luka akan sembuh lebih cepat dari biasanya', 'Tidak ada risiko tambahan'], benar: 0, penjelasan: 'Akibat aliran darah dan saraf yang terganggu, luka di kaki bisa sulit sembuh, bahkan meningkatkan risiko amputasi jika infeksi memburuk.' },
        { topik: 'Kenali Gejala dan Bahaya Diabetes', pertanyaan: 'Selain kerusakan ginjal dan jantung, komplikasi serius apa lagi yang bisa muncul akibat diabetes tidak terkontrol?', opsi: ['Stroke, akibat gangguan pembuluh darah menuju otak', 'Rambut rontok permanen', 'Gangguan pendengaran total'], benar: 0, penjelasan: 'Stroke bisa terjadi jika pembuluh darah menuju otak mengalami gangguan atau tersumbat. Ini termasuk salah satu dampak serius diabetes yang tidak terkontrol.' },
        // ===== Materi 3: Gula, Makanan, dan Minuman yang Perlu Dibatasi =====
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Apa itu gula tambahan?', opsi: ['Gula yang sengaja ditambahkan ke makanan/minuman saat diolah, dimasak, atau disajikan', 'Gula yang secara alami ada di dalam buah utuh', 'Gula yang dihasilkan tubuh sendiri'], benar: 0, penjelasan: 'Gula tambahan adalah gula yang sengaja ditambahkan ke dalam makanan atau minuman saat diolah, dimasak, atau disajikan, baik oleh pabrik, penjual, maupun diri sendiri.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Apa yang dimaksud dengan "gula bebas"?', opsi: ['Gula tambahan ditambah gula alami dalam madu, sirup, dan jus buah', 'Semua jenis gula termasuk gula dalam buah utuh', 'Hanya gula pasir yang dijual di pasaran'], benar: 0, penjelasan: 'Gula bebas mencakup semua gula tambahan, ditambah gula alami yang ada di dalam madu, sirup, serta jus buah.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Kenapa jus buah termasuk kategori gula bebas, padahal berasal dari buah?', opsi: ['Karena proses pengolahan menghilangkan sebagian besar serat, sehingga gula lebih cepat diserap tubuh', 'Karena jus buah mengandung pengawet kimia', 'Karena jus buah tidak mengandung gula sama sekali'], benar: 0, penjelasan: 'Saat buah diperas atau diolah menjadi jus, sebagian besar seratnya hilang, sehingga gula di dalamnya jadi lebih mudah dan cepat diserap tubuh, mirip gula tambahan.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Apa yang membedakan gula alami dalam buah utuh dengan gula tambahan pada camilan manis?', opsi: ['Gula dalam buah utuh disertai serat yang memperlambat penyerapan gula', 'Gula dalam buah utuh diserap lebih cepat daripada gula tambahan', 'Buah utuh tidak mengandung gula sama sekali'], benar: 0, penjelasan: 'Di dalam buah utuh, gula alami ditemani serat, air, vitamin, dan mineral. Serat ini membuat penyerapan gula lebih lambat, sehingga bisa membuat kenyang lebih lama.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Sebutkan salah satu contoh minuman yang perlu dibatasi konsumsinya karena tinggi gula.', opsi: ['Soda', 'Air putih', 'Susu tawar tanpa gula'], benar: 0, penjelasan: 'Soda, teh manis, boba, dan minuman kemasan manis adalah contoh minuman tinggi gula yang perlu dibatasi konsumsinya.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Kenapa minuman manis sering jadi "penyumbang" gula yang tidak disadari?', opsi: ['Karena mudah dihabiskan dan tidak terlalu membuat kenyang, sehingga tetap makan seperti biasa', 'Karena minuman manis selalu lebih mahal dari makanan', 'Karena minuman manis tidak mengandung kalori'], benar: 0, penjelasan: 'Minuman manis mudah dihabiskan dan tidak terlalu membuat kenyang, sehingga seseorang cenderung tetap makan seperti biasa meski sudah minum minuman manis.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Kalau gula/kalori yang masuk ke tubuh lebih banyak dari yang dibutuhkan, apa yang terjadi?', opsi: ['Kelebihan tersebut disimpan tubuh sebagai lemak', 'Kelebihan tersebut otomatis dibuang lewat keringat', 'Tubuh berhenti memproduksi energi'], benar: 0, penjelasan: 'Kalau gula/kalori yang masuk lebih banyak dari yang dibutuhkan atau digunakan untuk beraktivitas, kelebihan ini akan disimpan tubuh sebagai lemak.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Apa hubungan antara pola makan tinggi gula yang terus-menerus dengan risiko DMT2?', opsi: ['Berhubungan dengan meningkatnya risiko resistensi insulin dari waktu ke waktu', 'Justru menurunkan risiko resistensi insulin', 'Tidak ada hubungan sama sekali'], benar: 0, penjelasan: 'Pola makan tinggi gula yang berlangsung terus-menerus, apalagi disertai kelebihan berat badan, berhubungan dengan meningkatnya risiko resistensi insulin, yang bisa berujung pada DMT2.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Apakah semua makanan/minuman manis harus dihindari total?', opsi: ['Tidak, tapi sebaiknya dibatasi jumlah dan frekuensinya', 'Ya, harus dihindari 100% seumur hidup', 'Tidak masalah dikonsumsi setiap hari sebanyak apapun'], benar: 0, penjelasan: 'Bukan berarti semua makanan/minuman manis harus dihindari total, tapi sebaiknya dibatasi jumlah dan frekuensinya, apalagi kalau dikonsumsi hampir setiap hari.' },
        { topik: 'Gula, Makanan, dan Minuman yang Perlu Dibatasi', pertanyaan: 'Selain gula pasir di dapur, dari mana lagi gula bisa ditemukan?', opsi: ['Secara alami di dalam buah, sayur, dan susu, serta ditambahkan ke makanan/minuman saat diproses', 'Hanya dari gula pasir yang dijual di toko', 'Hanya dari gula sintetis buatan pabrik'], benar: 0, penjelasan: 'Gula juga bisa ditemukan secara alami di dalam buah, sayur, dan susu, atau sengaja ditambahkan ke dalam makanan dan minuman saat proses pembuatannya.' },
        // ===== Materi 4: Batas Konsumsi Gula dan Cara Membaca Label =====
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Berapa batas konsumsi gula tambahan yang dianjurkan Kemenkes RI setiap hari?', opsi: ['Maksimal 50 gram atau 4 sendok makan', 'Maksimal 100 gram atau 8 sendok makan', 'Tidak ada batasnya sama sekali'], benar: 0, penjelasan: 'Kementerian Kesehatan RI menganjurkan konsumsi gula tambahan tidak lebih dari 50 gram atau setara 4 sendok makan per hari.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Menurut WHO, gula bebas sebaiknya tidak lebih dari berapa persen total energi harian?', opsi: ['10%', '50%', '90%'], benar: 0, penjelasan: 'WHO menganjurkan membatasi gula bebas tidak lebih dari 10% dari total energi harian. Kalau bisa di bawah 5%, manfaatnya untuk kesehatan makin besar.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Apakah batas 50 gram gula per hari itu artinya kita harus menghabiskan gula sebanyak itu setiap hari?', opsi: ['Tidak, itu batas maksimal, bukan target yang wajib dipenuhi', 'Ya, tubuh butuh tepat 50 gram gula setiap hari', 'Ya, kalau kurang dari itu tubuh akan lemas'], benar: 0, penjelasan: 'Angka 50 gram itu adalah batas atas alias maksimal, bukan target yang harus dipenuhi. Tubuh sebenarnya bisa tetap sehat walau tanpa gula tambahan sama sekali.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Dari mana tubuh sebenarnya masih bisa mendapatkan energi yang cukup tanpa tambahan gula?', opsi: ['Dari makanan pokok, buah, dan sayur', 'Hanya dari permen dan cokelat', 'Hanya dari minuman bersoda'], benar: 0, penjelasan: 'Tubuh sudah bisa mendapatkan energi yang cukup dari karbohidrat pada makanan pokok seperti nasi, roti, dan kentang, ditambah buah dan sayur, tanpa perlu tambahan gula.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Label apa yang wajib ada di kemasan makanan/minuman untuk menunjukkan kandungan gizinya, termasuk gula?', opsi: ['Informasi Nilai Gizi', 'Kode produksi', 'Nomor izin edar'], benar: 0, penjelasan: 'Hampir semua makanan dan minuman kemasan di Indonesia wajib mencantumkan label Informasi Nilai Gizi yang berisi rincian kandungan gizi, termasuk gula.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Saat membaca label kemasan, angka gula yang tertulis biasanya menunjukkan kandungan gula untuk apa?', opsi: ['Satu takaran saji, bukan satu kemasan penuh', 'Satu kemasan penuh, apapun ukurannya', 'Rata-rata gula sehari penuh'], benar: 0, penjelasan: 'Angka gula yang tertulis di label adalah kandungan gula per satu takaran saji, bukan untuk satu kemasan penuh.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Kalau sebuah kemasan bertuliskan "Gula 8 gram" dan "3 sajian per kemasan", berapa total gula kalau kamu menghabiskan satu kemasan penuh?', opsi: ['24 gram', '8 gram', '3 gram'], benar: 0, penjelasan: 'Total gula dihitung dengan gula per sajian dikali jumlah sajian per kemasan, yaitu 8 gram dikali 3 sama dengan 24 gram.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Selain kandungan gula, dua bagian lain apa yang penting diperhatikan saat membaca label kemasan?', opsi: ['Takaran saji dan jumlah sajian per kemasan', 'Warna kemasan dan bentuk botol', 'Nama produsen dan alamat pabrik'], benar: 0, penjelasan: 'Selain kandungan gula, kamu juga perlu memperhatikan takaran saji dan jumlah sajian per kemasan supaya tahu total gula yang sebenarnya kamu konsumsi.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Saat membandingkan dua produk minuman untuk memilih yang lebih rendah gula, apa yang perlu diperhatikan supaya perbandingannya adil?', opsi: ['Membandingkan pada takaran saji yang kurang lebih sama', 'Cukup melihat harga yang lebih murah', 'Cukup melihat warna kemasan yang lebih menarik'], benar: 0, penjelasan: 'Supaya perbandingannya adil, pastikan kamu membandingkan angka gula pada takaran saji yang kurang lebih sama, lalu pilih produk dengan gula per sajian yang lebih rendah.' },
        { topik: 'Batas Konsumsi Gula dan Cara Membaca Label', pertanyaan: 'Kenapa gula tambahan bisa cepat melebihi batas harian tanpa disadari?', opsi: ['Karena beberapa makanan dan minuman manis sehari-hari sudah mengandung gula dalam jumlah cukup besar', 'Karena tubuh menyimpan gula dari kemarin', 'Karena gula tambahan tidak pernah dihitung dalam makanan'], benar: 0, penjelasan: 'Contohnya segelas teh manis, segelas minuman kekinian, dan camilan manis saja totalnya sudah bisa melebihi 50 gram, padahal belum termasuk gula dari makanan lain di hari itu.' },
        // ===== Materi 5: Aktivitas Fisik untuk Mencegah DMT2 =====
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Apa itu aktivitas fisik?', opsi: ['Semua gerakan tubuh yang dihasilkan otot dan memerlukan energi', 'Hanya olahraga yang dilakukan di lapangan', 'Kegiatan yang dilakukan sambil duduk diam'], benar: 0, penjelasan: 'Aktivitas fisik adalah semua gerakan tubuh yang dihasilkan oleh otot dan memerlukan pengeluaran energi, seperti jalan kaki, menyapu, atau naik tangga.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Apa bedanya aktivitas fisik dengan olahraga?', opsi: ['Olahraga adalah aktivitas fisik yang lebih terencana dan terstruktur', 'Aktivitas fisik dan olahraga adalah dua hal yang sama sekali berbeda', 'Olahraga tidak termasuk aktivitas fisik'], benar: 0, penjelasan: 'Aktivitas fisik mencakup semua gerakan tubuh sehari-hari, sedangkan olahraga adalah salah satu bentuk aktivitas fisik yang lebih terencana dan terstruktur, misalnya latihan futsal terjadwal.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Benarkah semua aktivitas fisik harus berupa olahraga?', opsi: ['Tidak, banyak kegiatan sehari-hari yang sudah termasuk aktivitas fisik', 'Ya, kalau bukan olahraga berarti bukan aktivitas fisik', 'Ya, aktivitas fisik hanya berlaku di lapangan olahraga'], benar: 0, penjelasan: 'Semua olahraga termasuk aktivitas fisik, tapi tidak semua aktivitas fisik harus berupa olahraga. Jalan kaki dan menyapu rumah juga termasuk aktivitas fisik.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Bagaimana aktivitas fisik membantu mencegah DMT2?', opsi: ['Membantu sel tubuh lebih peka terhadap insulin dan menggunakan glukosa sebagai energi', 'Membuat tubuh memproduksi lebih banyak gula', 'Membuat sel tubuh berhenti membutuhkan insulin'], benar: 0, penjelasan: 'Aktivitas fisik membantu sel-sel tubuh lebih peka terhadap insulin dan membantu tubuh menggunakan glukosa dalam darah untuk energi, sehingga risiko DMT2 bisa berkurang.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Berapa lama WHO menganjurkan remaja usia 5 sampai 17 tahun melakukan aktivitas fisik sedang hingga berat setiap hari?', opsi: ['Minimal 60 menit', 'Minimal 5 menit', 'Minimal 5 jam'], benar: 0, penjelasan: 'WHO menganjurkan remaja usia 5 sampai 17 tahun melakukan aktivitas fisik intensitas sedang hingga berat setidaknya 60 menit setiap hari.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Mana yang lebih bermanfaat, aktivitas fisik ringan yang rutin setiap hari atau olahraga berat yang cuma sesekali?', opsi: ['Aktivitas fisik ringan yang dilakukan rutin setiap hari', 'Olahraga berat yang cuma dilakukan sesekali', 'Keduanya sama saja, tidak ada bedanya'], benar: 0, penjelasan: 'Kuncinya adalah konsisten. Aktivitas fisik ringan yang dilakukan rutin setiap hari jauh lebih bermanfaat dibanding olahraga berat yang cuma dilakukan sesekali.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Sebutkan salah satu contoh aktivitas fisik yang bisa dilakukan tanpa harus olahraga formal.', opsi: ['Naik tangga daripada naik lift atau eskalator', 'Duduk diam seharian di kamar', 'Tidur siang lebih lama dari biasanya'], benar: 0, penjelasan: 'Aktivitas fisik tidak harus olahraga formal. Memilih naik tangga daripada lift atau eskalator, atau membantu menyapu rumah, juga termasuk aktivitas fisik.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Apa yang dimaksud dengan perilaku sedentari?', opsi: ['Kebiasaan duduk atau berbaring lama dengan sedikit gerakan', 'Kebiasaan berolahraga setiap hari', 'Kebiasaan berjalan kaki ke sekolah'], benar: 0, penjelasan: 'Perilaku sedentari adalah kebiasaan duduk atau berbaring dalam waktu lama dengan sedikit gerakan, misalnya duduk berjam-jam sambil bermain gawai atau menonton.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Kenapa perilaku sedentari yang terus-menerus perlu dikurangi?', opsi: ['Karena berhubungan dengan meningkatnya risiko kelebihan berat badan dan DMT2', 'Karena bisa membuat tubuh terlalu banyak berkeringat', 'Karena bisa mempercepat pertumbuhan tinggi badan'], benar: 0, penjelasan: 'Perilaku sedentari yang berlangsung terus-menerus berhubungan dengan meningkatnya risiko kelebihan berat badan dan DMT2 di kemudian hari.' },
        { topik: 'Aktivitas Fisik untuk Mencegah DMT2', pertanyaan: 'Apa yang sebaiknya kamu lakukan kalau sudah duduk terlalu lama selama 1 sampai 2 jam?', opsi: ['Berdiri, meregangkan badan, atau berjalan sebentar', 'Tetap duduk supaya tidak lelah', 'Menambah waktu duduk menjadi lebih lama lagi'], benar: 0, penjelasan: 'Coba selingi waktu duduk lama dengan berdiri, meregangkan badan, atau berjalan sebentar setiap 1 sampai 2 jam sekali.' },
        // ===== Materi 6: Membangun Kebiasaan Hidup Sehat Sejak Remaja =====
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Kenapa pencegahan DMT2 lebih berkaitan dengan kebiasaan daripada usaha sekali coba?', opsi: ['Karena DMT2 berkembang perlahan dan dipengaruhi kebiasaan yang berulang setiap hari', 'Karena DMT2 langsung muncul dalam semalam', 'Karena kebiasaan sesekali sudah cukup untuk mencegah DMT2'], benar: 0, penjelasan: 'DMT2 berkembang perlahan dan sangat dipengaruhi oleh kebiasaan yang dilakukan berulang kali setiap hari, sehingga pencegahannya juga perlu dilakukan lewat kebiasaan yang konsisten.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Apa langkah paling dasar untuk mulai membangun kebiasaan hidup sehat?', opsi: ['Lebih sadar terhadap apa yang dimakan dan diminum setiap hari', 'Langsung mengubah semua kebiasaan sekaligus', 'Menunggu sampai badan terasa tidak sehat'], benar: 0, penjelasan: 'Langkah paling dasar dari kebiasaan sehat adalah mulai lebih sadar terhadap makanan dan minuman sehari-hari, dimulai dari pilihan-pilihan kecil yang dilakukan secara konsisten.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Kenapa membaca label dan membatasi gula disebut sebagai dua kebiasaan yang saling melengkapi?', opsi: ['Karena membaca label membantumu membatasi gula dengan lebih tepat', 'Karena kalau sudah baca label, tidak perlu lagi membatasi gula', 'Karena keduanya tidak ada hubungannya sama sekali'], benar: 0, penjelasan: 'Membaca label adalah alat bantu supaya kamu bisa membatasi gula dengan lebih tepat, bukan asal menebak. Kalau cuma salah satu yang dijalani, hasilnya tidak akan maksimal.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Apa manfaat membiasakan minum air putih sebagai minuman utama?', opsi: ['Membantu mengurangi asupan gula harian dari minuman manis', 'Membuat tubuh menjadi lebih cepat lapar', 'Membuat rasa haus jadi lebih sering muncul'], benar: 0, penjelasan: 'Minuman manis termasuk salah satu penyumbang gula tersembunyi terbesar dalam keseharian remaja, jadi membiasakan minum air putih membantu mengurangi asupan gula harian.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Sebutkan salah satu contoh camilan yang lebih sehat untuk remaja.', opsi: ['Buah potong, kacang-kacangan, atau yogurt tawar', 'Camilan kemasan tinggi gula setiap hari', 'Permen dan cokelat sebagai camilan utama'], benar: 0, penjelasan: 'Camilan yang lebih sehat contohnya buah potong, kacang-kacangan, atau yogurt tawar, dan sebaiknya kurangi camilan kemasan yang tinggi gula, garam, atau lemak berlebihan.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Berapa lama aktivitas fisik yang sebaiknya dijadikan bagian rutinitas harian?', opsi: ['Minimal 60 menit per hari', 'Minimal 5 menit per minggu', 'Tidak perlu dijadwalkan sama sekali'], benar: 0, penjelasan: 'Aktivitas fisik membantu sel-sel tubuh lebih peka terhadap insulin, jadi sebaiknya dijadikan bagian rutinitas minimal 60 menit per hari, bukan sekadar kalau sempat.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Kenapa penting mengurangi waktu duduk terlalu lama dan waktu layar?', opsi: ['Supaya tubuh tetap aktif bergerak dan tidak terus-menerus ngemil tanpa sadar', 'Supaya mata menjadi lebih cepat lelah', 'Supaya waktu belajar jadi lebih singkat'], benar: 0, penjelasan: 'Duduk terlalu lama dan waktu layar berlebihan, apalagi sambil ngemil terus-menerus tanpa disadari, sebaiknya dikurangi dengan menyelingi berdiri atau jalan sebentar tiap 1 sampai 2 jam.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Kenapa kita perlu tetap kritis terhadap tren makanan/minuman manis yang viral di media sosial?', opsi: ['Karena konten di media sosial dirancang terlihat menarik, bukan berarti otomatis sehat', 'Karena semua makanan yang viral pasti sehat', 'Karena media sosial selalu memberi informasi gizi yang lengkap'], benar: 0, penjelasan: 'Konten di media sosial dirancang supaya terlihat menarik, bukan berarti otomatis sehat, jadi penting untuk cek dulu kandungan gizinya sebelum ikut tren yang viral.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Kenapa kebiasaan hidup sehat pada materi ini digambarkan seperti jaring laba-laba?', opsi: ['Karena satu kebiasaan bisa memperkuat kebiasaan lainnya, dan sebaliknya', 'Karena kebiasaan-kebiasaan itu tidak saling berhubungan', 'Karena jaring laba-laba tidak ada hubungannya dengan kesehatan'], benar: 0, penjelasan: 'Kebiasaan-kebiasaan sehat ini saling berkaitan seperti jaring laba-laba. Makin banyak kebiasaan yang saling terhubung, makin kuat menahan risiko DMT2.' },
        { topik: 'Membangun Kebiasaan Hidup Sehat Sejak Remaja', pertanyaan: 'Apa yang lebih penting dalam membangun kebiasaan hidup sehat, kesempurnaan atau konsistensi?', opsi: ['Konsistensi dalam jangka panjang', 'Kesempurnaan sejak hari pertama', 'Melakukannya secara ekstrem dalam waktu singkat'], benar: 0, penjelasan: 'Kebiasaan sehat itu bukan soal sempurna atau ekstrem, tapi soal konsisten dijalani dalam jangka panjang, dimulai dari perubahan kecil yang bisa bertahan lama.' },
        // ===== Tips Sehat Materi 1: Pilih Minuman yang Lebih Sehat =====
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Apa minuman yang paling aman diminum setiap hari?', opsi: ['Air putih', 'Minuman bersoda', 'Teh manis kemasan'], benar: 0, penjelasan: 'Air putih tidak mengandung gula maupun kalori tambahan, jadi paling aman diminum setiap hari.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Kenapa air putih lebih baik dibanding minuman manis?', opsi: ['Karena tidak mengandung gula tambahan', 'Karena rasanya lebih manis', 'Karena mengandung banyak kalori'], benar: 0, penjelasan: 'Air putih tidak mengandung gula tambahan, sehingga aman diminum kapan saja tanpa menambah asupan gula harian.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Kira kira berapa kebutuhan cairan remaja usia 10 sampai 18 tahun setiap hari?', opsi: ['Sekitar 1.850 sampai 2.150 ml', 'Sekitar 500 ml', 'Sekitar 5 liter'], benar: 0, penjelasan: 'Remaja usia 10 sampai 18 tahun membutuhkan sekitar 1.850 sampai 2.150 ml cairan setiap hari.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Berikut ini yang termasuk minuman manis yang perlu dikurangi adalah?', opsi: ['Teh manis, minuman bersoda, dan boba', 'Air putih dan air kelapa murni', 'Susu tawar dan air mineral'], benar: 0, penjelasan: 'Teh manis, minuman bersoda, dan boba atau minuman kekinian termasuk minuman manis yang perlu dikurangi.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Bolehkah minum minuman manis sesekali?', opsi: ['Boleh, asal tidak dijadikan kebiasaan setiap hari', 'Tidak boleh sama sekali', 'Boleh diminum setiap hari tanpa batas'], benar: 0, penjelasan: 'Minuman manis boleh dinikmati sesekali, asal tidak dijadikan kebiasaan yang diminum setiap hari.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Apa yang sebaiknya dilakukan sebelum membeli minuman kemasan?', opsi: ['Melihat label Informasi Nilai Gizi', 'Melihat warna kemasannya saja', 'Langsung membeli tanpa cek apapun'], benar: 0, penjelasan: 'Melihat label Informasi Nilai Gizi membantu kamu tahu jumlah gula yang ada dalam minuman kemasan.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Kenapa label kemasan minuman penting dibaca?', opsi: ['Supaya tahu jumlah gula per sajian', 'Supaya tahu tanggal produksi saja', 'Supaya tahu harga minuman'], benar: 0, penjelasan: 'Label kemasan mencantumkan jumlah gula per sajian, sehingga kamu bisa memperkirakan gula yang akan masuk ke tubuh.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Kalau ada minuman dengan varian gula lebih rendah, sebaiknya bagaimana?', opsi: ['Boleh dicoba sebagai alternatif', 'Harus dihindari sepenuhnya', 'Tidak ada bedanya dengan yang biasa'], benar: 0, penjelasan: 'Kalau tersedia varian dengan gula lebih rendah, kamu boleh mencobanya sebagai alternatif dari minuman manis biasa.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Apa yang bisa terjadi kalau minuman manis diminum setiap hari?', opsi: ['Gula akan semakin menumpuk di tubuh', 'Tubuh akan menjadi lebih sehat', 'Kebutuhan cairan tubuh akan berkurang'], benar: 0, penjelasan: 'Semakin sering minuman manis diminum, semakin banyak juga gula yang menumpuk di tubuh.' },
        { topik: 'Pilih Minuman yang Lebih Sehat', pertanyaan: 'Apa langkah sederhana untuk mulai mengurangi minuman manis?', opsi: ['Membawa air putih dari rumah', 'Menambah porsi minuman manis', 'Berhenti minum air putih'], benar: 0, penjelasan: 'Membawa air putih dari rumah adalah langkah kecil dan sederhana untuk membantu mengurangi minuman manis.' },
        // ===== Tips Sehat Materi 2: Cek Label Sebelum Membeli =====
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Apa yang wajib dicantumkan pada kemasan makanan dan minuman?', opsi: ['Label Informasi Nilai Gizi', 'Nomor telepon pembeli', 'Warna kesukaan konsumen'], benar: 0, penjelasan: 'Setiap makanan dan minuman kemasan wajib mencantumkan label Informasi Nilai Gizi.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Kenapa penting membaca label sebelum membeli makanan atau minuman kemasan?', opsi: ['Supaya tahu kandungan gula di dalamnya', 'Supaya tahu siapa yang membuatnya', 'Supaya tahu warna kemasannya'], benar: 0, penjelasan: 'Label membantu kamu tahu apa saja yang ada di dalam kemasan, termasuk seberapa banyak gula yang akan kamu konsumsi.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Langkah pertama sebelum membeli makanan atau minuman kemasan adalah?', opsi: ['Mencari bagian informasi nilai gizi', 'Langsung membayar di kasir', 'Membuka kemasan dulu'], benar: 0, penjelasan: 'Langkah pertama adalah mencari bagian informasi nilai gizi pada kemasan.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Setelah menemukan informasi nilai gizi, apa yang perlu dilihat?', opsi: ['Gula per sajian', 'Warna kemasan', 'Nama produsen saja'], benar: 0, penjelasan: 'Setelah menemukan informasi nilai gizi, lihat berapa gram gula per sajian yang tertera.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Kenapa penting mengecek jumlah sajian dalam satu kemasan?', opsi: ['Karena gula yang dikonsumsi bisa lebih banyak dari angka di label', 'Karena jumlah sajian menentukan harga', 'Karena tidak ada hubungannya dengan gula'], benar: 0, penjelasan: 'Kalau satu kemasan berisi beberapa sajian, gula yang dikonsumsi bisa lebih banyak dari angka gula per sajian.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Kalau ada dua produk, langkah terakhir yang sebaiknya dilakukan adalah?', opsi: ['Membandingkan dan memilih yang gulanya lebih rendah', 'Membeli keduanya sekaligus', 'Memilih yang kemasannya lebih besar'], benar: 0, penjelasan: 'Langkah terakhir adalah membandingkan dua produk lalu memilih yang kandungan gulanya lebih rendah.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Kalau satu kemasan biskuit punya 4 sajian dan dihabiskan semua, apa artinya?', opsi: ['Gula yang dikonsumsi menjadi 4 kali lipat dari gula per sajian', 'Gula per sajian sudah termasuk gula seluruh kemasan', 'Gula hanya dihitung sekali dari kemasan tersebut'], benar: 0, penjelasan: 'Kalau kemasan berisi 4 sajian dan semuanya dihabiskan, gula yang dikonsumsi menjadi 4 kali lipat dari gula per sajian.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Kenapa jus buah kemasan belum tentu rendah gula meskipun mengandung vitamin?', opsi: ['Karena jus buah kemasan tetap bisa mengandung gula tambahan yang tinggi', 'Karena vitamin membuat gula hilang', 'Karena semua jus buah kemasan tidak memiliki gula'], benar: 0, penjelasan: 'Meski mengandung vitamin, jus buah kemasan tetap bisa memiliki kandungan gula tambahan yang cukup tinggi.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Kalau takaran saji dua produk berbeda, apa yang sebaiknya dilakukan sebelum membandingkan gulanya?', opsi: ['Menyamakan dulu ukuran takaran sajinya', 'Langsung membandingkan tanpa menyamakan apapun', 'Memilih produk yang kemasannya lebih menarik'], benar: 0, penjelasan: 'Kalau takaran sajinya berbeda, samakan dulu ukurannya supaya perbandingan gulanya tetap adil.' },
        { topik: 'Cek Label Sebelum Membeli', pertanyaan: 'Apa manfaat kebiasaan membaca label kemasan?', opsi: ['Membantu membuat pilihan makanan dan minuman yang lebih sadar', 'Membuat belanja menjadi lebih mahal', 'Membuat kita tidak bisa memilih makanan'], benar: 0, penjelasan: 'Kebiasaan membaca label membantu kamu membuat pilihan makanan dan minuman yang lebih sadar.' },
        // ===== Tips Sehat Materi 3: Batasi Makanan dan Minuman Tinggi Gula =====
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kenapa teh manis, soda, dan boba perlu dikurangi frekuensinya?', opsi: ['Karena termasuk penyumbang gula terbesar dalam keseharian remaja', 'Karena harganya mahal', 'Karena tidak enak diminum'], benar: 0, penjelasan: 'Teh manis, minuman bersoda, dan boba termasuk penyumbang gula terbesar dalam keseharian remaja.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kira kira berapa kandungan gula dalam satu kaleng minuman bersoda?', opsi: ['Di atas 39 gram', 'Kurang dari 1 gram', 'Sekitar 100 gram'], benar: 0, penjelasan: 'Satu kaleng minuman bersoda bisa mengandung gula di atas 39 gram, hampir menyentuh batas anjuran gula harian.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kue dan roti manis sering dianggap camilan yang aman, padahal?', opsi: ['Adonannya biasanya sudah mengandung gula tambahan yang cukup banyak', 'Kue dan roti manis tidak mengandung gula sama sekali', 'Kue dan roti manis lebih sehat dari buah'], benar: 0, penjelasan: 'Adonan kue dan roti manis biasanya sudah mengandung gula tambahan yang cukup banyak, apalagi kalau ada topping.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kenapa permen dan cokelat perlu dibatasi meski ukurannya kecil?', opsi: ['Karena komponen utamanya hampir seluruhnya gula', 'Karena mengandung banyak vitamin', 'Karena mengandung banyak serat'], benar: 0, penjelasan: 'Permen dan cokelat berukuran kecil, tapi komponen utamanya hampir seluruhnya gula tanpa banyak zat gizi lain.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kira kira berapa kandungan gula dalam satu buah es krim cone?', opsi: ['Sekitar 22 gram', 'Sekitar 1 gram', 'Sekitar 100 gram'], benar: 0, penjelasan: 'Satu buah es krim cone bisa mengandung sekitar 22 gram gula.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Apa yang sebaiknya kamu lakukan terhadap makanan dan minuman manis seperti teh, soda, kue, dan permen?', opsi: ['Boleh dinikmati sesekali, tapi jangan jadi kebiasaan setiap hari', 'Harus dihindari sepenuhnya seumur hidup', 'Boleh dikonsumsi sebanyak apapun setiap hari'], benar: 0, penjelasan: 'Makanan dan minuman manis boleh dinikmati sesekali, asal tidak dijadikan kebiasaan yang dikonsumsi setiap hari.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Selain gula dari makanan kemasan, gula apa lagi yang perlu diperhatikan?', opsi: ['Gula yang ditambahkan sendiri, misalnya ke teh atau kopi', 'Gula yang ada di dalam air putih', 'Gula yang ada di udara'], benar: 0, penjelasan: 'Gula yang kita tambahkan sendiri ke teh, kopi, atau susu buatan sendiri juga termasuk gula tambahan.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kira kira berapa kandungan gula dalam satu sendok teh gula pasir?', opsi: ['Sekitar 4 gram', 'Sekitar 40 gram', 'Sekitar 1 gram saja'], benar: 0, penjelasan: 'Satu sendok teh gula pasir mengandung kira kira 4 gram gula.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Kenapa gula tambahan yang kita tambahkan sendiri sering tidak disadari?', opsi: ['Karena tidak tercantum di label kemasan mana pun', 'Karena rasanya sangat pahit', 'Karena jumlahnya selalu sangat sedikit'], benar: 0, penjelasan: 'Gula yang ditambahkan sendiri tidak tercantum di label kemasan mana pun, sehingga sering luput dari perhatian.' },
        { topik: 'Batasi Makanan dan Minuman Tinggi Gula', pertanyaan: 'Apa inti dari materi membatasi makanan dan minuman tinggi gula?', opsi: ['Bukan soal melarang total, tapi soal menyeimbangkan frekuensi dan porsi', 'Harus berhenti makan semua makanan manis selamanya', 'Boleh makan makanan manis sebanyak mungkin asal enak'], benar: 0, penjelasan: 'Intinya bukan soal melarang total, tapi mengenali mana yang perlu dikurangi frekuensinya dan mana yang cukup dibatasi porsinya.' },
        // ===== Tips Sehat Materi 4: Pilih Camilan dan Bekal yang Lebih Sehat =====
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Camilan apa yang lebih baik dipilih saat jam istirahat di sekolah?', opsi: ['Buah segar', 'Kue manis', 'Permen'], benar: 0, penjelasan: 'Buah segar termasuk camilan yang lebih sehat dibanding kue manis atau permen karena kandungan gulanya lebih rendah.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Selain buah, camilan apa yang bisa jadi alternatif sehat?', opsi: ['Kacang tanpa tambahan gula atau garam berlebih', 'Kue basah dengan banyak topping', 'Minuman bersoda'], benar: 0, penjelasan: 'Kacang tanpa tambahan gula atau garam berlebih, misalnya kacang rebus atau kacang panggang biasa, bisa jadi camilan sehat.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Kenapa sebaiknya kita kurangi kebiasaan membeli kue atau camilan manis di kantin?', opsi: ['Karena bisa menyumbang banyak gula tersembunyi kalau dibeli setiap hari', 'Karena harganya selalu mahal', 'Karena rasanya tidak enak'], benar: 0, penjelasan: 'Kue, roti manis, dan donat bisa menyumbang cukup banyak gula tersembunyi kalau dibeli dan dimakan setiap hari.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Apa manfaat membawa bekal sendiri dari rumah?', opsi: ['Lebih mudah mengontrol porsi dan kandungan gula makanan', 'Membuat kita jadi lebih sering jajan', 'Tidak ada manfaatnya sama sekali'], benar: 0, penjelasan: 'Dengan membawa bekal sendiri, kamu yang menentukan isinya, jadi lebih mudah mengatur porsi dan kandungan gulanya.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Sebutkan salah satu contoh isi bekal sehat yang sederhana.', opsi: ['Nasi atau roti gandum dengan lauk sederhana', 'Sekantong permen dan cokelat', 'Minuman bersoda dan kue manis'], benar: 0, penjelasan: 'Nasi atau roti gandum dengan lauk sederhana seperti telur, ayam, atau tempe tahu adalah contoh bekal sehat yang mudah disiapkan.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Kalau bekalmu berbeda dari bekal teman temanmu, apa yang sebaiknya kamu lakukan?', opsi: ['Tetap percaya diri dengan pilihan bekalmu sendiri', 'Ikut membeli jajanan yang sama seperti teman', 'Malu dan berhenti membawa bekal'], benar: 0, penjelasan: 'Tidak masalah kalau pilihan bekalmu berbeda dari teman, karena kesehatanmu sendiri jauh lebih penting daripada sekadar ikut ikutan.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Saat lapar atau haus di sekolah, apa yang sebaiknya diutamakan terlebih dahulu?', opsi: ['Bekal yang sudah dibawa dari rumah', 'Jajanan manis di kantin', 'Minuman bersoda kemasan'], benar: 0, penjelasan: 'Utamakan dulu bekal yang sudah kamu bawa, atau pilih jajanan dengan kandungan gula yang lebih rendah.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Apakah camilan manis harus dihindari sepenuhnya?', opsi: ['Tidak, cukup kurangi frekuensinya', 'Ya, harus dihindari seumur hidup', 'Tidak masalah dimakan sebanyak apapun'], benar: 0, penjelasan: 'Bukan berarti harus berhenti total, cukup kurangi frekuensinya dan jangan jadikan camilan manis sebagai jajanan wajib setiap hari.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Apa salah satu alasan remaja jadi sering jajan sembarangan?', opsi: ['Pengaruh teman temannya yang jajan bersama sama', 'Karena bekal dari rumah selalu tidak enak', 'Karena kantin sekolah selalu tutup'], benar: 0, penjelasan: 'Salah satu alasan remaja lebih sering jajan sembarangan adalah pengaruh teman sebaya, misalnya saat teman temannya membeli jajanan yang sama.' },
        { topik: 'Pilih Camilan dan Bekal yang Lebih Sehat', pertanyaan: 'Apa inti pesan dari materi memilih camilan dan bekal yang lebih sehat?', opsi: ['Mulai dari langkah kecil, misalnya sesekali bawa bekal dari rumah', 'Harus langsung mengganti semua camilan sekaligus', 'Camilan dan bekal tidak berpengaruh pada kesehatan'], benar: 0, penjelasan: 'Coba mulai dari langkah paling gampang, misalnya sesekali bawa bekal dari rumah atau ganti satu camilan manis dengan buah, sebelum menerapkan semuanya sekaligus.' },
        // ===== Tips Sehat Materi 5: Biasakan Aktif Bergerak =====
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Berapa lama aktivitas fisik yang dianjurkan WHO untuk anak dan remaja usia 5 sampai 17 tahun setiap hari?', opsi: ['Sekitar 60 menit', 'Sekitar 5 menit', 'Sekitar 5 jam'], benar: 0, penjelasan: 'WHO menganjurkan anak dan remaja usia 5 sampai 17 tahun melakukan aktivitas fisik sedang hingga berat rata rata 60 menit setiap hari.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Bagaimana cara memenuhi target 60 menit aktivitas fisik setiap hari?', opsi: ['Bisa dicicil dari beberapa kegiatan sepanjang hari', 'Harus dilakukan sekaligus tanpa jeda', 'Hanya bisa dipenuhi lewat satu jenis olahraga saja'], benar: 0, penjelasan: 'Target 60 menit bisa dicicil dari beberapa kegiatan sepanjang hari, misalnya jalan kaki ke sekolah, bermain saat istirahat, dan berolahraga sore hari.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Apa manfaat aktivitas fisik terhadap kerja insulin dalam tubuh?', opsi: ['Membantu sel tubuh lebih peka terhadap insulin', 'Membuat tubuh berhenti membutuhkan insulin', 'Membuat insulin berubah menjadi gula'], benar: 0, penjelasan: 'Tubuh yang aktif bergerak membantu sel lebih peka terhadap insulin, sehingga gula darah lebih mudah terkontrol.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Selain menyehatkan tubuh, apa manfaat aktivitas fisik untuk suasana hati?', opsi: ['Membantu mengurangi stres dan membuat mood lebih baik', 'Membuat mood menjadi lebih buruk', 'Tidak ada pengaruhnya sama sekali'], benar: 0, penjelasan: 'Bergerak aktif juga membantu mengurangi stres dan membuat suasana hati terasa lebih ringan.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Apa yang sebaiknya kamu lakukan saat pelajaran PJOK di sekolah?', opsi: ['Ikut aktif bergerak, bukan sekadar duduk menonton teman bermain', 'Duduk diam sambil menonton teman yang bermain', 'Meminta izin pulang lebih awal'], benar: 0, penjelasan: 'Ikut aktif bergerak saat pelajaran PJOK adalah langkah paling sederhana untuk memenuhi kebutuhan aktivitas fisik harianmu.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Apa manfaat mengikuti ekstrakurikuler olahraga di sekolah?', opsi: ['Membantu tetap aktif bergerak rutin di luar jam pelajaran', 'Membuat waktu belajar jadi berkurang tanpa manfaat lain', 'Tidak ada hubungannya dengan kebiasaan bergerak aktif'], benar: 0, penjelasan: 'Sebuah penelitian menemukan siswa yang mengikuti ekstrakurikuler olahraga cenderung lebih aktif bergerak sehari hari dan mengurangi waktu bermain gawai.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Kenapa bergerak aktif bersama teman biasanya lebih mudah bertahan lama?', opsi: ['Karena terasa menyenangkan dan kalian bisa saling mengingatkan', 'Karena wajib dilakukan sesuai jadwal sekolah', 'Karena tidak membutuhkan tenaga sama sekali'], benar: 0, penjelasan: 'Bergerak bersama teman membuat fokusmu ada pada kesenangan bermain, dan kalian bisa saling mengingatkan serta menagih janji satu sama lain.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Sebutkan salah satu contoh kesempatan bergerak kecil sehari hari selain olahraga terjadwal.', opsi: ['Naik tangga daripada naik lift atau eskalator', 'Duduk diam seharian di kamar', 'Menambah waktu tidur siang'], benar: 0, penjelasan: 'Naik turun tangga termasuk salah satu aktivitas rutin sederhana yang dianjurkan selain olahraga terjadwal.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Berapa target jalan kaki harian yang dianjurkan Kementerian Kesehatan RI?', opsi: ['Setidaknya 10.000 langkah per hari', 'Setidaknya 100 langkah per hari', 'Tidak ada target langkah harian'], benar: 0, penjelasan: 'Kementerian Kesehatan RI menganjurkan target jalan kaki setidaknya 10.000 langkah per hari sebagai salah satu ukuran aktivitas fisik harian.' },
        { topik: 'Biasakan Aktif Bergerak', pertanyaan: 'Apa inti pesan dari materi membiasakan aktif bergerak?', opsi: ['Mulai dari kebiasaan bergerak paling mudah, lalu tambah sedikit demi sedikit', 'Harus langsung berolahraga berat setiap hari', 'Aktivitas fisik hanya penting kalau ikut lomba'], benar: 0, penjelasan: 'Kamu tidak perlu langsung berolahraga berat setiap hari. Mulai dari kebiasaan bergerak yang paling mudah, lalu perlahan tambah dengan olahraga favoritmu.' },
        // ===== Tips Sehat Materi 6: Kurangi Duduk dan Screen Time =====
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Apa itu perilaku sedentari?', opsi: ['Kebiasaan duduk atau berbaring lama dengan sedikit gerakan', 'Kebiasaan berolahraga setiap hari', 'Kebiasaan berjalan kaki ke sekolah'], benar: 0, penjelasan: 'Perilaku sedentari adalah istilah untuk kebiasaan menghabiskan banyak waktu dalam posisi duduk atau berbaring dengan sedikit gerakan.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Berapa batas waktu layar untuk hiburan yang dianjurkan WHO bagi anak dan remaja?', opsi: ['Tidak lebih dari 2 jam per hari', 'Tidak lebih dari 10 jam per hari', 'Tidak ada batasnya sama sekali'], benar: 0, penjelasan: 'WHO menganjurkan waktu layar untuk hiburan tidak lebih dari 2 jam per hari bagi anak dan remaja, di luar kebutuhan belajar.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Apa yang bisa terjadi kalau waktu duduk dan waktu layar harianmu semakin lama?', opsi: ['Sel sel tubuh berisiko lebih sulit merespons insulin', 'Tubuh jadi otomatis lebih sehat', 'Kebutuhan gula tubuh jadi berkurang'], benar: 0, penjelasan: 'Semakin lama waktu duduk dan waktu layar harianmu, semakin besar juga kemungkinan sel sel tubuh mengalami resistensi insulin.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Selain berkaitan dengan gula darah, apa dampak lain waktu layar berlebihan?', opsi: ['Bisa mengganggu pola tidur', 'Membuat penglihatan menjadi lebih tajam', 'Membuat waktu belajar jadi lebih panjang'], benar: 0, penjelasan: 'Paparan cahaya layar yang terlalu lama bisa mengganggu hormon pengatur tidur, sehingga kualitas tidur ikut menurun.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Apa yang sebaiknya dilakukan setiap sekitar 30 menit sekali kalau sedang duduk lama?', opsi: ['Berdiri atau bergerak sebentar', 'Menambah waktu duduk menjadi lebih lama', 'Menutup mata sambil tetap duduk'], benar: 0, penjelasan: 'Para ahli kesehatan menyarankan untuk berdiri atau bergerak sebentar setiap sekitar 30 menit sekali kalau sedang duduk lama.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Sebutkan salah satu cara sederhana mengurangi kebiasaan main HP berlebihan.', opsi: ['Matikan notifikasi aplikasi yang tidak penting', 'Menambah jumlah aplikasi yang terpasang', 'Menyalakan semua notifikasi supaya lebih ramai'], benar: 0, penjelasan: 'Mematikan notifikasi aplikasi yang tidak penting membantu supaya kamu tidak terus tergoda membuka HP setiap beberapa menit.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Selain main HP, kegiatan apa lagi yang termasuk kategori waktu layar?', opsi: ['Menonton TV', 'Membaca buku cetak', 'Berjalan kaki di taman'], benar: 0, penjelasan: 'WHO menyebut menonton televisi sebagai salah satu contoh utama perilaku sedentari yang perlu dibatasi.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Bagaimana cara mengisi waktu luang dengan lebih sehat selain duduk main HP?', opsi: ['Ganti dengan bersepeda santai, jalan jalan, atau olahraga ringan', 'Menambah durasi main HP di waktu luang', 'Tidur seharian penuh saat waktu luang'], benar: 0, penjelasan: 'Waktu luang sebenarnya kesempatan bagus untuk menambah aktivitas fisik harianmu, misalnya bersepeda santai atau olahraga ringan.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Kenapa mengajak teman bisa membantu mengurangi kebiasaan duduk dan screen time?', opsi: ['Karena kegiatan bergerak jadi lebih mudah dan menyenangkan dilakukan bersama', 'Karena teman akan menyuruh kita berhenti bermain HP selamanya', 'Karena mengajak teman tidak ada pengaruhnya sama sekali'], benar: 0, penjelasan: 'Ajakan sederhana seperti mengajak main di luar bisa jadi langkah kecil yang efektif untuk saling membantu mengurangi waktu duduk dan screen time bersama.' },
        { topik: 'Kurangi Duduk dan Screen Time', pertanyaan: 'Apa inti pesan dari materi mengurangi duduk dan screen time?', opsi: ['Bukan berhenti total, tapi menyeimbangkan waktu layar dengan aktivitas fisik', 'Harus berhenti main HP dan nonton TV selamanya', 'Duduk lama tidak berpengaruh apapun pada kesehatan'], benar: 0, penjelasan: 'Mengurangi duduk dan screen time bukan berarti harus berhenti total, yang penting adalah menjaga keseimbangan dengan aktivitas fisik setiap hari.' }
    ];
    let kuisBagIndeks = [];
    // Mengacak urutan pilihan jawaban tiap soal ditampilkan, supaya posisi
    // jawaban benar tidak selalu di pilihan pertama. Indeks "benar" ikut
    // disesuaikan mengikuti urutan baru. Data asli QUESTION_BANK tidak
    // diubah — soal yang sama bisa dapat urutan pilihan berbeda tiap muncul.
    function acakUrutanOpsi(soal) {
        const opsiDenganAsal = soal.opsi.map((teks, i) => ({ teks, asli: i }));
        for (let i = opsiDenganAsal.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opsiDenganAsal[i], opsiDenganAsal[j]] = [opsiDenganAsal[j], opsiDenganAsal[i]];
        }
        return {
            ...soal,
            opsi: opsiDenganAsal.map(o => o.teks),
            benar: opsiDenganAsal.findIndex(o => o.asli === soal.benar)
        };
    }
    function ambilSoalAcak() {
        if (QUESTION_BANK.length === 0) return null;
        if (kuisBagIndeks.length === 0) {
            kuisBagIndeks = QUESTION_BANK.map((_, i) => i);
            for (let i = kuisBagIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [kuisBagIndeks[i], kuisBagIndeks[j]] = [kuisBagIndeks[j], kuisBagIndeks[i]];
            }
        }
        return acakUrutanOpsi(QUESTION_BANK[kuisBagIndeks.pop()]);
    }
    const PAPAN_DATA = [
        { tipe: 'mulai', ikon: '🏁', label: 'Mulai' },
        { tipe: 'kuis', ikon: '💉', label: 'Kuis' },
        { tipe: 'info', ikon: '📌', label: 'Fakta' },
        { tipe: 'kuis', ikon: '🥤', label: 'Kuis' },
        { tipe: 'bonus', ikon: '💧', label: 'Bonus', langkah: 2 },
        { tipe: 'checkpoint', ikon: '🩺', label: 'Hidup Sehat', poin: 10 },
        { tipe: 'kuis', ikon: '⚠️', label: 'Kuis' },
        { tipe: 'jebakan', ikon: '🍩', label: 'Jebakan', langkah: -2 },
        { tipe: 'info', ikon: '🥫', label: 'Fakta' },
        { tipe: 'kuis', ikon: '🍇', label: 'Kuis' },
        { tipe: 'checkpoint', ikon: '🦷', label: 'Hidup Sehat', poin: 10 },
        { tipe: 'kuis', ikon: '🏷️', label: 'Kuis' },
        { tipe: 'bonus', ikon: '🚶', label: 'Bonus', langkah: 1 },
        { tipe: 'info', ikon: '🍞', label: 'Fakta' },
        { tipe: 'kuis', ikon: '🧬', label: 'Kuis' },
        { tipe: 'checkpoint', ikon: '⚡', label: 'Hidup Sehat', poin: 10 },
        { tipe: 'kuis', ikon: '🍭', label: 'Kuis' },
        { tipe: 'jebakan', ikon: '🌙', label: 'Jebakan', langkah: -1 },
        { tipe: 'kuis', ikon: '🩺', label: 'Kuis' },
        { tipe: 'jebakan', ikon: '🥯', label: 'Jebakan', langkah: -1 }
    ];
    // ===== Bank Fakta untuk kotak "Tahukah Kamu?" (tipe: 'info') di papan.
    // Dipilih acak (sistem "bag", tidak berulang sebelum semua tampil sekali)
    // tiap kali pemain berhenti di kotak fakta manapun — supaya walau
    // berhenti berkali-kali di kotak yang sama, faktanya tidak selalu sama. =====
    // Diisi bertahap per materi. Tambahkan fakta baru di sini nanti, satu
    // per satu, dengan format:
    // { ikon: '📌', teks: 'Isi fakta singkat di sini.' }
    const FAKTA_KOTAK_INFO = [
        // ===== Materi 1: Kenali Diabetes Melitus Tipe 2 (DMT2) =====
        { ikon: '🩺', teks: 'DMT2 dulu identik dengan usia dewasa, tapi kini kasusnya juga meningkat 2–3 kali lipat pada remaja dibanding sekitar 30 tahun lalu.' },
        { ikon: '🔑', teks: 'Insulin diibaratkan seperti kunci yang membuka "pintu" sel supaya glukosa bisa masuk. Pada DMT2, gemboknya jadi seret alias sel jadi kurang peka pada insulin.' },
        { ikon: '⏳', teks: 'DMT2 bersifat kronis alias jangka panjang, tapi kabar baiknya risikonya bisa dikendalikan dan dicegah lebih awal lewat pola makan dan aktivitas fisik.' },
        // ===== Materi 2: Kenali Gejala dan Bahaya Diabetes =====
        { ikon: '🔤', teks: 'Istilah 3P (Poliuria, Polidipsia, Polifagia) adalah gejala klasik DMT2: sering buang air kecil, sering haus, dan sering lapar berlebihan.' },
        { ikon: '🔄', teks: 'Gejala 3P sebenarnya saling berhubungan seperti reaksi berantai. Semuanya dimulai dari glukosa yang menumpuk di darah karena sel sulit menyerapnya.' },
        { ikon: '🦵', teks: 'Diabetes yang tidak terkontrol bisa merusak saraf dan pembuluh darah, menyebabkan kesemutan hingga gangguan sirkulasi di tangan dan kaki.' },
        // ===== Materi 3: Gula, Makanan, dan Minuman yang Perlu Dibatasi =====
        { ikon: '➕', teks: 'Gula tambahan (added sugar) adalah gula yang sengaja ditambahkan ke makanan/minuman, baik oleh pabrik, penjual, maupun diri sendiri.' },
        { ikon: '🍯', teks: 'Gula bebas mencakup gula tambahan plus gula alami dalam madu, sirup, dan jus buah. Gula dalam buah utuh tidak termasuk di dalamnya.' },
        { ikon: '🍎', teks: 'Gula dalam buah utuh ditemani serat yang memperlambat penyerapannya, beda dengan gula tambahan pada permen atau minuman manis yang diserap lebih cepat.' },
        // ===== Materi 4: Batas Konsumsi Gula dan Cara Membaca Label =====
        { ikon: '🥄', teks: 'Batas anjuran gula tambahan dari Kemenkes RI adalah 50 gram atau setara 4 sendok makan per hari.' },
        { ikon: '🏷️', teks: 'Angka gula di label kemasan biasanya untuk satu takaran saji, bukan untuk satu kemasan penuh.' },
        { ikon: '🧮', teks: 'Cara menghitung total gula dalam satu kemasan itu mudah. Tinggal kalikan gula per sajian dengan jumlah sajian per kemasan.' },
        // ===== Materi 5: Aktivitas Fisik untuk Mencegah DMT2 =====
        { ikon: '🏃', teks: 'Aktivitas fisik adalah semua gerakan tubuh yang memakai energi, bukan cuma olahraga di lapangan.' },
        { ikon: '⏱️', teks: 'WHO menganjurkan remaja bergerak aktif minimal 60 menit setiap hari dengan intensitas sedang hingga berat.' },
        { ikon: '🪑', teks: 'Duduk terlalu lama tanpa gerakan disebut perilaku sedentari. Sebaiknya diselingi berdiri atau jalan setiap 1 sampai 2 jam.' },
        // ===== Materi 6: Membangun Kebiasaan Hidup Sehat Sejak Remaja =====
        { ikon: '🧩', teks: 'Materi 1 sampai 5 itu seperti potongan puzzle. Materi 6 ini menyatukan semuanya jadi satu kebiasaan hidup sehat yang utuh.' },
        { ikon: '🕸️', teks: 'Kebiasaan sehat itu saling berkaitan seperti jaring laba-laba. Makin banyak yang terhubung, makin kuat menahan risiko DMT2.' },
        { ikon: '🔁', teks: 'Kebiasaan sehat bukan soal sempurna atau ekstrem, tapi soal konsisten dijalani dalam jangka panjang.' },
        // ===== Tips Sehat Materi 1: Pilih Minuman yang Lebih Sehat =====
        { ikon: '💧', teks: 'Air putih adalah minuman paling aman untuk diminum setiap hari karena tidak mengandung gula maupun kalori tambahan.' },
        { ikon: '🚰', teks: 'Remaja usia 10 sampai 18 tahun membutuhkan sekitar 1.850 sampai 2.150 mililiter cairan setiap hari.' },
        { ikon: '🏷️', teks: 'Melihat label gizi sebelum membeli minuman kemasan membantu kamu tahu jumlah gula yang akan kamu minum.' },
        // ===== Tips Sehat Materi 2: Cek Label Sebelum Membeli =====
        { ikon: '🏷️', teks: 'Setiap makanan dan minuman kemasan wajib mencantumkan label Informasi Nilai Gizi.' },
        { ikon: '🔍', teks: 'Ada empat langkah membaca label sebelum membeli, yaitu cari, lihat, cek, dan bandingkan.' },
        { ikon: '📦', teks: 'Gula per sajian bukan berarti gula dari seluruh kemasan, karena satu kemasan bisa berisi beberapa sajian.' },
        // ===== Tips Sehat Materi 3: Batasi Makanan dan Minuman Tinggi Gula =====
        { ikon: '🧋', teks: 'Satu porsi milk tea dengan topping boba bisa mengandung sekitar 38 gram gula.' },
        { ikon: '🥤', teks: 'Satu kaleng minuman bersoda bisa mengandung gula di atas 39 gram, hampir mendekati batas anjuran gula harian.' },
        { ikon: '🍨', teks: 'Satu buah es krim cone bisa mengandung sekitar 22 gram gula.' },
        // ===== Tips Sehat Materi 4: Pilih Camilan dan Bekal yang Lebih Sehat =====
        { ikon: '🍌', teks: 'Buah seperti pisang atau apel bisa langsung dimasukkan ke tas tanpa perlu diolah dulu, cocok jadi camilan praktis.' },
        { ikon: '🍱', teks: 'Anak yang lebih sering membawa bekal dari rumah cenderung lebih jarang jajan sembarangan di sekolah.' },
        { ikon: '🥜', teks: 'Kacang panggang tanpa tambahan gula atau garam berlebih bisa jadi camilan sehat pengganti jajanan manis.' },
        // ===== Tips Sehat Materi 5: Biasakan Aktif Bergerak =====
        { ikon: '❤️', teks: 'Aktivitas fisik rutin melatih jantung dan paru paru, sehingga stamina harianmu ikut meningkat.' },
        { ikon: '🎽', teks: 'Siswa yang aktif ikut ekstrakurikuler olahraga cenderung lebih aktif bergerak sehari hari dan mengurangi waktu bermain gawai.' },
        { ikon: '😊', teks: 'Bergerak aktif juga membantu mengurangi stres dan membuat suasana hati terasa lebih ringan.' },
        // ===== Tips Sehat Materi 6: Kurangi Duduk dan Screen Time =====
        { ikon: '💉', teks: 'Penelitian pada remaja di Surabaya dan Sidoarjo menemukan risiko resistensi insulin meningkat sekitar 4 kali lipat pada kelompok dengan waktu layar tinggi.' },
        { ikon: '⏱️', teks: 'WHO menganjurkan waktu layar untuk hiburan tidak lebih dari 2 jam per hari bagi anak dan remaja.' },
        { ikon: '📺', teks: 'Menonton TV termasuk salah satu contoh utama perilaku sedentari yang perlu dibatasi.' }
    ];
    let bagFaktaKotakIndeks = [];
    function ambilFaktaKotakAcak() {
        if (FAKTA_KOTAK_INFO.length === 0) return null;
        if (bagFaktaKotakIndeks.length === 0) {
            bagFaktaKotakIndeks = FAKTA_KOTAK_INFO.map((_, i) => i);
            for (let i = bagFaktaKotakIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagFaktaKotakIndeks[i], bagFaktaKotakIndeks[j]] = [bagFaktaKotakIndeks[j], bagFaktaKotakIndeks[i]];
            }
        }
        return FAKTA_KOTAK_INFO[bagFaktaKotakIndeks.pop()];
    }
    // ===== Bank variasi kejadian untuk kotak "Bonus" dan "Jebakan".
    // Sama seperti FAKTA_KOTAK_INFO, dipilih acak (sistem "bag") tiap kali
    // pemain berhenti di kotak bonus/jebakan manapun — supaya kalimatnya
    // nggak itu-itu aja walau berhenti berkali-kali di kotak yang sama.
    // Jumlah langkah maju/mundur tetap ikut data kotaknya (tile.langkah),
    // cuma kalimat & ikon ceritanya yang diacak. =====
    // Diisi bertahap per materi. Tambahkan kejadian baru di sini nanti, satu
    // per satu, dengan format:
    // { ikon: '💧', teks: 'Kalimat cerita singkat di sini.' }
    const BONUS_KEJADIAN = [
        // ===== Materi 1: Kenali Diabetes Melitus Tipe 2 (DMT2) =====
        { ikon: '🚶', teks: 'Kamu menyempatkan diri jalan kaki atau bergerak aktif hari ini.' },
        { ikon: '🥗', teks: 'Kamu memilih porsi makan seimbang, nggak berlebihan kalori.' },
        { ikon: '🌱', teks: 'Kamu mulai membiasakan pola hidup sehat sejak sekarang, bukan menunggu nanti.' },
        // ===== Materi 2: Kenali Gejala dan Bahaya Diabetes =====
        { ikon: '🗣️', teks: 'Kamu cerita ke orang tua atau guru begitu merasakan gejala yang tidak biasa pada tubuhmu.' },
        { ikon: '🩺', teks: 'Kamu memeriksakan diri ke tenaga kesehatan saat merasa ada yang tidak beres.' },
        { ikon: '📖', teks: 'Kamu mencari tahu lebih dulu soal gejala 3P supaya lebih waspada sejak dini.' },
        // ===== Materi 3: Gula, Makanan, dan Minuman yang Perlu Dibatasi =====
        { ikon: '🍎', teks: 'Kamu memilih buah segar sebagai camilan, bukan permen atau cokelat.' },
        { ikon: '🏷️', teks: 'Kamu mulai memperhatikan kandungan gula tambahan sebelum membeli makanan/minuman kemasan.' },
        { ikon: '💧', teks: 'Kamu mengurangi minuman manis dan menggantinya dengan air putih hari ini.' },
        // ===== Materi 4: Batas Konsumsi Gula dan Cara Membaca Label =====
        { ikon: '🏷️', teks: 'Kamu membaca label Informasi Nilai Gizi sebelum membeli makanan atau minuman kemasan.' },
        { ikon: '🧮', teks: 'Kamu menghitung dulu total gula dalam kemasan sebelum menghabiskannya.' },
        { ikon: '⚖️', teks: 'Kamu membandingkan dua produk dan memilih yang kandungan gulanya lebih rendah.' },
        // ===== Materi 5: Aktivitas Fisik untuk Mencegah DMT2 =====
        { ikon: '🚶', teks: 'Kamu memilih jalan kaki ke sekolah atau ke tempat dekat lainnya.' },
        { ikon: '🪜', teks: 'Kamu naik tangga daripada naik lift atau eskalator hari ini.' },
        { ikon: '🧹', teks: 'Kamu membantu pekerjaan rumah seperti menyapu atau mengepel.' },
        // ===== Materi 6: Membangun Kebiasaan Hidup Sehat Sejak Remaja =====
        { ikon: '🎒', teks: 'Kamu membawa botol minum sendiri supaya lebih gampang minum air putih.' },
        { ikon: '🍱', teks: 'Kamu membawa bekal dari rumah supaya isinya lebih terkontrol.' },
        { ikon: '🤔', teks: 'Kamu cek dulu kandungan gizi sebelum ikut coba camilan atau minuman yang sedang viral.' },
        // ===== Tips Sehat Materi 1: Pilih Minuman yang Lebih Sehat =====
        { ikon: '💧', teks: 'Kamu memilih minum air putih daripada minuman manis hari ini.' },
        { ikon: '🎒', teks: 'Kamu membawa botol air putih sendiri dari rumah.' },
        { ikon: '🏷️', teks: 'Kamu membaca label gula sebelum membeli minuman kemasan.' },
        // ===== Tips Sehat Materi 2: Cek Label Sebelum Membeli =====
        { ikon: '🔍', teks: 'Kamu mencari bagian informasi nilai gizi sebelum membeli kemasan.' },
        { ikon: '⚖️', teks: 'Kamu membandingkan dua produk lalu memilih yang gulanya lebih rendah.' },
        { ikon: '📦', teks: 'Kamu mengecek jumlah sajian dalam satu kemasan sebelum menghabiskannya.' },
        // ===== Tips Sehat Materi 3: Batasi Makanan dan Minuman Tinggi Gula =====
        { ikon: '🍎', teks: 'Kamu memilih buah segar daripada kue manis sebagai camilan hari ini.' },
        { ikon: '🧋', teks: 'Kamu mengurangi frekuensi minum boba atau minuman kekinian.' },
        { ikon: '🥄', teks: 'Kamu mengurangi takaran gula pasir yang kamu tambahkan sendiri ke minuman.' },
        // ===== Tips Sehat Materi 4: Pilih Camilan dan Bekal yang Lebih Sehat =====
        { ikon: '🍱', teks: 'Kamu membawa bekal sehat dari rumah untuk bekal istirahat hari ini.' },
        { ikon: '🍎', teks: 'Kamu memilih buah atau kacang sebagai camilan, bukan kue manis di kantin.' },
        { ikon: '💪', teks: 'Kamu tetap percaya diri membawa bekal sendiri, walau teman temanmu memilih jajan.' },
        // ===== Tips Sehat Materi 5: Biasakan Aktif Bergerak =====
        { ikon: '🏃', teks: 'Kamu ikut aktif bergerak saat pelajaran PJOK, bukan cuma duduk menonton teman bermain.' },
        { ikon: '👫', teks: 'Kamu mengajak teman untuk jalan kaki atau main bulu tangkis bersama.' },
        { ikon: '🚴', teks: 'Kamu memilih naik sepeda atau jalan kaki dibanding naik kendaraan untuk jarak dekat.' },
        // ===== Tips Sehat Materi 6: Kurangi Duduk dan Screen Time =====
        { ikon: '🧍', teks: 'Kamu berdiri dan meregangkan tubuh sebentar setelah duduk lama mengerjakan tugas.' },
        { ikon: '👫', teks: 'Kamu memilih main di luar rumah bersama teman, bukan cuma duduk main HP.' },
        { ikon: '🔕', teks: 'Kamu mematikan notifikasi aplikasi yang tidak penting supaya tidak terus tergoda membuka HP.' }
    ];
    let bagBonusIndeks = [];
    function ambilBonusAcak() {
        if (BONUS_KEJADIAN.length === 0) return null;
        if (bagBonusIndeks.length === 0) {
            bagBonusIndeks = BONUS_KEJADIAN.map((_, i) => i);
            for (let i = bagBonusIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagBonusIndeks[i], bagBonusIndeks[j]] = [bagBonusIndeks[j], bagBonusIndeks[i]];
            }
        }
        return BONUS_KEJADIAN[bagBonusIndeks.pop()];
    }
    // Diisi bertahap per materi. Tambahkan kejadian baru di sini nanti, satu
    // per satu, dengan format:
    // { ikon: '🍩', teks: 'Kalimat cerita singkat di sini.' }
    const JEBAKAN_KEJADIAN = [
        // ===== Materi 1: Kenali Diabetes Melitus Tipe 2 (DMT2) =====
        { ikon: '🛋️', teks: 'Kamu rebahan seharian sambil main HP tanpa banyak bergerak.' },
        { ikon: '🍩', teks: 'Kamu sering ngemil makanan tinggi kalori tanpa memperhatikan porsinya.' },
        { ikon: '💺', teks: 'Kamu duduk berjam-jam tanpa jeda buat berdiri atau jalan sebentar.' },
        // ===== Materi 2: Kenali Gejala dan Bahaya Diabetes =====
        { ikon: '🙈', teks: 'Kamu menganggap remeh rasa haus dan lapar berlebihan yang sering muncul akhir-akhir ini.' },
        { ikon: '🤐', teks: 'Kamu memilih diam saja walau sering bolak-balik ke kamar mandi di malam hari.' },
        { ikon: '⏰', teks: 'Kamu menunda periksa ke tenaga kesehatan padahal gejala sudah muncul berulang kali.' },
        // ===== Materi 3: Gula, Makanan, dan Minuman yang Perlu Dibatasi =====
        { ikon: '🧋', teks: 'Kamu minum boba atau minuman manis kemasan berkali-kali dalam seminggu.' },
        { ikon: '🍬', teks: 'Kamu memilih permen atau cokelat sebagai camilan hampir setiap hari.' },
        { ikon: '🥤', teks: 'Kamu mengganti air putih dengan soda atau teh manis setiap kali haus.' },
        // ===== Materi 4: Batas Konsumsi Gula dan Cara Membaca Label =====
        { ikon: '📦', teks: 'Kamu menghabiskan satu kemasan minuman manis tanpa melihat berapa sajian di dalamnya.' },
        { ikon: '🍪', teks: 'Kamu menganggap remeh camilan kecil, padahal kamu memakannya berkali-kali dalam sehari.' },
        { ikon: '👀', teks: 'Kamu membeli makanan kemasan tanpa pernah membaca label Informasi Nilai Gizinya.' },
        // ===== Materi 5: Aktivitas Fisik untuk Mencegah DMT2 =====
        { ikon: '🛗', teks: 'Kamu selalu naik lift atau eskalator padahal ada tangga yang bisa dipakai.' },
        { ikon: '🎮', teks: 'Kamu memilih main gim duduk berjam-jam daripada main aktif di luar.' },
        { ikon: '🚌', teks: 'Kamu naik kendaraan untuk jarak dekat yang sebenarnya bisa ditempuh dengan jalan kaki.' },
        // ===== Materi 6: Membangun Kebiasaan Hidup Sehat Sejak Remaja =====
        { ikon: '📲', teks: 'Kamu ikut-ikutan tren minuman manis viral di media sosial tanpa cek dulu kandungan gulanya.' },
        { ikon: '🍟', teks: 'Kamu ngemil terus-menerus sambil main gawai atau nonton tanpa sadar porsinya.' },
        { ikon: '🥤', teks: 'Kamu memilih minuman manis kemasan daripada air putih walau sedang tidak terlalu haus.' },
        // ===== Tips Sehat Materi 1: Pilih Minuman yang Lebih Sehat =====
        { ikon: '🧋', teks: 'Kamu minum boba atau minuman kekinian yang manis setiap hari.' },
        { ikon: '🥤', teks: 'Kamu memilih minuman bersoda daripada air putih saat haus.' },
        { ikon: '🍵', teks: 'Kamu menambahkan banyak gula ke teh buatanmu tanpa disadari.' },
        // ===== Tips Sehat Materi 2: Cek Label Sebelum Membeli =====
        { ikon: '👀', teks: 'Kamu membeli makanan kemasan tanpa pernah melihat label informasi nilai gizinya.' },
        { ikon: '📦', teks: 'Kamu menghabiskan satu kemasan penuh tanpa sadar kemasan itu berisi beberapa sajian.' },
        { ikon: '🤷', teks: 'Kamu mengira jus buah kemasan pasti rendah gula hanya karena ada tulisan vitamin di kemasannya.' },
        // ===== Tips Sehat Materi 3: Batasi Makanan dan Minuman Tinggi Gula =====
        { ikon: '🍩', teks: 'Kamu makan donat cokelat dan kue manis hampir setiap hari.' },
        { ikon: '🍬', teks: 'Kamu menghabiskan banyak butir permen atau cokelat tanpa menghitung jumlahnya.' },
        { ikon: '🍨', teks: 'Kamu menjadikan es krim sebagai menu penutup setiap hari.' },
        // ===== Tips Sehat Materi 4: Pilih Camilan dan Bekal yang Lebih Sehat =====
        { ikon: '🧁', teks: 'Kamu membeli kue manis di kantin setiap hari tanpa membawa bekal sama sekali.' },
        { ikon: '👀', teks: 'Kamu ikut membeli jajanan manis hanya karena teman temanmu membelinya juga.' },
        { ikon: '🥤', teks: 'Kamu memilih minuman manis sebagai pilihan utama saat istirahat, padahal sudah bawa bekal dari rumah.' },
        // ===== Tips Sehat Materi 5: Biasakan Aktif Bergerak =====
        { ikon: '💺', teks: 'Kamu memilih diam duduk menonton saja saat pelajaran PJOK, bukan ikut bergerak aktif bersama teman.' },
        { ikon: '🎮', teks: 'Kamu melewatkan latihan ekstrakurikuler olahraga demi main gawai berjam jam di rumah.' },
        { ikon: '🚗', teks: 'Kamu memilih naik kendaraan untuk pergi ke tempat yang sebenarnya dekat dan bisa dijalani kaki.' },
        // ===== Tips Sehat Materi 6: Kurangi Duduk dan Screen Time =====
        { ikon: '📱', teks: 'Kamu main HP sambil rebahan selama berjam jam tanpa jeda.' },
        { ikon: '📺', teks: 'Kamu menonton TV terus menerus sampai lupa waktu belajar atau istirahat.' },
        { ikon: '🪑', teks: 'Kamu tetap duduk diam tanpa berdiri walau sudah lebih dari satu jam mengerjakan tugas.' }
    ];
    let bagJebakanIndeks = [];
    function ambilJebakanAcak() {
        if (JEBAKAN_KEJADIAN.length === 0) return null;
        if (bagJebakanIndeks.length === 0) {
            bagJebakanIndeks = JEBAKAN_KEJADIAN.map((_, i) => i);
            for (let i = bagJebakanIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagJebakanIndeks[i], bagJebakanIndeks[j]] = [bagJebakanIndeks[j], bagJebakanIndeks[i]];
            }
        }
        return JEBAKAN_KEJADIAN[bagJebakanIndeks.pop()];
    }
    // ===== Bank variasi konten untuk kotak "Hidup Sehat" (checkpoint, 4 kotak
    // sudut papan). Sama seperti bank fakta/bonus/jebakan, dipilih acak
    // (sistem "bag") tiap kali pemain berhenti di kotak Hidup Sehat manapun.
    // Poin +10 tetap didapat otomatis lewat tile.poin, cuma kalimat & ikon
    // ceritanya yang diacak dari bank ini. Diisi bertahap per materi, dengan
    // format:
    // { ikon: '🩺', teks: 'Kalimat tips hidup sehat singkat di sini.' }
    const HIDUP_SEHAT_KEJADIAN = [
        // ===== Materi 1: Kenali Diabetes Melitus Tipe 2 (DMT2) =====
        { ikon: '🩺', teks: 'Kenali dulu apa itu DMT2 sejak sekarang, supaya kamu makin sadar pentingnya mencegah sejak remaja.' },
        { ikon: '🦷', teks: 'Menjaga kebiasaan sehat sejak remaja membantu mencegah berbagai gangguan kesehatan di masa depan, termasuk risiko DMT2.' },
        { ikon: '⚡', teks: 'Sel tubuh yang peka terhadap insulin membantu energi dari glukosa tersalurkan dengan baik ke seluruh tubuh.' },
        // ===== Materi 2: Kenali Gejala dan Bahaya Diabetes =====
        { ikon: '🔍', teks: 'Kenali gejala 3P sejak dini, yaitu poliuria, polidipsia, dan polifagia, supaya bisa segera ditangani sebelum jadi lebih serius.' },
        { ikon: '🩺', teks: 'Jangan anggap remeh sinyal dari tubuhmu. Periksa ke tenaga kesehatan kalau gejala muncul berlebihan atau menetap.' },
        { ikon: '❤️', teks: 'Mengendalikan gula darah sejak dini membantu mencegah komplikasi serius seperti kerusakan ginjal, jantung, dan stroke.' },
        // ===== Materi 3: Gula, Makanan, dan Minuman yang Perlu Dibatasi =====
        { ikon: '🍬', teks: 'Manis boleh, tapi jangan berlebihan. Batasi jumlah dan frekuensi makanan atau minuman manis dalam keseharianmu.' },
        { ikon: '⚖️', teks: 'Pola makan tinggi gula yang terus-menerus berhubungan dengan risiko kelebihan berat badan dan resistensi insulin.' },
        { ikon: '🍎', teks: 'Ganti camilan manis dengan buah segar sesekali. Gulanya lebih lambat diserap berkat kandungan seratnya.' },
        // ===== Materi 4: Batas Konsumsi Gula dan Cara Membaca Label =====
        { ikon: '🥄', teks: 'Ingat batas gula tambahan harian, yaitu maksimal 50 gram atau 4 sendok makan, supaya kamu bisa lebih bijak memilih makanan dan minuman.' },
        { ikon: '🏷️', teks: 'Biasakan membaca label kemasan sebelum membeli. Kebiasaan kecil ini bisa membantumu memilih produk yang lebih sehat.' },
        { ikon: '📦', teks: 'Perhatikan jumlah sajian dalam satu kemasan, karena total gula yang kamu konsumsi bisa lebih banyak dari yang kamu kira.' },
        // ===== Materi 5: Aktivitas Fisik untuk Mencegah DMT2 =====
        { ikon: '🏃', teks: 'Bergerak aktif setiap hari membantu tubuhmu lebih peka terhadap insulin dan menjauhkan risiko DMT2.' },
        { ikon: '🔁', teks: 'Konsisten itu kuncinya. Aktivitas fisik ringan yang rutin setiap hari lebih bermanfaat daripada olahraga berat sesekali.' },
        { ikon: '🪑', teks: 'Kurangi waktu duduk terlalu lama. Selingi dengan berdiri atau jalan sebentar setiap 1 sampai 2 jam.' },
        // ===== Materi 6: Membangun Kebiasaan Hidup Sehat Sejak Remaja =====
        { ikon: '🧩', teks: 'Semua kebiasaan sehat yang sudah kamu pelajari saling terhubung. Jalankan semuanya bersama-sama, bukan cuma satu saja.' },
        { ikon: '🐢', teks: 'Mulai dari perubahan kecil yang bisa bertahan lama, bukan langsung ekstrem.' },
        { ikon: '📆', teks: 'Jadikan kebiasaan sehat sebagai rutinitas harian, bukan sekadar tantangan sesaat.' },
        // ===== Tips Sehat Materi 1: Pilih Minuman yang Lebih Sehat =====
        { ikon: '💧', teks: 'Jadikan air putih sebagai minuman utama setiap hari, bukan minuman manis.' },
        { ikon: '😊', teks: 'Minuman manis boleh sesekali, asal tidak menjadi kebiasaan setiap hari.' },
        { ikon: '🏷️', teks: 'Biasakan melihat label gula sebelum membeli minuman kemasan.' },
        // ===== Tips Sehat Materi 2: Cek Label Sebelum Membeli =====
        { ikon: '🏷️', teks: 'Biasakan mencari label informasi nilai gizi sebelum membeli makanan atau minuman kemasan.' },
        { ikon: '⚖️', teks: 'Bandingkan gula per sajian dari beberapa produk sebelum memutuskan membeli.' },
        { ikon: '📦', teks: 'Perhatikan jumlah sajian dalam kemasan supaya tahu total gula yang sebenarnya kamu konsumsi.' },
        // ===== Tips Sehat Materi 3: Batasi Makanan dan Minuman Tinggi Gula =====
        { ikon: '🚫', teks: 'Batasi frekuensi makan kue, permen, cokelat, dan es krim, bukan menghindarinya total.' },
        { ikon: '🥄', teks: 'Kurangi sedikit demi sedikit takaran gula pasir yang kamu tambahkan sendiri ke minuman.' },
        { ikon: '😊', teks: 'Camilan manis boleh sesekali, asal tidak menjadi kebiasaan setiap hari.' },
        // ===== Tips Sehat Materi 4: Pilih Camilan dan Bekal yang Lebih Sehat =====
        { ikon: '🍱', teks: 'Bawa bekal dari rumah membantu kamu lebih mudah mengatur porsi dan kandungan gula makananmu di sekolah.' },
        { ikon: '🍎', teks: 'Camilan sederhana seperti buah, kacang, atau bekal dari rumah bisa mengurangi kebiasaan jajan sembarangan.' },
        { ikon: '💪', teks: 'Tidak masalah kalau pilihan camilanmu berbeda dari teman, karena kesehatanmu sendiri yang paling penting untuk dijaga.' },
        // ===== Tips Sehat Materi 5: Biasakan Aktif Bergerak =====
        { ikon: '💉', teks: 'Aktivitas fisik seperti jalan kaki, bersepeda, atau olahraga rutin membantu insulin bekerja lebih baik dan gula darah tetap terkontrol.' },
        { ikon: '🏸', teks: 'Kamu tidak perlu memilih satu olahraga saja. Coba dulu beberapa jenis sampai menemukan yang paling kamu senangi.' },
        { ikon: '👫', teks: 'Bergerak aktif bersama teman atau keluarga membuat kebiasaan ini lebih mudah bertahan lama karena kalian bisa saling mengingatkan.' },
        // ===== Tips Sehat Materi 6: Kurangi Duduk dan Screen Time =====
        { ikon: '⚖️', teks: 'Kurangi duduk dan waktu layar bukan berarti berhenti total, cukup jaga keseimbangan dengan aktivitas fisik setiap hari.' },
        { ikon: '🧍', teks: 'Berdiri atau bergerak sebentar setiap 30 menit sekali membantu tubuh tetap aktif walau sedang banyak duduk.' },
        { ikon: '👫', teks: 'Ajak teman melakukan kegiatan yang membuat tubuh bergerak, supaya kebiasaan mengurangi screen time terasa lebih ringan.' }
    ];
    let bagHidupSehatIndeks = [];
    function ambilHidupSehatAcak() {
        if (HIDUP_SEHAT_KEJADIAN.length === 0) return null;
        if (bagHidupSehatIndeks.length === 0) {
            bagHidupSehatIndeks = HIDUP_SEHAT_KEJADIAN.map((_, i) => i);
            for (let i = bagHidupSehatIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagHidupSehatIndeks[i], bagHidupSehatIndeks[j]] = [bagHidupSehatIndeks[j], bagHidupSehatIndeks[i]];
            }
        }
        return HIDUP_SEHAT_KEJADIAN[bagHidupSehatIndeks.pop()];
    }
    let posisiPemain = 0;
    let poinSehat = 0;
    let jumlahLap = 0;
    let sedangJalan = false;
    // Bonus Beruntun Kuis: hitung berapa kali jawaban kuis BENAR secara
    // berturut-turut (reset ke 0 begitu ada jawaban yang salah).
    let streakKuisBenar = 0;
    function ambilSkorTertinggi() {
        return Number(localStorage.getItem(kunciAkunAktif(KUNCI_SKOR_TERTINGGI))) || 0;
    }
    function simpanSkorTertinggiJikaRekor() {
        const rekorLama = ambilSkorTertinggi();
        const stageLama = cariInfoStagePet(rekorLama).stage;
        if (poinSehat > rekorLama) {
            localStorage.setItem(kunciAkunAktif(KUNCI_SKOR_TERTINGGI), String(poinSehat));
            jadwalkanSinkronProgresGame();
        }
        const rekorBaru = ambilSkorTertinggi();
        elSkorTertinggi.textContent = rekorBaru;
        perbaruiTampilanPet();
        const { stage: stageBaru, idx: idxBaru } = cariInfoStagePet(rekorBaru);
        if (stageBaru.min !== stageLama.min) {
            tampilkanLevelUpPet(stageBaru, idxBaru);
        }
    }
    function perbaruiTampilanSkor() {
        elPoin.textContent = poinSehat;
        elLap.textContent = jumlahLap;
        simpanStateSesi();
        simpanSkorTertinggiJikaRekor();
    }
    // Update gauge "Kuis Beruntun" supaya siswa bisa langsung lihat progres
    // menuju bonus +20 Poin Sehat (mirip tabung bonus Absen 7 Hari).
    // tampilkanPenuh=true dipakai SEKALI saat bonus baru saja didapat, biar
    // gauge sempat kelihatan penuh 5/5 dulu sebelum balik kosong lagi.
    function perbaruiTampilanStreakKuis(tampilkanPenuh) {
        if (!elStreakKuisItem) return;
        const nilaiTampil = tampilkanPenuh ? STREAK_KUIS_TARGET : streakKuisBenar;
        const persen = (nilaiTampil / STREAK_KUIS_TARGET) * 100;
        elStreakKuisFill.style.width = `${persen}%`;
        elStreakKuisNilai.textContent = `${nilaiTampil}/${STREAK_KUIS_TARGET}`;
        elStreakKuisItem.classList.toggle('penuh', tampilkanPenuh === true);
    }
    function bangunPapan() {
        PAPAN_DATA.forEach((tile, i) => {
            const el = document.createElement('div');
            el.className = `papan-tile tile-${tile.tipe}`;
            el.id = `papanTile${i}`;
            el.style.gridColumn = PETA_GRID[i].kol;
            el.style.gridRow = PETA_GRID[i].baris;
            el.innerHTML = `
                <span class="papan-tile-icon">${tile.ikon}</span>
                <span class="papan-tile-label">${tile.label}</span>
            `;
            papanGrid.appendChild(el);
        });
    }
    const DURASI_LOMPAT_TOKEN = 420; // ms — durasi satu kali lompatan pion. Langkah berikutnya nunggu animasi ini beneran "onfinish" (lihat pindahkanTokenKeTile), bukan timer terpisah, jadi nilai ini nggak perlu disamain manual ke tempat lain lagi.
    let posisiTokenStabilTerakhir = 0; // kotak terakhir yang beneran udah "didarati" bersih (bukan lagi di tengah lompatan)
    let tileAktifTerakhir = null; // referensi elemen tile yang lagi nyala 'aktif', biar bisa dicopot pas pindah tanpa nunggu/nunda step berikutnya
    function aktifkanTile(tile) {
        if (tileAktifTerakhir && tileAktifTerakhir !== tile) tileAktifTerakhir.classList.remove('aktif');
        tile.classList.add('aktif');
        tileAktifTerakhir = tile;
    }
    function pindahkanTokenKeTile(index, instan) {
        const tileTujuan = document.getElementById(`papanTile${index}`);
        if (!tileTujuan) return;
        let token = document.getElementById('papanToken');
        const tokenBaru = !token;
        if (tokenBaru) {
            token = document.createElement('span');
            token.id = 'papanToken';
            token.className = 'papan-token';
            token.textContent = '🧑‍🎓';
        }
        // Hentikan animasi lompat sebelumnya kalau masih jalan (misal langkah
        // dipanggil beruntun cepat), supaya nggak numpuk/patah-patah.
        if (token.getAnimations) token.getAnimations().forEach(a => a.cancel());
        // ===== Perbaikan bug "pion lompat sembarang arah" =====
        // cancel() di atas cuma menghentikan animasi transform-nya, TAPI style
        // posisi manual (left/top/right/bottom) yang dipasang pas mulai
        // terbang tetap nempel di elemennya. Kalau langkah berikutnya
        // kepanggil SEBELUM lompatan lama sempat "mendarat" (onfinish) —
        // misal HP lagi nge-lag/tab sempat nggak fokus — sisa posisi nyasar
        // itu ikut kebawa jadi titik ukur awal lompatan baru, hasilnya pion
        // keliatan lompat ke arah random. Makanya di sini dipaksa "dibenerin"
        // dulu balik ke kotak stabil terakhir sebelum ngukur lompatan baru.
        if (token.classList.contains('melayang')) {
            token.classList.remove('lagi-melompat', 'melayang');
            token.style.left = '';
            token.style.top = '';
            token.style.right = '';
            token.style.bottom = '';
            token.style.transform = '';
            const tileStabil = document.getElementById(`papanTile${posisiTokenStabilTerakhir}`);
            (tileStabil || tileTujuan).appendChild(token);
        }
        // Hormati setting "kurangi animasi" perangkat (migrain/vertigo dll) —
        // animasi CSS lain di web ini sudah otomatis dipercepat lewat
        // prefers-reduced-motion, tapi animasi lompat ini jalan lewat Web
        // Animations API di JS jadi harus dicek manual biar konsisten.
        const kurangiGerak = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (instan || tokenBaru || kurangiGerak) {
            token.classList.remove('lagi-melompat', 'melayang');
            token.style.left = '';
            token.style.top = '';
            token.style.right = '';
            token.style.bottom = '';
            token.style.transform = '';
            token.style.opacity = '1';
            tileTujuan.appendChild(token);
            aktifkanTile(tileTujuan);
            posisiTokenStabilTerakhir = index;
            simpanStateSesi();
            // SFX cuma bunyi buat langkah gameplay beneran, bukan pas token
            // pertama kali dipasang balik ke posisi tersimpan waktu halaman
            // baru dibuka (instan === true khusus dipakai buat itu, lihat
            // pindahkanTokenKeTile(posisiPemain, true) di pemulihan sesi).
            if (!instan) mainkanSfxLangkahPion();
            // Nggak ada animasi buat ditunggu — langsung "selesai".
            return Promise.resolve();
        } else {
            // ===== Animasi lompat pion (arc lintas kotak) =====
            // Tiap .papan-tile pakai overflow:hidden (biar sudut & background
            // gradient-nya rapi kepotong sesuai border-radius). Kalau token
            // dianimasikan NAIK di dalam tile, bagian arc yang keluar batas
            // kotak bakal ke-crop/hilang — ini penyebab utama lompatannya
            // kerasa patah-patah/kaku sebelumnya. Solusinya: selama "terbang",
            // token dipindah sementara jadi anak langsung .papan-grid (nggak
            // overflow:hidden), diposisikan pas di titik kotak asal, lalu
            // dianimasikan (translate + arc + squash/rotate) ke titik kotak
            // tujuan pakai Web Animations API. Abis mendarat, token
            // dikembalikan jadi anak tile tujuan seperti biasa.
            //
            // PENTING soal kelancaran: SEMUA pengukuran posisi (getBoundingClientRect)
            // di bawah ini dilakukan berurutan TANPA ada perubahan DOM di
            // antaranya (murni "baca" semua, baru "tulis" belakangan). Sebelumnya
            // token sempat dipindah ke tile tujuan dulu di tengah-tengah proses
            // ukur-mengukur cuma buat ngukur posisi mendaratnya — pola baca-ubah-baca
            // gitu memaksa browser menghitung ulang tata letak dua kali secara
            // paksa (layout thrashing), dan itu penyebab utama lompatannya
            // kerasa nyendat/patah tiap mulai lompat. Karena semua kotak papan
            // ukurannya seragam, jarak antar-kotak bisa dihitung cukup dari
            // posisi kotak asal & kotak tujuan-nya langsung (nggak perlu
            // mindahin token dulu buat itu).
            const tileAsal = token.parentElement && token.parentElement.classList.contains('papan-tile') ? token.parentElement : tileTujuan;
            const rectTokenAwal = token.getBoundingClientRect();
            const rectTileAsal = tileAsal.getBoundingClientRect();
            const rectTileTujuan = tileTujuan.getBoundingClientRect();
            const rectGrid = papanGrid.getBoundingClientRect();
            const startLeft = rectTokenAwal.left - rectGrid.left;
            const startTop = rectTokenAwal.top - rectGrid.top;
            const dx = rectTileTujuan.left - rectTileAsal.left;
            const dy = rectTileTujuan.top - rectTileAsal.top;
            token.classList.add('lagi-melompat', 'melayang');
            token.style.left = `${startLeft}px`;
            token.style.top = `${startTop}px`;
            token.style.right = 'auto';
            token.style.bottom = 'auto';
            token.style.opacity = '1';
            papanGrid.appendChild(token); // keluar dari tile selama terbang
            const arahMiring = dx >= 0 ? 1 : -1;
            const tinggiLompat = -Math.max(30, Math.hypot(dx, dy) * 0.4 + 24); // makin jauh, makin tinggi lompatannya
            const animasi = token.animate([
                { transform: 'translate(0, 0) scale(1, 1) rotate(0deg)', offset: 0 },
                { transform: `translate(${dx * 0.05}px, ${dy * 0.05 + 5}px) scale(1.2, 0.78) rotate(${-6 * arahMiring}deg)`, offset: 0.14 },
                { transform: `translate(${dx * 0.5}px, ${dy * 0.5 + tinggiLompat}px) scale(0.86, 1.16) rotate(${8 * arahMiring}deg)`, offset: 0.56 },
                { transform: `translate(${dx * 0.92}px, ${dy * 0.92 - 4}px) scale(1.16, 0.82) rotate(${-3 * arahMiring}deg)`, offset: 0.86 },
                { transform: `translate(${dx}px, ${dy}px) scale(1, 1) rotate(0deg)`, offset: 1 }
            ], {
                duration: DURASI_LOMPAT_TOKEN,
                easing: 'cubic-bezier(0.3, 0.05, 0.25, 1)',
                fill: 'forwards'
            });
            simpanStateSesi();
            // ===== Chaining lompatan lewat "selesai animasi", bukan timer tebakan =====
            // Sebelumnya langkah berikutnya dijadwalkan pakai setTimeout dengan
            // durasi tebak-tebakan (DURASI_LOMPAT_TOKEN + 30ms). Kalau device lagi
            // berat / tab sempat nggak fokus / browser telat ngejadwalin frame,
            // animasi asli bisa belum kelar pas timer itu nembak duluan — hasilnya
            // lompatan berikutnya mulai numpuk/motong lompatan yang sebelumnya,
            // keliatan kayak "lag" atau lompatannya keulang-ulang di tempat yang
            // sama. Makanya di sini fungsi ini balikin Promise yang baru resolve
            // PAS animasi beneran selesai (event asli dari Web Animations API),
            // supaya pemanggil (langkahkanPemain / pindahTanpaEvent) bisa nunggu
            // titik itu persis sebelum mulai ngukur & menjalankan lompatan
            // berikutnya. Hasilnya pion melewati tiap kotak berurutan dengan mulus,
            // tanpa jeda ganjil atau tabrakan animasi.
            return new Promise(resolve => {
                animasi.onfinish = () => {
                    // cancel (bukan cuma biarin "forwards") biar animasi idle
                    // tokenBounce di CSS bisa lanjut lagi dengan mulus setelah mendarat
                    animasi.cancel();
                    token.classList.remove('lagi-melompat', 'melayang');
                    token.style.left = '';
                    token.style.top = '';
                    token.style.right = '';
                    token.style.bottom = '';
                    tileTujuan.appendChild(token); // kembali jadi anak tile tujuan seperti biasa
                    // Efek 'aktif' & 'baru-mendarat' dipasang PAS di titik ini
                    // (persis saat pion mendarat), tapi TIDAK menahan resolve()
                    // sedikit pun — keduanya dibiarkan main sendiri di
                    // background (self-cleanup lewat classList di helper +
                    // setTimeout) sementara lompatan berikutnya boleh langsung
                    // jalan. Jadi kecepatan lompat pion balik secepat semula,
                    // tapi tiap kotak yang diinjak tetap sempat kelihatan
                    // efeknya karena 'baru-mendarat' nggak lagi dihapus paksa
                    // oleh step berikutnya (lihat aktifkanTile & bagian atas
                    // fungsi ini yang sudah tidak wipe semua tile lagi).
                    aktifkanTile(tileTujuan);
                    tileTujuan.classList.add('baru-mendarat');
                    setTimeout(() => tileTujuan.classList.remove('baru-mendarat'), 500);
                    posisiTokenStabilTerakhir = index;
                    mainkanSfxLangkahPion();
                    resolve();
                };
            });
        }
    }
    function tampilkanToast(pesan) {
        const toastLama = document.querySelector('.papan-toast');
        if (toastLama) toastLama.remove();
        const toast = document.createElement('div');
        toast.className = 'papan-toast';
        toast.textContent = pesan;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    // Sama seperti tampilkanToast(), tapi khusus dipakai di titik-titik yang
    // poinSehat-nya beneran berubah (nambah ATAU berkurang) — ikut memutar
    // SFX notifikasi. Toast yang tidak terkait poin (misal galat sinkron ke
    // server) tetap pakai tampilkanToast() polos, tanpa bunyi ini.
    function tampilkanToastPoin(pesan) {
        mainkanSfxNotifPoin();
        tampilkanToast(pesan);
    }
    // ===== Kocok dadu — SATU kurva gerak kontinu, SFX dijadwal dari kurva yang sama =====
    // Percobaan sebelumnya masih "patah-patah": dadu digerakkan lewat
    // BEBERAPA transisi CSS yang disambung-sambung (satu transisi per tik).
    // Masalahnya, tiap kali transisi baru dipasang di tengah jalan (buat
    // nyambung ke tik berikutnya), kecepatan geraknya "dipotong" dan mulai
    // dari nol lagi di titik sambungan itu — walau easing per segmennya
    // udah dihalusin, TETAP ada 9-10 titik sambungan yang masing-masing
    // berpotensi kerasa sebagai jeda/sentakan kecil. Rantai transisi CSS
    // pada dasarnya tidak bisa benar-benar mulus 100%.
    // Solusinya sekarang: dadu digerakkan lewat SATU fungsi easing kontinu
    // (easeSpinDadu) yang dihitung ulang tiap frame lewat requestAnimationFrame
    // — jadi sudut dadu itu murni fungsi dari "sudah berapa lama sejak mulai
    // kocok", tanpa sambungan/potongan sama sekali, semulus mungkin sesuai
    // frame rate device. Bunyi tik SFX tetap dijadwalkan lewat setTimeout,
    // tapi waktunya dihitung dari TITIK-TITIK DI KURVA YANG SAMA PERSIS
    // (dibalik dari easeSpinDadu) — jadi tik selalu jatuh pas dadu ada di
    // progres yang "seharusnya", sinkron, walau geraknya sendiri kontinu.
    const DURASI_SPIN_DADU = 2050; // ms — fase muter utama, DIPERPANJANG (dari 1718) biar fase melambatnya kerasa lebih lama/landai, bukan buru-buru berhenti
    const DURASI_SETTLE_DADU = 450; // ms — fase "lentur" pas mendarat: goyangan kecil yang meredam ke posisi final
    const DURASI_KOCOK_DADU = DURASI_SPIN_DADU + DURASI_SETTLE_DADU; // total sampai dadu benar-benar diam
    // t: 0..1 (progres WAKTU di fase spin) -> hasil: 0..1 (progres ROTASI).
    // CATATAN: pangkat 1.25 yang dipakai sebelumnya ternyata secara
    // matematis punya "rem mendadak" tersembunyi tepat di ujung — begitu
    // pangkatnya < 2, LAJU PERLAMBATANNYA sendiri (bukan kecepatannya)
    // melonjak tajam pas mendekati t=1, jadi walau kelihatan mulus, kupingnya
    // masih nangkep semacam "snap" berhenti di detik terakhir (makanya tik
    // terakhir masih kerasa kaku). Sekarang dinaikkan ke 2.6 — dengan
    // pangkat > 2, laju perlambatannya sendiri ikut mengecil landai menuju
    // nol pas t=1 (bukan melonjak), jadi dadunya "meluncur" pelan-pelan
    // sampai benar-benar berhenti, bukan direm mendadak di ujung. Awalnya
    // pun tetap kenceng (bahkan makin nendang) karena pangkat lebih tinggi
    // = kecepatan awal lebih tinggi juga.
    function easeSpinDadu(t) { return 1 - Math.pow(1 - t, 2.6); }
    // Getaran elastis kecil yang ditumpangkan DI ATAS kurva perlambatan di
    // atas — biar putarannya kerasa "lentur" kayak per, bukan gerak lurus
    // yang steril. Amplitudonya FIXED dalam derajat (bukan proporsional ke
    // jumlah putaran total), jadi jumlah putaran penuh & hasil akhir dadu
    // TETAP presisi — nilainya selalu nol pas t=0 (mulai) dan t=1 (mendarat),
    // jadi tidak bikin sentakan di awal atau meleset di akhir.
    function elasticGiveDadu(t) {
        return Math.sin(t * Math.PI * 6) * 4.5 * t * (1 - t);
    }
    // Tik SFX SEKARANG dipicu LANGSUNG dari rotasi asli tiap frame (bukan
    // jadwal waktu tetap yang "asal penting sfx-nya kelar bareng animasi").
    // Sebelumnya TIK_DADU_MS dihitung manual berdasar kurva easing versi
    // lama — begitu easing/gerakannya diubah (jadi lebih lentur), jadwal itu
    // otomatis meleset dari visualnya. Sekarang tik dianggap bunyi tiap kali
    // dadu udah menempuh kelipatan 90° (seperempat putaran) — kira-kira
    // momen satu sisi dadu "menghadap depan" lalu berganti ke sisi berikutnya
    // — dihitung dari SUDUT ASLI yang lagi dirender (termasuk getaran
    // elastisnya), jadi tik selalu jatuh PAS di momen visualnya, bukan
    // nebak-nebak waktu. Karena jaraknya dihitung dalam derajat (bukan ms),
    // efeknya otomatis ikut melambat sesuai gerakan dadunya sendiri: pas
    // muter kenceng di awal, tik-nya rapat; pas melambat di akhir, tik-nya
    // ikut merenggang — dan jumlah tik-nya PAS sama banyak sisi yang benar-
    // benar terlewati, bukan dipotong/dipanjangin paksa biar "abisnya bareng".
    const INTERVAL_TIK_DERAJAT = 90;
    function kocokDadu() {
        if (sedangJalan) return;
        sedangJalan = true;
        btnKocok.disabled = true;
        const hasil = 1 + Math.floor(Math.random() * 6);
        const target = ROTASI_HASIL_DADU[hasil];
        // Beberapa putaran penuh acak biar terasa 'dilempar' kenceng di awal,
        // lalu mendarat pas di sudut yang menunjukkan sisi hasil.
        const putaranX = 360 * (4 + Math.floor(Math.random() * 2));
        const putaranY = 360 * (4 + Math.floor(Math.random() * 2));
        const selisihX = (((target.x - (dadu3dRotX % 360)) % 360) + 360) % 360;
        const selisihY = (((target.y - (dadu3dRotY % 360)) % 360) + 360) % 360;
        const rotXAwal = dadu3dRotX;
        const rotYAwal = dadu3dRotY;
        const deltaX = putaranX + selisihX;
        const deltaY = putaranY + selisihY;
        const rotXFinal = rotXAwal + deltaX;
        const rotYFinal = rotYAwal + deltaY;
        // Rata-rata jarak sudut yang ditempuh kedua sumbu — dipakai buat
        // nentuin berapa kali tik "seharusnya" bunyi total (buat ngitung
        // frac rate/volume tiap tik), BUKAN buat nentuin waktunya — waktunya
        // murni nyusul dari rotasi asli tiap frame di bawah.
        const totalDerajatTempuhDadu = (Math.abs(deltaX) + Math.abs(deltaY)) / 2;
        const estimasiJumlahTikDadu = Math.max(1, totalDerajatTempuhDadu / INTERVAL_TIK_DERAJAT);
        let tikDaduTerakhirKe = 0; // index tik terakhir yang sudah dibunyikan di kocokan ini
        // Semua gerakan sekarang di-drive manual tiap frame, BUKAN transisi
        // CSS sama sekali — biar benar-benar satu kurva mulus tanpa sambungan.
        elDadu.style.transition = 'none';
        const mulaiSpin = performance.now();
        function frameSpin(now) {
            const t = Math.min(1, (now - mulaiSpin) / DURASI_SPIN_DADU);
            const progres = easeSpinDadu(t);
            const give = elasticGiveDadu(t);
            dadu3dRotX = rotXAwal + deltaX * progres + give;
            dadu3dRotY = rotYAwal + deltaY * progres + give * 0.7;
            elDadu.style.transform = `rotateX(${dadu3dRotX}deg) rotateY(${dadu3dRotY}deg)`;
            // Cek apakah rotasi ASLI (yang barusan dirender di atas) udah
            // menempuh kelipatan 90° baru sejak tik terakhir — kalau ya,
            // bunyikan tik SEKARANG JUGA, di frame yang sama persis dengan
            // visualnya, bukan lewat setTimeout terpisah yang bisa meleset.
            const jarakTempuhDadu = (Math.abs(dadu3dRotX - rotXAwal) + Math.abs(dadu3dRotY - rotYAwal)) / 2;
            const tikDaduKe = Math.floor(jarakTempuhDadu / INTERVAL_TIK_DERAJAT);
            if (tikDaduKe > tikDaduTerakhirKe) {
                for (let i = tikDaduTerakhirKe + 1; i <= tikDaduKe; i++) {
                    const frac = Math.min(1, i / estimasiJumlahTikDadu);
                    mainkanSfxDadu(1.35 - frac * 0.5, 0.55 - frac * 0.15);
                }
                tikDaduTerakhirKe = tikDaduKe;
            }
            if (t < 1) {
                requestAnimationFrame(frameSpin);
            } else {
                mulaiSettleDadu();
            }
        }
        requestAnimationFrame(frameSpin);
        // Fase kedua: dadu udah "mendarat" tepat di hasil akhir (spin
        // selesai), tapi dikasih goyangan kecil yang meredam sendiri —
        // ini bagian "lentur"-nya, kayak per yang habis nyampe lalu
        // bergetar sebentar sebelum benar-benar diam. Selalu balik PAS
        // ke rotXFinal/rotYFinal di akhir, jadi hasil dadu tidak meleset.
        function mulaiSettleDadu() {
            const mulaiSettle = performance.now();
            function frameSettle(now) {
                const u = Math.min(1, (now - mulaiSettle) / DURASI_SETTLE_DADU);
                const redam = (1 - u) * (1 - u); // amplitudo goyangan mengecil terus ke 0
                const offset = Math.sin(u * Math.PI * 2.4) * 5 * redam; // derajat — dinaikkan dari 3 biar landing-nya kerasa lebih lentur/mantul
                elDadu.style.transform = `rotateX(${rotXFinal + offset}deg) rotateY(${rotYFinal + offset * 0.6}deg)`;
                if (u < 1) {
                    requestAnimationFrame(frameSettle);
                } else {
                    dadu3dRotX = rotXFinal;
                    dadu3dRotY = rotYFinal;
                    elDadu.style.transform = `rotateX(${rotXFinal}deg) rotateY(${rotYFinal}deg)`;
                }
            }
            requestAnimationFrame(frameSettle);
        }
        // Tik SFX SEKARANG dipicu langsung dari dalam frameSpin() di atas
        // (lihat blok "jarakTempuhDadu"), jadi tidak perlu dijadwalkan
        // terpisah lagi di sini.
        // Nunggu sampai animasi dadu (spin + settle) beneran selesai baru
        // pion mulai melompat, biar hasil dadu & laju pion singkron dan
        // tidak kepotong.
        window.setTimeout(() => {
            langkahkanPemain(hasil);
        }, DURASI_KOCOK_DADU);
    }
    function langkahkanPemain(sisaLangkah) {
        if (sisaLangkah <= 0) {
            munculkanEventTile(posisiPemain);
            return;
        }
        posisiPemain = (posisiPemain + 1) % PAPAN_DATA.length;
        const melewatiGarisMulai = (posisiPemain === 0);
        // Nunggu animasi lompatan ini beneran mendarat (bukan timer tebakan)
        // sebelum lanjut ke langkah berikutnya — biar tiap lompatan mulus
        // berurutan tanpa numpuk/kepotong. Toast & poin "Keliling papan"
        // juga baru ditampilkan SETELAH pion mendarat (bukan pas baru mau
        // lompat), biar tidak kerasa kecepetan/keduluan sebelum pion sampai.
        Promise.resolve(pindahkanTokenKeTile(posisiPemain, false)).then(() => {
            if (melewatiGarisMulai) {
                jumlahLap++;
                poinSehat += 10;
                perbaruiTampilanSkor();
                tampilkanToastPoin('🎉 Keliling papan! +10 Poin Sehat');
            }
            langkahkanPemain(sisaLangkah - 1);
        });
    }
    function pindahTanpaEvent(delta, selesai) {
        const arah = delta > 0 ? 1 : -1;
        let sisa = Math.abs(delta);
        function langkah() {
            if (sisa <= 0) { selesai(); return; }
            posisiPemain = (posisiPemain + arah + PAPAN_DATA.length) % PAPAN_DATA.length;
            sisa--;
            Promise.resolve(pindahkanTokenKeTile(posisiPemain, false)).then(langkah);
        }
        langkah();
    }
    function bersihkanJedaLanjut() {
        if (timerJedaLanjut) {
            window.clearInterval(timerJedaLanjut);
            timerJedaLanjut = null;
        }
    }
    function mulaiJedaLanjut(teks, onSelesaiKlik) {
        bersihkanJedaLanjut();
        const jumlahKata = teks.trim().split(/\s+/).length;
        let sisaDetik = Math.min(6, Math.max(3, Math.ceil(jumlahKata / 3)));
        btnLanjutEvent.disabled = true;
        btnLanjutEvent.classList.remove('hidden');
        btnLanjutEvent.textContent = `Baca dulu ya... (${sisaDetik})`;
        timerJedaLanjut = window.setInterval(() => {
            sisaDetik--;
            if (sisaDetik <= 0) {
                bersihkanJedaLanjut();
                btnLanjutEvent.disabled = false;
                btnLanjutEvent.textContent = 'Lanjut →';
            } else {
                btnLanjutEvent.textContent = `Baca dulu ya... (${sisaDetik})`;
            }
        }, 1000);
        btnLanjutEvent.onclick = onSelesaiKlik;
    }
    function munculkanEventTile(index) {
        const tile = PAPAN_DATA[index];
        elEventOpsiList.innerHTML = '';
        elEventFeedback.classList.add('hidden');
        elEventFeedback.className = 'game-feedback hidden';
        btnLanjutEvent.classList.add('hidden');
        btnLanjutEvent.disabled = false;
        bersihkanJedaLanjut();
        elEventIkon.textContent = tile.ikon;
        if (tile.tipe === 'mulai') {
            elEventJudul.textContent = 'Garis Mulai';
            elEventTeks.textContent = 'Kamu ada di kotak Mulai. Kocok dadu lagi untuk lanjut jalan!';
            btnLanjutEvent.classList.remove('hidden');
            btnLanjutEvent.onclick = tutupEvent;
        } else if (tile.tipe === 'checkpoint') {
            // Fallback placeholder selagi HIDUP_SEHAT_KEJADIAN masih kosong (belum diisi ulang).
            const hidupSehatAcak = ambilHidupSehatAcak() || { ikon: tile.ikon, teks: 'Tips hidup sehat segera hadir!' };
            elEventJudul.textContent = tile.label;
            elEventIkon.textContent = hidupSehatAcak.ikon;
            elEventTeks.textContent = hidupSehatAcak.teks;
            poinSehat = Math.max(0, poinSehat + tile.poin);
            perbaruiTampilanSkor();
            tampilkanToastPoin(`${tile.ikon} ${tile.poin >= 0 ? '+' : ''}${tile.poin} Poin Sehat!`);
            mulaiJedaLanjut(hidupSehatAcak.teks, tutupEvent);
        } else if (tile.tipe === 'info') {
            // Fallback placeholder selagi FAKTA_KOTAK_INFO masih kosong (belum diisi ulang).
            const faktaAcak = ambilFaktaKotakAcak() || { ikon: '🔧', teks: 'Materi segera hadir, ya!' };
            elEventJudul.textContent = 'Tahukah Kamu?';
            elEventIkon.textContent = faktaAcak.ikon;
            elEventTeks.textContent = faktaAcak.teks;
            poinSehat = Math.max(0, poinSehat + 5);
            perbaruiTampilanSkor();
            elEventFeedback.textContent = '✅ +5 Poin Sehat!';
            elEventFeedback.className = 'game-feedback feedback-benar';
            elEventFeedback.classList.remove('hidden');
            tampilkanToastPoin('📌 +5 Poin Sehat!');
            mulaiJedaLanjut(faktaAcak.teks, tutupEvent);
        } else if (tile.tipe === 'bonus' || tile.tipe === 'jebakan') {
            // Fallback placeholder selagi BONUS_KEJADIAN/JEBAKAN_KEJADIAN masih kosong.
            const kejadianAcak = (tile.tipe === 'bonus' ? ambilBonusAcak() : ambilJebakanAcak())
                || { ikon: '🔧', teks: 'Materi segera hadir, ya!' };
            const arahLangkah = tile.langkah > 0 ? 'Maju' : 'Mundur';
            elEventJudul.textContent = tile.tipe === 'bonus' ? 'Bonus!' : 'Jebakan Gula!';
            elEventIkon.textContent = kejadianAcak.ikon;
            elEventTeks.textContent = `${kejadianAcak.teks} ${arahLangkah} ${Math.abs(tile.langkah)} langkah!`;
            btnLanjutEvent.classList.remove('hidden');
            btnLanjutEvent.onclick = () => {
                tutupOverlaySaja();
                pindahTanpaEvent(tile.langkah, () => munculkanEventTile(posisiPemain));
            };
        } else if (tile.tipe === 'kuis') {
            const soal = ambilSoalAcak();
            if (!soal) {
                // Bank soal masih kosong (belum diisi ulang) — jangan sampai error,
                // cukup tampilkan info dan lanjutkan seperti kotak fakta biasa.
                elEventJudul.textContent = 'Kuis Segera Hadir';
                elEventTeks.textContent = 'Soal kuis untuk materi ini masih disiapkan. Nantikan update selanjutnya ya!';
                btnLanjutEvent.classList.remove('hidden');
                btnLanjutEvent.onclick = () => tutupEvent();
            } else {
                elEventJudul.textContent = 'Kuis Waktunya!';
                elEventTeks.textContent = soal.pertanyaan;
                soal.opsi.forEach((teksOpsi, i) => {
                    const btnOpsi = document.createElement('button');
                    btnOpsi.type = 'button';
                    btnOpsi.className = 'game-opsi-btn';
                    btnOpsi.textContent = teksOpsi;
                    btnOpsi.addEventListener('click', () => jawabKuis(i, soal, btnOpsi));
                    elEventOpsiList.appendChild(btnOpsi);
                });
            }
        }
        bukaPanelOverlay(overlayEvent);
    }
    // ===== Bonus Beruntun Kuis: 5x jawaban benar berturut-turut =====
    // Tiap kali pemain menjawab 5 soal kuis dengan BENAR secara
    // berturut-turut (tanpa diselingi jawaban salah), dapat tambahan
    // Poin Sehat di luar +10 poin jawaban benar biasa. Begitu ada jawaban
    // salah, hitungan beruntunnya reset ke 0 dan mulai dihitung dari awal.
    const STREAK_KUIS_TARGET = 5;
    const BONUS_STREAK_KUIS_POIN = 20;
    function jawabKuis(indexDipilih, tile, btnDipilih) {
        const semuaBtn = elEventOpsiList.querySelectorAll('.game-opsi-btn');
        semuaBtn.forEach(b => (b.disabled = true));
        const benar = indexDipilih === tile.benar;
        btnDipilih.classList.add(benar ? 'opsi-benar' : 'opsi-salah');
        if (!benar) {
            semuaBtn[tile.benar].classList.add('opsi-benar');
        }
        poinSehat = Math.max(0, poinSehat + (benar ? 10 : -5));

        let dapatBonusStreak = false;
        if (benar) {
            streakKuisBenar++;
            if (streakKuisBenar >= STREAK_KUIS_TARGET) {
                poinSehat += BONUS_STREAK_KUIS_POIN;
                dapatBonusStreak = true;
                streakKuisBenar = 0; // reset supaya bisa dapat bonus lagi di rentetan berikutnya
            }
        } else {
            streakKuisBenar = 0;
        }

        // Kalau baru saja dapat bonus, tampilkan gauge penuh (5/5) dulu
        // sebentar sebagai penanda, baru balik kosong setelah jeda —
        // supaya siswa sempat lihat gauge-nya penuh, bukan langsung 0/5.
        perbaruiTampilanStreakKuis(dapatBonusStreak);
        if (dapatBonusStreak) {
            window.setTimeout(() => perbaruiTampilanStreakKuis(), 1200);
        }

        perbaruiTampilanSkor();
        let teksVerdict = benar ? '✅ Benar! +10 Poin Sehat.' : '❌ Belum tepat, -5 Poin Sehat.';
        if (dapatBonusStreak) {
            teksVerdict += ` 🔥 Bonus ${STREAK_KUIS_TARGET}x Benar Berturut-turut: +${BONUS_STREAK_KUIS_POIN} Poin Sehat!`;
        }
        elEventFeedback.innerHTML = `<strong class="game-feedback-verdict">${teksVerdict}</strong> <span class="game-feedback-penjelasan">${escapeHtml(tile.penjelasan)}</span>`;
        elEventFeedback.className = `game-feedback ${benar ? 'feedback-benar' : 'feedback-salah'}`;
        elEventFeedback.classList.remove('hidden');
        tampilkanToastPoin(benar ? '✅ +10 Poin Sehat!' : '❌ -5 Poin Sehat');
        if (dapatBonusStreak) {
            mainkanSfxPencapaian();
            window.setTimeout(() => {
                tampilkanToastPoin(`🔥 ${STREAK_KUIS_TARGET}x Benar Berturut-turut! +${BONUS_STREAK_KUIS_POIN} Poin Sehat Bonus!`);
            }, 700);
        }
        btnLanjutEvent.classList.remove('hidden');
        btnLanjutEvent.onclick = tutupEvent;
    }
    function tutupOverlaySaja() {
        tutupPanelOverlay(overlayEvent);
    }
    function tutupEvent() {
        tutupPanelOverlay(overlayEvent);
        simpanSkorTertinggiJikaRekor();
        sedangJalan = false;
        btnKocok.disabled = false;
    }
    function resetGame() {
        posisiPemain = 0;
        poinSehat = 0;
        jumlahLap = 0;
        streakKuisBenar = 0;
        perbaruiTampilanStreakKuis();
        sedangJalan = false;
        dadu3dRotX = -18;
        dadu3dRotY = 28;
        elDadu.style.transition = 'none'; // snap instan — jangan ikut kepakai transisi/durasi sisa kocokan terakhir
        elDadu.style.transform = `rotateX(${dadu3dRotX}deg) rotateY(${dadu3dRotY}deg)`;
        btnKocok.disabled = false;
        bersihkanJedaLanjut();
        tutupPanelOverlay(overlayEvent);
        perbaruiTampilanSkor();
        pindahkanTokenKeTile(0, true);
        simpanStateSesi();
    }
    const KUNCI_ABSEN_TERAKHIR = 'sobatSehatAbsenTerakhir';
    const KUNCI_ABSEN_STREAK = 'sobatSehatAbsenStreak';
    const KUNCI_ABSEN_STREAK_REKOR = 'sobatSehatAbsenStreakRekor';
    // Bonus Absen Penuh 7 Hari: tiap kelipatan 7 hari absen beruntun tanpa
    // putus, siswa dapat Poin Sehat tambahan di luar +10 poin absen harian.
    const BONUS_ABSEN_KELIPATAN_HARI = 7;
    const BONUS_ABSEN_POIN = 20;
    // ===== Streak putus karena kelewatan hari =====
    // Streak cuma valid kalau absen terakhir itu HARI INI atau KEMARIN.
    // Kalau absen terakhir lebih lama dari kemarin (siswa lewat 1 hari atau
    // lebih tanpa absen), maka streak sudah putus — dan ini harus kelihatan
    // dari SEKARANG (begitu halaman dibuka/dicek), bukan nunggu sampai siswa
    // absen lagi baru streak-nya dikoreksi. Rekor (KUNCI_ABSEN_STREAK_REKOR)
    // tidak disentuh sama sekali di sini — capaian terpanjang tetap tersimpan.
    function streakSudahPutus() {
        const terakhir = localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR));
        if (!terakhir) return false; // belum pernah absen sama sekali -> bukan "putus"
        const hariIni = formatTanggal(new Date());
        if (terakhir === hariIni) return false; // sudah absen hari ini
        const kemarin = new Date();
        kemarin.setDate(kemarin.getDate() - 1);
        return terakhir !== formatTanggal(kemarin); // selain hari ini/kemarin -> putus
    }
    // Sumber tunggal buat baca streak saat ini: kalau ternyata sudah putus,
    // nilai yang tersimpan langsung dikoreksi ke 0 (self-heal) supaya seluruh
    // bagian UI & sinkronisasi cloud konsisten memakai angka yang benar.
    function ambilStreakSaatIni() {
        if (streakSudahPutus()) {
            localStorage.setItem(kunciAkunAktif(KUNCI_ABSEN_STREAK), '0');
            return 0;
        }
        return Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK))) || 0;
    }
    // Posisi siklus tabung bonus 7-hari dari streak saat ini: hari ke-1 dari
    // streak = 1/7 terisi, hari ke-7 = 7/7 (penuh, dapat bonus), lalu hari
    // ke-8 mulai lagi dari 1/7 (kosong dulu, baru terisi) — bukan lanjut ke
    // 8/7. streak 0 (belum absen sama sekali / streak putus) = tabung kosong.
    function posisiTabungBonus(streak) {
        if (!streak || streak <= 0) return 0;
        return ((streak - 1) % BONUS_ABSEN_KELIPATAN_HARI) + 1;
    }
    // Render visual tabung: tinggi cairan mengikuti persentase posisi/7, dan
    // kelas "penuh" ditambahkan pas persis kelipatan 7 buat efek berdenyut +
    // ikon hadiah menyala menandakan bonus sudah didapat.
    function perbaruiTabungBonus(streak) {
        if (!elAbsenTabungFill) return;
        const posisi = posisiTabungBonus(streak);
        const persen = (posisi / BONUS_ABSEN_KELIPATAN_HARI) * 100;
        elAbsenTabungFill.style.height = `${persen}%`;
        if (elAbsenTabungLabel) elAbsenTabungLabel.textContent = `${posisi}/${BONUS_ABSEN_KELIPATAN_HARI}`;
        if (elAbsenTabung) elAbsenTabung.classList.toggle('penuh', posisi === BONUS_ABSEN_KELIPATAN_HARI);
    }
    // ===== Sinkronisasi progres game ke Firestore =====
    // localStorage itu per-device/per-browser, jadi kalau cuma disimpan di situ,
    // progres game (Poin Sehat, posisi papan, skor tertinggi, nama pet, streak
    // absen) tidak ikut pindah waktu buka website dari device lain pakai akun
    // yang sama. Di sini progres itu juga dititipkan ke Firestore (per email),
    // lalu ditarik lagi & ditulis ke localStorage begitu akun login di device
    // manapun — supaya progresnya konsisten di semua device.
    let _timerSinkronProgresGame = null;
    function kumpulkanProgresGameLokal() {
        return {
            namaPet: localStorage.getItem(kunciAkunAktif(KUNCI_NAMA_PET_BASE)),
            kesempatanGantiNamaPet: ambilKesempatanGantiNama(),
            poinSehat: Number(localStorage.getItem(kunciAkunAktif(KUNCI_POIN_SESI_BASE))) || 0,
            posisiPemain: Number(localStorage.getItem(kunciAkunAktif(KUNCI_POSISI_SESI_BASE))) || 0,
            jumlahLap: Number(localStorage.getItem(kunciAkunAktif(KUNCI_LAP_SESI_BASE))) || 0,
            skorTertinggi: Number(localStorage.getItem(kunciAkunAktif(KUNCI_SKOR_TERTINGGI))) || 0,
            absenTerakhir: localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR)),
            absenStreak: ambilStreakSaatIni(),
            absenStreakRekor: Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK_REKOR))) || 0
        };
    }
    function jadwalkanSinkronProgresGame() {
        if (!emailAktif || typeof db === 'undefined') return;
        clearTimeout(_timerSinkronProgresGame);
        _timerSinkronProgresGame = setTimeout(() => {
            segerakanSinkronProgresGame();
        }, 800);
    }
    // Simpan LANGSUNG ke Firestore (tanpa nunggu jeda 800ms). Dipakai saat tab
    // mau ditinggalkan/ditutup — supaya progres yang baru saja didapat (misal
    // abis kocok dadu lalu langsung tutup browser di HP) tidak keburu hilang
    // karena jeda 800ms di atas belum sempat jalan.
    function segerakanSinkronProgresGame() {
        if (!emailAktif || typeof db === 'undefined') return;
        clearTimeout(_timerSinkronProgresGame);
        const dataProgres = kumpulkanProgresGameLokal();
        dataProgres.diperbaruiPada = firebase.firestore.FieldValue.serverTimestamp();
        db.collection('progresGame').doc(emailAktif).set(dataProgres, { merge: true })
            .catch(err => console.warn('Gagal menyimpan progres game ke Firestore (cek Firestore Security Rules untuk koleksi "progresGame"):', err));
    }
    // "visibilitychange" ke hidden lebih diandalkan daripada "beforeunload" di HP,
    // karena browser mobile sering langsung membekukan/mematikan tab begitu app
    // lain dibuka atau layar dikunci, tanpa sempat memicu beforeunload.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            segerakanSinkronProgresGame();
        } else if (document.visibilityState === 'visible') {
            // Sebaliknya, begitu tab ini dibuka/difokuskan LAGI (misal user tadi
            // sempat main di device lain lalu balik ke tab ini), tarik ulang
            // progres terbaru dari Firestore — supaya angka yang tampil tidak
            // "beku" dari sesi login sebelumnya. Tanpa ini, progres cuma ditarik
            // sekali waktu login, jadi kelihatan beda antar device sampai user
            // logout/login ulang secara manual.
            tarikUlangProgresSaatTabAktif();
        }
    });
    window.addEventListener('pagehide', segerakanSinkronProgresGame);
    window.addEventListener('beforeunload', segerakanSinkronProgresGame);
    function tarikUlangProgresSaatTabAktif() {
        if (!emailAktif || typeof db === 'undefined') return;
        muatProgresDariFirestore(emailAktif).then(() => {
            if (typeof window.refreshGameAkun === 'function') window.refreshGameAkun();
        });
    }
    function muatProgresDariFirestore(email) {
        if (!email || typeof db === 'undefined') return Promise.resolve();
        return db.collection('progresGame').doc(email).get().then((snap) => {
            if (!snap.exists) return;
            const d = snap.data();
            const kunciUntuk = (base) => `${base}_${email}`;
            if (d.namaPet) localStorage.setItem(kunciUntuk(KUNCI_NAMA_PET_BASE), d.namaPet);
            if (d.kesempatanGantiNamaPet !== undefined) localStorage.setItem(kunciUntuk(KUNCI_NAMA_PET_KESEMPATAN_BASE), String(d.kesempatanGantiNamaPet));
            if (d.poinSehat !== undefined) localStorage.setItem(kunciUntuk(KUNCI_POIN_SESI_BASE), String(d.poinSehat));
            if (d.posisiPemain !== undefined) localStorage.setItem(kunciUntuk(KUNCI_POSISI_SESI_BASE), String(d.posisiPemain));
            if (d.jumlahLap !== undefined) localStorage.setItem(kunciUntuk(KUNCI_LAP_SESI_BASE), String(d.jumlahLap));
            if (d.skorTertinggi !== undefined) localStorage.setItem(kunciUntuk(KUNCI_SKOR_TERTINGGI), String(d.skorTertinggi));
            if (d.absenTerakhir) localStorage.setItem(kunciUntuk(KUNCI_ABSEN_TERAKHIR), d.absenTerakhir);
            if (d.absenStreak !== undefined) localStorage.setItem(kunciUntuk(KUNCI_ABSEN_STREAK), String(d.absenStreak));
            if (d.absenStreakRekor !== undefined) localStorage.setItem(kunciUntuk(KUNCI_ABSEN_STREAK_REKOR), String(d.absenStreakRekor));
        }).catch(err => {
            console.warn('Gagal menarik progres game dari Firestore (cek Firestore Security Rules untuk koleksi "progresGame"):', err);
            // Peringatan kecil di layar (bukan cuma di console) supaya kelihatan
            // walau yang main tidak buka DevTools — gagal sinkron progres lintas
            // device itu penting diketahui, bukan cuma dibiarkan diam-diam.
            const kodeErr = (err && err.code) ? err.code : '';
            tampilkanToast(kodeErr === 'permission-denied'
                ? '⚠️ Progres gagal disinkron ke server (izin ditolak, cek Firestore Rules)'
                : '⚠️ Progres gagal disinkron ke server, tersimpan di HP ini saja dulu');
        });
    }
    window.muatProgresDariFirestore = muatProgresDariFirestore;
    const elAbsenStreakNilai = document.getElementById('absenStreakNilai');
    const elAbsenIconApi = document.getElementById('absenIconApi');
    const elAbsenStreakRekor = document.getElementById('absenStreakRekorNilai');
    // Rekor dihitung dari nilai tersimpan vs streak saat ini (bukan cuma nilai
    // tersimpan mentah), biar akun lama yang belum pernah punya field rekor
    // tetap langsung dapat rekor yang benar tanpa perlu migrasi data.
    function ambilRekorStreak() {
        const rekorTersimpan = Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK_REKOR))) || 0;
        const streakSaatIni = ambilStreakSaatIni();
        return Math.max(rekorTersimpan, streakSaatIni);
    }
    // ===== Milestone api Streak Absen — makin panjang streak-nya, api 🔥
    // makin besar & warnanya makin "panas", urut sesuai nomor file aslinya
    // (Api_1 → Api_8): abu netral → merah tua → merah terang → oranye →
    // emas → hijau mistis → biru → ungu (legend, 120 hari). =====
    // Ikon api-nya sendiri (gambar) diatur lewat CSS berdasar "kelas" di
    // bawah — lihat .absen-streak-nilai.streak-tier-N::before dan
    // .streak-tier-emoji.streak-tier-N di style.css — biar satu sumber
    // kebenaran buat file gambarnya, nggak dobel ditulis di JS & CSS.
    const STREAK_TIERS = [
        { min: 0, kelas: 'streak-tier-0', label: 'Yuk mulai absen tiap hari!' },
        { min: 3, kelas: 'streak-tier-1', label: 'Awal yang bagus, 3 hari beruntun dengan api merah tua!' },
        { min: 7, kelas: 'streak-tier-2', label: 'Seminggu penuh tanpa putus dengan api merah menyala!' },
        { min: 14, kelas: 'streak-tier-3', label: 'Dua minggu beruntun dengan api oranye!' },
        { min: 30, kelas: 'streak-tier-4', label: 'Sebulan penuh dengan api emas, luar biasa!' },
        { min: 60, kelas: 'streak-tier-5', label: 'Dua bulan beruntun dengan api hijau mistis!' },
        { min: 90, kelas: 'streak-tier-6', label: 'Tiga bulan beruntun dengan api biru, langka!' },
        { min: 120, kelas: 'streak-tier-7', label: 'Legend! Api ungu menyala, konsistensimu top!' }
    ];
    function terapkanTierStreak(streak) {
        if (!elAbsenStreakNilai) return;
        let tier = STREAK_TIERS[0];
        for (let i = 0; i < STREAK_TIERS.length; i++) {
            if (streak >= STREAK_TIERS[i].min) tier = STREAK_TIERS[i];
        }
        elAbsenStreakNilai.className = `absen-streak-nilai ${tier.kelas}`;
        elAbsenStreakNilai.title = tier.label;
        // Ikon api utama yang dipindah ke atas kartu — pakai styling
        // .streak-tier-emoji yang sama (ukuran & warna otomatis ngikutin
        // tier aktif) supaya konsisten dengan daftar tingkatan di panel info.
        if (elAbsenIconApi) { elAbsenIconApi.className = `absen-icon-api streak-tier-emoji ${tier.kelas}`; elAbsenIconApi.title = tier.label; }
    }
    function cariTierStreak(streak) {
        let tier = STREAK_TIERS[0];
        for (let i = 0; i < STREAK_TIERS.length; i++) {
            if (streak >= STREAK_TIERS[i].min) tier = STREAK_TIERS[i];
        }
        return tier;
    }
    function renderAbsenTierList() {
        if (!absenTierList) return;
        const streakSaatIni = ambilStreakSaatIni();
        const tierAktif = cariTierStreak(streakSaatIni);
        absenTierList.innerHTML = STREAK_TIERS.map((t) => `
            <li class="pet-evolusi-item ${t.kelas}${t.kelas === tierAktif.kelas ? ' pet-evolusi-aktif' : ''}">
                <span class="pet-evolusi-emoji streak-tier-emoji ${t.kelas}"></span>
                <span class="pet-evolusi-teks">
                    <span class="pet-evolusi-nama">${t.min === 0 ? 'Mulai absen' : `${t.min}+ hari beruntun`}${t.kelas === tierAktif.kelas ? ' (sekarang)' : ''}</span>
                    <span class="pet-evolusi-syarat">${t.label}</span>
                </span>
            </li>
        `).join('');
    }
    if (btnAbsenInfo && panelAbsenInfoOverlay) {
        btnAbsenInfo.addEventListener('click', () => {
            renderAbsenTierList();
            bukaPanelOverlay(panelAbsenInfoOverlay);
        });
    }
    if (btnTutupAbsenInfo && panelAbsenInfoOverlay) {
        btnTutupAbsenInfo.addEventListener('click', () => tutupPanelOverlay(panelAbsenInfoOverlay));
    }
    function formatTanggal(tanggal) {
        const thn = tanggal.getFullYear();
        const bln = String(tanggal.getMonth() + 1).padStart(2, '0');
        const tgl = String(tanggal.getDate()).padStart(2, '0');
        return `${thn}-${bln}-${tgl}`;
    }
    function perbaruiTampilanAbsen() {
        if (!btnAbsenHarian) return;
        const hariIni = formatTanggal(new Date());
        const terakhir = localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR));
        const sudahAbsenHariIni = terakhir === hariIni;
        btnAbsenHarian.disabled = sudahAbsenHariIni;
        btnAbsenHarian.textContent = sudahAbsenHariIni ? '✓ Sudah Absen' : 'Absen Sekarang';
        elAbsenDesc.textContent = sudahAbsenHariIni ? 'Absen hari ini selesai ✓' : 'Belum absen hari ini';
        const streakSaatIni = ambilStreakSaatIni();
        elAbsenStreak.textContent = streakSaatIni;
        terapkanTierStreak(streakSaatIni);
        if (elAbsenStreakRekor) elAbsenStreakRekor.textContent = ambilRekorStreak();
        perbaruiTabungBonus(streakSaatIni);
    }
    function absenHariIni() {
        const hariIni = new Date();
        const strHariIni = formatTanggal(hariIni);
        const terakhir = localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR));
        if (terakhir === strHariIni) return; // jaga-jaga: sudah absen hari ini
        const kemarin = new Date(hariIni);
        kemarin.setDate(kemarin.getDate() - 1);
        const streakSebelumnya = ambilStreakSaatIni();
        const streakBaru = (terakhir === formatTanggal(kemarin)) ? streakSebelumnya + 1 : 1;
        localStorage.setItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR), strHariIni);
        localStorage.setItem(kunciAkunAktif(KUNCI_ABSEN_STREAK), String(streakBaru));
        // Rekor cuma naik, nggak pernah turun — meski streak-nya putus & balik
        // ke 1, capaian terpanjang yang pernah diraih tetap kesimpen di sini.
        const rekorSebelumnya = ambilRekorStreak();
        const rekorPecah = streakBaru > rekorSebelumnya;
        if (rekorPecah) {
            localStorage.setItem(kunciAkunAktif(KUNCI_ABSEN_STREAK_REKOR), String(streakBaru));
        }
        jadwalkanSinkronProgresGame();
        poinSehat += 10;
        // ===== Bonus Absen Penuh 7 Hari =====
        // Tiap kelipatan 7 hari beruntun (7, 14, 21, ...) siswa dapat bonus
        // +20 Poin Sehat TAMBAHAN di luar +10 poin absen harian biasa.
        // Dicek dari streakBaru (bukan streakSebelumnya) supaya bonus ini
        // ikut aktif lagi tiap kali kelipatan 7 tercapai selama streak-nya
        // terus berlanjut tanpa putus.
        const dapatBonusMingguan = streakBaru > 0 && streakBaru % BONUS_ABSEN_KELIPATAN_HARI === 0;
        if (dapatBonusMingguan) {
            poinSehat += BONUS_ABSEN_POIN;
            tambahKesempatanGantiNama();
        }
        perbaruiTampilanSkor();
        perbaruiTampilanAbsen();
        const tierSebelumnya = cariTierStreak(streakSebelumnya);
        const tierBaru = cariTierStreak(streakBaru);
        // Popup pencapaian buat naik tier api (independen dari toast poin di
        // bawah — bisa saja tampil bareng "Rekor baru"/"Bonus 7 hari" kalau
        // kebetulan terjadi di absen yang sama, teksnya beda tapi keduanya
        // tetap sah-sah aja muncul).
        if (tierBaru.kelas !== tierSebelumnya.kelas) {
            tampilkanPencapaian({
                ikonHtml: `<span class="streak-tier-emoji ${tierBaru.kelas}"></span>`,
                badge: '🔥 Streak Naik Tingkat!',
                judul: `${streakBaru} Hari Beruntun`,
                subjudul: tierBaru.label
            });
        }
        if (dapatBonusMingguan && rekorPecah) {
            tampilkanToastPoin(`🏆🎁 ${streakBaru} hari penuh berturut-turut: Rekor baru + Bonus +${BONUS_ABSEN_POIN} Poin Sehat + kesempatan ganti nama pet!`);
        } else if (dapatBonusMingguan) {
            tampilkanToastPoin(`🎁 Absen penuh ${streakBaru} hari beruntun: Bonus +${BONUS_ABSEN_POIN} Poin Sehat + kesempatan ganti nama pet!`);
        } else if (rekorPecah && streakBaru > 1) {
            tampilkanToastPoin(`🏆 Rekor baru! Streak ${streakBaru} hari, terpanjang yang pernah kamu capai`);
        } else if (tierBaru.kelas !== tierSebelumnya.kelas) {
            tampilkanToastPoin(`🔥 Streak naik ke ${streakBaru} hari: ${tierBaru.label}`);
        } else {
            tampilkanToastPoin('🎉 Absen berhasil! +10 Poin Sehat');
        }
    }
    // ===== Bank Fakta Sehat Absen — fakta/arahan singkat seputar pencegahan
    // diabetes melitus (DM) pada remaja. Dipilih acak (sistem "bag", tidak
    // berulang sebelum semua tampil sekali) tiap kali tombol absen ditekan. =====
    // Sengaja dikosongkan dulu (fakta-fakta lama dihapus) karena masih mengacu
    // ke materi edukasi versi lama. Tambahkan fakta baru di sini nanti, satu
    // per satu, dengan format:
    // { ikon: '🍬', teks: 'Isi fakta singkat di sini.' }
    const FAKTA_ABSEN = [
        // ===== Materi 1: Kenali Diabetes Melitus Tipe 2 (DMT2) =====
        { ikon: '🩺', teks: 'DMT2 adalah kondisi ketika kadar gula darah tinggi terus-menerus, atau disebut hiperglikemia.' },
        { ikon: '🍚', teks: 'Glukosa dalam darah berasal dari makanan dan minuman berkarbohidrat atau manis yang kamu konsumsi sehari-hari.' },
        { ikon: '🔑', teks: 'Insulin bertugas mengantarkan glukosa dari darah masuk ke dalam sel supaya bisa diubah menjadi energi.' },
        { ikon: '🔒', teks: 'Insulin diibaratkan seperti kunci, sedangkan sel tubuh diibaratkan sebagai gembok tempat glukosa masuk.' },
        { ikon: '⚡', teks: 'Pada DMT2, sel tubuh menjadi kurang peka terhadap insulin. Kondisi ini disebut resistensi insulin.' },
        { ikon: '⏳', teks: 'DMT2 termasuk penyakit kronis yang umumnya tidak sembuh total, tapi risikonya bisa dikendalikan dan dicegah.' },
        { ikon: '👁️', teks: 'DMT2 yang dibiarkan bisa memicu gangguan pada mata, ginjal, jantung, dan saraf.' },
        { ikon: '📈', teks: 'Kasus DMT2 pada remaja terus meningkat 2 sampai 3 kali lipat dibanding sekitar 30 tahun lalu.' },
        { ikon: '🍟', teks: 'Pola makan tinggi gula, kurang aktivitas fisik, dan terlalu banyak duduk berhubungan dengan meningkatnya risiko DMT2.' },
        { ikon: '🌱', teks: 'Masa remaja adalah masa pembentukan kebiasaan yang cenderung terbawa sampai dewasa, jadi penting mencegah DMT2 sejak sekarang.' },
        // ===== Materi 2: Kenali Gejala dan Bahaya Diabetes =====
        { ikon: '🚰', teks: 'Tiga gejala khas DMT2 adalah sering haus, sering buang air kecil, dan sering lapar berlebihan.' },
        { ikon: '🚻', teks: 'Poliuria adalah istilah medis untuk gejala sering buang air kecil.' },
        { ikon: '🥤', teks: 'Polidipsia adalah istilah medis untuk gejala sering merasa haus.' },
        { ikon: '🍽️', teks: 'Polifagia adalah istilah medis untuk gejala sering merasa lapar atau banyak makan.' },
        { ikon: '🔄', teks: 'Ginjal berusaha membuang kelebihan glukosa lewat urine. Itulah sebabnya penderita DMT2 sering buang air kecil.' },
        { ikon: '⚡', teks: 'Sel tubuh tetap kekurangan energi walau glukosa di darah melimpah, sehingga muncul rasa lapar berlebihan.' },
        { ikon: '🗣️', teks: 'Kalau gejala 3P muncul berlebihan atau terus-menerus, segera cerita ke orang tua, guru, atau tenaga kesehatan.' },
        { ikon: '🦵', teks: 'Diabetes yang tidak terkontrol bisa merusak saraf dan pembuluh darah, menyebabkan kesemutan hingga gangguan sirkulasi.' },
        { ikon: '🩹', teks: 'Luka di kaki penderita diabetes bisa sulit sembuh dan meningkatkan risiko amputasi kalau infeksinya memburuk.' },
        { ikon: '❤️', teks: 'Stroke bisa terjadi kalau pembuluh darah menuju otak mengalami gangguan akibat diabetes yang tidak terkontrol.' },
        // ===== Materi 3: Gula, Makanan, dan Minuman yang Perlu Dibatasi =====
        { ikon: '➕', teks: 'Gula tambahan adalah gula yang sengaja ditambahkan ke makanan atau minuman saat diolah, dimasak, atau disajikan.' },
        { ikon: '🍯', teks: 'Gula bebas mencakup gula tambahan plus gula alami dalam madu, sirup, dan jus buah.' },
        { ikon: '🧃', teks: 'Jus buah termasuk gula bebas karena sebagian besar seratnya hilang saat diolah, sehingga gula lebih cepat diserap tubuh.' },
        { ikon: '🍎', teks: 'Gula dalam buah utuh ditemani serat yang memperlambat penyerapannya, beda dengan gula tambahan.' },
        { ikon: '🥤', teks: 'Soda, teh manis, dan boba adalah contoh minuman tinggi gula yang perlu dibatasi konsumsinya.' },
        { ikon: '🍹', teks: 'Minuman manis mudah dihabiskan dan tidak terlalu membuat kenyang, sehingga gulanya sering tidak disadari.' },
        { ikon: '⚖️', teks: 'Kalau gula atau kalori yang masuk lebih banyak dari yang dibutuhkan, kelebihannya akan disimpan tubuh sebagai lemak.' },
        { ikon: '📊', teks: 'Pola makan tinggi gula yang terus-menerus berhubungan dengan meningkatnya risiko resistensi insulin.' },
        { ikon: '🙂', teks: 'Makanan dan minuman manis tidak harus dihindari total, tapi sebaiknya dibatasi jumlah dan frekuensinya.' },
        { ikon: '🥛', teks: 'Selain gula pasir, gula juga bisa ditemukan secara alami di dalam buah, sayur, dan susu.' },
        // ===== Materi 4: Batas Konsumsi Gula dan Cara Membaca Label =====
        { ikon: '🥄', teks: 'Kemenkes RI menganjurkan konsumsi gula tambahan tidak lebih dari 50 gram atau setara 4 sendok makan per hari.' },
        { ikon: '🌐', teks: 'WHO menganjurkan membatasi gula bebas tidak lebih dari 10% dari total energi harian.' },
        { ikon: '🌟', teks: 'Kalau konsumsi gula bebas bisa di bawah 5% dari energi harian, manfaatnya untuk kesehatan makin besar.' },
        { ikon: '❗', teks: 'Batas 50 gram gula per hari itu batas maksimal, bukan target yang harus dipenuhi setiap hari.' },
        { ikon: '🍚', teks: 'Tubuh sebenarnya sudah bisa mendapatkan energi yang cukup dari makanan pokok, buah, dan sayur tanpa tambahan gula.' },
        { ikon: '🧮', teks: 'Segelas teh manis, minuman kekinian, dan camilan manis saja totalnya bisa melebihi 50 gram gula dalam sehari.' },
        { ikon: '🏷️', teks: 'Hampir semua makanan dan minuman kemasan di Indonesia wajib mencantumkan label Informasi Nilai Gizi.' },
        { ikon: '📏', teks: 'Angka gula yang tertulis di label kemasan biasanya untuk satu takaran saji, bukan untuk satu kemasan penuh.' },
        { ikon: '📦', teks: 'Total gula dalam satu kemasan dihitung dengan cara mengalikan gula per sajian dengan jumlah sajian per kemasan.' },
        { ikon: '⚖️', teks: 'Saat membandingkan dua produk, pastikan takaran sajinya kurang lebih sama, lalu pilih yang gula per sajiannya lebih rendah.' },
        // ===== Materi 5: Aktivitas Fisik untuk Mencegah DMT2 =====
        { ikon: '🏃', teks: 'Aktivitas fisik adalah semua gerakan tubuh yang dihasilkan otot dan memerlukan energi, seperti jalan kaki atau menyapu.' },
        { ikon: '🏸', teks: 'Olahraga adalah salah satu bentuk aktivitas fisik yang lebih terencana dan terstruktur, misalnya latihan futsal terjadwal.' },
        { ikon: '✅', teks: 'Semua olahraga termasuk aktivitas fisik, tapi tidak semua aktivitas fisik harus berupa olahraga.' },
        { ikon: '💪', teks: 'Aktivitas fisik membantu sel-sel tubuh lebih peka terhadap insulin.' },
        { ikon: '🔥', teks: 'Aktivitas fisik membantu tubuh menggunakan glukosa dalam darah sebagai energi.' },
        { ikon: '⏱️', teks: 'WHO menganjurkan remaja usia 5 sampai 17 tahun melakukan aktivitas fisik sedang hingga berat minimal 60 menit setiap hari.' },
        { ikon: '🔁', teks: 'Aktivitas fisik ringan yang dilakukan rutin setiap hari lebih bermanfaat daripada olahraga berat yang cuma sesekali.' },
        { ikon: '🪜', teks: 'Naik tangga daripada naik lift atau eskalator juga termasuk aktivitas fisik sehari-hari.' },
        { ikon: '🪑', teks: 'Perilaku sedentari adalah kebiasaan duduk atau berbaring lama dengan sedikit gerakan, misalnya main gawai berjam-jam.' },
        { ikon: '⏰', teks: 'Selingi waktu duduk lama dengan berdiri, meregangkan badan, atau berjalan sebentar setiap 1 sampai 2 jam.' },
        // ===== Materi 6: Membangun Kebiasaan Hidup Sehat Sejak Remaja =====
        { ikon: '🔁', teks: 'DMT2 terbentuk dari kebiasaan yang berulang setiap hari, bukan dari kejadian sesaat.' },
        { ikon: '🌱', teks: 'Kebiasaan yang dibentuk sejak remaja cenderung terbawa sampai dewasa.' },
        { ikon: '🧩', teks: 'Materi 1 sampai 5 itu seperti potongan puzzle yang menyatu jadi satu kebiasaan hidup sehat.' },
        { ikon: '🐢', teks: 'Ubah kebiasaan sedikit demi sedikit, tidak perlu langsung drastis.' },
        { ikon: '🏷️', teks: 'Baca label dan batasi gula adalah dua kebiasaan yang saling melengkapi.' },
        { ikon: '💧', teks: 'Membiasakan minum air putih membantu mengurangi asupan gula tersembunyi dari minuman manis.' },
        { ikon: '🍎', teks: 'Camilan yang lebih sehat contohnya buah potong, kacang-kacangan, atau yogurt tawar.' },
        { ikon: '📴', teks: 'Batasi waktu bermain gawai untuk hiburan, apalagi kalau sambil ngemil tanpa disadari porsinya.' },
        { ikon: '📲', teks: 'Konten di media sosial dirancang supaya terlihat menarik, bukan berarti otomatis sehat.' },
        { ikon: '🕸️', teks: 'Kebiasaan hidup sehat saling berkaitan seperti jaring laba-laba. Makin banyak yang terhubung, makin kuat menahan risiko DMT2.' },
        // ===== Tips Sehat Materi 1: Pilih Minuman yang Lebih Sehat =====
        { ikon: '💧', teks: 'Air putih adalah minuman paling aman untuk diminum setiap hari karena tidak mengandung gula maupun kalori tambahan.' },
        { ikon: '🚰', teks: 'Remaja usia 10 sampai 18 tahun membutuhkan sekitar 1.850 sampai 2.150 ml cairan setiap hari.' },
        { ikon: '🍵', teks: 'Teh manis, baik kemasan maupun buatan sendiri, tetap mengandung gula tambahan yang cukup banyak.' },
        { ikon: '🥤', teks: 'Minuman bersoda umumnya tinggi gula dan kalori, tapi rendah zat gizi lain yang dibutuhkan tubuh.' },
        { ikon: '🧋', teks: 'Minuman boba atau minuman kekinian sering ditambahkan gula dalam jumlah besar, baik dari sirup maupun toppingnya.' },
        { ikon: '📦', teks: 'Jus kemasan dan minuman berperisa sering sudah ditambahkan gula meski rasanya tidak terlalu manis.' },
        { ikon: '😊', teks: 'Minuman manis boleh dinikmati sesekali, asal air putih tetap jadi pilihan utama setiap hari.' },
        { ikon: '🏷️', teks: 'Melihat label Informasi Nilai Gizi sebelum membeli membantu kamu tahu jumlah gula dalam minuman kemasan.' },
        { ikon: '⚖️', teks: 'Kalau ada beberapa pilihan minuman, bandingkan dulu kandungan gulanya sebelum membeli.' },
        { ikon: '✅', teks: 'Kalau tersedia varian minuman dengan gula lebih rendah, kamu bisa mencobanya sebagai alternatif dari minuman manis biasa.' },
        // ===== Tips Sehat Materi 2: Cek Label Sebelum Membeli =====
        { ikon: '🏷️', teks: 'Setiap makanan dan minuman kemasan wajib mencantumkan label Informasi Nilai Gizi.' },
        { ikon: '🔍', teks: 'Label kemasan membantu kamu tahu kandungan gula, bukan cuma menebak dari rasanya saja.' },
        { ikon: '📋', teks: 'Ada empat langkah membaca label sebelum membeli, yaitu cari, lihat, cek, dan bandingkan.' },
        { ikon: '📦', teks: 'Gula per sajian bukan berarti gula dari seluruh kemasan, karena satu kemasan bisa berisi beberapa sajian.' },
        { ikon: '🧮', teks: 'Kalau satu kemasan berisi 4 sajian dan dihabiskan semua, gula yang dikonsumsi menjadi 4 kali lipat dari gula per sajian.' },
        { ikon: '⚖️', teks: 'Kalau takaran saji dua produk berbeda, samakan dulu ukurannya sebelum membandingkan gulanya.' },
        { ikon: '🍵', teks: 'Satu botol teh manis kemasan bisa mengandung sekitar 20 sampai 29 gram gula, tergantung mereknya.' },
        { ikon: '🧃', teks: 'Jus buah kemasan tetap bisa memiliki kandungan gula tambahan yang cukup tinggi, meski mengandung vitamin C.' },
        { ikon: '🥛', teks: 'Susu kental manis yang ditambahkan ke minuman sachet mengandung sekitar 14 sampai 16 gram gula per takaran saji 30 gram.' },
        { ikon: '📝', teks: 'Kebiasaan membaca label membantu kamu membuat pilihan makanan dan minuman yang lebih sadar.' },
        // ===== Tips Sehat Materi 3: Batasi Makanan dan Minuman Tinggi Gula =====
        { ikon: '🥤', teks: 'Satu kaleng minuman bersoda bisa mengandung gula di atas 39 gram, hampir menyentuh batas anjuran gula harian.' },
        { ikon: '🧋', teks: 'Satu porsi milk tea dengan topping boba bisa mengandung sekitar 38 gram gula.' },
        { ikon: '🥐', teks: 'Satu potong roti manis dengan topping bisa mengandung sekitar 12 sampai 13 gram gula.' },
        { ikon: '🍩', teks: 'Dua buah donat cokelat bisa mengandung sekitar 24 gram gula, hampir separuh dari batas anjuran gula harian.' },
        { ikon: '🍬', teks: 'Permen dan cokelat berukuran kecil, tapi komponen utamanya hampir seluruhnya gula tanpa banyak zat gizi lain.' },
        { ikon: '🍨', teks: 'Satu buah es krim cone bisa mengandung sekitar 22 gram gula.' },
        { ikon: '😊', teks: 'Teh manis, soda, boba, kue, permen, cokelat, dan es krim boleh dinikmati sesekali, asal tidak jadi kebiasaan setiap hari.' },
        { ikon: '🥄', teks: 'Satu sendok teh gula pasir mengandung sekitar 4 gram gula.' },
        { ikon: '❤️', teks: 'American Heart Association menganjurkan gula tambahan tidak lebih dari 36 gram per hari untuk laki laki dan 25 gram per hari untuk perempuan.' },
        { ikon: '🍵', teks: 'Gula yang kamu tambahkan sendiri ke teh atau kopi juga termasuk gula tambahan yang dihitung dalam batas konsumsi gula harian.' },
        // ===== Tips Sehat Materi 4: Pilih Camilan dan Bekal yang Lebih Sehat =====
        { ikon: '🍏', teks: 'Buah utuh masih punya serat alami yang membantu memperlambat penyerapan gula ke dalam darah, beda dengan jus buah kemasan.' },
        { ikon: '🍇', teks: 'Gula alami pada buah utuh tidak termasuk kategori gula bebas menurut WHO, berbeda dengan gula tambahan pada camilan kemasan.' },
        { ikon: '🏷️', teks: 'Kalau memilih camilan kemasan, bandingkan beberapa produk dan pilih yang kandungan gulanya paling rendah per sajian.' },
        { ikon: '🥗', teks: 'Mengganti camilan tinggi gula dengan sayur dan buah adalah salah satu cara paling mudah membatasi gula, garam, dan lemak berlebih.' },
        { ikon: '🥜', teks: 'Kacang tanah, kacang hijau, dan edamame membuat gula darah naik lebih perlahan setelah dimakan dibanding kue atau camilan manis.' },
        { ikon: '🍌', teks: 'Kacang tanah dan pisang termasuk pangan lokal yang bisa diolah menjadi camilan sehat yang mudah ditemukan di sekitar kita.' },
        { ikon: '🧁', teks: 'Kue, donat, dan camilan manis lain di kantin boleh tetap dinikmati asal frekuensinya dikurangi, tidak perlu berhenti total.' },
        { ikon: '🍱', teks: 'Membawa bekal dari rumah membantu kamu mengontrol sendiri porsi dan jenis makanan yang dikonsumsi selama di sekolah.' },
        { ikon: '🎒', teks: 'Semakin sering seorang anak membawa bekal ke sekolah, semakin rendah kecenderungannya untuk jajan sembarangan.' },
        { ikon: '👫', teks: 'Nggak masalah kalau pilihan camilan atau bekalmu berbeda dari teman, karena kesehatanmu sendiri yang paling penting.' },
        // ===== Tips Sehat Materi 5: Biasakan Aktif Bergerak =====
        { ikon: '⏱️', teks: 'WHO menganjurkan remaja usia 5 sampai 17 tahun melakukan aktivitas fisik sedang hingga berat sekitar 60 menit setiap hari, dan totalnya bisa dicicil dari beberapa kegiatan sepanjang hari.' },
        { ikon: '🌟', teks: 'Semakin banyak aktivitas fisik yang kamu lakukan dalam sehari, semakin besar juga manfaat kesehatannya.' },
        { ikon: '👫', teks: 'Bergerak aktif bersama teman biasanya lebih mudah bertahan lama dibanding dilakukan sendirian.' },
        { ikon: '🎮', teks: 'Ajak teman main aktif bisa jadi alternatif seru saat waktu luang, dibanding hanya duduk lama sambil main gawai.' },
        { ikon: '🏫', teks: 'Aktif bergerak saat pelajaran PJOK dan ikut ekstrakurikuler olahraga membantu memenuhi kebutuhan aktivitas fisik harianmu.' },
        { ikon: '📵', teks: 'Siswa yang aktif mengikuti ekstrakurikuler olahraga cenderung memiliki waktu bermain gawai yang lebih sedikit.' },
        { ikon: '🪑', teks: 'Duduk terlalu lama membuat tubuh lebih sedikit membakar energi, dan sel tubuh jadi kurang terlatih merespons insulin dengan baik.' },
        { ikon: '⏰', teks: 'Coba berdiri atau bergerak sebentar setiap satu jam sekali kalau kamu sedang duduk lama, misalnya saat belajar atau main gawai.' },
        { ikon: '🪜', teks: 'Naik tangga daripada lift atau eskalator, serta jalan kaki 10.000 langkah per hari, termasuk anjuran aktivitas fisik dari Kementerian Kesehatan RI.' },
        { ikon: '🧹', teks: 'Kegiatan rumah tangga ringan seperti menyapu, mencuci piring, atau beres beres kamar juga ikut menghitung sebagai aktivitas fisik harian.' },
        // ===== Tips Sehat Materi 6: Kurangi Duduk dan Screen Time =====
        { ikon: '🪑', teks: 'Perilaku sedentari adalah kebiasaan duduk atau berbaring lama dengan sedikit gerakan, misalnya duduk lama sambil main HP atau nonton TV.' },
        { ikon: '🔑', teks: 'Semakin lama waktu duduk dan waktu layar harianmu, semakin besar juga kemungkinan sel tubuh mengalami resistensi insulin.' },
        { ikon: '📊', teks: 'Sebuah penelitian pada remaja di Surabaya dan Sidoarjo menemukan risiko resistensi insulin naik sekitar 4 kali lipat pada kelompok dengan waktu layar 3 sampai 6 jam per hari.' },
        { ikon: '⚖️', teks: 'Semakin lama waktu layar harianmu, semakin tinggi juga risiko kelebihan berat badan dan obesitas.' },
        { ikon: '😴', teks: 'Paparan cahaya layar yang terlalu lama bisa mengganggu hormon pengatur tidur, sehingga kualitas tidurmu ikut menurun.' },
        { ikon: '⏳', teks: 'WHO menganjurkan waktu layar untuk hiburan tidak lebih dari 2 jam per hari bagi anak dan remaja, di luar kebutuhan belajar.' },
        { ikon: '📺', teks: 'Menonton TV dalam waktu lama juga termasuk kategori waktu layar yang perlu dibatasi, sama seperti main HP.' },
        { ikon: '🧍', teks: 'Ahli kesehatan menyarankan berdiri atau bergerak sebentar setiap sekitar 30 menit sekali kalau kamu sedang duduk lama.' },
        { ikon: '👫', teks: 'Ajak teman melakukan aktivitas yang membuat tubuh bergerak, misalnya main di luar, dibanding hanya berkumpul sambil main HP.' },
        { ikon: '🎯', teks: 'Mengurangi duduk dan screen time bukan berarti berhenti total pakai HP atau TV, yang penting waktu layarmu tetap seimbang dengan aktivitas fisik.' }
    ];
    // Placeholder yang tampil selama FAKTA_ABSEN masih kosong, supaya popup
    // absen harian tetap muncul normal (jeda baca 5-7 detik tetap berjalan).
    const FAKTA_ABSEN_PLACEHOLDER = { ikon: '🔧', teks: 'Materi segera hadir, ya!' };
    let bagFaktaAbsenIndeks = [];
    function ambilFaktaAbsenAcak() {
        if (FAKTA_ABSEN.length === 0) return FAKTA_ABSEN_PLACEHOLDER;
        if (bagFaktaAbsenIndeks.length === 0) {
            bagFaktaAbsenIndeks = FAKTA_ABSEN.map((_, i) => i);
            for (let i = bagFaktaAbsenIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagFaktaAbsenIndeks[i], bagFaktaAbsenIndeks[j]] = [bagFaktaAbsenIndeks[j], bagFaktaAbsenIndeks[i]];
            }
        }
        return FAKTA_ABSEN[bagFaktaAbsenIndeks.pop()];
    }
    function bersihkanJedaAbsenFakta() {
        if (timerJedaAbsenFakta) {
            window.clearInterval(timerJedaAbsenFakta);
            timerJedaAbsenFakta = null;
        }
    }
    // Menampilkan satu fakta acak dan mengunci tombol lanjut selama 5-7 detik
    // (acak tiap kemunculan) supaya siswa yang cuma niat absen tetap "terpapar"
    // materi edukasi minimal beberapa detik sebelum kehadirannya tercatat.
    function bukaFaktaAbsen() {
        if (!panelAbsenFaktaOverlay || !btnLanjutAbsenFakta || !elAbsenFaktaTeks) {
            absenHariIni(); // fallback: kalau markup modal tidak ada, tetap catat absen
            return;
        }
        const fakta = ambilFaktaAbsenAcak();
        elAbsenFaktaTeks.textContent = fakta.teks;
        if (elAbsenFaktaIkon) elAbsenFaktaIkon.textContent = fakta.ikon;
        bukaPanelOverlay(panelAbsenFaktaOverlay);
        bersihkanJedaAbsenFakta();
        let sisaDetik = 5 + Math.floor(Math.random() * 3); // acak 5, 6, atau 7 detik
        btnLanjutAbsenFakta.disabled = true;
        btnLanjutAbsenFakta.textContent = `Baca dulu ya... (${sisaDetik})`;
        timerJedaAbsenFakta = window.setInterval(() => {
            sisaDetik--;
            if (sisaDetik <= 0) {
                bersihkanJedaAbsenFakta();
                btnLanjutAbsenFakta.disabled = false;
                btnLanjutAbsenFakta.textContent = 'Absen Sekarang →';
            } else {
                btnLanjutAbsenFakta.textContent = `Baca dulu ya... (${sisaDetik})`;
            }
        }, 1000);
        btnLanjutAbsenFakta.onclick = () => {
            if (btnLanjutAbsenFakta.disabled) return; // jaga-jaga terhadap klik sebelum waktunya
            bersihkanJedaAbsenFakta();
            tutupPanelOverlay(panelAbsenFaktaOverlay);
            absenHariIni();
        };
    }
    if (btnAbsenHarian) {
        btnAbsenHarian.addEventListener('click', bukaFaktaAbsen);
    }
    bangunPapan();
    muatStateSesi();
    elSkorTertinggi.textContent = ambilSkorTertinggi();
    perbaruiTampilanAbsen();
    perbaruiTampilanPet();
    // ===== Auto-unlock tombol Absen pas tengah malam waktu setempat =====
    // formatTanggal() sudah pakai tanggal LOKAL device (bukan hitung mundur
    // 24 jam dari kapan tombol dipencet), jadi absen memang seharusnya
    // kebuka lagi begitu tanggal kalender berganti — nggak peduli jam
    // berapa terakhir kali user absen. Tapi kalau tab dibiarkan terbuka
    // lewat tengah malam tanpa di-refresh, tampilan tombolnya nggak ikut
    // ke-update sendiri. Ini yang bikin kerasa "kayak nunggu 24 jam".
    // Jadwalkan pengecekan ulang PAS di tengah malam berikutnya, lalu
    // ulangi tiap 24 jam setelah itu.
    let _timerRefreshAbsenTengahMalam = null;
    function jadwalkanRefreshAbsenTengahMalam() {
        window.clearTimeout(_timerRefreshAbsenTengahMalam);
        const sekarang = new Date();
        const tengahMalamBerikutnya = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() + 1, 0, 0, 2, 0); // +2 detik jaga-jaga
        const msSampaiTengahMalam = tengahMalamBerikutnya.getTime() - sekarang.getTime();
        _timerRefreshAbsenTengahMalam = window.setTimeout(() => {
            perbaruiTampilanAbsen();
            jadwalkanRefreshAbsenTengahMalam(); // jadwalkan lagi buat tengah malam besoknya
        }, msSampaiTengahMalam);
    }
    jadwalkanRefreshAbsenTengahMalam();
    // Tab yang lama disembunyikan (misal HP dikunci semalaman) bikin browser
    // nge-throttle/pause setTimeout, jadi begitu tab aktif lagi kita cek
    // ulang manual juga — jaga-jaga kalau timer di atas telat kepicu.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            perbaruiTampilanAbsen();
            jadwalkanRefreshAbsenTengahMalam();
        }
    });
    // Dipanggil tiap ganti akun (login/logout) — HANYA memuat ulang data akun yang
    // aktif, TIDAK mereset Poin Sehat. Poin cuma boleh balik ke 0 lewat tombol Reset.
    window.refreshSkorDanAbsen = () => {
        muatStateSesi();
        elSkorTertinggi.textContent = ambilSkorTertinggi();
        perbaruiTampilanAbsen();
    };
    const panelKonfirmasiResetOverlay = document.getElementById('panelKonfirmasiResetOverlay');
    const btnKonfirmasiResetGame = document.getElementById('btnKonfirmasiResetGame');
    const btnBatalResetGame = document.getElementById('btnBatalResetGame');
    // Tombol "Ulangi dari awal" sudah dihilangkan dari tampilan (index.html),
    // jadi btnResetGame bisa jadi null di sini — semua pasang-listener di bawah
    // dijaga supaya skrip nggak error kalau elemennya memang nggak ada.
    if (btnResetGame && panelKonfirmasiResetOverlay && btnKonfirmasiResetGame && btnBatalResetGame) {
        btnResetGame.addEventListener('click', () => {
            // Jangan langsung reset — tampilkan peringatan dulu supaya pemain
            // sadar Poin Sehat & posisi papan yang sedang berjalan akan hilang
            // (Pet dan Skor Tertinggi TIDAK ikut ter-reset).
            bukaPanelOverlay(panelKonfirmasiResetOverlay);
        });
        btnKonfirmasiResetGame.addEventListener('click', () => {
            tutupPanelOverlay(panelKonfirmasiResetOverlay);
            resetGame();
        });
        btnBatalResetGame.addEventListener('click', () => {
            tutupPanelOverlay(panelKonfirmasiResetOverlay);
        });
    } else if (btnResetGame) {
        // fallback kalau markup overlay belum ada, supaya tombol tetap berfungsi
        btnResetGame.addEventListener('click', resetGame);
    }
    btnKocok.addEventListener('click', kocokDadu);

    // ===== Notifikasi Pengingat Absen (Firebase Cloud Messaging) =====
    // Modul ini HANYA menangani sisi "client": minta izin notifikasi ke
    // user, ambil token perangkatnya dari FCM, lalu simpan token itu ke
    // Firestore (koleksi "progresGame", field fcmToken) supaya bisa
    // dipakai server (Cloud Function terjadwal) buat mengirim notifikasi
    // "belum absen hari ini" ke device yang bersangkutan.
    //
    // VAPID key ini didapat dari Firebase Console > Project Settings >
    // Cloud Messaging > Web Push certificates. Bukan rahasia/password
    // (sama seperti firebaseConfig), aman ditulis di kode client.
    const VAPID_KEY_FCM = 'BAd7RzUn3V4B7P_jb1afELiW8eF1cM-vrWIC3O3WcBLT_fzCDlVPRzdvlgRXH-ILkKedHAVD9yWCqMMiCsApTzI';
    let _messagingInstance = null;
    let _onMessageTerpasang = false;
    // Fitur ini butuh: (1) API Notification & Service Worker didukung
    // browser, dan (2) SDK firebase-messaging-compat berhasil dimuat.
    // Kalau salah satu tidak ada (mis. browser lama, atau di-block
    // ekstensi), modul ini diam saja — tombol & status ikut disembunyikan
    // lewat perbaruiTampilanNotifikasiAbsen(), bukan melempar error.
    function notifikasiDidukungBrowser() {
        return ('Notification' in window) && ('serviceWorker' in navigator)
            && typeof firebase !== 'undefined' && typeof firebase.messaging === 'function';
    }
    function ambilMessagingInstance() {
        if (!_messagingInstance) _messagingInstance = firebase.messaging();
        // onMessage menangani notifikasi yang masuk PAS tab ini sedang
        // dibuka/fokus (kalau tab tertutup/background, yang menangani
        // adalah onBackgroundMessage() di firebase-messaging-sw.js).
        if (!_onMessageTerpasang) {
            _onMessageTerpasang = true;
            _messagingInstance.onMessage((payload) => {
                const judul = (payload.notification && payload.notification.title) || 'Sobat Sehat';
                const isi = (payload.notification && payload.notification.body) || '';
                tampilkanToast(`🔔 ${judul}${isi ? ': ' + isi : ''}`);
            });
        }
        return _messagingInstance;
    }
    // Update tampilan tombol + teks status sesuai kondisi izin notifikasi
    // saat ini. Dipanggil dari window.refreshGameAkun() (lihat atas), jadi
    // otomatis ter-refresh tiap kali login / sesi dipulihkan / ganti akun.
    function perbaruiTampilanNotifikasiAbsen() {
        if (!btnAktifkanNotifikasi || !elNotifAbsenStatus) return;
        if (!emailAktif || !notifikasiDidukungBrowser()) {
            btnAktifkanNotifikasi.classList.add('hidden');
            elNotifAbsenStatus.classList.add('hidden');
            return;
        }
        const izin = Notification.permission; // 'default' | 'granted' | 'denied'
        if (izin === 'granted') {
            btnAktifkanNotifikasi.classList.add('hidden');
            elNotifAbsenStatus.textContent = '🔔 Pengingat absen aktif di perangkat ini';
            elNotifAbsenStatus.className = 'notif-absen-status status-aktif';
            // Token FCM bisa berubah sewaktu-waktu (mis. cache browser
            // dibersihkan) — diam-diam disegarkan tiap tampilan diperbarui,
            // TANPA memunculkan prompt baru karena izin sudah granted.
            daftarkanTokenNotifikasi({ senyap: true });
        } else if (izin === 'denied') {
            btnAktifkanNotifikasi.classList.add('hidden');
            elNotifAbsenStatus.textContent = '🔕 Notifikasi diblokir browser. Aktifkan lewat pengaturan situs kalau berubah pikiran.';
            elNotifAbsenStatus.className = 'notif-absen-status status-ditolak';
        } else {
            btnAktifkanNotifikasi.classList.remove('hidden');
            btnAktifkanNotifikasi.disabled = false;
            btnAktifkanNotifikasi.textContent = '🔔 Aktifkan Pengingat Absen';
            elNotifAbsenStatus.classList.add('hidden');
        }
    }
    // Proses inti: daftarkan service worker, minta token FCM, simpan ke
    // Firestore. opsi.senyap=true dipakai buat penyegaran token diam-diam
    // (tidak menampilkan toast/pesan error ke user, karena bukan aksi yang
    // sengaja mereka lakukan).
    function daftarkanTokenNotifikasi(opsi) {
        const senyap = !!(opsi && opsi.senyap);
        if (!emailAktif || typeof db === 'undefined') return Promise.resolve();
        return navigator.serviceWorker.register('firebase-messaging-sw.js')
            .then((registration) => ambilMessagingInstance().getToken({
                vapidKey: VAPID_KEY_FCM,
                serviceWorkerRegistration: registration
            }))
            .then((token) => {
                if (!token) throw new Error('Token FCM kosong');
                return db.collection('progresGame').doc(emailAktif).set({
                    fcmToken: token,
                    fcmTokenDiperbaruiPada: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            })
            .catch((err) => {
                console.warn('Gagal mendaftarkan notifikasi pengingat absen:', err);
                if (!senyap) tampilkanToast('Gagal mengaktifkan notifikasi. Coba lagi ya.');
            });
    }
    // Diklik user lewat tombol "🔔 Aktifkan Pengingat Absen" — ini SATU-
    // SATUNYA tempat yang memicu prompt izin notifikasi, sengaja tidak
    // diminta otomatis saat halaman dibuka supaya tidak terasa mengganggu/
    // spam ke pengunjung baru.
    if (btnAktifkanNotifikasi) {
        btnAktifkanNotifikasi.addEventListener('click', () => {
            if (!notifikasiDidukungBrowser()) return;
            btnAktifkanNotifikasi.disabled = true;
            btnAktifkanNotifikasi.textContent = 'Memproses...';
            Notification.requestPermission().then((izin) => {
                if (izin === 'granted') {
                    return daftarkanTokenNotifikasi({ senyap: false }).then(() => {
                        tampilkanToastPoin('🔔 Pengingat absen aktif!');
                    });
                }
            }).finally(() => {
                btnAktifkanNotifikasi.disabled = false;
                perbaruiTampilanNotifikasiAbsen();
            });
        });
    }
})();
// ===== Cegah tombol Back (HP/browser) langsung "keluar" dari web =====
// Web ini SPA — semua halaman (landing, login, dashboard, game, dst) cuma
// ganti-ganti div lewat JS, bukan pindah URL sungguhan. Jadi tombol Back
// default-nya langsung keluar dari web (balik ke halaman sebelum web ini
// dibuka) alih-alih "mundur" di dalam web — dan begitu dibuka lagi, sesi
// kelihatan hilang/harus login ulang.
// Solusinya: tiap kali web ini dibuka, selalu dorong satu "state penjaga"
// ke history. Begitu tombol Back ditekan (memicu popstate), state penjaga
// itu langsung didorong lagi (supaya browser TIDAK jadi benar-benar pindah),
// lalu tampilkan konfirmasi yang sama seperti tombol Logout — supaya tidak
// ada yang keluar/ke-logout tanpa sengaja, tapi tetap bisa keluar kalau
// memang itu yang diinginkan.
history.pushState({ sobatSehatGuard: true }, '');
window.addEventListener('popstate', () => {
    history.pushState({ sobatSehatGuard: true }, '');
    if (panelKonfirmasiLogoutOverlay) {
        bukaPanelOverlay(panelKonfirmasiLogoutOverlay);
    } else {
        // fallback kalau markup overlay belum ada
        if (confirm('Keluar dari Sobat Sehat? Kamu akan logout dari akun ini.')) {
            jalankanLogout();
            history.go(-2);
        }
    }
});

// Ditaruh di baris paling akhir supaya window.muatProgresDariFirestore dan
// window.refreshGameAkun (didefinisikan di IIFE game di atas) sudah pasti
// siap dipakai saat selesaikanLogin() dipanggil di sini.
(function pulihkanSesiTersimpan() {
    const sesi = ambilSesiAktif();
    if (sesi && sesi.email) {
        selesaikanLogin(sesi.email, sesi.nama || turunkanNamaDariEmail(sesi.email));
    }
})();

// ===== Upgrade emoji ke Twemoji (SVG) =====
// Emoji unicode biasa (🎲, ❤️, dll) dirender pakai font emoji bawaan OS/
// browser pengunjung, jadi tampilannya beda-beda tiap device (Windows lama,
// merek HP tertentu, dsb). Blok ini otomatis mengganti semua emoji tersebut
// jadi gambar SVG Twemoji, supaya tampilannya identik & tajam di semua device.
// MutationObserver dipakai karena banyak bagian web ini (papan game, kuis,
// modal, panel absen/pet) di-render belakangan lewat JS, bukan cuma dari HTML awal.
(function upgradeEmojiKeTwemoji() {
    if (typeof twemoji === 'undefined') return; // kalau CDN gagal dimuat, biarkan emoji biasa tampil
    const opsiTwemoji = { folder: 'svg', ext: '.svg', className: 'emoji' };
    function parseSemua(target) {
        try {
            twemoji.parse(target, opsiTwemoji);
        } catch (e) {
            // abaikan node yang tidak bisa diparse (mis. sudah berupa gambar)
        }
    }
    parseSemua(document.body);
    let jadwalParse = null;
    const observer = new MutationObserver((mutations) => {
        // debounce ringan supaya nggak parse berkali-kali saat banyak elemen
        // berubah sekaligus (mis. render ulang papan game / daftar kuis)
        clearTimeout(jadwalParse);
        jadwalParse = setTimeout(() => parseSemua(document.body), 60);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();

