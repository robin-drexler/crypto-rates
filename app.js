const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 });
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 *
 * @param {ApiAiApp} app
 */
const hasScreen = (app) =>
  app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);

// example for screen cap
// if (hasScreen(app)) {
//   return app.ask(
//     app
//       .buildRichResponse()
//       .addSimpleResponse(
//         `Sorry, I can't tell the exchange rate for ${currency} yet. Would you like to check on bitfinex.com?`
//       )
//       .addSuggestionLink('bitfinex.com', 'https://www.bitfinex.com/')
//   );
// }

const getRateResult = (url) => {
  const cachedResult = cache.get(url);

  if (cachedResult) {
    console.log('Returning cached result for', url);
    return Promise.resolve(cachedResult);
  }

  console.log('Fetching', url);

  return fetch(url)
    .then((r) => r.json())
    .then(([json]) => {
      cache.set(url, json);
      return json;
    });
};

/**
 *
 * @param {ApiAiApp} app
 */
const askRateIntent = (app) => {
  const supportedCurrencies = ['bitcoin', 'ethereum', 'iota', 'litecoin'];

  const currency = app.getArgument('crypto-currency');

  if (!currency) {
    return app.tell("Sorry, I don't understand that yet");
  }

  if (!supportedCurrencies.includes(currency)) {
    return app.tell(
      `Sorry, I can't tell the exchange rate for ${currency} yet.`
    );
  }

  const url = `https://api.coinmarketcap.com/v1/ticker/${currency}`;

  getRateResult(url).then((json) => {
    return app.tell(
      `The current price for ${json.name} on coinmarketcap.com is $${parseFloat(
        json.price_usd,
        10
      ).toFixed(2)}`
    );
  });
};

app.use('/', (req, res) => {
  const app = new DialogflowApp({ request: req, response: res });
  const actionMap = new Map();

  actionMap.set('ask.rate', askRateIntent);
  app.handleRequest(actionMap);
});

app.listen(process.env.PORT || 3000);
