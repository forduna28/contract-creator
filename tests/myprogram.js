const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Myprogram;
  const baseAccount = anchor.web3.Keypair.generate();

  it('Token owner is able to create a smart contract', async () => {
    // Given
    const toAccount1 = anchor.web3.Keypair.generate();
    const toAccount2 = anchor.web3.Keypair.generate();
    const toAccount3 = anchor.web3.Keypair.generate();

    let pubKeys = [
      toAccount1.publicKey,
      toAccount2.publicKey,
      toAccount3.publicKey,
    ]

    let percentages = [
      new anchor.BN(20),
      new anchor.BN(30),
      new anchor.BN(50),
    ]

    // When
    await program.rpc.initialize({
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [baseAccount],
    });

    await program.rpc.addContract(percentages, pubKeys, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });

    // Then
    account = await program.account.baseAccount.fetch(baseAccount.publicKey);
    console.log('Smart Contract created: ')

    for (let i = 0; i < pubKeys.length; i++) {
      let balance = await program.provider.connection.getBalance(pubKeys[i])
      console.log(account.pubkeyList[i].toString(), "--- ", account.percentageList[i] + "%")
    }
  });

  it('Every time someone trades that token, the contract will be executed splitting the amount', async () => {
    
    // Given
    const toAccount = anchor.web3.Keypair.generate();
    let airdrop_amount = 5;
    await airdrop(toAccount.publicKey, airdrop_amount, program.provider);

    let remainingAccounts = [];

    account.pubkeyList.forEach(pubKey => {
      const account = { pubkey: pubKey, isSigner: false, isWritable: true };
      remainingAccounts.push(account);
    });

    // Example of amount gotten from the transaction fee
    let fee = 1 * 1000000000;

    // When
    await program.rpc.executeContract(new anchor.BN(fee), {
      accounts: {
        from: toAccount.publicKey,
        baseAccount: baseAccount.publicKey,
        systemProgram: SystemProgram.programId,
      },
      remainingAccounts: remainingAccounts,
      signers: [toAccount],
    });

    console.log()
    console.log('Amount to be split: ' + fee/1000000000 + " SOL")

    // Then
    for (let i = 0; i < remainingAccounts.length; i++) {
      let balance = await program.provider.connection.getBalance(remainingAccounts[i].pubkey)
      console.log("Balance of", remainingAccounts[i].pubkey.toString(), "is", balance / 1000000000 + " SOL")
    }
  });
});

async function airdrop(publicKey, amount, provider) {
  await provider.connection
    .requestAirdrop(publicKey, amount * 1000000000)
    .then((sig) => provider.connection.confirmTransaction(sig, "confirmed"));
}
