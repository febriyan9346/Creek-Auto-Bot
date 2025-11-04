import chalk from "chalk";
import { SuiClient } from "@mysten/sui.js/client";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography";
import fs from "fs";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import axios from "axios";

const CREEK_RPC_URL = "https://fullnode.testnet.sui.io";
const USDC_TYPE = "0xa03cb0b29e92c6fa9bfb7b9c57ffdba5e23810f20885b4390f724553d32efb8b::usdc::USDC";
const GUSD_TYPE = "0x5434351f2dcae30c0c4b97420475c5edc966b02fd7d0bbe19ea2220d2f623586::coin_gusd::COIN_GUSD";
const XAUM_TYPE = "0xa03cb0b29e92c6fa9bfb7b9c57ffdba5e23810f20885b4390f724553d32efb8b::coin_xaum::COIN_XAUM";
const GR_TYPE = "0x5504354cf3dcbaf64201989bc734e97c1d89bba5c7f01ff2704c43192cc2717c::coin_gr::COIN_GR"; 
const GY_TYPE = "0x0ac2d5ebd2834c0db725eedcc562c60fa8e281b1772493a4d199fd1e70065671::coin_gy::COIN_GY";
const SUI_TYPE = "0x2::sui::SUI";
const MARKET_OBJECT = "0x166dd68901d2cb47b55c7cfbb7182316f84114f9e12da9251fd4c4f338e37f5d";
const USDC_VAULT_OBJECT = "0x1fc1b07f7c1d06d4d8f0b1d0a2977418ad71df0d531c476273a2143dfeffba0e";
const STAKING_MANAGER_OBJECT = "0x5c9d26e8310f740353eac0e67c351f71bad8748cf5ac90305ffd32a5f3326990";
const CLOCK_OBJECT = "0x0000000000000000000000000000000000000000000000000000000000000006";
const PACKAGE_ID = "0x8cee41afab63e559bc236338bfd7c6b2af07c9f28f285fc8246666a7ce9ae97a";
const BORROW_MODULE_NAME = "borrow";
const WITHDRAW_MODULE_NAME = "withdraw_collateral";
const X_ORACLE_OBJECT = "0x9052b77605c1e2796582e996e0ce60e2780c9a440d8878a319fa37c50ca32530";
const RISK_MODEL_OBJECT = "0x3a865c5bc0e47efc505781598396d75b647e4f1218359e89b08682519c3ac060";
const OBLIGATION_KEY_TYPE = `${PACKAGE_ID}::obligation::ObligationKey`;
const RULE_PACKAGE_ID = "0xbd6d8bb7f40ca9921d0c61404cba6dcfa132f184cf8c0f273008a103889eb0e8";
const ORACLE_PACKAGE_ID = "0xca9b2f66c5ab734939e048d0732e2a09f486402bb009d88f95c27abe8a4872ee";
const GR_PRICE = BigInt(150500000000);
const GUSD_PRICE = BigInt(1050000000);
const SUI_PRICE = BigInt(3180000000);
const OBLIGATION_REGISTRY_OBJECT = "0x13f4679d0ebd6fc721875af14ee380f45cde02f81d690809ac543901d66f6758";
const SWAP_MODULE_NAME = "gusd_usdc_vault";
const STAKING_MODULE_NAME = "staking_manager";
const DEPOSIT_MODULE_NAME = "deposit_collateral";
const REPAY_MODULE_NAME = "repay";
const DECIMALS = 9;
const SUI_DECIMALS = 9; 
const CONFIG_FILE = "config.json";
const isDebug = false;

const swapDirections = [
  { from: "USDC", to: "GUSD", coinTypeIn: USDC_TYPE, coinTypeOut: GUSD_TYPE, function: "mint_gusd" },
  { from: "GUSD", to: "USDC", coinTypeIn: GUSD_TYPE, coinTypeOut: USDC_TYPE, function: "redeem_gusd" }
];

// Variabel UI dan Info Wallet disederhanakan
let accounts = [];
let proxies = [];

