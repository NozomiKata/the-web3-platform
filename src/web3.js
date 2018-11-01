const { isString, isArray, isFinite } = require('lodash');

const { initProtocol } = require('./protocols');
const Contract = require('./contract');
const HttpProtocol = require('./protocols/http');
const Encoder = require('./encoder');
const Decoder = require('./decoder');
const Utils = require('./utils');

class Web3 {
  /**
   * Web3 constructor.
   * @param {string|web3Protocol} protocol Either URL string to create HttpProtocol or a Web3 compatible protocol.
   */
  constructor(protocol) {
    this.protocol = initProtocol(protocol);
    this.encoder = Encoder;
    this.decoder = Decoder;
    this.utils = Utils;
  }

  /**
   * Constructs a new Contract instance.
   * @param {string}        Contract address.
   * @param {array}         Contract ABI.
   * @return {Contract}     Contract instance.
   */
  Contract(address, abi) {
    return new Contract(this.protocol, address, abi);
  }

  /**
   * Constructs a new HttpProtocol instance.
   * @param {string} urlString URL of the blockchain API. eg. http://bodhi:bodhi@127.0.0.1:9888
   * @return {HttpProtocol} HttpProtocol instance.
   */
  HttpProtocol(urlString) {
    return new HttpProtocol(urlString);
  }

  /** ******** MISC ********* */
  /**
   * Checks if the blockchain is connected.
   * @return If blockchain is connected.
   */
  async isConnected() {
    try {
      const res = await this.protocol.rawCall('getnetworkinfo');
      return typeof res === 'object';
    } catch (err) {
      return false;
    }
  }

  /** ******** BLOCKCHAIN ********* */
  /**
   * Returns the block info for a given block hash.
   * @param {string} blockHash The block hash to look up.
   * @param {boolean} verbose True for a json object or false for the hex encoded data.
   * @return {Promise} Latest block info or Error.
   */
  getblock(blockHash, verbose = true) {
    return this.protocol.rawCall('getblock', [blockHash, verbose]);
  }

  /**
   * Returns various state info regarding blockchain processing.
   * @return {Promise} Latest block info or Error.
   */
  getblockchaininfo() {
    return this.protocol.rawCall('getblockchaininfo');
  }

  /**
   * Returns the current block height that is synced.
   * @return {Promise} Current block count or Error.
   */
  getblockcount() {
    return this.protocol.rawCall('getblockcount');
  }

  /**
   * Returns the block hash of the block height number specified.
   * @param {number} blockNum The block number to look up.
   * @return {Promise} Block hash or Error.
   */
  getblockhash(blockNum) {
    return this.protocol.rawCall('getblockhash', [blockNum]);
  }

  /**
   * Returns the transaction receipt given the txid.
   * @param {string} txid The transaction id to look up.
   * @return {Promise} Transaction receipt or Error.
   */
  gettransactionreceipt(txid) {
    return this.protocol.rawCall('gettransactionreceipt', [txid]);
  }

  /**
   * Returns an array of deployed contract addresses.
   * @param {number} startingAcctIndex The starting account index.
   * @param {number} maxDisplay Max accounts to list.
   * @return {Promise} Array of contract addresses or Error.
   */
  listcontracts(startingAcctIndex = 1, maxDisplay = 20) {
    return this.protocol.rawCall('listcontracts', [startingAcctIndex, maxDisplay]);
  }

  /**
   * Search logs with given filters
   * @param  {number} fromBlock Starting block to search.
   * @param  {number} toBlock Ending block to search. Use -1 for latest.
   * @param  {string or array} addresses One or more addresses to search against
   * @param  {string or array} topics One or more topic hashes to search against
   * @param  {object} contractMetadata Metadata of all contracts and their events with topic hashes
   * @param  {bool} removeHexPrefix Flag to indicate whether to remove the hex prefix (0x) from hex values
   * @return {Promise} Promise containing returned logs or Error
   */
  searchlogs(fromBlock, toBlock, addresses, topics, contractMetadata, removeHexPrefix) {
    if (!isFinite(fromBlock)) {
      throw Error('fromBlock must be a number');
    }
    if (!isFinite(toBlock)) {
      throw Error('toBlock must be a number.');
    }

    const addrObj = { addresses: undefined };
    if (isString(addresses)) {
      addrObj.addresses = [addresses];
    } else if (isArray(addresses)) {
      addrObj.addresses = addresses;
    } else {
      throw Error('addresses must be a string or an array.');
    }

    const topicsObj = { topics: undefined };
    if (isString(topics)) {
      topicsObj.topics = [topics];
    } else if (isArray(topics)) {
      topicsObj.topics = topics;
    } else {
      throw Error('topics must be a string or an array.');
    }

    return this.protocol.rawCall('searchlogs', [fromBlock, toBlock, addrObj, topicsObj])
      .then(results => Decoder.decodeSearchLog(results, contractMetadata, removeHexPrefix));
  }

