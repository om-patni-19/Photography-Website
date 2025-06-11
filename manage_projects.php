<?php
header('Content-Type: application/json');

// Function to get all projects from the JSON file
function getProjects() {
    return json_decode(file_get_contents('data/projects.json'), true);
}

// Function to save projects back to the JSON file
function saveProjects($projects) {
    file_put_contents('data/projects.json', json_encode($projects, JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['action'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid request.']);
        exit();
    }

    $action = $input['action'];
    $client = $input['client'] ?? '';
    $projects = getProjects();

    // Only needed for delete/rename
    $projectIndex = array_search($client, array_column($projects, 'client'));

    if (($action === 'delete_project' || $action === 'delete_media') && $projectIndex === false) {
        echo json_encode(['success' => false, 'message' => 'Project not found.']);
        exit();
    }

    // Handle deleting image or video from a project
    if ($action === 'delete_media') {
        $mediaPath = $input['mediaPath'];

        // Determine if it's in 'photos' or 'videos'
        $mediaType = null;
        if (isset($projects[$projectIndex]['photos']) && in_array($mediaPath, $projects[$projectIndex]['photos'])) {
            $mediaType = 'photos';
        } elseif (isset($projects[$projectIndex]['videos']) && in_array($mediaPath, $projects[$projectIndex]['videos'])) {
            $mediaType = 'videos';
        }

        if ($mediaType !== null) {
            // Remove media path from the JSON
            $projects[$projectIndex][$mediaType] = array_values(array_filter(
                $projects[$projectIndex][$mediaType],
                fn($path) => $path !== $mediaPath
            ));

            // Delete file from the filesystem
            if (file_exists($mediaPath)) {
                unlink($mediaPath);
            }

            saveProjects($projects);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Media not found in project.']);
        }

        exit();
    }

    // Handle deleting an entire project
    if ($action === 'delete_project') {
        $project = $projects[$projectIndex];

        // Delete all associated media files (photos and videos)
        foreach (['photos', 'videos'] as $type) {
            if (isset($project[$type])) {
                foreach ($project[$type] as $filePath) {
                    if (file_exists($filePath)) {
                        unlink($filePath);
                    }
                }
            }
        }

        // Remove the client folder if it is empty
        $folder = "images/" . str_replace(' ', '_', strtolower($client)) . "/";
        if (is_dir($folder)) {
            $remainingFiles = array_diff(scandir($folder), ['.', '..']);
            if (empty($remainingFiles)) {
                rmdir($folder);  // Remove the folder if it is empty
            } else {
                // Optionally, delete the folder and its contents if there are remaining files
                deleteFolder($folder);
            }
        }

        // Remove the project from the JSON data
        array_splice($projects, $projectIndex, 1);
        saveProjects($projects);

        echo json_encode(['success' => true]);
        exit();
    }

    // ✅ Handle renaming a project
    if ($action === 'rename_project') {
        $oldName = $input['oldName'] ?? '';
        $newName = $input['newName'] ?? '';

        if (!$oldName || !$newName) {
            echo json_encode(['success' => false, 'message' => 'Old and new names are required.']);
            exit();
        }

        $projectIndex = array_search($oldName, array_column($projects, 'client'));
        if ($projectIndex === false) {
            echo json_encode(['success' => false, 'message' => 'Project not found.']);
            exit();
        }

        // Sanitize folder names
        $oldFolder = "images/" . str_replace(' ', '_', strtolower($oldName));
        $newFolder = "images/" . str_replace(' ', '_', strtolower($newName));

        if (!is_dir($oldFolder)) {
            echo json_encode(['success' => false, 'message' => 'Old project folder does not exist.']);
            exit();
        }
        if (is_dir($newFolder)) {
            echo json_encode(['success' => false, 'message' => 'A project with the new name already exists.']);
            exit();
        }

        // Rename the folder
        rename($oldFolder, $newFolder);

        // Update paths in JSON for photos and videos
        foreach (['photos', 'videos'] as $type) {
            if (!empty($projects[$projectIndex][$type])) {
                $projects[$projectIndex][$type] = array_map(function($path) use ($oldFolder, $newFolder) {
                    return str_replace($oldFolder, $newFolder, $path);
                }, $projects[$projectIndex][$type]);
            }
        }

        // Update project client name in JSON
        $projects[$projectIndex]['client'] = $newName;

        saveProjects($projects);

        // Respond with success
        echo json_encode(['success' => true]);
        exit();
    }

    // Invalid action if none of the above matches
    echo json_encode(['success' => false, 'message' => 'Unknown action.']);
}

// Function to delete a folder and its contents
function deleteFolder($folderPath) {
    // Check if the folder exists and if it's a directory
    if (is_dir($folderPath)) {
        // Get all files and directories inside the folder
        $files = array_diff(scandir($folderPath), ['.', '..']);
        
        foreach ($files as $file) {
            $filePath = $folderPath . DIRECTORY_SEPARATOR . $file;
            if (is_dir($filePath)) {
                // Recursively delete the directory
                deleteFolder($filePath);
            } else {
                // Delete the file
                unlink($filePath);
            }
        }

        // Finally, remove the folder itself
        rmdir($folderPath);
    }
}
?>
