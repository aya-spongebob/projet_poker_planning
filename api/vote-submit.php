<?php
require_once __DIR__ . "/util.php";

$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) respond(false, ["error"=>"sid invalide"], 400);

$body = read_json_body();
$playerId = (string)($body["playerId"] ?? "");
$value = (string)($body["value"] ?? "");

if ($playerId === "" || $value === "") respond(false, ["error"=>"playerId/value manquants"], 400);

$allowed = ["0","1","2","3","5","8","13","20","40","100","☕"];
if (!in_array($value, $allowed, true)) respond(false, ["error"=>"valeur non autorisée"], 400);

$path = data_dir() . "/game_$sid.json";
$state = read_file_json($path);
if (!$state) respond(false, ["error"=>"state introuvable"], 404);

$state["votes"][(string)$playerId] = $value;
$state["updatedAt"] = date("c");

write_file_json($path, $state);
respond(true, ["state"=>$state]);
