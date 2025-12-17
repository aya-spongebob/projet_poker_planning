<?php
require_once __DIR__ . "/util.php";

/** -------- Helpers -------- */
function rule_name($r){
  return [
    "average"=>"Moyenne",
    "median"=>"Médiane",
    "absolute_majority"=>"Majorité absolue",
    "relative_majority"=>"Majorité relative"
  ][$r] ?? $r;
}

function nearest_card($x){
  $nums = [0,1,2,3,5,8,13,20,40,100];
  $best = $nums[0]; $bestD = abs($nums[0]-$x);
  foreach ($nums as $n){
    $d = abs($n-$x);
    if ($d < $bestD){ $bestD = $d; $best = $n; }
  }
  return (string)$best;
}

function is_unanimous($vals){
  if (count($vals) === 0) return false;
  $v0 = $vals[0];
  foreach ($vals as $v){
    if ((string)$v !== (string)$v0) return false;
  }
  return true;
}

/**
 * Extrait un identifiant joueur cohérent selon ton JSON players:
 * - string => id = string
 * - array => id = id si existe sinon name
 */
function player_id_from_any($pl){
  if (is_string($pl)) return $pl;
  if (is_array($pl)){
    if (isset($pl["id"]) && $pl["id"] !== "") return (string)$pl["id"];
    if (isset($pl["name"]) && $pl["name"] !== "") return (string)$pl["name"];
  }
  return "";
}

function secondary_compute($vals, $rule){
  // all coffee?
  $allCoffee = true;
  foreach ($vals as $v){ if ($v !== "☕") { $allCoffee = false; break; } }
  if ($allCoffee) return ["ok"=>false, "reason"=>"coffee_all"];

  $nums = [];
  foreach ($vals as $v){ if ($v !== "☕") $nums[] = (float)$v; }
  if (count($nums) === 0) return ["ok"=>false, "reason"=>"no_numeric"];

  if ($rule === "median"){
    sort($nums);
    $n = count($nums);
    $mid = intdiv($n, 2);
    $med = ($n % 2) ? $nums[$mid] : (($nums[$mid-1] + $nums[$mid]) / 2);
    return ["ok"=>true, "estimate"=>nearest_card($med)];
  }

  if ($rule === "average"){
    $sum = 0;
    foreach ($nums as $x){ $sum += $x; }
    $avg = $sum / count($nums);
    return ["ok"=>true, "estimate"=>nearest_card($avg)];
  }

  if ($rule === "absolute_majority"){
    $counts = [];
    foreach ($vals as $v){ $counts[$v] = ($counts[$v] ?? 0) + 1; }
    $n = count($vals);
    foreach ($counts as $val=>$c){
      if ($c > ($n/2)) return ["ok"=>true, "estimate"=>$val];
    }
    return ["ok"=>false, "reason"=>"no_abs_majority"];
  }

  if ($rule === "relative_majority"){
    $counts = [];
    foreach ($vals as $v){ $counts[$v] = ($counts[$v] ?? 0) + 1; }
    $bestVal = null; $bestC = 0; $ties = 0;
    foreach ($counts as $val=>$c){
      if ($c > $bestC){ $bestC = $c; $bestVal = $val; $ties = 0; }
      else if ($c === $bestC){ $ties++; }
    }
    if ($ties > 0) return ["ok"=>false, "reason"=>"tie"];
    return ["ok"=>true, "estimate"=>$bestVal];
  }

  return ["ok"=>false, "reason"=>"bad_rule"];
}

/** -------- Main -------- */
$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) respond(false, ["error"=>"sid invalide"], 400);

$cfgPath = data_dir() . "/config_$sid.json";
$cfg = read_file_json($cfgPath);
if (!$cfg) respond(false, ["error"=>"config introuvable"], 404);

$playersPath = data_dir() . "/players_$sid.json";
$p = read_file_json($playersPath);
if (!$p) respond(false, ["error"=>"players introuvables"], 404);

/**
 * ⚠️ IMPORTANT : selon ton players-save.php, ça peut être:
 * - ["a","b"]
 * - {"players":["a","b"]}
 * - {"players":[{"name":"a"},...]}
 */
$players = $p["players"] ?? $p;  // si $p est déjà un tableau direct
if (!is_array($players)) $players = [];

$backlogPath = data_dir() . "/backlog_$sid.json";
$backlog = read_file_json($backlogPath);
if (!$backlog) respond(false, ["error"=>"backlog introuvable"], 404);

$statePath = data_dir() . "/game_$sid.json";
$state = read_file_json($statePath);
if (!$state) respond(false, ["error"=>"state introuvable"], 404);

$cursor = (int)($state["cursor"] ?? 0);
$items = $backlog["items"] ?? [];

if ($cursor >= count($items)) {
  respond(true, ["message"=>"Backlog terminé", "state"=>$state]);
}

$votesMap = $state["votes"] ?? [];

/** ✅ Construire la liste des IDs joueurs attendus */
$playerIds = [];
foreach ($players as $pl){
  $pid = player_id_from_any($pl);
  if ($pid !== "") $playerIds[] = $pid;
}
$playerIds = array_values(array_unique($playerIds));

/** Si on n’a pas réussi à extraire les IDs depuis players.json,
 *  on fallback sur les clés de votes (a,b,...) */
if (count($playerIds) === 0) {
  $playerIds = array_keys($votesMap);
}

/** Vérifier que tout le monde a voté */
$vals = [];
foreach ($playerIds as $pid){
  if (!isset($votesMap[(string)$pid])) {
    respond(false, ["error"=>"Tous les joueurs n'ont pas voté (manque: $pid)."], 400);
  }
  $vals[] = (string)$votesMap[(string)$pid];
}

/** Round 1 : unanimité */
if ((int)($state["round"] ?? 1) === 1) {
  if (!is_unanimous($vals)) {
    $state["round"] = 2;
    $state["revealed"] = false;
    $state["votes"] = [];
    $state["updatedAt"] = date("c");
    write_file_json($statePath, $state);

    respond(true, ["message"=>"Pas d'unanimité. Passage au round 2 (règle secondaire).", "state"=>$state]);
  }
  $estimate = $vals[0];

} else {
  $res = secondary_compute($vals, $cfg["secondaryRule"]);
  if (!$res["ok"]) {
    $state["round"] = (int)$state["round"] + 1;
    $state["revealed"] = false;
    $state["votes"] = [];
    $state["updatedAt"] = date("c");
    write_file_json($statePath, $state);

    respond(true, ["message"=>"Pas de validation (" . rule_name($cfg["secondaryRule"]) . "). Nouveau round.", "state"=>$state]);
  }
  $estimate = $res["estimate"];
}

/** ✅ Valider la tâche */
$items[$cursor]["status"] = "done";
$items[$cursor]["estimation"] = $estimate;
$items[$cursor]["updatedAt"] = date("c");

$backlog["items"] = $items;
$backlog["cursor"] = $cursor + 1;
$backlog["updatedAt"] = date("c");
write_file_json($backlogPath, $backlog);

/** Reset state pour tâche suivante */
$state["cursor"] = $cursor + 1;
$state["round"] = 1;
$state["revealed"] = false;
$state["votes"] = [];
$state["updatedAt"] = date("c");
write_file_json($statePath, $state);

respond(true, ["message"=>"Tâche validée : $estimate. Passage à la suivante.", "state"=>$state]);
