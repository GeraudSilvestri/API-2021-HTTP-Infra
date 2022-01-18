var Chance = require('chance');
var chance = new Chance();

var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send(f());
});

app.listen(3000, function () {
    console.log('Accepting HTTP requests on port 3000\n');
});

function f(){
    var numberOfAnimals = chance.integer({min : 1, max : 5});

    var animals = [];
    for(var i = 0; i < numberOfAnimals; ++i){
        animals.push({
            animal: chance.animal(),
            bruit: chance.sentence()
        });
    }
    return animals;
}