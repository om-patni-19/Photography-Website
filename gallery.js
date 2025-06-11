document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("new") === "1") {
        loadGallery();
    } else {
        fetchGallery();
    }
});

let overlayMediaList = [];
let overlayMediaIndex = 0;
let allMediaLists = []; // <-- Store all mediaLists per project to support rename

window.addEventListener('projectRenamed', function (e) {
    const { oldName, newName } = e.detail;

    // Update the project name in the gallery
    const projectElements = document.querySelectorAll('.project-container h2, .project h2');
    projectElements.forEach(element => {
        if (element.textContent === oldName) {
            element.textContent = newName;
        }
    });

    // Update visible media src paths
    const mediaItems = document.querySelectorAll('.image-cluster img, .image-cluster video');
    mediaItems.forEach(item => {
        if (item.src.includes(oldName)) {
            item.src = item.src.replace(oldName, newName);
        }
    });

    // Update mediaList paths in memory
    allMediaLists.forEach(mediaList => {
        mediaList.forEach(media => {
            media.src = media.src.replace(oldName, newName);
        });
    });
});

function loadGallery() {
    const timestamp = new Date().getTime();
    fetch(`data/projects.json?t=${timestamp}`)
        .then(response => response.json())
        .then(projects => {
            displayProjects(projects);
        })
        .catch(error => {
            console.error("Error loading projects:", error);
        });
}

function fetchGallery() {
    fetch("data/projects.json")
        .then(response => response.json())
        .then(projects => {
            displayProjects(projects);
        })
        .catch(error => {
            console.error("Error fetching gallery:", error);
            const container = document.getElementById("projects-container");
            container.innerHTML = "<p>Error loading projects. Please try again later.</p>";
        });
}

