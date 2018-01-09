import Highcharts from 'highcharts/highcharts.js';

let colors = Highcharts.getOptions().colors,
    categories = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '21.213.43.0/24', '123.4.0./8'],
    data = [{
        color: colors[0],
        drilldown: {
            name: '10.0.0.0/8',
            categories: Array(6).fill(0).map((ip)=>{
              return '10.'+Array(3).fill(0).map((oct)=>{
                return Math.round(Math.random()*255);
              }).join('.');
            }),
            data: [1.06, 0.5, 17.2, 8.11, 5.33, 24.13],
            color: colors[0]
        }
    }, {
        color: colors[1],
        drilldown: {
            name: '172.16.0.0/12',
            categories: Array(8).fill(0).map((ip)=>{
              return '172.16.'+Array(3).fill(0).map((oct)=>{
                return Math.round(Math.random()*255);
              }).join('.');
            }),
            data: [0.33, 0.15, 0.22, 1.27, 2.76, 2.32, 2.31, 1.02],
            color: colors[1]
        }
    }, {
        color: colors[2],
        drilldown: {
            name: '192.168.0.0/16',
            categories: Array(14).fill(0).map((ip)=>{
              return '192.16.'+Array(2).fill(0).map((oct)=>{
                return Math.round(Math.random()*255);
              }).join('.');
            }),
            data: [0.14, 1.24, 0.55, 0.19, 0.14, 0.85, 2.53, 0.38, 0.6, 2.96,
                5, 4.32, 3.68, 1.45],
            color: colors[2]
        }
    }, {
        color: colors[3],
        drilldown: {
            name: '21.213.43.0/24',
            categories: Array(7).fill(0).map((ip)=>{
              return '21.213.43.'+Array(1).fill(0).map((oct)=>{
                return Math.round(Math.random()*255);
              }).join('.');
            }),
            data: [0.3, 0.42, 0.29, 0.17, 0.26, 0.77, 2.56],
            color: colors[3]
        }
    }, {
        color: colors[4],
        drilldown: {
            name: '123.0.0.0/8',
            categories: Array(4).fill(0).map((ip)=>{
              return '123.'+Array(3).fill(0).map((oct)=>{
                return Math.round(Math.random()*255);
              }).join('.');
            }),
            data: [0.34, 0.17, 0.24, 0.16],
            color: colors[4]
        }
    }],
    browserData = [],
    versionsData = [],
    dataLen = data.length,
    drillDataLen,
    brightness;

for(let pool of data) {
  pool.drilldown.data = Array(pool.drilldown.categories.length).fill(0).map(x=>Math.round(Math.sin(Math.random())*50));
  pool.y = pool.drilldown.data.reduce((a, b)=>a+b);
}

// Build the data arrays
for (let i = 0; i < dataLen; i += 1) {

    // add browser data
    browserData.push({
        name: categories[i],
        y: data[i].y,
        color: data[i].color
    });

    // add version data
    drillDataLen = data[i].drilldown.data.length;
    for (let j = 0; j < drillDataLen; j += 1) {
        brightness = 0.2 - (j / drillDataLen) / 5;
        versionsData.push({
            name: data[i].drilldown.categories[j],
            y: data[i].drilldown.data[j],
            color: Highcharts.Color(data[i].color).brighten(brightness).get()
        });
    }
}

Highcharts.chart('vlsm_chart', {
    chart: {
        type: 'pie'
    },
    title: {
        text: ''
    },
    plotOptions: {
        pie: {
            shadow: false,
            center: ['50%', '50%']
        }
    },
    series: [{
        name: 'Networks',
        data: browserData,
        size: '60%',
        dataLabels: {
            formatter: function () {
                return this.y > 5 ? this.point.name : null;
            },
            color: '#ffffff',
            distance: -30
        }
    }, {
        name: 'Pools',
        data: versionsData,
        size: '80%',
        innerSize: '60%',
        dataLabels: {
            formatter: function () {
                // display only if larger than 1
                return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
                    this.point.percentage + '%' : null;
            }
        },
        id: 'versions'
    }],
    responsive: {
        rules: [{
            condition: {
                maxWidth: 400
            },
            chartOptions: {
                series: [{
                    id: 'versions',
                    dataLabels: {
                        enabled: false
                    }
                }]
            }
        }]
    }
});
