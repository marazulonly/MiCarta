<?php
// /micarta/api/index.php
require_once 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$path = isset($_GET['path']) ? explode('/', trim($_GET['path'], '/')) : [];

// Simple Router
if ($path[0] === 'menu' && isset($path[1])) {
    $slug = $path[1];
    $cacheFile = __DIR__ . "/cache/menu_{$slug}.json";

    // 1. Check Cache
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) {
        echo file_get_contents($cacheFile);
        exit;
    }

    // 2. Fetch from DB
    $stmt = $pdo->prepare("SELECT * FROM restaurants WHERE slug = ?");
    $stmt->execute([$slug]);
    $restaurant = $stmt->fetch();

    if ($restaurant) {
        $stmtCats = $pdo->prepare("SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order");
        $stmtCats->execute([$restaurant['id']]);
        $categories = $stmtCats->fetchAll();
        
        $stmtItems = $pdo->prepare("SELECT * FROM menu_items WHERE restaurant_id = ?");
        $stmtItems->execute([$restaurant['id']]);
        $items = $stmtItems->fetchAll();

        $data = json_encode(['restaurant' => $restaurant, 'categories' => $categories, 'items' => $items]);
        
        // 3. Save Cache
        if (!is_dir(__DIR__ . '/cache')) mkdir(__DIR__ . '/cache', 0755, true);
        file_put_contents($cacheFile, $data);
        
        echo $data;
    } else {
        header('Content-Type: application/json', true, 404);
        echo json_encode(['error' => 'Restaurant not found']);
    }
} else {
    echo json_encode(['message' => 'API endpoint not supported']);
}
