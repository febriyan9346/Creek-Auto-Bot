# Creek Auto Bot

🤖 Automated bot for Creek Protocol on Sui Network Testnet

## Features

- ✅ Auto Swap (USDC ↔ GUSD)
- ✅ Auto Stake/Unstake XAUM
- ✅ Auto Deposit Collateral (GR/SUI)
- ✅ Auto Withdraw Collateral
- ✅ Auto Borrow GUSD
- ✅ Auto Repay GUSD
- ✅ Multi-account support
- ✅ Proxy support (HTTP/HTTPS/SOCKS)
- ✅ Configurable activity parameters
- ✅ Auto-loop every X hours

## Prerequisites

- Node.js v16 or higher
- npm or yarn
- Private keys for Sui wallets
- (Optional) Proxy list

## Installation

1. Clone the repository:
```bash
git clone https://github.com/febriyan9346/Creek-Auto-Bot.git
cd Creek-Auto-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure your files:
   - Add your private keys to `private_keys.txt`
   - (Optional) Add proxies to `proxy.txt`
   - (Optional) Customize settings in `config.json`

## Configuration

### private_keys.txt
Add your Sui private keys (one per line):
```
suiprivkey1xxxxxxxxxxxxxxxxxxxxx
suiprivkey1xxxxxxxxxxxxxxxxxxxxx
```

### proxy.txt (Optional)
Add your proxies (one per line):
```
http://username:password@host:port
socks5://username:password@host:port
http://host:port
```

### config.json (Optional)
Customize bot behavior:
```json
{
  "swapRepetitions": 1,
  "stakeRepetitions": 1,
  "unstakeRepetitions": 1,
  "depositRepetitions": 1,
  "withdrawRepetitions": 1,
  "borrowRepetitions": 1,
  "repayRepetitions": 1,
  "usdcSwapRange": { "min": 1, "max": 2 },
  "gusdSwapRange": { "min": 1, "max": 2 },
  "xaumStakeRange": { "min": 0.01, "max": 0.02 },
  "xaumUnstakeRange": { "min": 0.01, "max": 0.02 },
  "grDepositRange": { "min": 0.1, "max": 0.2 },
  "suiDepositRange": { "min": 0.01, "max": 0.02 },
  "grWithdrawRange": { "min": 0.1, "max": 0.2 },
  "suiWithdrawRange": { "min": 0.01, "max": 0.02 },
  "gusdBorrowRange": { "min": 1, "max": 2 },
  "gusdRepayRange": { "min": 0.5, "max": 1 },
  "loopHours": 24
}
```

## Usage

Start the bot:
```bash
npm start
```

Or using Node directly:
```bash
node index.js
```

## How It Works

The bot will:
1. Load accounts from `private_keys.txt`
2. Load proxies from `proxy.txt` (if available)
3. Load configuration from `config.json` (or use defaults)
4. For each account, perform:
   - Swap operations (USDC ↔ GUSD)
   - Stake XAUM tokens
   - Unstake XAUM tokens
   - Deposit collateral (GR/SUI)
   - Withdraw collateral
   - Borrow GUSD
   - Repay GUSD
5. Wait for configured hours (`loopHours`)
6. Repeat the cycle

## Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `swapRepetitions` | Number of swap operations per cycle | 1 |
| `stakeRepetitions` | Number of stake operations per cycle | 1 |
| `unstakeRepetitions` | Number of unstake operations per cycle | 1 |
| `depositRepetitions` | Number of deposit operations per cycle | 1 |
| `withdrawRepetitions` | Number of withdraw operations per cycle | 1 |
| `borrowRepetitions` | Number of borrow operations per cycle | 1 |
| `repayRepetitions` | Number of repay operations per cycle | 1 |
| `usdcSwapRange` | Amount range for USDC swaps | 1-2 |
| `gusdSwapRange` | Amount range for GUSD swaps | 1-2 |
| `xaumStakeRange` | Amount range for XAUM stakes | 0.01-0.02 |
| `xaumUnstakeRange` | Amount range for XAUM unstakes | 0.01-0.02 |
| `grDepositRange` | Amount range for GR deposits | 0.1-0.2 |
| `suiDepositRange` | Amount range for SUI deposits | 0.01-0.02 |
| `grWithdrawRange` | Amount range for GR withdrawals | 0.1-0.2 |
| `suiWithdrawRange` | Amount range for SUI withdrawals | 0.01-0.02 |
| `gusdBorrowRange` | Amount range for GUSD borrows | 1-2 |
| `gusdRepayRange` | Amount range for GUSD repayments | 0.5-1 |
| `loopHours` | Hours between cycles | 24 |

## Safety Features

- Automatic error handling
- Transaction retry logic
- Balance checks before operations
- Random delays between operations
- Support for multiple accounts with rotation

## Troubleshooting

### "No private keys found"
- Ensure `private_keys.txt` exists and contains valid private keys
- Each private key should be on a separate line

### "RPC request failed"
- Check your internet connection
- Verify proxy configuration (if using proxies)
- Ensure Sui testnet RPC is accessible

### Transaction failures
- Ensure accounts have sufficient balance
- Check if Creek Protocol contracts are accessible
- Review transaction logs for specific error messages

## Disclaimer

⚠️ **This bot is for educational purposes only.**

- Use at your own risk
- Only use on testnet
- Never share your private keys
- Always backup your keys securely
- The developers are not responsible for any loss of funds

## Support

For issues and questions:
- Open an issue on [GitHub](https://github.com/febriyan9346/Creek-Auto-Bot/issues)
- Check existing issues for solutions

## License

MIT License - see LICENSE file for details

## Credits

Developed for Creek Protocol on Sui Network

---

⭐ If you find this bot useful, please give it a star!
