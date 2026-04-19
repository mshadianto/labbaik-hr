-- =====================================================================
-- Labbaik HR · Gelombang 2: RAG Knowledge Base Ingestion (Demo Mode)
-- =====================================================================
-- Ingest 14 chunks Perka BPKH dengan pseudo-embedding untuk demo.
-- Untuk production: jalankan `python scripts/ingest_rag.py` dengan Jina/OpenAI.
--
-- Demo mode pakai hashing text → vector untuk bisa test flow RAG
-- tanpa butuh API key embedding provider.
-- =====================================================================

-- Helper: text → pseudo-embedding 1536-dim (deterministic, tidak seakurat real)
create or replace function text_to_pseudo_embedding(input_text text)
returns vector(1536) as $$
declare
  v_hash bytea;
  v_array float[] := array[]::float[];
  i int;
begin
  -- Generate 1536 floats dari multi-hash text
  for i in 0..1535 loop
    v_hash := digest(input_text || i::text, 'sha256');
    -- Convert byte → float [-1, 1]
    v_array := array_append(v_array,
      (get_byte(v_hash, i % 32)::float - 127.5) / 127.5
    );
  end loop;
  return v_array::vector(1536);
end;
$$ language plpgsql immutable;

-- =====================================================================
-- Ingest 14 chunks
-- =====================================================================

