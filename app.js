var express = require('express');
var exphbs  = require('express-handlebars');
const mercadopago = require('mercadopago');

const ACCESS_TOKEN = process.env.ACCESS_TOKEN || "APP_USR-8208253118659647-112521-dd670f3fd6aa9147df51117701a2082e-677408439";
const INTEGRATOR_ID = 'dev_24c65fb163bf11ea96500242ac130004';
const INTEGRATOR_EMAIL = process.env.INTEGRATOR_EMAIL;
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

mercadopago.configure({
    integrator_id: INTEGRATOR_ID,
    access_token: ACCESS_TOKEN
});

var port = process.env.PORT || 3000

var app = express();
app.use(express.json());

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    const payload = {
        ...req.query,
        external_reference: INTEGRATOR_EMAIL,
        site_url: SITE_URL
    }
    res.render('detail', payload);
});

app.post('/create-preference', async (req, res) => {
    const {
        item,
        payer,
        notificationUrl,
        externalReference
    } = req.body
    
    let preference = {
        items: [
            item
        ],
        
        auto_return: "approved",
        back_urls: {
            success: `${SITE_URL}/success`,
            failure: `${SITE_URL}/failure`,
            pending: `${SITE_URL}/pending`,
        },
        
        external_reference: externalReference,
        
        payer: payer,
        
        payment_methods: {
            excluded_payment_methods: [
                {
                    id: "diners"
                }
            ],
            excluded_payment_types: [
                {
                    id: "atm"
                }
            ],
            installments: 6
        },
        notification_url: notificationUrl,
    };
    
    console.info('preference', preference);
    mercadopago.preferences.create(preference)
    .then(async (response) => {
        console.info('response preference', response);
        return res.json({init_point: response.response.init_point})
    }).catch(function (e) {
        console.log('Preference error', e.message);
        res.status(500);
        res.send('Preference error', e.message);
    });
})

app.post('/notifications', function (req, res) {
    console.info('notifications', req.body);
    return res.send('Success');
});

app.get('/success', function (req, res) {
    const payload = {
        ...req.query,
        site_url: SITE_URL
    }
    res.render('success', payload);
});

app.get('/failure', function (req, res) {
    const payload = {
        ...req.query,
        site_url: SITE_URL
    }
    res.render('failure', payload);
});

app.get('/pending', function (req, res) {
    const payload = {
        ...req.query,
        site_url: SITE_URL
    }
    res.render('pending', payload);
});

app.listen(port);