let dailyActivityConfig = {
  borrowRepetitions: 1,
  gusdBorrowRange: { min: 1, max: 2 },
  withdrawRepetitions: 1,
  grWithdrawRange: { min: 0.1, max: 0.2 },
  suiWithdrawRange: { min: 0.01, max: 0.02 },
  swapRepetitions: 1,
  stakeRepetitions: 1,
  unstakeRepetitions: 1,
  depositRepetitions: 1,
  repayRepetitions: 1,
  usdcSwapRange: { min: 1, max: 2 },
  gusdSwapRange: { min: 1, max: 2 },
  xaumStakeRange: { min: 0.01, max: 0.02 },
  xaumUnstakeRange: { min: 0.01, max: 0.02 },
  grDepositRange: { min: 0.1, max: 0.2 },
  suiDepositRange: { min: 0.01, max: 0.02 },
  gusdRepayRange: { min: 0.5, max: 1 }, 
  loopHours: 24
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      const config = JSON.parse(data);
      dailyActivityConfig.swapRepetitions = Number(config.swapRepetitions) || 1;
      dailyActivityConfig.stakeRepetitions = Number(config.stakeRepetitions) || 1;
      dailyActivityConfig.unstakeRepetitions = Number(config.unstakeRepetitions) || 1;
      dailyActivityConfig.depositRepetitions = Number(config.depositRepetitions) || 1;
      dailyActivityConfig.repayRepetitions = Number(config.repayRepetitions) || 1; 
      dailyActivityConfig.usdcSwapRange.min = Number(config.usdcSwapRange?.min) || 1;
      dailyActivityConfig.usdcSwapRange.max = Number(config.usdcSwapRange?.max) || 2;
      dailyActivityConfig.gusdSwapRange.min = Number(config.gusdSwapRange?.min) || 1;
      dailyActivityConfig.gusdSwapRange.max = Number(config.gusdSwapRange?.max) || 2;
      dailyActivityConfig.xaumStakeRange.min = Number(config.xaumStakeRange?.min) || 0.01;
      dailyActivityConfig.xaumStakeRange.max = Number(config.xaumStakeRange?.max) || 0.02;
      dailyActivityConfig.xaumUnstakeRange.min = Number(config.xaumUnstakeRange?.min) || 0.01;
      dailyActivityConfig.xaumUnstakeRange.max = Number(config.xaumUnstakeRange?.max) || 0.02;
      dailyActivityConfig.grDepositRange.min = Number(config.grDepositRange?.min) || 0.1;
      dailyActivityConfig.grDepositRange.max = Number(config.grDepositRange?.max) || 0.2; 
      dailyActivityConfig.suiDepositRange.min = Number(config.suiDepositRange?.min) || 0.01;
      dailyActivityConfig.suiDepositRange.max = Number(config.suiDepositRange?.max) || 0.02;
      dailyActivityConfig.gusdRepayRange.min = Number(config.gusdRepayRange?.min) || 0.5;
      dailyActivityConfig.gusdRepayRange.max = Number(config.gusdRepayRange?.max) || 1; 
      dailyActivityConfig.withdrawRepetitions = Number(config.withdrawRepetitions) || 1;
      dailyActivityConfig.grWithdrawRange.min = Number(config.grWithdrawRange?.min) || 0.1;
      dailyActivityConfig.grWithdrawRange.max = Number(config.grWithdrawRange?.max) || 0.2;
      dailyActivityConfig.suiWithdrawRange.min = Number(config.suiWithdrawRange?.min) || 0.01;
      dailyActivityConfig.suiWithdrawRange.max = Number(config.suiWithdrawRange?.max) || 0.02;
      dailyActivityConfig.borrowRepetitions = Number(config.borrowRepetitions) || 1;
      dailyActivityConfig.gusdBorrowRange.min = Number(config.gusdBorrowRange?.min) || 1;
      dailyActivityConfig.gusdBorrowRange.max = Number(config.gusdBorrowRange?.max) || 2;
      dailyActivityConfig.loopHours = Number(config.loopHours) || 24;
    } else {
      addLog("No config file found, using default settings.", "info");
    }
  } catch (error) {
    addLog(`Failed to load config: ${error.message}`, "error");
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(dailyActivityConfig, null, 2));
    addLog("Configuration saved successfully.", "success");
  } catch (error) {
    addLog(`Failed to save config: ${error.message}`, "error");
  }
}

process.on("unhandledRejection", (reason) => {
  addLog(`Unhandled Rejection: ${reason.message || reason}`, "error");
});

process.on("uncaughtException", (error) => {
  addLog(`Uncaught Exception: ${error.message}\n${error.stack}`, "error");
  process.exit(1);
});

function getShortAddress(address) {
  return address ? address.slice(0, 6) + "..." + address.slice(-4) : "N/A";
}

// Fungsi addLog disederhanakan untuk console.log
function addLog(message, type = "info") {
  if (type === "debug" && !isDebug) return;
  const timestamp = new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" });
  let coloredMessage;
  switch (type) {
    case "error":
      coloredMessage = chalk.redBright(message);
      break;
    case "success":
      coloredMessage = chalk.greenBright(message);
      break;
    case "warn":
      coloredMessage = chalk.magentaBright(message);
      break;
    case "wait":
      coloredMessage = chalk.yellowBright(message);
      break;
    case "info":
      coloredMessage = chalk.whiteBright(message);
      break;
    case "delay":
      coloredMessage = chalk.cyanBright(message);
      break;
    case "debug":
      coloredMessage = chalk.blueBright(message);
      break;
    default:
      coloredMessage = chalk.white(message);
  }
  const logMessage = `[${timestamp}] ${coloredMessage}`;
  console.log(logMessage); // Langsung cetak ke konsol
}

function getShortHash(hash) {
  return hash.slice(0, 6) + "..." + hash.slice(-4);
}

// clearTransactionLogs() dihapus

function loadAccounts() {
  try {
    const data = fs.readFileSync("private_keys.txt", "utf8"); // <-- DIUBAH
    accounts = data.split("\n").map(line => line.trim()).filter(line => line).map(privateKey => ({ privateKey }));
    if (accounts.length === 0) {
      throw new Error("No private keys found in private_keys.txt"); // <-- DIUBAH
    }
    addLog(`Loaded ${accounts.length} accounts from private_keys.txt`, "success"); // <-- DIUBAH
  } catch (error) {
    addLog(`Failed to load accounts: ${error.message}`, "error");
    accounts = [];
  }
}

function loadProxies() {
  try {
    if (fs.existsSync("proxy.txt")) {
      const data = fs.readFileSync("proxy.txt", "utf8");
      proxies = data.split("\n").map(proxy => proxy.trim()).filter(proxy => proxy);
      if (proxies.length === 0) throw new Error("No proxy found in proxy.txt");
      addLog(`Loaded ${proxies.length} proxies from proxy.txt`, "success");
    } else {
      addLog("No proxy.txt found, running without proxy.", "info");
    }
  } catch (error) {
    addLog(`Failed to load proxy: ${error.message}`, "info");
    proxies = [];
  }
}

function createAgent(proxyUrl) {
  if (!proxyUrl) return null;
  if (proxyUrl.startsWith("socks")) {
    return new SocksProxyAgent(proxyUrl);
  } else {
    return new HttpsProxyAgent(proxyUrl);
  }
}

function getClient(proxyUrl) {
  const transport = {
    async request(rpcRequest) {
      try {
        const fullRequest = {
          jsonrpc: "2.0",
          id: Math.floor(Math.random() * 100000),
          method: rpcRequest.method,
          params: rpcRequest.params
        };
        const agent = createAgent(proxyUrl);
        const config = agent ? { httpsAgent: agent } : {};
        if (isDebug) {
          addLog(`Debug: Sending RPC request: ${JSON.stringify(fullRequest)}`, "debug");
        }
        const response = await axios.post(CREEK_RPC_URL, fullRequest, config);

        if (isDebug) {
          addLog(`Debug: Raw RPC response: ${JSON.stringify(response.data)}`, "debug");
        }
        return response.data && response.data.result ? response.data.result : response.data;
      } catch (error) {
        addLog(`RPC request failed: ${error.message}`, "error");
        throw error;
      }
    }
  };
  return new SuiClient({ url: CREEK_RPC_URL, transport });
}

