<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['name']) || empty($data['rating']) || empty($data['feedback'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input.']);
    exit;
}

$reviewsFile = 'data/reviews.json';
$reviews = [];

if (file_exists($reviewsFile)) {
    $reviews = json_decode(file_get_contents($reviewsFile), true);
}

$reviews[] = [
    'name' => htmlspecialchars($data['name']),
    'rating' => intval($data['rating']),
    'feedback' => htmlspecialchars($data['feedback'])
];

file_put_contents($reviewsFile, json_encode($reviews, JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
?>
