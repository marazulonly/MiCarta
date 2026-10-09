<?php
// /micarta/api/config.php
$db_host = 'localhost';
$db_name = 'nombre_de_tu_base_de_datos';
$db_user = 'usuario_de_tu_base_de_datos';
$db_pass = 'contraseña_de_tu_base_de_datos';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
    exit;
}
