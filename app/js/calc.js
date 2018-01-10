import css from 'semantic/semantic.less';
import css from 'style/layout.less';
import 'semantic/definitions/modules/modal';
import 'semantic/definitions/modules/dimmer';
import './charts/vlsm.js';
import $ from 'jquery';
import Highcharts from 'highcharts/highcharts.js';
// import IPv4 from 'lib/ipcalc.js';
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
        return {used: networks, unused: availableNetworks};
    }
}


$(document).ready(()=>{
  if(localStorage.getItem('networks')!='') {
    JSON.parse(localStorage.getItem('networks')).map((network)=>{
      $('#numbersOfHosts').append($(`<div class="ui label big"><i class="cloud icon"></i>${network}</div>`));
    });
  }
});

$('#addNetwork').click((event)=>{
  event.preventDefault();
  let numberOfHosts = Number($('input[name=numberOfHosts]')[0].value);
  if(numberOfHosts === parseInt(numberOfHosts, 10) && numberOfHosts>0) {
    let numbersOfHosts = JSON.parse(localStorage.getItem('networks')) || new Array();
    numbersOfHosts.push(numberOfHosts);
    localStorage.setItem('networks', JSON.stringify(numbersOfHosts));
    $('#numbersOfHosts').append($(`<div class="ui label big"><i class="cloud icon"></i>${numberOfHosts}</div>`));
  }
});

$('#deleteNetwork').click((event)=>{
  event.preventDefault();
  localStorage.setItem('networks', JSON.stringify([]));
  $('#numbersOfHosts').empty();
});

$('#setPool').click((event)=> {
  event.preventDefault();
  let regexp = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/,
      mask = Number($('input[name=mask]')[0].value),
      ip = $('input[name=ip]')[0].value;
  if(regexp.test(ip) && mask === parseInt(mask, 10)) {
    let numbersOfHosts = JSON.parse(localStorage.getItem('networks')).sort();
    if(numbersOfHosts.length>0) {

      let ipv4 = new IPv4(Array.from(ip.split('.').map((oct)=>Number(oct))), mask);
      let networks = ipv4.vlsmSplit(numbersOfHosts);
      let powers = Array(33).fill(0).map((item, i)=>{return Math.pow(2, 32-i)}),
          numberOfUnused = 0,
          networksCount = [];
      for(let usedNetwork of networks.used) {
        usedNetwork.info = (new IPv4(usedNetwork.address, usedNetwork.mask)).getFullInfo();
        networksCount.push({
          name: `${usedNetwork.address.join('.')}/${usedNetwork.mask}`,
          y: powers[usedNetwork.mask]
        })
      }
      for(let unusedNetwork of networks.unused) {
        numberOfUnused+=powers[unusedNetwork.mask];
      }
      networksCount.push({
        name: 'Niewykorzystane',
        y: numberOfUnused
      })
      $('#networks').empty();
      for(let i=0; i<networks.used.length; i++) {
        $('#networks').append($(`
          <div class="ui message">
            <div class="ui three statistics center aligned tiny">
              <div class="ui statistic">
                <div class="value">
                  ${networks.used[i].address.join('.')}
                </div>
                <div class="label">
                  Adres IP
                </div>
              </div>
              <div class="ui statistic">
                <div class="value">
                  /${networks.used[i].mask}
                </div>
                <div class="label">
                  Maska
                </div>
              </div>
              <div class="ui statistic">
                <div class="value">
                  ${numbersOfHosts[i]}/${networks.used[i].info.numberOfHosts}
                  <div class="ui label tiny ">
                    ${parseInt(numbersOfHosts[i]/networks.used[i].info.numberOfHosts*10000)/100}%
                  </div>
                </div>
                <div class="label">
                  Liczba hostów
                </div>
              </div>
            </div>
          </div>
          `));
      }




      Highcharts.chart('networkchart', {
          chart: {
              plotBackgroundColor: null,
              plotBorderWidth: null,
              plotShadow: false,
              type: 'pie'
          },
          title: {
              text: 'Wykorzystanie adresów IP z puli'
          },
          tooltip: {
              pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
          },
          plotOptions: {
              pie: {
                  allowPointSelect: true,
                  cursor: 'pointer',
                  dataLabels: {
                      enabled: false
                  },
                  showInLegend: true
              }
          },
          series: [{
              name: 'Pule',
              colorByPoint: true,
              data: networksCount
          }]
      });




    }
  }
});
