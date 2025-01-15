<?php
// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Serve HTML content for direct access
if (!isset($_GET['code']) && $_SERVER['REQUEST_METHOD'] === 'GET') {
    include 'index.html';
    exit;
}

// Set JSON headers only for API requests
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection
try {
    $db = new PDO(
        "mysql:host=" . getenv('MYSQL_HOST') . 
        ";dbname=" . getenv('MYSQL_DATABASE'),
        getenv('MYSQL_USER'),
        getenv('MYSQL_PASSWORD')
    );
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if not exists
    $db->exec('CREATE TABLE IF NOT EXISTS urls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        long_url TEXT NOT NULL,
        short_code VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB');
} catch (PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

function generateShortCode($length = 6) {
    $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[rand(0, strlen($chars) - 1)];
    }
    return $code;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $longUrl = $data['url'] ?? '';
    $customName = $data['custom_name'] ?? '';
    
    if (empty($longUrl)) {
        echo json_encode(['error' => 'URL is required']);
        exit;
    }

    // Validate custom name
    if (!empty($customName)) {
        if (!preg_match('/^[a-zA-Z0-9-_]+$/', $customName)) {
            echo json_encode(['error' => 'Custom name can only contain letters, numbers, hyphens and underscores']);
            exit;
        }
        $shortCode = $customName;
    } else {
        $shortCode = generateShortCode();
    }

    try {
        // Check if custom name already exists
        $stmt = $db->prepare('SELECT id FROM urls WHERE short_code = ?');
        $stmt->execute([$shortCode]);
        
        if ($stmt->fetch()) {
            echo json_encode(['error' => 'This custom name is already taken']);
            exit;
        }

        // Insert new URL
        $stmt = $db->prepare('INSERT INTO urls (long_url, short_code) VALUES (?, ?)');
        if ($stmt->execute([$longUrl, $shortCode])) {
            echo json_encode([
                'success' => true,
                'short_url' => $shortCode
            ]);
        } else {
            echo json_encode(['error' => 'Failed to create short URL']);
        }
    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        echo json_encode(['error' => 'Database error occurred']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $code = $_GET['code'] ?? '';
    
    if (empty($code)) {
        echo json_encode(['error' => 'Code is required']);
        exit;
    }

    try {
        $stmt = $db->prepare('SELECT long_url FROM urls WHERE short_code = ?');
        $stmt->execute([$code]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($row) {
            header('Location: ' . $row['long_url']);
        } else {
            echo json_encode(['error' => 'URL not found']);
        }
    } catch (PDOException $e) {
        error_log('Database error: ' . $e->getMessage());
        echo json_encode(['error' => 'Database error occurred']);
    }
}
