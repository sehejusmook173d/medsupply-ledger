import { ethers, BrowserProvider, Contract } from "ethers"; // Import necessary classes/functions
import contractABI from "../contracts/MedXSupplyChain.json";
import { getInjectedEthereum } from "@/lib/injected-ethereum";

// Contract address will be filled after deployment
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "orderId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "metadataUri",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "createOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "orderId",
        "type": "string"
      }
    ],
    "name": "acceptOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "orderId",
        "type": "string"
      }
    ],
    "name": "completeOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Function to get the contract instance
export async function getContract() {
  const eth = typeof window !== "undefined" ? getInjectedEthereum() : null;
  if (!eth) {
    throw new Error("Please install a browser wallet (e.g. MetaMask) to use this application");
  }

  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  return new Contract(contractAddress, contractABI.abi, signer);
}

// Function to create a new order
export async function createOrder(
  sellerAddress: string,
  buyerAddress: string,
  itemName: string,
  quantity: number,
  price: number,
  metadataURI: string
) {
  try {
    const contract = await getContract();
    const tx = await contract.createOrder(
      sellerAddress,
      itemName,
      quantity,
      price,
      metadataURI
    );
    await tx.wait();
    return { success: true, tx };
  } catch (error) {
    console.error("Error creating order:", error);
    return { success: false, error };
  }
}

// Function to get order details
export async function getOrder(orderId: number) {
  try {
    const contract = await getContract();
    const order = await contract.getOrder(orderId);
    return {
      id: order[0].toString(),
      seller: order[1],
      buyer: order[2],
      itemName: order[3],
      quantity: order[4].toString(),
      price: order[5].toString(),
      metadataURI: order[6],
      status: order[7],
      createdAt: order[8].toString(),
      updatedAt: order[9].toString(),
    };
  } catch (error) {
    console.error("Error getting order:", error);
    return null;
  }
}

// Function to accept an order
export async function acceptOrder(orderId: number) {
  try {
    const contract = await getContract();
    const tx = await contract.acceptOrder(orderId);
    await tx.wait();
    return { success: true, tx };
  } catch (error) {
    console.error("Error accepting order:", error);
    return { success: false, error };
  }
}

// Function to complete an order
export async function completeOrder(orderId: number) {
  try {
    const contract = await getContract();
    const tx = await contract.completeOrder(orderId);
    await tx.wait();
    return { success: true, tx };
  } catch (error) {
    console.error("Error completing order:", error);
    return { success: false, error };
  }
}

// Function to update order status
export async function updateOrderStatus(orderId: number, newStatus: number) {
  try {
    const contract = await getContract();
    const tx = await contract.updateOrderStatus(orderId, newStatus);
    await tx.wait();
    return { success: true, tx };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error };
  }
}

// Function to get total order count
export async function getOrderCount() {
  try {
    const contract = await getContract();
    const count = await contract.getOrderCount();
    return parseInt(count.toString());
  } catch (error) {
    console.error("Error getting order count:", error);
    return 0;
  }
}