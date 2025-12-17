<?php
require_once __DIR__ . "/util.php";

$sid = session_id_or_create();
$body = read_json_body();
$items = $body["items"] ?? null;

if (!is_array($items) || count($items) === 0) respond(false, ["error"=>"items backlog manquant"], 400);

$norm = [];
$idx = 1;
foreach ($items as $it) {
  $title = trim((string)($it["title"] ?? ""));
  $desc  = trim((string)($it["description"] ?? ""));
  if ($title === "") $title = "Tâche " . $idx;

  $norm[] = [
    "id" => $it["id"] ?? $idx,
    "title" => $title,
    "description" => $desc,
    "status" => $it["status"] ?? "pending",
    "estimation" => $it["estimation"] ?? null,
    "rounds" => $it["rounds"] ?? []
  ];
  $idx++;
}

$state = [
  "sid" => $sid,
  "cursor" => (int)($body["cursor"] ?? 0),
  "items" => $norm,
  "updatedAt" => date("c")
];

$path = data_dir() . "/backlog_$sid.json";
if (!write_file_json($path, $state)) respond(false, ["error"=>"Impossible d'écrire backlog"], 500);

respond(true, ["sid"=>$sid, "backlog"=>$state]);
