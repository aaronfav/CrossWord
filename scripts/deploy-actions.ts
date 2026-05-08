import { ethers } from "hardhat";
import { deployContractWithBuilderCode } from "./builderDeployment";

async function main() {
  const factory = await ethers.getContractFactory("CrosswordActions");
  const contract = await deployContractWithBuilderCode(factory);
  const address = await contract.getAddress();
  console.log("CrosswordActions deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
