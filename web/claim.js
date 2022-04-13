const merkleTreeUrl = 'alloc.json';
const distributorContract = '0x0000000000000000000000000000000000000000';
const expectedChainId = 1;
const contractAbi = '[{"inputs":[{"internalType":"bytes32","name":"_merkleRoot","type":"bytes32"},{"internalType":"address","name":"_rewardToken","type":"address"},{"internalType":"uint64","name":"_distributionStartTime","type":"uint64"},{"internalType":"uint64","name":"_distributionDuration","type":"uint64"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"total","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"count","type":"uint256"}],"name":"Claim","type":"event"},{"inputs":[{"internalType":"address","name":"_account","type":"address"},{"internalType":"uint256","name":"_total","type":"uint256"},{"internalType":"uint256","name":"_count","type":"uint256"},{"internalType":"bytes32[]","name":"_merkleProof","type":"bytes32[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimedCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"distributionDuration","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"distributionStartTime","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"merkleRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"},{"internalType":"uint256","name":"_total","type":"uint256"},{"internalType":"bytes32[]","name":"_merkleProof","type":"bytes32[]"}],"name":"readyToClaim","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rewardToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"}]';

let provider, merkleJson;

window.connect = async function () {
    hideElement('wrong-network');
    hideElement('not-available');

    try {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
    } catch (e) {
        return;
    }
    
    let accounts, response;

    [accounts, response] = await Promise.all([
        provider.listAccounts(),
        fetch(merkleTreeUrl)
    ]);

    const network = await provider.getNetwork();
    if (network.chainId !== expectedChainId) {
        showElement('wrong-network');
        return;
    }

    try {
        merkleJson = await response.json();
    } catch (e) {
        showElement('not-available');
        return;
    }

    provider.provider.on('accountsChanged', showAccountInfo);

    await showAccountInfo(accounts);

    hideElement('connect-btn');
};

async function showAccountInfo(accounts) {
    hideElement('not-found');
    hideElement('not-available');

    const account = accounts[0].toLowerCase();

    console.log('Account: ' + account);

    const accountInfo = document.getElementById('account-info');
    accountInfo.innerHTML = 'Account: ' + account;

    showElement('account-info');

    const leafItem = merkleJson.treeLeaves.filter(l => l.address.toLowerCase() === account)[0];
    if (!leafItem) {
        showElement('not-found');
        return;
    }

    const claimButton = document.getElementById('claim-btn');
    claimButton.setAttribute('data-leaf', JSON.stringify(leafItem));

    try {
        await window.updateClaimInfo();
    } catch (e) {
        showElement('not-available');
        return;
    }
}

window.updateClaimInfo = async function () {
    hideElement('claim-btn');

    const claimButton = document.getElementById('claim-btn');
    const leafItem = JSON.parse(claimButton.getAttribute('data-leaf'));

    const claimedInfo = document.getElementById('claim-info');

    const total = toBigNumber(leafItem.count);

    try
    {
        const contract = new ethers.Contract(distributorContract, JSON.parse(contractAbi), provider);
        const claimedCount = await contract.claimedCount(leafItem.address);
    
        claimedInfo.innerHTML = 'You claimed ' + ethers.utils.formatUnits(claimedCount, 18) + ' / ' + ethers.utils.formatUnits(total, 18) + ' tokens';
    
        const releasableCount = await contract.readyToClaim(leafItem.address, total, leafItem.proof);
    
        claimButton.setAttribute('claim-count', releasableCount.toString());
        claimButton.innerHTML = 'Claim ' + ethers.utils.formatUnits(releasableCount, 18) + ' tokens';
    } catch (e) {
        claimedInfo.innerHTML = 'Your total allocation: ' + ethers.utils.formatUnits(total, 18) + ' tokens';
        throw e;
    }

    showElement('claim-btn');
}

window.claim = async function () {
    disableElement('claim-btn');

    const claimButton = document.getElementById('claim-btn');
    const leafItem = JSON.parse(claimButton.getAttribute('data-leaf'));
    const releasableCount = toBigNumber(claimButton.getAttribute('claim-count'));
    const total = toBigNumber(leafItem.count);

    const signer = provider.getSigner();
    const contract = new ethers.Contract(distributorContract, JSON.parse(contractAbi), signer);

    try {
        const claimTx = await contract.claim(leafItem.address, total, releasableCount, leafItem.proof);
        const txReceipt = await claimTx.wait();
        showElement('claimed-success');
        hideElement('claimed-error');

        await window.updateClaimInfo();
    } catch (e) {
        if (e.code !== 4001) {
            hideElement('claimed-success');
            showElement('claimed-error');
        }
    }

    enableElement('claim-btn');
}

function toBigNumber(num) {
    return ethers.BigNumber.from(num);
}

function showElement(elId) {
    return document.getElementById(elId).classList.remove('hide');
}

function hideElement(elId) {
    return document.getElementById(elId).classList.add('hide');
}

function enableElement(elId) {
    return document.getElementById(elId).disabled = false;
}

function disableElement(elId) {
    return document.getElementById(elId).disabled = true;
}
