<?php
require_once __DIR__ . "/util.php";

$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) respond(false, ["error"=>"sid invalide"], 400);

$backlogPath = data_dir() . "/backlog_$sid.json";
$backlog = read_file_json($backlogPath);
if (!$backlog) respond(false, ["error"=>"backlog introuvable"], 404);

$resume = [
  "sid" => $sid,
  "cursor" => (int)($backlog["cursor"] ?? 0),
  "items" => $backlog["items"] ?? [],
  "reason" => "coffee",
  "savedAt" => date("c")
];

$path = data_dir() . "/resume_$sid.json";
write_file_json($path, $resume);
respond(true, ["resume"=>$resume]);
