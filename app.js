const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', (req, res) => {
  const currency = req.body.result.parameters['crypto-currency'];
  const result = `Tell me about ${currency}`;
  res.json({
    speech: result,
    displayText: result
  });
});

app.listen(process.env.PORT || 3000);
