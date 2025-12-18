<?php
require_once __DIR__ . "/util.php";

$sid = $_GET["sid"] ?? "";
if (!preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) {
    respond(false, ["error"=>"sid invalide"], 400);
}

$path = data_dir() . "/game_$sid.json";
$state = read_file_json($path);git push origin my-feature

if (!$state) respond(false, ["error"=>"state introuvable"], 404);

// durée de la pause (5 minutes)
$duration = 5;
$end = time() * 1000 + ($duration * 60 * 1000);

// activer la pause café
$state['coffee'] = [
    "active" => true,
    "end" => $end
];

write_file_json($path, $state);

respond(true, ["coffee"=>$state['coffee']]);