  /** ******** NETWORK ********* */
  /**
   * Returns data about each connected network node as a json array of objects.
   * @return {Promise} Node info object or Error
   */
  getpeerinfo() {
    return this.protocol.rawCall('getpeerinfo');
  }

  /** ******** RAW TRANSACTIONS ********* */
  /**
   * Get the hex address of a Lux address.
   * @param {string} address Lux address
   * @return {Promise} Hex string of the converted address or Error
   */
  gethexaddress(address) {
    return this.protocol.rawCall('gethexaddress', [address]);
  }

  /**
   * Converts a hex address to lux address.
   * @param {string} hexAddress Lux address in hex format.
   * @return {Promise} Lux address or Error.
   */
  fromhexaddress(hexAddress) {
    return this.protocol.rawCall('fromhexaddress', [hexAddress]);
  }

  /** ******** UTIL ********* */
  /**
   * Validates if a valid Lux address.
   * @param {string} address Lux address to validate.
   * @return {Promise} Object with validation info or Error.
   */
  validateaddress(address) {
    return this.protocol.rawCall('validateaddress', [address]);
  }

  /** ******** WALLET ********* */
  /**
   * Backs up the wallet.
   * @param {string} destination The destination directory or file.
   * @return {Promise} Success or Error.
   */
  backupwallet(destination) {
    return this.protocol.rawCall('backupwallet', [destination]);
  }

  /**
   * Reveals the private key corresponding to the address.
   * @param {string} address The lux address for the private key.
   * @return {Promise} Private key or Error.
   */
  dumpprivkey(address) {
    return this.protocol.rawCall('dumpprivkey', [address]);
  }

  /**
   * Encrypts the wallet for the first time. This will shut down the lux server.
   * @param {string} passphrase The passphrase to encrypt the wallet with. Must be at least 1 character.
   * @return {Promise} Success or Error.
   */
  encryptwallet(passphrase) {
    return this.protocol.rawCall('encryptwallet', [passphrase]);
  }

  /**
   * Gets the account name associated with the Lux address.
   * @param {string} address The lux address for account lookup.
   * @return {Promise} Account name or Error.
   */
  getaccount(address) {
    return this.protocol.rawCall('getaccount', [address]);
  }

  /**
   * Gets the Lux address based on the account name.
   * @param {string} acctName The account name for the address ("" for default).
   * @return {Promise} Lux address or Error.
   */
  getAccountAddress(acctName = '') {
    return this.protocol.rawCall('getaccountaddress', [acctName]);
  }

  /**
   * Gets the Lux address with the account name.
   * @param {string} acctName The account name ("" for default).
   * @return {Promise} Lux address array or Error.
   */
  getaddressesbyaccount(acctName = '') {
    return this.protocol.rawCall('getaddressesbyaccount', [acctName]);
  }

  /**
   * Gets a new Lux address for receiving payments.
   * @param {string} acctName The account name for the address to be linked to ("" for default).
   * @return {Promise} Lux address or Error.
   */
  getnewaddress(acctName = '') {
    return this.protocol.rawCall('getnewaddress', [acctName]);
  }

  /**
   * Get transaction details by txid
   * @param {string} txid The transaction id (64 char hex string).
   * @return {Promise} Promise containing result object or Error
   */
  gettransaction(txid) {
    return this.protocol.rawCall('gettransaction', [txid]);
  }

  /**
   * Gets the wallet info
   * @return {Promise} Promise containing result object or Error
   */
  getwalletinfo() {
    return this.protocol.rawCall('getwalletinfo');
  }

  /**
   * Gets the total unconfirmed balance.
   * @return {Promise} Unconfirmed balance or Error.
   */
  getunconfirmedbalance() {
    return this.protocol.rawCall('getunconfirmedbalance');
  }

