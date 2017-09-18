const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const ApiAiApp = require('actions-on-google').ApiAiApp;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * 
 * @param {ApiAiApp} app 
 */
const hasScreen = app =>
  app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);

/**
 * 
 * @param {ApiAiApp} app 
 */
const askRateIntent = app => {
  const handleUnsupportedCurrency = currency => {
    if (hasScreen(app)) {
      return app.ask(
        app
          .buildRichResponse()
          .addSimpleResponse(
            `Sorry, I can't tell the exchange rate for ${currency} yet. Would you like to check on bitfinex.com?`
          )
          .addSuggestionLink('bitfinex.com', 'https://www.bitfinex.com/')
      );
    }
    return app.tell(
      `Sorry, I can't tell the exchange rate for ${currency} yet.`
    );
  };

  const supportedCurrencies = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    iota: 'IOT',
    litecoin: 'LTC'
  };

  const currency = app.getArgument('crypto-currency');

  if (!currency) {
    return app.tell("Sorry, I don't understand that yet");
  }

  const symbol = supportedCurrencies[currency];
  if (!symbol) {
    return handleUnsupportedCurrency(currency);
  }

  fetch(`https://api.bitfinex.com/v2/ticker/t${symbol}USD`)
    .then(r => r.json())
    .then(json => {
      return app.tell(
        `The current price for ${currency} on bitfinex.com is $${json[6].toFixed(2)}`
      );
    });
};

app.use('/', (req, res) => {
  const app = new ApiAiApp({ request: req, response: res });
  const actionMap = new Map();

  actionMap.set('ask.rate', askRateIntent);
  app.handleRequest(actionMap);
});

app.listen(process.env.PORT || 3000);
