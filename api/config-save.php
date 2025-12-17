<?php
require_once __DIR__ . "/util.php";

$sid = session_id_or_create();
$body = read_json_body();

$playMode = $body["playMode"] ?? "";
$playersCount = $body["playersCount"] ?? null;
$projectName = trim((string)($body["projectName"] ?? ""));
$secondaryRule = $body["secondaryRule"] ?? "median";

$validModes = ["local", "remote"];
$validRules = ["average","median","absolute_majority","relative_majority"];

if (!in_array($playMode, $validModes, true)) respond(false, ["error"=>"playMode invalide"], 400);
if (!is_numeric($playersCount)) respond(false, ["error"=>"playersCount invalide"], 400);

$playersCount = (int)$playersCount;
if ($playersCount < 2 || $playersCount > 20) respond(false, ["error"=>"playersCount doit être entre 2 et 20"], 400);
if (!in_array($secondaryRule, $validRules, true)) respond(false, ["error"=>"secondaryRule invalide"], 400);

$cfg = [
  "sid" => $sid,
  "playMode" => $playMode,
  "playersCount" => $playersCount,
  "projectName" => $projectName,
  "secondaryRule" => $secondaryRule,
  "moderatorName" => trim((string)($body["moderatorName"] ?? "")),
  "revealMode" => (($body["revealMode"] ?? "manual") === "auto") ? "auto" : "manual",
  "updatedAt" => date("c")
];

$path = data_dir() . "/config_$sid.json";
if (!write_file_json($path, $cfg)) respond(false, ["error"=>"Impossible d'écrire config"], 500);

respond(true, ["sid"=>$sid, "config"=>$cfg]);
