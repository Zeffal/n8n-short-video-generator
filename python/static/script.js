let lastVideoUrl = null;

function updateVideoSection(videoUrl, title = '', description = '') {
    const videoSection = document.getElementById("videoSection");
    const videoPlayer = document.getElementById("videoPlayer");
    const downloadBtn = document.getElementById("downloadBtn");
    const videoTitle = document.getElementById("videoTitle");
    const videoDescription = document.getElementById("videoDescription");
    let loaderContainer = document.getElementById("videoLoaderContainer");
    let loading = document.getElementById("videoLoading");
    let loadingMsg = document.getElementById("videoLoadingMsg");

    if (!videoSection) return;
    videoSection.style.display = "block";

    if (!loaderContainer) {
        loaderContainer = document.createElement("div");
        loaderContainer.id = "videoLoaderContainer";
        loaderContainer.className = "loader-container";
        loading = document.createElement("div");
        loading.id = "videoLoading";
        loading.className = "loader";
        loadingMsg = document.createElement("div");
        loadingMsg.id = "videoLoadingMsg";
        loadingMsg.className = "loader-message";
        loadingMsg.innerText = "Please wait for a moment...";
        loaderContainer.appendChild(loading);
        loaderContainer.appendChild(loadingMsg);
        videoSection.insertBefore(loaderContainer, videoPlayer);
    }

    if (videoUrl) {
        videoPlayer.src = videoUrl;
        videoPlayer.style.display = "block";
        downloadBtn.href = videoUrl;
        downloadBtn.download = "completed_video.mp4";
        downloadBtn.style.display = "inline-block";
        loaderContainer.style.display = "none";
        if (videoTitle) videoTitle.textContent = title || '';
        if (videoDescription) videoDescription.textContent = description || '';
    } else {
        loaderContainer.style.display = "flex";
        if (loadingMsg) loadingMsg.innerText = "Please wait for a moment...";
        videoPlayer.style.display = "none";
        downloadBtn.style.display = "none";
        if (videoTitle) videoTitle.textContent = '';
        if (videoDescription) videoDescription.textContent = '';
    }
}


async function pollLatestVideo() {
    try {
        const resp = await fetch("/get_video");
        if (resp.ok) {
            const data = await resp.json();
            const videoUrl = data.video_url;
            const title = data.title || '';
            const description = data.description || '';
            if (videoUrl && videoUrl !== lastVideoUrl) {
                lastVideoUrl = videoUrl;
                updateVideoSection(videoUrl, title, description);
                return true; // Stop polling
            } else if (videoUrl) {
                updateVideoSection(videoUrl, title, description);
            }
        } else {
            updateVideoSection(null);
        }
    } catch {
        updateVideoSection(null);
    }
    return false;
}


// Form submission

document.getElementById("mainForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        mainTopic: e.target.mainTopic.value,
        duration: e.target.duration.value,
        videoType: e.target.videoType.value,
        ttsVoice: e.target.ttsVoice.value,
    };

    const response = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
    });

    const result = await response.json();
    const resultMsg = document.getElementById("result");
    resultMsg.innerText = "";

    // Start polling for the latest video after submission
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(async () => {
        const found = await pollLatestVideo();
        if (found) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
    }, 5000);
});

// Only poll after form submission
let pollIntervalId = null;

window.addEventListener("DOMContentLoaded", async () => {
    // Do an immediate fetch first
    const found = await pollLatestVideo();
    if (!found) {
        // Only start polling if video is not yet available
        if (pollIntervalId) clearInterval(pollIntervalId);
        pollIntervalId = setInterval(async () => {
            const found = await pollLatestVideo();
            if (found) {
                clearInterval(pollIntervalId);
                pollIntervalId = null;
            }
        }, 5000);
    }
});