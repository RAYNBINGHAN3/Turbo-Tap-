import { 
  Connection,
  Transaction,
  ComputeBudgetProgram,
  PublicKey,
  Keypair
} from '@solana/web3.js';


class TapGameContract {
  constructor(privateKeyData) {
    // this.connection = new Connection('https://eclipse.lgns.net/');
    this.connection = new Connection('https://eclipse.helius-rpc.com/');
    this.wallet = this.initializeWallet(privateKeyData);
    this.programId = new PublicKey('turboe9kMc3mSR8BosPkVzoHUfn5RVNzZhkrT2hdGxN');
  }

  initializeWallet(privateKeyData) {
    // 转换私钥数组为Uint8Array
    const privateKeyUint8 = new Uint8Array(privateKeyData);
    const wallet = Keypair.fromSecretKey(privateKeyUint8);

    console.log('养牛地址：', wallet.publicKey.toBase58());
    return wallet;
  }

  async createTapInstruction() {
    function generateInstructionData() {
      // 固定的前缀字节
      const prefix = [0x0b, 0x93, 0xb3, 0xb2, 0x91, 0x76, 0x2d, 0xba];
      
      // 生成随机的最后一个字节 (0x00-0xff)
      const randomByte = Math.floor(Math.random() * 256);
      
      // 合并前缀和随机字节
      return Buffer.from([...prefix, randomByte]);
    }
    
    return {
      programId: this.programId,
      keys: [
        { 
          pubkey: new PublicKey(' '), //#1 -account 看教程填写正确
          isSigner: false, 
          isWritable: false 
        },
        { 
          pubkey: new PublicKey(' '), //#2 -account 看教程填写正确
          isSigner: false, 
          isWritable: true 
        },
        { 
          pubkey: new PublicKey(' '), //#3 -account 看教程填写正确
          isSigner: false, 
          isWritable: false 
        },
        { 
          pubkey: this.wallet.publicKey, 
          isSigner: true, 
          isWritable: true 
        },
        { 
          pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), 
          isSigner: false, 
          isWritable: false 
        }
      ],
      data: generateInstructionData()
    };
  }

  async sendTap() {
    const tapInstruction = await this.createTapInstruction();
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 60000 
    });

    const transaction = new Transaction();
    transaction.add(modifyComputeUnits);
    transaction.add(tapInstruction);
    
    const { blockhash } = await this.connection.getLatestBlockhash('processed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.wallet.publicKey;
    
    const signature = await this.connection.sendTransaction(
      transaction,
      [this.wallet],
      { 
        skipPreflight: true,
        preflightCommitment: 'processed'
      }
    );

    return signature;  // 直接返回签名，不等待确认
  }

  async autoTap(options = {}) {
    const {
      delayMs = 2000,
      maxTaps = 50
    } = options;

    let tapCount = 0;

    const tap = async () => {
      if (tapCount >= maxTaps) {
        console.log('Auto tap completed');
        return;
      }

      try {
        const signature = await this.sendTap();
        console.log(`Tap ${tapCount + 1} successful:`, `https://eclipsescan.xyz/tx/${signature}`, new Date().toISOString());
        tapCount++;
      } catch (error) {
        console.log(`Tap ${tapCount + 1} failed, skipping...`, error);
      }

      // 无论成功失败，都继续下一个
      const randomDelay = delayMs + Math.random() * 1000;
      setTimeout(tap, randomDelay);
    };

    tap();
  }
}

// 使用示例
const privateKeyData = [ ]; //看教程填写本地钱包

const game = new TapGameContract(privateKeyData);


// 开始自动点击
game.autoTap({
  delayMs: 100 + Math.random() * 320,
  maxTaps: 1000000 //一次执行点击最大次数
});
