import axios from "axios";
import { BigNumber } from "ethers";
import Web3, { Transaction } from "web3";

// NOTE :: Wallet details
const minBalance = 0;
const fromWalletPK = "";
const fromAddress = "0x0";
const toAddress = "0x0";

// NOTE :: URLs
const rpcURL = "https://rpc.ankr.com/eth";
const slackWebhookUrl = "";

// NOTE :: For managing the workflow
const polling = 15 * 1000; // 15 seconds
let transacting = false; // Transaction in progress

// NOTE :: For ensuring system is running
const enableLogging = false;
let currentHour = new Date().getHours();
let currentMinute = new Date().getMinutes();

const main = async () => {
  try {
    if (
      new Date().getMinutes() !== currentMinute &&
      new Date().getMinutes() % 5 === 0
    ) {
      console.log("Ping @ ", new Date().toTimeString());
      currentMinute = new Date().getMinutes();
    }
    if (new Date().getHours() !== currentHour) {
      if (!slackWebhookUrl)
        axios.post(slackWebhookUrl, {
          type: "mrkdwn",
          text: "System online...",
        });
      else console.log("System online...");
      currentHour = new Date().getHours();
    }
    if (!!transacting) return console.log("Transacting...");

    // NOTE :: Create connection to RPC provider
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));

    // NOTE :: Get the balance of the wallet
    const balance = BigInt(await web3.eth.getBalance(fromAddress));
    if (!!enableLogging) console.log(`Balance: ${balance}`);

    // NOTE :: Check if balance is less than the minumum
    if (minBalance > balance) return;

    // NOTE :: Send transaction
    let txData: Transaction = {
      from: fromAddress,
      to: toAddress,
      value: 0,
    };
    const gasPrice = BigInt(await web3.eth.getGasPrice());
    txData.gasPrice = "0x" + gasPrice.toString(16);
    const gasLimit = BigNumber.from("21000");
    txData.gas = "0x" + gasLimit.toBigInt().toString(16);

    // NOTE :: Calculate the amount to send
    const fee = gasPrice * gasLimit.toBigInt();
    if (!!enableLogging) console.log(`Fee: ${fee}`);
    const amount = balance - fee;

    // NOTE :: Check if amount is less than 0
    if (amount <= BigNumber.from("0").toBigInt()) {
      if (!!enableLogging)
        console.error(
          `Not enough balance to send ${balance}. Amount is ${amount}`
        );
      return;
    }

    // NOTE :: Update the transaction data
    const value = "0x" + amount.toString(16);
    txData.value = value;

    // NOTE :: Sign and send the transaction
    web3.eth.accounts
      .signTransaction(txData, fromWalletPK)
      .then((signed) => {
        if (signed && signed.rawTransaction) {
          web3.eth
            .sendSignedTransaction(signed.rawTransaction)
            .on("transactionHash", (hash) => {
              transacting = true;
              if (!slackWebhookUrl)
                axios.post(slackWebhookUrl, {
                  type: "mrkdwn",
                  text: `Transaction Hash: ${hash}`,
                });
              return;
            })
            .on("receipt", async () => {
              transacting = false;
              if (!slackWebhookUrl)
                axios.post(slackWebhookUrl, {
                  type: "mrkdwn",
                  text: "Transaction Confirmed",
                });
              return;
            })
            .on("error", (error) => {
              transacting = false;
              if (!slackWebhookUrl)
                axios.post(slackWebhookUrl, {
                  type: "mrkdwn",
                  text: `create sendSignedTransaction: ${error} - ${toAddress}`,
                });
              return;
            });
        } else {
          transacting = false;
          if (!slackWebhookUrl)
            axios.post(slackWebhookUrl, {
              type: "mrkdwn",
              text: `create signTransaction(): No signed raw transaction`,
            });
          return;
        }
      })
      .catch((error) => {
        transacting = false;
        if (!slackWebhookUrl)
          axios.post(slackWebhookUrl, {
            type: "mrkdwn",
            text: `create signTransaction: ${error}`,
          });
        return;
      });
  } catch (err) {
    return;
  }
};

main();
setInterval(() => main(), polling);
