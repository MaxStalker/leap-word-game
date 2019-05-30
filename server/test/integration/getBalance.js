import rpcClient from '../../rpcClient';

const main = async ()=>{
  const tokenColor = await rpcClient.getTokenColor(TOKEN_ADDRESS);
  const balanceOf = await rpcClient.getBalance(TOKEN_ADDRESS);
  const balance = await balanceOf('0x4436373705394267350db2c06613990d34621d69');
  console.log({tokenColor, balance: balance.toString()});
};

main();