function displayProjects(projects) {
    const container = document.getElementById("projects-container");
    container.innerHTML = "";
    allMediaLists = [];

    if (!projects || projects.length === 0) {
        container.innerHTML = "<p>No projects yet. Check back soon!</p>";
        return;
    }

    projects.reverse().forEach((project, projIndex) => {
        const validImages = (project.photos || [])
            .filter(photo => ["jpg", "jpeg", "png", "gif", "webp"].includes(photo.split('.').pop().toLowerCase()))
            .sort((a, b) => {
                const getNumber = filename => {
                    const match = filename.match(/-(\d+)\./);
                    return match ? parseInt(match[1], 10) : 0;
                };
                return getNumber(a) - getNumber(b);
            });

        const validVideos = (project.videos || [])
            .filter(video => ["mp4", "webm", "ogg"].includes(video.split('.').pop().toLowerCase()));

        if (validImages.length === 0 && validVideos.length === 0) return;

        const projectDiv = document.createElement("div");
        projectDiv.classList.add("project");

        const title = document.createElement("h2");
        title.textContent = project.client;
        projectDiv.appendChild(title);

        const wrapper = document.createElement("div");
        wrapper.classList.add("scroll-wrapper");

        const leftBtn = document.createElement("button");
        leftBtn.classList.add("scroll-btn", "left");
        leftBtn.textContent = "‹";

        const rightBtn = document.createElement("button");
        rightBtn.classList.add("scroll-btn", "right");
        rightBtn.textContent = "›";

        const mediaContainer = document.createElement("div");
        mediaContainer.classList.add("image-cluster");

        const mediaList = [];

        validImages.forEach(photo => mediaList.push({ src: photo, type: 'image' }));
        validVideos.forEach(video => mediaList.push({ src: video, type: 'video' }));

        allMediaLists.push(mediaList); // <-- Save for rename update

        mediaList.forEach((media, index) => {
            if (media.type === 'image') {
                const img = document.createElement("img");
                img.src = media.src;
                img.alt = project.client;
                img.loading = "lazy";
                img.addEventListener("click", () => {
                    overlayMediaList = mediaList;
                    overlayMediaIndex = index;
                    showOverlay(mediaList[index]);
                });
                mediaContainer.appendChild(img);
            } else if (media.type === 'video') {
                const videoElem = document.createElement("video");
                videoElem.src = media.src;
                videoElem.style.maxWidth = "200px";
                videoElem.controls = false;
                videoElem.setAttribute("preload", "metadata");

                const overlayButton = document.createElement("div");
                overlayButton.classList.add("video-play-overlay");
                overlayButton.innerHTML = "▶";
                overlayButton.style.position = "absolute";
                overlayButton.style.top = "50%";
                overlayButton.style.left = "50%";
                overlayButton.style.transform = "translate(-50%, -50%)";
                overlayButton.style.fontSize = "3rem";
                overlayButton.style.color = "white";
                overlayButton.style.pointerEvents = "none";

                const wrapperDiv = document.createElement("div");
                wrapperDiv.style.position = "relative";
                wrapperDiv.style.display = "inline-block";
                wrapperDiv.appendChild(videoElem);
                wrapperDiv.appendChild(overlayButton);

                wrapperDiv.addEventListener("click", () => {
                    overlayMediaList = mediaList;
                    overlayMediaIndex = index;
                    showOverlay(mediaList[index]);
                });

                mediaContainer.appendChild(wrapperDiv);
            }
        });

        leftBtn.addEventListener("click", () => {
            mediaContainer.scrollBy({ left: -300, behavior: "smooth" });
        });

        rightBtn.addEventListener("click", () => {
            mediaContainer.scrollBy({ left: 300, behavior: "smooth" });
        });

        wrapper.appendChild(leftBtn);
        wrapper.appendChild(mediaContainer);
        wrapper.appendChild(rightBtn);

        projectDiv.appendChild(wrapper);
        container.appendChild(projectDiv);
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("new") === "1") {
        setTimeout(() => {
            const firstProject = document.querySelector(".project");
            if (firstProject) {
                firstProject.scrollIntoView({ behavior: "smooth" });
            }
        }, 500);
    }
}

// Overlay setup
const overlay = document.createElement("div");
overlay.id = "media-overlay";
overlay.style.display = "none";
overlay.style.position = "fixed";
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100vw";
overlay.style.height = "100vh";
overlay.style.backgroundColor = "rgba(0,0,0,0.8)";
overlay.style.zIndex = "9999";
overlay.style.justifyContent = "center";
overlay.style.alignItems = "center";
overlay.style.flexDirection = "column";
overlay.style.display = "none";

overlay.innerHTML = `
    <span id="overlay-close" style="position:absolute;top:10px;right:20px;font-size:2rem;cursor:pointer;color:white;">&times;</span>
    <div id="overlay-content" style="max-width:90%;max-height:90%;"></div>
`;
document.body.appendChild(overlay);

document.getElementById("overlay-close").addEventListener("click", () => {
    closeOverlay();
});

function showOverlay(media) {
    const content = document.getElementById("overlay-content");
    content.innerHTML = "";

    if (media.type === 'image') {
        const img = document.createElement("img");
        img.src = media.src;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "90vh";
        content.appendChild(img);
    } else if (media.type === 'video') {
        const video = document.createElement("video");
        video.src = media.src;
        video.controls = true;
        video.autoplay = true;
        video.setAttribute("playsinline", "");
        video.style.maxWidth = "100%";
        video.style.maxHeight = "90vh";
        content.appendChild(video);
    }

    overlay.style.display = "flex";
}

function closeOverlay() {
    const content = document.getElementById("overlay-content");

    const overlayVideo = content.querySelector("video");
    if (overlayVideo) {
        overlayVideo.pause();
        overlayVideo.currentTime = 0;
    }

    const src = overlayVideo ? overlayVideo.src : null;
    if (src) {
        const previewVideos = document.querySelectorAll(".image-cluster video");
        previewVideos.forEach(video => {
            if (video.src === src) {
                video.pause();
                video.currentTime = 0;
            }
        });
    }

    content.innerHTML = "";
    overlay.style.display = "none";
}

document.addEventListener("keydown", (e) => {
    if (overlay.style.display === "flex") {
        if (e.key === "Escape") {
            closeOverlay();
        } else if (e.key === "ArrowRight") {
            if (overlayMediaIndex < overlayMediaList.length - 1) {
                overlayMediaIndex++;
                showOverlay(overlayMediaList[overlayMediaIndex]);
            }
        } else if (e.key === "ArrowLeft") {
            if (overlayMediaIndex > 0) {
                overlayMediaIndex--;
                showOverlay(overlayMediaList[overlayMediaIndex]);
            }
        }
    }
});
