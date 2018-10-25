var request = require("request");
var ct = require("console.table");
var _ = require("lodash");
let teams = require("./teams.json");

let leagueId = 2743;

let baseUrl = "https://fantasy.premierleague.com/drf";
let allDataUrl = "/bootstrap-static";
let leagueUrl = "/leagues-classic-standings/";
let players = "/elements";
let fixtures = "/fixtures";

let run = process.argv[2];

let pf = Number.parseFloat;

let getLeague = () => {
  request(baseUrl + leagueUrl + leagueId, (err, res, body) => {
    let result = JSON.parse(body);
    let league = result.standings.results.map(t => {
      return {
        lag: t.entry_name,
        navn: t.player_name,
        total: t.total,
        gw: t.event_total
      };
    });
    console.table(league);

    console.log("---");

    console.table(_.reverse(_.sortBy(league, ["gw"])));
  });
};

let getPlayers = sortby => {
  request(baseUrl + players, (err, res, body) => {
    let result = JSON.parse(body);

    let p = result.map(p => {
      return {
        navn: p.first_name + " " + p.second_name,
        form: p.form,
        ppg: pf(p.points_per_game),
        ict: pf(p.ict_index),
        price: p.now_cost / 10,
        total: p.total_points,
        ictpp: pf(pf(p.ict_index) / p.now_cost).toFixed(2),
        fpp: pf(pf(p.form) / (p.now_cost / 10)).toFixed(2)
      };
    });

    console.log("form");
    console.table(_.take(_.reverse(_.sortBy(p, ["form"])), 100));

    console.log("----");
    console.log(sortby);
    console.table(_.take(_.reverse(_.sortBy(p, [sortby])), 100));
  });
};

let nextTenFixtures = (fixtures, gw) => {
  return _.filter(fixtures, f => {
    return f.event >= gw && f.event <= gw + 10;
  });
};

let getTeamFixtures = (nextFixtures, teamId) => {
  return nextFixtures.reduce((filtered, f) => {
    if (f.team_a === teamId) {
      filtered.push({
        dif: f.team_a_difficulty,
        team: _.find(teams, ["id", f.team_h]).name
      });
    } else if (f.team_h === teamId) {
      filtered.push({
        dif: f.team_h_difficulty,
        team: _.find(teams, ["id", f.team_a]).name
      });
    }
    return filtered;
  }, []);
};

let getNextFixtures = (team, gw) => {
  request(baseUrl + fixtures, (err, res, body) => {
    let result = JSON.parse(body);

    let teamId = _.find(teams, ["name", team]).id;

    let nextFixtures = nextTenFixtures(result, gw);

    let teamFixtures = getTeamFixtures(nextFixtures, teamId);

    console.table(teamFixtures);
  });
};

let getEasiestFixtures = gw => {
  request(baseUrl + fixtures, (err, res, body) => {
    let result = JSON.parse(body);

    let nextFixtures = nextTenFixtures(result, gw);

    let meanDifficulty = [];

    _.each(teams, t => {
      let teamFixtures = getTeamFixtures(nextFixtures, t.id);
      let mean = pf(_.meanBy(teamFixtures, "dif")).toFixed(2);
      meanDifficulty.push({ team: t.name, difficulty: mean });
    });

    console.table(_.sortBy(meanDifficulty, ["difficulty"]));
  });
};

switch (run) {
  case "liga":
    getLeague();
    break;
  case "top":
    getPlayers(process.argv[3]);
    break;
  case "team":
    getNextFixtures(process.argv[3], pf(process.argv[4]));
    break;
  case "mean":
    getEasiestFixtures(process.argv[3]);
    break;
  default:
    getLeague();
    break;
}
