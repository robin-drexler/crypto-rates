const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const DialogflowApp = require('actions-on-google').DialogflowApp;
const NodeCache = require('node-cache');
const i18n = require('i18n');

const cache = new NodeCache({ stdTTL: 300 });

i18n.configure({
  directory: __dirname + '/locales'
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const SUPPORTED_CURRENCIES = [
  'bitcoin',
  'ethereum',
  'iota',
  'litecoin',
  'neo',
  'monero'
];

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

const getTranslate = (app) => {
  const lang = app.body_.lang;
  const translate = {};
  i18n.init(translate);
  i18n.setLocale(translate, lang);

  return translate;
};

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
 * @param {DialogflowApp} app
 */
const askRateIntent = (app) => {
  const translate = getTranslate(app);

  const currency = app.getArgument('crypto-currency');

  if (!currency) {
    return app.tell(translate.__mf('currency-not-provided'));
  }

  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    return app.tell(translate.__mf('currency-unknown', { currency }));
  }

  const url = `https://api.coinmarketcap.com/v1/ticker/${currency}`;

  getRateResult(url).then((json) => {
    return app.tell(
      translate.__mf('tell-price', {
        currency: json.name,
        platform: 'coinmarketcap.com',
        price: parseFloat(json.price_usd, 10).toFixed(2),
        targetCurrency: '$'
      })
    );
  });
};

const askSupportedCurrenciesIntent = (app) => {
  const translate = getTranslate(app);

  return app.tell(
    translate.__mf('tell-supported-currencies', {
      currencies: SUPPORTED_CURRENCIES.join(',')
    })
  );
};

app.use('/', (req, res) => {
  const app = new DialogflowApp({ request: req, response: res });
  const actionMap = new Map();

  actionMap.set('ask.rate', askRateIntent);
  actionMap.set('ask.supported.currencies', askSupportedCurrenciesIntent);
  app.handleRequest(actionMap);
});

app.listen(process.env.PORT || 3000);