// Fungsi sleep disederhanakan
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBalance(totalBalance, decimals) {
  try {
    if (totalBalance == null) return '0.0000';
    const bigBalance = BigInt(totalBalance.toString());
    const divisor = BigInt(10) ** BigInt(decimals);
    const integer = bigBalance / divisor;
    const fraction = ((bigBalance % divisor) * (BigInt(10) ** BigInt(4))) / divisor;
    const formattedFraction = fraction.toString().padStart(4, '0');
    return `${integer.toString()}.${formattedFraction}`;
  } catch (err) {
    addLog(`formatBalance error: ${err.message}`, "debug");
    return '0.0000';
  }
}

// fungsi updateWalletData() dihapus karena untuk UI

async function performSwap(keypair, direction, amount, proxyUrl) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid amount");
  const amountIn = BigInt(Math.round(amountNum * Math.pow(10, DECIMALS)));

  const coinsResp = await client.getCoins({ owner: address, coinType: direction.coinTypeIn });
  const coins = Array.isArray(coinsResp?.data) ? coinsResp.data : [];
  if (coins.length === 0) throw new Error(`No ${direction.from} coins found`);

  const coinIds = coins.map(c => c.coinObjectId);
  const [primaryId, ...otherIds] = coinIds;
  const chosen = coinIds.find(id => {
    const c = coins.find(x => x.coinObjectId === id);
    const bal = c?.balance ?? c?.totalBalance ?? null;
    return bal != null && BigInt(bal) >= amountIn;
  }) ?? primaryId;

  const tx = new TransactionBlock();
  if (otherIds.length > 0) {
    const othersToMerge = coinIds.filter(id => id !== chosen);
    if (othersToMerge.length > 0) tx.mergeCoins(tx.object(chosen), othersToMerge.map(id => tx.object(id)));
  }
  const splitResult = tx.splitCoins(tx.object(chosen), [tx.pure(amountIn)]);
  const target = `${PACKAGE_ID}::${SWAP_MODULE_NAME}::${direction.function}`;
  if (direction.from === "USDC") {
    tx.moveCall({
      target,
      arguments: [ tx.object(USDC_VAULT_OBJECT), tx.object(MARKET_OBJECT), splitResult, tx.object(CLOCK_OBJECT) ]
    });
  } else {
    tx.moveCall({
      target,
      arguments: [ tx.object(USDC_VAULT_OBJECT), tx.object(MARKET_OBJECT), splitResult ]
    });
  }

  if (typeof isDebug !== "undefined" && isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Swap Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }

  if (sendResult?.effects) {
    addLog(`Result.effects (local): ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Swap Successfully!, Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Transaction failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Transaction failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling");
  }

  addLog(`Receipt effects: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Transaction effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Transaction failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Swap ${amount} ${direction.from} ➯ ${direction.to} Successfully, Hash: ${getShortHash(digest)}`, "success");
  return receipt;
}

async function performStake(keypair, amount, proxyUrl) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid stake amount");
  const amountIn = BigInt(Math.round(amountNum * Math.pow(10, DECIMALS)));

  const xaumBalance = await client.getBalance({ owner: address, coinType: XAUM_TYPE });
  const formattedXAUM = formatBalance(xaumBalance.totalBalance, DECIMALS);
  addLog(`Current XAUM Balance: ${formattedXAUM} XAUM`, "info");

  const coinsResp = await client.getCoins({ owner: address, coinType: XAUM_TYPE });
  const coins = Array.isArray(coinsResp?.data) ? coinsResp.data : [];
  if (coins.length === 0) throw new Error("No XAUM coins found");

  const coinIds = coins.map(c => c.coinObjectId);
  const [primaryId, ...otherIds] = coinIds;
  const chosen = coinIds.find(id => {
    const c = coins.find(x => x.coinObjectId === id);
    const bal = c?.balance ?? c?.totalBalance ?? null;
    return bal != null && BigInt(bal) >= amountIn;
  }) ?? primaryId;

  const tx = new TransactionBlock();
  if (otherIds.length > 0) {
    const othersToMerge = coinIds.filter(id => id !== chosen);
    if (othersToMerge.length > 0) tx.mergeCoins(tx.object(chosen), othersToMerge.map(id => tx.object(id)));
  }
  const splitResult = tx.splitCoins(tx.object(chosen), [tx.pure(amountIn)]);

  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE_NAME}::stake_xaum`,
    arguments: [tx.object(STAKING_MANAGER_OBJECT), splitResult]
  });

  if (isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect for stake: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error for stake: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Stake Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error for stake: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail for stake: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }

  if (sendResult?.effects) {
    addLog(`Result.effects (local) for stake: ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Stake Successfully , Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Stake failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Stake failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed for stake: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error for stake: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch stake transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling for stake");
  }

  addLog(`Receipt effects for stake: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Stake effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt for stake: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Stake failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Stake ${amount} XAUM Successfully, Hash ${getShortHash(digest)}`, "success");
  return receipt;
}

async function performUnstake(keypair, amount, proxyUrl) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid unstake amount");
  const grGyAmountIn = BigInt(Math.round(amountNum * 100 * Math.pow(10, DECIMALS)));

  const grBalance = await client.getBalance({ owner: address, coinType: GR_TYPE });
  const gyBalance = await client.getBalance({ owner: address, coinType: GY_TYPE });
  const formattedGR = parseFloat(formatBalance(grBalance.totalBalance, DECIMALS));
  const formattedGY = parseFloat(formatBalance(gyBalance.totalBalance, DECIMALS));
  const maxUnstake = Math.min(formattedGR / 100, formattedGY / 100);
  addLog(`Max XAUM that can be unstaked: ${maxUnstake.toFixed(4)} XAUM`, "info");

  if (amountNum > maxUnstake) {
    throw new Error(`Insufficient GR/GY for unstaking ${amount} XAUM. Max: ${maxUnstake.toFixed(4)} XAUM`);
  }
  const grCoinsResp = await client.getCoins({ owner: address, coinType: GR_TYPE });
  const grCoins = Array.isArray(grCoinsResp?.data) ? grCoinsResp.data : [];
  if (grCoins.length === 0) throw new Error("No GR coins found");

  const grCoinIds = grCoins.map(c => c.coinObjectId);
  const [grPrimaryId, ...grOtherIds] = grCoinIds;
  const grChosen = grCoinIds.find(id => {
    const c = grCoins.find(x => x.coinObjectId === id);
    const bal = c?.balance ?? c?.totalBalance ?? null;
    return bal != null && BigInt(bal) >= grGyAmountIn;
  }) ?? grPrimaryId;
  const gyCoinsResp = await client.getCoins({ owner: address, coinType: GY_TYPE });
  const gyCoins = Array.isArray(gyCoinsResp?.data) ? gyCoinsResp.data : [];
  if (gyCoins.length === 0) throw new Error("No GY coins found");

  const gyCoinIds = gyCoins.map(c => c.coinObjectId);
  const [gyPrimaryId, ...gyOtherIds] = gyCoinIds;
  const gyChosen = gyCoinIds.find(id => {
    const c = gyCoins.find(x => x.coinObjectId === id);
    const bal = c?.balance ?? c?.totalBalance ?? null;
    return bal != null && BigInt(bal) >= grGyAmountIn;
  }) ?? gyPrimaryId;

  const tx = new TransactionBlock();
  if (grOtherIds.length > 0) {
    const grOthersToMerge = grCoinIds.filter(id => id !== grChosen);
    if (grOthersToMerge.length > 0) tx.mergeCoins(tx.object(grChosen), grOthersToMerge.map(id => tx.object(id)));
  }
  const grSplitResult = tx.splitCoins(tx.object(grChosen), [tx.pure(grGyAmountIn)]);
  if (gyOtherIds.length > 0) {
    const gyOthersToMerge = gyCoinIds.filter(id => id !== gyChosen);
    if (gyOthersToMerge.length > 0) tx.mergeCoins(tx.object(gyChosen), gyOthersToMerge.map(id => tx.object(id)));
  }
  const gySplitResult = tx.splitCoins(tx.object(gyChosen), [tx.pure(grGyAmountIn)]);
  tx.moveCall({
    target: `${PACKAGE_ID}::${STAKING_MODULE_NAME}::unstake`,
    arguments: [tx.object(STAKING_MANAGER_OBJECT), grSplitResult, gySplitResult]
  });

  if (isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect for unstake: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error for unstake: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Unstake Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error for unstake: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail for unstake: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }

  if (sendResult?.effects) {
    addLog(`Result.effects (local) for unstake: ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Unstake Successfully , Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Unstake failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Unstake failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed for unstake: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error for unstake: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch unstake transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling for unstake");
  }

  addLog(`Receipt effects for unstake: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Unstake effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt for unstake: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Unstake failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Unstake ${amount} XAUM Successfully, Hash ${getShortHash(digest)}`, "success");
  return receipt;
}

