<?php
require_once __DIR__ . "/util.php";

$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) respond(false, ["error"=>"sid invalide"], 400);

$path = data_dir() . "/players_$sid.json";
$data = read_file_json($path);
if (!$data) respond(false, ["error"=>"players introuvables"], 404);

respond(true, $data);
