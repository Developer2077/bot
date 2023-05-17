const { Telegraf } = require('telegraf');
const gnuplot = require('gnuplot');
const fs = require('fs');
const { spawn } = require('child_process');
const { promisify } = require('util');
const puppeteer = require('puppeteer');
const mysql = require('mysql');

const bot = new Telegraf('6222821012:AAGxI_hksmmzLEDJpcA5wd-46YQBzY5m2Q0');

let json;

var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Mysql_123',
  database: 'espdata'
});

bot.command('start', ctx => {
  try {
    console.log(ctx.from);
    bot.telegram.sendMessage(ctx.chat.id, "Benvenuto nel nostro bot per il controllo della qualità dell'aria! Grazie per aver scelto il nostro dispositivo per monitorare l'aria dove vuoi tu. Siamo qui per aiutarti a mantenere un'aria pulita e salubre per te e per la tua comunità. Utilizza i comandi a tua disposizione per accedere alle informazioni sulla qualità dell'aria nella tua zona di interesse.Inizia subito digitando /help per visualizzare la lista dei comandi disponibili.\n Se non disponi ancora di un dispositivo ti consiglio di visualizzare il nostro /sitoweb");
    ctx.reply('🐳');
    const stickerPath = 'sticker.webp';
    ctx.replyWithSticker({ source: stickerPath });
  } catch (error) {
    ctx.reply(error)
  }

});

bot.command('dati', (ctx) => {
  try {
    bot.telegram.sendMessage(ctx.chat.id, 'Scegli quale dato visualizzare', {
      "reply_markup": {
        "keyboard": [
          ["Temperature", "Humidity"],
          ["Pressure", "Gas"],
          ["Qualità aria"]
        ]
      }
    }).then(() => {
      bot.on('message', async function listener(ctx) {
        switch (ctx.message.text) {
          case 'Temperature':
            const data = await Takedata();
            bot.telegram.sendMessage(ctx.chat.id, `Temperatura: ${data[0].Temperature}\nOra: ${data[0].Data_Registration}`)
            break;
          case 'Humidity':
            const data1 = await Takedata();
            bot.telegram.sendMessage(ctx.chat.id, `Umidità: ${data1[0].Humidity}\nOra: ${data1[0].Data_Registration}`)
            break;
          case 'Pressure':
            const data2 = await Takedata();
            bot.telegram.sendMessage(ctx.chat.id, `Pressione: ${data2[0].Pressure}\nOra: ${data2[0].Data_Registration}`)
            break;
          case 'Gas':
            const data3 = await Takedata();
            bot.telegram.sendMessage(ctx.chat.id, `Gas: ${data3[0].Gas_Resistance}\nOra: ${data3[0].Data_Registration}`)
            break;
          default:
            const data4 = await Takedata();
            bot.telegram.sendMessage(ctx.chat.id, `Temperatura: ${data4[0].Temperature}\nUmidità: ${data4[0].Humidity}\nPressione: ${data4[0].Pressure}\nGas: ${data4[0].Gas_Resistance}\nOra: ${data4[0].Data_Registration}`)
            break;
        }
      });
    });
  } catch (error) {
    ctx.reply(error)
  }

});




bot.command('Chisiamo', ctx => {
  try {
    bot.telegram.sendMessage(ctx.chat.id, " Siamo un'azienda specializzata nello sviluppo di prodotti per la raccolta dati ambientali e la valutazione della qualità dell'aria. Il nostro obiettivo è aiutare i nostri clienti a monitorare l'ambiente in cui vivono e lavorano, fornendo loro strumenti avanzati e innovativi per la raccolta e l'analisi dei dati. Ci impegniamo costantemente nella ricerca e sviluppo di nuove tecnologie per migliorare l'efficacia dei nostri prodotti e garantire la massima precisione nelle rilevazioni. Inoltre, ci dedichiamo anche alla formazione e all'informazione sui temi legati alla qualità dell'aria, per sensibilizzare l'opinione pubblica sull'importanza della tutela dell'ambiente e della salute umana.\n")
  } catch (error) {
    ctx.reply(error)
  }

})
bot.command('help', async (ctx) => {
  try {
    bot.telegram.sendMessage(ctx.chat.id, 'I comandi disponibili del bot sono: \n/start :per avviare il bot\n/chart :per inviare un grafico che mostri i dati raccolti\n/Chisiamo :breve spiegazione della Frig&co. \n/help :per vedere i comandi disponibili \n/sitoweb :Per visitare il sito web della Frig&co.\n/posizione :per vedere la posizione del dispositivo\n/dati :Per visualizzare i dati singolarmente tramite la tastiera')
  } catch (error) {

  }
})

