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
});
// Dipanggil setelah login berhasil (baik lewat form email+sandi maupun
// lewat tombol "Masuk dengan Google") — supaya kedua jalur login berujung
// ke proses yang sama persis: buka dashboard, catat pengunjung, tarik
// progres dari Firestore, dst.
function selesaikanLogin(email, nama) {
    emailAktif = email;
    topbarUser.textContent = `Halo, ${nama}`;
    dashboardWelcome.textContent = `Selamat datang, ${nama}! Berikut ringkasan halaman kamu.`;
    sembunyikanErrorLogin();
    if (googleLoginError) googleLoginError.classList.add('hidden');
    landingPage.classList.add('hidden');
    loginPage.classList.add('hidden');
    dashboardPage.classList.remove('hidden');
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
    selesaikanLogin(email, nama);
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
    selesaikanLogin(email, nama);
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
on('btnHitungGulaHarian', 'click', () => bukaMenuUtama('kalkulator'));
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
on('btnMulaiSekarang', 'click', () => bukaDetailTips('kebiasaan-kecil'));
function bukaDetailTips(idTips) {
    const petaDetail = {
        'minuman-manis': 'tipsMinumanManis',
        'camilan-sehat': 'tipsCamilanSehat',
        'gula-tersembunyi': 'tipsGulaTersembunyi',
        'baca-label': 'tipsBacaLabel',
        'kebiasaan-kecil': 'tipsKebiasaanKecil',
        'tips-sekolah': 'tipsSekolah'
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
on('btnBacaLabel', 'click', () => bukaDetailTips('baca-label'));
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
setupKuisPilihan(
    document.querySelectorAll('#tipsMinumanManis .pilihan-list-btn'),
    document.getElementById('aktivitasFeedback'),
    btn => btn.dataset.benar === 'true',
    benar => benar
        ? 'Benar! Rata-rata 60 menit per hari aktivitas fisik sedang–berat, sesuai rekomendasi WHO untuk anak dan remaja usia 5–17 tahun.'
        : 'Belum tepat. Rekomendasinya adalah rata-rata 60 menit per hari aktivitas fisik sedang–berat, dihitung setiap minggu.'
);
setupTantangan('btnChallengeAktivitas', 'challengeFeedbackAktivitas', '✅ Mantap!');
on('btnKembaliTips', 'click', () => bukaTipsUtama());
on('btnLanjutCamilan', 'click', () => bukaDetailTips('camilan-sehat'));
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
    document.querySelectorAll('#tipsCamilanSehat .pilihan-list-btn'),
    document.getElementById('skriningFeedback'),
    btn => btn.dataset.benar === 'true',
    benar => benar
        ? 'Benar! Mengisi formulir skrining dengan jujur membuat hasil pemeriksaan sesuai kondisi tubuhmu yang sebenarnya, sehingga penanganan yang diberikan juga tepat.'
        : 'Belum tepat. Formulir skrining harus diisi jujur, supaya hasil pemeriksaan sesuai kondisi tubuhmu yang sebenarnya dan penanganannya tepat.'
);
const dataSkriningPemeriksaan = {
    gizi: {
        nama: 'Status Gizi / IMT Menurut Umur',
        frekuensi: 'Sebaiknya dicek setiap 6 bulan sekali.',
        normal: 'Hasil termasuk kategori "gizi baik" pada grafik IMT/U, yaitu antara −2 SD sampai +1 SD.'
    },
    tekanan: {
        nama: 'Tekanan Darah',
        frekuensi: 'Sebaiknya dicek minimal 1 tahun sekali.',
        normal: 'Untuk remaja, nilai normal sekitar di bawah 120/80 mmHg.'
    },
    gula: {
        nama: 'Gula Darah',
        frekuensi: 'Sebaiknya dicek minimal 1 tahun sekali, lebih sering jika berat badan berlebih.',
        normal: 'Gula darah puasa di bawah 100 mg/dL, gula darah sewaktu di bawah 140 mg/dL.'
    },
    gigi: {
        nama: 'Gigi & Mulut',
        frekuensi: 'Sebaiknya dicek ke dokter gigi setiap 6 bulan sekali.',
        normal: 'Tidak ada gigi berlubang, gusi tidak bengkak atau berdarah.'
    },
    mata: {
        nama: 'Mata (Penglihatan)',
        frekuensi: 'Sebaiknya dicek 1 tahun sekali, atau segera jika penglihatan mulai kabur.',
        normal: 'Bisa melihat jelas jarak dekat maupun jauh, tanpa mengernyit atau mendekatkan benda.'
    },
    telinga: {
        nama: 'Telinga (Pendengaran)',
        frekuensi: 'Sebaiknya dicek 1 tahun sekali.',
        normal: 'Bisa mendengar suara dengan jelas, tidak ada nyeri atau cairan yang keluar dari telinga.'
    },
    jiwa: {
        nama: 'Kesehatan Jiwa',
        frekuensi: 'Sebaiknya dicek 1 tahun sekali, atau kapan saja saat merasa berat.',
        normal: 'Tidak ada stres, cemas, atau sedih berkepanjangan yang sampai mengganggu aktivitas sehari-hari.'
    },
    anemia: {
        nama: 'Anemia (Khusus Remaja Putri)',
        frekuensi: 'Sebaiknya dicek 1 tahun sekali, terutama sejak mulai menstruasi.',
        normal: 'Kadar hemoglobin (Hb) minimal 12 g/dL.'
    }
};
setupPanelChip('skriningChips', 'skriningPlaceholder', 'skriningContent', dataSkriningPemeriksaan, 'skrining', [
    ['skriningNama', 'nama', v => v.toUpperCase()],
    ['skriningFrekuensi', 'frekuensi'],
    ['skriningNormal', 'normal']
]);
setupKuisPilihan(
    document.querySelectorAll('.quiz-sajian-btn'),
    document.getElementById('sajianFeedback'),
    btn => btn.dataset.jawaban === '2',
    benar => benar
        ? 'Benar! Satu kemasan memiliki 2 sajian. Karena itu, penting untuk melihat jumlah sajian per kemasan, bukan hanya angka per sajian.'
        : 'Bukan itu jawabannya. Satu kemasan memiliki 2 sajian, jadi penting melihat jumlah sajian per kemasan, bukan hanya angka per sajian.'
);
on('btnBacaLabelCamilan', 'click', () => bukaDetailTips('baca-label'));
setupTantangan('btnChallengeCamilan', 'challengeFeedbackCamilan', '✅ Saya Akan Mencoba');
on('btnKembaliTipsCamilan', 'click', () => bukaTipsUtama());
on('btnSebelumnyaMinuman', 'click', () => bukaDetailTips('minuman-manis'));
on('btnSelanjutnyaGulaTersembunyi', 'click', () => bukaDetailTips('gula-tersembunyi'));
const detektifCards = document.querySelectorAll('.detektif-card');
const detektifFeedback = document.getElementById('detektifFeedback');
detektifCards.forEach(card => {
    card.addEventListener('click', () => {
        detektifCards.forEach(c => c.classList.remove('dicek'));
        card.classList.add('dicek');
        detektifFeedback.classList.remove('hidden');
    });
});
setupKuisPilihan(
    document.querySelectorAll('.quiz-manis-btn'),
    document.getElementById('manisFeedback'),
    btn => btn.dataset.jawaban === 'Tidak',
    benar => benar
        ? 'Benar! Rasa bukan satu-satunya cara untuk mengetahui kandungan gula. Untuk produk kemasan, periksa informasi nilai gizi dan daftar bahan.'
        : 'Bukan itu jawabannya. Rasa saja tidak cukup — periksa informasi nilai gizi dan daftar bahan pada kemasan.'
);
const flipCard = document.getElementById('flipCard');
on('btnLihatBelakang', 'click', function () {
    const sudahTerbuka = flipCard.classList.contains('terbuka');
    flipCard.classList.toggle('terbuka');
    this.textContent = sudahTerbuka ? '🔍 LIHAT BAGIAN BELAKANG' : '🔍 LIHAT BAGIAN DEPAN';
});
const chipBtns = document.querySelectorAll('.chip-btn');
const detektifGulaFeedback = document.getElementById('detektifGulaFeedback');
let bahanBenarDitemukan = new Set();
const totalBahanBenar = document.querySelectorAll('.chip-btn[data-benar="true"]').length;
chipBtns.forEach(chip => {
    chip.addEventListener('click', () => {
        const benar = chip.dataset.benar === 'true';
        if (benar) {
            chip.classList.add('chip-benar');
            bahanBenarDitemukan.add(chip.dataset.bahan);
            if (bahanBenarDitemukan.size >= totalBahanBenar) {
                detektifGulaFeedback.textContent = '🎉 Hebat! Kamu menemukan bahan yang menunjukkan adanya gula tambahan.';
            } else {
                detektifGulaFeedback.textContent = 'Tepat! Coba cari bahan lain yang juga menunjukkan adanya gula tambahan.';
            }
        } else {
            chip.classList.add('chip-salah');
            detektifGulaFeedback.textContent = 'Belum tepat. Coba cari bahan yang merupakan sumber gula tambahan.';
        }
        detektifGulaFeedback.classList.remove('hidden');
    });
});
setupKuisPilihan(
    document.querySelectorAll('#tipsGulaTersembunyi .pilihan-list-btn'),
    document.getElementById('labelFeedback'),
    btn => btn.dataset.benar === 'true',
    'Benar! Informasi nilai gizi dapat membantu kamu mengetahui kandungan gula pada produk.'
);
on('btnBacaLabelGula', 'click', () => bukaDetailTips('baca-label'));
setupTantangan('btnChallengeGula', 'challengeFeedbackGula', '✅ Mantap!');
on('btnKembaliTipsGula', 'click', () => bukaTipsUtama());
on('btnSebelumnyaCamilan', 'click', () => bukaDetailTips('camilan-sehat'));
on('btnSelanjutnyaBacaLabel', 'click', () => bukaDetailTips('baca-label'));
on('btnKembaliTipsLabel', 'click', () => bukaTipsUtama());
on('btnSebelumnyaGula', 'click', () => bukaDetailTips('gula-tersembunyi'));
on('btnSelanjutnyaKebiasaan', 'click', () => bukaDetailTips('kebiasaan-kecil'));
on('btnKembaliTipsKebiasaan', 'click', () => bukaTipsUtama());
on('btnSebelumnyaLabel', 'click', () => bukaDetailTips('baca-label'));
on('btnSelanjutnyaSekolah', 'click', () => bukaDetailTips('tips-sekolah'));
on('btnKembaliTipsSekolah', 'click', () => bukaTipsUtama());
on('btnSebelumnyaKebiasaan', 'click', () => bukaDetailTips('kebiasaan-kecil'));
document.querySelectorAll('.materi-card').forEach(card => {
    card.addEventListener('click', () => bukaMateri(card.dataset.materi));
});
function bukaMateri(idMateri) {
    const petaMateri = {
        'mengenal-diabetes-melitus': 'materiDiabetesMelitus',
        'mengenal-gula': 'materiMengenalGula',
        'gula-dan-kesehatan': 'materiGulaKesehatan',
        'gula-dan-gigi': 'materiGulaGigi',
        'gula-energi-tubuh': 'materiGulaEnergiTubuh',
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
on('btnHitungGulaDariMateriKesehatan', 'click', () => bukaMenuUtama('kalkulator'));
on('btnMateriKesehatanPrev', 'click', () => bukaMateri('mengenal-gula'));
on('btnMateriKesehatanNext', 'click', () => bukaMateri('gula-dan-gigi'));
document.querySelectorAll('.gk-disease-card').forEach(card => {
    const header = card.querySelector('.gk-disease-header');
    const closeBtn = card.querySelector('.gk-disease-close');
    header.addEventListener('click', () => card.classList.toggle('open'));
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            card.classList.remove('open');
            header.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
});
on('btnKembaliBawahMateriKesehatan', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliAtasMateriGigi', 'click', () => bukaMenuUtama('materi'));
on('btnKembaliBawahMateriGigi', 'click', () => bukaMenuUtama('materi'));
const ggSelfcheckOptions = document.getElementById('ggSelfcheckOptions');
const ggSelfcheckResult = document.getElementById('ggSelfcheckResult');
const ggSelfcheckText = document.getElementById('ggSelfcheckText');
if (ggSelfcheckOptions) {
    ggSelfcheckOptions.querySelectorAll('.gg-selfcheck-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            ggSelfcheckOptions.querySelectorAll('.gg-selfcheck-btn').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            ggSelfcheckText.textContent = `Artinya, gigi kamu mendapatkan paparan makanan/minuman manis ${btn.dataset.freq} dalam sehari.`;
            ggSelfcheckResult.classList.remove('hidden');
        });
    });
}
on('btnGgSelfcheckReset', 'click', () => {
    ggSelfcheckOptions.querySelectorAll('.gg-selfcheck-btn').forEach((b) => b.classList.remove('selected'));
    ggSelfcheckResult.classList.add('hidden');
});
on('btnMateriGigiNext', 'click', () => bukaMateri('gula-energi-tubuh'));
on('btnMateriGigiPrev', 'click', () => bukaMateri('gula-dan-kesehatan'));
on('btnKembaliAtasMateriEnergi', 'click', () => bukaMenuUtama('materi'));
on('btnHitungEnergiDariMateriEnergi', 'click', () => bukaMenuUtama('kalkulator'));
on('btnMateriEnergiPrev', 'click', () => bukaMateri('gula-dan-gigi'));
on('btnMateriEnergiNext', 'click', () => bukaMateri('kebiasaan-makan-remaja'));
on('btnKembaliAtasMateriDiabetes', 'click', () => bukaMenuUtama('materi'));
const dataDiabetesTipe = {
    tipe1: {
        nama: 'Diabetes Melitus Tipe 1',
        apaItu: 'Kondisi ketika pankreas tidak dapat memproduksi insulin sama sekali, sehingga gula dari makanan tidak dapat masuk ke dalam sel tubuh dengan baik.',
        penyebab: 'Terjadi karena sistem imun tubuh secara keliru menyerang sel-sel penghasil insulin di pankreas (gangguan autoimun) — bukan disebabkan oleh terlalu banyak makan makanan manis.',
        berisiko: 'Umumnya mulai muncul sejak usia anak-anak atau remaja, meskipun bisa juga terjadi pada usia berapa pun.',
        fakta: 'Penderita diabetes tipe 1 membutuhkan suntikan insulin setiap hari seumur hidup, karena tubuhnya sudah tidak bisa memproduksi insulin sendiri.'
    },
    tipe2: {
        nama: 'Diabetes Melitus Tipe 2',
        apaItu: 'Kondisi ketika tubuh masih dapat memproduksi insulin, tetapi tidak dapat menggunakannya secara efektif (resistensi insulin), atau produksi insulinnya tidak lagi mencukupi.',
        penyebab: 'Merupakan kombinasi antara faktor keturunan (riwayat keluarga) dan gaya hidup, seperti kurang aktivitas fisik, pola makan tidak seimbang, serta kelebihan berat badan.',
        berisiko: 'Dulu lebih sering terjadi pada orang dewasa dan lanjut usia, tetapi sekarang semakin banyak ditemukan pada remaja dan anak-anak juga.',
        fakta: 'Lebih dari 90% kasus diabetes di dunia adalah tipe ini. Kabar baiknya, diabetes tipe 2 dapat dicegah dan dikelola dengan menerapkan pola hidup sehat sejak dini.'
    },
    gestasional: {
        nama: 'Diabetes Melitus Gestasional',
        apaItu: 'Diabetes yang baru pertama kali terdeteksi ketika seorang wanita sedang hamil, pada wanita yang sebelumnya tidak memiliki diabetes.',
        penyebab: 'Perubahan hormon selama kehamilan dapat membuat tubuh menjadi lebih sulit menggunakan insulin secara efektif (resistensi insulin sementara).',
        berisiko: 'Ibu hamil, dan biasanya baru terdeteksi pada trimester kedua atau ketiga masa kehamilan.',
        fakta: 'Kondisi ini umumnya menghilang setelah melahirkan, tetapi ibu yang pernah mengalaminya memiliki risiko lebih tinggi terkena diabetes tipe 2 di kemudian hari.'
    }
};
setupPanelChip('dmTipeChips', 'dmTipePlaceholder', 'dmTipeContent', dataDiabetesTipe, 'tipe', [
    ['dmTipeNama', 'nama', v => v.toUpperCase()],
    ['dmTipeApaItu', 'apaItu'],
    ['dmTipePenyebab', 'penyebab'],
    ['dmTipeBerisiko', 'berisiko'],
    ['dmTipeFakta', 'fakta']
]);
on('btnKembaliAtasMateriMengenal', 'click', () => bukaMenuUtama('materi'));
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
const dataJenisGula = {
    glukosa: {
        nama: 'Glukosa',
        apaItu: 'Glukosa merupakan salah satu jenis gula sederhana yang dapat digunakan tubuh sebagai sumber energi.',
        sumber: 'Beberapa buah, madu, dan makanan yang mengandung karbohidrat setelah dicerna.',
        proses: 'Glukosa dapat diserap tubuh dan digunakan oleh sel sebagai salah satu sumber energi.',
        perhatian: 'Glukosa merupakan bagian normal dari metabolisme tubuh. Yang perlu diperhatikan adalah jumlah dan sumber makanan secara keseluruhan.'
    },
    fruktosa: {
        nama: 'Fruktosa',
        apaItu: 'Fruktosa merupakan salah satu jenis gula sederhana.',
        sumber: 'Buah, madu, dan berbagai produk makanan/minuman yang menggunakan bahan pemanis berbasis fruktosa.',
        proses: 'Fruktosa terutama diproses di hati setelah diserap tubuh.',
        perhatian: 'Fruktosa yang terdapat secara alami dalam buah dikonsumsi bersama komponen lain seperti serat, air, vitamin, dan mineral. Fruktosa juga dapat ditemukan pada produk dengan gula tambahan. Karena itu, sumber dan jumlah konsumsinya perlu diperhatikan.'
    },
    galaktosa: {
        nama: 'Galaktosa',
        apaItu: 'Galaktosa merupakan gula sederhana yang menjadi salah satu komponen penyusun laktosa.',
        sumber: 'Terutama berasal dari makanan/minuman yang mengandung laktosa, seperti susu.',
        proses: 'Galaktosa diperoleh ketika laktosa dipecah selama proses pencernaan.',
        perhatian: 'Galaktosa umumnya diperoleh sebagai bagian dari laktosa dalam makanan berbahan susu.'
    },
    sukrosa: {
        nama: 'Sukrosa',
        apaItu: 'Sukrosa merupakan gula yang umum dikenal sebagai gula meja atau gula pasir.',
        sumber: 'Gula pasir, makanan manis, minuman manis, serta makanan dan minuman yang diberi gula tambahan.',
        proses: 'Sukrosa dipecah menjadi glukosa dan fruktosa sebelum diserap tubuh.',
        perhatian: 'Sukrosa banyak digunakan sebagai gula tambahan dalam makanan dan minuman, sehingga jumlah konsumsinya perlu diperhatikan.'
    },
    laktosa: {
        nama: 'Laktosa',
        apaItu: 'Laktosa merupakan gula alami yang terdapat pada susu.',
        sumber: 'Susu dan produk olahan susu tertentu.',
        proses: 'Laktosa dipecah menjadi glukosa dan galaktosa agar dapat diserap tubuh.',
        perhatian: 'Pada orang yang memiliki kekurangan enzim laktase, konsumsi laktosa dalam jumlah tertentu dapat menimbulkan keluhan seperti kembung, gas, atau diare. Namun, tidak semua orang mengalami keluhan tersebut.'
    },
    maltosa: {
        nama: 'Maltosa',
        apaItu: 'Maltosa merupakan gula yang tersusun dari dua molekul glukosa.',
        sumber: 'Dapat terbentuk ketika pati dipecah, dan terdapat pada beberapa bahan pangan tertentu.',
        proses: 'Maltosa dapat dipecah menjadi glukosa sebelum digunakan tubuh.',
        perhatian: 'Maltosa merupakan salah satu bentuk gula yang dapat berasal dari proses pemecahan karbohidrat.'
    }
};
setupPanelChip('smJenisGulaChips', 'smJenisGulaPlaceholder', 'smJenisGulaContent', dataJenisGula, 'gula', [
    ['smGulaNama', 'nama', v => v.toUpperCase()],
    ['smGulaApaItu', 'apaItu'],
    ['smGulaSumber', 'sumber'],
    ['smGulaProses', 'proses'],
    ['smGulaPerhatian', 'perhatian']
]);
on('btnLanjutMateriKesehatanDariSumber', 'click', () => bukaMateri('gula-dan-kesehatan'));
on('btnMateriSumberNext', 'click', () => bukaMateri('gula-dan-kesehatan'));
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
    const btnAbsenInfo = document.getElementById('btnAbsenInfo');
    const panelAbsenInfoOverlay = document.getElementById('panelAbsenInfoOverlay');
    const btnTutupAbsenInfo = document.getElementById('btnTutupAbsenInfo');
    const absenTierList = document.getElementById('absenTierList');
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
        { min: 2000, emoji: '🦅', gambar: 'pet-evo-6.png', pola: n => `${n} Perkasa`, aura: 'rgba(255, 87, 51, 0.62)', desc: 'Sayapnya membara gagah — konsistensimu luar biasa!' },
        { min: 4000, emoji: '🐦\u200d🔥', gambar: 'pet-evo-7.png', pola: n => `${n} Sejati`, aura: 'rgba(255, 61, 0, 0.7)', desc: 'Bertransformasi penuh jadi burung Phoenix legendaris, gagah dan membara sepenuhnya.' },
        { min: 8000, emoji: '🌌', gambar: 'pet-evo-8.png', pola: n => `${n} Semesta`, aura: 'rgba(147, 51, 234, 0.65)', desc: 'Wujud puncak lintas galaksi — level tertinggi, legenda hidup Sobat Sehat!' }
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
    // ===== Panel "Beri Nama Pet" — dipicu dari ikon ✏️ di kartu pet =====
    const panelNamaPetOverlay = document.getElementById('panelNamaPetOverlay');
    const namaPetJudul = document.getElementById('namaPetJudul');
    const namaPetInfoTeks = document.getElementById('namaPetInfoTeks');
    const formNamaPetBaru = document.getElementById('formNamaPetBaru');
    const inputNamaPetModal = document.getElementById('inputNamaPetModal');
    const namaPetPeringatan = document.getElementById('namaPetPeringatan');
    const btnSimpanNamaPet = document.getElementById('btnSimpanNamaPet');
    const btnTutupNamaPet = document.getElementById('btnTutupNamaPet');
    function bukaPanelNamaPet() {
        if (!panelNamaPetOverlay) return;
        if (sudahMemberiNamaPet()) {
            if (namaPetJudul) namaPetJudul.textContent = 'Nama Pet Sudah Dikunci';
            if (namaPetInfoTeks) namaPetInfoTeks.innerHTML = `Nama pet-mu untuk akun ini sudah ditetapkan sebagai <strong>${ambilNamaPetDasar()}</strong> dan tidak bisa diganti lagi.`;
            if (formNamaPetBaru) formNamaPetBaru.classList.add('hidden');
            if (btnSimpanNamaPet) btnSimpanNamaPet.classList.add('hidden');
            if (btnTutupNamaPet) btnTutupNamaPet.textContent = 'Mengerti →';
        } else {
            if (namaPetJudul) namaPetJudul.textContent = 'Beri Nama Pet-mu';
            if (namaPetInfoTeks) namaPetInfoTeks.innerHTML = 'Nama ini bakal dipakai di semua level evolusi pet-mu (misalnya "Telur Kobo", "Kobo Mungil", dst). <strong>Nama hanya bisa ditentukan satu kali untuk akun ini</strong>, jadi pilih baik-baik ya!';
            if (formNamaPetBaru) formNamaPetBaru.classList.remove('hidden');
            if (btnSimpanNamaPet) btnSimpanNamaPet.classList.remove('hidden');
            if (inputNamaPetModal) inputNamaPetModal.value = '';
            if (namaPetPeringatan) namaPetPeringatan.classList.add('hidden');
            if (btnTutupNamaPet) btnTutupNamaPet.textContent = 'Batal';
        }
        bukaPanelOverlay(panelNamaPetOverlay);
        if (!sudahMemberiNamaPet() && inputNamaPetModal) setTimeout(() => inputNamaPetModal.focus(), 50);
    }
    function simpanNamaPetDariModal() {
        if (!inputNamaPetModal || sudahMemberiNamaPet()) return;
        const nilai = inputNamaPetModal.value.trim().slice(0, 16);
        if (!nilai) {
            if (namaPetPeringatan) namaPetPeringatan.classList.remove('hidden');
            inputNamaPetModal.focus();
            return;
        }
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
                : `${total} Poin — Level maksimal tercapai! 🎉`;
        }
        if (topbarPetEmoji) { topbarPetEmoji.innerHTML = markupIkonPet(stage, namaStageAktif); topbarPetEmoji.style.setProperty('--aura-color', stage.aura); pasangFallbackGambarPet(topbarPetEmoji); }
        if (topbarPetNama) topbarPetNama.textContent = namaStageAktif;
        if (topbarPet) topbarPet.classList.toggle('hidden', !emailAktif);
        if (btnEditNamaPet) {
            const terkunci = sudahMemberiNamaPet();
            btnEditNamaPet.textContent = terkunci ? '🔒' : '✏️';
            btnEditNamaPet.title = terkunci ? 'Nama pet sudah dikunci' : 'Beri nama pet (hanya sekali)';
        }
    }
    function tampilkanLevelUpPet(stage) {
        const toastLama = document.querySelector('.papan-toast');
        if (toastLama) toastLama.remove();
        const toast = document.createElement('div');
        toast.className = 'papan-toast papan-toast-levelup';
        const namaStageIni = stage.pola(ambilNamaPetDasar());
        toast.innerHTML = `<span class="levelup-emoji" style="--aura-color:${stage.aura}">${markupIkonPet(stage, namaStageIni)}</span> Pet-mu naik level jadi <strong>${namaStageIni}</strong>!`;
        document.body.appendChild(toast);
        pasangFallbackGambarPet(toast.querySelector('.levelup-emoji'));
        setTimeout(() => toast.remove(), 2900);
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
                    <span class="pet-evolusi-nama">Level ${i + 1} — ${namaStageIni}${i === idxAktif ? ' (sekarang)' : ''}</span>
                    <span class="pet-evolusi-syarat">${s.min === 0 ? 'Mulai dari 0 Poin' : `Mulai dari ${s.min} Poin kumulatif`}</span>
                </span>
            </li>
        `;
        }).join('');
        petEvolusiList.querySelectorAll('.pet-evolusi-emoji--pet').forEach(pasangFallbackGambarPet);
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
    const QUESTION_BANK = [
        // 1. Mengenal Diabetes Melitus
        { topik: 'Diabetes', pertanyaan: 'Apa penyebab utama diabetes melitus tipe 1?', opsi: ['Gangguan sistem imun (autoimun)', 'Terlalu banyak makan manis', 'Kurang tidur'], benar: 0, penjelasan: 'Diabetes tipe 1 disebabkan oleh gangguan sistem imun (autoimun), bukan karena makan manis, sehingga penderitanya butuh suntik insulin seumur hidup.' },
        { topik: 'Diabetes', pertanyaan: 'Tipe diabetes melitus mana yang menyumbang lebih dari 90% kasus diabetes di dunia dan bisa dicegah?', opsi: ['Diabetes tipe 1', 'Diabetes tipe 2', 'Diabetes gestasional'], benar: 1, penjelasan: 'Diabetes tipe 2 menyumbang lebih dari 90% kasus diabetes di dunia, dan bisa dicegah dengan gaya hidup sehat.' },
        { topik: 'Diabetes', pertanyaan: 'Diabetes gestasional adalah diabetes yang muncul pada kondisi apa?', opsi: ['Saat kehamilan', 'Sejak lahir', 'Setelah olahraga berat'], benar: 0, penjelasan: 'Diabetes gestasional adalah diabetes yang baru muncul saat hamil akibat perubahan hormon kehamilan, dan biasanya hilang setelah melahirkan.' },
        { topik: 'Diabetes', pertanyaan: 'Kenapa gejala diabetes tipe 2 sering tidak disadari?', opsi: ['Karena berkembang perlahan dalam waktu lama', 'Karena muncul mendadak dalam hitungan hari', 'Karena hanya terjadi pada lansia'], benar: 0, penjelasan: 'Gejala diabetes tipe 2 berkembang perlahan dan sering tidak disadari, sehingga skrining rutin penting meski merasa sehat.' },
        { topik: 'Diabetes', pertanyaan: 'Dibandingkan diabetes tipe 2, bagaimana gejala diabetes tipe 1 biasanya muncul?', opsi: ['Muncul mendadak dalam hitungan hari sampai minggu', 'Muncul perlahan dalam hitungan tahun', 'Tidak pernah menimbulkan gejala'], benar: 0, penjelasan: 'Gejala diabetes tipe 1 biasanya muncul mendadak dan cukup terasa dalam hitungan hari sampai minggu, berbeda dengan tipe 2 yang berkembang perlahan.' },
        { topik: 'Diabetes', pertanyaan: 'Jika kadar gula darah tinggi dibiarkan dalam waktu lama tanpa penanganan, berapa kali lipat risiko serangan jantung dan stroke dapat meningkat?', opsi: ['2–3 kali lipat', '10 kali lipat', 'Tidak meningkat sama sekali'], benar: 0, penjelasan: 'Diabetes yang tidak ditangani dalam waktu lama dapat meningkatkan risiko serangan jantung dan stroke hingga 2–3 kali lipat.' },
        // 1b. Konsumsi Makanan Bergizi
        { topik: 'Makanan Bergizi', pertanyaan: 'Ada berapa prinsip utama gizi seimbang yang perlu diperhatikan bersamaan?', opsi: ['4 prinsip', '2 prinsip', '10 prinsip'], benar: 0, penjelasan: '4 prinsip utama gizi seimbang: aneka ragam pangan, perilaku hidup bersih, aktivitas fisik, dan pantau berat badan.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Kenapa dianjurkan makan aneka ragam pangan (makanan pokok, lauk, sayur, buah) setiap hari?', opsi: ['Karena tidak ada satu jenis makanan yang mengandung semua zat gizi', 'Karena harus mencoba semua rasa', 'Karena harganya lebih murah'], benar: 0, penjelasan: 'Tidak ada satu jenis makanan yang mengandung semua zat gizi, sehingga perlu variasi makanan pokok, lauk pauk, sayur, dan buah setiap hari.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Menurut panduan "Isi Piringku" dari Kemenkes RI, bagaimana pembagian porsi sekali makan?', opsi: ['Separuh piring diisi sayur & buah, separuh lagi makanan pokok & lauk pauk', 'Seluruh piring diisi nasi', 'Separuh piring diisi lauk pauk saja'], benar: 0, penjelasan: 'Isi Piringku membagi piring menjadi separuh untuk sayur & buah, dan separuh lagi untuk makanan pokok & lauk pauk, dilengkapi air putih yang cukup.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Pada panduan Isi Piringku, dari setengah bagian piring untuk makanan pokok & lauk pauk, berapa porsi makanan pokok dibanding lauk pauk?', opsi: ['Makanan pokok sekitar 2/3, lauk pauk sekitar 1/3', 'Makanan pokok dan lauk pauk sama besar 1/2 - 1/2', 'Lauk pauk sekitar 2/3, makanan pokok sekitar 1/3'], benar: 0, penjelasan: 'Dari setengah piring untuk makanan pokok & lauk pauk, porsi makanan pokok sekitar 2/3 dan lauk pauk sekitar 1/3.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Kenapa remaja membutuhkan energi dan zat gizi lebih banyak dibanding masa anak-anak?', opsi: ['Karena masa remaja adalah masa pertumbuhan cepat (growth spurt)', 'Karena remaja lebih sering sakit', 'Karena remaja tidur lebih sedikit'], benar: 0, penjelasan: 'Masa remaja adalah masa pertumbuhan cepat (growth spurt) — tinggi badan, otot, tulang, dan otak berkembang pesat, sehingga kebutuhan gizi meningkat.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Kenapa remaja putri dianjurkan mengonsumsi lebih banyak zat besi dibanding remaja putra?', opsi: ['Untuk mengganti zat besi yang hilang saat menstruasi dan mencegah anemia', 'Karena remaja putri lebih banyak berolahraga', 'Karena zat besi membuat tinggi badan bertambah'], benar: 0, penjelasan: 'Remaja putri butuh zat besi lebih banyak (±15 mg/hari) dibanding remaja putra (±11 mg/hari) untuk mengganti zat besi yang hilang saat menstruasi dan mencegah anemia.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Zat gizi apa yang dibutuhkan sekitar 1.200 mg/hari untuk pembentukan tulang dan gigi remaja?', opsi: ['Kalsium', 'Zat besi', 'Protein'], benar: 0, penjelasan: 'Kalsium dibutuhkan sekitar 1.200 mg/hari untuk pembentukan tulang dan gigi, dengan sumber seperti susu, ikan (termasuk tulang lunaknya), dan sayuran hijau.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Sebagai bagian dari program pemerintah mencegah anemia, apa yang dianjurkan dikonsumsi rutin oleh remaja putri di Indonesia?', opsi: ['Tablet Tambah Darah (TTD)', 'Suplemen kalsium', 'Vitamin C dosis tinggi'], benar: 0, penjelasan: 'Remaja putri di Indonesia dianjurkan mengonsumsi Tablet Tambah Darah (TTD) secara rutin sebagai bagian dari program pemerintah untuk mencegah anemia.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Berapa batas maksimal konsumsi gula, garam, dan lemak per hari menurut anjuran gizi seimbang?', opsi: ['Gula ±50 g, garam ±5 g, lemak ±67 g', 'Gula ±500 g, garam ±50 g, lemak ±670 g', 'Tidak ada batasan sama sekali'], benar: 0, penjelasan: 'Anjurannya adalah gula maksimal ±50 gram (4 sdm), garam maksimal ±5 gram (1 sdt), dan lemak maksimal ±67 gram (5 sdm) per hari.' },
        { topik: 'Makanan Bergizi', pertanyaan: 'Kira-kira berapa kebutuhan energi harian remaja laki-laki usia 16-18 tahun menurut AKG Kemenkes RI?', opsi: ['Sekitar 2.650 kkal', 'Sekitar 1.000 kkal', 'Sekitar 5.000 kkal'], benar: 0, penjelasan: 'Menurut Angka Kecukupan Gizi (AKG) Kemenkes RI, laki-laki usia 16-18 tahun membutuhkan energi sekitar 2.650 kkal dan protein sekitar 75 g per hari.' },
        // 2. Mengenal Gula & Sumbernya
        { topik: 'Gula & Sumbernya', pertanyaan: 'Kira-kira berapa batas gula tambahan yang disarankan per hari untuk remaja?', opsi: ['Sekitar 4 sendok teh', 'Sekitar 15 sendok teh', 'Tidak ada batasnya'], benar: 0, penjelasan: 'Batas gula tambahan yang disarankan sekitar 4 sendok teh (±50g) per hari — idealnya lebih sedikit dari itu.' },
        { topik: 'Gula & Sumbernya', pertanyaan: 'Gula termasuk dalam kelompok zat gizi apa?', opsi: ['Karbohidrat sederhana', 'Protein', 'Vitamin'], benar: 0, penjelasan: 'Gula merupakan salah satu bentuk karbohidrat sederhana yang bisa ditemukan alami maupun ditambahkan ke makanan/minuman.' },
        { topik: 'Gula & Sumbernya', pertanyaan: 'Kalau makanan tidak terasa manis, apakah berarti pasti tidak mengandung gula?', opsi: ['Tidak, tetap bisa mengandung gula', 'Ya, pasti tidak ada gula', 'Hanya berlaku untuk minuman'], benar: 0, penjelasan: 'Beberapa produk bisa mengandung gula meskipun rasa manisnya tidak terlalu kuat, jadi jangan hanya andalkan rasa.' },
        { topik: 'Gula & Sumbernya', pertanyaan: 'Manakah yang termasuk gula alami, bukan gula tambahan?', opsi: ['Gula dalam buah dan susu', 'Gula yang ditambahkan ke minuman kemasan', 'Sirup yang dituang ke makanan'], benar: 0, penjelasan: 'Gula alami secara alami ada dalam bahan makanan seperti buah dan susu, berbeda dari gula tambahan yang ditambahkan saat pembuatan/penyajian.' },
        { topik: 'Gula & Sumbernya', pertanyaan: 'Selain gula, apa saja yang termasuk kelompok karbohidrat?', opsi: ['Pati dan serat', 'Protein dan lemak', 'Vitamin dan mineral'], benar: 0, penjelasan: 'Karbohidrat tidak hanya terdiri dari gula — gula, pati, dan serat merupakan bagian dari kelompok karbohidrat dengan karakteristik yang berbeda.' },
        { topik: 'Gula & Sumbernya', pertanyaan: 'Apa yang terjadi pada karbohidrat dari makanan setelah dicerna tubuh?', opsi: ['Diubah menjadi gula sederhana yang diserap dan digunakan sebagai energi', 'Langsung dibuang tanpa diserap', 'Berubah menjadi protein'], benar: 0, penjelasan: 'Karbohidrat dari makanan dicerna menjadi bentuk gula sederhana yang kemudian diserap tubuh dan dapat digunakan sebagai sumber energi.' },
        // 3. Gula dan Kesehatan Tubuh
        { topik: 'Gula & Kesehatan', pertanyaan: 'Hormon apa yang bertugas membantu gula darah masuk ke dalam sel tubuh?', opsi: ['Insulin', 'Enzim pencernaan', 'Hemoglobin'], benar: 0, penjelasan: 'Insulin adalah hormon yang membantu gula darah (glukosa) masuk ke dalam sel untuk dijadikan energi.' },
        { topik: 'Gula & Kesehatan', pertanyaan: 'Apa risiko jangka panjang dari konsumsi gula berlebih?', opsi: ['Risiko diabetes tipe 2', 'Tulang jadi lebih kuat', 'Tinggi badan bertambah'], benar: 0, penjelasan: 'Konsumsi gula berlebih dalam jangka panjang meningkatkan risiko diabetes tipe 2 dan berbagai penyakit lain.' },
        { topik: 'Gula & Kesehatan', pertanyaan: 'Apa yang dimaksud dengan resistensi insulin?', opsi: ['Sel tubuh kurang merespons sinyal insulin', 'Tubuh memproduksi insulin berlebihan', 'Insulin berubah jadi glukosa'], benar: 0, penjelasan: 'Resistensi insulin terjadi ketika sel tubuh kurang "mendengar" sinyal insulin akibat kebiasaan tinggi gula terus-menerus, sehingga glukosa lebih sulit masuk ke sel.' },
        { topik: 'Gula & Kesehatan', pertanyaan: 'Berapa batas maksimal konsumsi gula tambahan menurut WHO, dari total energi harian?', opsi: ['Tidak lebih dari 10%', 'Tidak lebih dari 50%', 'Tidak ada batasan'], benar: 0, penjelasan: 'WHO menyarankan konsumsi gula tambahan tidak lebih dari 10% total energi harian — makin sedikit makin baik.' },
        { topik: 'Gula & Kesehatan', pertanyaan: 'Jika gula darah tinggi dibiarkan dalam waktu lama, organ apa saja yang berisiko mengalami gangguan?', opsi: ['Ginjal, mata, saraf, dan jantung', 'Hanya kulit', 'Hanya rambut'], benar: 0, penjelasan: 'Gula darah tinggi jangka panjang dapat merusak ginjal (nefropati), mata (retinopati), saraf (neuropati), serta jantung dan pembuluh darah.' },
        { topik: 'Gula & Kesehatan', pertanyaan: 'Bagaimana urutan proses tubuh mengatur gula darah setelah makan?', opsi: ['Glukosa darah naik → pankreas melepaskan insulin → glukosa masuk sel → digunakan sebagai energi', 'Insulin naik duluan sebelum makan', 'Glukosa langsung menjadi lemak tanpa insulin'], benar: 0, penjelasan: 'Setelah makan, kadar glukosa darah meningkat, pankreas melepaskan insulin, insulin membantu glukosa masuk ke sel, lalu digunakan sebagai energi.' },
        // 4. Gula dan Kesehatan Gigi
        { topik: 'Gula & Gigi', pertanyaan: 'Apa yang dihasilkan ketika bakteri di mulut bertemu dengan gula?', opsi: ['Asam yang bisa merusak gigi', 'Enzim pencernaan', 'Vitamin C'], benar: 0, penjelasan: 'Bakteri di mulut mengolah gula menjadi asam, dan asam inilah yang dapat merusak lapisan gigi.' },
        { topik: 'Gula & Gigi', pertanyaan: 'Mana yang lebih berisiko bagi gigi: ngemil manis sedikit tapi berkali-kali sehari, atau makan manis sekali dalam jumlah banyak?', opsi: ['Ngemil manis berkali-kali dalam sehari', 'Makan manis sekali dalam jumlah banyak', 'Keduanya sama sekali tidak berisiko'], benar: 0, penjelasan: 'Semakin sering gigi terpapar gula, semakin sering pula gigi menghadapi kondisi asam — frekuensi paparan lebih berpengaruh daripada sekadar jumlah sekali makan.' },
        { topik: 'Gula & Gigi', pertanyaan: 'Kenapa minuman manis perlu diperhatikan untuk kesehatan gigi?', opsi: ['Sering dikonsumsi berulang sehingga gigi lebih sering terpapar', 'Karena warnanya mencolok', 'Karena harganya mahal'], benar: 0, penjelasan: 'Minuman manis sering dikonsumsi berulang sepanjang hari, membuat gigi lebih sering menghadapi kondisi yang mendukung pembentukan asam.' },
        { topik: 'Gula & Gigi', pertanyaan: 'Manakah camilan yang perlu diperhatikan frekuensinya untuk kesehatan gigi?', opsi: ['Biskuit manis, kue, dan dessert', 'Buah utuh', 'Susu tanpa tambahan gula'], benar: 0, penjelasan: 'Biskuit manis, kue, dan dessert termasuk kelompok yang perlu diperhatikan frekuensinya, berbeda dengan buah utuh atau susu tanpa tambahan gula.' },
        { topik: 'Gula & Gigi', pertanyaan: 'Apa yang terjadi pada gigi jika sering mengalami paparan asam akibat gula secara berulang?', opsi: ['Risiko gigi berlubang (karies) meningkat', 'Gigi menjadi lebih putih', 'Gigi menjadi lebih kuat'], benar: 0, penjelasan: 'Paparan asam yang berulang pada permukaan gigi dapat menyebabkan kerusakan gigi dan meningkatkan risiko karies.' },
        { topik: 'Gula & Gigi', pertanyaan: 'Selain jumlah dan frekuensi gula, apa faktor lain yang memengaruhi risiko karies gigi?', opsi: ['Kebersihan gigi dan mulut', 'Warna makanan', 'Harga makanan'], benar: 0, penjelasan: 'Risiko karies dipengaruhi kombinasi beberapa faktor: gula yang dikonsumsi, frekuensi konsumsi, pola konsumsi, dan kebersihan gigi dan mulut.' },
        // 5. Gula, Energi, dan Tubuh
        { topik: 'Gula & Energi', pertanyaan: 'Apa itu kalori?', opsi: ['Satuan jumlah energi dari makanan dan minuman', 'Satuan berat badan', 'Jenis vitamin dalam tubuh'], benar: 0, penjelasan: 'Kalori merupakan satuan yang digunakan untuk menyatakan jumlah energi yang diperoleh dari makanan dan minuman.' },
        { topik: 'Gula & Energi', pertanyaan: 'Apa yang cenderung terjadi jika energi masuk lebih banyak dan lebih lama dibanding energi yang digunakan tubuh?', opsi: ['Berat badan cenderung bertambah', 'Berat badan otomatis stabil', 'Tubuh kehilangan energi'], benar: 0, penjelasan: 'Energi masuk yang lebih banyak dan lebih lama dibanding yang digunakan cenderung membuat berat badan bertambah.' },
        { topik: 'Gula & Energi', pertanyaan: 'Kenapa minuman manis perlu diperhatikan sebagai sumber energi?', opsi: ['Menyumbang energi tapi kurang memberi rasa kenyang', 'Tidak menyumbang energi sama sekali', 'Selalu lebih mengenyangkan dari makanan padat'], benar: 0, penjelasan: 'Minuman manis menyumbang energi, tetapi seringkali tidak memberi rasa kenyang seperti makanan padat, sehingga mudah dikonsumsi berlebih tanpa disadari.' },
        { topik: 'Gula & Energi', pertanyaan: 'Apakah kebutuhan energi setiap orang sama?', opsi: ['Tidak, berbeda tergantung karakteristik tubuh & aktivitas', 'Ya, semua orang butuh jumlah energi yang sama', 'Hanya berbeda berdasarkan warna favorit'], benar: 0, penjelasan: 'Kebutuhan energi setiap orang berbeda karena dipengaruhi karakteristik tubuh dan tingkat aktivitas masing-masing.' },
        { topik: 'Gula & Energi', pertanyaan: 'Apa yang cenderung terjadi jika energi yang masuk secara terus-menerus lebih besar dari energi yang digunakan tubuh?', opsi: ['Kelebihan energi dapat disimpan dan berat badan bisa bertambah', 'Tubuh otomatis membuang kelebihan energi', 'Tidak ada pengaruh apa pun'], benar: 0, penjelasan: 'Jika energi masuk terus-menerus lebih besar dari yang digunakan, kelebihan energi dapat disimpan tubuh dan dalam jangka panjang berkontribusi pada peningkatan berat badan.' },
        { topik: 'Gula & Energi', pertanyaan: 'Selain berat badan dan tinggi badan, faktor apa yang memengaruhi kebutuhan energi harian seseorang?', opsi: ['Usia dan tingkat aktivitas', 'Warna kulit', 'Golongan darah'], benar: 0, penjelasan: 'Kebutuhan energi harian dipengaruhi oleh usia, berat badan, tinggi badan, dan tingkat aktivitas seseorang.' },
        // 6. Kebiasaan Remaja
        { topik: 'Kebiasaan Remaja', pertanyaan: 'Apa penyumbang gula tersembunyi terbesar pada remaja?', opsi: ['Air putih', 'Minuman manis kemasan/bersoda', 'Susu tawar'], benar: 1, penjelasan: 'Minuman manis kemasan dan bersoda adalah penyumbang terbesar gula tambahan pada remaja.' },
        { topik: 'Kebiasaan Remaja', pertanyaan: 'Apa yang sering mendorong remaja ikut membeli makanan/minuman viral tanpa memeriksa kandungan gulanya dulu?', opsi: ['FOMO (takut ketinggalan tren)', 'Anjuran dokter', 'Instruksi dari sekolah'], benar: 0, penjelasan: 'Tren viral di media sosial memicu rasa penasaran dan FOMO, membuat kita fokus pada rasa/tampilan tanpa memeriksa kandungan gulanya dulu.' },
        { topik: 'Kebiasaan Remaja', pertanyaan: 'Kenapa penting memperhatikan total konsumsi gula sepanjang hari, bukan cuma dari satu produk?', opsi: ['Karena gula dari beberapa produk kecil bisa terkumpul jadi jumlah besar', 'Karena satu produk pasti tidak mengandung gula', 'Karena total sehari tidak berpengaruh'], benar: 0, penjelasan: 'Satu per satu terlihat kecil, tapi minuman manis, camilan, dan makanan penutup sepanjang hari bisa bertambah jadi jumlah yang besar.' },
        { topik: 'Kebiasaan Remaja', pertanyaan: 'Kapan saja jam-jam yang rawan jadi waktu ngemil bagi remaja?', opsi: ['Istirahat sekolah, pulang sekolah, dan saat belajar/main HP', 'Hanya saat sarapan', 'Hanya tengah malam'], benar: 0, penjelasan: 'Jam istirahat, pulang sekolah, sore santai, dan saat belajar/main HP sering menjadi momen ngemil yang tidak disadari.' },
        { topik: 'Kebiasaan Remaja', pertanyaan: 'Apa yang dimaksud dengan pola "sedikit tapi sering" terkait konsumsi gula pada remaja?', opsi: ['Beberapa produk kecil sepanjang hari yang totalnya bisa jadi besar', 'Selalu makan dalam porsi besar sekali sehari', 'Tidak makan apa pun sepanjang hari'], benar: 0, penjelasan: 'Minuman manis, camilan, dan makanan penutup yang terlihat kecil satu per satu dapat bertambah menjadi jumlah besar jika dijumlahkan sepanjang hari.' },
        { topik: 'Kebiasaan Remaja', pertanyaan: 'Kenapa mengetahui informasi tentang gula belum tentu membuat seseorang otomatis menerapkannya sehari-hari?', opsi: ['Karena pengetahuan perlu diikuti kesadaran sebelum menjadi perilaku', 'Karena informasi tentang gula selalu salah', 'Karena remaja tidak bisa membaca label'], benar: 0, penjelasan: 'Perubahan kebiasaan biasanya melalui proses bertahap: pengetahuan → kesadaran → perilaku, jadi tahu saja belum tentu sama dengan menerapkannya.' },
        // 7. Aktivitas Fisik yang Cukup
        { topik: 'Aktivitas Fisik', pertanyaan: 'Menurut WHO, berapa lama sebaiknya remaja usia 5–17 tahun beraktivitas fisik sedang–berat setiap hari (rata-rata per minggu)?', opsi: ['Rata-rata 60 menit sehari', 'Cukup 10 menit sehari', 'Cukup sekali seminggu'], benar: 0, penjelasan: 'WHO menyarankan rata-rata 60 menit per hari aktivitas fisik sedang–berat, dihitung total dalam seminggu.' },
        { topik: 'Aktivitas Fisik', pertanyaan: 'Selain aktivitas harian, berapa kali seminggu minimal dianjurkan melakukan penguatan otot & tulang?', opsi: ['Minimal 3 hari per minggu', 'Setiap hari tanpa jeda', 'Tidak perlu sama sekali'], benar: 0, penjelasan: 'Selain aktivitas fisik harian, dianjurkan juga aktivitas penguatan otot dan tulang minimal 3 hari per minggu.' },
        { topik: 'Aktivitas Fisik', pertanyaan: 'Bagaimana rumus menghitung Indeks Massa Tubuh (IMT)?', opsi: ['Berat badan (kg) ÷ [tinggi badan (m)]²', 'Tinggi badan (cm) − berat badan (kg)', 'Berat badan (kg) × tinggi badan (m)'], benar: 0, penjelasan: 'IMT dihitung dengan rumus berat badan (kg) dibagi kuadrat tinggi badan dalam meter.' },
        { topik: 'Aktivitas Fisik', pertanyaan: 'Apa dampak jangka panjang jika remaja kurang bergerak dan banyak duduk (sedentari)?', opsi: ['Risiko kenaikan IMT dan gangguan gula darah meningkat', 'Otomatis menjadi lebih tinggi', 'Tidak berpengaruh pada kesehatan'], benar: 0, penjelasan: 'Semakin sedikit aktivitas fisik dan semakin banyak waktu duduk, semakin besar risiko kenaikan IMT dan gangguan gula darah.' },
        { topik: 'Aktivitas Fisik', pertanyaan: 'Berapa persen kebutuhan energi harian yang sebaiknya berasal dari karbohidrat, menurut AMDR WHO/AKG Kemenkes RI?', opsi: ['45–65% dari kebutuhan energi harian', 'Hanya 5–10%', 'Hampir 100%'], benar: 0, penjelasan: 'Kebutuhan karbohidrat harian dihitung sebesar 45–65% dari kebutuhan energi harian, sesuai AMDR WHO/AKG Kemenkes RI.' },
        { topik: 'Aktivitas Fisik', pertanyaan: 'Semakin tinggi tingkat aktivitas fisik seseorang (misalnya berolahraga lebih sering), apa yang terjadi pada perkiraan kebutuhan energi hariannya?', opsi: ['Perkiraan kebutuhan energi harian menjadi lebih besar', 'Perkiraan kebutuhan energi harian menjadi lebih kecil', 'Tidak berpengaruh sama sekali'], benar: 0, penjelasan: 'Semakin tinggi faktor aktivitas seseorang, semakin besar pula perkiraan kebutuhan energi harian yang dihitung.' },
        // 8. Skrining Kesehatan
        { topik: 'Skrining Kesehatan', pertanyaan: 'Apa tujuan utama skrining kesehatan bagi remaja?', opsi: ['Mengenali risiko kesehatan sejak dini, meski merasa sehat', 'Mencari-cari penyakit agar terlihat sakit', 'Hanya formalitas sekolah'], benar: 0, penjelasan: 'Skrining bertujuan mengenali risiko kesehatan sejak dini — bukan mencari-cari penyakit — sebelum berkembang jadi masalah serius.' },
        { topik: 'Skrining Kesehatan', pertanyaan: 'Program Cek Kesehatan Gratis (CKG) dari Kemenkes berlaku untuk usia berapa saja?', opsi: ['Semua usia, dari bayi baru lahir hingga lansia', 'Hanya untuk lansia', 'Hanya untuk balita'], benar: 0, penjelasan: 'CKG adalah program nasional untuk seluruh warga Indonesia, mulai dari bayi baru lahir sampai lansia, termasuk usia remaja.' },
        { topik: 'Skrining Kesehatan', pertanyaan: 'Kenapa penting mengisi formulir skrining kesehatan dengan jujur sebelum pemeriksaan CKG?', opsi: ['Supaya hasil pemeriksaan sesuai kondisi tubuh sebenarnya', 'Supaya cepat selesai saja', 'Supaya nilai skrining terlihat lebih baik'], benar: 0, penjelasan: 'Formulir yang diisi jujur membantu hasil pemeriksaan benar-benar sesuai dengan kondisi tubuh sebenarnya.' },
        { topik: 'Skrining Kesehatan', pertanyaan: 'Kenapa pemeriksaan gula darah penting dilakukan sejak remaja, bukan cuma orang dewasa?', opsi: ['Karena diabetes tipe 2 pada remaja sering tidak bergejala di awal', 'Karena semua remaja pasti mengidap diabetes', 'Karena hanya berlaku untuk remaja yang kurus'], benar: 0, penjelasan: 'Diabetes tipe 2 pada remaja seringkali tidak bergejala di tahap awal, sehingga pemeriksaan gula darah berkala penting untuk deteksi dini.' },
        { topik: 'Skrining Kesehatan', pertanyaan: 'Seberapa sering sebaiknya remaja memeriksakan kesehatan gigi ke dokter gigi?', opsi: ['Setiap 6 bulan sekali', 'Setiap 5 tahun sekali', 'Hanya jika sudah sakit parah'], benar: 0, penjelasan: 'Pemeriksaan gigi ke dokter gigi sebaiknya dilakukan setiap 6 bulan sekali agar masalah bisa terdeteksi lebih awal.' },
        { topik: 'Skrining Kesehatan', pertanyaan: 'Gula darah puasa pada skrining dianggap normal jika berada di bawah angka berapa?', opsi: ['100 mg/dL', '250 mg/dL', '50 mg/dL'], benar: 0, penjelasan: 'Gula darah puasa dianggap normal jika berada di bawah 100 mg/dL, dan gula darah sewaktu di bawah 140 mg/dL.' },
        // 9. Kenali Gula Tersembunyi
        { topik: 'Gula Tersembunyi', pertanyaan: "Kenapa disebut 'gula tersembunyi' pada beberapa produk?", opsi: ['Karena ada gula meski rasanya tidak terlalu manis', 'Karena gula itu ilegal ditambahkan', 'Karena hanya ada di produk luar negeri'], benar: 0, penjelasan: "Istilah 'gula tersembunyi' menggambarkan gula yang tidak langsung disadari karena terdapat dalam produk yang tidak selalu terasa sangat manis." },
        { topik: 'Gula Tersembunyi', pertanyaan: 'Menurut definisi WHO, apakah gula dalam buah utuh termasuk free sugars?', opsi: ['Tidak, gula dalam makanan utuh tidak otomatis termasuk free sugars', 'Ya, semua gula pada buah termasuk free sugars', 'Hanya buah impor yang termasuk free sugars'], benar: 0, penjelasan: 'Buah utuh tetap mengandung gula alami, tetapi gula tersebut tidak termasuk free sugars menurut definisi WHO.' },
        { topik: 'Gula Tersembunyi', pertanyaan: 'Manakah yang termasuk free sugars menurut WHO?', opsi: ['Madu, sirup, dan jus buah/konsentrat jus', 'Buah utuh yang dimakan langsung', 'Sayuran segar'], benar: 0, penjelasan: 'WHO memasukkan gula tambahan serta gula alami dalam madu, sirup, jus buah, dan konsentrat jus buah sebagai free sugars.' },
        { topik: 'Gula Tersembunyi', pertanyaan: 'Cara terbaik untuk mengetahui kandungan gula sebuah produk kemasan adalah?', opsi: ['Membaca informasi pada label pangan', 'Mencicipi rasa manisnya saja', 'Melihat warna kemasan'], benar: 0, penjelasan: 'Rasa membantu kita menikmati makanan, tetapi label membantu mengetahui informasi kandungan produk yang sebenarnya.' },
        { topik: 'Gula Tersembunyi', pertanyaan: 'Menurut definisi WHO, apakah gula dalam susu segar termasuk free sugars?', opsi: ['Tidak, karena gula tersebut alami dalam makanan utuh', 'Ya, semua gula dalam susu adalah free sugars', 'Hanya berlaku untuk susu kemasan'], benar: 0, penjelasan: 'Gula yang secara alami terdapat dalam makanan utuh seperti susu tidak otomatis termasuk free sugars menurut definisi WHO.' },
        { topik: 'Gula Tersembunyi', pertanyaan: 'Kalau ingin tahu kandungan gula sebenarnya dari sebuah produk kemasan, sebaiknya periksa bagian mana dari kemasan?', opsi: ['Informasi nilai gizi dan daftar bahan', 'Klaim dan gambar di bagian depan kemasan saja', 'Warna kemasan'], benar: 0, penjelasan: 'Bagian depan kemasan bisa menarik perhatian dengan klaim atau gambar, tetapi informasi nilai gizi dan daftar bahan lebih akurat untuk mengetahui kandungan produk.' },
        // 10. Cara Membaca Label Pangan
        { topik: 'Baca Label', pertanyaan: 'Kenapa membaca label kemasan makanan itu penting?', opsi: ['Untuk tahu kandungan gula & nutrisi', 'Untuk tahu warna kemasan', 'Untuk tahu harga produk'], benar: 0, penjelasan: 'Label kemasan menunjukkan kandungan gula, nutrisi, dan bahan lain di dalam produk.' },
        { topik: 'Baca Label', pertanyaan: 'Kalau satu kemasan berisi 2 takaran saji dan kamu menghabiskan seluruh kemasan, berapa kali jumlah gula per sajian yang kamu konsumsi?', opsi: ['2 kali jumlah gula per sajian', 'Setengah dari jumlah gula per sajian', 'Sama seperti 1 sajian saja'], benar: 0, penjelasan: 'Jika satu kemasan punya 2 sajian dan kamu menghabiskan semuanya, berarti kamu mengonsumsi dua kali jumlah gula per sajian.' },
        { topik: 'Baca Label', pertanyaan: 'Selain takaran saji dan kandungan gula, apa lagi yang penting dilihat pada label pangan?', opsi: ['Jumlah sajian per kemasan dan daftar bahan', 'Warna kemasan', 'Ukuran font pada label'], benar: 0, penjelasan: '4 hal penting pada label: takaran saji, jumlah sajian per kemasan, kandungan gula, dan daftar bahan.' },
        { topik: 'Baca Label', pertanyaan: 'Apa fungsi daftar bahan pada label pangan?', opsi: ['Menunjukkan bahan yang digunakan, termasuk berbagai nama gula', 'Menunjukkan tanggal produksi saja', 'Menunjukkan negara asal produk'], benar: 0, penjelasan: 'Daftar bahan membantu mengenali bahan dalam produk — gula tambahan bisa punya nama berbeda seperti gula, sirup, atau madu.' },
        { topik: 'Baca Label', pertanyaan: 'Dalam contoh label pangan, jika gula per sajian adalah 8 gram dan ada 2 sajian per kemasan, berapa total gula jika seluruh kemasan dihabiskan?', opsi: ['16 gram', '8 gram', '4 gram'], benar: 0, penjelasan: 'Jika satu kemasan memiliki 2 sajian dengan 8 gram gula per sajian, menghabiskan seluruh kemasan berarti mengonsumsi 16 gram gula (2 × 8 gram).' },
        { topik: 'Baca Label', pertanyaan: 'Apa langkah pertama yang disarankan saat membeli produk kemasan agar bisa memilih dengan lebih sadar?', opsi: ['Melihat informasi nilai gizi dan daftar bahan', 'Langsung membeli tanpa melihat apa pun', 'Memilih berdasarkan warna kemasan'], benar: 0, penjelasan: 'Langkah pertama adalah melihat informasi nilai gizi dan daftar bahan, sebelum memahami dan mempertimbangkan pilihan.' },
        // 10b. Label Minuman Manis (contoh nyata di kemasan)
        { topik: 'Label Minuman Manis', pertanyaan: 'Satu botol Teh Botol Sosro (350 ml) punya 28 gram karbohidrat total, sementara protein dan lemaknya 0 gram. Artinya karbohidrat itu hampir seluruhnya berasal dari apa?', opsi: ['Gula', 'Serat pangan', 'Lemak jenuh'], benar: 0, penjelasan: 'Kalau protein dan lemak pada label 0 gram, karbohidrat total pada minuman hampir seluruhnya adalah gula — bukan pati atau serat.' },
        { topik: 'Label Minuman Manis', pertanyaan: 'Pada label Pocari Sweat, satu sajian (350 ml) mengandung 21 gram gula. Kira-kira berapa persen ini dari batas gula tambahan harian (50 gram)?', opsi: ['Sekitar 42%', 'Sekitar 5%', 'Sekitar 90%'], benar: 0, penjelasan: '21 gram dari 50 gram batas harian setara sekitar 42% — cukup besar untuk satu botol saja, meskipun rasanya tidak terlalu manis.' },
        { topik: 'Label Minuman Manis', pertanyaan: 'Minuman isotonik seperti Pocari Sweat sering dianggap "minuman kesehatan". Kapan sebenarnya fungsi penggantian elektrolitnya paling relevan?', opsi: ['Setelah aktivitas fisik berat yang memicu banyak keringat', 'Setiap saat, termasuk saat duduk santai', 'Hanya saat sedang sakit flu'], benar: 0, penjelasan: 'Fungsi isotonik untuk mengganti elektrolit paling relevan setelah aktivitas berat berkeringat banyak — bukan sebagai minuman harian biasa, karena tetap mengandung gula cukup tinggi.' },
        { topik: 'Label Minuman Manis', pertanyaan: 'Frestea Green Tea 500 ml punya 2 takaran saji (masing-masing 250 ml). Kalau kamu habiskan satu botol penuh, berapa kali nilai gizi yang tertulis di label yang sebenarnya kamu konsumsi?', opsi: ['2 kali', '1 kali', 'Setengah kali'], benar: 0, penjelasan: 'Karena satu botol berisi 2 sajian, menghabiskan sebotol penuh berarti mengonsumsi dua kali nilai energi dan karbohidrat yang tertulis per sajian di label.' },
        { topik: 'Label Minuman Manis', pertanyaan: 'Satu kaleng Coca-Cola (250 ml) mengandung sekitar 27 gram gula, sedangkan Sprite kaleng (250 ml) sekitar 25 gram. Apa yang bisa disimpulkan?', opsi: ['Kadar gula soda rasa cola dan rasa lemon-lime pada takaran sama ternyata tidak jauh berbeda', 'Sprite jauh lebih rendah gula daripada Coca-Cola', 'Soda tanpa kafein pasti bebas gula'], benar: 0, penjelasan: 'Selisih 27 g dan 25 g relatif kecil — menunjukkan bahwa citra "lebih ringan" pada salah satu produk tidak selalu terbukti dari angka gula di labelnya.' },
        { topik: 'Label Minuman Manis', pertanyaan: 'Kalau dalam sehari kamu minum satu botol Teh Botol Sosro (28 g gula) dan satu kaleng Coca-Cola 250 ml (27 g gula), total gula dari dua minuman itu saja sudah berapa gram, dan bagaimana posisinya terhadap batas 50 g/hari?', opsi: ['55 g — sudah melebihi batas harian', '10 g — masih jauh di bawah batas', '30 g — pas separuh batas'], benar: 0, penjelasan: '28 g + 27 g = 55 g, sudah melampaui batas gula tambahan harian (50 g) hanya dari dua minuman, belum termasuk gula dari makanan lain.' },
        // 11. Ganti Kebiasaan Kecil
        { topik: 'Kebiasaan Kecil', pertanyaan: 'Camilan mana yang lebih sehat?', opsi: ['Buah potong segar', 'Donat', 'Es krim'], benar: 0, penjelasan: 'Buah potong segar mengandung gula alami beserta serat, vitamin, dan mineral yang menyehatkan.' },
        { topik: 'Kebiasaan Kecil', pertanyaan: 'Bagaimana cara yang disarankan untuk mengurangi minuman manis?', opsi: ['Bertahap, misalnya dari tiap hari jadi beberapa kali seminggu', 'Langsung berhenti total dalam 1 hari', 'Menggantinya dengan minuman manis jenis lain'], benar: 0, penjelasan: 'Perubahan kebiasaan lebih mudah bertahan kalau dilakukan bertahap, bukan langsung drastis.' },
        { topik: 'Kebiasaan Kecil', pertanyaan: 'Kalau suatu hari belum berhasil menerapkan kebiasaan sehat, apa yang sebaiknya dilakukan?', opsi: ['Tidak perlu merasa bersalah, coba lagi di kesempatan berikutnya', 'Menyerah dan tidak mencoba lagi', 'Menghukum diri sendiri dengan tidak makan'], benar: 0, penjelasan: 'Satu hari yang berbeda tidak berarti semua usaha jadi sia-sia — coba lagi di kesempatan berikutnya.' },
        { topik: 'Kebiasaan Kecil', pertanyaan: 'Apa saran utama saat memulai kebiasaan sehat terkait gula?', opsi: ['Mulai dari satu kebiasaan kecil yang paling mudah', 'Harus mengubah semua kebiasaan sekaligus', 'Menunggu sampai benar-benar siap 100%'], benar: 0, penjelasan: 'Kamu tidak perlu melakukan semuanya sekaligus — pilih satu kebiasaan yang paling mudah untuk dimulai.' },
        { topik: 'Kebiasaan Kecil', pertanyaan: 'Saat haus, minuman apa yang sebaiknya menjadi pilihan pertama dibandingkan minuman manis?', opsi: ['Air putih', 'Soda', 'Teh manis kemasan'], benar: 0, penjelasan: 'Air putih sebaiknya menjadi pilihan pertama saat haus, sebagai alternatif sederhana tanpa tambahan gula dibandingkan minuman manis.' },
        // 12. Tips Sehat di Sekolah
        { topik: 'Tips Sekolah', pertanyaan: 'Kebiasaan sederhana apa yang bisa dilakukan sebelum berangkat sekolah untuk mengurangi minuman manis?', opsi: ['Membawa botol air putih dari rumah', 'Membeli minuman manis di jalan', 'Melewatkan sarapan'], benar: 0, penjelasan: 'Membawa air putih dari rumah adalah salah satu kebiasaan sederhana yang bisa dimulai sebelum berangkat sekolah.' },
        { topik: 'Tips Sekolah', pertanyaan: 'Saat jam istirahat dan ingin membeli produk kemasan di kantin, apa yang sebaiknya dilakukan?', opsi: ['Melihat informasi nilai gizi jika tersedia labelnya', 'Langsung membeli tanpa melihat apa pun', 'Membeli produk paling manis'], benar: 0, penjelasan: 'Jika produk kemasan tersedia labelnya, luangkan waktu untuk melihat informasi nilai gizinya dulu.' },
        { topik: 'Tips Sekolah', pertanyaan: 'Kalau temanmu membeli minuman manis, apa sikap yang tepat?', opsi: ['Tetap boleh memilih sesuai kebutuhanmu sendiri, tanpa harus menghakimi', 'Harus ikut membeli yang sama', 'Menyuruh teman berhenti membeli'], benar: 0, penjelasan: 'Kamu boleh membuat pilihan sendiri, dan temanmu juga punya pilihannya masing-masing — tidak perlu saling menghakimi.' },
        { topik: 'Tips Sekolah', pertanyaan: 'Saat ada acara/perayaan di sekolah dengan banyak makanan manis, apa sikap yang disarankan?', opsi: ['Tetap boleh menikmati, tapi perhatikan jumlah dan seimbangi pilihan', 'Sama sekali tidak boleh makan apa pun', 'Harus menghabiskan semua yang tersedia'], benar: 0, penjelasan: 'Makan sehat bukan berarti tidak boleh menikmati makanan — cukup perhatikan jumlahnya dan seimbangi dengan air putih.' },
        { topik: 'Tips Sekolah', pertanyaan: 'Kalau temanmu memilih membeli minuman manis dan kamu tidak ikut membelinya, sikap apa yang tepat?', opsi: ['Tetap pada pilihanmu tanpa perlu menghakimi pilihan temanmu', 'Memaksa teman ikut memilih air putih', 'Ikut membeli meskipun sebenarnya tidak ingin'], benar: 0, penjelasan: 'Kamu boleh tetap pada pilihanmu sendiri, dan temanmu juga punya pilihannya masing-masing — tidak perlu saling menghakimi.' }
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
        {
            tipe: 'info', ikon: '📌', label: 'Fakta',
            teks: 'WHO menyarankan konsumsi gula tambahan tidak lebih dari 10% total energi harian — dan makin sedikit makin baik untuk kesehatan.'
        },
        { tipe: 'kuis', ikon: '🥤', label: 'Kuis' },
        {
            tipe: 'bonus', ikon: '💧', label: 'Bonus',
            teks: 'Kamu memilih air putih dibanding minuman manis hari ini. Maju 2 langkah!',
            langkah: 2
        },
        { tipe: 'checkpoint', ikon: '🩺', label: 'Cek Sehat', teks: 'Tekanan darahmu normal! +10 Poin Sehat.', poin: 10 },
        { tipe: 'kuis', ikon: '⚠️', label: 'Kuis' },
        {
            tipe: 'jebakan', ikon: '🍩', label: 'Jebakan',
            teks: 'Kamu ngemil donat dan permen sepulang sekolah. Mundur 2 langkah.',
            langkah: -2
        },
        {
            tipe: 'info', ikon: '🥫', label: 'Fakta',
            teks: 'Cek label: 1 kaleng Coca-Cola (250ml) mengandung ±27g gula, dan 1 botol Teh Botol Sosro (350ml) ±28g gula — masing-masing lebih dari separuh batas gula harian (50g)!'
        },
        { tipe: 'kuis', ikon: '🍇', label: 'Kuis' },
        { tipe: 'checkpoint', ikon: '🦷', label: 'Cek Sehat', teks: 'Kamu rajin sikat gigi dan bebas gula tersembunyi. +10 Poin Sehat.', poin: 10 },
        { tipe: 'kuis', ikon: '🏷️', label: 'Kuis' },
        {
            tipe: 'bonus', ikon: '🚶', label: 'Bonus',
            teks: 'Kamu jalan kaki ke sekolah hari ini. Maju 1 langkah!',
            langkah: 1
        },
        {
            tipe: 'info', ikon: '🍞', label: 'Fakta',
            teks: 'Gula tersembunyi juga ada di makanan yang terasa gurih, seperti saus tomat dan roti kemasan.'
        },
        { tipe: 'kuis', ikon: '🧬', label: 'Kuis' },
        { tipe: 'checkpoint', ikon: '⚡', label: 'Cek Sehat', teks: 'Energimu stabil sepanjang hari berkat pola makan seimbang. +10 Poin Sehat.', poin: 10 },
        { tipe: 'kuis', ikon: '🍭', label: 'Kuis' },
        {
            tipe: 'jebakan', ikon: '🌙', label: 'Jebakan',
            teks: 'Kamu begadang sambil ngemil manis. Mundur 1 langkah.',
            langkah: -1
        },
        { tipe: 'kuis', ikon: '🩺', label: 'Kuis' },
        {
            tipe: 'jebakan', ikon: '🥯', label: 'Jebakan',
            teks: 'Kamu lupa sarapan dan akhirnya jajan sembarangan. Mundur 1 langkah.',
            langkah: -1
        }
    ];
    // ===== Bank Fakta untuk kotak "Tahukah Kamu?" (tipe: 'info') di papan.
    // Dipilih acak (sistem "bag", tidak berulang sebelum semua tampil sekali)
    // tiap kali pemain berhenti di kotak fakta manapun — supaya walau
    // berhenti berkali-kali di kotak yang sama, faktanya tidak selalu sama. =====
    const FAKTA_KOTAK_INFO = [
        { ikon: '📌', teks: 'WHO menyarankan konsumsi gula tambahan tidak lebih dari 10% total energi harian — dan makin sedikit makin baik untuk kesehatan.' },
        { ikon: '🥫', teks: 'Cek label: 1 kaleng Coca-Cola (250ml) mengandung ±27g gula, dan 1 botol Teh Botol Sosro (350ml) ±28g gula — masing-masing lebih dari separuh batas gula harian (50g)!' },
        { ikon: '🍞', teks: 'Gula tersembunyi juga ada di makanan yang terasa gurih, seperti saus tomat dan roti kemasan.' },
        { ikon: '🍬', teks: 'Batas gula tambahan harian yang disarankan cuma 50 gram — sekitar 4 sendok makan. Satu botol teh manis kemasan saja bisa memakai lebih dari separuh jatah itu.' },
        { ikon: '🏃', teks: 'WHO menyarankan remaja bergerak aktif minimal 60 menit tiap hari. Jalan kaki, main bola, atau naik-turun tangga juga terhitung, lho.' },
        { ikon: '🩸', teks: 'Diabetes tipe 2 sering nggak bergejala di awal. Karena itu, skrining gula darah berkala penting dilakukan meski merasa sehat-sehat saja.' },
        { ikon: '🦷', teks: 'Konsumsi gula berlebih nggak cuma berisiko ke gula darah, tapi juga mempercepat kerusakan gigi. Sikat gigi teratur bantu menjaga keduanya.' },
        { ikon: '🍽️', teks: 'Coba terapkan panduan "Isi Piringku": separuh piring sayur dan buah, sisanya karbohidrat dan protein secara seimbang.' },
        { ikon: '👪', teks: 'Riwayat diabetes di keluarga meningkatkan risiko, tapi bukan berarti pasti terkena. Pola hidup sehat sejak dini tetap jadi langkah pencegahan yang berarti.' },
        { ikon: '🥤', teks: 'Kalau haus, jadikan air putih pilihan pertama. Minuman manis boleh sesekali, tapi jangan jadi kebiasaan harian.' },
        { ikon: '🍩', teks: 'Lebih dari 90% kasus diabetes di dunia adalah tipe 2 — dan kabar baiknya, tipe ini bisa dicegah lewat pola makan dan aktivitas fisik yang terjaga sejak remaja.' },
        { ikon: '🏷️', teks: 'Sebelum beli jajanan kemasan, coba lihat label informasi nilai gizinya dulu. Kebiasaan kecil ini membantu kamu lebih sadar berapa gula yang masuk ke tubuh.' },
        { ikon: '🌙', teks: 'Begadang sambil ngemil manis adalah kombinasi yang perlu diwaspadai — kurang tidur bisa memengaruhi cara tubuh mengatur gula darah.' },
        { ikon: '🚶', teks: 'Kalau jarak ke sekolah dekat, jalan kaki atau naik sepeda bisa jadi cara sederhana menambah aktivitas fisik harian.' },
        { ikon: '🥣', teks: 'Melewatkan sarapan justru bisa membuat kamu lebih mudah tergoda jajan sembarangan saat istirahat. Sarapan bergizi membantu menjaga energi dan pilihan makanmu.' },
        { ikon: '🍚', teks: 'Kebutuhan karbohidrat harian yang disarankan sekitar 45–65% dari total energi — porsi wajar, bukan berlebihan maupun terlalu sedikit.' },
        { ikon: '💧', teks: 'Mengganti satu porsi minuman manis dengan air putih setiap hari adalah kebiasaan kecil yang, kalau konsisten, dampaknya cukup besar bagi kesehatan jangka panjang.' },
        { ikon: '💉', teks: 'Diabetes tipe 1 berbeda dari tipe 2 — penderitanya membutuhkan suntikan insulin setiap hari seumur hidup karena tubuh sudah tidak bisa memproduksi insulin sendiri.' },
        { ikon: '🤰', teks: 'Diabetes gestasional bisa muncul saat kehamilan dan umumnya menghilang setelah melahirkan, tapi ibu yang pernah mengalaminya tetap punya risiko lebih tinggi terkena diabetes tipe 2 di kemudian hari.' },
        { ikon: '🩺', teks: 'Program Cek Kesehatan Gratis (CKG) di sekolah bisa jadi kesempatan buat kamu memantau kondisi kesehatan sejak dini, termasuk gula darah.' }
    ];
    let bagFaktaKotakIndeks = [];
    function ambilFaktaKotakAcak() {
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
    const BONUS_KEJADIAN = [
        { ikon: '💧', teks: 'Kamu memilih air putih dibanding minuman manis hari ini.' },
        { ikon: '🚶', teks: 'Kamu jalan kaki ke sekolah hari ini.' },
        { ikon: '🥗', teks: 'Kamu makan sayur dan buah waktu makan siang.' },
        { ikon: '🏃', teks: 'Kamu olahraga ringan sepulang sekolah.' },
        { ikon: '🍱', teks: 'Kamu sarapan bergizi sebelum berangkat sekolah.' },
        { ikon: '😴', teks: 'Kamu tidur cukup semalam, jadi lebih fokus hari ini.' },
        { ikon: '🦷', teks: 'Kamu rajin sikat gigi pagi dan malam.' },
        { ikon: '🏷️', teks: 'Kamu cek label gizi dulu sebelum beli jajanan kemasan.' },
        { ikon: '🍎', teks: 'Kamu bawa buah dari rumah sebagai camilan.' },
        { ikon: '🚰', teks: 'Kamu isi ulang botol air putih beberapa kali hari ini.' }
    ];
    let bagBonusIndeks = [];
    function ambilBonusAcak() {
        if (bagBonusIndeks.length === 0) {
            bagBonusIndeks = BONUS_KEJADIAN.map((_, i) => i);
            for (let i = bagBonusIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagBonusIndeks[i], bagBonusIndeks[j]] = [bagBonusIndeks[j], bagBonusIndeks[i]];
            }
        }
        return BONUS_KEJADIAN[bagBonusIndeks.pop()];
    }
    const JEBAKAN_KEJADIAN = [
        { ikon: '🍩', teks: 'Kamu ngemil donat dan permen sepulang sekolah.' },
        { ikon: '🌙', teks: 'Kamu begadang sambil ngemil manis.' },
        { ikon: '🥯', teks: 'Kamu lupa sarapan dan akhirnya jajan sembarangan.' },
        { ikon: '🥤', teks: 'Kamu beli minuman manis kemasan lagi hari ini.' },
        { ikon: '🍬', teks: 'Kamu makan permen terus-terusan waktu belajar.' },
        { ikon: '📱', teks: 'Kamu main HP sampai larut dan lupa waktu tidur.' },
        { ikon: '🍟', teks: 'Kamu jajan gorengan dan minuman manis waktu istirahat.' },
        { ikon: '🛋️', teks: 'Kamu males gerak seharian dan cuma rebahan.' },
        { ikon: '🧋', teks: 'Kamu beli minuman boba ekstra manis sepulang sekolah.' },
        { ikon: '🍪', teks: 'Kamu ngemil biskuit manis berkali-kali tanpa sadar.' }
    ];
    let bagJebakanIndeks = [];
    function ambilJebakanAcak() {
        if (bagJebakanIndeks.length === 0) {
            bagJebakanIndeks = JEBAKAN_KEJADIAN.map((_, i) => i);
            for (let i = bagJebakanIndeks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bagJebakanIndeks[i], bagJebakanIndeks[j]] = [bagJebakanIndeks[j], bagJebakanIndeks[i]];
            }
        }
        return JEBAKAN_KEJADIAN[bagJebakanIndeks.pop()];
    }
    let posisiPemain = 0;
    let poinSehat = 0;
    let jumlahLap = 0;
    let sedangJalan = false;
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
        const stageBaru = cariInfoStagePet(rekorBaru).stage;
        if (stageBaru.min !== stageLama.min) {
            tampilkanLevelUpPet(stageBaru);
        }
    }
    function perbaruiTampilanSkor() {
        elPoin.textContent = poinSehat;
        elLap.textContent = jumlahLap;
        simpanStateSesi();
        simpanSkorTertinggiJikaRekor();
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
    function pindahkanTokenKeTile(index, instan) {
        document.querySelectorAll('.papan-tile').forEach(t => { t.classList.remove('aktif'); t.classList.remove('baru-mendarat'); });
        const tileTujuan = document.getElementById(`papanTile${index}`);
        if (!tileTujuan) return;
        tileTujuan.classList.add('aktif');
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
            posisiTokenStabilTerakhir = index;
            simpanStateSesi();
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
            tileTujuan.classList.add('baru-mendarat');
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
                    tileTujuan.classList.remove('baru-mendarat');
                    posisiTokenStabilTerakhir = index;
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
    function kocokDadu() {
        if (sedangJalan) return;
        sedangJalan = true;
        btnKocok.disabled = true;
        const hasil = 1 + Math.floor(Math.random() * 6);
        const target = ROTASI_HASIL_DADU[hasil];
        // beberapa putaran penuh acak biar terasa 'dilempar', lalu mendarat pas di sudut yang menunjukkan sisi hasil
        const putaranX = 360 * (2 + Math.floor(Math.random() * 2));
        const putaranY = 360 * (2 + Math.floor(Math.random() * 2));
        const selisihX = (((target.x - (dadu3dRotX % 360)) % 360) + 360) % 360;
        const selisihY = (((target.y - (dadu3dRotY % 360)) % 360) + 360) % 360;
        dadu3dRotX += putaranX + selisihX;
        dadu3dRotY += putaranY + selisihY;
        elDadu.style.transform = `rotateX(${dadu3dRotX}deg) rotateY(${dadu3dRotY}deg)`;
        window.setTimeout(() => {
            langkahkanPemain(hasil);
        }, 900);
    }
    function langkahkanPemain(sisaLangkah) {
        if (sisaLangkah <= 0) {
            munculkanEventTile(posisiPemain);
            return;
        }
        posisiPemain = (posisiPemain + 1) % PAPAN_DATA.length;
        if (posisiPemain === 0) {
            jumlahLap++;
            poinSehat += 10;
            perbaruiTampilanSkor();
            tampilkanToast('🎉 Keliling papan! +10 Poin Sehat');
        }
        // Nunggu animasi lompatan ini beneran mendarat (bukan timer tebakan)
        // sebelum lanjut ke langkah berikutnya — biar tiap lompatan mulus
        // berurutan tanpa numpuk/kepotong.
        Promise.resolve(pindahkanTokenKeTile(posisiPemain, false)).then(() => {
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
            elEventJudul.textContent = tile.label;
            elEventTeks.textContent = tile.teks;
            poinSehat = Math.max(0, poinSehat + tile.poin);
            perbaruiTampilanSkor();
            mulaiJedaLanjut(tile.teks, tutupEvent);
        } else if (tile.tipe === 'info') {
            const faktaAcak = ambilFaktaKotakAcak();
            elEventJudul.textContent = 'Tahukah Kamu?';
            elEventIkon.textContent = faktaAcak.ikon;
            elEventTeks.textContent = faktaAcak.teks;
            poinSehat = Math.max(0, poinSehat + 5);
            perbaruiTampilanSkor();
            elEventFeedback.textContent = '✅ +5 Poin Sehat!';
            elEventFeedback.className = 'game-feedback feedback-benar';
            elEventFeedback.classList.remove('hidden');
            tampilkanToast('📌 +5 Poin Sehat!');
            mulaiJedaLanjut(faktaAcak.teks, tutupEvent);
        } else if (tile.tipe === 'bonus' || tile.tipe === 'jebakan') {
            const kejadianAcak = tile.tipe === 'bonus' ? ambilBonusAcak() : ambilJebakanAcak();
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
        bukaPanelOverlay(overlayEvent);
    }
    function jawabKuis(indexDipilih, tile, btnDipilih) {
        const semuaBtn = elEventOpsiList.querySelectorAll('.game-opsi-btn');
        semuaBtn.forEach(b => (b.disabled = true));
        const benar = indexDipilih === tile.benar;
        btnDipilih.classList.add(benar ? 'opsi-benar' : 'opsi-salah');
        if (!benar) {
            semuaBtn[tile.benar].classList.add('opsi-benar');
        }
        poinSehat = Math.max(0, poinSehat + (benar ? 10 : -5));
        perbaruiTampilanSkor();
        elEventFeedback.textContent = (benar ? '✅ Benar! +10 Poin Sehat. ' : '❌ Belum tepat, -5 Poin Sehat. ') + tile.penjelasan;
        elEventFeedback.className = `game-feedback ${benar ? 'feedback-benar' : 'feedback-salah'}`;
        elEventFeedback.classList.remove('hidden');
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
        sedangJalan = false;
        dadu3dRotX = -18;
        dadu3dRotY = 28;
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
            poinSehat: Number(localStorage.getItem(kunciAkunAktif(KUNCI_POIN_SESI_BASE))) || 0,
            posisiPemain: Number(localStorage.getItem(kunciAkunAktif(KUNCI_POSISI_SESI_BASE))) || 0,
            jumlahLap: Number(localStorage.getItem(kunciAkunAktif(KUNCI_LAP_SESI_BASE))) || 0,
            skorTertinggi: Number(localStorage.getItem(kunciAkunAktif(KUNCI_SKOR_TERTINGGI))) || 0,
            absenTerakhir: localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR)),
            absenStreak: Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK))) || 0,
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
        const streakSaatIni = Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK))) || 0;
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
        { min: 3, kelas: 'streak-tier-1', label: 'Awal yang bagus, 3 hari beruntun — api merah tua!' },
        { min: 7, kelas: 'streak-tier-2', label: 'Seminggu penuh tanpa putus — api merah menyala!' },
        { min: 14, kelas: 'streak-tier-3', label: 'Dua minggu beruntun — api oranye!' },
        { min: 30, kelas: 'streak-tier-4', label: 'Sebulan penuh — api emas, luar biasa!' },
        { min: 60, kelas: 'streak-tier-5', label: 'Dua bulan beruntun — api hijau mistis!' },
        { min: 90, kelas: 'streak-tier-6', label: 'Tiga bulan beruntun — api biru, langka!' },
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
        const streakSaatIni = Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK))) || 0;
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
        const streakSaatIni = Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK))) || 0;
        elAbsenStreak.textContent = streakSaatIni;
        terapkanTierStreak(streakSaatIni);
        if (elAbsenStreakRekor) elAbsenStreakRekor.textContent = ambilRekorStreak();
    }
    function absenHariIni() {
        const hariIni = new Date();
        const strHariIni = formatTanggal(hariIni);
        const terakhir = localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_TERAKHIR));
        if (terakhir === strHariIni) return; // jaga-jaga: sudah absen hari ini
        const kemarin = new Date(hariIni);
        kemarin.setDate(kemarin.getDate() - 1);
        const streakSebelumnya = Number(localStorage.getItem(kunciAkunAktif(KUNCI_ABSEN_STREAK))) || 0;
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
        perbaruiTampilanSkor();
        perbaruiTampilanAbsen();
        const tierSebelumnya = cariTierStreak(streakSebelumnya);
        const tierBaru = cariTierStreak(streakBaru);
        if (rekorPecah && streakBaru > 1) {
            tampilkanToast(`🏆 Rekor baru! Streak ${streakBaru} hari — terpanjang yang pernah kamu capai`);
        } else if (tierBaru.kelas !== tierSebelumnya.kelas) {
            tampilkanToast(`🔥 Streak naik ke ${streakBaru} hari — ${tierBaru.label}`);
        } else {
            tampilkanToast('🎉 Absen berhasil! +10 Poin Sehat');
        }
    }
    // ===== Bank Fakta Sehat Absen — fakta/arahan singkat seputar pencegahan
    // diabetes melitus (DM) pada remaja. Dipilih acak (sistem "bag", tidak
    // berulang sebelum semua tampil sekali) tiap kali tombol absen ditekan. =====
    const FAKTA_ABSEN = [
        { ikon: '🍬', teks: 'Batas gula tambahan harian yang disarankan cuma 50 gram — sekitar 4 sendok makan. Satu botol teh manis kemasan saja bisa memakai lebih dari separuh jatah itu.' },
        { ikon: '🥤', teks: 'Kalau haus, jadikan air putih pilihan pertama. Minuman manis boleh sesekali, tapi jangan jadi kebiasaan harian.' },
        { ikon: '🏃', teks: 'WHO menyarankan remaja bergerak aktif minimal 60 menit tiap hari. Jalan kaki, main bola, atau naik-turun tangga juga terhitung, lho.' },
        { ikon: '🍩', teks: 'Lebih dari 90% kasus diabetes di dunia adalah tipe 2 — dan kabar baiknya, tipe ini bisa dicegah lewat pola makan dan aktivitas fisik yang terjaga sejak remaja.' },
        { ikon: '🏷️', teks: 'Sebelum beli jajanan kemasan, coba lihat label informasi nilai gizinya dulu. Kebiasaan kecil ini membantu kamu lebih sadar berapa gula yang masuk ke tubuh.' },
        { ikon: '🍞', teks: 'Gula tersembunyi nggak cuma ada di makanan manis — saus tomat, roti kemasan, sampai kecap juga bisa mengandung gula tambahan.' },
        { ikon: '🩸', teks: 'Diabetes tipe 2 sering nggak bergejala di awal. Karena itu, skrining gula darah berkala penting dilakukan meski merasa sehat-sehat saja.' },
        { ikon: '🦷', teks: 'Konsumsi gula berlebih nggak cuma berisiko ke gula darah, tapi juga mempercepat kerusakan gigi. Sikat gigi teratur bantu menjaga keduanya.' },
        { ikon: '🌙', teks: 'Begadang sambil ngemil manis adalah kombinasi yang perlu diwaspadai — kurang tidur bisa memengaruhi cara tubuh mengatur gula darah.' },
        { ikon: '🍽️', teks: 'Coba terapkan panduan "Isi Piringku": separuh piring sayur dan buah, sisanya karbohidrat dan protein secara seimbang.' },
        { ikon: '🚶', teks: 'Kalau jarak ke sekolah dekat, jalan kaki atau naik sepeda bisa jadi cara sederhana menambah aktivitas fisik harian.' },
        { ikon: '🥣', teks: 'Melewatkan sarapan justru bisa membuat kamu lebih mudah tergoda jajan sembarangan saat istirahat. Sarapan bergizi membantu menjaga energi dan pilihan makanmu.' },
        { ikon: '🧃', teks: 'Satu kaleng minuman bersoda (250 ml) bisa mengandung sekitar 27 gram gula — hampir mendekati batas gula tambahan harianmu, dari satu minuman saja.' },
        { ikon: '👪', teks: 'Riwayat diabetes di keluarga meningkatkan risiko, tapi bukan berarti pasti terkena. Pola hidup sehat sejak dini tetap jadi langkah pencegahan yang berarti.' },
        { ikon: '🍚', teks: 'Kebutuhan karbohidrat harian yang disarankan sekitar 45–65% dari total energi — porsi wajar, bukan berlebihan maupun terlalu sedikit.' },
        { ikon: '💧', teks: 'Mengganti satu porsi minuman manis dengan air putih setiap hari adalah kebiasaan kecil yang, kalau konsisten, dampaknya cukup besar bagi kesehatan jangka panjang.' }
    ];
    let bagFaktaAbsenIndeks = [];
    function ambilFaktaAbsenAcak() {
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

