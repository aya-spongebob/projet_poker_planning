<?php
require_once __DIR__ . "/util.php";

$sid = session_id_or_create();
$body = read_json_body();
$players = $body["players"] ?? null;

if (!is_array($players) || count($players) < 2) respond(false, ["error"=>"players doit être un tableau (>=2)"], 400);

$names = [];
$out = [];
$i = 1;

foreach ($players as $p) {
  $name = trim((string)($p["name"] ?? $p));
  if ($name === "") respond(false, ["error"=>"pseudo vide"], 400);

  $key = mb_strtolower($name);
  if (in_array($key, $names, true)) respond(false, ["error"=>"pseudos dupliqués"], 400);
  $names[] = $key;

  $out[] = ["id"=>$i++, "name"=>$name];
}

$path = data_dir() . "/players_$sid.json";
if (!write_file_json($path, ["sid"=>$sid, "players"=>$out, "updatedAt"=>date("c")])) {
  respond(false, ["error"=>"Impossible d'écrire players"], 500);
}

respond(true, ["sid"=>$sid, "players"=>$out]);
