var request = require('request');
var ct = require('console.table');
var _ = require('lodash');

let leagueId = 2743;

let baseUrl = "https://fantasy.premierleague.com/drf";
let allDataUrl = "/bootstrap-static";
let leagueUrl = "/leagues-classic-standings/";
let players = '/elements';

let run = process.argv[2];
let sortby = process.argv[3];

let pf = Number.parseFloat;



let getLeague = () => {
  request(baseUrl + leagueUrl + leagueId, (err, res, body) => {
    let result = JSON.parse(body);
    let league = result.standings.results.map((t) => {
      return { 'lag': t.entry_name, 'navn': t.player_name, 'total': t.total, 'gw': t.event_total };
    });
    console.table(league);

    console.log('---');

    console.table(_.reverse(_.sortBy(league, ['gw'])));
  });
};

let getPlayers = () => {
  request(baseUrl + players, (err, res, body) => {
    let result = JSON.parse(body);

    let p = result.map((p) => {
      return { 'navn': p.first_name + ' ' + p.second_name,
               form: p.form,
               ppg: pf(p.points_per_game),
               ict: pf(p.ict_index),
               price: p.now_cost / 10,
               total: p.total_points,
               ictpp: pf(pf(p.ict_index) / p.now_cost).toFixed(2),
               fpp: pf(pf(p.form) / (p.now_cost / 10)).toFixed(2)
             };
    });

    console.log('form');
    console.table(_.take(_.reverse(_.sortBy(p, ['form'])), 100));

    console.log('----');
    console.log(sortby);
    console.table(_.take(_.reverse(_.sortBy(p, [sortby])), 100));
    
  });
};

switch(run) {
case 'liga':
  getLeague();
  break;
case 'top':
  getPlayers();
  break;
default:
  getLeague();
  break;
}
