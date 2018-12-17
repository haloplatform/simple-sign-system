const EthTx = require('./eth-tx');
const EllipticCurve = require('secp256k1/elliptic');
const createKeccakHash = require('keccak/js');
const ethUtil = require('ethereumjs-util')
const { Buffer } = require('safe-buffer');
class SimpleSignSystem {
    constructor() {
        this.nonce = null;
        this.previousTransaciton = null;
    }   

    async sleep(ms = 1000) {
        return new Promise((resolve, reject) => setTimeout(resolve, ms))
    }

    async getNonce(address, web3) {
        const chainNonce = await web3.eth.getTransactionCount(address, "latest");
        if(this.nonce != null) {
            this.nonce = this.nonce >= chainNonce ? this.nonce++ : chainNonce;
        } else {
            this.nonce = chainNonce;
        }
        return this.nonce;
    }

    async signTx(originalTx, privateKey, web3) {
        const rawTx = Object.assign({}, originalTx);
        const address = rawTx.from;
        rawTx.nonce = await this.getNonce(address, web3);
        rawTx.gasPrice = '0x0';      
        const tx = new EthTx(rawTx);
        tx.sign(new Buffer(privateKey, 'hex'));
        const ob = {
            transaction: tx,
            serializedTx: "0x" + tx.serialize().toString('hex'),
        };
        return ob;
    }

    // stand alone, sign data with a private key
    async signData(privateKey, data) {
        const hash = createKeccakHash('keccak256').update(data).digest()
        
        const sig = EllipticCurve.sign(hash, ethUtil.toBuffer("0x" + privateKey));        
        return [...sig.signature, sig.recovery + 27];
    }

    // stand alone, verify data with an address
    async recoverData(data, serializedSig) {
        const hash = createKeccakHash('keccak256').update(data).digest()

        const signature = Buffer.from(serializedSig.slice(0, 64));
        const recovery = serializedSig[64] - 27;

        if(recovery !== 0 && recovery !== 1) {
            throw new Error('Invalid signature v value');
        }

        const senderPubKey = EllipticCurve.recover(hash, signature, recovery);
        
        return (
            '0x' + 
            createKeccakHash('keccak256')
            .update(EllipticCurve.publicKeyConvert(senderPubKey, false).slice(1))
            .digest()
            .slice(-20)
            .toString('hex')
        )
    }

    // if you want this library to send it for you, here you go... probably should do it yourself though
    async signAndSend(originalTx, privateKey, web3, safer = false, time = 2000) {
        const ob = await this.signTx(originalTx, privateKey, web3);
        if(safer) {
            return await this.send(ob.serializedTx, web3, safer, time);
        } else {
            return await this.send(ob.serializedTx, web3);
        }
    }

    // We attempt to send the signed transaction on the Halo Platform, we have an option safer approach to make sure the previous transaction is on the chain
    // It's not 100% safe though, and there are edge cases wher eyou coudl get pending tx's colliding. However this is better than just sending
    // a transaction willy nilly.
    async send(serializedTx, web3, safer = false, time = 2000) {        
        if(safer) {
            if(this.previousTransaction != null) {
                const receipt = await web3.eth.getTransactionReceipt(this.previousTransaction.transactionHash);
                if(receipt.blockNumber > 0) {
                    this.previousTransaction = await web3.eth.sendSignedTransaction(serializedTx);
                    return this.previousTransaction;
                } else {
                    await this.sleep(time); // sleep time
                    return await this.send(serializedTx, web3, safer, time); // call it again... :)
                }
            } 
        }
        this.previousTransaction = await web3.eth.sendSignedTransaction(serializedTx);
        return this.previousTransaction;
    }
}
module.exports = SimpleSignSystem;