insert into hr_knowledge_chunks (source_title, source_kind, chunk_text, embedding, metadata)
values
  ('Perka BPKH No. 5/2023 tentang Kepegawaian', 'peraturan',
   'Setiap pegawai tetap BPKH berhak atas cuti haji sekali selama masa kerja, dengan durasi maksimal 40 hari kalender. Pengajuan cuti haji wajib dilengkapi dengan bukti porsi haji resmi dari Kementerian Agama dan disampaikan kepada Direktur SDM minimal 90 hari sebelum tanggal keberangkatan. Pengajuan di luar ketentuan ini dapat dipertimbangkan atas diskresi Direktur Utama dengan persetujuan Dewan Pengawas.',
   text_to_pseudo_embedding('cuti haji 40 hari sekali karir Pasal 28'),
   '{"regulation_no":"Perka-5/2023","section":"Pasal 28 ayat (2)","topic":"cuti_haji"}'),

  ('Perka BPKH No. 5/2023 tentang Kepegawaian', 'peraturan',
   'Cuti umrah diberikan maksimal 14 hari kalender per periode, dan dapat diajukan maksimal dua kali dalam satu tahun anggaran. Saldo cuti umrah tidak dapat diakumulasi ke tahun berikutnya. Pegawai yang mengajukan cuti umrah wajib melampirkan bukti pemesanan travel berizin Kementerian Agama.',
   text_to_pseudo_embedding('cuti umrah 14 hari 2x setahun Pasal 29'),
   '{"regulation_no":"Perka-5/2023","section":"Pasal 29","topic":"cuti_umrah"}'),

  ('Perka BPKH No. 5/2023 tentang Kepegawaian', 'peraturan',
   'Cuti tahunan pegawai BPKH sebesar 12 hari kerja per tahun anggaran. Sisa cuti tahunan maksimal 6 hari dapat diakumulasi ke tahun berikutnya. Cuti sakit tidak memotong saldo cuti tahunan, dengan syarat pengajuan dilengkapi surat keterangan dokter untuk izin lebih dari 2 hari berturut-turut.',
   text_to_pseudo_embedding('cuti tahunan 12 hari akumulasi'),
   '{"regulation_no":"Perka-5/2023","section":"Pasal 30","topic":"cuti_tahunan"}'),

  ('Perdir BPKH No. 12/2024 tentang Perjalanan Dinas', 'peraturan',
   'Perjalanan dinas ke Kerajaan Arab Saudi (KSA) termasuk Jeddah, Makkah, dan Madinah diklasifikasikan sebagai Zona A. Komponen biaya: (1) Uang harian USD 165 per hari untuk level staf hingga kepala divisi, USD 220 per hari untuk direktur ke atas. (2) Akomodasi sesuai bukti riil dengan plafon USD 180 per malam zona standar, USD 280 per malam zona haji pada musim puncak. (3) Tiket pesawat kelas ekonomi untuk staf, kelas bisnis untuk level direktur ke atas. Pengajuan via menu Dinas minimal 14 hari sebelum keberangkatan dan memerlukan persetujuan atasan langsung serta Direktur terkait.',
   text_to_pseudo_embedding('dinas KSA Mekkah USD 165 zona A'),
   '{"regulation_no":"Perdir-12/2024","section":"Lampiran III","topic":"dinas_ksa"}'),

  ('Perdir BPKH No. 12/2024 tentang Perjalanan Dinas', 'peraturan',
   'Anggota Komite Audit dan Dewan Pengawas yang melakukan kunjungan ke BPKH Limited di KSA harus memperoleh persetujuan tertulis dari Ketua Dewan Pengawas. Pertanggungjawaban kegiatan wajib disampaikan dalam bentuk laporan perjalanan dinas yang memuat: agenda, temuan, rekomendasi, dan bukti pengeluaran paling lambat 7 hari kerja setelah kembali ke tanah air.',
   text_to_pseudo_embedding('komite audit dewas BPKH Limited KSA approval'),
   '{"regulation_no":"Perdir-12/2024","section":"Pasal 15","topic":"komite_audit_dinas"}'),

  ('Perka BPKH No. 8/2023 tentang Remunerasi dan Tunjangan', 'peraturan',
   'Reimbursement pelatihan dapat diklaim dengan syarat kumulatif: (1) sertifikasi relevan dengan bidang tugas, (2) telah memperoleh persetujuan atasan langsung sebelum mengikuti program, (3) dilampiri sertifikat kelulusan dan bukti pembayaran resmi. Plafon tahunan: Rp 15.000.000 untuk staf dan analis, Rp 25.000.000 untuk kepala divisi, Rp 30.000.000 untuk direktur ke atas. Proses verifikasi dan pencairan 3 sampai 5 hari kerja setelah berkas lengkap diterima oleh Divisi SDM.',
   text_to_pseudo_embedding('reimburse pelatihan 15jt sertifikasi plafon'),
   '{"regulation_no":"Perka-8/2023","section":"Bab IV","topic":"reimburse_pelatihan"}'),

  ('Perka BPKH No. 8/2023 tentang Remunerasi dan Tunjangan', 'peraturan',
   'Zakat profesi dihitung sebesar 2.5 persen dari penghasilan bruto bulanan setelah dikurangi kebutuhan pokok, apabila penghasilan berada di atas nisab (setara 85 gram emas murni per tahun). Potongan zakat bersifat opsional dan disalurkan ke BAZNAS BPKH melalui pemotongan langsung dari payroll. Bukti setor zakat tersedia di menu Zakat pada aplikasi Labbaik HR dan dapat digunakan untuk pengurang pajak penghasilan sesuai ketentuan PPh 21.',
   text_to_pseudo_embedding('zakat profesi 2.5% nisab 85 gram emas BAZNAS'),
   '{"regulation_no":"Perka-8/2023","section":"Pasal 22","topic":"zakat_profesi"}'),

  ('SOP Kepegawaian · Payroll', 'sop',
   'Siklus payroll BPKH berjalan bulanan dengan ketentuan: tanggal cut-off penggajian setiap tanggal 20, tanggal transfer gaji setiap tanggal 25 (atau hari kerja sebelumnya jika jatuh pada weekend atau libur nasional). Slip gaji elektronik tersedia di aplikasi Labbaik HR pada H-1 tanggal transfer. Komponen gaji: gaji pokok, tunjangan jabatan, tunjangan keluarga, tunjangan transport, honorarium rapat, dikurangi PPh 21 (metode TER bulanan), BPJS Kesehatan 1 persen, BPJS Ketenagakerjaan 2 persen, dan zakat profesi 2.5 persen jika di atas nisab.',
   text_to_pseudo_embedding('payroll bulanan cutoff 20 transfer 25 PPh 21 TER'),
   '{"regulation_no":"SOP-PAYROLL-001","section":"Siklus","topic":"payroll_cycle"}'),

  ('SOP Kepegawaian · Payroll', 'sop',
   'Tunjangan Hari Raya (THR) dibayarkan H-7 sebelum Hari Raya Idul Fitri dengan besaran 1 kali gaji bruto bagi pegawai dengan masa kerja lebih dari 12 bulan, dan proporsional bagi pegawai dengan masa kerja kurang dari 12 bulan. Bonus kinerja tahunan dibayarkan pada bulan Januari tahun berjalan berdasarkan nilai KPI tahun sebelumnya, dengan besaran 0.5 hingga 3 kali gaji pokok sesuai grade kinerja.',
   text_to_pseudo_embedding('THR H-7 Idul Fitri bonus kinerja Januari'),
   '{"regulation_no":"SOP-PAYROLL-001","section":"Komponen","topic":"thr_bonus"}'),

  ('SOP Kepegawaian · Cuti', 'sop',
   'Alur persetujuan cuti: (1) Pegawai mengajukan via aplikasi Labbaik HR menu Cuti, (2) Notifikasi otomatis ke atasan langsung, (3) Atasan memberi keputusan approve atau reject dalam 1 x 24 jam kerja, (4) Jika lebih dari 3 hari kerja, persetujuan diteruskan ke Kepala Divisi, (5) Jika cuti khusus (haji, umrah, melahirkan, duka), persetujuan akhir di Direktur SDM. Setiap langkah tercatat otomatis di audit trail ISO 27001 dengan hash chain non-repudiation.',
   text_to_pseudo_embedding('approval cuti berjenjang atasan kepala divisi direktur'),
   '{"regulation_no":"SOP-HR-CUTI-007","section":"Alur","topic":"alur_cuti"}'),

  ('SOP Kepegawaian · Absensi', 'sop',
   'Clock-in wajib dilakukan antara pukul 07.30 hingga 08.30 WIB di lokasi Muamalat Tower Kuningan Jakarta dengan radius geofence 150 meter. Verifikasi menggunakan face recognition dengan skor kecocokan minimum 0.62 dan liveness check melalui deteksi kedipan mata minimum 2 kali. Pegawai yang melakukan clock-in setelah pukul 08.30 tercatat sebagai terlambat dan memengaruhi tunjangan kehadiran. Work from home (WFH) atau dinas luar harus diajukan terlebih dahulu melalui menu Dinas atau WFH untuk mendapatkan clock-in remote.',
   text_to_pseudo_embedding('clock-in 08.30 geofence 150m Muamalat Tower face recognition'),
   '{"regulation_no":"SOP-HR-ABSENSI-004","section":"Clock","topic":"clock_in_rules"}'),

  ('SOP Kepegawaian · Dinas Luar Negeri', 'sop',
   'Untuk dinas luar negeri, pegawai wajib: (1) Mengajukan melalui menu Dinas minimal 14 hari sebelum keberangkatan, (2) Melampirkan TOR kegiatan dan estimasi anggaran, (3) Memastikan paspor berlaku minimal 6 bulan, (4) Untuk KSA, koordinasi dengan BPKH Limited untuk akomodasi dan transportasi lokal, (5) Vaksinasi meningitis dan polio wajib untuk tujuan Makkah dan Madinah. Pencairan uang muka 50 persen saat SPPD diterbitkan, sisanya setelah laporan perjalanan dinas diterima.',
   text_to_pseudo_embedding('dinas luar negeri 14 hari paspor vaksin SPPD'),
   '{"regulation_no":"SOP-DINAS-LN-003","section":"Persiapan","topic":"dinas_ln"}'),

  ('FAQ Kepegawaian', 'faq',
   'Bagaimana cara mengaktifkan face recognition di aplikasi Labbaik HR? Jawab: Buka menu Profil, pilih Enroll Wajah, ikuti petunjuk untuk posisi wajah di tengah frame dengan pencahayaan cukup, aplikasi akan mengambil 3 sampel untuk kualitas optimal. Data wajah diproses secara lokal di perangkat dan hanya vektor embedding (tidak ada foto) yang dikirim ke server. Untuk mengubah enrollment, hubungi Helpdesk SDM di ext. 1212 atau sdm@bpkh.go.id dengan membawa identitas pegawai.',
   text_to_pseudo_embedding('face recognition enroll wajah 3 sampel profil helpdesk'),
   '{"regulation_no":"FAQ-001","section":"Umum","topic":"faq_face"}'),

  ('FAQ Kepegawaian', 'faq',
   'Lembur di BPKH diatur sebagai berikut: maksimal 4 jam per hari dan 14 jam per minggu sesuai UU Ketenagakerjaan. Pengajuan lembur harus disertai TOR kegiatan dan persetujuan atasan langsung sebelum pelaksanaan. Uang lembur: 1.5 kali upah per jam untuk jam pertama, 2 kali upah per jam untuk jam berikutnya pada hari kerja, 2 kali upah per jam untuk hari libur 7 jam pertama lalu 3 kali. Rekap lembur otomatis masuk ke payroll bulanan.',
   text_to_pseudo_embedding('lembur 4 jam perhari 14 jam perminggu 1.5x upah'),
   '{"regulation_no":"FAQ-002","section":"Lembur","topic":"faq_lembur"}')
on conflict do nothing;

-- =====================================================================
-- Verifikasi ingestion
-- =====================================================================
select
  source_kind,
  count(*) as chunks,
  array_agg(distinct metadata->>'topic') as topics
from hr_knowledge_chunks
group by source_kind
order by source_kind;

-- Smoke test: cari chunk paling relevan untuk query "cuti haji"
select
  source_title,
  left(chunk_text, 100) || '...' as preview,
  (1 - (embedding <=> text_to_pseudo_embedding('berapa hari cuti haji saya')))::numeric(4,3) as similarity
from hr_knowledge_chunks
order by embedding <=> text_to_pseudo_embedding('berapa hari cuti haji saya')
limit 3;
