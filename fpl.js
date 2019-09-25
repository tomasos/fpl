var request = require("request");
var ct = require("console.table");
var _ = require("lodash");
var fs = require("fs");

let teams = require("./teams.json");
let fixdif = require("./fixdif.json");

let leagueId = 2743;

let baseUrl = "https://fantasy.premierleague.com/api";
let allDataUrl = "/bootstrap-static";
let leagueUrl = "/leagues-classic-standings/";
let playersUrl = "/elements";
let fixtures = "/fixtures";
let playerDetailsUrl = "/element-summary/";

let run = process.argv[2];

let pf = Number.parseFloat;

let positions = {
  1: "GKP",
  2: "DEF",
  3: "MID",
  4: "FWD"
};

let getLeague = () => {
  let standings = [];
  request(baseUrl + leagueUrl + leagueId, (err, res, body) => {
    let result = JSON.parse(body);
    let res1 = result.standings.results.map(t => {
      return {
        lag: t.entry_name,
        navn: t.player_name,
        total: t.total,
        gw: t.event_total
      };
    });

    request(
      baseUrl + leagueUrl + leagueId + "?phase=1&le-page=1&ls-page=2",
      (err, res, body) => {
        let result = JSON.parse(body);
        let res2 = result.standings.results.map(t => {
          return {
            lag: t.entry_name,
            navn: t.player_name,
            total: t.total,
            gw: t.event_total
          };
        });

        standings = res1.concat(res2);

        console.table(standings);

        console.log("---");

        console.table(_.reverse(_.sortBy(standings, ["gw"])));

        console.log("snitt: ", _.meanBy(standings, "gw"));
      }
    );
  });
};

let getPlayers = sortby => {
  request(baseUrl + playersUrl, (err, res, body) => {
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
        fpp: pf(pf(p.form) / (p.now_cost / 10)).toFixed(2),
        ppgpm: pf(pf(p.points_per_game) / (p.now_cost / 10)).toFixed(2),
        xPdiff: pf(
          (pf(p.form) + pf(p.points_per_game)) /
            2 *
            (100 - pf(p.selected_by_percent)) /
            100
        ).toFixed(2),
        xPfix: pf(
          (pf(p.form) + pf(p.points_per_game)) /
            2 *
            (5 -
              pf(
                _.find(fixdif, f => {
                  return f.team.id === p.team;
                }).difficulty
              )) /
            10
        ).toFixed(2)
      };
    });

    console.log(sortby);
    console.table(_.take(_.reverse(_.sortBy(p, [sortby])), 100));
  });
};

let nextTenFixtures = (fixtures, gw) => {
  return _.filter(fixtures, f => {
    return f.event >= gw && f.event < gw + 6;
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
      meanDifficulty.push({ team: t, difficulty: mean });
    });

    fs.writeFile("fixdif.json", JSON.stringify(meanDifficulty), () => {
      console.log("write finished");
    });

    console.table(
      _.sortBy(
        meanDifficulty.map(d => ({
          team: d.team.name,
          difficulty: d.difficulty
        })),
        ["difficulty"]
      )
    );
  });
};

let extractStats = result => {
  return result.map(p => {
    return {
      navn: p.first_name + " " + p.second_name,
      team: _.find(teams, ["id", p.team]).name,
      teamid: p.team,
      form: p.form,
      ppg: pf(p.points_per_game),
      ict: pf(p.ict_index),
      price: p.now_cost,
      total: p.total_points,
      ictpp: pf(pf(p.ict_index) / p.now_cost).toFixed(2),
      fpp: pf(pf(p.form) / (p.now_cost / 10)).toFixed(2),
      ppgpm: pf(pf(p.points_per_game) / (p.now_cost / 10)).toFixed(2),
      xPdiff: pf(
        (pf(p.form) + pf(p.points_per_game)) /
          2 *
          (100 - pf(p.selected_by_percent)) /
          100
      ).toFixed(2),
      xPfix: pf(
        (pf(p.form) + pf(p.points_per_game)) /
          2 *
          (5 -
            pf(
              _.find(fixdif, f => {
                return f.team.id === p.team;
              }).difficulty
            )) /
          10
      ).toFixed(2),
      pos: p.element_type
    };
  });
};

let buildStats = () => {
  request(baseUrl + playersUrl, (err, res, body) => {
    let result = JSON.parse(body);

    let p = extractStats(result);

    fs.writeFile("players.json", JSON.stringify(p), () => {
      console.log("write finished");
    });
  });
};

let buildBaseStats = () => {
  request(baseUrl + allDataUrl, (err, res, body) => {
    let result = JSON.parse(body);

    let p = extractStats(result.elements);

    fs.writeFile("basestats.json", JSON.stringify(p), () => {
      console.log("write finished");
    });
  });
};

let buildTeamsFile = () => {
  request(baseUrl + allDataUrl, (err, res, body) => {
    let result = JSON.parse(body);

    fs.writeFile("teams.json", JSON.stringify(result.teams), () => {
      console.log("write finished");
    });
  });
};

let teamStats = () => {
  let teams = [2, 15, 4, 11, 19, 10, 9, 12, 8, 6];
  request(baseUrl + playersUrl, (err, res, body) => {
    let result = JSON.parse(body);
    let players = result.filter(player => teams.indexOf(player.team) > -1);

    let p = extractStats(players);

    fs.writeFile("players.json", JSON.stringify(p), () => {
      console.log("write finished");
    });
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
    getEasiestFixtures(pf(process.argv[3]));
    break;
  case "stats":
    buildStats();
    break;
  case "basestats":
    buildBaseStats();
    break;
  case "tstats":
    teamStats();
    break;
  case "maketeams":
    buildTeamsFile();
    break;
  default:
    getLeague();
    break;
}