bot.command('sitoweb', ctx => {
  try {
    bot.telegram.sendMessage(ctx.chat.id, 'Puoi visiualizzare i tuoi dati anche sul nostro portale web: https://progetto2--davidegiovino.repl.co')
  } catch (error) {
    ctx.reply('Fatal')
  }
})

bot.on('location', (ctx) => {
  try {
    const latitude = ctx.message.location.latitude;
    const longitude = ctx.message.location.longitude;
    // qui puoi utilizzare le coordinate della posizione per fare ciò che desideri
    ctx.replyWithLocation(latitude, longitude, {
      live_period: 60, // Opzione per visualizzare la posizione dell'utente in tempo reale per 1 minuto
      reply_markup: {
        inline_keyboard: [
          [{
            text: "Apri in Google Maps",
            url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
          }]
        ]
      }
    });
  } catch (error) {
    ctx.reply("Fatal")
  }
});


bot.command('posizione', (ctx) => {
  try {
    if (ctx.message.location) {
      const latitude = ctx.message.location.latitude;
      const longitude = ctx.message.location.longitude;

      // Invia la posizione dell'utente sulla mappa
      ctx.replyWithLocation(latitude, longitude, {
        live_period: 60, // Opzione per visualizzare la posizione dell'utente in tempo reale per 1 minuto
        reply_markup: {
          inline_keyboard: [
            [{
              text: "Apri in Google Maps",
              url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
            }]
          ]
        }
      });
    } else {
      // L'utente non ha fornito la posizione
      ctx.reply('Per visualizzare la tua posizione sulla mappa, inviami la tua posizione tramite il pulsante "Invia la tua posizione"');
    }
  } catch (error) {
  }
});

async function UpdateMessage(ctx){
  try {
    let i=5
    const chatId =ctx.chat.id;
    
    while (i >= 1) {
      const message = await ctx.reply(`Creazione del chart in ... ${i}`);

      await new Promise(resolve => setTimeout(resolve, 1200));

      await bot.telegram.deleteMessage(chatId, message.message_id);

      i = i - 1;
    }
  } catch (error) {
    bot.telegram.sendMessage(ctx.chat.id ,error);
  }
}

async function createChartImage(ctx) {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const browser = await puppeteer.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
    const page = await browser.newPage();
    UpdateMessage(ctx);
    await page.goto(`file://${__dirname}/chart.html`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 6000));
    const chartImage = await page.screenshot({ fullPage: true });
    await browser.close();
    return chartImage;
  } catch (e) { }
}

async function Takedata() {
  try {
    const response = await fetch("https://progetto2--davidegiovino.repl.co/list");
    const jsonData1 = await response.json();
    return jsonData1;
  } catch (error) {
  }
}

bot.command('chart', async (ctx) => {

  try {
    const data = await Takedata();
    //console.log(data);
    await createChartHTML(data);
    const chartImage = await createChartImage(ctx);
    fs.writeFileSync('chart.png', chartImage);
    await ctx.replyWithPhoto({ source: 'chart.png' });
  } catch (error) {
    console.error(error);
  }

});

