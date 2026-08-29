// ===== SFX Tombol (Sobat Sehat) =====
// Nambahin efek suara ke SEMUA tombol di web ini pakai event delegation,
// jadi tidak perlu edit javascript.js sama sekali (dan otomatis kepakai juga
// buat tombol yang dibuat lewat JS/dinamis, misal pilihan kuis).
//
//   sfx-menu.mp3  -> tombol menu sidebar, kartu yang pindah section/menu,
//                    breadcrumb, dan semua tombol "Kembali ke ..."
//   sfx-klik.mp3  -> sisanya (submit, absen, kocok dadu, toggle, konfirmasi,
//                    pilihan kuis, dll.)
//
// File ini HARUS dimuat setelah javascript.js di index.html.

(function () {
    const sfxMenu = new Audio('sfx-menu.mp3');
    const sfxKlik = new Audio('sfx-klik.mp3');
    sfxMenu.preload = 'auto';
    sfxKlik.preload = 'auto';
    sfxMenu.volume = 0.5;
    sfxKlik.volume = 0.5;

    // Pakai cloneNode tiap mau mainin suara, supaya kalau tombol diklik
    // cepat berturut-turut suaranya bisa numpuk/overlap, bukan malah
    // kepotong karena instance Audio yang sama masih "playing".
    function mainkan(audio) {
        const salinan = audio.cloneNode();
        salinan.volume = audio.volume;
        salinan.play().catch(() => {
            // Diamkan saja kalau ditolak browser (mis. autoplay policy
            // sebelum ada interaksi user) — tidak perlu menghentikan apa pun.
        });
    }

    // Tombol yang termasuk "navigasi menu": item menu sidebar, tombol
    // hamburger, breadcrumb, semua tombol kembali, dan kartu-kartu yang
    // pindah ke section/halaman lain (dashboard, materi, tips, dst).
    const SELECTOR_MENU = [
        '.nav-item',
        '#btnMenuToggle',
        '.breadcrumb-link',
        '[id^="btnKembali"]',
        '[data-target]',
        '[data-materi]',
        '[data-tip]',
        '.mg-linear-btn',
        '.gk-linear-btn'
    ].join(', ');

    // Capture (true) supaya suara tetap kepencet walau handler lain di
    // javascript.js sempat manggil stopPropagation().
    document.addEventListener('click', function (e) {
        const tombol = e.target.closest('button');
        if (!tombol || tombol.disabled) return;

        if (tombol.matches(SELECTOR_MENU)) {
            mainkan(sfxMenu);
        } else {
            mainkan(sfxKlik);
        }
    }, true);
})();
