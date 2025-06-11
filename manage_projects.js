document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('uploadForm');
    const gallery = document.getElementById('adminGallery');
    const projectSelect = document.getElementById('projectSelect');
    const imagesContainer = document.getElementById('projectImagesContainer');
    const addImagesForm = document.getElementById('addImagesForm');
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');
    const renameContainer = document.getElementById('renameContainer');
    let renameInput = document.getElementById('renameInput');
    let renameButton = document.getElementById('renameButton');

    // === Original UploadForm Submission ===
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(form);
            fetch('upload.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Project uploaded successfully!');
                    form.reset();
                    appendProject(data.project);
                } else {
                    alert('Upload failed!');
                }
            })
            .catch(err => console.error('Upload error:', err));
        });
    }

    function appendProject(project) {
        const container = document.createElement('div');
        container.className = 'project-container';

        const title = document.createElement('h3');
        title.textContent = project.name;
        container.appendChild(title);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Project';
        deleteBtn.addEventListener('click', () => {
            fetch('manage_projects.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectName: project.name, action: 'delete' })
            })
            .then(res => res.json())
            .then(resp => {
                if (resp.success) {
                    container.remove();
                    removeProjectFromGallery(project.name); // Remove from gallery dynamically
                } else {
                    alert('Deletion failed!');
                }
            });
        });

        container.appendChild(deleteBtn);
        gallery.appendChild(container);
    }

    // === New Project Management Logic ===
    if (!projectSelect) {
        console.error("Select element with ID 'projectSelect' not found.");
        return;
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Project';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    projectSelect.appendChild(defaultOption);

    fetch('data/projects.json')
        .then(res => {
            if (!res.ok) throw new Error(`Failed to load JSON: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (!Array.isArray(data)) throw new Error("Invalid JSON format: expected an array.");
            data.sort((a, b) => a.client.toLowerCase().localeCompare(b.client.toLowerCase()));
            data.forEach(project => {
                if (project.client) {
                    const opt = document.createElement('option');
                    opt.value = project.client;
                    opt.textContent = project.client;
                    projectSelect.appendChild(opt);
                }
            });
        })
        .catch(err => {
            console.error("Error fetching or parsing projects.json:", err);
        });

    projectSelect.addEventListener('change', () => {
        const client = projectSelect.value;
        if (!client) {
            imagesContainer.innerHTML = '';
            addImagesForm.style.display = 'none';
            deleteProjectBtn.style.display = 'none';
            renameContainer.style.display = 'none';
            return;
        }

        imagesContainer.innerHTML = '';
        addImagesForm.style.display = 'block';
        deleteProjectBtn.style.display = 'inline-block';
        renameContainer.style.display = 'block';
        renameInput.value = '';
        renameInput.placeholder = `Rename "${client}" to...`;
        addImagesForm.setAttribute('data-client', client);
        deleteProjectBtn.setAttribute('data-client', client);

        // Fetch and display the media for the selected project
        fetch('data/projects.json')
            .then(res => res.json())
            .then(data => {
                const project = data.find(p => p.client === client);
                if (!project) return;

                const mediaItems = [...(project.photos || []), ...(project.videos || [])];
                mediaItems.forEach(item => {
                    const div = document.createElement('div');
                    div.classList.add('photo-wrapper');
                    div.style.marginBottom = '10px';

                    const media = document.createElement(item.endsWith('.mp4') || item.endsWith('.webm') || item.endsWith('.ogg') ? 'video' : 'img');
                    media.src = item;
                    if (media.tagName === 'VIDEO') {
                        media.controls = true;
                    }
                    media.style.maxWidth = '200px';

                    const btn = document.createElement('button');
                    btn.textContent = 'Delete';
                    btn.style.marginLeft = '10px';
                    btn.addEventListener('click', () => {
                        if (confirm("Delete this media?")) {
                            fetch('manage_projects.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'delete_media', client, mediaPath: item })
                            }).then(res => res.json())
                            .then(data => {
                                if (data.success) {
                                    div.remove();
                                    removeMediaFromGallery(client, item); // Remove from gallery dynamically
                                } else {
                                    alert("Failed to delete media.");
                                }
                            });
                        }
                    });

                    div.appendChild(media);
                    div.appendChild(btn);
                    imagesContainer.appendChild(div);
                });
            });
    });

    // === Add Rename Project Input and Button ===
    if (!renameInput) {
        renameInput = document.createElement('input');
        renameInput.id = 'renameInput';
        renameInput.placeholder = 'Enter new project name';
        imagesContainer.parentNode.insertBefore(renameInput, imagesContainer);
    }
    if (!renameButton) {
        renameButton = document.createElement('button');
        renameButton.id = 'renameButton';
        renameButton.textContent = 'Rename Project';
        imagesContainer.parentNode.insertBefore(renameButton, renameInput.nextSibling);
    }

    renameInput.value = '';
    renameInput.style.display = 'inline-block';
    renameButton.style.display = 'inline-block';

    renameButton.onclick = () => {
        const newName = renameInput.value.trim();
        const oldName = projectSelect.value;

        if (!newName || newName === oldName) {
            alert("Enter a different new name.");
            return;
        }

        fetch('manage_projects.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'rename_project', oldName, newName })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Project renamed successfully.");
                updateProjectNames(newName);  // Update names across all areas
            } else {
                alert("Rename failed: " + data.message);
            }
        });
    };

    function updateProjectNames(newName) {
        // Update the project select dropdown
        const option = document.querySelector(`#projectSelect option[value="${projectSelect.value}"]`);
        if (option) {
            option.textContent = newName;
            option.value = newName;
        }

        // Update any references in the admin gallery
        const galleryItems = document.querySelectorAll('.project-container h3');
        galleryItems.forEach(item => {
            if (item.textContent === projectSelect.value) {
                item.textContent = newName;
            }
        });

        // Update any relevant elements in the gallery
        const mediaItems = document.querySelectorAll('.photo-wrapper img, .photo-wrapper video');
        mediaItems.forEach(item => {
            const path = item.src;
            if (path.includes(projectSelect.value)) {
                item.src = path.replace(projectSelect.value, newName);
            }
        });

        // Reset the projectSelect dropdown value
        projectSelect.value = newName;

        // Dispatch a custom event to notify the gallery of the name change
        const event = new CustomEvent('projectRenamed', { detail: { oldName: projectSelect.value, newName } });
        window.dispatchEvent(event);
    }

    // Function to remove project dynamically from the gallery
    function removeProjectFromGallery(projectName) {
        const projectContainer = document.querySelector(`.project-container h3:contains('${projectName}')`).parentNode;
        if (projectContainer) {
            projectContainer.remove();
        }
    }

    // Function to remove media dynamically from the gallery
    function removeMediaFromGallery(client, mediaPath) {
        const mediaItem = document.querySelector(`.photo-wrapper img[src="${mediaPath}"], .photo-wrapper video[src="${mediaPath}"]`);
        if (mediaItem) {
            mediaItem.parentNode.remove();
        }
    }

    addImagesForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = addImagesForm.getAttribute('data-client');
        const formData = new FormData();
        formData.append('client_name', client);
        const files = document.getElementById('newImages').files;
        
        for (let i = 0; i < files.length; i++) {
            formData.append('images[]', files[i]);
        }
    
        fetch('upload.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(response => {
            if (response && response.success) {
                const exists = Array.from(projectSelect.options).some(opt => opt.value === response.client);
                if (!exists) {
                    const newOption = document.createElement('option');
                    newOption.value = response.client;
                    newOption.textContent = response.client;
                    projectSelect.appendChild(newOption);
                }
    
                projectSelect.value = response.client;
                projectSelect.dispatchEvent(new Event('change'));
                alert("Media uploaded successfully.");
                document.getElementById('newImages').value = '';  // Reset the file input
            } else {
                // If there's no 'success' key, we check if there is a message
                alert("Upload failed: " + (response.message || "Unknown error"));
            }
        })
        .catch(error => {
            console.error("Upload error:", error);
            alert("An error occurred during upload.");
        });
    });    

    deleteProjectBtn?.addEventListener('click', () => {
        const client = deleteProjectBtn.getAttribute('data-client');
        if (confirm(`Are you sure you want to delete project "${client}"?`)) {
            fetch('manage_projects.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_project', client })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const option = document.querySelector(`#projectSelect option[value="${client}"]`);
                    if (option) option.remove();
                    projectSelect.value = '';
                    imagesContainer.innerHTML = '';
                    addImagesForm.style.display = 'none';
                    deleteProjectBtn.style.display = 'none';
                    alert("Project deleted successfully.");
                    removeProjectFromGallery(client); // Remove from gallery dynamically
                } else {
                    alert("Failed to delete project.");
                }
            });
        }
    });
});
