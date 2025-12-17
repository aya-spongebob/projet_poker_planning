<?php
require_once __DIR__ . "/util.php";

$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) { http_response_code(400); exit("sid invalide"); }

$backlogPath = data_dir() . "/backlog_$sid.json";
$backlog = read_file_json($backlogPath);
if (!$backlog) { http_response_code(404); exit("backlog introuvable"); }

$out = [];
foreach (($backlog["items"] ?? []) as $it){
  $out[] = [
    "id" => $it["id"] ?? null,
    "title" => $it["title"] ?? "",
    "description" => $it["description"] ?? "",
    "estimation" => $it["estimation"] ?? null,
    "status" => $it["status"] ?? "pending"
  ];
}

header("Content-Type: application/json; charset=UTF-8");
header("Content-Disposition: attachment; filename=\"planningpoker_result_$sid.json\"");
echo json_encode([
  "sid" => $sid,
  "exportedAt" => date("c"),
  "results" => $out
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
