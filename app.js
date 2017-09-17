const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', (req, res) => {
  const send = responseString => {
    res.json({
      speech: responseString,
      displayText: responseString
    });
  };
  const supportedCurrencies = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    iota: 'IOT'
  };

  const currency = req.body.result.parameters['crypto-currency'];

  if (!currency) {
    return send("Sorry, I don't understand that yet");
  }

  const symbol = supportedCurrencies[currency];
  if (!symbol) {
    send(
      `Sorry, I can't tell the exchange rate for ${currency} yet. But, I'm learning every day.`
    );
  }

  fetch(`https://api.bitfinex.com/v2/ticker/t${symbol}USD`)
    .then(r => r.json())
    .then(json => {
      send(
        `The current price for ${currency} on bitfinex.com is $${json[6].toFixed(2)}`
      );
    });
});

app.listen(process.env.PORT || 3000);
