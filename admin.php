<?php
$correctPassword = 'abcd'; // Replace with your actual password

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    $password = $_POST['password'];

    if ($password === $correctPassword) {
        // Show the admin page
        showAdminForm();
    } else {
        // Wrong password, redirect or show error
        header('Location: index.html');
        exit();
    }
} else {
    // Show password form
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Admin Login</title>
        <link rel="stylesheet" href="styles.css">
    </head>
    <body>
    <header>
        <div class="logo">
            <img src="logo.jpg" alt="Pratik Gangwal Photography">
        </div>
        <nav>
            <ul>
                <li><a href="index.html">Home</a></li>
                <li><a href="gallery.html">Gallery</a></li>
                <li><a href="about.html">About</a></li>
                <li><a href="reviews.html">Reviews</a></li>
                <li><a href="admin.php">Admin</a></li>
            </ul>
        </nav>
    </header>
        <section class="form-container">
            <h2 style="color: #222">Admin Access</h2>
            <form action="admin.php" method="POST">
                <input type="password" name="password" placeholder="Enter Password" required>
                <button type="submit">Login</button>
            </form>
        </section>
    </body>
    </html>
    <?php
    exit();
}

// Function to show the authenticated admin page
function showAdminForm() {
    ?>
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Admin - Upload Work</title>
            <link rel="stylesheet" href="styles.css">
        </head>
        <body>
            <header>
                <nav>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="gallery.html">Gallery</a></li>
                        <li><a href="about.html">About</a></li>
                        <li><a href="reviews.html">Reviews</a></li>
                        <li><a href="admin.php">Admin</a></li>
                    </ul>
                </nav>
            </header>

            <div class = "page-wrapper">
                <section class="admin">
                    <div class="form-container">
                        <h2 style="color: #222">Upload New Work</h2>
                        <form action="upload.php" method="POST" enctype="multipart/form-data" autocomplete="off">
                            <input type="text" name="client_name" placeholder="Project Title" required>
                            <input type="file" name="images[]" multiple required>
                            <button type="submit">Upload</button>
                        </form>
                    </div>
                    <div class="form-container">
                        <h2 style="color: #222">Manage Existing Work</h2>
                        <form id="selectProjectForm">
                            <label for="projectSelect">Select Project:</label>
                            <select id="projectSelect" name="projectSelect" required></select>
                        </form>
                        <div id="renameContainer" style="display: none;">
                            <input type="text" id="renameInput" placeholder="Enter new project name">
                            <button id="renameButton">Rename Project</button>
                        </div>
                        <div id="projectImagesContainer"></div>
                        <form id="addImagesForm" enctype="multipart/form-data" style="display: none;">
                            <input type="file" name="newImages[]" id="newImages" multiple required>
                            <button type="submit">Add Images</button>
                        </form>
                        <button id="deleteProjectBtn" style="display: none;">Delete Entire Project</button>
                    </div>
                </section>
            </div>
            <script src="manage_projects.js"></script>

        </body>
    </html>
    <?php
}
?>
