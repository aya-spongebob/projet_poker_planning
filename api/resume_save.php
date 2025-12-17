<?php
require_once __DIR__ . "/util.php";

$sid = session_id_or_create();
$body = read_json_body();

if (!isset($body["cursor"]) || !isset($body["items"])) respond(false, ["error"=>"resume doit contenir cursor + items"], 400);

$resume = [
  "sid" => $sid,
  "cursor" => (int)$body["cursor"],
  "items" => $body["items"],
  "reason" => $body["reason"] ?? "coffee",
  "savedAt" => date("c")
];

$path = data_dir() . "/resume_$sid.json";
if (!write_file_json($path, $resume)) respond(false, ["error"=>"Impossible d'écrire resume"], 500);

respond(true, ["sid"=>$sid, "resume"=>$resume]);
