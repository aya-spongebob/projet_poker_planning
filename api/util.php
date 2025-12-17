<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function data_dir(): string {
  $dir = __DIR__ . "/../data";
  if (!is_dir($dir)) mkdir($dir, 0777, true);
  return $dir;
}

function session_id_or_create(): string {
  $sid = $_GET['sid'] ?? $_POST['sid'] ?? null;
  if ($sid && preg_match('/^[a-zA-Z0-9_-]{6,40}$/', $sid)) return $sid;
  return bin2hex(random_bytes(8));
}

function read_json_body(): array {
  $raw = file_get_contents("php://input");
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function write_file_json(string $path, $data): bool {
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  return file_put_contents($path, $json) !== false;
}

function read_file_json(string $path) {
  if (!file_exists($path)) return null;
  $raw = file_get_contents($path);
  return json_decode($raw, true);
}

function respond($ok, $payload = [], $code = 200) {
  http_response_code($code);
  echo json_encode(array_merge(["ok" => $ok], $payload), JSON_UNESCAPED_UNICODE);
  exit;
}