async function performDeposit(keypair, amount, proxyUrl, coinType, typeArg, coinName) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid deposit amount");
  const amountIn = BigInt(Math.round(amountNum * Math.pow(10, DECIMALS)));

  const balance = await client.getBalance({ owner: address, coinType });
  const formattedBalance = formatBalance(balance.totalBalance, DECIMALS);
  addLog(`Current ${coinName} Balance: ${formattedBalance} ${coinName}`, "info");

  const { obligationId } = await getObligationDetails(client, address, keypair, proxyUrl);

  const tx = new TransactionBlock();

  let splitResult;
  if (coinType === SUI_TYPE) {
    const coinsResp = await client.getCoins({ owner: address, coinType: SUI_TYPE });
    const coins = Array.isArray(coinsResp?.data) ? coinsResp.data : [];
    if (coins.length === 0) throw new Error("No SUI coins found");

    const otherIds = coins.map(c => c.coinObjectId).filter(id => id !== coins[0].coinObjectId); 
    if (otherIds.length > 0) {
      tx.mergeCoins(tx.gas, otherIds.map(id => tx.object(id)));
    }
    splitResult = tx.splitCoins(tx.gas, [tx.pure(amountIn)]);
  } else {
    const coinsResp = await client.getCoins({ owner: address, coinType });
    const coins = Array.isArray(coinsResp?.data) ? coinsResp.data : [];
    if (coins.length === 0) throw new Error(`No ${coinName} coins found`);

    const coinIds = coins.map(c => c.coinObjectId);
    const [primaryId, ...otherIds] = coinIds;
    const chosen = coinIds.find(id => {
      const c = coins.find(x => x.coinObjectId === id);
      const bal = c?.balance ?? c?.totalBalance ?? null;
      return bal != null && BigInt(bal) >= amountIn;
    }) ?? primaryId;

    if (otherIds.length > 0) {
      const othersToMerge = coinIds.filter(id => id !== chosen);
      if (othersToMerge.length > 0) tx.mergeCoins(tx.object(chosen), othersToMerge.map(id => tx.object(id)));
    }
    splitResult = tx.splitCoins(tx.object(chosen), [tx.pure(amountIn)]);
  }

  tx.moveCall({
    target: `${PACKAGE_ID}::${DEPOSIT_MODULE_NAME}::deposit_collateral`,
    arguments: [tx.object(OBLIGATION_REGISTRY_OBJECT), tx.object(obligationId), tx.object(MARKET_OBJECT), splitResult],
    typeArguments: [typeArg]
  });

  if (isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect for deposit: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error for deposit: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Deposit Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error for deposit: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail for deposit: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }

  if (sendResult?.effects) {
    addLog(`Result.effects (local) for deposit: ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Deposit Successfully, Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Deposit failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Deposit failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed for deposit: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error for deposit: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch deposit transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling for deposit");
  }

  addLog(`Receipt effects for deposit: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Deposit effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt for deposit: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Deposit failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Deposit ${amount} ${coinName} Successfully, Hash ${getShortHash(digest)}`, "success");
  return receipt;
}

async function performWithdraw(keypair, amount, proxyUrl, coinType, typeArg, coinName) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid withdraw amount");
  const amountIn = BigInt(Math.round(amountNum * Math.pow(10, DECIMALS)));
  const balance = await client.getBalance({ owner: address, coinType });
  const formattedBalance = formatBalance(balance.totalBalance, DECIMALS);
  const { obligationKeyId, obligationKeyVersion, obligationKeyDigest, obligationId } = await getObligationDetails(client, address, keypair, proxyUrl);

  const tx = new TransactionBlock();
  const grUpdateReq = tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT)],
    typeArguments: [GR_TYPE]
  });
  tx.moveCall({
    target: `${RULE_PACKAGE_ID}::rule::set_price_as_primary`,
    arguments: [grUpdateReq, tx.pure.u64(GR_PRICE), tx.object(CLOCK_OBJECT)],
    typeArguments: [GR_TYPE]
  });
  tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::confirm_price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT), grUpdateReq, tx.object(CLOCK_OBJECT)],
    typeArguments: [GR_TYPE]
  });

  const gusdUpdateReq = tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT)],
    typeArguments: [GUSD_TYPE]
  });
  tx.moveCall({
    target: `${RULE_PACKAGE_ID}::rule::set_price_as_primary`,
    arguments: [gusdUpdateReq, tx.pure.u64(GUSD_PRICE), tx.object(CLOCK_OBJECT)],
    typeArguments: [GUSD_TYPE]
  });
  tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::confirm_price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT), gusdUpdateReq, tx.object(CLOCK_OBJECT)],
    typeArguments: [GUSD_TYPE]
  });

  const suiUpdateReq = tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT)],
    typeArguments: [SUI_TYPE]
  });
  tx.moveCall({
    target: `${RULE_PACKAGE_ID}::rule::set_price_as_primary`,
    arguments: [suiUpdateReq, tx.pure.u64(SUI_PRICE), tx.object(CLOCK_OBJECT)],
    typeArguments: [SUI_TYPE]
  });
  tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::confirm_price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT), suiUpdateReq, tx.object(CLOCK_OBJECT)],
    typeArguments: [SUI_TYPE]
  });

  tx.moveCall({
    target: `${PACKAGE_ID}::${WITHDRAW_MODULE_NAME}::withdraw_collateral_entry`,
    arguments: [
      tx.object(OBLIGATION_REGISTRY_OBJECT),
      tx.object(obligationId),
      tx.objectRef({ objectId: obligationKeyId, version: obligationKeyVersion, digest: obligationKeyDigest }),
      tx.object(MARKET_OBJECT),
      tx.object(RISK_MODEL_OBJECT),
      tx.pure.u64(amountIn),
      tx.object(X_ORACLE_OBJECT),
      tx.object(CLOCK_OBJECT)
    ],
    typeArguments: [typeArg]
  });

  if (isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect for withdraw: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error for withdraw: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Withdraw Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error for withdraw: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail for withdraw: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }
  if (sendResult?.effects) {
    addLog(`Result.effects (local) for withdraw: ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Withdraw Successfully , Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Withdraw failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Withdraw failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed for withdraw: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error for withdraw: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch withdraw transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling for withdraw");
  }

  addLog(`Receipt effects for withdraw: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Withdraw effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt for withdraw: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Withdraw failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Withdraw ${amount} ${coinName} Successfully, Hash ${getShortHash(digest)}`, "success");
  return receipt;
}

