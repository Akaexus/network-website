'use strict';
function isInt(value) {
    let x;
    if (isNaN(value)) {
        return false;
    }
    x = parseFloat(value);
    return (x | 0) === x;
}
class IPv4 {
    constructor(ip, cidr) {
        this.address = ip.map((oct) => {
            if (oct < 0 || oct > 255) {
                throw new RangeError('IP Address out of range!');
            }
            else {
                return oct;
            }
        });
        if ((cidr < 0 || cidr > 32) && isInt(cidr)) {
            throw new RangeError('IP address mask out of range!');
        }
        else {
            this.mask = cidr;
        }
    }
    getFullMask(cidr = this.mask) {
        let fullMask = new Uint8Array(4);
        for (let i = 0, index = 0; cidr > 0; i++, cidr--) {
            if (i == 8) {
                i = 0;
                index++;
            }
            fullMask[index] += Math.pow(2, 7 - i);
        }
        return fullMask;
    }
    getNetworkAddress(fullmask = this.getFullMask()) {
        return fullmask.map((oct, index, mask) => {
            return oct & this.address[index];
        });
    }
    getBroadcastAddress(networkAddress = this.getNetworkAddress(), mask = this.getFullMask()) {
        return networkAddress.map((oct, index) => {
            return oct + ~mask[index];
        });
    }
    getNumberOfHosts(mask = this.mask) {
        return Math.pow(2, 32 - this.mask) - 2;
    }
    getFullInfo() {
        let info = {
            address: this.address,
            mask: this.mask,
            fullMask: this.getFullMask(this.mask),
            networkAddress: null,
            broadcastAddress: null,
            numberOfHosts: null
        };
        info.networkAddress = this.getNetworkAddress(info.fullMask);
        info.broadcastAddress = this.getBroadcastAddress(info.networkAddress);
        info.numberOfHosts = this.getNumberOfHosts(info.mask);
        return info;
    }
    splitSubnets(numberOfSubnets, address = this.getNetworkAddress(), mask = this.mask) {
        let subnets = new Array(), lastNetwork, temp = 0, newmask = 0;
        while (Math.pow(2, temp) < numberOfSubnets) {
            temp++;
        }
        newmask = mask + temp;
        let hopValue = Math.pow(2, (8 - newmask % 8)), hopOct = newmask ? Math.floor((newmask - 1) / 8) : 0;
        lastNetwork = [].slice.call(address);
        subnets.push(new IPv4(address, newmask));
        for (let i = 1; i < numberOfSubnets; i++) {
            lastNetwork[hopOct] += hopValue;
            for (let j = lastNetwork.length - 1; j > 0; j--) {
                if (lastNetwork[j] > 255) {
                    lastNetwork[j - 1]++;
                    lastNetwork[j] = 0;
                }
            }
            subnets.push(new IPv4(Uint8Array.from(lastNetwork), newmask));
        }
        return subnets;
    }
    vlsmSplit(numbersOfHostsInNetworks, address = this.getNetworkAddress(), mask = this.mask) {
        let networks = new Array(), availableNetworks = this.splitSubnets(1, address, mask);
        numbersOfHostsInNetworks.sort((a, b) => b - a).map((numberOfHosts) => {
            let networkToOperate = availableNetworks.filter((network) => {
                return Math.pow(2, 32 - network.mask) - 2 >= numberOfHosts;
            }).pop();
            if (typeof networkToOperate == 'undefined') {
                throw RangeError('Can\' fit subnet!');
            }
            availableNetworks.splice(availableNetworks.indexOf(networkToOperate));
            let desiredMask = 31;
            while (Math.pow(2, 32 - desiredMask) - 2 < numberOfHosts) {
                desiredMask--;
            }
            let splittedNetworks = this.splitSubnets(Math.pow(2, desiredMask - networkToOperate.mask), networkToOperate.address, networkToOperate.mask);
            networks.push(splittedNetworks.shift());
            availableNetworks = availableNetworks.concat(splittedNetworks.sort().reverse());
            availableNetworks.sort((a, b) => a.mask - b.mask);
        });
        return networks;
    }
}
