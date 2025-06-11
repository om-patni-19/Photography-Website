<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // Allow large file uploads (server must support it too)
    ini_set('upload_max_filesize', '10G');
    ini_set('post_max_size', '10G');
    ini_set('max_execution_time', 0);
    ini_set('max_input_time', 0);

    $clientName = $_POST["client_name"];
    $clientKey = str_replace(' ', '_', strtolower($clientName));
    $uploadDir = "images/" . $clientKey . "/";

    // Create the directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $videoExtensions = ['mp4', 'webm', 'ogg'];

    $images = [];
    $videos = [];

    // Loop through each uploaded file
    foreach ($_FILES["images"]["tmp_name"] as $key => $tmpName) {
        $fileName = basename($_FILES["images"]["name"][$key]);

        // Make filenames safe and unique
        $safeName = uniqid() . "_" . preg_replace("/[^a-zA-Z0-9.\-_]/", "_", $fileName);
        $relativePath = "images/" . $clientKey . "/" . $safeName;  // ✅ correct path for JSON
        $filePath = $uploadDir . $safeName;

        if (move_uploaded_file($tmpName, $filePath)) {
            $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
            if (in_array($ext, $imageExtensions)) {
                $images[] = $relativePath;
            } elseif (in_array($ext, $videoExtensions)) {
                $videos[] = $relativePath;
            }
        }
    }

    if (!empty($images) || !empty($videos)) {
        $jsonFile = "data/projects.json";

        if (file_exists($jsonFile)) {
            $data = json_decode(file_get_contents($jsonFile), true);
        } else {
            $data = [];
        }

        // Check if project already exists
        $found = false;
        foreach ($data as &$project) {
            if ($project["client"] === $clientName) {
                if (!isset($project["photos"])) $project["photos"] = [];
                if (!isset($project["videos"])) $project["videos"] = [];
                $project["photos"] = array_merge($project["photos"], $images);
                $project["videos"] = array_merge($project["videos"], $videos);
                $found = true;
                break;
            }
        }

        // If not found, create a new project
        if (!$found) {
            $data[] = [
                "client" => $clientName,
                "photos" => $images,
                "videos" => $videos
            ];
        }

        file_put_contents($jsonFile, json_encode($data, JSON_PRETTY_PRINT));

        // Return success response
        echo json_encode(['success' => true, 'client' => $clientName]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No files were uploaded']);
    }
}
?>
