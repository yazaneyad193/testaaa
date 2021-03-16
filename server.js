'use strict';

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');

const app = express();

require('dotenv').config();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);



//Route
app.get('/', homeRoute);
app.post('/favorites', addFavorite);
app.get('/favorites', allFavorite);
app.get('/details/:id', renderDetails);
app.put('/details/:id', updateDetails);
app.delete('/details/:id', deleteDetails);


//Handler
function homeRoute(req, res) {
    let myURL = `https://official-joke-api.appspot.com/jokes/programming/ten`;
    superagent(myURL).then(data => {
        let myArray = data.body.map(item => new Joke(item));
        res.render('pages/home', { jokes: myArray });
    });
}

function addFavorite(req, res) {
    let { id, type, setup, punchline } = req.body;
    let insertSql = 'INSERT INTO joke (id, type, setup,punchline) VALUES ($1, $2, $3,$4) RETURNING*;';
    let safeValue = [id, type, setup, punchline];
    client.query(insertSql, safeValue).then(data => {
        res.redirect('/favorites');

    });

}
function allFavorite(req, res) {

    let mySql = `SELECT * FROM joke;`;
    client.query(mySql).then(data => {
        res.render('pages/favorites', { jokes: data.rows });
    });
}

function renderDetails(req, res) {
    let id = [req.params.id];
    let mySql = 'SELECT * FROM joke WHERE id=$1;'
    client.query(mySql, id).then(data => {
        res.render('pages/details', { jokes: data.rows[0] });
    });
}


function updateDetails(req, res) {
    let id = req.params.id;
    let { type, punchline } = req.body
    let mySql = 'UPDATE joke SET type = $1, punchline = $2 WHERE id=$3;'
    let safeValue = [type, punchline, id];
    client.query(mySql, safeValue).then(data => {
        res.redirect('/favorites');
    });
}

function deleteDetails(req, res) {
    let id = req.params.id;
    let mySql = 'DELETE FROM joke  WHERE id=$1;';
    let safeValue = [id];
    client.query(mySql, safeValue).then(data => {
        res.redirect('/favorites');
    });
}

//constructor 
function Joke(data) {
    this.id = data.id;
    this.type = data.type;
    this.setup = data.setup;
    this.punchline = data.punchline;
}

//Listen
const PORT = process.env.PORT || 5000;
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`listen ${PORT}`);
    });
});