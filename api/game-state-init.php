<?php
require_once __DIR__ . "/util.php";

$sid = session_id_or_create();

$path = data_dir() . "/game_$sid.json";
if (file_exists($path)) {
  respond(true, ["state" => read_file_json($path)]);
}

$state = [
  "sid" => $sid,
  "cursor" => 0,
  "round" => 1,
  "revealed" => false,
  "votes" => [],          // playerId => value
  "updatedAt" => date("c")
];

write_file_json($path, $state);
respond(true, ["state" => $state]);
