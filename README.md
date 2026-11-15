# GerakMPP UTHM — Mod Demo

GerakMPP demo untuk mencatat pergerakan rasmi MPP, tuntutan perbelanjaan bersama bukti, dan permohonan cuti. Tiada Supabase, pelayan, atau sambungan backend diperlukan.

## Mula menggunakan demo

1. Buka `index.html` dalam browser atau gunakan Live Server dalam VS Code.
2. Pada halaman log masuk, pilih akaun demo. Semua akaun menggunakan kata laluan `demo1234`:
   - MPP 1: `mpp1@demo.uthm`
   - MPP 2: `mpp2@demo.uthm`
   - Admin: `admin@demo.uthm`
3. Log masuk sebagai MPP dan tambah pergerakan.
4. Buka **Tuntutan**, pilih kategori seperti minyak atau barangan, isi butiran, amaun, tarikh dan lampirkan bukti PDF/JPG/PNG. Tuntutan tidak perlu dipautkan kepada rekod pergerakan. Bukti wajib; had demo 500 KB.
5. Log keluar, masuk sebagai admin dan buka **Kelulusan admin** untuk melihat bukti serta meluluskan atau menolak tuntutan. Nota wajib jika tuntutan ditolak.
6. Sebagai MPP, buka **Permohonan cuti** untuk pilih jenis cuti, tarikh mula/tamat dan sebab; dokumen sokongan pilihan. Admin boleh meluluskan atau menolak permohonan di panel **Semakan cuti**. Nota wajib jika permohonan ditolak.
7. Log masuk semula sebagai MPP untuk menyemak status tuntutan dan cuti.

Rekod dan bukti disimpan dalam `localStorage` browser pada peranti ini sahaja. Akaun demo bukan akaun keselamatan sebenar, dan perubahan tidak dikongsi antara browser atau peranti. Membersihkan data laman akan memadam rekod demo. Gunakan hanya data dan resit contoh; jangan masukkan maklumat peribadi atau tuntutan sebenar. Sambungan backend boleh ditambah kemudian apabila aliran demo dipersetujui.