async function getObligationDetails(client, address, keypair, proxyUrl) {
  let objects = await client.getOwnedObjects({
    owner: address,
    filter: { StructType: OBLIGATION_KEY_TYPE },
    options: { showContent: true, showType: true, showPreviousTransaction: true }
  });
  let obligationKeyData = objects.data || [];
  if (obligationKeyData.length === 0) {
    addLog(`No ObligationKey found for address ${address}. Creating new obligation.`, "info");
    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${PACKAGE_ID}::obligation_registry::create_obligation`,
      arguments: [tx.object(OBLIGATION_REGISTRY_OBJECT)]
    });
    let sendResult;
    try {
      sendResult = await client.signAndExecuteTransactionBlock({
        signer: keypair,
        transactionBlock: tx,
        options: { showEffects: true }
      });
      addLog(`Create obligation transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
    } catch (err) {
      addLog(`signAndExecute error for create obligation: ${err.message}`, "error");
      throw err;
    }

    await sleep(5000);

    objects = await client.getOwnedObjects({
      owner: address,
      filter: { StructType: OBLIGATION_KEY_TYPE },
      options: { showContent: true, showType: true, showPreviousTransaction: true }
    });
    obligationKeyData = objects.data || [];
    if (obligationKeyData.length === 0) throw new Error("Failed to create ObligationKey");
  }

  const keyObject = obligationKeyData[0].data;
  const obligationKeyId = keyObject.objectId;
  const obligationKeyVersion = keyObject.version;
  const obligationKeyDigest = keyObject.digest;
  const fields = keyObject.content.fields;
  const obligationId = fields.ownership.fields.of;

  return { obligationKeyId, obligationKeyVersion, obligationKeyDigest, obligationId };
}

