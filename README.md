# Creek Auto Bot 🤖

Bot otomatis untuk berinteraksi dengan protokol Creek di Sui Blockchain Testnet. Bot ini dapat melakukan berbagai aktivitas seperti swap, stake, unstake, deposit, withdraw, borrow, dan repay secara otomatis.

## 🌟 Fitur

- ✅ **Swap Otomatis**: USDC ↔ GUSD
- ✅ **Staking/Unstaking**: Stake dan unstake XAUM
- ✅ **Deposit Collateral**: Deposit GR dan SUI
- ✅ **Withdraw Collateral**: Withdraw GR dan SUI
- ✅ **Borrow**: Pinjam GUSD
- ✅ **Repay**: Bayar kembali pinjaman GUSD
- ✅ **Multi-Account Support**: Jalankan bot untuk banyak akun sekaligus
- ✅ **Proxy Support**: Mendukung HTTP, HTTPS, dan SOCKS proxy
- ✅ **Konfigurasi Fleksibel**: Atur jumlah repetisi dan range untuk setiap aktivitas
- ✅ **Loop Otomatis**: Bot berjalan terus dengan interval yang bisa diatur
- ✅ **Colored Logging**: Log dengan warna untuk kemudahan monitoring

## 📋 Persyaratan

- Node.js v16 atau lebih tinggi
- npm atau yarn
- Private keys wallet Sui
- (Opsional) Proxy untuk multi-akun

## 🚀 Instalasi

1. Clone repository ini:
```bash
git clone https://github.com/febriyan9346/Creek-Auto-Bot.git
cd Creek-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Buat file `private_keys.txt` dan masukkan private keys Anda (satu per baris):
```
your_private_key_1
your_private_key_2
your_private_key_3
```

4. (Opsional) Buat file `proxy.txt` untuk proxy (satu per baris):
```
http://username:password@ip:port
socks5://username:password@ip:port
https://username:password@ip:port
```

5. (Opsional) Buat file `config.json` untuk kustomisasi pengaturan:
```json
{
  "swapRepetitions": 2,
  "stakeRepetitions": 1,
  "unstakeRepetitions": 1,
  "depositRepetitions": 2,
  "withdrawRepetitions": 1,
  "borrowRepetitions": 1,
  "repayRepetitions": 1,
  "usdcSwapRange": { "min": 1, "max": 3 },
  "gusdSwapRange": { "min": 1, "max": 3 },
  "xaumStakeRange": { "min": 0.01, "max": 0.05 },
  "xaumUnstakeRange": { "min": 0.01, "max": 0.03 },
  "grDepositRange": { "min": 0.1, "max": 0.5 },
  "suiDepositRange": { "min": 0.01, "max": 0.05 },
  "grWithdrawRange": { "min": 0.1, "max": 0.3 },
  "suiWithdrawRange": { "min": 0.01, "max": 0.03 },
  "gusdBorrowRange": { "min": 1, "max": 5 },
  "gusdRepayRange": { "min": 0.5, "max": 2 },
  "loopHours": 24
}
```

## 🎮 Cara Menggunakan

Jalankan bot dengan perintah:

```bash
node index.js
```

Bot akan:
1. Memuat konfigurasi dari `config.json` (jika ada)
2. Membaca private keys dari `private_keys.txt`
3. Membaca proxy dari `proxy.txt` (jika ada)
4. Menjalankan semua aktivitas untuk setiap akun secara berurutan
5. Menunggu sesuai `loopHours` yang dikonfigurasi
6. Mengulang proses secara otomatis

## ⚙️ Konfigurasi

### Pengaturan Default

Jika tidak ada file `config.json`, bot akan menggunakan pengaturan default:

| Aktivitas | Repetisi | Range Min | Range Max |
|-----------|----------|-----------|-----------|
| Swap | 1 | 1 | 2 |
| Stake | 1 | 0.01 | 0.02 |
| Unstake | 1 | 0.01 | 0.02 |
| Deposit | 1 | 0.1/0.01 | 0.2/0.02 |
| Withdraw | 1 | 0.1/0.01 | 0.2/0.02 |
| Borrow | 1 | 1 | 2 |
| Repay | 1 | 0.5 | 1 |

**Loop Hours**: 24 jam

### Kustomisasi

Edit file `config.json` untuk mengubah pengaturan:
- `*Repetitions`: Berapa kali aktivitas dijalankan per siklus
- `*Range`: Range jumlah token untuk setiap transaksi (min-max)
- `loopHours`: Interval waktu antar siklus (dalam jam)

## 📊 Urutan Aktivitas

Setiap siklus, bot menjalankan aktivitas dalam urutan berikut:

1. **Swap** (USDC → GUSD, GUSD → USDC)
2. **Stake** (XAUM)
3. **Unstake** (XAUM)
4. **Deposit** (GR & SUI)
5. **Withdraw** (GR & SUI)
6. **Borrow** (GUSD)
7. **Repay** (GUSD)

Setiap aktivitas memiliki delay acak 10-25 detik antar repetisi.

## 🔍 Monitoring

Bot menampilkan log dengan kode warna:
- 🔴 **Merah**: Error
- 🟢 **Hijau**: Success
- 🟡 **Kuning**: Warning/Aktivitas
- 🔵 **Cyan**: Delay
- ⚪ **Putih**: Info

## 🛡️ Keamanan

⚠️ **PENTING**:
- Jangan pernah membagikan private keys Anda
- Simpan file `private_keys.txt` dengan aman
- Jangan commit file yang berisi private keys ke repository publik
- Gunakan testnet untuk percobaan

## 📝 Struktur File

```
Creek-Auto-Bot/
├── index.js              # File utama bot
├── private_keys.txt      # Private keys wallet (buat sendiri)
├── proxy.txt            # Daftar proxy (opsional)
├── config.json          # Konfigurasi bot (opsional)
├── package.json         # Dependencies
└── README.md            # Dokumentasi
```

## 🔧 Dependencies

- `@mysten/sui.js`: SDK untuk interaksi dengan Sui blockchain
- `chalk`: Colored terminal output
- `axios`: HTTP client
- `https-proxy-agent`: HTTP/HTTPS proxy support
- `socks-proxy-agent`: SOCKS proxy support

## ⚠️ Disclaimer

Bot ini dibuat untuk tujuan edukasi dan testing di testnet. Gunakan dengan risiko Anda sendiri. Developer tidak bertanggung jawab atas kerugian yang mungkin terjadi.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat issue atau pull request.

## 📜 Lisensi

MIT License

## 💬 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

**Dibuat dengan ❤️ untuk komunitas Sui & Creek**