  /**
   * Adds an address that is watch-only. Cannot be used to spend.
   * @param {string} address The hex-encoded script (or address).
   * @param {string} label An optional label.
   * @param {boolean} rescan Rescan the wallet for transactions.
   * @return {Promise} Success or Error.
   */
  importaddress(address, label = '', rescan = true) {
    return this.protocol.rawCall('importaddress', [address, label, rescan]);
  }

  /**
   * Adds an address by private key.
   * @param {string} privateKey The private key.
   * @param {string} label An optional label.
   * @param {boolean} rescan Rescan the wallet for transactions.
   * @return {Promise} Success or Error.
   */
  importprivkey(privateKey, label = '', rescan = true) {
    return this.protocol.rawCall('importprivkey', [privateKey, label, rescan]);
  }

  /**
   * Imports keys from a wallet dump file
   * @param {string} filename The wallet file.
   * @return {Promise} Success or Error.
   */
  importwallet(filename) {
    return this.protocol.rawCall('importwallet', [filename]);
  }

  /**
   * Lists groups of addresses which have had their common ownership made public by common use as inputs
   *  or as the resulting change in past transactions.
   * @return {Promise} Array of addresses with LUX balances or Error.
   */
  listaddressgroupings() {
    return this.protocol.rawCall('listaddressgroupings');
  }

  /**
   * Lists temporary unspendable outputs.
   * @return {Promise} Array of unspendable outputs or Error
   */
  listlockunspent() {
    return this.protocol.rawCall('listlockunspent');
  }

  /**
   * Lists unspent transaction outputs.
   * @return {Promise} Array of unspent transaction outputs or Error
   */
  listunspent() {
    return this.protocol.rawCall('listunspent');
  }

  /**
   * Lists unspent transaction outputs.
   * @param {string} address Address to send LUX to.
   * @param {number} amount Amount of LUX to send.
   * @param {string} comment Comment used to store what the transaction is for.
   * @param {string} commentTo Comment to store name/organization to which you're sending the transaction.
   * @param {boolean} subtractFeeFromAmount The fee will be deducted from the amount being sent.
   * @param {boolean} replaceable Allow this transaction to be replaced by a transaction with higher fees via BIP 125.
   * @param {number} confTarget Confirmation target (in blocks).
   * @param {string} estimateMode The fee estimate mode, must be one of: "UNSET", "ECONOMICAL", "CONSERVATIVE"
   * @param {string} senderAddress The LUX address that will be used to send money from.
   * @param {boolean} changeToSender Return the change to the sender.
   * @return {Promise} Transaction ID or Error
   */
  sendtoaddress(
    luxaddress,
    amount,
    comment = '',
    commentTo = '',
  ) {
    return this.protocol.rawCall('sendtoaddress', [
      luxaddress,
      amount,
      comment,
      commentTo,
    ]);
  }

  /**
   * Set the transaction fee per kB. Overwrites the paytxfee parameter.
   * @param {bumber} amount The transaction fee in LUX/kB.
   * @return {Promise} True/false for success or Error.
   */
  settxfee(amount) {
    return this.protocol.rawCall('settxfee', [amount]);
  }

  /**
   * Locks the encrypted wallet.
   * @return {Promise} Success or Error.
   */
  walletlock() {
    return this.protocol.rawCall('walletlock');
  }

  /**
   * Unlocks the encrypted wallet with the wallet passphrase.
   * @param {string} passphrase The wallet passphrase.
   * @param {number} timeout The number of seconds to keep the wallet unlocked.
   * @param {boolean} stakingOnly Unlock wallet for staking only.
   * @return {Promise} Success or Error.
   */
  walletpassphrase(passphrase, timeout, anonymizeonly = false) {
    return this.protocol.rawCall('walletpassphrase', [passphrase, timeout, anonymizeonly]);
  }

  /**
   * Changes the encrypted wallets passphrase.
   * @param {string} oldPassphrase The old wallet passphrase.
   * @param {string} newPassphrase The new wallet passphrase.
   * @return {Promise} Success or Error.
   */
  walletpassphrasechange(oldPassphrase, newPassphrase) {
    return this.protocol.rawCall('walletpassphrasechange', [oldPassphrase, newPassphrase]);
  }
}

module.exports = Web3;