async function createChartHTML(data) {
  const chartHTML = `
  <!DOCTYPE html>
<html>

<head>
    <style>
        html,
        body,
        #container {
            margin: 0;
            height: 100%;
        }

        .chart-container {
            width: 50%;
            height: 50%;
            float: left;
            padding: 0;
            margin: 0;
            box-sizing: border-box;
        }
    </style>
    <title>Temperature Chart</title>
    <script src="https://cdn.fusioncharts.com/fusioncharts/latest/fusioncharts.js"></script>
    <script src="https://cdn.fusioncharts.com/fusioncharts/latest/themes/fusioncharts.theme.fint.js"></script>
</head>

<body>
    <div id="container">
        <div class="chart-container" id="chart-container-1"></div>
        <div class="chart-container" id="chart-container-2"></div>
        <div class="chart-container" id="chart-container-3"></div>
        <div class="chart-container" id="chart-container-4"></div>
    </div>
    <script>
    var data = ${JSON.stringify(data)};
        FusionCharts.ready(function () {
            // Inizializza e rendere ogni chart in un diverso container
            var chart1 = new FusionCharts({
                type: 'thermometer',
                renderAt: 'chart-container-1',
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: {
                    "chart": {
                        "caption": "Temperature",
                        "lowerLimit": "-5",
                        "upperLimit": "45",
                        "decimals": "2",
                        "numberSuffix": "°C",
                        "theme": "fint",
                        "chartBottomMargin": "20",
                        "showValue": "1",
                        "valueFontColor": "#000000",
                        "bgcolor": "",
                        "plotFillColor": "#FFFF99",
                        "plotFillAlpha": "70",
                        "plotBorderThickness": "0",
                        "showBorder": "1"
                    },
                    "value": data[0].Temperature
                }
            }).render();


            var chart2 = new FusionCharts({
                type: 'hlineargauge',
                renderAt: 'chart-container-2',
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: {
                    "chart": {
                        "caption": "Humidity",
                        "lowerLimit": "0",
                        "upperLimit": "100",
                        "numberSuffix": "%",
                        "theme": "fint"
                    },
                    "colorRange": {
                        "color": [{
                            "minValue": "0",
                            "maxValue": "50",
                            "code": "#87CEFA"
                        }, {
                            "minValue": "50",
                            "maxValue": "75",
                            "code": "#5e81ac"
                        }, {
                            "minValue": "75",
                            "maxValue": "100",
                            "code": "#0077be"
                        }]
                    },
                    "pointers": {
                        "pointer": [{
                            "value": data[0].Humidity,
                            "thickness": "5",
                            "color": "#000000"
                        }]
                    }
                }
            }).render();

            var chart3 = new FusionCharts({
                type: 'pie2d',
                renderAt: 'chart-container-3',
                width: '100%',
                height: '100%',
                dataFormat: 'json',
                dataSource: {
                    "chart": {
                        "caption": "Pressure",
                        "numberPrefix": "hPa",
                        "showPercentValues": "1",
                        "showLegend": "1",
                        "legendPosition": "right",
                        "theme": "fusion"
                    },
                    "data": [{
                        "label": "Standard Pressure",
                        "value": "1013,25"
                    }, {
                        "label": "Pressure",
                        "value": parseFloat(data[0].Pressure)
                    }]
                }
            }).render();

            var chart4 = new FusionCharts({
                type: 'bulb',
                renderAt: 'chart-container-4',
                width: '99%',
                height: '99%',
                dataFormat: 'json',
                dataSource: {
                    "chart": {
                        "caption": "Gas Resistance",
                        "numberPrefix": "",
                        "upperlimit": "-5",
                        "lowerlimit": "50",
                        "captionPadding": "30",
                        "showshadow": "0",
                        "showvalue": "1",
                        "useColorNameAsValue": "1",
                        "placeValuesInside": "1",
                        "valueFontSize": "16",
                        //Tooltext
                        // "plottooltext": "<span id='headerdiv' style='font-family:\"Arial\", \"Helvetica\";font-size: 13px;font-weight: bold;'>Current Temperature:</span>{br}<div id='valueDiv' style=' color: #EEEEEE; text-align:center;font-size: 25px; padding: 10px;  margin-top:5px; font-family:\"Arial\", \"Helvetica\"; font-weight: bold;'>$value°C</div>",
                        //Theme
                        "theme": "fusion"
                    },
                    "colorrange": {
                        "color": [{
                            "minvalue": "0",
                            "maxvalue": "50000",
                            "label": data[0].Gas_Resistance,
                            "code": "#00ff00"
                        }]
                    },
                    "data": {
                        "value": data[0].Gas_Resistance
                    }
                }
            }).render();
        });
    </script>
</body>

</html>
  `;
  await promisify(fs.writeFile)('chart.html', chartHTML);
}

bot.launch();