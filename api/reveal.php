<?php
require_once __DIR__ . "/util.php";

$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) respond(false, ["error"=>"sid invalide"], 400);

$path = data_dir() . "/game_$sid.json";
$state = read_file_json($path);
if (!$state) respond(false, ["error"=>"state introuvable"], 404);

$state["revealed"] = true;
$state["updatedAt"] = date("c");
write_file_json($path, $state);

respond(true, ["state"=>$state]);
