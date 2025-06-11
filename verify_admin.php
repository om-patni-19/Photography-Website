<?php
session_start();

$correctPassword = 'your_secure_password';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';

    if ($password === $correctPassword) {
        $_SESSION['is_admin'] = true;
        echo 'success';
    } else {
        echo 'fail';
    }
}
?>