async function performBorrow(keypair, amount, proxyUrl) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid borrow amount");
  const amountIn = BigInt(Math.round(amountNum * Math.pow(10, DECIMALS)));
  const { obligationKeyId, obligationKeyVersion, obligationKeyDigest, obligationId } = await getObligationDetails(client, address, keypair, proxyUrl);

  const tx = new TransactionBlock();
  const grUpdateReq = tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT)],
    typeArguments: [GR_TYPE]
  });
  tx.moveCall({
    target: `${RULE_PACKAGE_ID}::rule::set_price_as_primary`,
    arguments: [grUpdateReq, tx.pure.u64(GR_PRICE), tx.object(CLOCK_OBJECT)],
    typeArguments: [GR_TYPE]
  });
  tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::confirm_price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT), grUpdateReq, tx.object(CLOCK_OBJECT)],
    typeArguments: [GR_TYPE]
  });

  const suiUpdateReq = tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT)],
    typeArguments: [SUI_TYPE]
  });
  tx.moveCall({
    target: `${RULE_PACKAGE_ID}::rule::set_price_as_primary`,
    arguments: [suiUpdateReq, tx.pure.u64(SUI_PRICE), tx.object(CLOCK_OBJECT)],
    typeArguments: [SUI_TYPE]
  });
  tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::confirm_price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT), suiUpdateReq, tx.object(CLOCK_OBJECT)],
    typeArguments: [SUI_TYPE]
  });

  const gusdUpdateReq = tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT)],
    typeArguments: [GUSD_TYPE]
  });
  tx.moveCall({
    target: `${RULE_PACKAGE_ID}::rule::set_price_as_primary`,
    arguments: [gusdUpdateReq, tx.pure.u64(GUSD_PRICE), tx.object(CLOCK_OBJECT)],
    typeArguments: [GUSD_TYPE]
  });
  tx.moveCall({
    target: `${ORACLE_PACKAGE_ID}::x_oracle::confirm_price_update_request`,
    arguments: [tx.object(X_ORACLE_OBJECT), gusdUpdateReq, tx.object(CLOCK_OBJECT)],
    typeArguments: [GUSD_TYPE]
  });
  tx.moveCall({
    target: `${PACKAGE_ID}::${BORROW_MODULE_NAME}::borrow_entry`,
    arguments: [
      tx.object(OBLIGATION_REGISTRY_OBJECT),
      tx.object(obligationId),
      tx.objectRef({ objectId: obligationKeyId, version: obligationKeyVersion, digest: obligationKeyDigest }),
      tx.object(MARKET_OBJECT),
      tx.object(RISK_MODEL_OBJECT),
      tx.pure.u64(amountIn),
      tx.object(X_ORACLE_OBJECT),
      tx.object(CLOCK_OBJECT)
    ]
  });

  if (isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect for borrow: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error for borrow: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Borrow Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error for borrow: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail for borrow: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }

  if (sendResult?.effects) {
    addLog(`Result.effects (local) for borrow: ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Borrow Successfully, Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Borrow failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Borrow failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed for borrow: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error for borrow: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch borrow transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling for borrow");
  }

  addLog(`Receipt effects for borrow: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Borrow effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt for borrow: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Borrow failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Borrow ${amount} GUSD Successfully, Hash ${getShortHash(digest)}`, "success");
  return receipt;
}

async function performRepay(keypair, amount, proxyUrl) {
  const client = getClient(proxyUrl);
  const address = keypair.toSuiAddress();

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) throw new Error("Invalid repay amount");
  const amountIn = BigInt(Math.round(amountNum * Math.pow(10, DECIMALS)));
  const gusdBalance = await client.getBalance({ owner: address, coinType: GUSD_TYPE });
  const formattedGUSD = formatBalance(gusdBalance.totalBalance, DECIMALS);
  addLog(`Current GUSD Balance: ${formattedGUSD} GUSD`, "info");
  const { obligationId } = await getObligationDetails(client, address, keypair, proxyUrl);
  const gusdCoinsResp = await client.getCoins({ owner: address, coinType: GUSD_TYPE });
  const gusdCoins = Array.isArray(gusdCoinsResp?.data) ? gusdCoinsResp.data : [];
  if (gusdCoins.length === 0) throw new Error("No GUSD coins found");

  const gusdCoinIds = gusdCoins.map(c => c.coinObjectId);
  const [gusdPrimaryId, ...gusdOtherIds] = gusdCoinIds;
  const gusdChosen = gusdCoinIds.find(id => {
    const c = gusdCoins.find(x => x.coinObjectId === id);
    const bal = c?.balance ?? c?.totalBalance ?? null;
    return bal != null && BigInt(bal) >= amountIn;
  }) ?? gusdPrimaryId;

  const tx = new TransactionBlock();

  if (gusdOtherIds.length > 0) {
    const gusdOthersToMerge = gusdCoinIds.filter(id => id !== gusdChosen);
    if (gusdOthersToMerge.length > 0) tx.mergeCoins(tx.object(gusdChosen), gusdOthersToMerge.map(id => tx.object(id)));
  }
  const gusdSplitResult = tx.splitCoins(tx.object(gusdChosen), [tx.pure(amountIn)]);

  tx.moveCall({
    target: `${PACKAGE_ID}::${REPAY_MODULE_NAME}::repay`,
    arguments: [
      tx.object(OBLIGATION_REGISTRY_OBJECT),
      tx.object(obligationId),
      tx.object(MARKET_OBJECT),
      gusdSplitResult,
      tx.object(CLOCK_OBJECT)
    ],
    typeArguments: [GUSD_TYPE]
  });

  if (isDebug) {
    try {
      const inspect = await client.devInspectTransactionBlock({ transactionBlock: tx, sender: address });
      addLog(`DevInspect for repay: ${JSON.stringify(inspect)}`, "debug");
    } catch (e) {
      addLog(`DevInspect error for repay: ${e.message}`, "debug");
    }
  }

  let sendResult;
  try {
    sendResult = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    });
    addLog(`Repay Transaction sent: ${getShortHash(sendResult.digest)}`, "warn");
  } catch (err) {
    addLog(`signAndExecute error for repay: ${err.message}`, "error");
    if (err.response) addLog(`RPC error detail for repay: ${JSON.stringify(err.response.data)}`, "debug");
    throw err;
  }

  if (sendResult?.effects) {
    addLog(`Result.effects (local) for repay: ${JSON.stringify(sendResult.effects)}`, "debug");
    const status = sendResult.effects?.status?.status ?? sendResult.effects?.status;
    if (status === "success" || status === "ok") {
      addLog(`Repay Successfully , Hash: ${getShortHash(sendResult.digest)}`, "success");
      return sendResult;
    } else {
      addLog(`Repay failed according to local effects: ${JSON.stringify(sendResult.effects?.status)}`, "error");
      throw new Error("Repay failed according to local effects");
    }
  }

  const digest = sendResult.digest;
  const maxAttempts = 10;
  const delayMs = 1000;
  let receipt = null;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      try {
        receipt = await client.waitForTransactionBlock({ digest, timeout: 5000 });
      } catch (e) {
        receipt = await client.getTransactionBlock({ digest, options: { showEffects: true, showEvents: true } });
      }
      if (receipt) break;
    } catch (err) {
      addLog(`Debug: polling attempt ${i+1}/${maxAttempts} failed for repay: ${err?.message ?? err}`, "debug");
      if (err && typeof err === 'object' && err.code && err.code !== -32602) {
        addLog(`RPC returned non-404 error for repay: ${JSON.stringify(err)}`, "debug");
      }
      await sleep(delayMs);
    }
  }

  if (!receipt) {
    addLog(`Could not fetch repay transaction receipt after ${maxAttempts} attempts. Digest: ${digest}`, "error");
    throw new Error("No receipt found after polling for repay");
  }

  addLog(`Receipt effects for repay: ${JSON.stringify(receipt.effects ?? receipt)}`, "debug");
  const status = (receipt.effects?.status?.status) ?? (receipt.effects?.status ?? null);
  if (status !== "success") {
    const errMsg = receipt.effects?.status?.error ?? null;
    addLog(`Repay effects indicate failure. Error: ${errMsg}`, "error");
    addLog(`Full receipt for repay: ${JSON.stringify(receipt)}`, "debug");
    throw new Error(`Repay failed: ${errMsg ?? "no error message in effects"}`);
  }

  addLog(`Repay ${amount} GUSD Successfully, Hash ${getShortHash(digest)}`, "success");
  return receipt;
}

async function runDailyActivity() {
  if (accounts.length === 0) {
    addLog("No valid accounts found.", "error");
    return;
  }
  addLog(`Starting daily activity for all accounts. Auto Swap: ${dailyActivityConfig.swapRepetitions}x | Auto Stake: ${dailyActivityConfig.stakeRepetitions}x | Auto Unstake: ${dailyActivityConfig.unstakeRepetitions}x | Auto Deposit: ${dailyActivityConfig.depositRepetitions}x | Auto Withdraw: ${dailyActivityConfig.withdrawRepetitions}x | Auto Borrow: ${dailyActivityConfig.borrowRepetitions}x | Auto Repay: ${dailyActivityConfig.repayRepetitions}x`, "info");
  
  try {
    for (let accountIndex = 0; accountIndex < accounts.length; accountIndex++) {
      addLog(`Starting processing for account ${accountIndex + 1}`, "info");
      const proxyUrl = proxies[accountIndex % proxies.length] || null;
      addLog(`Account ${accountIndex + 1}: Using Proxy ${proxyUrl || "none"}`, "info");
      const { secretKey } = decodeSuiPrivateKey(accounts[accountIndex].privateKey);
      const keypair = Ed25519Keypair.fromSecretKey(secretKey);
      const address = keypair.toSuiAddress();
      const client = getClient(proxyUrl);
      if (!address.startsWith("0x")) {
        addLog(`Invalid wallet address for account ${accountIndex + 1}: ${address}`, "error");
        continue;
      }
      addLog(`Processing account ${accountIndex + 1}: ${getShortAddress(address)}`, "wait");

      let directionIndex = 0;
      for (let swapCount = 0; swapCount < dailyActivityConfig.swapRepetitions; swapCount++) {
        const currentDirection = swapDirections[directionIndex % swapDirections.length];
        let amount;
        if (currentDirection.from === "USDC") {
          amount = (Math.random() * (dailyActivityConfig.usdcSwapRange.max - dailyActivityConfig.usdcSwapRange.min) + dailyActivityConfig.usdcSwapRange.min).toFixed(3);
        } else if (currentDirection.from === "GUSD") {
          amount = (Math.random() * (dailyActivityConfig.gusdSwapRange.max - dailyActivityConfig.gusdSwapRange.min) + dailyActivityConfig.gusdSwapRange.min).toFixed(3);
        }
        addLog(`Account ${accountIndex + 1} - Swap ${swapCount + 1}: ${amount} ${currentDirection.from} ➯ ${currentDirection.to}`, "warn");
        try {
          await performSwap(keypair, currentDirection, amount, proxyUrl);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Swap ${swapCount + 1} (${currentDirection.from} ➯ ${currentDirection.to}): Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        directionIndex++;

        if (swapCount < dailyActivityConfig.swapRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next swap...`, "delay");
          await sleep(randomDelay);
        }
      }

      addLog(`Account ${accountIndex + 1} - Waiting 10 seconds before starting staking...`, "delay");
      await sleep(10000);

      for (let stakeCount = 0; stakeCount < dailyActivityConfig.stakeRepetitions; stakeCount++) {
        const stakeAmount = (Math.random() * (dailyActivityConfig.xaumStakeRange.max - dailyActivityConfig.xaumStakeRange.min) + dailyActivityConfig.xaumStakeRange.min).toFixed(4);
        addLog(`Account ${accountIndex + 1} - Stake ${stakeCount + 1}: ${stakeAmount} XAUM`, "warn");
        try {
          await performStake(keypair, stakeAmount, proxyUrl);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Stake ${stakeCount + 1}: Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        if (stakeCount < dailyActivityConfig.stakeRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next stake...`, "delay");
          await sleep(randomDelay);
        }
      }

      addLog(`Account ${accountIndex + 1} - Waiting 10 seconds before starting unstaking...`, "delay");
      await sleep(10000);

      for (let unstakeCount = 0; unstakeCount < dailyActivityConfig.unstakeRepetitions; unstakeCount++) {
        const unstakeAmount = (Math.random() * (dailyActivityConfig.xaumUnstakeRange.max - dailyActivityConfig.xaumUnstakeRange.min) + dailyActivityConfig.xaumUnstakeRange.min).toFixed(4);
        addLog(`Account ${accountIndex + 1} - Unstake ${unstakeCount + 1}: ${unstakeAmount} XAUM`, "warn");
        try {
          await performUnstake(keypair, unstakeAmount, proxyUrl);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Unstake ${unstakeCount + 1}: Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        if (unstakeCount < dailyActivityConfig.unstakeRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next unstake...`, "delay");
          await sleep(randomDelay);
        }
      }

      addLog(`Account ${accountIndex + 1} - Waiting 10 seconds before starting depositing...`, "delay");
      await sleep(10000);

      if (dailyActivityConfig.depositRepetitions > 0) {
        const suiBalance = await client.getBalance({ owner: address, coinType: SUI_TYPE });
        const formattedSUI = formatBalance(suiBalance.totalBalance, SUI_DECIMALS);
      }

      for (let depositCount = 0; depositCount < dailyActivityConfig.depositRepetitions; depositCount++) {
        const isGR = depositCount % 2 === 0;
        const coinType = isGR ? GR_TYPE : SUI_TYPE;
        const typeArg = coinType; 
        const coinName = isGR ? "GR" : "SUI";
        const range = isGR ? dailyActivityConfig.grDepositRange : dailyActivityConfig.suiDepositRange;
        const depositAmount = (Math.random() * (range.max - range.min) + range.min).toFixed(4);
        addLog(`Account ${accountIndex + 1} - Deposit ${depositCount + 1}: ${depositAmount} ${coinName}`, "warn");
        try {
          await performDeposit(keypair, depositAmount, proxyUrl, coinType, typeArg, coinName);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Deposit ${depositCount + 1}: Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        if (depositCount < dailyActivityConfig.depositRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next deposit...`, "delay");
          await sleep(randomDelay);
        }
      }
      addLog(`Account ${accountIndex + 1} - Waiting 10 seconds before starting withdrawing...`, "delay");
      await sleep(10000);

      for (let withdrawCount = 0; withdrawCount < dailyActivityConfig.withdrawRepetitions; withdrawCount++) {
        const isGR = withdrawCount % 2 === 0; 
        const coinType = isGR ? GR_TYPE : SUI_TYPE;
        const typeArg = coinType;
        const coinName = isGR ? "GR" : "SUI";
        const range = isGR ? dailyActivityConfig.grWithdrawRange : dailyActivityConfig.suiWithdrawRange;
        const withdrawAmount = (Math.random() * (range.max - range.min) + range.min).toFixed(4);
        addLog(`Account ${accountIndex + 1} - Withdraw ${withdrawCount + 1}: ${withdrawAmount} ${coinName}`, "warn");
        try {
          await performWithdraw(keypair, withdrawAmount, proxyUrl, coinType, typeArg, coinName);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Withdraw ${withdrawCount + 1}: Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        if (withdrawCount < dailyActivityConfig.withdrawRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next withdraw...`, "delay");
          await sleep(randomDelay);
        }
      }
      addLog(`Account ${accountIndex + 1} - Waiting 10 seconds before starting borrowing...`, "delay");
      await sleep(10000);

      if (dailyActivityConfig.borrowRepetitions > 0) {
        addLog(`Borrow Process Started `, "info");
      }

      for (let borrowCount = 0; borrowCount < dailyActivityConfig.borrowRepetitions; borrowCount++) {
        const borrowAmount = (Math.random() * (dailyActivityConfig.gusdBorrowRange.max - dailyActivityConfig.gusdBorrowRange.min) + dailyActivityConfig.gusdBorrowRange.min).toFixed(4);
        addLog(`Account ${accountIndex + 1} - Borrow ${borrowCount + 1}: ${borrowAmount} GUSD`, "warn");
        try {
          await performBorrow(keypair, borrowAmount, proxyUrl);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Borrow ${borrowCount + 1}: Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        if (borrowCount < dailyActivityConfig.borrowRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next borrow...`, "delay");
          await sleep(randomDelay);
        }
      }

      addLog(`Account ${accountIndex + 1} - Waiting 10 seconds before starting repaying...`, "delay");
      await sleep(10000);

      for (let repayCount = 0; repayCount < dailyActivityConfig.repayRepetitions; repayCount++) {
        const repayAmount = (Math.random() * (dailyActivityConfig.gusdRepayRange.max - dailyActivityConfig.gusdRepayRange.min) + dailyActivityConfig.gusdRepayRange.min).toFixed(4);
        addLog(`Account ${accountIndex + 1} - Repay ${repayCount + 1}: ${repayAmount} GUSD`, "warn");
        try {
          await performRepay(keypair, repayAmount, proxyUrl);
        } catch (error) {
          addLog(`Account ${accountIndex + 1} - Repay ${repayCount + 1}: Failed: ${error.message}. Skipping.`, "error");
        } finally {
          await sleep(3000);
        }

        if (repayCount < dailyActivityConfig.repayRepetitions - 1) {
          const randomDelay = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000;
          addLog(`Account ${accountIndex + 1} - Waiting ${Math.floor(randomDelay / 1000)} seconds before next repay...`, "delay");
          await sleep(randomDelay);
        }
      }

      if (accountIndex < accounts.length - 1) {
        addLog(`Waiting 10 seconds before next account...`, "delay");
        await sleep(10000);
      }
    }
  } catch (error) {
    addLog(`Daily activity failed: ${error.message}`, "error");
  }
}

// --- Main Execution ---

async function main() {
  // Muat konfigurasi dan akun saat startup
  loadConfig();
  loadAccounts();
  loadProxies();

  if (accounts.length === 0) {
    addLog("Tidak ada akun ditemukan di private_keys.txt. Bot berhenti.", "error"); // <-- DIUBAH
    return; // Keluar jika tidak ada akun
  }

  addLog(`Bot dimulai untuk ${accounts.length} akun.`, "success");
  addLog(`Loop otomatis diatur setiap ${dailyActivityConfig.loopHours} jam.`);

  // Loop tanpa batas
  while (true) {
    try {
      // Jalankan siklus aktivitas harian
      await runDailyActivity();

      // Jika selesai, tunggu untuk siklus berikutnya
      addLog(`Siklus selesai. Menunggu ${dailyActivityConfig.loopHours} jam untuk siklus berikutnya.`, "success");
      const waitTimeMs = dailyActivityConfig.loopHours * 60 * 60 * 1000;
      await sleep(waitTimeMs);

    } catch (error) {
      addLog(`Terjadi kesalahan kritis di loop utama: ${error.message}`, "error");
      addLog("Akan mencoba me-restart siklus setelah 1 jam...", "warn");
      await sleep(3600000); // Tunggu 1 jam sebelum mencoba lagi
    }
  }
}

// Mulai bot
main();
